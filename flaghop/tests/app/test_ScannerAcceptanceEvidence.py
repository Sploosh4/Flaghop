from contextlib import contextmanager
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from tests.support.scanner_acceptance import retain_evidence


class TestScannerAcceptanceEvidence(unittest.TestCase):
    def test_disappearing_atomic_metadata_does_not_lose_final_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            source, destination = Path(directory) / "source", Path(directory) / "saved"
            source.mkdir()
            (source / "run.json").write_text('{"status":"completed"}')
            transient = source / ".run.json.replacing.tmp"
            transient.write_text("in progress")
            original = os.scandir

            @contextmanager
            def scandir(path):
                with original(path) as entries:
                    entries = list(entries)
                if Path(path) == source:
                    transient.unlink()
                yield iter(entries)

            with patch("shutil.os.scandir", side_effect=scandir):
                retain_evidence(source, destination)
            self.assertEqual((destination / "run.json").read_text(), '{"status":"completed"}')
            self.assertFalse((destination / transient.name).exists())

    def test_target_artifacts_with_temp_names_are_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            source, destination = Path(directory) / "source", Path(directory) / "saved"
            (source / "profile/raw").mkdir(parents=True)
            evidence = source / "profile/raw/.run.json.target.tmp"
            evidence.write_text("original target evidence")
            retain_evidence(source, destination)
            self.assertEqual((destination / "profile/raw" / evidence.name).read_text(), "original target evidence")
