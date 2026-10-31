"""Profiler-specific argv/proxy rules and bounded process lifecycle; no network probes."""

from dataclasses import replace
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
import time
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import MagicMock, patch

from app.processes.models import CommandRequest, ExecutionPorts
from app.processes.runner import ProcessRunner
from app.scanning.listener import listener_owned
from app.scanning.worker import proxy_adapter
from app.services.network_guard import NetworkLease
from app.services.network_models import NetworkUpdate
from app.services.project_networks import ProjectNetworks, NetworkHeld
from app.web.runtime_process_control import signal_process_tree
from tests.app.test_ProjectNetworks import FixtureHub, FixtureProbe
from tests.app.test_WebRuntimeKillHandling import _DummyProcessRepo


class ScannerGuardTest(TestCase):
    def test_proxy_handshake_preserves_single_target_forwarding(self):
        import http.client
        import http.server
        import importlib.util
        from app.scanning.source import BUNDLE
        from app.services.project_background import atomic_json

        spec = importlib.util.spec_from_file_location("fixture_scope_proxy", BUNDLE / "scope_proxy.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        class Target(http.server.BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass

            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-Length", "5")
                self.end_headers()
                self.wfile.write(b"owned")

        server = http.server.ThreadingHTTPServer(("127.0.0.2", 0), Target)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        channel = self.root / "handshake.json"
        token = "test-owned-scan"
        messages, stop = [], threading.Event()

        def acknowledge():
            last = ""
            while not stop.is_set():
                if channel.exists():
                    message = json.loads(channel.read_text())
                    if message["sequence"] != last:
                        messages.append(message)
                        last = message["sequence"]
                        atomic_json(channel.with_suffix(".ack"), {"token": token, "sequence": last})
                time.sleep(0.01)

        ack = threading.Thread(target=acknowledge, daemon=True)
        ack.start()
        try:
            with proxy_adapter(channel, token, module.TargetProxy)("127.0.0.2", [server.server_port]) as proxy:
                port = proxy.server.server_port
                connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                connection.request("GET", f"http://127.0.0.2:{server.server_port}/")
                response = connection.getresponse()
                self.assertEqual(200, response.status)
                self.assertEqual(b"owned", response.read())
                connection.close()
                connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                connection.request("GET", f"http://127.0.0.1:{server.server_port}/")
                response = connection.getresponse()
                self.assertEqual(403, response.status)
                response.read()
                connection.close()
            self.assertEqual(["open", "close"], [message["operation"] for message in messages])
            self.assertTrue(all(message["port"] == port and message["token"] == token for message in messages))
        finally:
            stop.set()
            ack.join(timeout=2)
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.hub = FixtureHub(self.root)
        self.network = ProjectNetworks(self.hub, FixtureProbe())
        self.network.save(
            "a",
            NetworkUpdate(
                expected_revision=0,
                settings={
                    "name": "Fixture",
                    "scope_source": "Synthetic",
                    "allowed_targets": ["192.0.2.0/24"],
                    "interface": "ctf0",
                },
            ),
        )
        self.request = CommandRequest(
            "device-profile",
            "Deep scan",
            "192.0.2.7",
            "",
            "tcp",
            "display-only",
            "",
            10,
            argv=(sys.executable, "-c", "print('fixture')"),
            network_targets=("192.0.2.7",),
            proxy_channel=str(self.root / "proxy.json"),
            proxy_token="fixture-token",
        )

    def lease(self):
        lease = NetworkLease(self.network, self.request)
        lease.reference = self.network.capture()
        lease.snapshot = self.network.inspect(lease.reference, [self.request.host_ip])
        lease.gid, lease.table = 1000000001, "flaghop_fixture"
        return lease

    def test_scope_rules_are_single_target_with_only_an_owned_proxy_loopback_set(self):
        rules = self.lease().rules()
        self.assertIn("daddr 192.0.2.7/32", rules)
        self.assertNotIn("daddr 192.0.2.0/24", rules)
        self.assertIn("tcp dport @scan_proxy", rules)
        self.assertIn("tcp sport @scan_proxy ct state established", rules)
        self.assertIn('meta oifname "lo" ip saddr 127.0.0.1 ip daddr 127.0.0.1', rules)
        self.assertIn("targets counter drop", rules)

    def test_guarded_argv_uses_no_command_interpolation(self):
        lease = self.lease()
        with patch("app.services.network_guard.executable", side_effect=lambda name: f"/fixture/{name}"):
            argv = lease.argv()
        self.addCleanup(lease.hosts_folder.cleanup)
        self.assertEqual(list(self.request.argv), argv[-3:])
        self.assertNotIn("display-only", argv)
        self.assertIn("--no-new-privs", argv)
        self.assertNotIn("-E", argv)
        self.assertLess(argv.index("--no-new-privs"), argv.index("/fixture/env"))
        self.assertIn("NMAP_UNPRIVILEGED=1", argv)
        self.assertTrue(any(value.startswith("PATH=") for value in argv))

    def test_proxy_registration_requires_token_port_and_listener_group_and_is_revoked(self):
        lease = self.lease()
        message = {"token": "wrong", "sequence": "1" * 32, "operation": "open", "port": 34567}
        path = Path(self.request.proxy_channel)
        path.write_text(json.dumps(message))
        with self.assertRaises(NetworkHeld):
            lease.sync_proxy()
        message["token"] = self.request.proxy_token
        path.write_text(json.dumps(message))
        with patch("app.services.network_guard.command", side_effect=RuntimeError("not owned")):
            with self.assertRaisesRegex(NetworkHeld, "private group"):
                lease.sync_proxy()
        with (
            patch("app.services.network_guard.command", return_value="") as command,
            patch("app.services.network_guard.executable", return_value="/fixture/nft"),
        ):
            lease.sync_proxy()
            self.assertIn("listener.py", command.call_args_list[0].args[0][2])
            self.assertIn("34567", command.call_args_list[1].kwargs["input"])
            self.assertEqual(message["sequence"], json.loads(path.with_suffix(".ack").read_text())["sequence"])
            message.update(sequence="2" * 32, operation="close")
            path.write_text(json.dumps(message))
            lease.sync_proxy()
            self.assertEqual("flush set inet flaghop_fixture scan_proxy\n", command.call_args.kwargs["input"])

    def test_malformed_linked_and_blocking_proxy_messages_never_reach_privileged_helpers(self):
        import os

        lease = self.lease()
        path = Path(self.request.proxy_channel)
        valid = {"token": self.request.proxy_token, "sequence": "a" * 32, "operation": "open", "port": 34567}
        malformed = [
            "[1,2]",
            "not json",
            "x" * 2049,
            json.dumps({**valid, "port": True}),
            json.dumps({**valid, "sequence": "!" * 32}),
            json.dumps({**valid, "operation": "exec", "command": "ignored"}),
        ]
        with patch("app.services.network_guard.command") as privileged:
            for value in malformed:
                path.write_text(value)
                with self.subTest(value=value[:60]), self.assertRaises(NetworkHeld):
                    lease.sync_proxy()
            path.unlink()
            outside = self.root / "outside.json"
            outside.write_text(json.dumps(valid))
            path.symlink_to(outside)
            with self.assertRaises(NetworkHeld):
                lease.sync_proxy()
            path.unlink()
            os.mkfifo(path)
            with self.assertRaises(NetworkHeld):
                lease.sync_proxy()
            path.unlink()
            os.link(outside, path)
            with self.assertRaises(NetworkHeld):
                lease.sync_proxy()
            privileged.assert_not_called()

    def test_listener_proof_checks_real_group_and_socket_inode(self):
        proc = self.root / "proc"
        (proc / "net").mkdir(parents=True)
        (proc / "net/tcp").write_text("header\n0: 0100007F:8707 00000000:0000 0A 0 0 0 1000 0 12345\n")
        pid = proc / "123"
        (pid / "fd").mkdir(parents=True)
        (pid / "status").write_text("Gid:\t1000000001\t1000000001\t1000000001\t1000000001\n")
        (pid / "fd/4").symlink_to("socket:[12345]")
        self.assertTrue(listener_owned(1000000001, 34567, proc))
        self.assertFalse(listener_owned(1000000002, 34567, proc))
        self.assertFalse(listener_owned(1000000001, 34568, proc))

    def ports(self, argv):
        repo = _DummyProcessRepo()
        guard = SimpleNamespace(prepare=lambda: argv, verify=lambda: None, close=lambda: None, report=None)
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
            signal_process_tree=signal_process_tree,
            unregister_job_process=MagicMock(),
            update_process_progress=MagicMock(),
            write_process_output_partial=MagicMock(),
            network_guard=guard,
        )

    def test_real_child_output_is_bounded_and_timeout_reaps_it(self):
        argv = [sys.executable, "-c", "print('x'*100000)"]
        runner = ProcessRunner(self.ports(argv))
        result = runner.run(replace(self.request, argv=tuple(argv), output_limit=1000))
        self.assertTrue(result.executed)
        self.assertLess(len("".join(runner.state.output_parts)), 1100)
        self.assertIn("truncated", "".join(runner.state.output_parts))
        argv = [sys.executable, "-c", "import time; time.sleep(20)"]
        runner = ProcessRunner(self.ports(argv))
        result = runner.run(replace(self.request, argv=tuple(argv), hard_timeout=1))
        self.assertFalse(result.executed)
        self.assertIn("timeout", result.reason)
        self.assertIsNotNone(runner.state.proc.poll())

    def test_guarded_child_has_own_process_group_and_preserves_authentication_session(self):
        argv = [sys.executable, "-c", "import os,json; print(json.dumps([os.getpid(),os.getpgrp(),os.getsid(0)]))"]
        runner = ProcessRunner(self.ports(argv))
        result = runner.run(replace(self.request, argv=tuple(argv)))
        self.assertTrue(result.executed)
        pid, group, session = json.loads("".join(runner.state.output_parts))
        self.assertEqual(pid, group)
        self.assertEqual(os.getsid(0), session)
