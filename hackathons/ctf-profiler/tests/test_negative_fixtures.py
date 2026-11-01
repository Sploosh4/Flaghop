"""Corrected owned fixtures must not reproduce the three lab weaknesses."""
import html
import http.server
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.parse import parse_qs, urlsplit

from ctf_profiler import Runner, inventory, task
from scope_proxy import TargetProxy
from staged_workflow import validate_boolean, validate_browser, validate_git
from workspace import Workspace


class NegativeFixtureTests(unittest.TestCase):
    def setUp(self):
        confirmed = self.confirmed = []
        self.calls = []
        outer = self

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                parsed = urlsplit(self.path)
                query = parse_qs(parsed.query, keep_blank_values=True)
                if parsed.path == "/.git/config":
                    body, status = "not a Git configuration\n", 404
                elif parsed.path == "/item":
                    # Parameterised fixture: attacker syntax never reaches SQL.
                    body, status = "<html><body>Demo item</body></html>", 200
                elif parsed.path == "/echo":
                    value = html.escape(query.get("q", [""])[0], quote=True)
                    body, status = f"<html><body><div>{value}</div></body></html>", 200
                else:
                    body, status = "not found", 404
                payload = body.encode()
                self.send_response(status)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def log_message(self, *_):
                pass

        self.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_port
        self.temp = tempfile.TemporaryDirectory(prefix="negative-fixtures-")
        self.addCleanup(self.temp.cleanup)
        self.workspace = Workspace.create("negative")
        self.addCleanup(self.workspace.cleanup)
        self.addCleanup(self._stop_server)
        self.output = Path(self.temp.name)
        (self.output / "raw").mkdir()
        self.runner = Runner(self.output, inventory(), workspace=self.workspace)

    def _stop_server(self):
        if getattr(self, "server", None) is not None:
            self.server.shutdown()
            self.server.server_close()
        if getattr(self, "thread", None) is not None:
            self.thread.join(timeout=1)
            self.assertFalse(self.thread.is_alive(), "fixture server thread survived cleanup")

    def execute(self, identifier, tool, stage, command, trigger, artifact=None, format="jsonl", **extra):
        spec = task(identifier, tool, command, trigger, 20, stage=stage, **extra)
        if artifact:
            spec.update(watch=[str(artifact)], result_artifact=str(artifact.relative_to(self.output)), format=format)
        result = self.runner.execute(spec)
        self.calls.append(result)
        return result, []

    def test_corrected_fixtures_reproduce_zero_findings(self):
        base = f"http://127.0.0.1:{self.port}"
        with TargetProxy("127.0.0.1", {self.port}) as proxy:
            result, _ = self.execute(
                "verify-git-negative", "http", 5,
                ["curl", "--disable", "--silent", "--show-error", "--proxy", proxy.url,
                 "--noproxy", "", "--proto", "=http,https", "--insecure", "--connect-timeout", "5",
                 "--max-time", "10", "--dump-header", str(self.output / "raw" / "git.headers"),
                 "--url", base + "/.git/config"],
                "negative Git fixture", port=self.port, stdout_limit=262144)
            self.assertEqual(result["status"], "completed")
            validate_git(base, self.port, self.output / "raw", self.execute, self.confirmed.append,
                         proxy.url)

            url = base + "/item?id=1"
            validate_boolean(url, "id", self.port, 0, self.output / "raw", self.execute,
                             self.confirmed.append, proxy.url, "raw/fake-sqlmap.stdout",
                             "fake-sqlmap")

            validate_browser(base + "/echo?q=hello", "q", self.port, 1,
                             self.output / "raw", self.execute, self.confirmed.append,
                             proxy.url, "fake-dalfox", workspace=self.workspace)

        self.assertEqual(self.confirmed, [], self.confirmed)
        for prefix in ("verify-git-", "verify-sql-", "browser-xss-"):
            observed = [call for call in self.calls if call["id"].startswith(prefix)]
            self.assertTrue(observed, "validator was not actually exercised: " + prefix)
            self.assertTrue(all(call["status"] == "completed" for call in observed), str(observed))
        git_calls = [call for call in self.calls if call["id"].startswith("verify-git-")]
        self.assertTrue(git_calls[0]["command"].count("http://127.0.0.1:" + str(self.port) + "/.git/config") == 1)
        report = os.environ.get("NEGATIVE_FIXTURE_REPORT")
        if report:
            Path(report).write_text(json.dumps({
                "fixture": "corrected negative fixture",
                "target": base,
                "reproduced_findings": self.confirmed,
                "count": len(self.confirmed),
                "checks": {
                    "git_config_not_reproduced": True,
                    "sql_injection_not_reproduced": True,
                    "reflected_xss_not_reproduced": True,
                },
            }, indent=2) + "\n")


if __name__ == "__main__":
    unittest.main()
