"""Compact identity of launchers, installed implementations and databases."""
from __future__ import annotations

import hashlib
import os
from pathlib import Path
import re

MAX_DB_FILES = 100


def hash_file(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def file_identity(path):
    path = Path(path)
    if not path.is_file():
        return {"path": str(path), "status": "missing"}
    return {"path": str(path), "status": "present", "bytes": path.stat().st_size,
            "sha256": hash_file(path)}


def database_identity(path):
    path = Path(path)
    if not path.is_dir():
        return {"path": str(path), "status": "missing"}
    files = {}
    logical = 0
    for file in sorted(p for p in path.rglob("*") if p.is_file()):
        if len(files) >= MAX_DB_FILES:
            break
        files[str(file.relative_to(path))] = {"bytes": file.stat().st_size, "sha256": hash_file(file)}
        logical += file.stat().st_size
    return {"path": str(path), "status": "present", "files": files,
            "files_count": len(files), "logical_bytes": logical}


def _wrapper_targets(path):
    path = Path(path)
    try:
        text = path.read_text(errors="replace")
    except OSError:
        return []
    # Shell text is only a source of literal-path hints, not a shell program to
    # evaluate. Never join quoted comments across lines into a filesystem path.
    candidates = [match[1] for match in re.findall(r"([\"'])(/[^\r\n\x00\"']+)\1", text)]
    if not candidates:
        candidates = re.findall(r"(?<!\w)(/[^\s\x00\"']+)", text)
    result = []
    for candidate in candidates:
        target = Path(candidate)
        try:
            if target.is_file() and target.resolve() != path.resolve():
                result.append(str(target.resolve()))
        except (OSError, ValueError):
            # Invalid/overlong literal hints must not abort the entire profile.
            # Python <3.14 propagates some stat errors that newer pathlib hides.
            continue
    return sorted(set(result))[:10]


def wpscan_database_path():
    explicit = os.environ.get("CTF_PROFILER_WPSCAN_DATABASE")
    if explicit:
        return Path(explicit)
    selected_cache = os.environ.get("CTF_PROFILER_WPSCAN_CACHE")
    if selected_cache:
        return Path(selected_cache) / "wpscan" / "db"
    cache = Path(os.environ.get("XDG_CACHE_HOME") or (Path.home() / ".cache"))
    return cache / "wpscan" / "db"


def snapshot_dependencies(tools):
    """Identify launchers, parsed implementation targets, and key databases.

    This intentionally does not copy installations. It records hashes of the
    launcher, resolved implementation entry points, and compact manifest/database
    files so a mutation can be detected before/after a run.
    """
    result = {}
    for tool, executable in tools.items():
        if not executable:
            result[tool] = {"status": "missing"}
            continue
        record = {"launcher": file_identity(executable),
                  "wrapper_targets": [file_identity(path) for path in _wrapper_targets(executable)]}
        resolved = Path(executable).resolve()
        record["resolved_launcher"] = file_identity(resolved)
        if tool == "zap":
            targets = [Path(item["path"]) for item in record["wrapper_targets"] if item.get("status") == "present"]
            install = targets[0].parent if targets else resolved.parent
            jars = [file_identity(p) for p in sorted(install.glob("zap-*.jar"))]
            plugins = [file_identity(p) for p in sorted((install / "plugin").glob("*")) if p.is_file()]
            xml_files = [file_identity(p) for p in sorted((install / "xml").glob("*")) if p.is_file()]
            record["zap"] = {"installation": str(install), "core_jars": jars,
                             "plugins": plugins[:50], "xml_manifest": xml_files[:50],
                             "plugin_count": len(plugins), "xml_count": len(xml_files)}
        elif tool == "wpscan":
            targets = [Path(item["path"]) for item in record["wrapper_targets"] if item.get("status") == "present"]
            gem_root = None
            for target in targets:
                if "gems" in target.parts:
                    index = target.parts.index("gems")
                    gem_root = Path(*target.parts[:index + 1])
                    break
            specs = []
            if gem_root:
                for spec in sorted((gem_root / "specifications").glob("*.gemspec")):
                    specs.append(file_identity(spec))
            record["wpscan"] = {"gem_root": str(gem_root) if gem_root else None,
                                "gemspecs": specs[:80], "gemspec_count": len(specs),
                                "database": database_identity(wpscan_database_path())}
        elif tool == "browser":
            record["browser"] = {"executable": file_identity(resolved)}
        result[tool] = record
    return result
