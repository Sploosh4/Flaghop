"""Scheduler AI providers: openai."""

from __future__ import annotations

import time
from typing import Any, Dict, Optional

from app.scheduler.provider_support.constants import (
    MAX_PROVIDER_OPENAI_RETRY_ATTEMPTS,
    MAX_PROVIDER_OPENAI_RETRY_TOKENS,
    MAX_PROVIDER_RESPONSE_TOKENS,
    ProviderError,
    SCHEDULER_PROMPT_VERSION,
)
from app.scheduler.provider_support.http import (
    _get_requests_module,
)
from app.scheduler.provider_support.logging import (
    _record_provider_log,
    _response_text_for_log,
)
from app.scheduler.provider_support.models import (
    _auth_state_text,
    _has_authorization_header,
    _lmstudio_native_chat_endpoints,
    _lmstudio_openai_chat_endpoints,
    _openai_compatible_context,
)
from app.scheduler.provider_support.payloads import (
    _collect_unavailable_tool_ids,
    _parse_provider_payload,
    _response_is_complete_for_prompt,
    _visible_candidate_tool_ids_from_metadata,
)
from app.scheduler.provider_support.prompts import (
    _openai_structured_outputs_enabled,
    _prompt_package_parts,
    _scheduler_ranking_response_format,
)


def _should_fallback_from_structured_outputs(exc: ProviderError) -> bool:
    message = str(exc or "").strip().lower()
    if "400" not in message:
        return False
    markers = (
        "response_format",
        "json_schema",
        "strict",
        "unsupported",
        "unknown parameter",
        "invalid parameter",
    )
    return any(marker in message for marker in markers)


def _call_openai_compatible(
    provider_name: str,
    provider_cfg: Dict[str, Any],
    prompt_package: Dict[str, Any],
    *,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    base_url, headers, model, _models, _auto_selected = _openai_compatible_context(provider_name, provider_cfg)
    system_prompt, user_prompt, prompt_metadata = _prompt_package_parts(prompt_package)
    allowed_tool_ids = _visible_candidate_tool_ids_from_metadata(prompt_metadata)
    normalized_context = context if isinstance(context, dict) else {}
    unavailable_tool_ids = _collect_unavailable_tool_ids(normalized_context)
    current_phase = str(prompt_metadata.get("current_phase", "") or "").strip().lower() if normalized_context else ""
    structured_outputs_enabled = _openai_structured_outputs_enabled(provider_name, provider_cfg)
    if provider_name == "lm_studio":
        result = _post_lmstudio_chat_with_fallback(
            base_url=base_url,
            headers=headers,
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            max_tokens=MAX_PROVIDER_RESPONSE_TOKENS,
            prompt_metadata=prompt_metadata,
        )
        content = str(result.get("content", "") or "")
    else:
        endpoint = f"{base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        _set_chat_completion_temperature(payload, provider_name=provider_name, temperature=0.2)
        _set_chat_completion_token_limit(payload, provider_name=provider_name, max_tokens=MAX_PROVIDER_RESPONSE_TOKENS)
        request_metadata = dict(prompt_metadata)
        request_metadata.update(
            {
                "structured_output_requested": bool(structured_outputs_enabled),
                "structured_output_used": False,
                "structured_output_fallback": False,
            }
        )
        if structured_outputs_enabled:
            payload["response_format"] = _scheduler_ranking_response_format(allowed_tool_ids=allowed_tool_ids)
            request_metadata["structured_output_used"] = True
        try:
            content = _post_openai_compatible_chat_with_retry(
                provider_name,
                endpoint,
                headers,
                payload,
                prompt_metadata=request_metadata,
            )
        except ProviderError as exc:
            if not structured_outputs_enabled or not _should_fallback_from_structured_outputs(exc):
                raise
            fallback_payload = dict(payload)
            fallback_payload.pop("response_format", None)
            fallback_metadata = dict(request_metadata)
            fallback_metadata["structured_output_used"] = False
            fallback_metadata["structured_output_fallback"] = True
            content = _post_openai_compatible_chat_with_retry(
                provider_name,
                endpoint,
                headers,
                fallback_payload,
                prompt_metadata=fallback_metadata,
            )
            request_metadata = fallback_metadata
    parsed = _parse_provider_payload(
        content,
        allowed_tool_ids=allowed_tool_ids,
        unavailable_tool_ids=unavailable_tool_ids,
        current_phase=current_phase,
    )
    parsed["structured_output_requested"] = bool(structured_outputs_enabled)
    parsed["structured_output_used"] = (
        bool(structured_outputs_enabled and not request_metadata.get("structured_output_fallback", False))
        if provider_name == "openai"
        else False
    )
    parsed["structured_output_fallback"] = (
        bool(request_metadata.get("structured_output_fallback", False)) if provider_name == "openai" else False
    )
    return parsed


def _request_openai_compatible_content(
    provider_name: str,
    provider_cfg: Dict[str, Any],
    prompt_package: Dict[str, Any],
    *,
    max_tokens: int,
    temperature: float,
) -> str:
    base_url, headers, model, _models, _auto_selected = _openai_compatible_context(provider_name, provider_cfg)
    system_prompt, user_prompt, prompt_metadata = _prompt_package_parts(prompt_package)
    if provider_name == "lm_studio":
        result = _post_lmstudio_chat_with_fallback(
            base_url=base_url,
            headers=headers,
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            prompt_metadata=prompt_metadata,
        )
        return str(result.get("content", "") or "")

    endpoint = f"{base_url}/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    _set_chat_completion_temperature(payload, provider_name=provider_name, temperature=temperature)
    _set_chat_completion_token_limit(payload, provider_name=provider_name, max_tokens=max_tokens)
    return _post_openai_compatible_chat_with_retry(
        provider_name,
        endpoint,
        headers,
        payload,
        prompt_metadata=prompt_metadata,
    )


def _probe_openai_compatible(provider_name: str, provider_cfg: Dict[str, Any], started: float) -> Dict[str, Any]:
    auth_header_sent = False
    endpoint_used = ""
    api_style = "openai_compatible"
    structured_output_requested = False
    structured_output_used = False
    structured_output_fallback = False
    try:
        base_url, headers, model, discovered_models, auto_selected = _openai_compatible_context(
            provider_name, provider_cfg
        )
        auth_header_sent = _has_authorization_header(headers)
        test_prompt = "Return only this JSON:\n" '{"actions":[{"tool_id":"healthcheck","score":100,"rationale":"ok"}]}'
        if provider_name == "lm_studio":
            result = _post_lmstudio_chat_with_fallback(
                base_url=base_url,
                headers=headers,
                model=model,
                system_prompt="Return strict JSON only.",
                user_prompt=test_prompt,
                temperature=0.0,
                max_tokens=120,
            )
            content = str(result.get("content", "") or "")
            endpoint_used = str(result.get("endpoint", "") or "")
            api_style = str(result.get("api_style", "lmstudio_native") or "lmstudio_native")
        else:
            endpoint = f"{base_url}/chat/completions"
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "Return strict JSON only."},
                    {"role": "user", "content": test_prompt},
                ],
            }
            _set_chat_completion_temperature(payload, provider_name=provider_name, temperature=0.0)
            _set_chat_completion_token_limit(payload, provider_name=provider_name, max_tokens=120)
            structured_outputs_enabled = _openai_structured_outputs_enabled(provider_name, provider_cfg)
            structured_output_requested = bool(structured_outputs_enabled)
            if structured_outputs_enabled:
                payload["response_format"] = _scheduler_ranking_response_format()
            request_metadata = {
                "prompt_version": SCHEDULER_PROMPT_VERSION,
                "prompt_type": "healthcheck",
                "structured_output_requested": bool(structured_outputs_enabled),
                "structured_output_used": bool(structured_outputs_enabled),
                "structured_output_fallback": False,
            }
            try:
                content = _post_openai_compatible_chat_with_retry(
                    provider_name,
                    endpoint,
                    headers,
                    payload,
                    prompt_metadata=request_metadata,
                )
            except ProviderError as exc:
                if not structured_outputs_enabled or not _should_fallback_from_structured_outputs(exc):
                    raise
                fallback_payload = dict(payload)
                fallback_payload.pop("response_format", None)
                request_metadata["structured_output_used"] = False
                request_metadata["structured_output_fallback"] = True
                structured_output_fallback = True
                content = _post_openai_compatible_chat_with_retry(
                    provider_name,
                    endpoint,
                    headers,
                    fallback_payload,
                    prompt_metadata=request_metadata,
                )
            structured_output_used = bool(structured_outputs_enabled and not structured_output_fallback)
            endpoint_used = endpoint

        actions = _parse_provider_payload(content).get("actions", [])
        if not actions:
            raise ProviderError("Provider returned an empty actions list.")
    except ProviderError as exc:
        return {
            "ok": False,
            "provider": provider_name,
            "auth_header_sent": auth_header_sent,
            "error": str(exc),
        }

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return {
        "ok": True,
        "provider": provider_name,
        "base_url": base_url,
        "model": model,
        "auth_header_sent": auth_header_sent,
        "endpoint": endpoint_used,
        "api_style": api_style,
        "auto_selected_model": bool(auto_selected),
        "discovered_models": discovered_models[:12],
        "latency_ms": elapsed_ms,
        "structured_output_requested": structured_output_requested,
        "structured_output_used": structured_output_used,
        "structured_output_fallback": structured_output_fallback,
    }


def _post_openai_compatible_chat_with_retry(
    provider_name: str,
    endpoint: str,
    headers: Dict[str, str],
    payload: Dict[str, Any],
    *,
    prompt_metadata: Optional[Dict[str, Any]] = None,
) -> str:
    retriable_provider = str(provider_name or "").strip().lower() == "openai"
    request_payload = dict(payload or {})
    token_limit = _extract_chat_completion_token_limit(request_payload)
    retry_reason = "initial_request"

    for attempt in range(1, MAX_PROVIDER_OPENAI_RETRY_ATTEMPTS + 1):
        attempt_prompt_metadata = dict(prompt_metadata or {})
        attempt_prompt_metadata.update(
            {
                "retry_attempt": int(attempt),
                "retry_reason": str(retry_reason or "initial_request"),
                "effective_max_completion_tokens": int(token_limit),
            }
        )
        result = _post_openai_compatible_chat_detailed(
            provider_name,
            endpoint,
            headers,
            request_payload,
            prompt_metadata=attempt_prompt_metadata,
        )
        content = str(result.get("content", "") or "")
        finish_reason = str(result.get("finish_reason", "")).strip().lower()

        if not retriable_provider or finish_reason != "length":
            return content
        if attempt >= MAX_PROVIDER_OPENAI_RETRY_ATTEMPTS:
            return content
        if _response_is_complete_for_prompt(content, prompt_metadata):
            return content

        token_limit = min(
            MAX_PROVIDER_OPENAI_RETRY_TOKENS,
            max(token_limit + 200, token_limit * 2),
        )
        _set_chat_completion_token_limit(request_payload, provider_name=provider_name, max_tokens=token_limit)
        _append_retry_instruction(request_payload)
        retry_reason = f"finish_reason:{finish_reason or 'unknown'}"

    return ""


def _post_openai_compatible_chat(
    provider_name: str,
    endpoint: str,
    headers: Dict[str, str],
    payload: Dict[str, Any],
    *,
    prompt_metadata: Optional[Dict[str, Any]] = None,
) -> str:
    result = _post_openai_compatible_chat_detailed(
        provider_name,
        endpoint,
        headers,
        payload,
        prompt_metadata=prompt_metadata,
    )
    return str(result.get("content", "") or "")


def _post_openai_compatible_chat_detailed(
    provider_name: str,
    endpoint: str,
    headers: Dict[str, str],
    payload: Dict[str, Any],
    *,
    prompt_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    requests_module = _get_requests_module()
    auth_state = _auth_state_text(headers)
    request_headers = dict(headers or {})
    request_payload = dict(payload or {})
    try:
        response = requests_module.post(endpoint, headers=headers, json=payload, timeout=25)
    except Exception as exc:
        _record_provider_log(
            provider=provider_name,
            method="POST",
            endpoint=endpoint,
            request_headers=request_headers,
            request_payload=request_payload,
            response_status=None,
            response_body="",
            error=str(exc),
            api_style="openai_compatible",
            prompt_metadata=prompt_metadata,
        )
        raise ProviderError(f"{provider_name} request failed ({auth_state}): {exc}") from exc

    _record_provider_log(
        provider=provider_name,
        method="POST",
        endpoint=endpoint,
        request_headers=request_headers,
        request_payload=request_payload,
        response_status=int(getattr(response, "status_code", 0) or 0),
        response_body=_response_text_for_log(response),
        error="",
        api_style="openai_compatible",
        prompt_metadata=prompt_metadata,
    )

    if response.status_code >= 300:
        raise ProviderError(f"{provider_name} API error ({auth_state}): {response.status_code} {response.text}")

    try:
        data = response.json()
    except Exception as exc:
        raise ProviderError(f"{provider_name} API returned non-JSON response: {exc}") from exc

    choices = data.get("choices", [])
    if not choices:
        raise ProviderError(f"{provider_name} response has no choices.")
    first_choice = choices[0] if isinstance(choices[0], dict) else {}
    message = first_choice.get("message", {}) if isinstance(first_choice, dict) else {}
    content = message.get("content", "")
    if isinstance(content, list):
        chunks = []
        for item in content:
            if isinstance(item, dict):
                chunks.append(str(item.get("text", "")))
            else:
                chunks.append(str(item))
        content = "".join(chunks)

    finish_reason = ""
    if isinstance(first_choice, dict):
        finish_reason = str(first_choice.get("finish_reason", "")).strip().lower()

    return {
        "content": str(content or ""),
        "finish_reason": finish_reason,
    }


def _extract_chat_completion_token_limit(payload: Dict[str, Any]) -> int:
    for key in ("max_completion_tokens", "max_tokens"):
        try:
            value = int(payload.get(key, 0))
        except (TypeError, ValueError):
            value = 0
        if value > 0:
            return value
    return MAX_PROVIDER_RESPONSE_TOKENS


def _append_retry_instruction(payload: Dict[str, Any]):
    messages = payload.get("messages", [])
    if not isinstance(messages, list) or not messages:
        return
    for index in range(len(messages) - 1, -1, -1):
        item = messages[index]
        if not isinstance(item, dict):
            continue
        if str(item.get("role", "")).strip().lower() != "user":
            continue
        content = str(item.get("content", "") or "")
        marker = "IMPORTANT RETRY:"
        if marker in content:
            return
        item["content"] = (
            f"{content}\n\n" "IMPORTANT RETRY: Return compact JSON only, with short rationales and no extra text."
        )
        return


def _set_chat_completion_token_limit(payload: Dict[str, Any], *, provider_name: str, max_tokens: int):
    token_value = int(max_tokens)
    if str(provider_name or "").strip().lower() == "openai":
        payload["max_completion_tokens"] = token_value
        payload.pop("max_tokens", None)
    else:
        payload["max_tokens"] = token_value


def _set_chat_completion_temperature(payload: Dict[str, Any], *, provider_name: str, temperature: float):
    # Some OpenAI GPT-5 endpoints reject explicit temperature values and only
    # accept model defaults, so omit temperature for provider=openai.
    if str(provider_name or "").strip().lower() == "openai":
        payload.pop("temperature", None)
        return
    payload["temperature"] = float(temperature)


def _post_lmstudio_chat_with_fallback(
    *,
    base_url: str,
    headers: Dict[str, str],
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: Optional[float],
    max_tokens: Optional[int],
    prompt_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, str]:
    errors = []

    prefer_native_first = str(base_url or "").rstrip("/").endswith("/api/v1")
    styles = ["native", "openai"] if prefer_native_first else ["openai", "native"]
    for style in styles:
        if style == "openai":
            for endpoint in _lmstudio_openai_chat_endpoints(base_url):
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                }
                if temperature is not None:
                    payload["temperature"] = float(temperature)
                if max_tokens is not None:
                    payload["max_tokens"] = int(max_tokens)
                try:
                    content = _post_openai_compatible_chat(
                        "lm_studio",
                        endpoint,
                        headers,
                        payload,
                        prompt_metadata=prompt_metadata,
                    )
                    return {
                        "content": content,
                        "endpoint": endpoint,
                        "api_style": "openai_compatible",
                    }
                except ProviderError as exc:
                    errors.append(f"{endpoint}: {exc}")
        else:
            for endpoint in _lmstudio_native_chat_endpoints(base_url):
                payload = {
                    "model": model,
                    "system_prompt": system_prompt,
                    "input": user_prompt,
                }
                if temperature is not None:
                    payload["temperature"] = float(temperature)
                try:
                    content = _post_lmstudio_native_chat(
                        endpoint,
                        headers,
                        payload,
                        prompt_metadata=prompt_metadata,
                    )
                    return {
                        "content": content,
                        "endpoint": endpoint,
                        "api_style": "lmstudio_native",
                    }
                except ProviderError as exc:
                    errors.append(f"{endpoint}: {exc}")

    raise ProviderError("LM Studio request failed across endpoints: " + "; ".join(errors))


def _post_lmstudio_native_chat(
    endpoint: str,
    headers: Dict[str, str],
    payload: Dict[str, Any],
    *,
    prompt_metadata: Optional[Dict[str, Any]] = None,
) -> str:
    requests_module = _get_requests_module()
    auth_state = _auth_state_text(headers)
    request_headers = dict(headers or {})
    request_payload = dict(payload or {})
    try:
        response = requests_module.post(endpoint, headers=headers, json=payload, timeout=25)
    except Exception as exc:
        _record_provider_log(
            provider="lm_studio",
            method="POST",
            endpoint=endpoint,
            request_headers=request_headers,
            request_payload=request_payload,
            response_status=None,
            response_body="",
            error=str(exc),
            api_style="lmstudio_native",
            prompt_metadata=prompt_metadata,
        )
        raise ProviderError(f"lm_studio request failed ({auth_state}): {exc}") from exc

    _record_provider_log(
        provider="lm_studio",
        method="POST",
        endpoint=endpoint,
        request_headers=request_headers,
        request_payload=request_payload,
        response_status=int(getattr(response, "status_code", 0) or 0),
        response_body=_response_text_for_log(response),
        error="",
        api_style="lmstudio_native",
        prompt_metadata=prompt_metadata,
    )

    if response.status_code >= 300:
        raise ProviderError(f"lm_studio API error ({auth_state}): {response.status_code} {response.text}")

    try:
        data = response.json()
    except Exception as exc:
        raise ProviderError(f"lm_studio API returned non-JSON response: {exc}") from exc

    output = data.get("output", [])
    if isinstance(output, str):
        return output

    if isinstance(output, list):
        chunks = []
        for item in output:
            if isinstance(item, dict):
                chunks.append(str(item.get("content", "")))
            else:
                chunks.append(str(item))
        joined = "\n".join([chunk for chunk in chunks if chunk.strip()])
        if joined.strip():
            return joined

    message = data.get("message")
    if isinstance(message, str) and message.strip():
        return message

    raise ProviderError("lm_studio native chat response had no output content.")
