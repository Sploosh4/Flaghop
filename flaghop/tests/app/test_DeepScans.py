"""Project/job/import regressions with synthetic evidence and no network launches."""

import json
import os
from pathlib import Path
import tempfile
import threading
import time
from datetime import datetime, timezone
import tracemalloc
from unittest import TestCase
from unittest.mock import patch
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.api import create_app
from app.contracts.actions.process import ExecutionResult
from app.scanning import repository
from app.contracts.actions.scanner import DeepScanRequest
from app.scanning.profile import validate_profile
from app.scanning.service import DeepScans
from app.contracts.actions.network import NetworkUpdate
from app.services.project_hub import ProjectHub
from app.services.project_networks import NetworkHeld
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from app.services.execution_journal import ExecutionJournal
from db.entities.host import hostObj
from tests.app.test_ProjectNetworks import FixtureProbe
from tests.support.scanner_fixture import write_profile, write_fixture_audit


class DeepScansTest(TestCase):

    def test_runtime_wrapper_preserves_malformed_outcomes_until_api_reports_failure(self):
        with TestClient(create_app(self.runtime)) as client:
            for value in (False, 0, [], "", ()):
                with self.subTest(value=value):
                    job = self.runtime._start_job("synthetic-invalid-result", lambda _job_id, value=value: value)
                    deadline = time.monotonic() + 2
                    while time.monotonic() < deadline:
                        response = client.get("/api/jobs/" + str(job["id"]))
                        result = response.json()
                        if result["status"] not in {"queued", "running"}:
                            break
                        time.sleep(0.01)
                    self.assertEqual("failed", result["status"])
                    self.assertIn("result dictionary", result["error"])

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.env = patch.dict(
            os.environ, {"LEGION_HOME": str(self.root / "config"), "LEGION_PROJECTS_DIR": str(self.root / "projects")}
        )
        self.env.start()
        self.logic = create_default_logic()
        self.runtime = WebRuntime(
            self.logic, execution_journal=ExecutionJournal(Path(os.environ["LEGION_HOME"]) / "protected-executions")
        )
        self.hub = ProjectHub(self.runtime)
        self.project = self.hub.create("Scanner fixture")["project"]
        self.hub.networks.probe = FixtureProbe()
        self.context = self.hub.networks.save(
            self.project["id"],
            NetworkUpdate(
                expected_revision=0,
                settings={
                    "name": "Fixture",
                    "scope_source": "Synthetic addresses",
                    "allowed_targets": ["192.0.2.0/24"],
                    "interface": "ctf0",
                    "allowed_ports": [8080],
                },
            ),
        )
        project = self.logic.activeProject
        session = project.database.session()
        host = hostObj(ip="192.0.2.10", hostname="fixture.test", status="up")
        session.add(host)
        session.commit()
        self.host_id = host.id
        session.close()
        self.service = DeepScans(self.hub, self.project["id"])
        self.request = DeepScanRequest(host_id=self.host_id, target_ip="192.0.2.10", expected_revision=1)

    def tearDown(self):
        project = self.logic.activeProject
        self.logic.projectManager.closeProject(project)
        project.database.dispose()
        self.env.stop()
        self.temp.cleanup()

    def wait(self, run):
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline:
            job = self.runtime.jobs.get_job(run["job_id"])
            if job["status"] not in {"queued", "running"}:
                return self.service.list()["runs"][0], job
            time.sleep(0.01)
        self.fail("Synthetic scan job did not settle.")

    def executor(self, *, target=None, status="completed", tasks=None, mutate=None, executed=True, reason="completed"):
        def execute(runtime, **kwargs):
            self.assertEqual(runtime, self.runtime)
            self.assertEqual("device-profile", kwargs["tool_name"])
            self.assertIsInstance(kwargs["argv"], tuple)
            self.assertEqual(("192.0.2.10",), kwargs["network_targets"])
            config = json.loads(Path(kwargs["argv"][-1]).read_text())
            self.assertIn("--no-metasploit", config["argv"])
            self.assertNotIn("--sudo", config["argv"])
            output = Path(config["argv"][config["argv"].index("--out") + 1])
            profile = write_profile(output, target or self.request.target_ip, status, tasks)
            write_fixture_audit(output.parent)
            if mutate:
                mutate(profile)
                (output / "device-profile.json").write_text(json.dumps(profile))
            return ExecutionResult(
                executed, reason, 0, {"exit_code": 0 if executed else 2, "network": {"status": "ready"}}
            )

        return execute

    def test_recovery_persists_interruption_without_replaying_a_reused_job_id(self):
        from app.services.project_background import atomic_json

        folder = self.service.folder() / ("a" * 32)
        folder.mkdir(parents=True)
        original = b"original evidence"
        (folder / "proof.bin").write_bytes(original)
        # A different job after restart can reuse the same numeric identifier.
        job = self.runtime.jobs.start("different-work", lambda: {})
        record = {
            "id": folder.name,
            "project_id": self.project["id"],
            "host_id": self.host_id,
            "target_ip": self.request.target_ip,
            "status": "running",
            "job_id": job["id"],
            "created_at": "2026-10-31T00:00:00Z",
            "summary": {},
            "directory": str(folder.relative_to(self.project["folder"])),
        }
        atomic_json(folder / "run.json", record)
        with patch("app.scanning.execution.execute_command") as launch:
            recovered = self.service.list()["runs"][0]
            self.assertEqual("interrupted", recovered["status"])
            self.assertEqual("never-replay", recovered["recovery"]["policy"])
            saved = (folder / "run.json").read_bytes()
            self.assertEqual("interrupted", json.loads(saved)["status"])
            stamp = (folder / "run.json").stat().st_mtime_ns
            self.assertEqual("interrupted", self.service.list()["runs"][0]["status"])
            self.assertEqual(stamp, (folder / "run.json").stat().st_mtime_ns)
            self.assertEqual(original, (folder / "proof.bin").read_bytes())
            launch.assert_not_called()

    def test_project_switch_and_duplicate_scan_remain_blocked_during_settlement(self):
        import app.scanning.lifecycle as lifecycle

        other = self.hub.create("Other workspace")["project"]
        self.hub.open(self.project["id"])
        entered, release = threading.Event(), threading.Event()
        self.addCleanup(release.set)
        real_settled = lifecycle.settled

        def pause(owner, job):
            entered.set()
            release.wait(4)
            real_settled(owner, job)

        with (
            patch("app.scanning.execution.execute_command", side_effect=self.executor()),
            patch("app.scanning.service.settled", side_effect=pause),
        ):
            run = self.service.start(self.request)
            self.assertTrue(entered.wait(2))
            self.assertEqual("running", self.service.list()["runs"][0]["status"])
            self.assertEqual(run["id"], self.service.start(self.request)["id"])
            with self.assertRaises(RuntimeError):
                self.hub.open(other["id"])
            release.set()
            saved, job = self.wait(run)
            self.assertEqual(("completed", "completed"), (saved["status"], job["status"]))
        self.hub.open(other["id"])

    def test_two_hubs_and_network_capture_share_one_project_transaction(self):
        second = ProjectHub(self.runtime)
        entered, release, finished = threading.Event(), threading.Event(), threading.Event()
        self.addCleanup(release.set)
        failures = []

        def edit_catalog():
            try:
                with second.workspace(self.project["id"]):
                    entered.set()
                    release.wait(2)
                    second.set_vpn(self.project["id"], "inherit")
            except Exception as exc:
                failures.append(exc)

        def capture():
            try:
                self.hub.networks.capture()
            except Exception as exc:
                failures.append(exc)
            finally:
                finished.set()

        writer = threading.Thread(target=edit_catalog, daemon=True)
        writer.start()
        self.assertTrue(entered.wait(1))
        reader = threading.Thread(target=capture, daemon=True)
        reader.start()
        self.assertFalse(finished.wait(0.05))
        release.set()
        writer.join(2)
        reader.join(2)
        self.assertTrue(finished.is_set())
        self.assertFalse(writer.is_alive())
        self.assertEqual([], failures)

    def test_history_polling_reads_metadata_only_and_keeps_full_results_on_demand(self):
        from app.scanning import history

        folder = self.service.folder()
        folder.mkdir(parents=True)
        for index in range(1000):
            identifier = f"{index:032x}"
            parent = folder / identifier
            parent.mkdir()
            record = {
                "id": identifier,
                "project_id": self.project["id"],
                "host_id": self.host_id,
                "target_ip": self.request.target_ip,
                "status": "completed",
                "job_id": 0,
                "created_at": datetime.fromtimestamp(1793404800 + index, timezone.utc).isoformat(),
                "directory": str(parent.relative_to(self.project["folder"])),
                "summary": {"candidates": [{"title": "fixture", "explanation": "evidence " * 8192}]},
            }
            (parent / "run.json").write_text(json.dumps(record))
        baseline_bytes = sum(path.stat().st_size for path in folder.glob("*/run.json"))
        with patch("app.scanning.history.read_record", wraps=history.read_record) as read:
            tracemalloc.start()
            try:
                compact = self.service.list(compact=True)
                _current, peak = tracemalloc.get_traced_memory()
            finally:
                tracemalloc.stop()
            self.assertLess(peak, 12 * 1024 * 1024)
            self.assertEqual(1000, read.call_count)
            read.reset_mock()
            again = self.service.list(compact=True)
            self.assertEqual(0, read.call_count)
        self.assertEqual(compact, again)
        self.assertEqual(200, len(compact["runs"]))
        from app.contracts.actions.scanner import DeepScanList

        payload_bytes = len(DeepScanList.model_validate(compact).model_dump_json().encode())
        old_response_bytes = len(json.dumps(self.service.list()).encode())
        self.assertLess(payload_bytes, baseline_bytes // 100)
        self.assertLessEqual(self.hub._scan_history[1].bytes, history.MAX_CACHE)
        detail = self.service.detail(compact["runs"][0]["id"])
        self.assertGreater(len(detail["summary"]["candidates"][0]["explanation"]), 60_000)
        # An external metadata edit must invalidate the cache without changing
        # original evidence or requiring a restart.
        path = folder / compact["runs"][0]["id"] / "run.json"
        detail["reason"] = "changed"
        path.write_text(json.dumps(detail))
        self.assertEqual("changed", self.service.list(compact=True)["runs"][0]["reason"])
        print(
            json.dumps(
                {
                    "history_fixture": {
                        "runs": 1000,
                        "cold_python_allocation_peak_bytes": peak,
                        "old_poll_read_bytes": baseline_bytes,
                        "old_response_bytes": old_response_bytes,
                        "compact_response_bytes": payload_bytes,
                        "warm_poll_record_reads": 0,
                        "cache_budget_bytes": history.MAX_CACHE,
                    }
                }
            )
        )

    def test_missing_changed_and_unmeasured_implementation_audits_prevent_clean_completion(self):
        for mode in ("missing", "changed", "unmeasured", "malformed"):
            execute = self.executor()

            def with_bad_audit(runtime, **kwargs):
                result = execute(runtime, **kwargs)
                path = Path(kwargs["argv"][-1]).with_name("implementation-audit.json")
                if mode == "missing":
                    path.unlink()
                elif mode == "malformed":
                    path.write_text('{"unchanged": true, "before": {}, "after": {}}')
                else:
                    audit = json.loads(path.read_text())
                    audit["after"]["browser"] = {"status": "unmeasured", "reason": "fixture"}
                    if mode == "unmeasured":
                        audit["before"] = audit["after"]
                    audit["unchanged"] = True  # A reported boolean must not bypass actual comparison.
                    path.write_text(json.dumps(audit))
                return result

            with self.subTest(mode=mode), patch("app.scanning.execution.execute_command", side_effect=with_bad_audit):
                run, job = self.wait(self.service.start(self.request))
                self.assertEqual("failed" if mode == "malformed" else "partial", job["status"])
                self.assertTrue((Path(self.project["folder"]) / run["directory"] / "profile/raw/nmap.xml").is_file())

    def test_restart_after_failed_terminal_write_keeps_evidence_and_marks_unsettled_result(self):
        from app.web.jobs import WebJobManager

        with (
            patch("app.scanning.execution.execute_command", side_effect=self.executor()),
            patch("app.scanning.service.settled", side_effect=OSError("fixture metadata write failed")),
        ):
            run = self.service.start(self.request)
            deadline = time.monotonic() + 4
            while time.monotonic() < deadline:
                job = self.runtime.jobs.get_job(run["job_id"])
                if job["status"] == "failed":
                    break
                time.sleep(0.01)
            self.assertEqual("failed", job["status"])
            self.assertIn("persistence", job["error"])
        path = Path(self.project["folder"]) / run["directory"] / "run.json"
        self.assertEqual("pending", json.loads(path.read_text())["settlement"])
        self.assertEqual(1, len(repository.summaries(self.logic.activeProject)))
        self.runtime.jobs = WebJobManager()  # Simulated empty queue after restart.
        recovered = self.service.list(compact=True)["runs"][0]
        self.assertEqual("interrupted", recovered["status"])
        self.assertEqual("interrupted", json.loads(path.read_text())["settlement"])
        self.assertTrue((path.parent / "profile/raw/nmap.xml").is_file())
        self.assertEqual(1, len(repository.summaries(self.logic.activeProject)))

    def test_scope_lookup_releases_project_lock_and_rejects_project_or_revision_change(self):
        for change in ("project", "revision"):
            with self.subTest(change=change):
                if change == "project":
                    other = self.hub.create("Switch while resolving")["project"]
                    self.hub.open(self.project["id"])
                entered, release = threading.Event(), threading.Event()
                errors = []
                original = self.hub.networks.resolve_scope

                def pause(values, deadline, cache=None):
                    entered.set()
                    if not release.wait(3):
                        raise RuntimeError("Fixture lookup was not released")
                    return original(values, deadline, cache)

                def start():
                    try:
                        self.service.start(self.request)
                    except Exception as exc:
                        errors.append(exc)

                with (
                    patch.object(self.hub.networks, "resolve_scope", side_effect=pause),
                    patch("app.scanning.execution.execute_command") as launch,
                ):
                    thread = threading.Thread(target=start, daemon=True)
                    thread.start()
                    try:
                        self.assertTrue(entered.wait(1))
                        # A separate thread must acquire the state lock while
                        # the lookup is still waiting, rather than after timeout.
                        self.assertTrue(self.hub.lock.acquire(timeout=0.5))
                        try:
                            if change == "project":
                                self.hub.open(other["id"])
                            else:
                                self.hub.networks.save(
                                    self.project["id"],
                                    NetworkUpdate(expected_revision=1, settings=self.context["settings"]),
                                )
                        finally:
                            self.hub.lock.release()
                    finally:
                        release.set()
                        thread.join(3)
                    self.assertFalse(thread.is_alive())
                    self.assertEqual(1, len(errors))
                    self.assertIsInstance(errors[0], RuntimeError)
                    launch.assert_not_called()
                self.assertFalse([job for job in self.runtime.jobs.list_jobs() if job["type"] == "deep-scan"])
                if change == "project":
                    self.hub.open(self.project["id"])

    def test_import_write_faults_keep_evidence_and_record_actual_database_progress(self):
        from app.services.project_background import atomic_json
        from app.web.jobs import WebJobManager
        from contextlib import ExitStack

        for phase in ("inventory", "summary_database", "summary_file"):
            with self.subTest(phase=phase), ExitStack() as patches:
                patches.enter_context(patch("app.scanning.execution.execute_command", side_effect=self.executor()))
                patches.enter_context(
                    patch(
                        "app.scanning.repository.summaries",
                        side_effect=AssertionError("Import must not load the entire summary history"),
                    )
                )
                if phase == "inventory":
                    patches.enter_context(
                        patch(
                            "app.scanning.execution.import_nmap_xml_into_project",
                            side_effect=OSError("fixture inventory write"),
                        )
                    )
                elif phase == "summary_database":
                    patches.enter_context(
                        patch("app.scanning.repository.save", side_effect=OSError("fixture DB write"))
                    )
                else:

                    def fail_summary(path, value):
                        if path.name == "summary.json":
                            raise OSError("fixture file write")
                        return atomic_json(path, value)

                    patches.enter_context(patch("app.scanning.execution.atomic_json", side_effect=fail_summary))
                run, job = self.wait(self.service.start(self.request))
                self.assertEqual("failed", job["status"])
                progress = run["import_progress"]
                self.assertEqual(("failed", phase), (progress["status"], progress["phase"]))
                self.assertEqual(phase == "summary_file", progress["inventory_committed"])
                self.assertFalse(progress["inventory_may_be_partial"])
                self.assertEqual(phase == "summary_file", progress["summary_committed"])
                self.assertTrue((Path(self.project["folder"]) / run["profile_path"]).is_file())
                self.assertEqual(
                    phase == "summary_file", repository.get(self.logic.activeProject, run["id"]) is not None
                )
                self.runtime.jobs = WebJobManager()
                with patch("app.scanning.execution.execute_command") as launch:
                    recovered = self.service.detail(run["id"])
                    self.assertEqual(progress, recovered["import_progress"])
                    self.assertEqual("failed", recovered["status"])
                    launch.assert_not_called()

    def test_invalid_mismatched_outside_excluded_and_stale_targets_do_not_enqueue(self):
        for value in ("example.test", "192.0.2.0/24", "192.0.2.10; id", "0.0.0.0"):
            with self.assertRaises(ValidationError):
                DeepScanRequest(host_id=self.host_id, target_ip=value, expected_revision=1)
        with self.assertRaises(ValueError):
            self.service.start(self.request.model_copy(update={"target_ip": "192.0.2.99"}))
        with self.assertRaises(NetworkHeld):
            self.service.start(self.request.model_copy(update={"expected_revision": 0}))
        prefs = {**self.context["settings"], "exclusions": ["192.0.2.10"]}
        self.hub.networks.save(self.project["id"], NetworkUpdate(expected_revision=1, settings=prefs))
        with self.assertRaises(NetworkHeld):
            self.service.start(self.request.model_copy(update={"expected_revision": 2}))
        prefs = {**prefs, "allowed_targets": ["198.51.100.0/24"], "exclusions": []}
        self.hub.networks.save(self.project["id"], NetworkUpdate(expected_revision=2, settings=prefs))
        with self.assertRaises(NetworkHeld):
            self.service.start(self.request.model_copy(update={"expected_revision": 3}))
        self.assertFalse([j for j in self.runtime.jobs.list_jobs() if j["type"] == "deep-scan"])

    def test_job_imports_services_hypotheses_and_distinct_findings_and_survives_reload(self):
        with patch("app.scanning.execution.execute_command", side_effect=self.executor()):
            run, job = self.wait(self.service.start(self.request))
        self.assertEqual("completed", run["status"])
        self.assertEqual("completed", job["status"])
        self.assertEqual(self.project["id"], job["payload"]["network_context"]["project_id"])
        self.assertEqual(1, job["payload"]["network_context"]["revision"])
        detail = self.runtime.get_host_workspace(self.host_id)
        self.assertTrue(any(p["port"] == "8080" for p in detail["ports"]))
        self.assertEqual("hypothesis", run["summary"]["classification"]["status"])
        self.assertEqual("candidate", run["summary"]["candidates"][0]["status"])
        self.assertEqual("reproduced", run["summary"]["reproduced"][0]["status"])
        self.assertEqual(1, len(repository.summaries(self.logic.activeProject)))
        self.hub.operations.save(self.project["id"])
        self.hub.open(self.project["id"])
        self.assertEqual(run["id"], self.service.list()["runs"][0]["id"])
        self.assertEqual(run["profile_sha256"], repository.summaries(self.logic.activeProject)[0]["profile_sha256"])

    def test_bad_profiles_do_not_import_or_erase_raw_evidence(self):
        mutations = [
            lambda p: p.update(schema_version="99"),
            lambda p: p["target"].update(ip="198.51.100.2"),
            lambda p: p["artifacts"][0].update(path="../../outside"),
            lambda p: p["artifacts"][0].update(sha256="0" * 64),
            lambda p: p["run"].pop("finished_at"),
            lambda p: p["tasks"][0].update(parse_status="failed", stdout="../outside"),
            lambda p: p["nmap"]["services"][0].update(port={"bad": "port"}),
            lambda p: p["nmap"]["services"][0]["fingerprint"].update(product="Invented Apache"),
            lambda p: p["classification"]["primary"].update(score=1000),
        ]
        with TestClient(create_app(self.runtime)) as client:
            for mutation in mutations:
                with (
                    self.subTest(mutation=mutation),
                    patch("app.scanning.execution.execute_command", side_effect=self.executor(mutate=mutation)),
                ):
                    run, job = self.wait(self.service.start(self.request))
                    self.assertEqual("failed", run["status"])
                    self.assertEqual("failed", job["status"])
                    self.assertTrue(
                        (Path(self.project["folder"]) / run["directory"] / "profile/raw/nmap.xml").is_file()
                    )
                    self.assertFalse(repository.summaries(self.logic.activeProject))
                    response = client.get(f'/api/hub/projects/{self.project["id"]}/deep-scans/{run["id"]}')
                    self.assertEqual(200, response.status_code)

    def test_save_as_restore_and_folder_move_retain_history_without_resuming_work(self):
        import hashlib

        with patch("app.scanning.execution.execute_command", side_effect=self.executor()):
            run, _ = self.wait(self.service.start(self.request))
        original_profile = Path(self.project["folder"]) / run["profile_path"]
        original_bytes = original_profile.read_bytes()
        original_digest = hashlib.sha256(original_bytes).hexdigest()
        from app.services.project_background import atomic_json
        from sqlalchemy import text

        complete = repository.get(self.logic.activeProject, run["id"])
        complete["unknown_extension"] = {"original": ["keep", 1, None], "nested": {"source": "fixture"}}
        with self.logic.activeProject.database.engine.begin() as connection:
            connection.execute(
                text("UPDATE flaghop_deep_scans SET summary=:summary WHERE run_id=:id"),
                {"id": run["id"], "summary": json.dumps(complete)},
            )
        atomic_json(original_profile.parent.parent / "summary.json", complete)
        atomic_json(
            Path(self.project["folder"]) / "reader-control.json",
            {"running": True, "pause_policy": "finish-bounded-step"},
        )

        def preserved():
            current = repository.get(self.logic.activeProject, run["id"])
            self.assertEqual(complete, current)
            self.assertEqual(
                complete,
                json.loads(
                    (
                        Path(self.logic.activeProject.properties.outputFolder)
                        / "deep-scans"
                        / run["id"]
                        / "summary.json"
                    ).read_text()
                ),
            )
            self.assertFalse(
                json.loads(
                    (Path(self.logic.activeProject.properties.projectName).parent / "reader-control.json").read_text()
                )["running"]
            )

        saved = self.hub.operations.save_as(self.project["id"], "Saved scanner copy")["project"]
        preserved()
        copied = DeepScans(self.hub, saved["id"]).list()["runs"]
        self.assertEqual(1, len(copied))
        self.assertEqual(saved["id"], copied[0]["project_id"])
        self.assertEqual(0, copied[0]["job_id"])
        self.assertEqual(self.project["id"], copied[0]["lineage"][0]["project_id"])
        self.assertEqual(original_bytes, (Path(saved["folder"]) / copied[0]["profile_path"]).read_bytes())
        self.assertFalse(self.hub.networks.get(saved["id"])["configured"])
        archive, _ = self.hub.operations.bundle(saved["id"])
        try:
            restored = self.hub.operations.restore_zip(archive)["project"]
        finally:
            Path(archive).unlink(missing_ok=True)
        history = DeepScans(self.hub, restored["id"]).list()["runs"]
        preserved()
        self.assertEqual(1, len(history))
        self.assertEqual(restored["id"], history[0]["project_id"])
        self.assertEqual(original_bytes, (Path(restored["folder"]) / history[0]["profile_path"]).read_bytes())
        self.assertFalse(json.loads((Path(restored["folder"]) / "reader-control.json").read_text())["running"])
        self.assertFalse(self.hub.networks.get(restored["id"])["configured"])
        destination = self.root / "moved-projects"
        self.hub.set_save_folder(str(destination), True)
        moved = self.hub._record(restored["id"])
        detail = DeepScans(self.hub, moved["id"]).detail(run["id"])
        preserved()
        self.assertEqual(original_bytes, (Path(moved["folder"]) / detail["profile_path"]).read_bytes())
        self.assertEqual(1, len(repository.summaries(self.logic.activeProject)))
        self.hub.open(self.project["id"])
        old = self.hub._record(self.project["id"])
        self.assertEqual(
            original_digest, hashlib.sha256((Path(old["folder"]) / run["profile_path"]).read_bytes()).hexdigest()
        )
        with patch("app.scanning.execution.execute_command") as launch:
            self.hub.open(moved["id"])
            with self.assertRaises(NetworkHeld):
                DeepScans(self.hub, moved["id"]).start(self.request)
            launch.assert_not_called()

    def test_large_valid_summaries_stay_visible_after_reload(self):
        def large_summary(profile):
            profile["assessment_findings"][0]["explanation"] = "Synthetic evidence. " * 12_000

        with patch("app.scanning.execution.execute_command", side_effect=self.executor(mutate=large_summary)):
            run, _ = self.wait(self.service.start(self.request))
        self.assertGreater((Path(self.project["folder"]) / run["directory"] / "run.json").stat().st_size, 100_000)
        self.hub.operations.save(self.project["id"])
        self.hub.open(self.project["id"])
        self.assertEqual(run["id"], self.service.list()["runs"][0]["id"])

    def test_cleanup_failure_cannot_be_reported_as_complete(self):
        def failed_cleanup(profile):
            profile["cleanup"] = {"success": False, "errors": ["Synthetic cleanup failure"]}

        with patch("app.scanning.execution.execute_command", side_effect=self.executor(mutate=failed_cleanup)):
            run, job = self.wait(self.service.start(self.request))
        self.assertEqual(("partial", "partial"), (run["status"], job["status"]))
        self.assertIn("cleanup", run["reason"])

    def test_missing_tools_parse_and_cleanup_failures_remain_partial_with_useful_output(self):
        for tasks in (
            [{"id": "discovery", "tool": "nmap", "status": "tool_missing", "reason": "Executable missing"}],
            [
                {
                    "id": "http",
                    "tool": "http",
                    "status": "completed",
                    "parse_status": "failed",
                    "parse_error": "malformed tool output",
                }
            ],
        ):
            with patch(
                "app.scanning.execution.execute_command",
                side_effect=self.executor(status="partial", tasks=tasks, executed=False),
            ):
                run, job = self.wait(self.service.start(self.request))
            self.assertEqual(("partial", "partial"), (run["status"], job["status"]))
            self.assertTrue(run["summary"]["problems"])

        def cleanup_failure(profile):
            profile["run"].update(status="partial", error="Cleanup failed", cleanup_failed=True)
            profile["cleanup"] = {"success": False, "errors": ["owned scratch remains"]}

        with patch("app.scanning.execution.execute_command", side_effect=self.executor(mutate=cleanup_failure)):
            run, _ = self.wait(self.service.start(self.request))
        self.assertEqual("partial", run["status"])
        self.assertIn("Cleanup failed", run["reason"])

    def test_queued_duplicate_and_cancellation_never_launch_the_child(self):
        other = self.hub.create("Queued switch fixture")["project"]
        self.hub.open(self.project["id"])
        gate = threading.Event()
        self.addCleanup(gate.set)
        blocker = self.runtime.jobs.start("fixture-blocker", lambda: (gate.wait(5), {})[1], exclusive=True)
        deadline = time.monotonic() + 2
        while self.runtime.jobs.get_job(blocker["id"])["status"] != "running" and time.monotonic() < deadline:
            time.sleep(0.01)
        with patch("app.scanning.execution.execute_command") as launch:
            run = self.service.start(self.request)
            self.assertEqual(run["id"], self.service.start(self.request)["id"])
            with self.assertRaises(RuntimeError):
                self.hub.open(other["id"])
            self.runtime.stop_job(run["job_id"])
            self.assertEqual("cancelled", self.service.list()["runs"][0]["status"])
            launch.assert_not_called()
        gate.set()
        from app.web.jobs import WebJobManager

        self.runtime.jobs = WebJobManager()
        self.assertEqual("cancelled", self.service.list()["runs"][0]["status"])

    def test_timeout_and_interruption_retain_partial_evidence(self):
        def timeout(runtime, **kwargs):
            parent = Path(kwargs["argv"][-1]).parent
            (parent / "profile/raw").mkdir(parents=True)
            (parent / "profile/raw/discovery.stdout").write_text("Synthetic partial discovery")
            return ExecutionResult(False, "failed: timeout", 0, {"exit_code": -9, "network": {"status": "ready"}})

        with patch("app.scanning.execution.execute_command", side_effect=timeout):
            run, job = self.wait(self.service.start(self.request))
        self.assertEqual(("partial", "partial"), (run["status"], job["status"]))
        self.assertIn("timeout", run["reason"])
        self.assertFalse(run["profile_path"])

        def interrupted(profile):
            profile["run"].update(interrupted=True, status="partial", error="Interrupted; evidence retained")

        with patch(
            "app.scanning.execution.execute_command", side_effect=self.executor(mutate=interrupted, executed=False)
        ):
            run, job = self.wait(self.service.start(self.request))
        self.assertEqual(("cancelled", "cancelled"), (run["status"], job["status"]))
        self.assertTrue(run["profile_path"])

    def test_missing_network_configuration_is_rejected_before_output_or_job(self):
        self.hub.networks.save(self.project["id"], NetworkUpdate(expected_revision=1, settings={}))
        with self.assertRaises(NetworkHeld):
            self.service.start(self.request.model_copy(update={"expected_revision": 2}))
        self.assertFalse(self.service.folder().exists())

    def test_stale_queued_revision_is_held_before_any_child_launch(self):
        gate = threading.Event()
        self.addCleanup(gate.set)
        self.runtime.jobs.start("revision-blocker", lambda: (gate.wait(5), {})[1], exclusive=True)
        with patch("app.scanning.execution.execute_command") as launch:
            run = self.service.start(self.request)
            self.hub.networks.save(
                self.project["id"], NetworkUpdate(expected_revision=1, settings=self.context["settings"])
            )
            gate.set()
            _, job = self.wait(run)
            self.assertEqual("held", job["status"])
            launch.assert_not_called()

    def test_changed_bundle_while_queued_is_held_before_any_child_launch(self):
        from app.scanning.source import scanner_source

        source, identity = scanner_source()
        gate, entered = threading.Event(), threading.Event()
        self.addCleanup(gate.set)
        self.runtime.jobs.start("bundle-blocker", lambda: (entered.set(), gate.wait(5), {})[-1], exclusive=True)
        self.assertTrue(entered.wait(1))
        with (
            patch("app.scanning.service.scanner_source", return_value=(source, identity)) as bundle,
            patch("app.scanning.execution.execute_command") as launch,
        ):
            run = self.service.start(self.request)
            self.assertEqual(identity, run["source_identity"])
            self.assertEqual(identity, self.runtime.jobs.get_job(run["job_id"])["payload"]["source_identity"])
            bundle.return_value = (source, {**identity, "settings.py": {"sha256": "0" * 64, "bytes": 1}})
            gate.set()
            _, job = self.wait(run)
            self.assertEqual("held", job["status"])
            launch.assert_not_called()

    def test_evidence_links_and_duplicate_source_import_are_validated(self):
        output = self.root / "profile"
        document = write_profile(output)
        identity = document["source_identity"]
        _, digest, _ = validate_profile(output, self.request.target_ip, identity)
        with self.assertRaises(ValueError):
            validate_profile(output, "192.0.2.99", identity)
        self.assertTrue(
            repository.save(
                self.logic.activeProject, "fixture", self.host_id, self.request.target_ip, digest, {"id": "fixture"}
            )
        )
        self.assertFalse(
            repository.save(
                self.logic.activeProject, "fixture", self.host_id, self.request.target_ip, digest, {"id": "fixture"}
            )
        )
        path = output / "raw/nmap.xml"
        data = path.read_bytes()
        path.unlink()
        path.symlink_to(self.root / "external.xml")
        (self.root / "external.xml").write_bytes(data)
        with self.assertRaises(ValueError):
            validate_profile(output, self.request.target_ip, identity)

    def test_api_rejects_extra_commands_and_other_projects(self):
        other = self.hub.create("Other fixture")["project"]
        web = create_app(self.runtime)
        legacy = web
        legacy.state.project_hub = self.hub
        client = TestClient(web)
        url = f"/api/hub/projects/{self.project['id']}/deep-scans"
        self.assertEqual(409, client.get(url).status_code)
        self.assertEqual(422, client.post(url, json={**self.request.model_dump(), "command": "id"}).status_code)
        self.assertEqual(409, client.post(url, json=self.request.model_dump()).status_code)
        self.assertEqual(200, client.get(f"/api/hub/projects/{other['id']}/deep-scans").status_code)
