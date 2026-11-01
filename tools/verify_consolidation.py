#!/usr/bin/env python3
"""Verify the captured source bytes and retained Git history without running tools."""

import hashlib
import json
from pathlib import Path
import subprocess
import sys


def main():
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / "CONSOLIDATION.json").read_text())
    errors = []
    for relative, expected in manifest["files"].items():
        path = root / relative
        if path.is_symlink() or not path.is_file():
            errors.append(f"Missing or unexpected file type: {relative}")
            continue
        data = path.read_bytes()
        if len(data) != expected["bytes"] or hashlib.sha256(data).hexdigest() != expected["sha256"]:
            errors.append(f"Changed bytes: {relative}")
        if bool(path.stat().st_mode & 0o111) != expected["executable"]:
            errors.append(f"Changed executable mode: {relative}")
    tracked = subprocess.check_output(
        ["git", "ls-files", "-z", "--", "flaghop", "hackathons"], cwd=root
    ).decode().split("\0")
    extras = set(filter(None, tracked)) - manifest["files"].keys()
    errors.extend(f"Unrecorded file: {relative}" for relative in sorted(extras))
    for branch in manifest["flaghop_history"]["included_branches"]:
        result = subprocess.run(
            ["git", "merge-base", "--is-ancestor", branch["commit"], "HEAD"], cwd=root
        )
        if result.returncode:
            errors.append(f"History not retained: {branch['name']}")
    if subprocess.check_output(
        ["git", "rev-parse", "--is-shallow-repository"], cwd=root, text=True
    ).strip() != "false":
        errors.append("Git history is still shallow")
    result = {
        "ok": not errors,
        "files_verified": len(manifest["files"]),
        "source_bytes": sum(entry["bytes"] for entry in manifest["files"].values()),
        "historical_branches_verified": len(manifest["flaghop_history"]["included_branches"]),
        "errors": errors,
    }
    print(json.dumps(result, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
