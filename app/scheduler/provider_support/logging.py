"""Scheduler AI providers: logging."""

from __future__ import annotations

import datetime
import json
import threading
from copy import deepcopy
from collections import deque
from typing import Any, Dict, List, Optional

from app.scheduler.provider_support.constants import (
    MAX_PROVIDER_LOG_ENTRIES,
    MAX_PROVIDER_LOG_TEXT_CHARS,
)

_provider_log_lock = threading.Lock()

_provider_logs = deque(maxlen=MAX_PROVIDER_LOG_ENTRIES)

_provider_thread_state = threading.local()


def _set_last_provider_payload(payload: Optional[Dict[str, Any]] = None):
    try:
        _provider_thread_state.last_payload = deepcopy(payload or {})
    except Exception:
        _provider_thread_state.last_payload = {}


def get_last_provider_payload(clear: bool = False) -> Dict[str, Any]:
    payload = getattr(_provider_thread_state, "last_payload", {}) or {}
    try:
        result = deepcopy(payload)
    except Exception:
        result = dict(payload) if isinstance(payload, dict) else {}
    if clear:
        _set_last_provider_payload({})
    return result


def get_provider_logs(limit: int = 200) -> List[Dict[str, Any]]:
    try:
        max_items = int(limit)
    except (TypeError, ValueError):
        max_items = 200
    max_items = max(1, min(max_items, MAX_PROVIDER_LOG_ENTRIES))
    with _provider_log_lock:
        items = list(_provider_logs)
    return items[-max_items:]


def clear_provider_logs():
    with _provider_log_lock:
        _provider_logs.clear()


def _truncate_log_text(value: Any, max_chars: int = MAX_PROVIDER_LOG_TEXT_CHARS) -> str:
    text = str(value or "")
    if len(text) <= int(max_chars):
        return text
    return text[: int(max_chars)].rstrip() + "...[truncated]"


def _sanitize_header_value(name: str, value: Any) -> str:
    key = str(name or "").strip().lower()
    raw = str(value or "")
    if key in {"authorization", "x-api-key", "api-key"}:
        if key == "authorization" and raw.lower().startswith("bearer "):
            return "Bearer ***redacted***"
        return "***redacted***"
    return raw


def _sanitize_headers_for_log(headers: Optional[Dict[str, Any]]) -> Dict[str, str]:
    if not isinstance(headers, dict):
        return {}
    safe = {}
    for key, value in headers.items():
        label = str(key or "").strip()
        if not label:
            continue
        safe[label] = _sanitize_header_value(label, value)
    return safe


def _sanitize_value_for_log(value: Any):
    if isinstance(value, dict):
        safe = {}
        for key, item in value.items():
            label = str(key or "").strip()
            lowered = label.lower()
            if lowered in {"api_key", "apikey", "authorization", "x-api-key"}:
                safe[label] = "***redacted***"
            else:
                safe[label] = _sanitize_value_for_log(item)
        return safe
    if isinstance(value, list):
        return [_sanitize_value_for_log(item) for item in value]
    if isinstance(value, tuple):
        return [_sanitize_value_for_log(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _json_for_log(value: Any) -> str:
    safe = _sanitize_value_for_log(value)
    try:
        rendered = json.dumps(safe, ensure_ascii=False, default=str, indent=2)
    except Exception:
        rendered = str(safe)
    return _truncate_log_text(rendered)


def _response_text_for_log(response: Any) -> str:
    try:
        text_value = str(getattr(response, "text", "") or "")
    except Exception:
        text_value = ""
    return _truncate_log_text(text_value)


def _record_provider_log(
    *,
    provider: str,
    method: str,
    endpoint: str,
    request_headers: Optional[Dict[str, Any]] = None,
    request_payload: Optional[Any] = None,
    response_status: Optional[int] = None,
    response_body: Optional[str] = None,
    error: str = "",
    api_style: str = "",
    prompt_metadata: Optional[Dict[str, Any]] = None,
):
    row = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "provider": str(provider or ""),
        "method": str(method or "").upper(),
        "endpoint": str(endpoint or ""),
        "api_style": str(api_style or ""),
        "request_headers": _sanitize_headers_for_log(request_headers),
        "request_body": _json_for_log(request_payload),
        "response_status": int(response_status) if isinstance(response_status, int) else response_status,
        "response_body": _truncate_log_text(response_body or ""),
        "error": _truncate_log_text(error or ""),
        "prompt_metadata": _sanitize_value_for_log(prompt_metadata or {}),
    }
    with _provider_log_lock:
        _provider_logs.append(row)
