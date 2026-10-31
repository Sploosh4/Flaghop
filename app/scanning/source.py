"""Portable, byte-verified source bundle; external tool installations stay separate."""

import hashlib
import json
from pathlib import Path

BUNDLE = Path(__file__).resolve().parents[2] / "vendor/ctf_profiler"


def scanner_source():
    manifest = json.loads((BUNDLE / "source-manifest.json").read_text())
    for name, expected in manifest.items():
        path = BUNDLE / name
        if path.is_symlink() or not path.is_file():
            raise RuntimeError(f"Scanner source is missing or linked: {name}")
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected["sha256"]:
            raise RuntimeError(f"Scanner source changed without a reviewed manifest: {name}")
    modules = {p.name for p in BUNDLE.glob("*.py")}
    if modules != {name for name in manifest if name.endswith(".py")}:
        raise RuntimeError("Scanner module inventory differs from its manifest.")
    return BUNDLE, manifest
