"""Scanner updates copy only reviewed inputs and reject identity/layout mistakes."""

import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from app.scanning.bundle import FILES, compare, install, manifest_bytes, read_bundle
from app.scanning.source import BUNDLE, scanner_source


class ScannerBundleTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source, self.destination = self.root / "source", self.root / "installed"
        for root in (self.source, self.destination):
            for name in (*FILES, "source-manifest.json"):
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(BUNDLE / name, path)

    def test_checked_update_is_reproducible_and_never_copies_tools_or_evidence(self):
        (self.source / "dependencies.py").write_bytes((self.source / "dependencies.py").read_bytes() + b"\n# fixture\n")
        (self.source / "private-evidence.bin").write_bytes(b"must not copy")
        files, manifest, report = compare(self.source, self.destination)
        self.assertEqual(["dependencies.py"], report["changes"])
        self.assertFalse(report["matched"])
        self.assertEqual(21, report["files"])
        install(self.destination, files, manifest, report["candidate_manifest_sha256"])
        self.assertTrue(compare(self.source, self.destination)[2]["matched"])
        self.assertEqual(manifest_bytes(manifest), (self.destination / "source-manifest.json").read_bytes())
        self.assertFalse((self.destination / "private-evidence.bin").exists())
        with patch("app.scanning.source.BUNDLE", self.destination):
            self.assertEqual(manifest, scanner_source()[1])

    def test_changed_review_digest_refuses_all_writes(self):
        before = (self.destination / "dependencies.py").read_bytes()
        files, manifest, _report = compare(self.source, self.destination)
        with self.assertRaises(ValueError):
            install(self.destination, files, manifest, "0" * 64)
        self.assertEqual(before, (self.destination / "dependencies.py").read_bytes())
        self.assertFalse(list(self.destination.rglob(".bundle-*")))

    def test_unknown_modules_and_linked_inputs_require_explicit_review(self):
        unexpected = self.source / "unreviewed.py"
        unexpected.write_text("raise RuntimeError('do not execute')")
        with self.assertRaises(ValueError):
            read_bundle(self.source)
        unexpected.unlink()
        (self.source / "settings.py").unlink()
        (self.source / "settings.py").symlink_to(BUNDLE / "settings.py")
        with self.assertRaises(ValueError):
            read_bundle(self.source)

    def test_manifest_cannot_authorise_arbitrary_paths_or_wrong_sizes(self):
        manifest_path = self.destination / "source-manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["../outside.py"] = manifest["settings.py"]
        manifest_path.write_text(json.dumps(manifest))
        with patch("app.scanning.source.BUNDLE", self.destination):
            with self.assertRaises(RuntimeError):
                scanner_source()
        self.assertFalse(compare(self.source, self.destination)[2]["installed_manifest_matches_files"])
