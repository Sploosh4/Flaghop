"""Workspace identity, durable controls, and read-only derived-result boundaries."""

import hashlib
import json
import os
from pathlib import Path
import tempfile
import threading
import time
from types import SimpleNamespace
from unittest import TestCase
from fastapi.testclient import TestClient
from app.api import create_app
from app.services.project_background import ProjectBackground, atomic_json
from app.services.project_files import ProjectFiles


class ProjectBackgroundTest(TestCase):

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.records = {}
        for identifier in ("a", "b"):
            folder = self.root / identifier
            folder.mkdir()
            self.records[identifier] = {"id": identifier, "folder": str(folder)}
            atomic_json(folder / "reader-control.json", {"running": False})

        def record(identifier):
            if identifier not in self.records:
                raise KeyError("Project not found.")
            return self.records[identifier]

        self.hub = SimpleNamespace(lock=threading.RLock(), _record=record)

    def service(self, identifier="a"):
        return ProjectBackground(self.hub, identifier)

    def heartbeat(self, identifier="a", **changes):
        folder = self.root / identifier / ".reader-state"
        folder.mkdir(exist_ok=True)
        atomic_json(
            folder / "worker-status.json",
            {
                "project_id": identifier,
                "heartbeat_at": time.time(),
                "available": True,
                "engines": ["cipher", "password"],
                **changes,
            },
        )

    def result_fixture(self, identifier="a", data=b"actual saved evidence"):
        folder = self.root / identifier
        content = hashlib.sha256(data).hexdigest()
        directory = folder / "ciphey/artifacts"
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / (content + ".bin")
        path.write_bytes(data)
        atomic_json(
            folder / "reader-report.json",
            {
                "nodes": [{"id": content, "status": "done", "size": len(data)}],
                "edges": [{"parent": "input", "child": content, "kind": "base64"}],
                "sources": [{"id": "version1", "path": "original.txt", "sha256": "source-hash"}],
                "provenance": [{"source": "version1", "node": content}],
            },
        )
        return content, path

    def test_controls_require_live_enrollment_and_preserve_other_workspace(self):
        with self.assertRaisesRegex(RuntimeError, "No live reader"):
            self.service().control(True)
        for changes in ({"available": False}, {"project_id": "b"}, {"heartbeat_at": time.time() - 60}):
            self.heartbeat(**changes)
            self.assertFalse(self.service().status()["worker"]["available"])
        self.heartbeat()
        self.service().control(True)
        self.assertFalse(self.service("b").status()["running"])
        self.service().control(False)
        self.assertFalse(self.service().status()["running"])
        self.assertEqual("unsupported", self.service().status()["observed_state"])
        self.assertFalse(self.service().status()["running"])

    def test_reader_service_rejects_malformed_origin_fields_before_presentation(self):
        from pydantic import ValidationError

        self.result_fixture()
        path = self.root / "a/reader-report.json"
        report = json.loads(path.read_text())
        report["sources"][0]["origin"] = {
            "sha256": "source-hash",
            "path": "fixture.txt",
            "transport": {"invalid": True},
        }
        atomic_json(path, report)
        with self.assertRaises(ValidationError):
            self.service().status()

    def test_reads_do_not_create_controls_or_resume_legacy_workspaces(self):
        path = self.root / "a/reader-control.json"
        path.unlink()
        self.assertTrue(self.service().status()["running"])
        self.assertFalse(path.exists())
        self.assertFalse(self.service().status()["worker"]["available"])

    def test_results_keep_original_provenance_and_dismiss_does_not_delete(self):
        identifier, path = self.result_fixture()
        alert = self.service().status()["alerts"][0]
        self.assertEqual("original.txt", alert["origins"][0]["path"])
        result = self.service().result(identifier)
        self.assertEqual("YWN0dWFsIHNhdmVkIGV2aWRlbmNl", result["data_b64"])
        self.service().dismiss(identifier)
        self.assertEqual([], self.service().status()["alerts"])
        self.assertEqual(b"actual saved evidence", path.read_bytes())
        self.assertEqual(identifier, self.service().result(identifier)["artifact"]["id"])
        self.assertEqual(identifier, self.service().status()["history"][0]["id"])
        with self.assertRaises(KeyError):
            self.service("b").result(identifier)

    def test_historical_application_files_do_not_create_discovery_notifications(self):
        identifier, path = self.result_fixture()
        report_path = self.root / "a/reader-report.json"
        report = json.loads(report_path.read_text())
        for source_path in (
            "workspace.legion",
            "workspace.autosave.legion",
            "workspace-tool-output/legion-passwords.txt",
            "workspace-tool-output/legion-usernames.txt",
            "workspace-tool-output/deep-scans/" + "a" * 32 + "/profile/device-profile.json",
            "workspace-tool-output/deep-scans/" + "a" * 32 + "/request.json",
        ):
            report["sources"][0]["path"] = source_path
            atomic_json(report_path, report)
            value = self.service().status()
            self.assertEqual([], value["alerts"])
            self.assertEqual(identifier, value["history"][0]["id"])
            self.assertEqual("Internal application data", value["history"][0]["history_reason"])
            self.assertEqual(b"actual saved evidence", path.read_bytes())
        report["sources"][0]["path"] = "inputs/received.txt"
        atomic_json(report_path, report)
        self.assertEqual(identifier, self.service().status()["alerts"][0]["id"])
        report["sources"][0]["path"] = (
            "workspace-tool-output/deep-scans/" + "a" * 32 + "/profile/raw/http-found-file.txt"
        )
        atomic_json(report_path, report)
        self.assertEqual(identifier, self.service().status()["alerts"][0]["id"])

    def test_linked_metadata_and_result_paths_are_rejected(self):
        identifier, path = self.result_fixture()
        path.unlink()
        path.symlink_to("/etc/passwd")
        with self.assertRaisesRegex(ValueError, "Linked files"):
            self.service().result(identifier)
        path.unlink()
        control = self.root / "a/reader-control.json"
        control.unlink()
        control.symlink_to(self.root / "b/reader-control.json")
        with self.assertRaisesRegex(ValueError, "Linked files"):
            self.service().control(False)

    def test_hypothesis_files_remain_browsable_without_automatic_alert_noise(self):
        identifier, path = self.result_fixture()
        report_path = self.root / "a/reader-report.json"
        report = json.loads(report_path.read_text())
        report["edges"][0]["kind"] = "hypothesis:reverse"
        atomic_json(report_path, report)
        self.assertEqual([], self.service().status()["alerts"])
        self.assertEqual(identifier, self.service().result(identifier)["artifact"]["id"])
        self.assertTrue(path.exists())

    def test_editor_listing_and_preview_are_project_bounded_without_writes(self):
        path = self.root / "a/original.txt"
        path.write_bytes(b"complete text")
        service = ProjectFiles(self.hub, "a")
        before = path.stat()
        self.assertEqual("original.txt", service.listing(str(self.root / "a"))["entries"][0]["name"])
        self.assertFalse(service.preview(str(path))["truncated"])
        self.assertEqual(before.st_mtime_ns, path.stat().st_mtime_ns)
        for outside in [str(self.root / "b/reader-control.json"), str(self.root / "a/../b/reader-control.json")]:
            with self.assertRaises(ValueError):
                service.preview(outside)
        fifo = self.root / "a/pipe"
        os.mkfifo(fifo)
        with self.assertRaisesRegex(ValueError, "ordinary files"):
            service.preview(str(fifo))

    def test_native_routes_have_project_scoping_and_strict_controls(self):
        identifier, _ = self.result_fixture()
        app = create_app()
        legacy = app
        legacy.state.project_hub = self.hub
        with TestClient(app) as client:
            base = "/api/hub/projects/a"
            get = lambda url: client.get(base + url)
            response = get("/background")
            self.assertEqual(200, response.status_code)
            value = response.json()
            self.assertEqual("a", value["project_id"])
            self.assertEqual(422, client.post(base + "/background/control", json={"running": "false"}).status_code)
            self.assertEqual(200, client.post(base + "/background/control", json={"running": False}).status_code)
            self.assertEqual(200, get("/background/results/" + identifier).status_code)
            self.assertEqual(404, client.get("/api/hub/projects/b/background/results/" + identifier).status_code)
            self.assertEqual(200, get("/filesystem").status_code)
            self.assertEqual(200, get("/editor").status_code)
            self.assertEqual(200, get("/filesystem/api/session").status_code)
