"""Owned temporary workspace and cleanup lifecycle for one profiler run."""
from __future__ import annotations

import os
from pathlib import Path
import shutil
import time

def tree_stats(root):
    logical = allocated = files = 0
    root = Path(root)
    if not root.exists():
        return {"logical_bytes": 0, "allocated_bytes": 0, "files": 0}
    for path in root.rglob("*"):
        try:
            info = path.lstat()
        except FileNotFoundError:
            continue
        if path.is_symlink():
            continue
        if path.is_file():
            logical += info.st_size
            allocated += getattr(info, "st_blocks", 0) * 512
            files += 1
    return {"logical_bytes": logical, "allocated_bytes": allocated, "files": files}


class Workspace:
    """A declared, run-owned temporary root.

    The workspace is deliberately short enough for Chrome's Unix socket path
    limit when the observer supplies a short ``TMPDIR`` or
    ``CTF_PROFILER_WORKSPACE``. Only this owned root is ever removed; a parent
    directory or neighbouring fixture is never touched.
    """

    def __init__(self, base, root):
        self.base = Path(base)
        self.root = Path(root)

    @classmethod
    def create(cls, marker="run"):
        explicit = os.environ.get("CTF_PROFILER_WORKSPACE")
        if explicit:
            base = Path(explicit)
        else:
            base = Path(os.environ.get("TMPDIR") or "/tmp")
        base = base.expanduser().absolute()
        base.mkdir(mode=0o700, parents=True, exist_ok=True)
        token = f"cp-{os.getpid()}-{int(time.time() * 1000) % 1000000}"
        root = base / token
        root.mkdir(mode=0o700, parents=False, exist_ok=False)
        return cls(base, root)

    @classmethod
    def local(cls, root):
        root = Path(root)
        root.mkdir(mode=0o700, parents=True, exist_ok=True)
        return cls(root.parent, root)

    def path(self, *parts):
        path = self.root.joinpath(*parts)
        parent = path if path.suffix == "" else path.parent
        parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        return path

    def environment(self):
        return {"TMPDIR": str(self.path("tmp"))}

    def cleanup(self):
        """Remove only the owned root and report every failure/leftover."""
        result = {"owned_root": str(self.root), "attempted": [str(self.root)],
                  "errors": [], "leftovers": [], "success": False,
                  "declared_base": str(self.base)}
        if not self.root.exists():
            result["success"] = True
            return result
        try:
            shutil.rmtree(self.root)
        except OSError as error:
            result["errors"].append({"path": str(self.root), "error": str(error)})
        if self.root.exists():
            stats = tree_stats(self.root)
            result["leftovers"].append({"path": str(self.root), **stats})
            result["removed"] = False
        else:
            result["removed"] = True
            result["success"] = True
        return result


def cleanup_transient(output, workspace=None):
    """Remove owned tool runtimes after reports/proofs are harvested.

    Deletion failures are recorded with paths/bytes and make the run partial;
    they are never silently ignored. Only owned run/workspace paths are touched.
    """
    output = Path(output)
    raw = output / "raw"
    candidates = [path for pattern in ("*-home", "chrome-*") for path in raw.glob(pattern)]
    candidates += [raw / "tool-state", output / "scratch"]
    if workspace is not None:
        candidates.append(Path(workspace.path("tmp")))
    report = {"attempted": [], "errors": [], "leftovers": [], "success": True}
    for path in candidates:
        if not path.exists():
            continue
        report["attempted"].append(str(path))
        try:
            shutil.rmtree(path)
        except OSError as error:
            report["errors"].append({"path": str(path), "error": str(error)})
        if Path(path).exists():
            report["leftovers"].append({"path": str(path), **tree_stats(path)})
    report["success"] = not report["errors"] and not report["leftovers"]
    return report


def cleanup_tool_state(output, tool, identifier="tool"):
    """Drop per-invocation runtime state and report any failed deletion."""
    raw = Path(output) / "raw"
    report = {"tool": tool, "task": identifier, "attempted": [],
              "errors": [], "leftovers": [], "success": True}
    paths = []
    if tool == "zap":
        paths = [path for path in raw.glob("*-home") if path.is_dir()]
        for home in paths:
            log = home / "zap.log"
            if log.is_file():
                try:
                    excerpt = log.read_bytes()[-32768:]
                    (raw / f"{identifier}-runtime-diagnostics.txt").write_bytes(excerpt)
                except OSError as error:
                    report["errors"].append({"path": str(log), "error": str(error)})
    elif tool == "browser":
        paths = [path for path in raw.glob("chrome-*") if path.is_dir()]
    for path in paths:
        report["attempted"].append(str(path))
        try:
            shutil.rmtree(path)
        except OSError as error:
            report["errors"].append({"path": str(path), "error": str(error)})
        if path.exists():
            report["leftovers"].append({"path": str(path), **tree_stats(path)})
    report["success"] = not report["errors"] and not report["leftovers"]
    return report
