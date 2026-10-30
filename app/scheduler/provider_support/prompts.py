"""Scheduler AI providers: prompts."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Set, Tuple
from app.scheduler.tool_prompt_registry import get_scheduler_tool_prompt_info

from app.scheduler.provider_support.constants import (
    MAX_CANDIDATE_ARG_SHAPE_CHARS,
    MAX_CANDIDATE_LABEL_CHARS,
    MAX_CANDIDATE_PURPOSE_CHARS,
    MAX_PROVIDER_CANDIDATES,
    MAX_PROVIDER_PROMPT_CHARS,
    MIN_PROVIDER_CANDIDATE_BLOCK_CHARS,
    SCHEDULER_PROMPT_VERSION,
    SCHEDULER_REFLECTION_PROMPT_VERSION,
    SCHEDULER_WEB_FOLLOWUP_PROMPT_VERSION,
    _STRICT_COVERAGE_GAP_IDS,
    _WEB_SERVICE_IDS,
)
from app.scheduler.provider_support.context import (
    _build_context_block,
    _coverage_missing_ids,
    _coverage_recommended_tool_ids,
    _determine_scheduler_phase,
    _effective_prompt_goal_profile,
    _truncate_block_text,
)
from app.scheduler.provider_support.models import (
    _unique_strings,
)
from app.scheduler.provider_support.payloads import (
    _normalize_prompt_text,
    _normalize_tool_token,
    _normalized_tool_id_map,
)


def _build_prompt(
    goal_profile: str,
    service: str,
    protocol: str,
    candidates: List[Dict[str, str]],
    context: Optional[Dict[str, Any]] = None,
) -> str:
    return _build_ranking_prompt_package(
        goal_profile=goal_profile,
        service=service,
        protocol=protocol,
        candidates=candidates,
        context=context or {},
        context_summary_enabled=True,
    ).get("user_prompt", "")


def _build_ranking_prompt_package(
    *,
    goal_profile: str,
    engagement_preset: str = "",
    service: str,
    protocol: str,
    candidates: List[Dict[str, str]],
    context: Optional[Dict[str, Any]] = None,
    prompt_profiles_enabled: bool = True,
    context_summary_enabled: bool = True,
) -> Dict[str, Any]:
    ctx = context if isinstance(context, dict) else {}
    effective_goal_profile = _effective_prompt_goal_profile(
        goal_profile=goal_profile,
        engagement_preset=engagement_preset,
    )
    current_phase = _determine_scheduler_phase(
        goal_profile=goal_profile,
        service=service,
        engagement_preset=engagement_preset,
        context=ctx,
    )
    context_block = _build_context_block(
        ctx,
        current_phase_override=current_phase,
        include_summary=bool(context_summary_enabled),
    )
    service_profile = _resolve_prompt_profile(service=service, context=ctx) if prompt_profiles_enabled else "generic"
    phase_profile = (
        current_phase if prompt_profiles_enabled and current_phase in {"broad_vuln", "deep_web"} else "default"
    )
    prompt_profile = service_profile if phase_profile == "default" else f"{service_profile}:{phase_profile}"

    system_prompt = _build_scheduler_system_prompt()
    prefix = _build_ranking_user_prompt_prefix(
        goal_profile=effective_goal_profile,
        service=service,
        protocol=protocol,
        current_phase=current_phase,
        service_profile=service_profile,
        phase_profile=phase_profile,
        prompt_profile=prompt_profile,
        context_block=context_block,
    )
    candidate_block, omitted_count, visible_candidate_tool_ids = _build_candidate_block(
        candidates,
        prefix,
        context=ctx,
        prompt_type="ranking",
    )
    metadata = {
        "prompt_version": SCHEDULER_PROMPT_VERSION,
        "prompt_type": "ranking",
        "goal_profile": effective_goal_profile,
        "legacy_goal_profile": str(goal_profile or "").strip().lower(),
        "engagement_preset": str(engagement_preset or "").strip().lower(),
        "prompt_profile": prompt_profile,
        "service_profile": service_profile,
        "phase_profile": phase_profile,
        "current_phase": current_phase,
        "context_chars": len(context_block),
        "candidate_count": len(candidates or []),
        "visible_candidate_count": len(visible_candidate_tool_ids),
        "omitted_candidate_count": int(omitted_count or 0),
        "service_prompt_overlays_enabled": bool(prompt_profiles_enabled),
        "visible_candidate_tool_ids": visible_candidate_tool_ids,
    }
    return {
        "system_prompt": system_prompt,
        "user_prompt": prefix + candidate_block,
        "metadata": metadata,
    }


def _build_scheduler_system_prompt() -> str:
    return (
        "You are a penetration-testing scheduler assistant operating inside a governed workflow.\n"
        "Return strict JSON only.\n"
        "Rank only the supplied candidates and never invent tools or actions outside that list.\n"
        "Prefer closing baseline coverage gaps and immediate follow-up dependencies before niche checks.\n"
        "Use concise rationales grounded in the supplied context.\n"
        "Do not add markdown, prose, or extra commentary outside the JSON object."
    )


def _resolve_prompt_profile(*, service: str, context: Optional[Dict[str, Any]] = None) -> str:
    ctx = context if isinstance(context, dict) else {}
    signals = ctx.get("signals", {}) if isinstance(ctx.get("signals", {}), dict) else {}
    service_lower = str(service or "").strip().lower()
    if bool(signals.get("web_service")) or service_lower in _WEB_SERVICE_IDS:
        return "web"
    if (
        bool(signals.get("rdp_service"))
        or bool(signals.get("vnc_service"))
        or service_lower
        in {
            "ms-wbt-server",
            "rdp",
            "vnc",
            "vnc-http",
        }
    ):
        return "rdp_vnc"
    if service_lower in {"microsoft-ds", "netbios-ssn", "smb"}:
        return "smb"
    return "generic"


def _build_ranking_user_prompt_prefix(
    *,
    goal_profile: str,
    service: str,
    protocol: str,
    current_phase: str,
    service_profile: str,
    phase_profile: str,
    prompt_profile: str,
    context_block: str,
) -> str:
    profile_overlay = _build_prompt_profile_overlay(
        goal_profile=goal_profile,
        service_profile=service_profile,
        phase_profile=phase_profile,
    )
    return (
        "Task: rank scheduler-generated candidates for the next safe, high-value actions.\n"
        f"Prompt version: {SCHEDULER_PROMPT_VERSION}\n"
        f"Goal profile: {goal_profile}\n"
        f"Service: {service}\n"
        f"Protocol: {protocol}\n"
        f"Current phase: {current_phase}\n"
        f"Prompt profile: {prompt_profile}\n"
        "Lifecycle phases: initial_discovery -> service_fingerprint -> broad_vuln -> protocol_checks "
        "-> targeted_checks -> deep_web -> external_enrichment -> complete.\n"
        "Ranking priorities:\n"
        "1. Close missing baseline coverage first.\n"
        "2. Prefer immediate follow-up dependencies from existing evidence.\n"
        "3. Use technology-specific or vendor-specific checks only when the context supports them.\n"
        "4. Avoid rerunning tools that already executed successfully or are known missing.\n"
        "5. When analysis_mode is dig_deeper, reason over the full host context rather than the target port alone.\n"
        "6. Never recommend manual tests that directly invoke tools marked unavailable or command not found.\n"
        "7. If the remaining coverage gaps cannot be closed by any supplied candidate, return actions as [] instead of recommending unrelated retries.\n"
        "Ignore tool names mentioned elsewhere in the context if they are not present in the Candidates section.\n"
        f"{profile_overlay}"
        "Return ONLY JSON with this schema:\n"
        '{"actions":[{"tool_id":"...","score":0-100,"rationale":"..."}],'
        '"host_updates":{"hostname":"...","hostname_confidence":0-100,"os":"...","os_confidence":0-100,'
        '"technologies":[{"name":"...","version":"...","cpe":"...","evidence":"..."}]},'
        '"findings":[{"title":"...","severity":"critical|high|medium|low|info","cvss":0-10,'
        '"cve":"...","evidence":"..."}],'
        '"manual_tests":[{"why":"...","command":"...","scope_note":"..."}],'
        '"next_phase":"..."}\n'
        "If no safe or high-value action remains, return actions as [] and use manual_tests for suggestions.\n"
        f"{context_block}"
        "Candidates:\n"
    )


def _build_prompt_profile_overlay(*, goal_profile: str, service_profile: str, phase_profile: str) -> str:
    lines = []
    if service_profile == "web":
        lines.append(
            "Service overlay: web. Prefer screenshot, broad web vuln coverage, tech fingerprinting, content "
            "discovery, then evidence-driven follow-up."
        )
    elif service_profile == "smb":
        lines.append(
            "Service overlay: smb. Prefer signing checks, safe enumeration, and identity posture before deeper or "
            "specialized checks."
        )
    elif service_profile == "rdp_vnc":
        lines.append(
            "Service overlay: rdp_vnc. Prefer screenshot, banner, protocol metadata, TLS posture, and safe identity "
            "checks before niche follow-up."
        )
    else:
        lines.append(
            "Service overlay: generic. Prefer broad discovery, banners, vuln baselines, and protocol checks before "
            "specialized tools."
        )

    if phase_profile == "broad_vuln":
        lines.append(
            "Phase overlay: broad_vuln. Favor broad vuln discovery, CPE-to-CVE enrichment, and immediate follow-up "
            "dependencies before niche checks."
        )
    elif phase_profile == "deep_web":
        lines.append(
            "Phase overlay: deep_web. Favor bounded web follow-up such as whatweb, nikto, content discovery, and "
            "evidence-driven nuclei follow-up."
        )

    if str(goal_profile or "").strip().lower() == "external_pentest":
        lines.append(
            "Goal overlay: external_pentest. When Shodan or external enrichment is available and high-value, "
            "consider it after core baseline coverage is satisfied."
        )

    return "\n".join(lines) + "\n"


def _tool_matches_coverage_gap(tool_id: str, coverage_missing: Set[str]) -> bool:
    tool_norm = _normalize_tool_token(tool_id)
    if not tool_norm or not coverage_missing:
        return False
    if "missing_discovery" in coverage_missing and (tool_norm == "nmap" or tool_norm.startswith("nmap")):
        return True
    if "missing_banner" in coverage_missing and tool_norm == "banner":
        return True
    if {"missing_screenshot", "missing_remote_screenshot"} & coverage_missing and tool_norm in {
        "screenshooter",
        "x11screen",
    }:
        return True
    if "missing_nmap_vuln" in coverage_missing and tool_norm == "nmap-vuln.nse":
        return True
    if "missing_nuclei_auto" in coverage_missing and tool_norm == "nuclei-web":
        return True
    if "missing_cpe_cve_enrichment" in coverage_missing and tool_norm in {
        "nmap-vuln.nse",
        "nuclei-web",
        "nuclei-cves",
        "nuclei-exposures",
    }:
        return True
    if "missing_whatweb" in coverage_missing and tool_norm in {"whatweb", "whatweb-http", "whatweb-https"}:
        return True
    if "missing_nikto" in coverage_missing and tool_norm == "nikto":
        return True
    if "missing_web_content_discovery" in coverage_missing and tool_norm in {
        "web-content-discovery",
        "dirsearch",
        "ffuf",
        "feroxbuster",
        "gobuster",
    }:
        return True
    if "missing_http_followup" in coverage_missing and tool_norm in {"curl-headers", "curl-options", "curl-robots"}:
        return True
    if "missing_followup_after_vuln" in coverage_missing and tool_norm in {
        "whatweb",
        "whatweb-http",
        "whatweb-https",
        "nikto",
        "web-content-discovery",
        "dirsearch",
        "ffuf",
        "feroxbuster",
        "gobuster",
        "nuclei-cves",
        "nuclei-exposures",
        "curl-headers",
        "curl-options",
        "curl-robots",
    }:
        return True
    if "missing_smb_signing_checks" in coverage_missing and tool_norm in {"smb-security-mode", "smb2-security-mode"}:
        return True
    if "missing_internal_safe_enum" in coverage_missing and tool_norm in {
        "enum4linux-ng",
        "smbmap",
        "rpcclient-enum",
        "netexec",
        "smb-enum-users.nse",
    }:
        return True
    return False


def _candidate_visibility_priority(
    candidate: Dict[str, str],
    *,
    context: Optional[Dict[str, Any]] = None,
    prompt_type: str = "",
) -> int:
    tool_id = str(candidate.get("tool_id", "") or "")
    tool_norm = _normalize_tool_token(tool_id)
    if not tool_norm:
        return 0

    coverage_missing = _coverage_missing_ids(context)
    coverage_recommended = _coverage_recommended_tool_ids(context)
    priority = 0

    if tool_norm in coverage_recommended:
        priority += 220
    if _tool_matches_coverage_gap(tool_norm, coverage_missing):
        priority += 320

    if {"missing_screenshot", "missing_remote_screenshot"} & coverage_missing and tool_norm in {
        "screenshooter",
        "x11screen",
    }:
        priority += 120
    if "missing_nmap_vuln" in coverage_missing and tool_norm == "nmap-vuln.nse":
        priority += 110
    if "missing_nuclei_auto" in coverage_missing and tool_norm == "nuclei-web":
        priority += 110
    if "missing_whatweb" in coverage_missing and tool_norm in {"whatweb", "whatweb-http", "whatweb-https"}:
        priority += 100
    if "missing_nikto" in coverage_missing and tool_norm == "nikto":
        priority += 100
    if "missing_http_followup" in coverage_missing and tool_norm in {"curl-headers", "curl-options", "curl-robots"}:
        priority += 80
    if prompt_type == "ranking" and tool_norm in {"banner", "nmap"} and (coverage_missing & _STRICT_COVERAGE_GAP_IDS):
        priority -= 40

    return priority


def _prioritize_candidates_for_prompt(
    candidates: List[Dict[str, str]],
    *,
    context: Optional[Dict[str, Any]] = None,
    prompt_type: str = "",
) -> List[Dict[str, str]]:
    if not candidates:
        return []
    ranked = []
    for index, candidate in enumerate(candidates):
        ranked.append(
            (
                -int(_candidate_visibility_priority(candidate, context=context, prompt_type=prompt_type)),
                index,
                candidate,
            )
        )
    ranked.sort(key=lambda item: (item[0], item[1]))
    return [item[2] for item in ranked]


def _build_candidate_block(
    candidates: List[Dict[str, str]],
    prefix: str,
    *,
    context: Optional[Dict[str, Any]] = None,
    prompt_type: str = "",
) -> Tuple[str, int, List[str]]:
    if not candidates:
        return "", 0, []

    ordered_candidates = _prioritize_candidates_for_prompt(
        candidates,
        context=context,
        prompt_type=prompt_type,
    )
    candidate_lines = []
    visible_tool_ids = []
    omitted = 0
    budget = max(MIN_PROVIDER_CANDIDATE_BLOCK_CHARS, MAX_PROVIDER_PROMPT_CHARS - len(prefix) - 120)
    target_visible = min(
        len(ordered_candidates),
        MAX_PROVIDER_CANDIDATES,
        6 if prompt_type == "web_followup" else 8,
    )

    def _candidate_line(candidate: Dict[str, str], *, detail_level: int) -> Tuple[str, str]:
        tool_id = str(candidate.get("tool_id", "")).strip()[:120]
        prompt_info = get_scheduler_tool_prompt_info(
            tool_id,
            label=str(candidate.get("label", "")).strip(),
            command_template=str(candidate.get("command_template", "")),
            service_scope=str(candidate.get("service_scope", "")).strip(),
        )
        label_limit = 64 if detail_level <= 1 else MAX_CANDIDATE_LABEL_CHARS
        purpose_limit = 56 if detail_level <= 1 else MAX_CANDIDATE_PURPOSE_CHARS
        when_limit = 64 if detail_level == 2 else 0
        template_limit = 96 if detail_level == 2 else 0
        payload: Dict[str, Any] = {
            "tool_id": tool_id,
            "label": str(candidate.get("label", "")).strip()[:label_limit],
            "purpose": _normalize_prompt_text(prompt_info.purpose, purpose_limit),
        }
        arg_shape = str(prompt_info.arg_shape or "").strip()[:MAX_CANDIDATE_ARG_SHAPE_CHARS]
        if arg_shape:
            payload["arg_shape"] = arg_shape
        phase_tags = list(prompt_info.phase_tags[: 3 if detail_level <= 1 else 4])
        if phase_tags:
            payload["phase_tags"] = phase_tags
        if bool(prompt_info.safe_parallel):
            payload["safe_parallel"] = True
        if detail_level >= 1:
            service_scope = str(candidate.get("service_scope", "")).strip()[:72]
            if service_scope:
                payload["service_scope"] = service_scope
        if when_limit > 0:
            payload["when_to_use"] = _normalize_prompt_text(prompt_info.when_to_use, when_limit)
        if template_limit > 0:
            payload["command_template_excerpt"] = _normalize_prompt_text(
                str(candidate.get("command_template", "")),
                template_limit,
            )
        return json.dumps(payload, separators=(",", ":")), tool_id

    best_lines: List[str] = []
    best_visible_tool_ids: List[str] = []
    best_omitted = max(0, len(ordered_candidates) - MAX_PROVIDER_CANDIDATES)

    for detail_level in (2, 1, 0):
        current_lines: List[str] = []
        current_visible_tool_ids: List[str] = []
        current_used = 0
        current_omitted = 0
        for index, candidate in enumerate(ordered_candidates):
            if index >= MAX_PROVIDER_CANDIDATES:
                current_omitted = len(ordered_candidates) - index
                break
            line, tool_id = _candidate_line(candidate, detail_level=detail_level)
            projected = current_used + len(line) + 1
            if projected > budget:
                current_omitted = len(ordered_candidates) - index
                break
            current_lines.append(line)
            if tool_id:
                current_visible_tool_ids.append(tool_id)
            current_used = projected

        if current_lines:
            best_lines = current_lines
            best_visible_tool_ids = current_visible_tool_ids
            best_omitted = current_omitted
        if len(current_visible_tool_ids) >= target_visible:
            break

    candidate_lines = list(best_lines)
    visible_tool_ids = list(best_visible_tool_ids)
    omitted = int(best_omitted or 0)

    if not candidate_lines:
        first = ordered_candidates[0]
        line, tool_id = _candidate_line(first, detail_level=0)
        candidate_lines.append(line)
        if tool_id:
            visible_tool_ids.append(tool_id)
        omitted = max(0, len(ordered_candidates) - 1)

    if omitted > 0:
        candidate_lines.append(
            json.dumps({"note": f"{omitted} candidates omitted due to context budget"}, separators=(",", ":"))
        )

    return "\n".join(candidate_lines), omitted, _unique_strings(visible_tool_ids)


def _prompt_package_parts(
    prompt_package: Dict[str, Any],
    *,
    default_system_prompt: str = "Return strict JSON only.",
) -> Tuple[str, str, Dict[str, Any]]:
    if not isinstance(prompt_package, dict):
        return str(default_system_prompt or ""), str(prompt_package or ""), {}
    system_prompt = str(prompt_package.get("system_prompt", "") or default_system_prompt or "")
    user_prompt = str(prompt_package.get("user_prompt", "") or "")
    metadata = prompt_package.get("metadata", {}) if isinstance(prompt_package.get("metadata", {}), dict) else {}
    return system_prompt, user_prompt, metadata


def _openai_structured_outputs_enabled(provider_name: str, provider_cfg: Dict[str, Any]) -> bool:
    if str(provider_name or "").strip().lower() != "openai":
        return False
    if not isinstance(provider_cfg, dict):
        return False
    return bool(provider_cfg.get("structured_outputs", False))


def _scheduler_ranking_response_format(*, allowed_tool_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "scheduler_ranking_response",
            "strict": True,
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "required": ["actions", "host_updates", "findings", "manual_tests", "next_phase"],
                "properties": {
                    "actions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["tool_id", "score", "rationale"],
                            "properties": {
                                "tool_id": {"type": "string"},
                                "score": {"type": "number"},
                                "rationale": {"type": "string"},
                            },
                        },
                    },
                    "host_updates": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["hostname", "hostname_confidence", "os", "os_confidence", "technologies"],
                        "properties": {
                            "hostname": {"type": "string"},
                            "hostname_confidence": {"type": "number"},
                            "os": {"type": "string"},
                            "os_confidence": {"type": "number"},
                            "technologies": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "additionalProperties": False,
                                    "required": ["name", "version", "cpe", "evidence"],
                                    "properties": {
                                        "name": {"type": "string"},
                                        "version": {"type": "string"},
                                        "cpe": {"type": "string"},
                                        "evidence": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                    "findings": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["title", "severity", "cvss", "cve", "evidence"],
                            "properties": {
                                "title": {"type": "string"},
                                "severity": {
                                    "type": "string",
                                    "enum": ["critical", "high", "medium", "low", "info"],
                                },
                                "cvss": {"type": "number"},
                                "cve": {"type": "string"},
                                "evidence": {"type": "string"},
                            },
                        },
                    },
                    "manual_tests": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["why", "command", "scope_note"],
                            "properties": {
                                "why": {"type": "string"},
                                "command": {"type": "string"},
                                "scope_note": {"type": "string"},
                            },
                        },
                    },
                    "next_phase": {"type": "string"},
                },
            },
        },
    }
    allowed = _normalized_tool_id_map(allowed_tool_ids)
    if allowed:
        response_format["json_schema"]["schema"]["properties"]["actions"]["items"]["properties"]["tool_id"] = {
            "type": "string",
            "enum": list(allowed.values()),
        }
    return response_format


def _build_reflection_prompt_package(
    *,
    goal_profile: str,
    engagement_preset: str = "",
    service: str,
    protocol: str,
    context: Optional[Dict[str, Any]] = None,
    recent_rounds: Optional[List[Dict[str, Any]]] = None,
    trigger_reason: str = "",
    trigger_context: Optional[Dict[str, Any]] = None,
    context_summary_enabled: bool = True,
) -> Dict[str, Any]:
    ctx = context if isinstance(context, dict) else {}
    effective_goal_profile = _effective_prompt_goal_profile(
        goal_profile=goal_profile,
        engagement_preset=engagement_preset,
    )
    rounds = recent_rounds if isinstance(recent_rounds, list) else []
    trigger_reason_token = str(trigger_reason or "").strip().lower()[:64]
    trigger_payload = {}
    if trigger_reason_token:
        trigger_payload["reason"] = trigger_reason_token
    if isinstance(trigger_context, dict):
        for key in (
            "round_number",
            "current_phase",
            "previous_phase",
            "window_size",
            "repeated_selection_count",
        ):
            value = trigger_context.get(key, "")
            if value in ("", None):
                continue
            trigger_payload[key] = value
        recent_failures = [
            _normalize_prompt_text(str(item or "").strip(), 120)
            for item in list(trigger_context.get("recent_failures", []) or [])[:6]
            if str(item or "").strip()
        ]
        if recent_failures:
            trigger_payload["recent_failures"] = recent_failures
    current_phase = _determine_scheduler_phase(
        goal_profile=goal_profile,
        service=service,
        engagement_preset=engagement_preset,
        context=ctx,
    )
    service_profile = _resolve_prompt_profile(service=service, context=ctx)
    context_block = _build_context_block(
        ctx,
        current_phase_override=current_phase,
        include_summary=bool(context_summary_enabled),
    )
    recent_rounds_payload = _build_recent_rounds_block(rounds)
    trigger_block = ""
    if trigger_payload:
        rendered_trigger = json.dumps(trigger_payload, separators=(",", ":"))
        trigger_block = f"Reflection trigger:\n{_truncate_block_text(rendered_trigger, 640)}\n"
    system_prompt = (
        "You are an execution monitor for a governed penetration-testing scheduler.\n"
        "Return strict JSON only.\n"
        "Assess whether recent rounds are still productive.\n"
        "Do not invent tools outside the supplied recent decisions.\n"
        "Prefer continue unless the evidence clearly indicates a stall or completion.\n"
        "Manual tests must be safe validation suggestions only.\n"
        "Do not suggest manual tests that directly invoke tools marked unavailable or command not found."
    )
    user_prompt = (
        "Task: assess recent scheduler progress and detect stalls.\n"
        f"Prompt version: {SCHEDULER_REFLECTION_PROMPT_VERSION}\n"
        f"Goal profile: {effective_goal_profile}\n"
        f"Service: {service}\n"
        f"Protocol: {protocol}\n"
        f"Current phase: {current_phase}\n"
        f"Service profile: {service_profile}\n"
        "Return ONLY JSON with this schema:\n"
        '{"state":"continue|stalled|complete",'
        '"reason":"...",'
        '"priority_shift":"coverage_first|targeted_followup|manual_validation|stop",'
        '"promote_tool_ids":["..."],'
        '"suppress_tool_ids":["..."],'
        '"manual_tests":[{"why":"...","command":"...","scope_note":"..."}]}\n'
        f"{trigger_block}"
        f"{recent_rounds_payload}"
        f"{context_block}"
    )
    return {
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "metadata": {
            "prompt_version": SCHEDULER_REFLECTION_PROMPT_VERSION,
            "prompt_type": "reflection",
            "goal_profile": effective_goal_profile,
            "legacy_goal_profile": str(goal_profile or "").strip().lower(),
            "engagement_preset": str(engagement_preset or "").strip().lower(),
            "current_phase": current_phase,
            "service_profile": service_profile,
            "recent_round_count": len(rounds[:8]),
            "context_chars": len(context_block),
            "trigger_reason": trigger_reason_token,
            "trigger_context": trigger_payload,
        },
    }


def _build_web_followup_prompt_package(
    *,
    goal_profile: str,
    engagement_preset: str = "",
    service: str,
    protocol: str,
    candidates: List[Dict[str, str]],
    context: Optional[Dict[str, Any]] = None,
    context_summary_enabled: bool = True,
) -> Dict[str, Any]:
    ctx = context if isinstance(context, dict) else {}
    effective_goal_profile = _effective_prompt_goal_profile(
        goal_profile=goal_profile,
        engagement_preset=engagement_preset,
    )
    current_phase = _determine_scheduler_phase(
        goal_profile=goal_profile,
        service=service,
        engagement_preset=engagement_preset,
        context=ctx,
    )
    context_block = _build_context_block(
        ctx,
        current_phase_override=current_phase,
        include_summary=bool(context_summary_enabled),
    )
    system_prompt = (
        "You are a specialist web follow-up advisor operating inside a governed penetration-testing scheduler.\n"
        "Return strict JSON only.\n"
        "Choose only from the supplied candidate list and never invent tools or actions.\n"
        "Favor bounded, evidence-driven follow-up that closes concrete coverage gaps or validates observed web signals.\n"
        "Do not re-run broad baseline scans unless the context still shows they are missing.\n"
        "Manual tests must be safe validation suggestions only.\n"
        "Do not suggest manual tests that directly invoke tools marked unavailable or command not found."
    )
    prefix = (
        "Task: choose the strongest bounded web follow-up actions from the supplied candidates.\n"
        f"Prompt version: {SCHEDULER_WEB_FOLLOWUP_PROMPT_VERSION}\n"
        f"Goal profile: {effective_goal_profile}\n"
        f"Service: {service}\n"
        f"Protocol: {protocol}\n"
        f"Current phase: {current_phase}\n"
        "Selection priorities:\n"
        "1. Close missing web follow-up coverage before niche checks.\n"
        "2. Prefer technology, finding, CVE, or reflection-driven validation over generic retries.\n"
        "3. Choose a small bounded set of follow-up tools rather than broad rescan behavior.\n"
        "Return ONLY JSON with this schema:\n"
        '{"focus":"coverage_gap|tech_validation|vuln_followup|content_discovery|manual_review",'
        '"selected_tool_ids":["..."],'
        '"reason":"...",'
        '"manual_tests":[{"why":"...","command":"...","scope_note":"..."}]}\n'
        "If no specialist follow-up boost is warranted, return selected_tool_ids as [] and explain why.\n"
        f"{context_block}"
        "Candidates:\n"
    )
    candidate_block, omitted_count, _visible_candidate_tool_ids = _build_candidate_block(
        candidates,
        prefix,
        context=ctx,
        prompt_type="web_followup",
    )
    return {
        "system_prompt": system_prompt,
        "user_prompt": prefix + candidate_block,
        "metadata": {
            "prompt_version": SCHEDULER_WEB_FOLLOWUP_PROMPT_VERSION,
            "prompt_type": "web_followup",
            "goal_profile": effective_goal_profile,
            "legacy_goal_profile": str(goal_profile or "").strip().lower(),
            "engagement_preset": str(engagement_preset or "").strip().lower(),
            "current_phase": current_phase,
            "service_profile": "web",
            "candidate_count": len(candidates or []),
            "visible_candidate_count": len(_visible_candidate_tool_ids),
            "visible_candidate_tool_ids": _visible_candidate_tool_ids,
            "omitted_candidate_count": int(omitted_count or 0),
            "context_chars": len(context_block),
        },
    }


def _build_recent_rounds_block(rounds: List[Dict[str, Any]]) -> str:
    compact_rounds = []
    for item in list(rounds or [])[-8:]:
        if not isinstance(item, dict):
            continue
        payload = {
            "round": int(item.get("round", 0) or 0),
            "coverage_missing": [
                str(entry).strip().lower()[:64]
                for entry in list(item.get("coverage_missing", []) or [])[:24]
                if str(entry).strip()
            ],
            "findings_count": int(item.get("findings_count", 0) or 0),
            "manual_tests_count": int(item.get("manual_tests_count", 0) or 0),
            "technologies_count": int(item.get("technologies_count", 0) or 0),
            "next_phase": str(item.get("next_phase", "") or "")[:64],
            "observed_phase": str(item.get("observed_phase", "") or "")[:64],
            "recent_failures": [
                str(entry).strip().lower()[:120]
                for entry in list(item.get("recent_failures", []) or [])[:8]
                if str(entry).strip()
            ],
            "decision_tool_ids": [
                str(entry).strip().lower()[:80]
                for entry in list(item.get("decision_tool_ids", []) or [])[:16]
                if str(entry).strip()
            ],
            "decision_family_ids": [
                str(entry).strip().lower()[:80]
                for entry in list(item.get("decision_family_ids", []) or [])[:16]
                if str(entry).strip()
            ],
            "signal_key": str(item.get("signal_key", "") or "")[:240],
            "repeated_selection_count": int(item.get("repeated_selection_count", 0) or 0),
            "progress_score": int(item.get("progress_score", 0) or 0),
        }
        compact_rounds.append(payload)
    if not compact_rounds:
        return "Recent rounds:\n[]\n"
    rendered = json.dumps(compact_rounds, separators=(",", ":"))
    return f"Recent rounds:\n{_truncate_block_text(rendered, 2400)}\n"
