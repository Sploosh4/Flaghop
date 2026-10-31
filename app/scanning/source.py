"""Portable, byte-verified source bundle; external tool installations stay separate."""

import json
from pathlib import Path

BUNDLE = Path(__file__).resolve().parents[2] / "vendor/ctf_profiler"


def scanner_source():
    if (BUNDLE / "source-manifest.json").is_symlink():
        raise RuntimeError("Scanner manifest cannot be linked.")
    manifest = json.loads((BUNDLE / "source-manifest.json").read_text())
    from app.scanning.bundle import read_bundle

    try:
        _, actual = read_bundle(BUNDLE)
    except ValueError as exc:
        raise RuntimeError(str(exc)) from exc
    if manifest != actual:
        raise RuntimeError("Scanner source changed without a reviewed manifest.")
    return BUNDLE, manifest
