"""Retained routes and transport boundaries must work without the removed stack."""

import json
import io
import zipfile
from pathlib import Path
import re
import subprocess
import sys
import unittest
import tempfile
from types import SimpleNamespace

from fastapi.testclient import TestClient
from app.api import create_app

ROOT = Path(__file__).resolve().parents[2]


class FastApiOnlyTest(unittest.TestCase):
    def test_every_retained_http_route_is_registered_natively(self):
        expected = json.loads((ROOT / "tests/fixtures/http-route-baseline.json").read_text())
        schema = create_app().openapi()
        canonical = lambda path: re.sub(r"\{[^}]+\}", "{}", path)
        actual = {
            (method.upper(), canonical(path))
            for path, operations in schema["paths"].items()
            for method in operations
            if method in {"get", "post", "put", "patch", "delete"}
        }
        for row in expected:
            if row["path"] != "/":
                self.assertIn((row["method"], canonical(row["path"])), actual, row)

    def test_boot_and_assets_work_when_removed_packages_cannot_import(self):
        code = """
import sys
for name in ('flask', 'werkzeug', 'flask_sock', 'a2wsgi'):
    sys.modules[name] = None
from app.api import create_app
from fastapi.testclient import TestClient
app = create_app()
assert not hasattr(app.state, 'legacy')
with TestClient(app) as client:
    assert client.get('/health').json() == {'status': 'ok'}
    assert client.get('/static/bundles/workspace.js').status_code == 200
print('ASGI only')
"""
        result = subprocess.run(
            [sys.executable, "-B", "-c", code], cwd=ROOT, capture_output=True, text=True, timeout=15
        )
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        self.assertIn("ASGI only", result.stdout)

    def test_obsolete_transport_selector_is_not_available(self):
        import legion

        with self.assertRaises(SystemExit):
            legion.build_arg_parser().parse_args(["--web", "--web-stack", "legacy"])


class NativeTransferLifecycleTest(unittest.TestCase):
    def archive(self):
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("owned-fixture.txt", b"original upload")
        return stream.getvalue()

    def test_download_streams_original_bytes_then_removes_temporary_export(self):
        with tempfile.TemporaryDirectory() as folder:
            archive = Path(folder) / "export.zip"
            original = b"fixture ZIP bytes\x00\xff"
            archive.write_bytes(original)
            runtime = SimpleNamespace(build_project_bundle_zip=lambda: (str(archive), "workspace.zip"))
            with TestClient(create_app(runtime)) as client:
                response = client.get("/api/project/download-zip")
            self.assertEqual(200, response.status_code)
            self.assertEqual(original, response.content)
            self.assertIn("workspace.zip", response.headers["content-disposition"])
            self.assertFalse(archive.exists())

    def test_failed_restore_removes_upload_and_preserves_service_error(self):
        uploads = []
        original = self.archive()

        def reject(path):
            uploads.append(Path(path))
            self.assertEqual(original, Path(path).read_bytes())
            raise ValueError("Invalid project archive")

        with TestClient(create_app(SimpleNamespace(start_restore_project_zip_job=reject))) as client:
            response = client.post("/api/project/restore-zip", files={"bundle": ("project.zip", original)})
        self.assertEqual(400, response.status_code)
        self.assertEqual("Invalid project archive", response.json()["error"])
        self.assertEqual(1, len(uploads))
        self.assertFalse(uploads[0].exists())

    def test_restore_hands_ownership_to_background_job_and_rejects_missing_upload(self):
        uploads = []
        original = self.archive()

        def accept(path):
            uploads.append(Path(path))
            return {"id": 1, "type": "project-restore-zip", "status": "queued"}

        application = create_app(SimpleNamespace(start_restore_project_zip_job=accept))
        try:
            with TestClient(application) as client:
                self.assertEqual(400, client.post("/api/project/restore-zip").status_code)
                response = client.post("/api/project/restore-zip", files={"bundle": ("project.zip", original)})
            self.assertEqual(202, response.status_code)
            self.assertEqual(original, uploads[0].read_bytes())
        finally:
            for path in uploads:
                application.state.storage_admission.release_upload(path)


class InterruptedExportTest(unittest.IsolatedAsyncioTestCase):
    async def test_send_error_or_cancel_removes_temporary_zip(self):
        import asyncio
        from app.api.projects_routes import project_download_zip

        for exception in (OSError("disconnected"), asyncio.CancelledError()):
            with self.subTest(exception=type(exception).__name__), tempfile.TemporaryDirectory() as folder:
                path = Path(folder) / "partial.zip"
                path.write_bytes(b"fixture export")
                response = project_download_zip(SimpleNamespace(build_project_bundle_zip=lambda: (str(path), "a.zip")))

                async def receive():
                    return {"type": "http.disconnect"}

                async def send(message):
                    if message["type"] == "http.response.body":
                        raise exception

                with self.assertRaises(type(exception)):
                    await response(
                        {"type": "http", "method": "GET", "headers": [], "asgi": {"spec_version": "2.4"}}, receive, send
                    )
                self.assertFalse(path.exists(), "Interrupted export retained its temporary ZIP")


class NativeProtocolTest(unittest.TestCase):
    def test_head_keeps_get_headers_and_sends_no_body(self):
        runtime = SimpleNamespace(get_project_details=lambda: {"name": "fixture"})
        with TestClient(create_app(runtime)) as client:
            for path in ("/health", "/api/project", "/static/bundles/workspace.js"):
                full = client.get(path)
                head = client.head(path)
                self.assertEqual(200, head.status_code, path)
                self.assertEqual(b"", head.content)
                self.assertEqual(full.headers["content-type"], head.headers["content-type"])
                self.assertEqual(full.headers["content-length"], head.headers["content-length"])

    def test_options_lists_resource_methods_without_calling_mutation(self):
        with TestClient(create_app()) as client:
            for path, required in (
                ("/api/hub/projects", {"GET", "HEAD", "POST", "OPTIONS"}),
                ("/api/project/rename", {"POST", "OPTIONS"}),
                ("/static/bundles/workspace.js", {"GET", "HEAD", "OPTIONS"}),
            ):
                response = client.options(path)
                self.assertEqual(200, response.status_code, path)
                self.assertEqual(required, set(response.headers["allow"].split(", ")))
            self.assertEqual(404, client.options("/api/retired-does-not-exist").status_code)
            self.assertEqual(405, client.head("/api/project/rename").status_code)

    def test_original_implicit_methods_remain_available_for_every_retained_url(self):
        expected = json.loads((ROOT / "tests/fixtures/http-route-baseline.json").read_text())
        with TestClient(create_app(), raise_server_exceptions=False) as client:
            for row in expected:
                path = re.sub(r"\{[^}]+\}", "1", row["path"])
                with self.subTest(path=path, method=row["method"]):
                    response = client.options(path)
                    self.assertEqual(200, response.status_code)
                    self.assertIn(row["method"], response.headers["allow"].split(", "))
                    if row["method"] == "GET":
                        self.assertIn("HEAD", response.headers["allow"].split(", "))
                        self.assertNotEqual(405, client.head(path).status_code)
            self.assertEqual(200, client.options("/api/graph/content/nested/raw/evidence").status_code)

    def test_head_export_removes_temp_without_transferring_or_deleting_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            archive, evidence = Path(folder) / "export.zip", Path(folder) / "original.bin"
            archive.write_bytes(b"zip")
            evidence.write_bytes(b"keep")
            with TestClient(
                create_app(SimpleNamespace(build_project_bundle_zip=lambda: (str(archive), "a.zip")))
            ) as client:
                response = client.head("/api/project/download-zip")
            self.assertEqual(200, response.status_code)
            self.assertEqual(b"", response.content)
            self.assertFalse(archive.exists())
            self.assertEqual(b"keep", evidence.read_bytes())
