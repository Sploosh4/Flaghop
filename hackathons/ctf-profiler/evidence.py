"""Bounded evidence I/O, checksums and retained-artifact manifests."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from settings import MAX_ARTIFACT


def hash_file(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def read_bounded(path, limit=MAX_ARTIFACT):
    with Path(path).open("rb") as handle:
        data = handle.read(limit + 1)
    if len(data) > limit:
        raise ValueError(f"Artifact exceeds {limit} bytes: {path}")
    return data


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


def artifact_manifest(output):
    records = []
    for path in sorted((output / "raw").rglob("*")):
        if path.is_file() and not path.is_symlink():
            digest = hashlib.sha256()
            with path.open("rb") as handle:
                while chunk := handle.read(65536):
                    digest.update(chunk)
            records.append({
                "path": str(path.relative_to(output)), "bytes": path.stat().st_size,
                "sha256": digest.hexdigest(),
            })
    return records
