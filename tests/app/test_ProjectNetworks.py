"""Network scope and execution tests use deterministic observations, never connected targets."""

import ipaddress
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import threading
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from app.services.network_models import NetworkCheckRequest, NetworkUpdate
from app.services.project_networks import NetworkHeld, ProjectNetworks
from app.services.network_guard import NetworkLease
from app.processes.models import CommandRequest
from app.processes.models import ExecutionPorts
from app.processes.runner import ProcessRunner
from unittest.mock import MagicMock


class FixtureHub:
    def __init__(self, root):
        self.lock = threading.RLock()
        self.path = Path(root) / "settings.json"
        self.path.write_text(
            json.dumps(
                {
                    "projects": [
                        {"id": "a", "path": "/fixture/a.legion", "managed": True, "connector": "networkmanager"},
                        {"id": "b", "path": "/fixture/b.legion", "managed": True, "connector": "wireguard"},
                    ]
                }
            )
        )
        self.active = "/fixture/a.legion"
        self.runtime = SimpleNamespace(
            _lock=self.lock,
            get_project_details=lambda: {"name": self.active},
            _require_active_project=lambda: True,
            jobs=SimpleNamespace(get_job=lambda _: None),
        )

    def _read(self):
        return json.loads(self.path.read_text())

    def _write(self, value):
        self.path.write_text(json.dumps(value))

    def _record(self, identifier):
        return next(row for row in self._read()["projects"] if row["id"] == identifier)

    def list(self):
        return {"projects": self._read()["projects"]}


class FixtureProbe:
    iface = "ctf0"
    source = "192.0.2.1"
    outcome = "connected"

    def resolve(self, value):
        if value == "target.test":
            return ["192.0.2.7/32"]
        return [str(ipaddress.ip_network(value, strict=False))]

    def interface(self, _):
        return {"ifindex": 4, "ifname": self.iface, "address": "fixture", "addr_info": []}

    def profile(self, connector, prefs):
        return prefs.profile_id or "local"

    def route(self, address):
        return {"destination": address, "interface": self.iface, "source": self.source, "gateway": ""}

    def tcp(self, *_):
        return self.outcome


class ProjectNetworksTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        # Unit fixtures inspect argv/rules without executing helpers. Optional host
        # packages belong to runtime availability and real-tunnel acceptance tests.
        helpers = patch("app.services.network_guard.executable", side_effect=lambda name: f"/fixture/bin/{name}")
        helpers.start()
        self.addCleanup(helpers.stop)
        self.hub = FixtureHub(self.temp.name)
        self.probe = FixtureProbe()
        self.service = ProjectNetworks(self.hub, self.probe)
        self.settings = {
            "name": "Fixture event",
            "scope_source": "Synthetic fixture",
            "allowed_targets": ["192.0.2.0/24"],
            "interface": "ctf0",
        }
        self.service.save("a", NetworkUpdate(expected_revision=0, settings=self.settings))

    def test_read_does_not_probe_and_settings_are_isolated(self):
        with patch.object(self.probe, "route", side_effect=AssertionError("No probes on read")):
            self.assertTrue(self.service.get("a")["configured"])
            self.assertFalse(self.service.get("b")["configured"])
        reloaded = ProjectNetworks(self.hub, self.probe)
        self.assertEqual(self.settings["allowed_targets"], reloaded.get("a")["settings"]["allowed_targets"])
        with self.assertRaises(RuntimeError):
            reloaded.save("a", NetworkUpdate(expected_revision=0, settings=self.settings))

    def test_exclusion_overrides_range_and_subnet_expansion(self):
        self.settings["exclusions"] = ["192.0.2.7"]
        self.service.save("a", NetworkUpdate(expected_revision=1, settings=self.settings))
        reference = self.service.capture()
        for target in ("192.0.2.7", "192.0.2.0/24", "198.51.100.1", "target.test"):
            with self.subTest(target=target), self.assertRaises(NetworkHeld):
                self.service.inspect(reference, [target])
        self.service.inspect(reference, ["192.0.2.8"])

    def test_wrong_route_and_changed_source_hold_work(self):
        reference = self.service.capture()
        snapshot = self.service.inspect(reference, ["192.0.2.7"])
        self.probe.source = "192.0.2.2"
        with self.assertRaises(NetworkHeld):
            self.service.verify(snapshot)
        self.probe.iface = "home0"
        report = self.service.check("a", NetworkCheckRequest(target="192.0.2.7"))
        self.assertEqual("held", report["status"])
        self.assertIn("home0", report["reason"])

    def test_project_switch_and_revision_change_invalidate_running_snapshot(self):
        reference = self.service.capture()
        snapshot = self.service.inspect(reference, ["192.0.2.7"])
        self.service.save("a", NetworkUpdate(expected_revision=1, settings=self.settings))
        with self.assertRaises(NetworkHeld):
            self.service.verify(snapshot)
        # A queued job revalidates its targets against the latest revision of its original project.
        self.assertEqual(2, self.service.inspect(reference, ["192.0.2.7"])["reference"]["revision"])
        self.hub.active = "/fixture/b.legion"
        with self.assertRaises(NetworkHeld):
            self.service.inspect(reference, ["192.0.2.7"])

    def test_no_response_is_not_reported_as_host_down(self):
        self.probe.outcome = "no_response"
        report = self.service.check("a", NetworkCheckRequest(target="192.0.2.7", port=80))
        self.assertEqual("no_response", report["status"])
        self.assertEqual("no_response", report["services"][0]["outcome"])

    def test_firewall_is_installed_before_guarded_command_and_restricts_both_families(self):
        self.settings.update(
            allowed_targets=["192.0.2.0/24", "2001:db8::/64"], allowed_ports=[80], exclusions=["192.0.2.9"]
        )
        self.service.save("a", NetworkUpdate(expected_revision=1, settings=self.settings))
        request = CommandRequest("fixture", "Fixture", "192.0.2.7", "80", "tcp", "fixture-command", "", 5)
        lease = NetworkLease(self.service, request)
        calls = []

        def run(argv, **kwargs):
            calls.append((argv, kwargs))
            return ""

        with (
            patch("app.services.network_guard.command", side_effect=run),
            patch.object(lease, "_unused_gid", return_value=1000000001),
        ):
            argv = lease.prepare()
        if lease.hosts_folder:
            lease.hosts_folder.cleanup()
        script = next(kwargs["input"] for _, kwargs in calls if kwargs.get("input"))
        self.assertIn("meta oif != 4 counter drop", script)
        self.assertIn("ip daddr 192.0.2.9/32 drop", script)
        self.assertIn("th dport { 80 }", script)
        self.assertTrue(script.rstrip().endswith("targets counter drop"))
        self.assertIn("--no-new-privs", argv)
        self.assertIn("--bounding-set=-all", argv)
        self.assertIn("--clear-groups", argv)

    def test_no_command_is_returned_if_enforcement_installation_fails(self):
        request = CommandRequest("fixture", "Fixture", "192.0.2.7", "", "tcp", "fixture", "", 5)
        lease = NetworkLease(self.service, request)
        with patch("app.services.network_guard.command", side_effect=RuntimeError("No administrative access")):
            with self.assertRaises(NetworkHeld):
                lease.prepare()
        self.assertFalse(lease.installed)
        self.assertEqual("held", self.service.get("a")["recent_checks"][-1]["status"])

    def process_ports(self, guard):
        from tests.app.test_WebRuntimeKillHandling import _DummyProcessRepo

        repo = _DummyProcessRepo()
        return ExecutionPorts(
            repository=lambda: repo,
            registry=SimpleNamespace(lock=threading.RLock(), active={}, kill_requests=set()),
            jobs=None,
            collect_command_artifacts=lambda _: [],
            emit_ui_invalidation=MagicMock(),
            process_progress_adapter_for_command=lambda *_: "",
            process_tree_activity_changed=MagicMock(),
            register_job_process=MagicMock(),
            resolve_process_timeout_policy=lambda *_: {},
            sample_process_tree_activity=MagicMock(),
            signal_process_tree=MagicMock(),
            unregister_job_process=MagicMock(),
            update_process_progress=MagicMock(),
            write_process_output_partial=MagicMock(),
            network_guard=guard,
        )

    def test_common_process_boundary_does_not_spawn_out_of_scope_commands(self):
        request = CommandRequest("fixture", "Fixture", "198.51.100.7", "80", "tcp", "fixture", "", 5)
        guard = NetworkLease(self.service, request)
        with patch("app.processes.runner.subprocess.Popen") as spawn:
            result = ProcessRunner(self.process_ports(guard)).run(request)
        spawn.assert_not_called()
        self.assertFalse(result.executed)
        self.assertTrue(result.reason.startswith("held:"))
        self.assertEqual("held", result.metadata["network"]["status"])

    def test_monitor_stops_a_running_command_when_its_path_changes(self):
        from tests.app.test_WebRuntimeKillHandling import _RunningProc

        request = CommandRequest("fixture", "Fixture", "192.0.2.7", "80", "tcp", "fixture", "", 5)
        guard = NetworkLease(self.service, request)

        def changed():
            guard.block("Route changed")
            raise NetworkHeld("held: Route changed")

        with (
            patch("app.services.network_guard.command", return_value=""),
            patch.object(guard, "_unused_gid", return_value=1000000001),
            patch.object(guard, "verify", side_effect=changed),
            patch.object(guard, "close") as cleanup,
            patch("app.processes.runner.subprocess.Popen", return_value=_RunningProc()),
        ):
            result = ProcessRunner(self.process_ports(guard)).run(request)
        cleanup.assert_called_once()
        if guard.hosts_folder:
            guard.hosts_folder.cleanup()
        self.assertFalse(result.executed)
        self.assertIn("held: Route changed", result.reason)

    def test_job_binding_and_missing_network_hold_do_not_block_offline_jobs(self):
        from app.web.jobs import WebJobManager
        from app.web.runtime_jobs import start_job

        runtime = self.hub.runtime
        runtime.jobs = WebJobManager()
        runtime.project_networks = self.service
        done = threading.Event()
        job = start_job(runtime, "tool-run", lambda job_id: {"id": job_id, "done": done.set()})
        self.assertTrue(done.wait(2))
        self.assertEqual("a", job["payload"]["network_context"]["project_id"])
        self.hub.active = "/fixture/b.legion"
        should_not_run = MagicMock()
        held = start_job(runtime, "tool-run", should_not_run)
        deadline = __import__("time").monotonic() + 2
        while runtime.jobs.get_job(held["id"])["status"] in {"queued", "running"}:
            if __import__("time").monotonic() > deadline:
                self.fail("Job did not settle")
            __import__("time").sleep(0.01)
        self.assertEqual("held", runtime.jobs.get_job(held["id"])["status"])
        should_not_run.assert_not_called()
        offline = threading.Event()
        start_job(runtime, "file-analysis", lambda _: {"done": offline.set()})
        self.assertTrue(offline.wait(2))

    def test_native_and_legacy_settings_routes_validate_without_network_work(self):
        from app.api import create_app
        from app.web import create_app as legacy_app

        fake_hub = SimpleNamespace(networks=self.service)
        for stack in ("native", "legacy"):
            app = create_app() if stack == "native" else legacy_app(None)
            (app.state.legacy if stack == "native" else app).extensions["project_hub"] = fake_hub
            client = TestClient(app) if stack == "native" else app.test_client()
            if stack == "native":
                self.addCleanup(client.close)
            get = client.get("/api/hub/projects/a/network")
            self.assertEqual(200, get.status_code)
            invalid = client.put(
                "/api/hub/projects/a/network", json={"expected_revision": 1, "settings": {"interface": "bad;command"}}
            )
            self.assertEqual(422, invalid.status_code)
            wrong = client.post("/api/hub/projects/a/network/check", json={"target": "198.51.100.7"})
            body = wrong.json() if stack == "native" else wrong.get_json()
            self.assertEqual("held", body["status"])
