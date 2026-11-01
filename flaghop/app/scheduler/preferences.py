"""Shared limits for runtime workers and scheduler planning."""

from typing import Any, Dict, Optional


def scheduler_max_concurrency(preferences: Optional[Dict[str, Any]] = None) -> int:
    source = preferences if isinstance(preferences, dict) else {}
    try:
        value = int(source.get("max_concurrency", 1))
    except (TypeError, ValueError):
        value = 1
    return max(1, min(value, 16))


def scheduler_max_host_concurrency(preferences: Optional[Dict[str, Any]] = None) -> int:
    source = preferences if isinstance(preferences, dict) else {}
    try:
        value = int(source.get("max_host_concurrency", 1))
    except (TypeError, ValueError):
        value = 1
    return max(1, min(value, 8))
