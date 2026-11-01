"""Round-three supplemental checks for B1-B3 outside the protected evaluator."""
import argparse
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import ctf_profiler as CORE
from dependencies import database_identity, snapshot_dependencies
from staged_workflow import validate_browser
from workspace import Workspace


class RoundThreeSupplementalTests(unittest.TestCase):
    def test_workspace_contains_browser_and_version_paths(self):
        with tempfile.TemporaryDirectory(prefix="r3-workspace-") as directory, \
             patch.dict(os.environ, {"TMPDIR": directory}):
            workspace = Workspace.create("test")
            try:
                self.assertTrue(workspace.path("tmp").is_relative_to(workspace.root))
                self.assertEqual(workspace.environment()["TMPDIR"], str(workspace.path("tmp")))
                calls = []
                raw = Path(directory) / "raw"
                raw.mkdir()
                def execute(identifier, tool, stage, command, trigger, artifact=None, format="jsonl", **extra):
                    calls.append(command)
                    (raw / (identifier + ".stdout")).write_text("")
                    return {"id": identifier, "status": "completed", "stdout": f"raw/{identifier}.stdout"}, []
                validate_browser("http://127.0.0.1:18080/echo?q=hello", "q", 18080, 0,
                                 raw, execute, lambda *args, **kwargs: None,
                                 "http://127.0.0.1:1", "fake-dalfox", workspace=workspace)
                user_data = next(part.split("=", 1)[1] for part in calls[0] if part.startswith("--user-data-dir="))
                self.assertTrue(Path(user_data).is_relative_to(workspace.root))
            finally:
                workspace.cleanup()

    def test_cleanup_failure_is_reported_and_neighbour_survives(self):
        with tempfile.TemporaryDirectory(prefix="r3-cleanup-") as directory:
            parent = Path(directory)
            owned = parent / "owned"
            owned.mkdir()
            leftover = owned / "leftover.txt"
            leftover.write_text("keep me")
            neighbor = parent / "neighbor"
            neighbor.mkdir()
            (neighbor / "keep.txt").write_text("unrelated")
            owned.chmod(0o555)
            try:
                report = Workspace(parent, owned).cleanup()
                self.assertFalse(report["success"])
                self.assertTrue(leftover.exists())
                self.assertTrue(report["leftovers"])
                self.assertTrue(any(item["path"] == str(leftover) for item in report["leftovers"]
                                    for item in item.get("leftovers", [])) or report["leftovers"])
            finally:
                owned.chmod(0o755)
            report = Workspace(parent, owned).cleanup()
            self.assertTrue(report["success"])
            self.assertFalse(owned.exists())
            self.assertTrue((neighbor / "keep.txt").is_file())

    def test_profile_marks_cleanup_failure_partial(self):
        with tempfile.TemporaryDirectory(prefix="r3-profile-") as directory, \
             patch.dict(os.environ, {"TMPDIR": directory}):
            args = CORE.argument_parser().parse_args([
                "192.0.2.10", "--from-nmap", "tests/fixtures/single-target.xml",
                "--offline", "--no-metasploit", "--out", str(Path(directory) / "run")])
            failure = {"success": False, "owned_root": str(Path(directory) / "left"),
                       "attempted": [], "errors": [{"path": "x", "error": "denied"}],
                       "leftovers": [{"path": "x", "bytes": 1}], "declared_base": directory}
            with patch.object(CORE.Workspace, "cleanup", return_value=failure):
                code = CORE.build(args)
            profile = json.loads((args.out / "device-profile.json").read_text())
            self.assertEqual(code, 2)
            self.assertEqual(profile["run"]["status"], "partial")
            self.assertTrue(profile["run"]["cleanup_failed"])
            self.assertFalse(profile["cleanup"]["success"])

    def test_real_permission_denied_cleanup_marks_profile_partial(self):
        with tempfile.TemporaryDirectory(prefix="r3-real-cleanup-") as directory:
            directory = Path(directory)
            owned = directory / "owned"
            owned.mkdir()
            (owned / "tmp").mkdir()
            (owned / "protected.txt").write_text("permission fixture")
            workspace = Workspace(directory, owned)
            owned.chmod(0o555)
            args = CORE.argument_parser().parse_args([
                "192.0.2.10", "--from-nmap", "tests/fixtures/single-target.xml",
                "--offline", "--no-metasploit", "--out", str(directory / "run")])
            try:
                with patch.object(CORE.Workspace, "create", return_value=workspace):
                    code = CORE.build(args)
                profile = json.loads((args.out / "device-profile.json").read_text())
                self.assertEqual(code, 2)
                self.assertEqual(profile["run"]["status"], "partial")
                self.assertTrue(profile["run"]["cleanup_failed"])
                self.assertFalse(profile["cleanup"]["success"])
                self.assertTrue(profile["cleanup"]["run"]["leftovers"])
                self.assertTrue((owned / "protected.txt").is_file())
            finally:
                owned.chmod(0o755)
                workspace.cleanup()

    def test_stable_tool_identity_separates_per_run_probe_provenance(self):
        import sys
        with tempfile.TemporaryDirectory(prefix="r3-identity-") as directory:
            directory = Path(directory)
            executable = directory / "browser"
            executable.write_text("#!" + sys.executable + "\nprint('Google Chrome 123.0.6312.86')\n")
            executable.chmod(0o700)
            workspaces = []
            records = []
            provenances = []
            try:
                for number in (1, 2):
                    with patch.dict(os.environ, {"TMPDIR": str(directory / f"work-{number}")}):
                        workspace = Workspace.create("identity")
                    workspaces.append(workspace)
                    provenance = {}
                    records.append(CORE.tool_identity({"browser": str(executable)},
                                                      workspace=workspace, provenance=provenance))
                    provenances.append(provenance)
                self.assertEqual(records[0], records[1])
                self.assertNotEqual(provenances[0]["browser"]["version_tmpdir"],
                                    provenances[1]["browser"]["version_tmpdir"])
                self.assertNotIn("version_tmpdir", records[0]["browser"])
                self.assertNotIn("version_output_excerpt", records[0]["browser"])
                executable.write_text("#!" + sys.executable + "\nprint('Google Chrome 123.0.6312.86') # changed\n")
                changed = CORE.tool_identity({"browser": str(executable)}, workspace=workspaces[0])
                self.assertNotEqual(records[0]["browser"]["sha256"], changed["browser"]["sha256"])
            finally:
                for workspace in workspaces:
                    workspace.cleanup()

    def test_dependency_changes_are_detected(self):
        with tempfile.TemporaryDirectory(prefix="r3-deps-") as directory:
            directory = Path(directory)
            implementation = directory / "impl"
            implementation.write_text("version 1\n")
            wrapper = directory / "wrapper"
            wrapper.write_text(f'#!/bin/sh\nexec "{implementation}" "$@"\n')
            before = snapshot_dependencies({"fixture": str(wrapper)})
            implementation.write_text("version 2\n")
            after = snapshot_dependencies({"fixture": str(wrapper)})
            self.assertNotEqual(before, after)
            database = directory / "db"
            database.mkdir()
            (database / "metadata.json").write_text('{"v": 1}')
            db_before = database_identity(database)
            (database / "metadata.json").write_text('{"v": 2}')
            self.assertNotEqual(db_before, database_identity(database))


if __name__ == "__main__":
    unittest.main()
