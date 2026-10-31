"""Project/job/import regressions with synthetic evidence and no network launches."""

import json
import os
from pathlib import Path
import tempfile
import threading
import time
from unittest import TestCase
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.api import create_app
from app.processes.models import ExecutionResult
from app.scanning import repository
from app.scanning.contracts import DeepScanRequest
from app.scanning.profile import validate_profile
from app.scanning.service import DeepScans
from app.services.network_models import NetworkUpdate
from app.services.project_hub import ProjectHub
from app.services.project_networks import NetworkHeld
from app.web import create_app as create_legacy_app
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from db.entities.host import hostObj
from tests.app.test_ProjectNetworks import FixtureProbe
from tests.support.scanner_fixture import write_profile


class DeepScansTest(TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.env = patch.dict(
            os.environ, {"LEGION_HOME": str(self.root / "config"), "LEGION_PROJECTS_DIR": str(self.root / "projects")}
        )
        self.env.start()
        self.logic = create_default_logic()
        self.runtime = WebRuntime(self.logic)
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
            if mutate:
                mutate(profile)
                (output / "device-profile.json").write_text(json.dumps(profile))
            return ExecutionResult(
                executed, reason, 0, {"exit_code": 0 if executed else 2, "network": {"status": "ready"}}
            )

        return execute

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
        ]
        for mutation in mutations:
            with (
                self.subTest(mutation=mutation),
                patch("app.scanning.execution.execute_command", side_effect=self.executor(mutate=mutation)),
            ):
                run, _ = self.wait(self.service.start(self.request))
                self.assertEqual("failed", run["status"])
                self.assertTrue((Path(self.project["folder"]) / run["directory"] / "profile/raw/nmap.xml").is_file())
                self.assertFalse(repository.summaries(self.logic.activeProject))

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

    def test_api_both_stacks_reject_extra_commands_and_other_projects(self):
        other = self.hub.create("Other fixture")["project"]
        for web in (create_app(self.runtime), create_legacy_app(self.runtime)):
            legacy = web if hasattr(web, "test_client") else web.state.legacy
            legacy.extensions["project_hub"] = self.hub
            client = web.test_client() if hasattr(web, "test_client") else TestClient(web)
            url = f"/api/hub/projects/{self.project['id']}/deep-scans"
            self.assertEqual(409, client.get(url).status_code)
            self.assertEqual(422, client.post(url, json={**self.request.model_dump(), "command": "id"}).status_code)
            self.assertEqual(409, client.post(url, json=self.request.model_dump()).status_code)
            self.assertEqual(200, client.get(f"/api/hub/projects/{other['id']}/deep-scans").status_code)
