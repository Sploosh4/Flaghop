"""Scheduler AI providers: models."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

from app.scheduler.provider_support.constants import (
    DEFAULT_OPENAI_MODEL,
    ProviderError,
)
from app.scheduler.provider_support.http import (
    _get_requests_module,
)
from app.scheduler.provider_support.logging import (
    _record_provider_log,
    _response_text_for_log,
)


def _openai_compatible_context(
    provider_name: str, provider_cfg: Dict[str, Any]
) -> Tuple[str, Dict[str, str], str, List[str], bool]:
    base_url = str(provider_cfg.get("base_url", "")).rstrip("/")
    if not base_url:
        raise ProviderError(f"Base URL is required for provider {provider_name}.")

    api_key = str(provider_cfg.get("api_key", "")).strip()
    if provider_name == "openai" and not api_key:
        raise ProviderError("API key is required for provider openai.")

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    model, discovered_models, auto_selected = _resolve_openai_compatible_model(
        provider_name=provider_name,
        provider_cfg=provider_cfg,
        base_url=base_url,
        headers=headers,
    )
    return base_url, headers, model, discovered_models, auto_selected


def _resolve_openai_compatible_model(
    provider_name: str,
    provider_cfg: Dict[str, Any],
    base_url: str,
    headers: Dict[str, str],
) -> Tuple[str, List[str], bool]:
    model = str(provider_cfg.get("model", "")).strip()
    if model:
        return model, [], False

    if provider_name == "openai":
        return DEFAULT_OPENAI_MODEL, [], True

    if provider_name != "lm_studio":
        raise ProviderError(f"Model is required for provider {provider_name}.")

    discovered_models = _fetch_lmstudio_models(base_url, headers)
    if not discovered_models:
        raise ProviderError(
            "LM Studio model is empty and no models were returned from /models. "
            "Load a model in LM Studio or set the model explicitly."
        )
    selected = _select_preferred_lmstudio_model(discovered_models)
    return selected, discovered_models, True


def _fetch_lmstudio_models(base_url: str, headers: Dict[str, str]) -> List[str]:
    requests_module = _get_requests_module()
    auth_state = _auth_state_text(headers)
    errors = []
    for endpoint in _lmstudio_models_endpoints(base_url):
        request_headers = dict(headers or {})
        try:
            response = requests_module.get(endpoint, headers=headers, timeout=15)
        except Exception as exc:
            _record_provider_log(
                provider="lm_studio",
                method="GET",
                endpoint=endpoint,
                request_headers=request_headers,
                request_payload={},
                response_status=None,
                response_body="",
                error=str(exc),
                api_style="model_discovery",
            )
            errors.append(f"{endpoint}: {exc}")
            continue

        _record_provider_log(
            provider="lm_studio",
            method="GET",
            endpoint=endpoint,
            request_headers=request_headers,
            request_payload={},
            response_status=int(getattr(response, "status_code", 0) or 0),
            response_body=_response_text_for_log(response),
            error="",
            api_style="model_discovery",
        )

        if response.status_code >= 300:
            errors.append(f"{endpoint}: {response.status_code} {response.text}")
            continue

        try:
            payload = response.json()
        except Exception as exc:
            errors.append(f"{endpoint}: non-JSON response ({exc})")
            continue

        models = _extract_model_ids(payload)
        if models:
            return models
        errors.append(f"{endpoint}: no model ids in payload")

    details = "; ".join(errors) if errors else "no successful model endpoint response"
    raise ProviderError(f"Model listing failed ({auth_state}): {details}")


def _select_preferred_lmstudio_model(models: List[str]) -> str:
    if not models:
        return ""

    def score(model_id: str) -> int:
        name = str(model_id).lower()
        value = 0
        if "o3" in name:
            value += 100
        if "7b" in name:
            value += 35
        if "instruct" in name:
            value += 12
        if "chat" in name:
            value += 8
        return value

    best = models[0]
    best_score = score(best)
    for model_id in models[1:]:
        current_score = score(model_id)
        if current_score > best_score:
            best = model_id
            best_score = current_score
    return best


def _lmstudio_models_endpoints(base_url: str) -> List[str]:
    return [f"{base}/models" for base in _lmstudio_base_candidates(base_url)]


def _lmstudio_openai_chat_endpoints(base_url: str) -> List[str]:
    return [f"{base}/chat/completions" for base in _lmstudio_base_candidates(base_url)]


def _lmstudio_native_chat_endpoints(base_url: str) -> List[str]:
    api_bases = []
    for base in _lmstudio_base_candidates(base_url):
        if base.endswith("/api/v1"):
            api_bases.append(base)
    if not api_bases:
        for base in _lmstudio_base_candidates(base_url):
            if base.endswith("/v1"):
                api_bases.append(base[:-3] + "/api/v1")
    return [f"{base}/chat" for base in _unique_strings(api_bases)]


def _lmstudio_base_candidates(base_url: str) -> List[str]:
    raw = str(base_url or "").rstrip("/")
    if not raw:
        return []

    candidates = [raw]
    if raw.endswith("/api/v1"):
        candidates.append(raw[:-7] + "/v1")
    elif raw.endswith("/v1"):
        candidates.append(raw[:-3] + "/api/v1")
    else:
        candidates.append(raw + "/v1")
        candidates.append(raw + "/api/v1")
    return _unique_strings([item.rstrip("/") for item in candidates if item.strip()])


def _unique_strings(values: List[str]) -> List[str]:
    seen = set()
    result = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _extract_model_ids(payload: Any) -> List[str]:
    if not isinstance(payload, dict):
        return []

    models = []
    items = payload.get("data", [])
    if isinstance(items, list):
        for item in items:
            if isinstance(item, dict):
                model_id = str(item.get("id", "")).strip()
            else:
                model_id = str(item).strip()
            if model_id:
                models.append(model_id)

    legacy_items = payload.get("models", [])
    if isinstance(legacy_items, list):
        for item in legacy_items:
            if isinstance(item, dict):
                model_id = (
                    str(item.get("id", "")).strip()
                    or str(item.get("key", "")).strip()
                    or str(item.get("display_name", "")).strip()
                )
            else:
                model_id = str(item).strip()
            if model_id:
                models.append(model_id)

    return _unique_strings(models)


def _has_authorization_header(headers: Dict[str, str]) -> bool:
    auth = str(headers.get("Authorization", "") or "").strip()
    return bool(auth)


def _auth_state_text(headers: Dict[str, str]) -> str:
    return "auth header sent" if _has_authorization_header(headers) else "auth header missing"
