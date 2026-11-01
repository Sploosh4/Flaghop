import argparse
import base64
from contextlib import redirect_stdout
import http.server
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MODULE = importlib.util.spec_from_file_location("ctf_profiler", ROOT / "ctf_profiler.py")
profiler = importlib.util.module_from_spec(MODULE)
MODULE.loader.exec_module(profiler)
FIXTURE = (ROOT / "tests/fixtures/single-target.xml").read_bytes()
TARGET = "192.0.2.10"


class ProfilerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ctf-profiler-test-")
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def args(self, *extra):
        args = profiler.argument_parser().parse_args([
            TARGET, "--out", str(self.root / "run"), *extra,
        ])
        args.workspace = "ctf-test"
        return args

    def runner(self, **kwargs):
        output = self.root / "raw-output"
        output.mkdir()
        (output / "raw").mkdir()
        return profiler.Runner(output, profiler.inventory(), **kwargs)

    def test_target_and_port_validation(self):
        for invalid in ("192.0.2.0/24", "example.com", "-Pn", "192.0.2.1;id",
                        "0.0.0.0", "224.0.0.1", "255.255.255.255", "fe80::1%eth0"):
            with self.subTest(invalid=invalid), self.assertRaises(argparse.ArgumentTypeError):
                profiler.single_ip(invalid)
        self.assertEqual(profiler.single_ip("2001:db8::10"), "2001:db8::10")
        self.assertEqual(profiler.port_selection("22,80,8000-8100"), "22,80,8000-8100")
        for invalid in ("0", "65536", "100-1", "22 --script vuln"):
            with self.subTest(invalid=invalid), self.assertRaises(argparse.ArgumentTypeError):
                profiler.port_selection(invalid)

    def test_nmap_scope_and_completion_validation(self):
        parsed = profiler.parse_nmap(FIXTURE, TARGET)
        self.assertEqual(len(parsed["services"]), 4)
        self.assertEqual(parsed["os_candidates"][0]["nmap_match_accuracy"], "93")
        for broken in (
            FIXTURE.replace(b"192.0.2.10", b"192.0.2.11"),
            FIXTURE.replace(b'exit="success"', b'exit="error"'),
            FIXTURE.replace(b"</nmaprun>", b'<host><address addr="192.0.2.11" addrtype="ipv4"/></host></nmaprun>'),
            FIXTURE.replace(b"<hostnames>", b'<address addr="192.0.2.11" addrtype="ipv4"/><hostnames>'),
            FIXTURE.replace(b"<hostnames>", b'<host><address addr="192.0.2.11" addrtype="ipv4"/></host><hostnames>'),
            FIXTURE.replace(b"<!DOCTYPE nmaprun>", b'<!DOCTYPE nmaprun [<!ENTITY x "test">]>'),
            b"<nmaprun>",
        ):
            with self.subTest(), self.assertRaises((ValueError, ET.ParseError)):
                profiler.parse_nmap(broken, TARGET)

    def test_conditional_plan_uses_services_not_port_numbers(self):
        parsed = profiler.parse_nmap(FIXTURE, TARGET)
        plans, omitted = profiler.plan_followups(self.args(), parsed)
        identifiers = {p["id"] for p in plans}
        self.assertEqual(identifiers, {
            "smb", "ssh-2222", "http-8080", "whatweb-8080",
            "http-8443", "whatweb-8443", "tls-8443", "dns",
        })
        self.assertEqual(omitted, [])
        self.assertIn("skip_reason", next(p for p in plans if p["id"] == "dns"))
        http = next(p for p in plans if p["id"] == "http-8443")
        self.assertNotIn("--location", http["command"])
        self.assertEqual(http["command"][1], "--disable")
        self.assertIn("--noproxy", http["command"])
        whatweb = next(p for p in plans if p["tool"] == "whatweb")
        self.assertIn("--follow-redirect=never", whatweb["command"])
        tls = next(p for p in plans if p["tool"] == "tls")
        self.assertIn("none", tls["command"])
        self.assertNotIn("-U", tls["command"])
        # A closed service must not trigger any follow-up.
        parsed["services"][1]["state"] = "closed"
        plans, _ = profiler.plan_followups(self.args(), parsed)
        self.assertNotIn("ssh-2222", {p["id"] for p in plans})

    def test_unidentified_tls_checks_http_but_known_tls_application_does_not(self):
        parsed = profiler.parse_nmap(FIXTURE, TARGET)
        service = next(s for s in parsed["services"] if s["port"] == 8443)
        service["fingerprint"]["name"] = "unknown"
        plans, _ = profiler.plan_followups(self.args(), parsed)
        ids = {p["id"] for p in plans}
        self.assertTrue({"http-8443", "whatweb-8443", "tls-8443"}.issubset(ids))
        whatweb = next(p for p in plans if p["id"] == "whatweb-8443")
        self.assertEqual(whatweb["requires"], "http-8443")
        for name in ("imap", "smtp", "ldap"):
            service["fingerprint"]["name"] = name
            plans, _ = profiler.plan_followups(self.args(), parsed)
            ids = {p["id"] for p in plans}
            self.assertIn("tls-8443", ids)
            self.assertNotIn("http-8443", ids)

    def test_service_budget_and_explicit_dns(self):
        plans, omitted = profiler.plan_followups(
            self.args("--max-services", "1", "--dns-server", "192.0.2.53"),
            profiler.parse_nmap(FIXTURE, TARGET),
        )
        self.assertEqual(omitted, ["tcp/2222", "tcp/8080", "tcp/8443"])
        dns = next(p for p in plans if p["tool"] == "dns")
        self.assertIn("@192.0.2.53", dns["command"])
        self.assertNotIn("skip_reason", dns)

    def test_nmap_root_fallback_and_literal_target(self):
        args = self.args("--ports", "22,8080")
        spec = profiler.nmap_task(args, {"nmap": "/usr/bin/nmap"}, False)
        self.assertIn("-sT", spec["command"])
        self.assertNotIn("-O", spec["command"])
        self.assertIn("-n", spec["command"])
        self.assertEqual(spec["command"][-1], TARGET)
        spec = profiler.nmap_task(args, {"nmap": "/usr/bin/nmap"}, True)
        self.assertIn("-O", spec["command"])

    def test_runner_timeout_and_output_limit(self):
        runner = self.runner()
        spec = profiler.task(
            "timeout", "test", [sys.executable, "-c", "import time; time.sleep(10)"],
            "unit test", 0.1,
        )
        result = runner.execute(spec)
        self.assertEqual(result["status"], "timed_out")
        self.assertLess(result["duration_seconds"], 2)
        spec = profiler.task(
            "limit", "test", [sys.executable, "-c", "print('x'*10000)"],
            "unit test", 2, stdout_limit=128,
        )
        result = runner.execute(spec)
        self.assertEqual(result["status"], "output_limit")
        self.assertEqual((runner.output / result["stdout"]).stat().st_size, 128)

    def test_runner_missing_dependency(self):
        runner = self.runner()
        runner.tools["whatweb"] = None
        result = runner.execute(profiler.task("missing", "whatweb", ["whatweb"], "unit", 1))
        self.assertEqual(result["status"], "tool_missing")

    def test_child_environment_drops_credentials_and_proxies(self):
        with patch.dict(os.environ, {
            "HTTPS_PROXY": "http://outside.invalid", "BASICAUTH": "user:secret",
            "RUBYOPT": "bad options", "NMAPDIR": "/unexpected",
        }):
            env = profiler.child_environment()
        self.assertNotIn("HTTPS_PROXY", env)
        self.assertNotIn("BASICAUTH", env)
        self.assertNotIn("RUBYOPT", env)
        self.assertNotIn("NMAPDIR", env)

    def test_offline_never_spawns_and_import_is_encoded(self):
        args = self.args("--from-nmap", str(ROOT / "tests/fixtures/single-target.xml"), "--offline")
        with patch.object(profiler.subprocess, "Popen", side_effect=AssertionError("must not spawn")):
            with redirect_stdout(io.StringIO()):
                self.assertEqual(profiler.build(args), 0)
        profile = json.loads((args.out / "device-profile.json").read_text())
        self.assertEqual(profile["run"]["mode"], "offline")
        self.assertEqual(profile["validated_vulnerabilities"], [])
        self.assertIsNone(profile["identity_hypotheses"]["model"]["value"])
        rc = (args.out / "metasploit-import.rc").read_text()
        self.assertEqual(rc.count("<ruby>"), 1)
        self.assertEqual(rc.count("</ruby>"), 1)
        self.assertNotIn("run_single", rc)
        encoded = re.findall(r"Base64.strict_decode64\('([^']*)'\)", rc)
        self.assertEqual(json.loads(base64.b64decode(encoded[0])), profile)
        self.assertEqual(base64.b64decode(encoded[1]), FIXTURE)
        self.assertEqual(base64.b64decode(encoded[2]), b"ctf-test")

    def test_dry_run_never_spawns(self):
        args = self.args("--dry-run", "--from-nmap", str(ROOT / "tests/fixtures/single-target.xml"))
        with patch.object(profiler.subprocess, "Popen", side_effect=AssertionError("must not spawn")):
            with redirect_stdout(io.StringIO()):
                self.assertEqual(profiler.build(args), 0)
        data = json.loads((args.out / "device-profile.json").read_text())
        self.assertEqual(data["run"]["status"], "dry_run")
        self.assertIn("planned", data["task_summary"])

    def test_output_directory_is_never_overwritten(self):
        out = self.root / "run"
        out.mkdir()
        sentinel = out / "important.txt"
        sentinel.write_text("keep")
        with self.assertRaises(FileExistsError):
            profiler.build(self.args("--dry-run"))
        self.assertEqual(sentinel.read_text(), "keep")

    def test_invalid_import_leaves_no_output_directory(self):
        bad = self.root / "bad.xml"
        bad.write_bytes(FIXTURE.replace(b"192.0.2.10", b"192.0.2.11"))
        with self.assertRaises(ValueError):
            profiler.build(self.args("--from-nmap", str(bad), "--offline"))
        self.assertFalse((self.root / "run").exists())

    @unittest.skipUnless(shutil.which("curl"), "curl is not installed")
    def test_http_loopback_redirect_is_not_followed(self):
        requests = []

        class Handler(http.server.BaseHTTPRequestHandler):
            def handle(self):
                try:
                    super().handle()
                except (ConnectionResetError, BrokenPipeError):
                    pass  # Expected when a local discovery probe closes early.

            def do_GET(self):
                requests.append(self.path)
                self.send_response(302)
                self.send_header("Location", "/must-not-follow")
                self.send_header("Set-Cookie", "first=one")
                self.send_header("Set-Cookie", "second=two")
                self.end_headers()
                self.wfile.write(b"<title>Local &amp; fixture</title>")

            def log_message(self, *args):
                pass

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            args = self.args()
            args.target = "127.0.0.1"
            service = {
                "services": [{"port": server.server_port, "protocol": "tcp", "state": "open",
                              "fingerprint": {"name": "http"}}],
            }
            plans, _ = profiler.plan_followups(args, service)
            args.out.mkdir()
            (args.out / "raw").mkdir()
            runner = profiler.Runner(args.out, profiler.inventory())
            result = runner.execute(plans[0])
            observation = profiler.normalise_result(result, args.out)
            self.assertEqual(requests, ["/"])
            self.assertEqual(observation["status_code"], 302)
            self.assertEqual(observation["title"], "Local & fixture")
            self.assertFalse(observation["redirect_followed"])
            self.assertEqual(len([h for h in observation["headers"] if h["name"] == "Set-Cookie"]), 2)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_mocked_complete_pipeline(self):
        """Exercise all adapters; fake tools never open network connections."""
        bin_dir = self.root / "bin"
        bin_dir.mkdir()
        fake = r'''
import base64, json, pathlib, sys
name = pathlib.Path(sys.argv[0]).name
args = sys.argv[1:]
if name == "nmap":
    pathlib.Path(args[args.index("-oX")+1]).write_bytes(FIXTURE)
elif name == "curl":
    pathlib.Path(args[args.index("--dump-header")+1]).write_text(
        "HTTP/1.1 200 OK\r\nServer: synthetic-fixture\r\n\r\n")
    print("<title>Synthetic CTF</title><meta name='generator' content='Fixture CMS'>")
elif name == "whatweb":
    path = next(a.split("=",1)[1] for a in args if a.startswith("--log-json="))
    pathlib.Path(path).write_text(json.dumps([{"plugins":{"HTTPServer":{"string":["synthetic-fixture"]}}}]))
elif name == "testssl.sh":
    pathlib.Path(args[args.index("--jsonfile-pretty")+1]).write_text(
        json.dumps({"scanResult":[{"protocols":[{"id":"TLS1_3","finding":"offered"}]}]}))
elif name == "enum4linux-ng":
    pathlib.Path(args[args.index("-oJ")+1]+".json").write_text(
        json.dumps({"smb_domain_info":{"name":"FIXTURE"},"errors":{"shares":"NT_STATUS_ACCESS_DENIED"}}))
elif name == "ssh-keyscan":
    print("[192.0.2.10]:2222 ssh-ed25519 " + base64.b64encode(b"synthetic public key").decode())
elif name == "dig":
    print("fixture.ctf.invalid.")
'''
        for name in ("nmap", "curl", "whatweb", "testssl.sh", "enum4linux-ng", "ssh-keyscan", "dig"):
            executable = bin_dir / name
            executable.write_text(f"#!{sys.executable}\nFIXTURE = {FIXTURE!r}\n" + fake)
            executable.chmod(0o755)
        with patch.dict(os.environ, {"PATH": str(bin_dir)}), redirect_stdout(io.StringIO()):
            args = self.args("--dns-server", "192.0.2.53")
            self.assertEqual(profiler.build(args), 2)  # SMB reports a restricted check
        data = json.loads((args.out / "device-profile.json").read_text())
        self.assertEqual(data["task_summary"], {"completed": 9})
        self.assertEqual(len(data["observations"]), 8)
        self.assertEqual({o["tool"] for o in data["observations"]},
                         {"http", "whatweb", "tls", "smb", "ssh", "dns"})
        self.assertEqual(next(o for o in data["observations"] if o["tool"] == "ssh")["keys"][0]["algorithm"],
                         "ssh-ed25519")
        self.assertEqual(data["ngfw_features_active"], "unknown")
        self.assertEqual(data["validated_vulnerabilities"], [])
        self.assertEqual(data["run"]["status"], "partial")
        self.assertEqual(
            next(o for o in data["observations"] if o["tool"] == "smb")["access_restrictions"],
            ["NT_STATUS_ACCESS_DENIED"],
        )
        self.assertTrue(all("sha256" in a for a in data["artifacts"]))

    @unittest.skipUnless(shutil.which("nmap") and shutil.which("curl"), "nmap/curl are not installed")
    def test_actual_nmap_and_curl_on_owned_loopback_fixture(self):
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(b"<title>Owned loopback fixture</title>")

            def log_message(self, *args):
                pass

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            args = self.args(
                "--ports", str(server.server_port), "--os-detection", "off",
                "--nmap-timeout", "20", "--tool-timeout", "5",
                "--skip", "whatweb", "--skip", "tls", "--skip", "smb",
                "--skip", "ssh", "--skip", "dns", "--label", "Owned loopback fixture",
            )
            args.target = "127.0.0.1"
            with redirect_stdout(io.StringIO()):
                self.assertEqual(profiler.build(args), 0)
            data = json.loads((args.out / "device-profile.json").read_text())
            self.assertEqual(data["target"]["ip"], "127.0.0.1")
            web_observation = next(o for o in data["observations"] if o["tool"] == "http")
            self.assertEqual(web_observation["title"], "Owned loopback fixture")
            self.assertEqual(data["nmap"]["scan_coverage"][0]["numservices"], "1")
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_interruption_retains_readable_partial_profile(self):
        args = self.args("--from-nmap", str(ROOT / "tests/fixtures/single-target.xml"), "--offline")
        with patch.object(profiler, "run_staged", side_effect=KeyboardInterrupt), redirect_stdout(io.StringIO()):
            self.assertEqual(profiler.build(args), 2)
        data = json.loads((args.out / "device-profile.json").read_text())
        self.assertTrue(data["run"]["interrupted"])
        self.assertEqual(data["run"]["status"], "partial")
        self.assertIn("unfinished_work", data["run"])
        self.assertIn("error", data["run"])
        self.assertTrue(data["artifacts"])

    def test_corrupt_optional_json_is_visible(self):
        runner = self.runner()
        artifact = runner.output / "raw/bad.json"
        artifact.write_text("not JSON")
        result = {
            "id": "whatweb-80", "tool": "whatweb", "port": 80,
            "status": "completed", "json_artifact": str(artifact),
        }
        self.assertIsNone(profiler.normalise_result(result, runner.output))
        self.assertEqual(result["parse_status"], "failed")
        self.assertIn("parse_error", result)


if __name__ == "__main__":
    unittest.main()
