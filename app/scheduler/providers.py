"""Scheduler AI providers: facade."""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from app.scheduler.provider_support.claude import (
    _call_claude,
    _probe_claude,
    _request_claude_content,
)
from app.scheduler.provider_support.constants import (
    MAX_PROVIDER_REFLECTION_RESPONSE_TOKENS,
    MAX_PROVIDER_SPECIALIST_RESPONSE_TOKENS,
    ProviderError,
    SCHEDULER_REFLECTION_PROMPT_VERSION,
    SCHEDULER_WEB_FOLLOWUP_PROMPT_VERSION,
)
from app.scheduler.provider_support.context import (
    _feature_flag_enabled,
)
from app.scheduler.provider_support.logging import (
    _set_last_provider_payload,
)
from app.scheduler.provider_support.openai import (
    _call_openai_compatible,
    _probe_openai_compatible,
    _request_openai_compatible_content,
)
from app.scheduler.provider_support.payloads import (
    _collect_unavailable_tool_ids,
    _parse_reflection_payload,
    _parse_web_followup_payload,
)
from app.scheduler.provider_support.prompts import (
    _build_ranking_prompt_package,
    _build_reflection_prompt_package,
    _build_web_followup_prompt_package,
)
from app.scheduler.provider_support.constants import ProviderError as ProviderError
from app.scheduler.provider_support.prompts import _build_candidate_block as _build_candidate_block
from app.scheduler.provider_support.prompts import _build_ranking_prompt_package as _build_ranking_prompt_package
from app.scheduler.provider_support.context import _determine_scheduler_phase as _determine_scheduler_phase
from app.scheduler.provider_support.logging import clear_provider_logs as clear_provider_logs
from app.scheduler.provider_support.context import determine_scheduler_phase as determine_scheduler_phase
from app.scheduler.provider_support.logging import get_last_provider_payload as get_last_provider_payload
from app.scheduler.provider_support.logging import get_provider_logs as get_provider_logs
from app.scheduler.provider_support.http import requests as requests

__all__ = [
    "ProviderError",
    "_build_candidate_block",
    "_build_ranking_prompt_package",
    "_determine_scheduler_phase",
    "clear_provider_logs",
    "determine_scheduler_phase",
    "get_last_provider_payload",
    "get_provider_logs",
    "rank_actions_with_provider",
    "reflect_on_scheduler_progress",
    "requests",
    "select_web_followup_with_provider",
    "test_provider_connection",
]


def rank_actions_with_provider(
    config: Dict[str, Any],
    goal_profile: str,
    service: str,
    protocol: str,
    candidates: List[Dict[str, str]],
    context: Optional[Dict[str, Any]] = None,
    *,
    engagement_preset: str = "",
) -> List[Dict[str, Any]]:
    _set_last_provider_payload({})
    provider_name = str(config.get("provider", "none") or "none").strip().lower()
    providers_cfg = config.get("providers", {}) if isinstance(config, dict) else {}
    provider_cfg = providers_cfg.get(provider_name, {}) if isinstance(providers_cfg, dict) else {}
    feature_flags = config.get("feature_flags", {}) if isinstance(config, dict) else {}
    prompt_profiles_enabled = True
    if isinstance(feature_flags, dict) and "scheduler_prompt_profiles" in feature_flags:
        prompt_profiles_enabled = bool(feature_flags.get("scheduler_prompt_profiles", True))
    context_summary_enabled = _feature_flag_enabled(config, "context_summary_enabled", default=True)
    prompt_package = _build_ranking_prompt_package(
        goal_profile=goal_profile,
        engagement_preset=engagement_preset,
        service=service,
        protocol=protocol,
        candidates=candidates,
        context=context or {},
        prompt_profiles_enabled=prompt_profiles_enabled,
        context_summary_enabled=context_summary_enabled,
    )
    prompt_metadata = dict(prompt_package.get("metadata", {}) or {})

    if provider_name == "none" or not provider_cfg.get("enabled", False):
        disabled_payload = {
            "provider": provider_name,
            "actions": [],
            "host_updates": {},
            "findings": [],
            "manual_tests": [],
            "technologies": [],
            "next_phase": "",
        }
        disabled_payload.update(prompt_metadata)
        _set_last_provider_payload(disabled_payload)
        return []

    if provider_name in {"openai", "lm_studio"}:
        payload = _call_openai_compatible(
            provider_name,
            provider_cfg,
            prompt_package,
            context=context or {},
        )
        payload["provider"] = provider_name
        payload.update(prompt_metadata)
        _set_last_provider_payload(payload)
        return payload.get("actions", [])
    if provider_name == "claude":
        payload = _call_claude(provider_cfg, prompt_package, context=context or {})
        payload["provider"] = provider_name
        payload.update(prompt_metadata)
        _set_last_provider_payload(payload)
        return payload.get("actions", [])
    raise ProviderError(f"Unsupported provider: {provider_name}")


def reflect_on_scheduler_progress(
    config: Dict[str, Any],
    goal_profile: str,
    service: str,
    protocol: str,
    *,
    engagement_preset: str = "",
    context: Optional[Dict[str, Any]] = None,
    recent_rounds: Optional[List[Dict[str, Any]]] = None,
    trigger_reason: str = "",
    trigger_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    provider_name = str(config.get("provider", "none") or "none").strip().lower()
    providers_cfg = config.get("providers", {}) if isinstance(config, dict) else {}
    provider_cfg = providers_cfg.get(provider_name, {}) if isinstance(providers_cfg, dict) else {}

    if provider_name == "none" or not provider_cfg.get("enabled", False):
        return {
            "provider": provider_name,
            "state": "continue",
            "reason": "",
            "priority_shift": "",
            "promote_tool_ids": [],
            "suppress_tool_ids": [],
            "manual_tests": [],
            "prompt_version": SCHEDULER_REFLECTION_PROMPT_VERSION,
            "prompt_type": "reflection",
        }

    prompt_package = _build_reflection_prompt_package(
        goal_profile=goal_profile,
        engagement_preset=engagement_preset,
        service=service,
        protocol=protocol,
        context=context or {},
        recent_rounds=recent_rounds or [],
        trigger_reason=trigger_reason,
        trigger_context=trigger_context or {},
        context_summary_enabled=_feature_flag_enabled(config, "context_summary_enabled", default=True),
    )
    metadata = dict(prompt_package.get("metadata", {}) or {})

    if provider_name in {"openai", "lm_studio"}:
        content = _request_openai_compatible_content(
            provider_name,
            provider_cfg,
            prompt_package,
            max_tokens=MAX_PROVIDER_REFLECTION_RESPONSE_TOKENS,
            temperature=0.1,
        )
    elif provider_name == "claude":
        content = _request_claude_content(
            provider_cfg,
            prompt_package,
            max_tokens=420,
            temperature=0.1,
        )
    else:
        raise ProviderError(f"Unsupported provider: {provider_name}")

    payload = _parse_reflection_payload(
        content,
        unavailable_tool_ids=_collect_unavailable_tool_ids(context or {}),
    )
    payload["provider"] = provider_name
    payload.update(metadata)
    return payload


def select_web_followup_with_provider(
    config: Dict[str, Any],
    goal_profile: str,
    service: str,
    protocol: str,
    candidates: List[Dict[str, str]],
    *,
    engagement_preset: str = "",
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    provider_name = str(config.get("provider", "none") or "none").strip().lower()
    providers_cfg = config.get("providers", {}) if isinstance(config, dict) else {}
    provider_cfg = providers_cfg.get(provider_name, {}) if isinstance(providers_cfg, dict) else {}

    if provider_name == "none" or not provider_cfg.get("enabled", False):
        return {
            "provider": provider_name,
            "focus": "",
            "selected_tool_ids": [],
            "reason": "",
            "manual_tests": [],
            "prompt_version": SCHEDULER_WEB_FOLLOWUP_PROMPT_VERSION,
            "prompt_type": "web_followup",
        }

    prompt_package = _build_web_followup_prompt_package(
        goal_profile=goal_profile,
        engagement_preset=engagement_preset,
        service=service,
        protocol=protocol,
        candidates=candidates,
        context=context or {},
        context_summary_enabled=_feature_flag_enabled(config, "context_summary_enabled", default=True),
    )
    metadata = dict(prompt_package.get("metadata", {}) or {})

    if provider_name in {"openai", "lm_studio"}:
        content = _request_openai_compatible_content(
            provider_name,
            provider_cfg,
            prompt_package,
            max_tokens=MAX_PROVIDER_SPECIALIST_RESPONSE_TOKENS,
            temperature=0.1,
        )
    elif provider_name == "claude":
        content = _request_claude_content(
            provider_cfg,
            prompt_package,
            max_tokens=360,
            temperature=0.1,
        )
    else:
        raise ProviderError(f"Unsupported provider: {provider_name}")

    payload = _parse_web_followup_payload(
        content,
        allowed_tool_ids=list(metadata.get("visible_candidate_tool_ids", []) or []),
        unavailable_tool_ids=_collect_unavailable_tool_ids(context or {}),
    )
    payload["provider"] = provider_name
    payload.update(metadata)
    return payload


def test_provider_connection(config: Dict[str, Any], provider_name: Optional[str] = None) -> Dict[str, Any]:
    selected_provider = str(provider_name or config.get("provider", "none") or "none").strip().lower()
    providers_cfg = config.get("providers", {}) if isinstance(config, dict) else {}
    provider_cfg = providers_cfg.get(selected_provider, {}) if isinstance(providers_cfg, dict) else {}

    if selected_provider == "none":
        return {
            "ok": False,
            "provider": "none",
            "error": "AI provider is set to none.",
        }

    if not isinstance(provider_cfg, dict):
        provider_cfg = {}

    if not provider_cfg.get("enabled", False):
        return {
            "ok": False,
            "provider": selected_provider,
            "error": f"Provider '{selected_provider}' is disabled.",
        }

    started = time.perf_counter()
    if selected_provider in {"openai", "lm_studio"}:
        return _probe_openai_compatible(selected_provider, provider_cfg, started)
    if selected_provider == "claude":
        return _probe_claude(provider_cfg, started)

    return {
        "ok": False,
        "provider": selected_provider,
        "error": f"Unsupported provider: {selected_provider}",
    }
