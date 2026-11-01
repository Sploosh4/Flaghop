"""Every mutation rejects malformed input before services, not just one Nmap route."""

import json
import re
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from fastapi.testclient import TestClient
from app.api import create_app


class ActionBoundaryTest(unittest.TestCase):
    def test_shipped_javascript_form_payloads_validate_against_the_actual_route_models(self):
        root = Path(__file__).resolve().parents[2]
        node = shutil.which("node") or next((str(path) for path in (root / ".tools").glob("node-*/bin/node")), None)
        if not node or not (root / "frontend/node_modules/happy-dom").is_dir():
            self.skipTest("Install the existing frontend test dependencies to exercise real form handlers.")
        from tests.app.test_WebApp import DummyRuntime
        from unittest.mock import patch

        with (
            tempfile.TemporaryDirectory(dir=root / ".tmp") as folder,
            patch.dict(os.environ, {"LEGION_HOME": str(Path(folder) / "config")}),
        ):
            app = create_app(DummyRuntime())
            with TestClient(app) as client:
                response = client.get("/")
                self.assertEqual(200, response.status_code)
            page = Path(folder) / "forms.html"
            page.write_text(response.text)
            receipt = subprocess.run(
                [node, str(root / "tests/support/ui_action_payloads.mjs"), str(page)],
                cwd=root,
                capture_output=True,
                text=True,
                timeout=15,
            )
            self.assertEqual(0, receipt.returncode, receipt.stderr[-2000:])
            calls = json.loads(receipt.stdout)

            def route_tree(routes):
                for route in routes:
                    yield route
                    included = getattr(route, "original_router", None)
                    if included is not None:
                        yield from route_tree(included.routes)

            routes = {route.path: route for route in route_tree(app.routes) if "POST" in getattr(route, "methods", {})}
            covered = set()
            for call in calls:
                with self.subTest(url=call["url"], payload=call["payload"]):
                    route = routes[call["url"]]
                    _, errors = route.dependant.body_params[0].validate(call["payload"], loc=("body",))
                    self.assertFalse(errors, errors)
                    covered.add(call["url"])
            self.assertEqual(
                {"easy", "hard", "rfc1918_discovery", "passive_capture"},
                {call["payload"]["scan_mode"] for call in calls if "scan_mode" in call["payload"]},
            )
            self.assertTrue(
                {
                    "/api/project/open",
                    "/api/project/save-as",
                    "/api/nmap/import-xml",
                    "/api/workspace/tools/run",
                    "/api/scheduler/run",
                    "/api/settings/display",
                    "/api/settings/tool-audit/install",
                    "/api/graph/layouts",
                    "/api/graph/annotations",
                    "/api/workspace/ports/delete",
                    "/api/workspace/services/delete",
                    "/api/scheduler/preferences",
                }
                <= covered
            )

    def test_every_json_mutation_has_named_input_and_output_shapes(self):
        schema = create_app().openapi()
        for path, operations in schema["paths"].items():
            for verb, operation in operations.items():
                if verb not in {"post", "put", "patch", "delete"}:
                    continue
                with self.subTest(path=path, verb=verb):
                    body = operation.get("requestBody", {}).get("content", {})
                    if path not in {"/api/project/restore-zip", "/api/hub/restore-zip"}:
                        self.assertIn("application/json", body)
                        self.assertIn("$ref", body["application/json"]["schema"])
                    responses = [data for code, data in operation["responses"].items() if code in {"200", "201", "202"}]
                    self.assertTrue(responses)
                    for response in responses:
                        shape = response.get("content", {}).get("application/json", {}).get("schema", {})
                        self.assertTrue("$ref" in shape or "anyOf" in shape, shape)

    def test_every_json_mutation_rejects_bad_roots_and_unknown_fields_before_service_work(self):
        app = create_app(SimpleNamespace())
        mutations = [
            (path, verb)
            for path, operations in app.openapi()["paths"].items()
            for verb in operations
            if verb in {"post", "put", "patch", "delete"}
            and path not in {"/api/project/restore-zip", "/api/hub/restore-zip"}
        ]
        with TestClient(app, raise_server_exceptions=False) as client:
            for path, verb in mutations:
                for payload in (True, [], None, {"unexpected_contract_probe": 1}):
                    with self.subTest(path=path, verb=verb, payload=payload):
                        url = re.sub(r"\{[^}]+\}", "1", path)
                        result = client.request(
                            verb, url, content=json.dumps(payload), headers={"Content-Type": "application/json"}
                        )
                        self.assertEqual(422, result.status_code, result.text[:300])

    def test_nmap_legacy_scalars_are_explicit_and_malformed_values_do_not_invoke_runtime(self):
        calls = []
        runtime = SimpleNamespace(
            start_nmap_scan_job=lambda **kwargs: (
                calls.append(kwargs) or {"id": 1, "type": "nmap-scan", "status": "queued"}
            )
        )
        with TestClient(create_app(runtime)) as client:
            for payload in (
                True,
                {"discovery": "not-a-boolean"},
                {"targets": ["192.0.2.10"], "unexpected": 1},
                {"staged": []},
                {"scan_options": {"service_detection": "bad"}},
            ):
                self.assertEqual(422, client.post("/api/nmap/scan", json=payload).status_code)
            self.assertEqual([], calls)
            response = client.post(
                "/api/nmap/scan",
                json={
                    "targets": ["192.0.2.10"],
                    "discovery": "false",
                    "scan_mode": "easy",
                    "scan_options": {"service_detection": "true", "top_ports": "100"},
                },
            )
            self.assertEqual(202, response.status_code, response.text)
        self.assertFalse(calls[0]["discovery"])
        self.assertEqual({"service_detection": True, "top_ports": 100}, calls[0]["scan_options"])

    def test_invalid_service_result_is_rejected_instead_of_bypassing_response_validation(self):
        runtime = SimpleNamespace(
            start_nmap_scan_job=lambda **kwargs: {"id": "bad", "type": "scan", "status": "queued"}
        )
        with TestClient(create_app(runtime), raise_server_exceptions=False) as client:
            self.assertEqual(500, client.post("/api/nmap/scan", json={"targets": ["192.0.2.10"]}).status_code)

    def test_required_tool_fields_and_passive_ui_mode_are_part_of_the_canonical_contract(self):
        from app.contracts.actions.tool_requests import ToolRunRequest
        from pydantic import ValidationError

        schema = ToolRunRequest.model_json_schema()
        self.assertEqual({"host_ip", "port", "tool_id"}, set(schema["required"]))
        with self.assertRaises(ValidationError):
            ToolRunRequest.model_validate({})
        calls = []
        runtime = SimpleNamespace(
            start_passive_capture_scan_job=lambda **kwargs: (
                calls.append(kwargs) or {"id": 2, "type": "passive-capture-scan", "status": "queued"}
            )
        )
        with TestClient(create_app(runtime)) as client:
            body = {
                "interface_name": "owned-fixture0",
                "duration_minutes": 15,
                "run_actions": False,
                "scan_mode": "passive_capture",
            }
            response = client.post("/api/scan/passive-capture", json=body)
            self.assertEqual(202, response.status_code, response.text)
            body["scan_mode"] = "arbitrary-mode"
            self.assertEqual(422, client.post("/api/scan/passive-capture", json=body).status_code)
        self.assertEqual(1, len(calls))
