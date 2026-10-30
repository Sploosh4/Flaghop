"""Scheduler AI providers: claude."""

from __future__ import annotations

import time
from typing import Any, Dict, Optional

from app.scheduler.provider_support.constants import (
    ProviderError,
)
from app.scheduler.provider_support.http import (
    _get_requests_module,
)
from app.scheduler.provider_support.logging import (
    _record_provider_log,
    _response_text_for_log,
)
from app.scheduler.provider_support.payloads import (
    _collect_unavailable_tool_ids,
    _parse_provider_payload,
    _visible_candidate_tool_ids_from_metadata,
)


def _call_claude(
    provider_cfg: Dict[str, Any],
    prompt_package: Any,
    *,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    content = _request_claude_content(
        provider_cfg,
        prompt_package,
        max_tokens=600,
        temperature=0.2,
    )
    prompt_metadata = prompt_package.get("metadata", {}) if isinstance(prompt_package, dict) else {}
    allowed_tool_ids = _visible_candidate_tool_ids_from_metadata(prompt_metadata)
    normalized_context = context if isinstance(context, dict) else {}
    return _parse_provider_payload(
        content,
        allowed_tool_ids=allowed_tool_ids,
        unavailable_tool_ids=_collect_unavailable_tool_ids(normalized_context),
        current_phase=str(prompt_metadata.get("current_phase", "") or "").strip().lower() if normalized_context else "",
    )


def _request_claude_content(
    provider_cfg: Dict[str, Any],
    prompt_package: Any,
    *,
    max_tokens: int,
    temperature: float,
) -> str:
    requests_module = _get_requests_module()
    model = str(provider_cfg.get("model", "")).strip()
    if not model:
        raise ProviderError("Model is required for provider claude.")

    base_url = str(provider_cfg.get("base_url", "")).rstrip("/")
    if not base_url:
        raise ProviderError("Base URL is required for provider claude.")
    endpoint = f"{base_url}/v1/messages"

    api_key = str(provider_cfg.get("api_key", "")).strip()
    if not api_key:
        raise ProviderError("API key is required for provider claude.")

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    system_prompt = ""
    user_prompt = ""
    prompt_metadata: Dict[str, Any] = {}
    if isinstance(prompt_package, dict):
        system_prompt = str(prompt_package.get("system_prompt", "") or "")
        user_prompt = str(prompt_package.get("user_prompt", "") or "")
        prompt_metadata = (
            prompt_package.get("metadata", {}) if isinstance(prompt_package.get("metadata", {}), dict) else {}
        )
    else:
        user_prompt = str(prompt_package or "")
    payload = {
        "model": model,
        "max_tokens": max(1, int(max_tokens or 1)),
        "temperature": float(temperature),
        "messages": [
            {"role": "user", "content": user_prompt},
        ],
    }
    if system_prompt:
        payload["system"] = system_prompt

    try:
        response = requests_module.post(endpoint, headers=headers, json=payload, timeout=25)
    except Exception as exc:
        _record_provider_log(
            provider="claude",
            method="POST",
            endpoint=endpoint,
            request_headers=dict(headers or {}),
            request_payload=dict(payload or {}),
            response_status=None,
            response_body="",
            error=str(exc),
            api_style="anthropic_messages",
            prompt_metadata=prompt_metadata,
        )
        raise ProviderError(f"claude request failed: {exc}") from exc

    _record_provider_log(
        provider="claude",
        method="POST",
        endpoint=endpoint,
        request_headers=dict(headers or {}),
        request_payload=dict(payload or {}),
        response_status=int(getattr(response, "status_code", 0) or 0),
        response_body=_response_text_for_log(response),
        error="",
        api_style="anthropic_messages",
        prompt_metadata=prompt_metadata,
    )

    if response.status_code >= 300:
        raise ProviderError(f"claude API error: {response.status_code} {response.text}")

    data = response.json()
    parts = data.get("content", [])
    text_chunks = []
    for part in parts:
        if isinstance(part, dict) and part.get("type") == "text":
            text_chunks.append(str(part.get("text", "")))
    content = "\n".join(text_chunks)
    return content


def _probe_claude(provider_cfg: Dict[str, Any], started: float) -> Dict[str, Any]:
    try:
        actions = _call_claude(
            provider_cfg,
            ("Return only this JSON:\n" '{"actions":[{"tool_id":"healthcheck","score":100,"rationale":"ok"}]}'),
        ).get("actions", [])
        if not actions:
            raise ProviderError("Provider returned an empty actions list.")
    except ProviderError as exc:
        return {
            "ok": False,
            "provider": "claude",
            "error": str(exc),
        }

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return {
        "ok": True,
        "provider": "claude",
        "base_url": str(provider_cfg.get("base_url", "")).rstrip("/"),
        "model": str(provider_cfg.get("model", "")).strip(),
        "auto_selected_model": False,
        "discovered_models": [],
        "latency_ms": elapsed_ms,
    }
