"""Tool inventory, stable identities and per-run version-probe provenance."""
from __future__ import annotations

import os
from pathlib import Path
import re
import shutil
import subprocess
from evidence import hash_file
from settings import TOOLS
from tool_environment import child_environment


def inventory():
    project_bin = Path(__file__).resolve().parent / ".tools/bin"
    return {
        tool: next((path for name in names if (path := shutil.which(name))), None)
        or next((str(project_bin / name) for name in names if (project_bin / name).is_file() and os.access(project_bin / name, os.X_OK)), None)
        for tool, names in TOOLS.items()
    }


SOURCE_FILES = tuple(sorted(path.name for path in Path(__file__).resolve().parent.glob("*.py")))


VERSION_COMMANDS = {
    "nmap": ("--version",), "http": ("--version",), "whatweb": ("--version",),
    "tls": ("--version",), "smb": ("--version",), "dns": ("-v",),
    "httpx": ("-version",), "katana": ("-version",), "ffuf": ("-V",),
    "nuclei": ("-version",), "wpscan": ("--version",), "sqlmap": ("--version",),
    "dalfox": ("--version",), "browser": ("--version",),
}


VERSION_PATTERNS = {
    "nmap": r"Nmap\s+version\s+(\d+(?:\.\d+)+)",
    "http": r"\bcurl\s+(\d+(?:\.\d+)+)",
    "whatweb": r"WhatWeb\s+version\s+(\d+(?:\.\d+)+)",
    "tls": r"testssl\S*\s+version\s+(\d+(?:\.\d+)+)",
    "smb": r"(?:v|version)\s*(\d+(?:\.\d+)+)",
    "dns": r"DiG\s+(\d+(?:\.\d+)+)",
    "httpx": r"Current\s+Version:?\s*v?(\d+(?:\.\d+)+)",
    "katana": r"Current\s+version:?\s*v?(\d+(?:\.\d+)+)",
    "ffuf": r"ffuf\s+version:?\s*v?(\d+(?:\.\d+)+)",
    "nuclei": r"Nuclei\s+Engine\s+Version:?\s*v?(\d+(?:\.\d+)+)",
    "wpscan": r"(?:Current\s+)?Version:?\s*(\d+(?:\.\d+)+)",
    "sqlmap": r"^\s*(\d+(?:\.\d+)+)",
    "dalfox": r"dalfox\s+v?(\d+(?:\.\d+)+)",
    "browser": r"Chrome\s+(\d+(?:\.\d+)+)",
}


VERSION_TIMEOUTS = {"dalfox": 8, "wpscan": 8, "tls": 8, "nuclei": 8}


def source_identity():
    root = Path(__file__).resolve().parent
    return {
        name: {"sha256": hash_file(root / name), "bytes": (root / name).stat().st_size}
        for name in SOURCE_FILES if (root / name).is_file()
    }


def input_identity():
    root = Path(__file__).resolve().parent
    paths = sorted((root / "templates" / "assessment").glob("*")) + [root / "wordlists/web-small.txt"]
    return {
        str(path.relative_to(root)): {"sha256": hash_file(path), "bytes": path.stat().st_size}
        for path in paths if path.is_file()
    }


def extract_version(tool, output):
    clean = re.sub(r"\x1b\[[0-9;]*m", "", output or "")
    match = re.search(VERSION_PATTERNS.get(tool, r""), clean, re.I | re.M)
    return match.group(1) if match else None


def tool_identity(tools, query_versions=True, workspace=None, provenance=None):
    """Record stable implementation/version identity for each tool.

    Per-run probe details (TMPDIR and raw output excerpt) go to the optional
    ``provenance`` mapping, never into the cross-run comparable identity.
    Offline and dry runs suppress version subprocesses so those modes never
    spawn a child.
    """
    records = {}
    provenance = provenance if provenance is not None else {}
    for tool, executable in tools.items():
        if not executable:
            records[tool] = {"path": None, "status": "missing"}
            provenance[tool] = {"status": "missing"}
            continue
        record = {"path": executable, "status": "present"}
        try:
            record.update(bytes=Path(executable).stat().st_size,
                          sha256=hash_file(executable))
        except OSError:
            pass
        probe = {}
        if workspace is not None:
            probe["version_tmpdir"] = str(workspace.path("tmp"))
        arguments = VERSION_COMMANDS.get(tool)
        if arguments and query_versions:
            try:
                version_env = child_environment()
                if workspace is not None:
                    version_env["TMPDIR"] = str(workspace.path("tmp"))
                else:
                    version_env["TMPDIR"] = os.environ.get("TMPDIR") or "/tmp"
                probe["version_tmpdir"] = version_env["TMPDIR"]
                completed = subprocess.run(
                    [executable, *arguments], stdin=subprocess.DEVNULL,
                    capture_output=True, text=True,
                    timeout=VERSION_TIMEOUTS.get(tool, 5),
                    env=version_env, cwd=Path(__file__).resolve().parent,
                )
                output = (completed.stdout or "") + "\n" + (completed.stderr or "")
                record["version"] = extract_version(tool, output)
                probe["version_output_excerpt"] = " ".join(output.split())[:500]
                record["version_exit_code"] = completed.returncode
            except (OSError, subprocess.SubprocessError) as error:
                record["version"] = None
                probe["version_error"] = str(error)[:300]
        else:
            record["version"] = None
            record["version_note"] = "Installed CLI exposes no safe version query; executable hash is authoritative."
        records[tool] = record
        provenance[tool] = probe
    return records
