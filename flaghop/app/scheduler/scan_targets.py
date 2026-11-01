"""Read targets from both current and legacy scan history records."""

import json
import re
from typing import Any, Dict, List


def scan_history_targets(record: Dict[str, Any]) -> List[str]:
    if isinstance(record.get("targets"), list):
        values = [str(item or "").strip() for item in list(record.get("targets", [])) if str(item or "").strip()]
        if values:
            return values
    raw_targets = str(record.get("targets_json", "") or "").strip()
    if raw_targets:
        try:
            parsed = json.loads(raw_targets)
        except Exception:
            parsed = []
        if isinstance(parsed, list):
            values = [str(item or "").strip() for item in parsed if str(item or "").strip()]
            if values:
                return values
    fallback: List[str] = []
    for source in (record.get("scope_summary", ""), record.get("target_summary", "")):
        for token in re.findall(r"[A-Za-z0-9./:-]+", str(source or "")):
            cleaned = str(token or "").strip(",:")
            if cleaned and cleaned not in fallback:
                fallback.append(cleaned)
    return fallback
