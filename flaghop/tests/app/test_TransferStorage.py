"""Admission, disconnect and ZIP-expansion controls without network or user data."""

import asyncio
import io
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import zipfile
from fastapi.testclient import TestClient
from starlette.requests import Request, ClientDisconnect
from app.api import create_app
from app.api.uploads import staged_upload
from app.services.archive_storage import inspect_archive
from app.services.storage_admission import StorageAdmission, StorageRejected, ROOT


def bundle_bytes(entries=None):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in (entries or {"session.legion": b"synthetic upload transport fixture"}).items():
            archive.writestr(name, data)
    return stream.getvalue()


class TransferStorageTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def admission(self, **limits):
        admission = StorageAdmission({"upload_bytes": 4096, "free_headroom_bytes": 0, **limits})
        admission.folder = self.root / "staging"
        return admission

    def client(self, admission, callback):
        runtime = SimpleNamespace(storage_admission=admission, start_restore_project_zip_job=callback)
        app = create_app(runtime)
        return TestClient(app, raise_server_exceptions=False)

    def assert_clean(self, admission):
        self.assertEqual([], list(admission.folder.glob("*.zip")))
        path = admission.folder / "reservations.json"
        if path.exists():
            self.assertEqual({}, json.loads(path.read_text()))

    def test_concurrent_reservations_use_actual_space_and_release_without_deleting_originals(self):
        admission = self.admission(upload_bytes=100, free_headroom_bytes=16)
        original = self.root / "original.zip"
        original.write_bytes(b"original evidence")
        with patch("app.services.storage_admission.shutil.disk_usage", return_value=SimpleNamespace(free=128)):
            first = admission.reserve(100)
            with self.assertRaises(StorageRejected):
                admission.reserve(100)
            first.close()
            second = admission.reserve(100)
            second.close()
        self.assertFalse(admission.release_upload(original))
        self.assertEqual(b"original evidence", original.read_bytes())

    def test_oversized_raw_and_multipart_streams_are_rejected_before_job_or_restore(self):
        admission = self.admission(upload_bytes=100)
        calls = []
        with self.client(admission, lambda path: calls.append(path)) as client:
            raw = client.post(
                "/api/hub/restore-zip",
                content=iter([b"x" * 75, b"x" * 75]),
                headers={"Content-Type": "application/zip"},
            )
            multipart = client.post("/api/project/restore-zip", files={"bundle": ("large.zip", b"x" * 150)})
            self.assertEqual(413, raw.status_code, raw.text)
            self.assertEqual(413, multipart.status_code, multipart.text)
        self.assertEqual([], calls)
        self.assert_clean(admission)

    def test_headroom_failure_on_both_upload_routes_preserves_state_and_starts_no_work(self):
        admission = self.admission()
        calls = []
        with (
            self.client(admission, lambda path: calls.append(path)) as client,
            patch("app.services.storage_admission.shutil.disk_usage", return_value=SimpleNamespace(free=0)),
        ):
            for route, options in [
                ("/api/hub/restore-zip", {"content": bundle_bytes()}),
                ("/api/project/restore-zip", {"files": {"bundle": ("valid.zip", bundle_bytes())}}),
            ]:
                response = client.post(route, **options)
                self.assertEqual(507, response.status_code, response.text)
        self.assertEqual([], calls)
        self.assert_clean(admission)

    def test_valid_multipart_handoff_uses_owned_path_and_preserves_original_bytes(self):
        admission = self.admission()
        data = bundle_bytes()
        paths = []

        def accept(path):
            paths.append(Path(path))
            self.assertEqual(data, Path(path).read_bytes())
            return {"id": 1, "type": "project-restore-zip", "status": "queued"}

        try:
            with self.client(admission, accept) as client:
                response = client.post("/api/project/restore-zip", files={"bundle": ("valid.zip", data)})
                self.assertEqual(202, response.status_code, response.text)
            self.assertTrue(paths[0].is_relative_to(admission.folder))
            self.assertTrue(paths[0].exists())
        finally:
            for path in paths:
                admission.release_upload(path)
        self.assert_clean(admission)

    def test_stream_without_length_and_service_failure_clean_owned_staging(self):
        admission = self.admission()
        data = bundle_bytes()
        received = []

        def reject(_self, path):
            received.append(Path(path).read_bytes())
            raise ValueError("owned restore fixture failed before adoption")

        with (
            self.client(admission, lambda path: None) as client,
            patch("app.services.project_hub_operations.ProjectHubOperations.restore_zip", reject),
        ):
            response = client.post(
                "/api/hub/restore-zip",
                content=iter([data[:50], data[50:]]),
                headers={"Content-Type": "application/zip"},
            )
            self.assertEqual(400, response.status_code, response.text)
        self.assertEqual([data], received)
        self.assert_clean(admission)

    def test_disconnected_raw_stream_cleans_files_and_reservations(self):
        admission = self.admission()

        async def run():
            messages = iter(
                [{"type": "http.request", "body": b"partial", "more_body": True}, {"type": "http.disconnect"}]
            )

            async def receive():
                return next(messages)

            request = Request(
                {
                    "type": "http",
                    "method": "POST",
                    "path": "/",
                    "headers": [],
                    "app": SimpleNamespace(state=SimpleNamespace(storage_admission=admission)),
                },
                receive,
            )
            with self.assertRaises(ClientDisconnect):
                async with staged_upload(request):
                    self.fail("Disconnected upload was accepted")

        asyncio.run(run())
        self.assert_clean(admission)

    def test_zip_member_expansion_compression_and_path_limits(self):
        cases = [
            ({"a": b"1", "b": b"2"}, {"members": 1}),
            ({"a": b"x" * 100}, {"entry_bytes": 50}),
            ({"a": b"x" * 30, "b": b"y" * 30}, {"expanded_bytes": 50}),
            ({"a": b"x" * 10000}, {"compression_ratio": 2}),
            ({"../outside": b"not extracted"}, {}),
            ({"a": b"x", "a/child": b"y"}, {}),
        ]
        for index, (entries, limits) in enumerate(cases):
            with self.subTest(case=index):
                path = self.root / f"case-{index}.zip"
                path.write_bytes(bundle_bytes(entries))
                with self.assertRaises(StorageRejected):
                    inspect_archive(path, self.admission(**limits))
        self.assertFalse((self.root / "outside").exists())

    def test_bad_or_multiple_multipart_fields_never_reach_runtime(self):
        admission = self.admission()
        calls = []
        with self.client(admission, lambda path: calls.append(path)) as client:
            for files in (
                {"wrong": ("valid.zip", bundle_bytes())},
                [("bundle", ("a.zip", bundle_bytes())), ("bundle", ("b.zip", bundle_bytes()))],
            ):
                response = client.post("/api/project/restore-zip", files=files)
                self.assertEqual(400, response.status_code, response.text)
        self.assertEqual([], calls)
        self.assert_clean(admission)

    def test_close_and_fsync_failures_still_release_owned_file_and_lease(self):
        admission = self.admission()
        stage = admission.stage()
        original = stage.file

        class FailingClose:
            @property
            def closed(self):
                return original.closed

            def close(self):
                original.close()
                raise OSError("owned close fixture failure")

        stage.file = FailingClose()
        with self.assertRaises(StorageRejected):
            stage.close()
        self.assert_clean(admission)
        stage = admission.stage()
        try:
            with patch("app.services.storage_admission.os.fsync", side_effect=OSError("owned fsync fixture failure")):
                with self.assertRaises(OSError):
                    stage.seal()
        finally:
            stage.close()
        self.assert_clean(admission)

    def test_failed_ledger_publication_does_not_leave_an_upload_file(self):
        admission = self.admission()
        stage = admission.stage()
        with patch(
            "app.services.storage_admission.atomic_json", side_effect=OSError("owned ledger publication failure")
        ):
            with self.assertRaises(OSError):
                stage.close()
        self.assertFalse(stage.path.exists())
        # Once storage is writable, retrying cleanup is idempotent.
        stage.close()
        self.assert_clean(admission)

    def test_cross_device_copy_admits_the_final_destination_and_preserves_source_on_rejection(self):
        import os
        from app.services.project_restore import move_owned_tree

        admission = self.admission()
        source = self.root / "source"
        target = self.root / "destination"
        source.mkdir()
        target.mkdir()
        (source / "proof").write_bytes(b"original")
        real_stat = Path.stat

        def other_device(path, *args, **kwargs):
            result = real_stat(path, *args, **kwargs)
            if path == target or target in path.parents:
                values = list(result)
                values[2] += 1000
                return os.stat_result(values)
            return result

        def space(path):
            return SimpleNamespace(free=0 if Path(path) == target else 10000000)

        with (
            patch("pathlib.Path.stat", other_device),
            patch("app.services.storage_admission.shutil.disk_usage", side_effect=space),
        ):
            with self.assertRaises(StorageRejected):
                move_owned_tree(source, target, admission)
        self.assertEqual(b"original", (source / "proof").read_bytes())
        self.assertEqual([], list(target.iterdir()))
