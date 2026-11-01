"""Artifact metadata never substitutes for ownership, retained bytes or proof."""

import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from pydantic import TypeAdapter, ValidationError
from app.contracts.artifacts.reader import ReaderOrigin, ReaderAlert
from app.contracts.artifacts.references import ProjectRelativePath
from app.contracts.artifacts.scanner import Artifact
from app.contracts.actions.reader import ReaderResult
from app.scanning.profile import validate_profile
from app.scheduler.state_support.normalization import _normalize_artifacts, _normalize_screenshots
from tests.support.scanner_fixture import write_profile


class ArtifactContractsTest(unittest.TestCase):
    def test_project_paths_reject_escape_and_ambiguous_locators(self):
        adapter = TypeAdapter(ProjectRelativePath)
        self.assertEqual("raw/result.txt", adapter.validate_python("raw/result.txt"))
        for value in (
            "",
            ".",
            "../outside",
            "/etc/passwd",
            "raw/../../outside",
            "C:/outside",
            "raw\\outside",
            "raw/./result",
            "raw//result",
            "raw/result\x00",
        ):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                adapter.validate_python(value)

    def test_manifest_requires_a_real_digest_and_nonnegative_integer_size(self):
        valid = {"path": "raw/result.txt", "bytes": 5, "sha256": "a" * 64}
        self.assertEqual(valid, Artifact.model_validate(valid).model_dump())
        for update in ({"sha256": "hash label"}, {"bytes": True}, {"bytes": -1}, {"path": "../outside"}):
            with self.subTest(update=update), self.assertRaises(ValidationError):
                Artifact.model_validate({**valid, **update})

    def test_reader_origins_round_trip_unknowns_without_claiming_verified_identity(self):
        original = {
            "path": "/remote/source",
            "sha256": "historical-label",
            "transport": "sftp",
            "extension": {"kept": True},
        }
        origin = ReaderOrigin.model_validate(original)
        self.assertEqual(original, origin.model_dump())
        alert = {
            "id": "fixture",
            "result_path": "ciphey/artifacts/result.bin",
            "size": 1,
            "completed": 1,
            "origins": [original],
            "state": "partial",
            "label": "Candidate",
            "transformations": [],
        }
        result = ReaderResult(status="ok", data_b64="YQ==", truncated=False, size=1, artifact=alert)
        self.assertEqual(original, result.model_dump()["artifact"]["origins"][0])
        with self.assertRaises(ValidationError):
            ReaderAlert.model_validate({**alert, "result_path": "../outside"})

    def test_historical_artifact_and_screenshot_rows_keep_optional_absence(self):
        artifact = _normalize_artifacts([{"ref": "/fixture/original.txt", "kind": "text", "tool_id": "fixture"}])[0]
        self.assertEqual("/fixture/original.txt", artifact["ref"])
        screenshot = _normalize_screenshots([{"ref": "/fixture/historical.png"}])[0]
        self.assertNotIn("captured_at", screenshot)
        self.assertNotIn("target_url", screenshot)

    def test_import_still_checks_bytes_and_observation_manifest_membership(self):
        for change in ("bytes", "source", "link"):
            with self.subTest(change=change), tempfile.TemporaryDirectory() as folder:
                profile = write_profile(folder)
                evidence = Path(folder, "raw/nmap.xml")
                original = evidence.read_bytes()
                if change == "bytes":
                    evidence.write_bytes(original + b"changed")
                elif change == "source":
                    profile["observations"][0]["source"] = "raw/not-retained.txt"
                    Path(folder, "device-profile.json").write_text(json.dumps(profile))
                else:
                    target = Path(folder, "original.xml")
                    target.write_bytes(original)
                    evidence.unlink()
                    evidence.symlink_to(target)
                with self.assertRaises(ValueError):
                    validate_profile(folder, "192.0.2.10", profile["source_identity"])
                if change != "bytes":
                    self.assertEqual(hashlib.sha256(original).digest(), hashlib.sha256(evidence.read_bytes()).digest())
