import json
from pathlib import Path
import tempfile
import threading
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.api import create_app
from app.contracts.actions.tool_updates import ToolUpdateEntry, ToolUpdateRequest
from app.services.tool_updates import ToolUpdates
from app.web.jobs import WebJobManager


class ToolUpdatesTests(unittest.TestCase):
    def test_contract_rejects_unknown_controls_and_invalid_states(self):
        for payload in [{"command": "untrusted"}, {"retry_failed": "true"}]:
            with self.assertRaises(ValidationError):
                ToolUpdateRequest.model_validate(payload)
        with self.assertRaises(ValidationError):
            ToolUpdateEntry(name="john", status="guessed")

    def test_failure_in_middle_does_not_hide_later_success(self):
        with tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            (root / "scripts").mkdir()
            (root / "scripts/security-tools.py").write_text(
                "RELEASES = {'first': None, 'broken': None, 'last': None}\n"
            )
            events = [
                {"name": "first", "status": "current"},
                {"name": "broken", "status": "failed", "error": "fixture download failure"},
                {"name": "last", "status": "updated"},
            ]
            wrapper = root / "scripts/update-security-tools.sh"
            wrapper.write_text(
                "#!/bin/sh\n" + "\n".join("echo 'TOOL_EVENT " + json.dumps(e) + "'" for e in events) + "\nexit 1\n"
            )
            runtime = SimpleNamespace(jobs=SimpleNamespace(is_cancel_requested=lambda _: False))
            service = ToolUpdates(runtime, root=root)
            result = service.run(["first", "broken", "last"])
            self.assertEqual(result.status, "partial")
            rows = {row["name"]: row for row in result.result["tools"]}
            self.assertEqual(rows["broken"]["status"], "failed")
            self.assertEqual(rows["last"]["status"], "updated")
            self.assertFalse(service.snapshot()["running"])

    def test_api_queues_one_batch_and_rejects_overlap(self):
        jobs = WebJobManager()
        runtime = SimpleNamespace(_lock=threading.RLock(), jobs=jobs)
        service = ToolUpdates(runtime)
        runtime.tool_updates = service
        client = TestClient(create_app(runtime), raise_server_exceptions=False)
        release = threading.Event()
        selected = []

        def fake_run(names):
            selected.extend(names)
            release.wait(5)
            for name in names:
                service.apply_event({"name": name, "status": "current"})
            with service.lock:
                service.state["running"] = False
            return service.snapshot()

        try:
            with patch.object(service, "run", side_effect=fake_run):
                self.assertEqual(client.get("/api/settings/tool-updates").status_code, 200)
                self.assertFalse(selected)
                self.assertEqual(client.post("/api/settings/tool-updates", json={}).status_code, 202)
                self.assertEqual(client.post("/api/settings/tool-updates", json={}).status_code, 409)
                release.set()
                end = time.monotonic() + 5
                while service.snapshot()["running"] and time.monotonic() < end:
                    time.sleep(0.01)
                self.assertEqual(selected, service.names)
                service.apply_event({"name": "john", "status": "failed", "error": "fixture"})
                selected.clear()
                self.assertEqual(
                    client.post("/api/settings/tool-updates", json={"retry_failed": True}).status_code, 202
                )
                end = time.monotonic() + 5
                while service.snapshot()["running"] and time.monotonic() < end:
                    time.sleep(0.01)
                self.assertEqual(selected, ["john"])
        finally:
            release.set()
            jobs.shutdown()
