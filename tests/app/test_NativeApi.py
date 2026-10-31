"""Contract, compatibility and WebSocket checks for the native migration slice."""

import json
from pathlib import Path
import threading
import unittest
from fastapi.testclient import TestClient
from app.api import create_app
from app.services.events import EventStream
from tests.app.test_WebApp import DummyRuntime


class FixtureRuntime(DummyRuntime):
    def __init__(self):
        super().__init__()
        self.events = EventStream()

    def rename_project(self, name, expected_path=""):
        if expected_path and expected_path != self.project["name"]:
            raise RuntimeError("The active workspace changed.")
        self.project["display_name"] = name
        self.events.emit("overview")
        return dict(self.project)

    def get_job(self, job_id):
        try:
            return next(job for job in self.jobs if job["id"] == job_id)
        except StopIteration:
            raise KeyError(f"Unknown job id: {job_id}")


class NativeApiTest(unittest.TestCase):
    def setUp(self):
        self.runtime = FixtureRuntime()
        self.app = create_app(self.runtime, config={"LEGION_WS_EVENT_HEARTBEAT_SECONDS": 0.02})
        self.client = TestClient(self.app, raise_server_exceptions=False)
        self.addCleanup(self.client.close)

    def test_native_health_project_and_snapshot_preserve_existing_shapes(self):
        for path in ("/health", "/api/project", "/api/snapshot", "/api/jobs"):
            response = self.client.get(path)
            self.assertEqual(200, response.status_code, response.text)
            self.assertEqual("fastapi", response.headers["X-Legion-API"])
        snapshot = self.client.get("/api/snapshot").json()
        self.assertEqual(self.runtime.project, snapshot["project"])
        self.assertEqual(self.runtime.jobs, snapshot["jobs"])
        self.assertIn("hosts", snapshot)
        self.assertIn("scheduler", snapshot)

    def test_workspace_rename_is_validated_and_preserves_expected_path_guard(self):
        response = self.client.post(
            "/api/project/rename", json={"name": " Fixture workspace ", "expected_path": self.runtime.project["name"]}
        )
        self.assertEqual(200, response.status_code, response.text)
        self.assertEqual("Fixture workspace", response.json()["project"]["display_name"])
        self.assertIn("no-store", response.headers["Cache-Control"])
        response = self.client.post("/api/project/rename", json={"name": "Other", "expected_path": "changed.legion"})
        self.assertEqual(409, response.status_code)
        self.assertEqual("Fixture workspace", self.runtime.project["display_name"])

    def test_invalid_rename_payloads_fail_before_modifying_workspace(self):
        before = dict(self.runtime.project)
        for payload in (
            {"name": ""},
            {"name": " "},
            {"name": 42},
            {"name": "x" * 121},
            {"name": "bad\nname"},
            {"name": "Valid", "unexpected": True},
        ):
            with self.subTest(payload=payload):
                response = self.client.post("/api/project/rename", json=payload)
                self.assertEqual(422, response.status_code, response.text)
                self.assertEqual("error", response.json()["status"])
        self.assertEqual(before, self.runtime.project)

    def test_jobs_validate_limits_and_return_not_found(self):
        self.assertEqual(422, self.client.get("/api/jobs?limit=invalid").status_code)
        self.assertEqual(422, self.client.get("/api/jobs?limit=501").status_code)
        self.assertEqual(404, self.client.get("/api/jobs/999").status_code)
        self.assertEqual(422, self.client.post("/api/jobs/0/stop").status_code)
        response = self.client.post("/api/jobs/1/stop")
        self.assertEqual(200, response.status_code, response.text)
        self.assertEqual("cancelled", response.json()["job"]["status"])

    def test_all_routes_and_static_ui_are_native(self):
        response = self.client.get("/api/projects")
        self.assertEqual(200, response.status_code, response.text)
        self.assertIn("projects", response.json())
        self.assertEqual("fastapi", response.headers["X-Legion-API"])
        self.assertEqual(200, self.client.get("/").status_code)
        self.assertEqual(200, self.client.get("/static/bundles/workspace.js").status_code)

    def test_generated_openapi_contract_is_current_and_runtime_free(self):
        schema = create_app().openapi()
        recorded = json.loads((Path(__file__).resolve().parents[2] / "frontend/openapi.json").read_text())
        self.assertEqual(recorded, schema)
        self.assertIn("RenameProject", schema["components"]["schemas"])
        self.assertEqual("renameProject", schema["paths"]["/api/project/rename"]["post"]["operationId"])

    def test_websocket_receives_thread_events_while_http_remains_responsive(self):
        with self.client.websocket_connect("/ws/snapshot") as socket:
            worker = threading.Thread(target=lambda: self.runtime.events.emit("jobs", "overview"))
            worker.start()
            worker.join()
            messages = [socket.receive_json() for _ in range(2)]
            event = next(item for item in messages if item["type"] == "invalidate")
            self.assertEqual(["jobs", "overview"], event["channels"])
            self.assertEqual(200, self.client.get("/health").status_code)
        self.assertEqual(0, len(self.runtime.events._listeners))

    def test_websocket_merges_buffered_events_and_cleans_up_idle_connection(self):
        for _ in range(20):
            self.runtime.events.emit("jobs")
        self.runtime.events.emit("hosts")
        with self.client.websocket_connect("/ws/snapshot") as socket:
            event = socket.receive_json()
            self.assertEqual(21, event["seq"])
            self.assertEqual(["hosts", "jobs"], event["channels"])
            heartbeat = socket.receive_json()
            self.assertEqual("heartbeat", heartbeat["type"])
        self.assertEqual(0, len(self.runtime.events._listeners))

    def test_out_of_order_thread_notifications_do_not_lose_channels(self):
        original = self.runtime.events.subscribe
        first_entered = threading.Event()
        release_first = threading.Event()

        def delayed_subscription(listener):
            def notify(payload):
                if payload["seq"] == 1:
                    first_entered.set()
                    release_first.wait(2)
                listener(payload)

            return original(notify)

        self.runtime.events.subscribe = delayed_subscription
        with self.client.websocket_connect("/ws/snapshot") as socket:
            first = threading.Thread(target=lambda: self.runtime.events.emit("hosts"))
            first.start()
            try:
                self.assertTrue(first_entered.wait(1))
                self.runtime.events.emit("jobs")
                event = socket.receive_json()
                for _ in range(10):
                    if event["type"] != "heartbeat":
                        break
                    event = socket.receive_json()
                self.assertEqual(["hosts", "jobs"], event["channels"])
                self.assertEqual(2, event["seq"])
            finally:
                release_first.set()
                first.join(timeout=2)

    def test_workspace_bundle_download_streams_through_asgi(self):
        import io
        import zipfile

        response = self.client.get("/api/project/download-zip")
        self.assertEqual(200, response.status_code)
        self.assertIn("attachment", response.headers["Content-Disposition"])
        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            self.assertIsNone(archive.testzip())
            self.assertTrue(any(name.endswith("manifest.json") for name in archive.namelist()))
