"""Evidence-backed reports: common."""

from __future__ import annotations

import datetime
import json
from typing import Any, Dict, Iterable, List


def _utc_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value or 0.0)
    except (TypeError, ValueError):
        return float(default)


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return int(default)


def _csv_tokens(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(item or "").strip() for item in list(value or []) if str(item or "").strip()]
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def _normalize_source_kind(value: Any) -> str:
    normalized = str(value or "").strip().lower()
    if normalized in {"observed", "inferred", "ai_suggested", "user_entered", "operator", "manual"}:
        return normalized
    if normalized in {"manual_note", "annotation"}:
        return "operator"
    return "observed"


def _provenance_bucket(value: Any) -> str:
    source_kind = _normalize_source_kind(value)
    if source_kind == "observed":
        return "observed_facts"
    if source_kind == "inferred":
        return "inferred_relationships"
    if source_kind == "ai_suggested":
        return "ai_suggestions"
    return "operator_conclusions"


def _dedupe_tokens(values: Iterable[Any], limit: int = 200) -> List[str]:
    seen = set()
    items: List[str] = []
    for item in list(values or []):
        token = str(item or "").strip()
        if not token or token in seen:
            continue
        seen.add(token)
        items.append(token)
        if len(items) >= limit:
            break
    return items


def _stable_json_key(value: Any) -> str:
    try:
        return json.dumps(value, sort_keys=True, default=str)
    except Exception:
        return str(value)


def _dedupe_dicts(rows: Iterable[Dict[str, Any]], limit: int = 500) -> List[Dict[str, Any]]:
    seen = set()
    items: List[Dict[str, Any]] = []
    for row in list(rows or []):
        if not isinstance(row, dict):
            continue
        key = _stable_json_key(row)
        if key in seen:
            continue
        seen.add(key)
        items.append(dict(row))
        if len(items) >= limit:
            break
    return items


def _bucket_append(buckets: Dict[str, List[Dict[str, Any]]], item: Dict[str, Any]):
    if not isinstance(item, dict):
        return
    bucket = _provenance_bucket(item.get("source_kind", "observed"))
    buckets.setdefault(bucket, []).append(item)
