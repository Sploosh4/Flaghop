"""Stable serialization primitives shared by scheduler records and evidence graphs."""

import hashlib
import json
from typing import Any, Dict


def stable_id(prefix: str, payload: Dict[str, Any]) -> str:
    rendered = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    digest = hashlib.sha256(rendered.encode("utf-8")).hexdigest()
    return f"{str(prefix or '').strip().lower()}-{digest[:16]}"


def decode_json(value: Any, fallback: Any):
    raw = str(value or "").strip()
    if not raw:
        return fallback
    try:
        return json.loads(raw)
    except Exception:
        return fallback
