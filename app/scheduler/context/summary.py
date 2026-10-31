from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.scheduler.planner import SchedulerPlanner
from app.scheduler.context import excerpt
from app.scheduler.context import technology


def build_scheduler_context_summary(
    *,
    target: Optional[Dict[str, Any]],
    analysis_mode: str,
    coverage: Optional[Dict[str, Any]],
    signals: Optional[Dict[str, Any]],
    current_phase: str = "",
    attempted_tool_ids: Any,
    attempted_family_ids: Any = None,
    summary_technologies: Optional[List[Dict[str, Any]]] = None,
    host_cves: Optional[List[Dict[str, Any]]] = None,
    host_ai_state: Optional[Dict[str, Any]] = None,
    recent_processes: Optional[List[Dict[str, Any]]] = None,
    target_recent_processes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    target_payload = target if isinstance(target, dict) else {}
    coverage_payload = coverage if isinstance(coverage, dict) else {}
    signals_payload = signals if isinstance(signals, dict) else {}
    ai_payload = host_ai_state if isinstance(host_ai_state, dict) else {}
    technology_rows = summary_technologies if isinstance(summary_technologies, list) else []
    host_cve_rows = host_cves if isinstance(host_cves, list) else []
    all_recent_processes = recent_processes if isinstance(recent_processes, list) else []
    scoped_recent_processes = target_recent_processes if isinstance(target_recent_processes, list) else []

    def _unique_strings(values: Any, *, limit: int, max_chars: int, lowercase: bool = False) -> List[str]:
        rows: List[str] = []
        seen = set()
        for item in list(values or []):
            token = excerpt.truncate_scheduler_text(item, max_chars)
            if lowercase:
                token = token.lower()
            if not token:
                continue
            key = token.lower()
            if key in seen:
                continue
            seen.add(key)
            rows.append(token)
            if len(rows) >= int(limit):
                break
        return rows

    focus = {}
    analysis_mode_value = str(analysis_mode or coverage_payload.get("analysis_mode", "") or "").strip().lower()
    if analysis_mode_value:
        focus["analysis_mode"] = analysis_mode_value[:24]
    service_value = str(target_payload.get("service", "") or "").strip()
    if service_value:
        focus["service"] = service_value[:64]
    service_product = str(target_payload.get("service_product", "") or "").strip()
    if service_product:
        focus["service_product"] = service_product[:120]
    service_version = str(target_payload.get("service_version", "") or "").strip()
    if service_version:
        focus["service_version"] = service_version[:80]
    coverage_stage = str(coverage_payload.get("stage", "") or "").strip().lower()
    if coverage_stage:
        focus["coverage_stage"] = coverage_stage[:32]
    current_phase_value = str(current_phase or ai_payload.get("next_phase", "") or "").strip().lower()
    if current_phase_value:
        focus["current_phase"] = current_phase_value[:64]

    confirmed_facts = []
    hostname_value = str(target_payload.get("hostname", "") or "").strip()
    if hostname_value:
        confirmed_facts.append(f"hostname: {hostname_value}")
    os_value = str(target_payload.get("os", "") or "").strip()
    if os_value:
        confirmed_facts.append(f"os: {os_value}")
    service_fact = str(target_payload.get("service", "") or "").strip()
    port_value = str(target_payload.get("port", "") or "").strip()
    protocol_value = str(target_payload.get("protocol", "") or "").strip().lower()
    service_stack = " ".join(
        part
        for part in [
            str(target_payload.get("service_product", "") or "").strip(),
            str(target_payload.get("service_version", "") or "").strip(),
        ]
        if part
    ).strip()
    service_location = ""
    if port_value and protocol_value:
        service_location = f"{port_value}/{protocol_value}"
    elif port_value:
        service_location = port_value
    if service_fact:
        detail_bits = []
        if service_location:
            detail_bits.append(f"on {service_location}")
        if service_stack:
            detail_bits.append(f"({service_stack})")
        confirmed_facts.append(
            " ".join(part for part in [f"service: {service_fact}", " ".join(detail_bits).strip()] if part).strip()
        )
    elif service_stack:
        confirmed_facts.append(f"service stack: {service_stack}")
    confirmed_facts = _unique_strings(confirmed_facts, limit=6, max_chars=140)

    coverage_missing = _unique_strings(
        coverage_payload.get("missing", []),
        limit=8,
        max_chars=64,
        lowercase=True,
    )
    recommended_tools = _unique_strings(
        coverage_payload.get("recommended_tool_ids", []),
        limit=8,
        max_chars=80,
        lowercase=True,
    )

    active_signals = []
    for key, value in sorted(signals_payload.items(), key=lambda item: str(item[0] or "").lower()):
        if isinstance(value, bool) and value:
            active_signals.append(str(key or "").strip().lower()[:48])
        if len(active_signals) >= 10:
            break

    technology_labels = []
    for item in technology_rows[:16]:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "") or "").strip()
        version = str(item.get("version", "") or "").strip()
        cpe = str(item.get("cpe", "") or "").strip()
        label = " ".join(part for part in [name, version] if part).strip() or cpe
        label = excerpt.truncate_scheduler_text(label, 96)
        if label:
            technology_labels.append(label)
    known_technologies = _unique_strings(technology_labels, limit=8, max_chars=96)
    likely_technologies = list(known_technologies)

    finding_labels = []
    ai_findings = ai_payload.get("findings", []) if isinstance(ai_payload.get("findings", []), list) else []
    sorted_findings = sorted(
        [item for item in ai_findings if isinstance(item, dict)],
        key=lambda row: technology.finding_sort_key(row),
        reverse=True,
    )
    for item in sorted_findings[:10]:
        title = str(item.get("title", "") or item.get("cve", "") or "").strip()
        severity = str(item.get("severity", "") or "").strip().lower()
        label = title
        if severity:
            label = f"{label} [{severity}]".strip()
        label = excerpt.truncate_scheduler_text(label, 120)
        if label:
            finding_labels.append(label)
    for item in host_cve_rows[:8]:
        if not isinstance(item, dict):
            continue
        cve_name = str(item.get("name", "") or "").strip()
        severity = str(item.get("severity", "") or "").strip().lower()
        label = cve_name or str(item.get("product", "") or "").strip()
        if severity and label:
            label = f"{label} [{severity}]"
        label = excerpt.truncate_scheduler_text(label, 120)
        if label:
            finding_labels.append(label)
    top_findings = _unique_strings(finding_labels, limit=8, max_chars=120)
    important_findings = list(top_findings)

    attempted_values = sorted(
        {str(item or "").strip().lower() for item in list(attempted_tool_ids or set()) if str(item or "").strip()}
    )
    recent_attempts = _unique_strings(attempted_values, limit=10, max_chars=80, lowercase=True)
    attempted_families = _unique_strings(
        sorted(
            {str(item or "").strip().lower() for item in list(attempted_family_ids or set()) if str(item or "").strip()}
        ),
        limit=8,
        max_chars=80,
        lowercase=True,
    )

    def _failure_labels(process_rows: List[Dict[str, Any]]) -> List[str]:
        rows = []
        for item in process_rows[:32]:
            if not isinstance(item, dict):
                continue
            tool_id = str(item.get("tool_id", "") or "").strip().lower()
            status = str(item.get("status", "") or "").strip().lower()
            output_excerpt = str(item.get("output_excerpt", "") or "").strip().lower()
            failure_reason = ""
            if any(token in status for token in ["crash", "fail", "error", "timeout", "cancel", "kill", "missing"]):
                failure_reason = status
            missing_scripts = excerpt.extract_missing_nse_script_tokens(output_excerpt)
            if (
                not failure_reason
                and missing_scripts
                and ((tool_id.endswith(".nse") and tool_id in missing_scripts) or not tool_id)
            ):
                failure_reason = "missing script"
            elif not failure_reason:
                unavailable_tokens = excerpt.extract_unavailable_tool_tokens(output_excerpt)
                if unavailable_tokens and (
                    not tool_id or bool(unavailable_tokens & excerpt.scheduler_tool_alias_tokens(tool_id))
                ):
                    failure_reason = "command not found"
            if not failure_reason and excerpt.looks_like_local_tool_dependency_failure(output_excerpt):
                failure_reason = "dependency failure"
            if not failure_reason and "no such file" in output_excerpt:
                failure_reason = "missing file"
            elif not failure_reason and ("traceback" in output_excerpt or "exception" in output_excerpt):
                failure_reason = "exception"
            if not failure_reason:
                continue
            label = ": ".join(part for part in [tool_id[:80], failure_reason[:80]] if part)
            if label:
                rows.append(label)
        return rows

    recent_failures = _unique_strings(
        _failure_labels(scoped_recent_processes) + _failure_labels(all_recent_processes),
        limit=6,
        max_chars=120,
        lowercase=True,
    )

    manual_tests = []
    for item in list(ai_payload.get("manual_tests", []) or [])[:6]:
        if not isinstance(item, dict):
            continue
        command = excerpt.truncate_scheduler_text(item.get("command", ""), 140)
        if command:
            manual_tests.append(command)
    manual_tests = _unique_strings(manual_tests, limit=4, max_chars=140)

    reflection_posture = {}
    reflection = ai_payload.get("reflection", {}) if isinstance(ai_payload.get("reflection", {}), dict) else {}
    if reflection:
        reflection_state = str(reflection.get("state", "") or "").strip().lower()
        if reflection_state:
            reflection_posture["state"] = reflection_state[:24]
        priority_shift = str(reflection.get("priority_shift", "") or "").strip().lower()
        if priority_shift:
            reflection_posture["priority_shift"] = priority_shift[:64]
        trigger_reason = str(reflection.get("trigger_reason", "") or "").strip().lower()
        if trigger_reason:
            reflection_posture["trigger_reason"] = trigger_reason[:64]
        reason = excerpt.truncate_scheduler_text(reflection.get("reason", ""), 180)
        if reason:
            reflection_posture["reason"] = reason
        suppress_tool_ids = _unique_strings(
            reflection.get("suppress_tool_ids", []),
            limit=6,
            max_chars=80,
            lowercase=True,
        )
        if suppress_tool_ids:
            reflection_posture["suppress_tool_ids"] = suppress_tool_ids
        promote_tool_ids = _unique_strings(
            reflection.get("promote_tool_ids", []),
            limit=6,
            max_chars=80,
            lowercase=True,
        )
        if promote_tool_ids:
            reflection_posture["promote_tool_ids"] = promote_tool_ids

    summary = {}
    if focus:
        summary["focus"] = focus
    if confirmed_facts:
        summary["confirmed_facts"] = confirmed_facts
    if coverage_missing:
        summary["missing_coverage"] = list(coverage_missing)
        summary["coverage_missing"] = coverage_missing
    if recommended_tools:
        summary["followup_candidates"] = list(recommended_tools)
        summary["recommended_tools"] = recommended_tools
    if active_signals:
        summary["active_signals"] = active_signals
    if known_technologies:
        summary["likely_technologies"] = list(likely_technologies)
        summary["known_technologies"] = known_technologies
    if top_findings:
        summary["important_findings"] = list(important_findings)
        summary["top_findings"] = top_findings
    if attempted_families:
        summary["attempted_families"] = attempted_families
    if recent_attempts:
        summary["recent_attempts"] = recent_attempts
    if recent_failures:
        summary["recent_failures"] = recent_failures
    if manual_tests:
        summary["manual_tests"] = manual_tests
    if reflection_posture:
        summary["reflection_posture"] = reflection_posture
    return summary


def build_scheduler_coverage_summary(
    *,
    service_name: str,
    signals: Dict[str, Any],
    observed_tool_ids: set,
    host_cves: List[Dict[str, Any]],
    inferred_technologies: List[Dict[str, str]],
    analysis_mode: str,
) -> Dict[str, Any]:
    tool_ids = {str(tool).lower() for tool in observed_tool_ids or set()}

    def seen(*prefixes):
        return any(any(tool.startswith(prefix) for prefix in prefixes) for tool in tool_ids)

    missing = []
    recommended = []
    has_discovery = seen("nmap", "fingerprint-strings")
    has_signing = seen("smb-security-mode", "smb2-security-mode")
    has_enumeration = seen("enum4linux-ng", "smbmap", "rpcclient-enum", "smb-enum-users")
    if not has_discovery:
        missing.append("missing_discovery")
        recommended.append("nmap")
    if str(service_name).lower() in {"smb", "microsoft-ds", "netbios-ssn"}:
        if not has_signing:
            missing.append("missing_smb_signing_checks")
            recommended.extend(["smb-security-mode.nse", "smb2-security-mode.nse"])
        if not has_enumeration:
            missing.append("missing_internal_safe_enum")
            recommended.extend(["enum4linux-ng", "smbmap", "rpcclient-enum"])
    return {
        "analysis_mode": "standard",
        "stage": "baseline" if missing else "post_baseline",
        "missing": missing,
        "recommended_tool_ids": recommended,
        "observed_tool_ids": sorted(tool_ids),
        "has": {"discovery": has_discovery, "smb_signing_checks": has_signing, "internal_safe_enum": has_enumeration},
        "host_cve_count": len(host_cves or []),
    }
