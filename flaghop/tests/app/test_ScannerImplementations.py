"""Underlying implementations must change identity even when wrappers do not."""

from pathlib import Path
import tempfile
import os
import unittest
from unittest.mock import patch
from app.scanning.implementations import snapshot, comparison


class ImplementationIdentityTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.chrome = self.root / "chrome"
        self.chrome.write_bytes(b"\x7fELFsynthetic fixture, not an executable")
        self.browser = self.root / "google-chrome"
        self.browser.write_text('#!/bin/sh\nexec "$HERE/chrome" "$@"\n')
        self.gems = self.root / "gems"
        package = self.gems / "gems/wpscan-1.0"
        self.entry, self.library = package / "bin/wpscan", package / "lib/wpscan.rb"
        for path in (self.entry, self.library, self.gems / "specifications/wpscan-1.0.gemspec"):
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("# synthetic fixture\n")
        self.wrapper = self.root / "wpscan"
        self.wrapper.write_text(f'#!/bin/sh\nexport GEM_HOME="{self.gems}"\nexec ruby "$GEM_HOME/bin/wpscan" "$@"\n')
        self.tools = {"browser": str(self.browser), "wpscan": str(self.wrapper)}

    def test_chrome_elf_mutation_changes_identity_without_changing_launcher(self):
        before = snapshot(self.tools)
        self.chrome.write_bytes(self.chrome.read_bytes() + b"changed")
        after = snapshot(self.tools)
        self.assertEqual("covered", after["browser"]["status"])
        self.assertEqual(before["browser"]["launcher"], after["browser"]["launcher"])
        self.assertNotEqual(before["browser"]["elf"], after["browser"]["elf"])
        self.assertEqual(["browser"], comparison(before, after)["changed"])

    def test_wpscan_entrypoint_and_library_each_change_identity_without_gemspec_changes(self):
        before = snapshot(self.tools)
        for path in (self.entry, self.library):
            with self.subTest(path=path):
                old = path.read_bytes()
                path.write_bytes(old + b"# changed\n")
                after = snapshot(self.tools)
                self.assertEqual("covered", after["wpscan"]["status"])
                self.assertEqual(before["wpscan"]["launcher"], after["wpscan"]["launcher"])
                self.assertEqual(["wpscan"], comparison(before, after)["changed"])
                path.write_bytes(old)

    def test_unknown_layout_is_unmeasured_without_running_the_launcher(self):
        self.browser.write_text('#!/bin/sh\nexec "$UNKNOWN_BROWSER"\n')
        with patch("subprocess.run", side_effect=AssertionError("Audit executed shell")):
            audit = snapshot(self.tools)
        self.assertEqual("unmeasured", audit["browser"]["status"])
        self.assertFalse(comparison(audit, audit)["unchanged"])

    def test_missing_optional_tools_remain_explicitly_missing(self):
        audit = snapshot({})
        self.assertEqual({"status": "missing"}, audit["browser"])
        self.assertTrue(comparison(audit, audit)["unchanged"])


class WorkerEnvironmentTest(unittest.TestCase):
    def test_owned_home_and_cache_preserve_explicit_installed_database_selection(self):
        from app.scanning.worker import configure_environment

        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            original = root / "user-home"
            database = original / ".cache/wpscan/db"
            database.mkdir(parents=True)
            (database / "installed.json").write_bytes(b"original database")
            for installed in (True, False):
                if not installed:
                    (database / "installed.json").unlink()
                    database.rmdir()
                scratch = root / ("scratch-" + str(installed))
                with patch.dict(os.environ, {"HOME": str(original)}):
                    configure_environment(scratch)
                    self.assertTrue(Path(os.environ["HOME"]).is_relative_to(scratch))
                    self.assertTrue(Path(os.environ["XDG_CACHE_HOME"]).is_relative_to(scratch))
                    self.assertTrue(Path(os.environ["XDG_DATA_HOME"]).is_relative_to(scratch))
                    expected = original / ".cache" if installed else scratch / "cache"
                    self.assertEqual(str(expected), os.environ["CTF_PROFILER_WPSCAN_CACHE"])
                    if installed:
                        self.assertEqual(b"original database", (database / "installed.json").read_bytes())
