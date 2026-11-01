import http.client
import http.server
import json
from pathlib import Path
import tempfile
import threading
import unittest

from scope_proxy import TargetProxy
from staged_workflow import (annotate_stages, fetch_api, in_scope, metasploit_checks,
                             normalise_dalfox, normalise_fingerprintx,
                             parse_result_artifact, replace_query)


class StageTests(unittest.TestCase):
    def test_url_scope_rejects_credentials_names_and_other_ports(self):
        self.assertTrue(in_scope("http://127.0.0.2:18080/item?id=1", "127.0.0.2", {18080}))
        self.assertTrue(in_scope("https://[::1]:18443/", "::1", {18443}))
        for url in ["http://127.0.0.3:18080/", "http://localhost:18080/", "http://127.0.0.2:53/",
                    "http://user:pass@127.0.0.2:18080/", "file:///etc/passwd", "http://127.0.0.2:99999/"]:
            self.assertFalse(in_scope(url, "127.0.0.2", {18080}), url)

    def test_proxy_blocks_offtarget_and_redirect_destinations(self):
        hits = []
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                hits.append(self.path)
                self.send_response(302)
                self.send_header("Location", "http://127.0.0.1:1/private")
                self.end_headers()
            def log_message(self, *_):
                pass
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with TargetProxy("127.0.0.1", {server.server_port}) as proxy:
                for url, expected in [(f"http://127.0.0.1:{server.server_port}/", 302),
                                      ("http://127.0.0.1:1/private", 403),
                                      (f"http://127.0.0.2:{server.server_port}/", 403),
                                      (f"http://localhost:{server.server_port}/", 403)]:
                    connection = http.client.HTTPConnection("127.0.0.1", proxy.server.server_port)
                    connection.request("GET", url)
                    response = connection.getresponse()
                    self.assertEqual(response.status, expected)
                    response.read()
                    connection.close()
                connection = http.client.HTTPConnection("127.0.0.1", proxy.server.server_port)
                connection.request("CONNECT", "example.invalid:443")
                self.assertEqual(connection.getresponse().status, 403)
                connection.close()
                self.assertEqual(hits, ["/"])
                self.assertEqual(len(proxy.blocked), 4)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_query_replacement_preserves_other_inputs(self):
        url = replace_query("http://127.0.0.2:18080/item?id=1&mode=view#frag", "id", "1 AND 1=2")
        self.assertIn("mode=view", url)
        self.assertNotIn("#", url)
        self.assertIn("id=1+AND+1%3D2", url)

    def test_api_rejects_external_refs_and_rewrites_servers(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory)
            valid = {"openapi": "3.0.3", "servers": [{"url": "http://offtarget.invalid"}], "paths": {"/items": {"servers": [{"url": "http://other.invalid"}], "get": {"servers": [{"url": "http://third.invalid"}]}}}}
            response_file = raw / "response"
            header_file = raw / "api-definition-18080.headers"
            header_file.write_text("HTTP/1.1 200 OK\r\n\r\n")
            def execute(*args, **kwargs):
                response_file.write_text(json.dumps(valid))
                return {"status": "completed", "stdout": "response"}, []
            # curl_request resolves stdout against raw.parent.
            raw = raw / "raw"
            raw.mkdir()
            (raw / header_file.name).write_text(header_file.read_text())
            path = fetch_api("http://127.0.0.2:18080/openapi.json", "http://127.0.0.2:18080/", 18080, raw, execute, "http://127.0.0.1:1")
            self.assertIsNotNone(path)
            scoped = json.loads(path.read_text())
            self.assertEqual(scoped["servers"], [{"url": "http://127.0.0.2:18080"}])
            self.assertNotIn("servers", scoped["paths"]["/items"])
            valid["components"] = {"schemas": {"X": {"$ref": "http://other.invalid/spec.json"}}}
            self.assertIsNone(fetch_api("http://127.0.0.2:18080/openapi.json", "http://127.0.0.2:18080/", 18080, raw, execute, "http://127.0.0.1:1"))

    def test_metasploit_requires_exact_reviewed_product_mapping(self):
        skipped = []
        def never(*args, **kwargs):
            self.fail("A check must not run without eligible evidence")
        for banner in ["SimpleHTTP/0.6 Python/3.14", "Apache/2.4.51", "Apache/2.4.499"]:
            profile = {"observations": [{"tool": "http", "port": 80, "headers": [{"name": "Server", "value": banner}]}]}
            metasploit_checks("http://127.0.0.2/", 80, profile, Path("/unused"), never, lambda *a: skipped.append(a))
        self.assertEqual(len(skipped), 3)

    def test_fingerprintx_installed_output_contract(self):
        row = {"ip": "127.0.0.2", "port": 18443, "protocol": "https", "tls": True,
               "transport": "tcp", "version": "SimpleHTTP/0.6 Python/3.14.4",
               "metadata": {"statusCode": 200, "technologies": ["SimpleHTTP:0.6"]}}
        parsed = normalise_fingerprintx([row])
        self.assertEqual(parsed[0]["service"], "https")
        self.assertEqual(parsed[0]["port"], 18443)
        self.assertTrue(parsed[0]["tls"])
        with self.assertRaises(ValueError):
            normalise_fingerprintx([{"ip": "127.0.0.2"}])
        with self.assertRaises(ValueError):
            normalise_fingerprintx([])

    def test_dalfox_exit_and_incomplete_outcomes(self):
        finding = {"findings": [{"type": "V", "param": "q"}],
                   "meta": {"incomplete": False, "findings_count": 1}}
        result = {"status": "completed", "exit_code": 1}
        normalise_dalfox(result, [finding])
        self.assertEqual(result["status"], "completed")
        clean = {"findings": [], "meta": {"incomplete": False, "findings_count": 0}}
        result = {"status": "completed", "exit_code": 1}
        normalise_dalfox(result, [clean])
        self.assertEqual(result["status"], "failed")
        self.assertIn("without a structured finding", result["reason"])
        incomplete = {"findings": [], "meta": {"incomplete": True, "findings_count": 0}}
        result = {"status": "completed", "exit_code": 0}
        normalise_dalfox(result, [incomplete])
        self.assertEqual(result["status"], "failed")
        self.assertIn("incomplete", result["reason"])
        with self.assertRaises(ValueError):
            normalise_dalfox({"status": "completed", "exit_code": 1}, [])

    def test_artifact_parser_empty_success_and_failures(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory)
            empty = raw / "empty.jsonl"
            empty.write_text("")
            result = {"status": "completed", "exit_code": 0}
            self.assertEqual(parse_result_artifact(result, "nuclei", empty, raw, "jsonl"), [])
            self.assertEqual(result["parse_status"], "completed")
            result = {"status": "completed", "exit_code": 0}
            parse_result_artifact(result, "fingerprintx", empty, raw, "jsonl")
            self.assertEqual(result["parse_status"], "failed")
            malformed = raw / "bad.json"
            malformed.write_text("not-json")
            result = {"status": "completed", "exit_code": 0}
            parse_result_artifact(result, "nuclei", malformed, raw, "json")
            self.assertEqual(result["parse_status"], "failed")
            missing = raw / "missing.json"
            result = {"status": "completed", "exit_code": 0}
            parse_result_artifact(result, "httpx", missing, raw, "jsonl")
            self.assertEqual(result["parse_status"], "failed")

    def test_stage_summary_keeps_candidates_out_of_validation(self):
        profile = {"tasks": [{"id": "discovery", "tool": "nmap", "status": "supplied"},
                             {"id": "nuclei", "tool": "nuclei", "stage": 4, "status": "completed"},
                             {"id": "sqlmap", "tool": "sqlmap", "stage": 5, "status": "skipped"}],
                   "observations": [], "assessment_findings": [{"status": "candidate"}], "validated_vulnerabilities": []}
        annotate_stages(profile)
        self.assertEqual([s["number"] for s in profile["stages"]], [1, 2, 3, 4, 5])
        self.assertEqual(profile["stages"][3]["status"], "completed")
        self.assertEqual(profile["stages"][4]["status"], "not_run")
        self.assertEqual(profile["validated_vulnerabilities"], [])


if __name__ == "__main__":
    unittest.main()
