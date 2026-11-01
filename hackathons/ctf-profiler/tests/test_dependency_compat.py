"""Dependency discovery must tolerate shell text that is not a usable path."""
from contextlib import redirect_stdout
import errno
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import ctf_profiler as CORE
from dependencies import _wrapper_targets, snapshot_dependencies


class DependencyCompatibilityTests(unittest.TestCase):
    def test_multiline_comment_does_not_hide_valid_quoted_implementation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            implementation = root / "implementation with spaces"
            implementation.write_text("version one\n")
            wrapper = root / "wrapper"
            wrapper.write_text(
                "#!/bin/sh\n# '/crashing lsass.exe.\n# " + "comment " * 100 +
                "\n# end of comment'\n" + f'exec "{implementation}" "$@"\n')
            before = snapshot_dependencies({"fixture": str(wrapper)})
            targets = before["fixture"]["wrapper_targets"]
            self.assertEqual([item["path"] for item in targets], [str(implementation)])
            implementation.write_text("version two\n")
            self.assertNotEqual(before, snapshot_dependencies({"fixture": str(wrapper)}))

    def test_overlong_literals_do_not_abort_dependency_collection(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            implementation = root / "implementation"
            implementation.write_text("fixture\n")
            wrapper = root / "wrapper"
            invalid = "/" + "x" * 300
            for quote in ('"', "'", ""):
                with self.subTest(quote=quote):
                    wrapper.write_text(f"#!/bin/sh\nprintf {quote}{invalid}{quote}\n"
                                       f"exec {quote}{implementation}{quote}\n")
                    targets = _wrapper_targets(wrapper)
                    self.assertIn(str(implementation), targets)
                    self.assertNotIn(invalid, targets)

    def test_unstatable_literal_does_not_hide_other_implementation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            implementation = root / "implementation"
            implementation.write_text("fixture\n")
            invalid = root / "unstatable"
            wrapper = root / "wrapper"
            wrapper.write_text(f'#!/bin/sh\nprintf "{invalid}"\nexec "{implementation}"\n')
            original = Path.is_file

            def is_file(path):
                if path == invalid:
                    raise OSError(errno.EINVAL, "Invalid speculative path", str(path))
                return original(path)

            with patch.object(Path, "is_file", is_file):
                self.assertEqual(_wrapper_targets(wrapper), [str(implementation)])

    def test_profile_preserves_original_dependency_read_error(self):
        with tempfile.TemporaryDirectory() as directory:
            args = CORE.argument_parser().parse_args([
                "192.0.2.10", "--from-nmap", "tests/fixtures/single-target.xml",
                "--offline", "--no-metasploit", "--out", str(Path(directory) / "run")])
            with patch.object(CORE, "inventory", return_value={}), \
                 patch.object(CORE, "snapshot_dependencies", side_effect=[
                     OSError("Dependency fixture unreadable"), {"fixture": "after"}]), \
                 redirect_stdout(io.StringIO()):
                self.assertEqual(CORE.build(args), 2)
            profile = json.loads((args.out / "device-profile.json").read_text())
            self.assertEqual(profile["run"]["error"], "Dependency fixture unreadable")
            self.assertTrue(profile["run"]["dependency_changed"])
            self.assertFalse(profile["dependency_identity"]["unchanged"])
            self.assertTrue(profile["cleanup"]["success"])


if __name__ == "__main__":
    unittest.main()
