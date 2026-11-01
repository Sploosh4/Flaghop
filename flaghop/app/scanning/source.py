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


def pin_source(scratch, expected):
    """Copy the exact queued bytes into an owned run, never a mutable install.

    Reading all reviewed bytes before checking their identity also prevents an
    updater's intermediate layout from becoming the worker's import path.
    """
    from app.scanning.bundle import read_bundle, manifest_bytes

    source, current = scanner_source()
    files, actual = read_bundle(source)
    if current != expected or actual != expected:
        raise RuntimeError("Queued scanner source changed. Review the current bundle and start a new scan.")
    destination = Path(scratch) / "scanner-bundle"
    destination.mkdir(mode=0o700, exist_ok=False)
    for name, data in files.items():
        target = destination / name
        target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        with target.open("xb") as stream:
            stream.write(data)
    (destination / "source-manifest.json").write_bytes(manifest_bytes(expected))
    if read_bundle(destination)[1] != expected:
        raise RuntimeError("Owned scanner snapshot differs from the queued identity.")
    return destination
