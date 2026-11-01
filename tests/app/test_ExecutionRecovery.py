"""Owned non-network processes, real SQLite rollback and no-replay restart paths."""

from contextlib import ExitStack
import json
import os
from pathlib import Path
import shlex
import signal
import subprocess
import sys
import tempfile
import threading
import time
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.api import create_app
from app.contracts.actions.process import CommandRequest
from app.processes.models import ExecutionPorts
from app.processes.runner import ProcessRunner
from app.services.execution_journal import ExecutionJournal
from app.services.processes import ProcessRegistry
from app.services.project_background import ProjectBackground, atomic_json
from app.services.runtime_lifecycle import shutdown
from app.services.storage_admission import process_stamp
from app.scanning.recovery import recover, reconcile_orphans
from app.scanning.source import scanner_source
from app.web.jobs import WebJobManager
from app.web.runtime_process_control import signal_process_tree
from tests.app import test_DeepScans as fixtures

ROOT = Path(__file__).resolve().parents[2]


class OfflineRecoveryTest(TestCase):
    setUp = fixtures.DeepScansTest.setUp
    tearDown = fixtures.DeepScansTest.tearDown
    executor = fixtures.DeepScansTest.executor
    wait = fixtures.DeepScansTest.wait

    def test_journal_publication_failure_after_run_write_settles_as_aborted_without_false_persistence_error(self):
        journal = self.runtime.execution_journal
        original = journal.update

        def fail(identifier, **fields):
            if fields.get("run_published"):
                raise OSError("journal publication failed before launch")
            return original(identifier, **fields)

        with (
            patch.object(journal, "update", side_effect=fail),
            patch("app.scanning.execution.execute_command") as launch,
        ):
            run, job = self.wait(self.service.start(self.request))
            launch.assert_not_called()
        self.assertEqual("failed", job["status"])
        self.assertNotIn("persistence_error", job["result"])
        self.assertTrue(job["result"]["preparation_aborted"])
        self.assertEqual("complete", run["settlement"])
        self.assertIn("journal publication failed", run["reason"])
        self.assertFalse(list(journal.root.glob("*.json")))
        self.hub.operations.save_as(self.project["id"], "Aborted safely before launch")

    def test_stop_without_owned_handle_never_signals_saved_PID_or_claims_success(self):
        from db.entities.process import process

        child = subprocess.Popen([sys.executable, "-c", "import time;time.sleep(30)"], start_new_session=True)
        self.addCleanup(lambda: child.wait(timeout=3))
        self.addCleanup(child.kill)
        session = self.logic.activeProject.database.session()
        row = process(pid=str(child.pid), status="Running")
        session.add(row)
        session.commit()
        identifier = row.id
        session.close()
        with TestClient(create_app(self.runtime)) as client:
            before = self.logic.activeProject.repositoryContainer.processRepository.getStatusByProcessId(
                str(identifier)
            )
            response = client.post(f"/api/processes/{identifier}/kill", json={})
            self.assertEqual(409, response.status_code, response.text)
        self.assertIn("saved PID", response.json()["error"])
        self.assertIsNone(child.poll())
        self.assertEqual(
            before,
            self.logic.activeProject.repositoryContainer.processRepository.getStatusByProcessId(str(identifier)),
        )

    def test_stop_preserves_the_outcome_of_an_already_exited_owned_handle(self):
        from db.entities.process import process

        child = subprocess.Popen([sys.executable, "-c", "pass"], start_new_session=True)
        child.wait(timeout=3)
        session = self.logic.activeProject.database.session()
        row = process(pid=str(child.pid), status="Finished")
        session.add(row)
        session.commit()
        identifier = row.id
        session.close()
        self.runtime.process_registry.active[identifier] = child
        self.addCleanup(lambda: self.runtime.process_registry.active.pop(identifier, None))
        result = self.runtime.kill_process(identifier)
        self.assertFalse(result["killed"])
        self.assertEqual(
            "Finished",
            self.logic.activeProject.repositoryContainer.processRepository.getStatusByProcessId(str(identifier)),
        )

    def test_journal_prepare_and_run_publication_failures_release_or_recover_safe_authority(self):
        def fail(path, value):
            if path.name == "run.json" and value.get("execution_id"):
                raise OSError("fault before first run publication")
            return atomic_json(path, value)

        with (
            patch("app.scanning.execution.atomic_json", side_effect=fail),
            patch("app.scanning.execution.execute_command") as launch,
        ):
            run, job = self.wait(self.service.start(self.request))
            self.assertEqual("failed", job["status"])
            launch.assert_not_called()
        self.assertFalse(list(self.runtime.execution_journal.root.glob("*.json")))
        self.hub.operations.save_as(self.project["id"], "Safe unpublished copy")

    def test_crash_after_protected_prepare_before_run_publication_is_reconciled(self):
        import uuid

        identifier = uuid.uuid4().hex
        parent = self.service.folder() / identifier
        parent.mkdir(parents=True)
        record = {
            "id": identifier,
            "project_id": self.project["id"],
            "host_id": self.host_id,
            "target_ip": self.request.target_ip,
            "status": "queued",
            "job_id": 0,
            "directory": str(parent.relative_to(self.project["folder"])),
            "source_identity": scanner_source()[1],
            "created_at": "2026-11-01T00:00:00Z",
            "profile_path": "",
            "summary": {},
        }
        atomic_json(parent / "run.json", record)
        journal = self.runtime.execution_journal
        entry = journal.create(
            self.project["path"],
            project_id=self.project["id"],
            run_id=identifier,
            directory=record["directory"],
            source_identity=record["source_identity"],
            host_id=self.host_id,
            target_ip=self.request.target_ip,
        )
        journal.update(entry.id, owner_stamp="previous-boot:1")
        with patch("app.scanning.execution.execute_command") as launch:
            result = reconcile_orphans(self.runtime, self.hub)
            launch.assert_not_called()
        self.assertEqual([entry.id], result["recovered"], result)
        self.assertEqual("interrupted", json.loads((parent / "run.json").read_text())["status"])
        self.hub.operations.save_as(self.project["id"], "Safe prepared copy")

    def test_Waiting_row_is_linked_atomically_before_numeric_ID_publication(self):
        from app.processes.runner import _TrackedProcessStub

        journal = self.runtime.execution_journal
        entry = journal.create(self.project["path"])
        stub = _TrackedProcessStub(
            name="fixture",
            tab_title="fixture",
            host_ip="",
            port="",
            protocol="tcp",
            command="never execute",
            start_time="fixture",
            outputfile="",
        )
        stub.execution_id = entry.id
        process_id = self.logic.activeProject.repositoryContainer.processRepository.storeProcess(stub)
        self.assertEqual(0, journal.get(entry.id).process_id)
        journal.update(entry.id, owner_stamp="previous-boot:1")
        result = reconcile_orphans(self.runtime, self.hub)
        self.assertEqual([entry.id], result["recovered"], result)
        self.assertEqual(
            "Cancelled",
            self.logic.activeProject.repositoryContainer.processRepository.getStatusByProcessId(str(process_id)),
        )
        self.hub.operations.save_as(self.project["id"], "Safe unprepared command copy")

    def test_no_profile_and_raw_only_crashes_finish_authority_without_replay(self):
        import uuid

        for raw_only in (False, True):
            with self.subTest(raw_only=raw_only):
                identifier = uuid.uuid4().hex
                parent = self.service.folder() / identifier
                parent.mkdir(parents=True)
                if raw_only:
                    raw = parent / "profile/raw/partial.txt"
                    raw.parent.mkdir(parents=True)
                    raw.write_bytes(b"original incomplete output")
                record = {
                    "id": identifier,
                    "project_id": self.project["id"],
                    "host_id": self.host_id,
                    "target_ip": self.request.target_ip,
                    "status": "running",
                    "job_id": 0,
                    "directory": str(parent.relative_to(self.project["folder"])),
                    "source_identity": scanner_source()[1],
                    "created_at": "2026-11-01T00:00:00Z",
                    "profile_path": "",
                    "summary": {},
                }
                journal = self.runtime.execution_journal
                entry = journal.create(
                    self.project["path"],
                    project_id=self.project["id"],
                    run_id=identifier,
                    directory=record["directory"],
                    source_identity=record["source_identity"],
                    host_id=self.host_id,
                    target_ip=self.request.target_ip,
                )
                from db.entities.process import process

                session = self.logic.activeProject.database.session()
                row = process(pid=str(os.getpid()), status="Running", name="owned-non-network-fixture")
                session.add(row)
                session.commit()
                process_id = row.id
                session.close()
                journal.update(entry.id, owner_stamp="previous-boot:1", process_id=process_id)
                record["execution_id"] = entry.id
                atomic_json(parent / "run.json", record)
                with patch("app.scanning.execution.execute_command") as launch:
                    result = reconcile_orphans(self.runtime, self.hub)
                    self.assertIn(entry.id, result["recovered"], result)
                    saved = recover(ProjectBackground(self.hub, self.project["id"]), identifier)
                    self.assertEqual("interrupted", saved["status"])
                    self.assertFalse(saved["recovery"]["retry_available"])
                    self.assertEqual(saved, recover(ProjectBackground(self.hub, self.project["id"]), identifier))
                    launch.assert_not_called()
                self.assertFalse((journal.root / (entry.id + ".json")).exists())
                self.assertEqual(
                    "Cancelled",
                    self.logic.activeProject.repositoryContainer.processRepository.getStatusByProcessId(
                        str(process_id)
                    ),
                )
                if raw_only:
                    self.assertEqual(b"original incomplete output", raw.read_bytes())
        self.hub.operations.save_as(self.project["id"], "Safe after no-profile recovery")

    def test_generic_command_crash_settles_original_DB_row_and_preserves_active_B(self):
        from db.entities.process import process

        session = self.logic.activeProject.database.session()
        row = process(pid=str(os.getpid()), status="Running", name="ordinary-command-fixture")
        session.add(row)
        session.commit()
        process_id = row.id
        session.close()
        journal = self.runtime.execution_journal
        entry = journal.create(self.project["path"])
        journal.update(entry.id, owner_stamp="previous-boot:1", process_id=process_id)
        other = self.hub.create("Selected B")["project"]
        with patch("app.scanning.execution.execute_command") as launch:
            result = reconcile_orphans(self.runtime, self.hub)
            launch.assert_not_called()
        self.assertEqual([entry.id], result["recovered"], result)
        self.assertEqual(other["path"], self.logic.activeProject.properties.projectName)
        self.hub.open(self.project["id"])
        self.assertEqual(
            "Cancelled",
            self.logic.activeProject.repositoryContainer.processRepository.getStatusByProcessId(str(process_id)),
        )
        self.hub.operations.save_as(self.project["id"], "Safe after command recovery")

    def test_recovery_API_reports_holds_without_tokens_and_retries_generic_cleanup(self):
        from db.entities.process import process

        journal = self.runtime.execution_journal
        entry = journal.create(self.project["path"])
        session = self.logic.activeProject.database.session()
        row = process(pid=str(os.getpid()), status="Waiting", execution_id=entry.id)
        session.add(row)
        session.commit()
        process_id = row.id
        session.close()
        journal.update(entry.id, phase="cleanup_required", reason="Administrator authentication required")
        with TestClient(create_app(self.runtime)) as client:
            pending = client.get("/api/recovery")
            self.assertEqual(200, pending.status_code, pending.text)
            self.assertEqual(1, len(pending.json()["pending"]))
            self.assertNotIn(entry.token, pending.text)
            self.assertNotIn("owner_stamp", pending.text)
            self.assertEqual(422, client.post("/api/recovery", json={"pid": os.getpid()}).status_code)
            with patch(
                "app.services.network_probe.command", side_effect=RuntimeError("Administrator authentication required")
            ):
                held = client.post("/api/recovery", json={})
            self.assertEqual(200, held.status_code, held.text)
            self.assertEqual(1, len(held.json()["held"]))
            self.assertEqual(1, len(held.json()["pending"]))
            done = client.post("/api/recovery", json={})
            self.assertEqual(200, done.status_code, done.text)
            self.assertEqual([], done.json()["pending"])
            self.assertEqual([entry.id], done.json()["recovered"])
        self.assertEqual(
            "Cancelled",
            self.logic.activeProject.repositoryContainer.processRepository.getStatusByProcessId(str(process_id)),
        )

    def test_SIGKILL_at_each_import_boundary_recovers_without_duplicate_inventory(self):
        import uuid
        from tests.support.scanner_fixture import write_profile, write_fixture_audit
        from app.scanning import repository

        for phase in ("inventory", "summary_database", "summary_file", "settlement"):
            with self.subTest(phase=phase):
                identifier = uuid.uuid4().hex
                parent = self.service.folder() / identifier
                parent.mkdir(parents=True)
                write_profile(parent / "profile")
                write_fixture_audit(parent)
                record = {
                    "id": identifier,
                    "project_id": self.project["id"],
                    "host_id": self.host_id,
                    "target_ip": self.request.target_ip,
                    "status": "running",
                    "job_id": 0,
                    "directory": str(parent.relative_to(self.project["folder"])),
                    "source_identity": scanner_source()[1],
                    "created_at": "2026-11-01T00:00:00Z",
                    "profile_path": "",
                    "summary": {},
                }
                atomic_json(parent / "run.json", record)
                before = self.counts()
                child = subprocess.Popen(
                    [
                        sys.executable,
                        str(ROOT / "tests/support/import_crash.py"),
                        self.project["id"],
                        identifier,
                        str(self.runtime.execution_journal.root),
                        str(parent),
                        phase,
                    ],
                    cwd=ROOT,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                try:
                    deadline = time.monotonic() + 6
                    while (
                        not (parent / "at-checkpoint").exists() and child.poll() is None and time.monotonic() < deadline
                    ):
                        time.sleep(0.01)
                    if not (parent / "at-checkpoint").exists():
                        child.kill()
                        _, errors = child.communicate(timeout=2)
                        self.fail("Offline crash fixture did not reach boundary: " + errors[-2000:])
                    child.kill()
                    child.wait(timeout=2)
                finally:
                    if child.poll() is None:
                        child.kill()
                        child.wait(timeout=2)
                    child.stderr.close()
                if phase in {"inventory", "summary_database"}:
                    self.assertEqual(before, self.counts())
                    self.assertIsNone(repository.get(self.logic.activeProject, identifier))
                profile = (parent / "profile/device-profile.json").read_bytes()
                with patch("app.scanning.execution.execute_command") as launch:
                    result = reconcile_orphans(self.runtime, self.hub)
                    self.assertEqual([], result["held"], result)
                    self.assertEqual(1, len(result["recovered"]))
                    launch.assert_not_called()
                after = self.counts()
                self.assertEqual(before["nmapSessionObj"] + 1, after["nmapSessionObj"])
                self.assertEqual(profile, (parent / "profile/device-profile.json").read_bytes())
                self.assertEqual(after, self.counts())
                self.assertEqual("complete", json.loads((parent / "run.json").read_text())["recovery"]["state"])

    def counts(self):
        names = ("hostObj", "portObj", "serviceObj", "nmapSessionObj", "l1ScriptObj")
        with self.logic.activeProject.database.engine.connect() as connection:
            return {name: connection.execute(text('SELECT COUNT(*) FROM "' + name + '"')).scalar() for name in names}

    def failed_run(self, phase):
        from app.importers.NmapImporter import NmapImporter
        from app.scanning import repository

        with ExitStack() as stack:
            stack.enter_context(patch("app.scanning.execution.execute_command", side_effect=self.executor()))
            if phase == "inventory":
                original = NmapImporter._store_scripts

                def fail(importer, *args):
                    original(importer, *args)
                    raise OSError("fault after real inventory stage commits")

                stack.enter_context(patch.object(NmapImporter, "_store_scripts", fail))
            elif phase == "summary_database":
                original = repository.save

                def fail(*args, **kwargs):
                    original(*args, **kwargs)
                    raise OSError("fault after marker insertion, before outer commit")

                stack.enter_context(patch.object(repository, "save", fail))
            elif phase == "summary_file":

                def fail(path, value):
                    if path.name == "summary.json":
                        raise OSError("fault after database commit, before file")
                    atomic_json(path, value)

                stack.enter_context(patch("app.scanning.execution.atomic_json", side_effect=fail))
            elif phase == "settlement":
                stack.enter_context(
                    patch("app.scanning.service.settled", side_effect=OSError("fault before final settlement"))
                )
            run, job = self.wait(self.service.start(self.request))
            self.assertEqual("failed", job["status"], job)
        return run

    def test_real_inventory_and_marker_roll_back_then_recover_exactly_once_offline(self):
        from app.scanning import repository

        for phase in ("inventory", "summary_database", "summary_file", "settlement"):
            with self.subTest(phase=phase):
                before = self.counts()
                run = self.failed_run(phase)
                if phase in {"inventory", "summary_database"}:
                    self.assertEqual(before, self.counts())
                    self.assertIsNone(repository.get(self.logic.activeProject, run["id"]))
                parent = Path(self.project["folder"]) / run["directory"]
                original = {
                    str(path.relative_to(parent)): path.read_bytes()
                    for path in (parent / "profile").rglob("*")
                    if path.is_file()
                }
                owner = ProjectBackground(self.hub, self.project["id"])
                with patch(
                    "app.scanning.execution.execute_command",
                    side_effect=AssertionError("Recovery cannot execute a network command"),
                ):
                    recovered = recover(owner, run["id"])
                    self.assertEqual("complete", recovered["recovery"]["state"])
                    self.assertEqual("completed", recovered["import_progress"]["status"])
                    counts = self.counts()
                    self.assertEqual(before["nmapSessionObj"] + 1, counts["nmapSessionObj"])
                    self.assertEqual(recovered, recover(owner, run["id"]))
                    self.assertEqual(counts, self.counts())
                self.assertEqual(
                    original,
                    {
                        str(path.relative_to(parent)): path.read_bytes()
                        for path in (parent / "profile").rglob("*")
                        if path.is_file()
                    },
                )
                complete = repository.get(self.logic.activeProject, run["id"])
                self.assertEqual(complete, json.loads((parent / "summary.json").read_text()))

    def test_restart_recovers_original_A_without_selecting_it_over_active_B(self):
        run = self.failed_run("summary_file")
        entry = self.runtime.execution_journal.get(run["execution_id"])
        self.runtime.execution_journal.update(entry.id, owner_stamp="a-previous-boot:1")
        other = self.hub.create("Active B")["project"]
        before = self.runtime.get_project_details()["name"]
        with patch("app.scanning.execution.execute_command", side_effect=AssertionError("No replay")):
            result = reconcile_orphans(self.runtime, self.hub)
        self.assertEqual([entry.id], result["recovered"], result)
        self.assertEqual([], result["held"])
        self.assertEqual(before, self.runtime.get_project_details()["name"])
        self.assertEqual(other["path"], self.logic.activeProject.properties.projectName)
        saved = json.loads((Path(self.project["folder"]) / run["directory"] / "run.json").read_text())
        self.assertEqual("complete", saved["recovery"]["state"])

    def test_copied_or_tampered_journal_reference_never_authorizes_cleanup(self):
        run = self.failed_run("summary_file")
        parent = Path(self.project["folder"]) / run["directory"]
        row = json.loads((parent / "run.json").read_text())
        row["inherited_history"] = True
        atomic_json(parent / "run.json", row)
        with patch.object(self.runtime.execution_journal, "cleanup") as cleanup:
            with self.assertRaisesRegex(RuntimeError, "Copied or mismatched"):
                recover(ProjectBackground(self.hub, self.project["id"]), run["id"])
            cleanup.assert_not_called()

    def test_unresolved_cleanup_blocks_duplicate_scan_copy_save_and_move_before_mutation(self):
        run = self.failed_run("summary_file")
        journal = self.runtime.execution_journal
        entry = journal.get(run["execution_id"])
        journal.update(entry.id, phase="cleanup_required", reason="sudo authentication required")
        before = sorted(str(path.relative_to(self.root)) for path in self.root.rglob("*"))
        with patch("app.scanning.execution.execute_command") as launch:
            for action in (
                lambda: self.service.start(self.request),
                lambda: self.hub.operations.save(self.project["id"]),
                lambda: self.hub.operations.save_as(self.project["id"], "Must not copy"),
                lambda: self.hub.set_save_folder(str(self.root / "must-not-move"), True),
            ):
                with self.assertRaisesRegex(RuntimeError, "cleanup/recovery"):
                    action()
            launch.assert_not_called()
        self.assertEqual(before, sorted(str(path.relative_to(self.root)) for path in self.root.rglob("*")))
        self.assertEqual("cleanup_required", journal.get(entry.id).phase)
        self.assertFalse((self.root / "must-not-move").exists())


class ExecutionOwnershipTest(TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.journal = ExecutionJournal(self.root / "protected")
        self.children = []
        self.addCleanup(self.clean_children)

    def clean_children(self):
        for child in self.children:
            if child.poll() is None:
                signal_process_tree(child, force=True)
            child.wait(timeout=3)

    def process(self, code="import time; time.sleep(30)", **kwargs):
        child = subprocess.Popen(
            [sys.executable, "-c", code],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
            **kwargs,
        )
        self.children.append(child)
        return child

    def test_journal_uses_full_real_bundle_identity(self):
        identity = scanner_source()[1]
        row = self.journal.create("/owned/project.legion", source_identity=identity)
        self.assertEqual(21, len(identity))
        self.assertEqual(identity, self.journal.get(row.id).model_dump()["source_identity"])
        self.assertEqual(0o700, self.journal.root.stat().st_mode & 0o777)
        self.assertEqual(0o600, (self.journal.root / (row.id + ".json")).stat().st_mode & 0o777)

    def test_job_stop_lists_only_confirmed_process_terminations(self):
        from app.web.runtime_process_jobs import stop_job

        manager = WebJobManager()
        entered, release = threading.Event(), threading.Event()
        self.addCleanup(release.set)
        job = manager.start("tool-run", lambda: (entered.set(), release.wait(3), {})[-1])
        self.assertTrue(entered.wait(2))
        registry = ProcessRegistry()
        registry.register(job["id"], 17)
        runtime = SimpleNamespace(
            jobs=manager,
            process_registry=registry,
            kill_process=lambda _: {"killed": False, "reason": "already exited"},
        )
        outcome = stop_job(runtime, job["id"])
        self.assertEqual([], outcome["killed_process_ids"])
        self.assertTrue(outcome["job"]["cancel_requested"])
        release.set()
        self.assertEqual([], manager.shutdown(3))

    def test_stop_wait_cannot_update_a_newly_selected_project_with_the_same_row_ID(self):
        from app.web.runtime_process_control import kill_process

        child = self.process()
        original_repo, other_repo = MagicMock(), MagicMock()
        original = SimpleNamespace(repositoryContainer=SimpleNamespace(processRepository=original_repo))
        other = SimpleNamespace(repositoryContainer=SimpleNamespace(processRepository=other_repo))
        selected = [original]
        runtime = SimpleNamespace(
            _lock=threading.RLock(),
            _process_runtime_lock=threading.Lock(),
            _active_processes={1: child},
            _kill_requests=set(),
            _require_active_project=lambda: selected[0],
            _signal_process_tree=signal_process_tree,
            _emit_ui_invalidation=lambda *args, **kwargs: None,
        )
        wait = child.wait

        def complete_and_switch(timeout=None):
            result = wait(timeout=timeout)
            selected[0] = other
            return result

        with patch.object(child, "wait", side_effect=complete_and_switch):
            result = kill_process(runtime, 1)
        self.assertTrue(result["killed"])
        self.assertIs(other, selected[0])
        other_repo.storeProcessKillStatus.assert_not_called()
        original_repo.storeProcessKillStatus.assert_not_called()

    def test_unreaped_zombie_owner_is_dead_for_recovery(self):
        child = self.process("pass")
        row = self.journal.create("/owned/project.legion")
        stamp = process_stamp(child.pid)
        # Keep the child unreaped until the actual zombie state is observable.
        self.journal.update(row.id, owner_pid=child.pid, owner_stamp=stamp)
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline:
            fields = Path(f"/proc/{child.pid}/stat").read_text().rsplit(") ", 1)[1].split()
            if fields[0] == "Z":
                break
            time.sleep(0.005)
        self.assertEqual("Z", fields[0])
        self.assertEqual([row.id], [entry.id for entry in self.journal.orphans()])
        child.wait(timeout=1)

    def test_detached_sanitized_runner_children_are_reaped_after_owner_and_worker_die(self):
        before = scanner_source()[1]
        owner = self.process(
            f'import runpy,sys;sys.argv=[{str(ROOT/"tests/support/orphan_scenario.py")!r},"owner",{str(self.root)!r}];runpy.run_path(sys.argv[0],run_name="__main__")'
        )
        deadline = time.monotonic() + 5
        children = self.root / "children.json"
        while not children.exists() and time.monotonic() < deadline:
            time.sleep(0.01)
        self.assertTrue(children.is_file(), "Owned Runner fixture did not start")
        values = json.loads(children.read_text())
        entry = json.loads((self.root / "entry.json").read_text())
        self.assertEqual(entry["token"], values["token"])
        unrelated = self.process()
        identifier = entry["id"]
        self.addCleanup(lambda: self.journal.cleanup(identifier))
        owner.kill()
        owner.wait(timeout=2)
        saved = self.journal.get(identifier)
        for pid in {saved.pid, values["adapter"]}:
            try:
                os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        self.assertEqual([identifier], [row.id for row in self.journal.orphans()])
        self.assertIsNotNone(process_stamp(values["child"]))
        self.journal.cleanup(identifier)
        for pid in (values["tool"], values["child"]):
            path = Path(f"/proc/{pid}/stat")
            self.assertTrue(not path.exists() or path.read_text().rsplit(") ", 1)[1].split()[0] == "Z")
        self.assertIsNone(unrelated.poll())
        self.assertEqual(before, scanner_source()[1])

    def test_table_with_different_owner_comment_is_never_deleted(self):
        import importlib.util

        spec = importlib.util.spec_from_file_location("owned_cleanup_fixture", ROOT / "app/processes/reap_owned.py")
        helper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(helper)
        row = self.journal.create("/owned/project.legion")
        value = self.journal.update(row.id, gid=1_000_000_001, table="flaghop_1000000001").model_dump()

        def command(argv, **kwargs):
            if argv[-1] == "tables":
                data = {"nftables": [{"table": {"family": "inet", "name": value["table"]}}]}
            else:
                data = {"nftables": [{"table": {"family": "inet", "name": value["table"], "comment": "someone-else"}}]}
            return SimpleNamespace(stdout=json.dumps(data), returncode=0)

        with (
            patch.object(helper, "owned_processes", return_value=[]),
            patch.object(helper.shutil, "which", return_value="/fixture/nft"),
            patch.object(helper.subprocess, "run", side_effect=command) as calls,
        ):
            with self.assertRaisesRegex(RuntimeError, "ownership differs"):
                helper.clean(value)
            self.assertFalse(any("delete" in call.args[0] for call in calls.call_args_list))

    def test_reused_pid_identity_does_not_signal_unrelated_live_process(self):
        unrelated = self.process()
        row = self.journal.create("/owned/project.legion")
        self.journal.update(row.id, pid=unrelated.pid, pgid=unrelated.pid, pid_stamp="previous-boot:1")
        self.journal.cleanup(row.id)
        self.assertIsNone(unrelated.poll())

    def test_gate_eof_prevents_tool_execution_when_parent_dies_before_commit(self):
        proof = self.root / "must-not-exist"
        read, write = os.pipe()
        child = subprocess.Popen(
            [
                sys.executable,
                "-I",
                str(ROOT / "app/processes/gated_exec.py"),
                str(read),
                sys.executable,
                "-c",
                f'from pathlib import Path; Path({str(proof)!r}).write_text("ran")',
            ],
            pass_fds=(read,),
            start_new_session=True,
        )
        self.children.append(child)
        os.close(read)
        os.close(write)
        self.assertEqual(125, child.wait(timeout=3))
        self.assertFalse(proof.exists())

    def test_missing_cleanup_permission_remains_visible_and_keeps_authority(self):
        row = self.journal.create("/owned/project.legion")
        self.journal.update(row.id, gid=1_000_000_001, table="flaghop_1000000001")
        with patch("app.services.network_probe.command", side_effect=RuntimeError("sudo authentication required")):
            with self.assertRaisesRegex(RuntimeError, "sudo authentication"):
                self.journal.cleanup(row.id)
        saved = self.journal.get(row.id)
        self.assertEqual("cleanup_required", saved.phase)
        self.assertEqual("flaghop_1000000001", saved.table)
        with self.assertRaisesRegex(RuntimeError, "before owned cleanup"):
            self.journal.finish(row.id)

    def test_shutdown_deadline_includes_blocked_queued_settlement(self):
        manager = WebJobManager()
        entered, release, settling = threading.Event(), threading.Event(), threading.Event()
        self.addCleanup(release.set)
        manager.start("running", lambda: (entered.set(), release.wait(3), {})[-1])
        self.assertTrue(entered.wait(2))

        def callback(_):
            settling.set()
            release.wait(3)

        queued = manager.start("queued", lambda: {}, on_finish=callback)
        runtime = SimpleNamespace(jobs=manager)
        start = time.monotonic()
        report = shutdown(runtime, timeout=0.05)
        self.assertLess(time.monotonic() - start, 0.25)
        self.assertTrue(settling.wait(0.2))
        self.assertFalse(report["complete"])
        self.assertIn(queued["id"], report["unfinished_jobs"])
        with self.assertRaisesRegex(RuntimeError, "still settling"):
            manager.startup()
        release.set()
        self.assertEqual([], manager.shutdown(3))

    def test_real_process_runner_child_is_cancelled_and_reaped_on_ASGI_shutdown(self):
        registry = ProcessRegistry()
        manager = WebJobManager()
        repo = MagicMock()
        repo.storeProcess.return_value = 41
        runtime = SimpleNamespace(
            _lock=threading.RLock(),
            jobs=manager,
            process_registry=registry,
            _signal_process_tree=signal_process_tree,
            execution_journal=self.journal,
        )
        ports = ExecutionPorts(
            repository=lambda: repo,
            registry=registry,
            jobs=manager,
            collect_command_artifacts=lambda _: [],
            emit_ui_invalidation=lambda *args, **kwargs: None,
            process_progress_adapter_for_command=lambda *args: "",
            process_tree_activity_changed=lambda *args: False,
            register_job_process=registry.register,
            resolve_process_timeout_policy=lambda *args: {"inactivity_timeout_seconds": 30},
            sample_process_tree_activity=lambda _: None,
            signal_process_tree=signal_process_tree,
            unregister_job_process=registry.unregister,
            update_process_progress=lambda *args, **kwargs: None,
            write_process_output_partial=lambda *args: None,
        )
        from dataclasses import replace

        entry = self.journal.create("/owned/project.legion")
        ports = replace(ports, ownership=(self.journal, entry.id))
        request = CommandRequest(
            tool_name="owned-sleep",
            tab_title="fixture",
            host_ip="",
            port="",
            protocol="tcp",
            command=shlex.join([sys.executable, "-c", "import time; time.sleep(30)"]),
            outputfile="",
            timeout=30,
            job_id=1,
        )
        application = create_app(runtime)
        with TestClient(application):
            job = manager.start("owned-local-child", lambda: ProcessRunner(ports).run(request).metadata)
            deadline = time.monotonic() + 3
            while not registry.active and time.monotonic() < deadline:
                time.sleep(0.01)
            self.assertTrue(registry.active)
            child = next(iter(registry.active.values()))
        self.assertIsNotNone(child.poll())
        self.assertEqual("cancelled", manager.get_job(job["id"])["status"])
        self.assertTrue(application.state.shutdown_report["complete"])
        self.assertEqual({}, registry.active)
        self.assertEqual("cleaned", self.journal.get(entry.id).phase)
