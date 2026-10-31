"""Explicit, bounded scanner bundle inventory and reviewable update machinery."""

import hashlib
import json
import os
from pathlib import Path
import tempfile

MODULES = (
    "ctf_profiler.py",
    "dependencies.py",
    "device_classifier.py",
    "discovery.py",
    "evidence.py",
    "execution.py",
    "finding_validation.py",
    "identities.py",
    "metasploit_adapter.py",
    "scope_proxy.py",
    "service_parsers.py",
    "service_plan.py",
    "settings.py",
    "staged_workflow.py",
    "tool_environment.py",
    "web_assessment.py",
    "web_parsers.py",
    "workspace.py",
)
INPUTS = ("templates/assessment/git-config.yaml", "templates/assessment/wordpress.yaml", "wordlists/web-small.txt")
FILES = MODULES + INPUTS
MAX_FILE = 512 * 1024
MAX_BUNDLE = 2 * 1024 * 1024


def read_bundle(root):
    """Read only reviewed names. Unknown modules require an inventory review."""
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("Scanner bundle root is missing or linked.")
    if {p.name for p in root.glob("*.py")} != set(MODULES):
        raise ValueError("Scanner module inventory differs from the reviewed inventory.")
    files, manifest = {}, {}
    for name in FILES:
        path = root
        for part in Path(name).parts:
            path /= part
            if path.is_symlink():
                raise ValueError(f"Scanner bundle input is linked: {name}")
        if not path.is_file() or path.stat().st_size > MAX_FILE:
            raise ValueError(f"Scanner bundle input is missing or too large: {name}")
        with path.open("rb") as stream:
            data = stream.read(MAX_FILE + 1)
        if len(data) > MAX_FILE:
            raise ValueError(f"Scanner bundle input grew past its limit: {name}")
        files[name] = data
        manifest[name] = {"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}
    if sum(len(data) for data in files.values()) > MAX_BUNDLE:
        raise ValueError("Scanner bundle exceeds its 2 MiB source budget.")
    return files, manifest


def manifest_bytes(manifest):
    return (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()


def compare(source, destination):
    files, candidate = read_bundle(source)
    _, installed = read_bundle(destination)
    recorded = json.loads((Path(destination) / "source-manifest.json").read_text())
    changes = [name for name in FILES if installed[name] != candidate[name]]
    return (
        files,
        candidate,
        {
            "matched": not changes and recorded == candidate,
            "files": len(candidate),
            "changes": changes,
            "installed_manifest_matches_files": recorded == installed,
            "candidate_manifest_sha256": hashlib.sha256(manifest_bytes(candidate)).hexdigest(),
        },
    )


def install(destination, files, manifest, expected_digest):
    """Stage bounded inputs, replace files, publish the identity last.

    Readers reject any interrupted mixed bundle against the unchanged manifest;
    rerun the same reviewed update to repair it. Never copy tools or evaluators.
    """
    if hashlib.sha256(manifest_bytes(manifest)).hexdigest() != expected_digest:
        raise ValueError("Candidate changed or review digest is incorrect. Check the diff again.")
    destination = Path(destination)
    # Validate the installed layout before creating sibling temporary files.
    read_bundle(destination)
    staged = []
    try:
        for name, data in [*(files.items()), ("source-manifest.json", manifest_bytes(manifest))]:
            target = destination / name
            if target.is_symlink():
                raise ValueError(f"Cannot replace a linked scanner input: {name}")
            with tempfile.NamedTemporaryFile(prefix=".bundle-", dir=target.parent, delete=False) as stream:
                staged.append((Path(stream.name), target))
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
        for temporary, target in staged:
            temporary.replace(target)
    finally:
        for temporary, _target in staged:
            temporary.unlink(missing_ok=True)
