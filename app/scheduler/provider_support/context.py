"""Scheduler AI providers: context."""

from __future__ import annotations
from typing import Any, Dict, Optional, Set
from app.scheduler.provider_support.constants import MAX_PROVIDER_CONTEXT_CHARS, _WEB_SERVICE_IDS
from app.scheduler.provider_support.payloads import _collect_unavailable_tool_ids, _normalize_tool_token


def _normalize_tool_set(values: Any) -> set:
    normalized = set()
    if not isinstance(values, list):
        return normalized
    for item in values:
        token = str(item or "").strip().lower()
        if token:
            normalized.add(token)
    return normalized


def _feature_flag_enabled(config: Optional[Dict[str, Any]], flag_name: str, *, default: bool = True) -> bool:
    if not isinstance(config, dict):
        return bool(default)
    feature_flags = config.get("feature_flags", {})
    if not isinstance(feature_flags, dict):
        return bool(default)
    if flag_name not in feature_flags:
        return bool(default)
    return bool(feature_flags.get(flag_name, default))


def _determine_scheduler_phase(
    *, goal_profile: str, service: str, engagement_preset: str = "", context: Optional[Dict[str, Any]] = None
) -> str:
    ctx = context if isinstance(context, dict) else {}
    signals = ctx.get("signals", {}) if isinstance(ctx.get("signals", {}), dict) else {}
    coverage = ctx.get("coverage", {}) if isinstance(ctx.get("coverage", {}), dict) else {}
    coverage_missing = {
        str(item or "").strip().lower()
        for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
        if str(item or "").strip()
    }
    analysis_mode = str(coverage.get("analysis_mode", "") or ctx.get("analysis_mode", "") or "standard").strip().lower()
    attempted = _normalize_tool_set(ctx.get("attempted_tool_ids", []))
    service_lower = str(service or "").strip().lower()
    is_web = bool(signals.get("web_service")) or service_lower in _WEB_SERVICE_IDS
    if "missing_discovery" in coverage_missing:
        return "initial_discovery"
    if "missing_screenshot" in coverage_missing or "missing_remote_screenshot" in coverage_missing:
        return "service_fingerprint"
    if {"missing_nmap_vuln", "missing_nuclei_auto"} & coverage_missing:
        return "broad_vuln"
    if "missing_cpe_cve_enrichment" in coverage_missing:
        return "broad_vuln"
    if "missing_smb_signing_checks" in coverage_missing:
        return "protocol_checks"
    if {"missing_whatweb", "missing_nikto", "missing_web_content_discovery"} & coverage_missing:
        return "deep_web"
    if "missing_followup_after_vuln" in coverage_missing:
        return "targeted_checks"
    has_discovery = any(
        (token in attempted for token in {"nmap", "banner", "fingerprint-strings", "http-title", "ssl-cert"})
    )
    has_screenshot = "screenshooter" in attempted
    has_broad_vuln = bool({"nmap-vuln.nse", "nuclei-web"} & attempted)
    has_protocol_checks = any(
        (
            token in attempted
            for token in {
                "smb-security-mode",
                "smb-os-discovery",
                "rdp-ntlm-info",
                "ssh-hostkey",
                "ssh-auth-methods.nse",
                "snmp-info",
                "sslscan",
                "testssl.sh",
            }
        )
    )
    has_deep_web = any(
        (
            token in attempted
            for token in {
                "whatweb",
                "whatweb-http",
                "whatweb-https",
                "httpx",
                "nikto",
                "web-content-discovery",
                "nuclei-cves",
                "nuclei-exposures",
                "nuclei-wordpress",
                "curl-headers",
                "curl-options",
                "curl-robots",
                "wafw00f",
                "wpscan",
            }
        )
    )
    shodan_enabled = bool(signals.get("shodan_enabled"))
    shodan_checked = any((token in attempted for token in {"shodan-enrichment", "shodan-host", "pyshodan"}))
    effective_goal_profile = _effective_prompt_goal_profile(
        goal_profile=goal_profile, engagement_preset=engagement_preset
    )
    if not has_discovery:
        return "initial_discovery"
    if (is_web or bool(signals.get("rdp_service")) or bool(signals.get("vnc_service"))) and (not has_screenshot):
        return "service_fingerprint"
    if not has_broad_vuln:
        return "broad_vuln"
    if not has_protocol_checks:
        return "protocol_checks"
    if is_web and (not has_deep_web):
        return "deep_web"
    if effective_goal_profile == "external_pentest" and shodan_enabled and (not shodan_checked):
        return "external_enrichment"
    if analysis_mode == "dig_deeper":
        return "deep_validation"
    return "targeted_checks"


def determine_scheduler_phase(
    goal_profile: str, service: str, engagement_preset: str = "", context: Optional[Dict[str, Any]] = None
) -> str:
    return _determine_scheduler_phase(
        goal_profile=goal_profile, service=service, engagement_preset=engagement_preset, context=context
    )


def _effective_prompt_goal_profile(*, goal_profile: str, engagement_preset: str = "") -> str:
    preset = str(engagement_preset or "").strip().lower()
    if preset:
        return preset
    return str(goal_profile or "").strip().lower()


def _coverage_missing_ids(context: Optional[Dict[str, Any]]) -> Set[str]:
    if not isinstance(context, dict):
        return set()
    coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
    return {
        _normalize_tool_token(item)
        for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
        if _normalize_tool_token(item)
    }


def _coverage_recommended_tool_ids(context: Optional[Dict[str, Any]]) -> Set[str]:
    if not isinstance(context, dict):
        return set()
    coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
    return {
        _normalize_tool_token(item)
        for item in (
            coverage.get("recommended_tool_ids", [])
            if isinstance(coverage.get("recommended_tool_ids", []), list)
            else []
        )
        if _normalize_tool_token(item)
    }


def _truncate_block_text(value: str, max_chars: int) -> str:
    text = str(value or "")
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "\n...[truncated]"


def _build_context_block(
    context: Dict[str, Any], *, current_phase_override: str = "", include_summary: bool = True
) -> str:
    if not isinstance(context, dict) or not context:
        return ""
    lines = []
    unavailable_tool_ids = set(_collect_unavailable_tool_ids(context))
    from app.scheduler.provider_support import context_sections

    lines.extend(
        context_sections._context_summary(context, current_phase_override, include_summary, unavailable_tool_ids)
    )
    lines.extend(context_sections._context_target(context))
    lines.extend(context_sections._context_analysis_mode(context))
    lines.extend(context_sections._context_ports(context))
    lines.extend(context_sections._context_technologies(context))
    lines.extend(context_sections._context_cves(context))
    lines.extend(context_sections._context_coverage(context))
    lines.extend(context_sections._context_signals(context))
    lines.extend(context_sections._context_ai_state(context, unavailable_tool_ids))
    lines.extend(context_sections._context_attempts(context))
    lines.extend(context_sections._context_scripts(context))
    lines.extend(context_sections._context_processes(context))
    lines.extend(context_sections._context_target_scripts(context))
    lines.extend(context_sections._context_target_processes(context))
    if not lines:
        return ""
    rendered = "\n".join(lines)
    bounded = _truncate_block_text(rendered, MAX_PROVIDER_CONTEXT_CHARS)
    return f"Context:\n{bounded}\n"
