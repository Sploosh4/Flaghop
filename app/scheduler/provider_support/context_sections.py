"""Scheduler AI providers: context."""

from __future__ import annotations
import json
from typing import Any, Dict
from app.scheduler.provider_support.constants import MAX_PROVIDER_CONTEXT_ITEMS, _ALWAYS_INCLUDE_BOOL_SIGNALS
from app.scheduler.provider_support.payloads import (
    _normalize_prompt_text,
    _normalize_provider_cpe_token,
    _provider_cpe_base,
    _provider_version_from_cpe,
    _safe_float,
    _sanitize_provider_technology_version_for_tech,
    _shell_primary_command_token,
)


def _context_summary(context, current_phase_override, include_summary, unavailable_tool_ids):
    lines = []
    context_summary = context.get("context_summary", {})
    if include_summary and isinstance(context_summary, dict) and context_summary:
        summary_payload: Dict[str, Any] = {}
        focus = context_summary.get("focus", {})
        if isinstance(focus, dict):
            compact_focus = {}
            for key, max_chars in (
                ("analysis_mode", 24),
                ("service", 64),
                ("service_product", 120),
                ("service_version", 80),
                ("coverage_stage", 32),
                ("current_phase", 64),
            ):
                value = str(focus.get(key, "")).strip()
                if key == "current_phase" and str(current_phase_override or "").strip():
                    value = str(current_phase_override or "").strip()
                if value:
                    compact_focus[key] = value[:max_chars]
            if str(current_phase_override or "").strip() and "current_phase" not in compact_focus:
                compact_focus["current_phase"] = str(current_phase_override or "").strip()[:64]
            if compact_focus:
                summary_payload["focus"] = compact_focus
        elif str(current_phase_override or "").strip():
            summary_payload["focus"] = {"current_phase": str(current_phase_override or "").strip()[:64]}
        for output_key, source_keys, limit, max_chars in (
            ("confirmed_facts", ("confirmed_facts",), 6, 140),
            ("missing_coverage", ("missing_coverage", "coverage_missing"), 8, 64),
            ("followup_candidates", ("followup_candidates", "recommended_tools"), 8, 80),
            ("active_signals", ("active_signals",), 10, 48),
            ("likely_technologies", ("likely_technologies", "known_technologies"), 8, 96),
            ("important_findings", ("important_findings", "top_findings"), 8, 120),
            ("attempted_families", ("attempted_families",), 8, 80),
            ("recent_attempts", ("recent_attempts",), 10, 80),
            ("recent_failures", ("recent_failures",), 6, 120),
            ("manual_tests", ("manual_tests",), 4, 140),
        ):
            values = []
            for source_key in source_keys:
                candidate_values = context_summary.get(source_key, [])
                if isinstance(candidate_values, list) and candidate_values:
                    values = candidate_values
                    break
            if not isinstance(values, list):
                continue
            compact_values = []
            for item in values[:limit]:
                token = _normalize_prompt_text(str(item).strip(), max_chars)
                if not token:
                    continue
                if output_key == "manual_tests":
                    primary_command = _shell_primary_command_token(token)
                    if primary_command and primary_command in unavailable_tool_ids:
                        continue
                compact_values.append(token)
            if compact_values:
                summary_payload[output_key] = compact_values
        reflection_posture = context_summary.get("reflection_posture", {})
        if isinstance(reflection_posture, dict) and reflection_posture:
            reflection_payload = {}
            for key, max_chars in (("state", 24), ("priority_shift", 64), ("reason", 180)):
                value = _normalize_prompt_text(str(reflection_posture.get(key, "")).strip(), max_chars)
                if value:
                    reflection_payload[key] = value
            for key in ("suppress_tool_ids", "promote_tool_ids"):
                values = reflection_posture.get(key, [])
                if not isinstance(values, list):
                    continue
                compact_values = [
                    _normalize_prompt_text(str(item).strip(), 80) for item in values[:6] if str(item).strip()
                ]
                if compact_values:
                    reflection_payload[key] = compact_values
            if reflection_payload:
                summary_payload["reflection_posture"] = reflection_payload
        if summary_payload:
            lines.append(json.dumps({"context_summary": summary_payload}, separators=(",", ":")))
    return lines


def _context_target(context):
    lines = []
    target = context.get("target", {})
    if isinstance(target, dict):
        target_payload = {
            "host_ip": str(target.get("host_ip", "")).strip()[:80],
            "hostname": str(target.get("hostname", "")).strip()[:120],
            "os": str(target.get("os", "")).strip()[:80],
            "port": str(target.get("port", "")).strip()[:20],
            "protocol": str(target.get("protocol", "")).strip()[:12],
            "service": str(target.get("service", "")).strip()[:64],
            "service_product": str(target.get("service_product", "")).strip()[:120],
            "service_version": str(target.get("service_version", "")).strip()[:80],
            "service_extrainfo": str(target.get("service_extrainfo", "")).strip()[:120],
            "shodan_enabled": bool(target.get("shodan_enabled", False)),
        }
        host_open_services = target.get("host_open_services", [])
        if isinstance(host_open_services, list):
            target_payload["host_open_services"] = [
                str(item).strip()[:48] for item in host_open_services[:64] if str(item).strip()
            ]
        host_open_ports = target.get("host_open_ports", [])
        if isinstance(host_open_ports, list):
            target_payload["host_open_ports"] = [
                str(item).strip()[:96] for item in host_open_ports[:120] if str(item).strip()
            ]
        host_banners = target.get("host_banners", [])
        if isinstance(host_banners, list):
            target_payload["host_banners"] = [
                _normalize_prompt_text(str(item).strip(), 220) for item in host_banners[:96] if str(item).strip()
            ]
        if any(target_payload.values()):
            lines.append(json.dumps({"target": target_payload}, separators=(",", ":")))
    return lines


def _context_analysis_mode(context):
    lines = []
    analysis_mode = str(context.get("analysis_mode", "")).strip().lower()
    if analysis_mode:
        lines.append(json.dumps({"analysis_mode": analysis_mode[:32]}, separators=(",", ":")))
    return lines


def _context_ports(context):
    lines = []
    host_ports = context.get("host_ports", [])
    if isinstance(host_ports, list):
        compact_ports = []
        for item in host_ports[:MAX_PROVIDER_CONTEXT_ITEMS]:
            if not isinstance(item, dict):
                continue
            port_payload = {
                "port": str(item.get("port", "")).strip()[:20],
                "protocol": str(item.get("protocol", "")).strip()[:12],
                "state": str(item.get("state", "")).strip()[:32],
                "service": str(item.get("service", "")).strip()[:64],
                "service_product": str(item.get("service_product", "")).strip()[:120],
                "service_version": str(item.get("service_version", "")).strip()[:80],
                "service_extrainfo": str(item.get("service_extrainfo", "")).strip()[:120],
                "banner": _normalize_prompt_text(str(item.get("banner", "")).strip(), 220),
            }
            scripts = item.get("scripts", [])
            if isinstance(scripts, list):
                compact_scripts = [str(entry).strip()[:96] for entry in scripts if str(entry).strip()]
                if compact_scripts:
                    port_payload["scripts"] = compact_scripts[:16]
            if any((value for value in port_payload.values())):
                compact_ports.append(port_payload)
        if compact_ports:
            lines.append(json.dumps({"host_ports": compact_ports}, separators=(",", ":")))
    return lines


def _context_technologies(context):
    lines = []
    inferred_technologies = context.get("inferred_technologies", [])
    if isinstance(inferred_technologies, list):
        compact_inferred = []
        for item in inferred_technologies[:24]:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()[:120]
            evidence = _normalize_prompt_text(str(item.get("evidence", "")).strip(), 220)
            cpe = _normalize_provider_cpe_token(item.get("cpe", ""))
            version = _sanitize_provider_technology_version_for_tech(
                name=name, version=item.get("version", ""), cpe=cpe, evidence=evidence
            )
            if (
                not version
                and cpe
                and (
                    not _sanitize_provider_technology_version_for_tech(
                        name=name, version=_provider_version_from_cpe(cpe), cpe=cpe, evidence=evidence
                    )
                )
            ):
                cpe = _provider_cpe_base(cpe)
            if not name and (not cpe):
                continue
            compact_inferred.append({"name": name, "version": version, "cpe": cpe, "evidence": evidence})
        if compact_inferred:
            lines.append(json.dumps({"inferred_technologies": compact_inferred}, separators=(",", ":")))
    return lines


def _context_cves(context):
    lines = []
    host_cves = context.get("host_cves", [])
    if isinstance(host_cves, list):
        compact_cves = []
        for item in host_cves[:MAX_PROVIDER_CONTEXT_ITEMS]:
            if not isinstance(item, dict):
                continue
            row = {
                "name": str(item.get("name", "")).strip()[:96],
                "severity": str(item.get("severity", "")).strip().lower()[:24],
                "product": str(item.get("product", "")).strip()[:120],
                "version": str(item.get("version", "")).strip()[:80],
                "url": str(item.get("url", "")).strip()[:220],
            }
            if any(row.values()):
                compact_cves.append(row)
        if compact_cves:
            lines.append(json.dumps({"host_cves": compact_cves}, separators=(",", ":")))
    return lines


def _context_coverage(context):
    lines = []
    coverage = context.get("coverage", {})
    if isinstance(coverage, dict) and coverage:
        payload: Dict[str, Any] = {
            "analysis_mode": str(coverage.get("analysis_mode", "")).strip().lower()[:24],
            "stage": str(coverage.get("stage", "")).strip().lower()[:32],
            "host_cve_count": int(coverage.get("host_cve_count", 0) or 0),
        }
        missing = coverage.get("missing", [])
        if isinstance(missing, list):
            compact_missing = [str(item).strip().lower()[:64] for item in missing[:24] if str(item).strip()]
            if compact_missing:
                payload["missing"] = compact_missing
        recommended = coverage.get("recommended_tool_ids", [])
        if isinstance(recommended, list):
            compact_rec = [str(item).strip().lower()[:80] for item in recommended[:32] if str(item).strip()]
            if compact_rec:
                payload["recommended_tool_ids"] = compact_rec
        has_map = coverage.get("has", {})
        if isinstance(has_map, dict):
            compact_has = {}
            for key, value in has_map.items():
                if isinstance(value, bool):
                    compact_has[str(key).strip()[:40]] = bool(value)
            if compact_has:
                payload["has"] = compact_has
        if any(payload.values()):
            lines.append(json.dumps({"coverage": payload}, separators=(",", ":")))
    return lines


def _context_signals(context):
    lines = []
    signals = context.get("signals", {})
    if isinstance(signals, dict) and signals:
        signal_payload = {}
        for key, value in signals.items():
            if isinstance(value, bool):
                normalized_key = str(key)
                if value or normalized_key in _ALWAYS_INCLUDE_BOOL_SIGNALS:
                    signal_payload[normalized_key] = bool(value)
            elif isinstance(value, (int, float)):
                if value:
                    signal_payload[str(key)] = value
            elif isinstance(value, str):
                cleaned = value.strip()
                if cleaned:
                    signal_payload[str(key)] = cleaned[:120]
            elif isinstance(value, list):
                compact = [str(item).strip()[:80] for item in value if str(item).strip()]
                if compact:
                    signal_payload[str(key)] = compact[:24]
        if signal_payload:
            lines.append(json.dumps({"signals": signal_payload}, separators=(",", ":")))
    return lines


def _context_ai_state(context, unavailable_tool_ids):
    lines = []
    host_ai_state = context.get("host_ai_state", {})
    if isinstance(host_ai_state, dict) and host_ai_state:
        ai_payload: Dict[str, Any] = {
            "updated_at": str(host_ai_state.get("updated_at", "")).strip()[:64],
            "provider": str(host_ai_state.get("provider", "")).strip()[:40],
            "goal_profile": str(host_ai_state.get("goal_profile", "")).strip()[:64],
            "next_phase": str(host_ai_state.get("next_phase", "")).strip()[:64],
        }
        host_updates = host_ai_state.get("host_updates", {})
        if isinstance(host_updates, dict):
            ai_payload["host_updates"] = {
                "hostname": str(host_updates.get("hostname", "")).strip()[:120],
                "hostname_confidence": _safe_float(
                    host_updates.get("hostname_confidence"), minimum=0.0, maximum=100.0, default=0.0
                ),
                "os": str(host_updates.get("os", "")).strip()[:80],
                "os_confidence": _safe_float(
                    host_updates.get("os_confidence"), minimum=0.0, maximum=100.0, default=0.0
                ),
            }
        technologies = host_ai_state.get("technologies", [])
        if isinstance(technologies, list):
            compact_technologies = []
            for item in technologies[:24]:
                if not isinstance(item, dict):
                    continue
                name = str(item.get("name", "")).strip()[:120]
                evidence = _normalize_prompt_text(str(item.get("evidence", "")).strip(), 220)
                cpe = _normalize_provider_cpe_token(item.get("cpe", ""))
                version = _sanitize_provider_technology_version_for_tech(
                    name=name, version=item.get("version", ""), cpe=cpe, evidence=evidence
                )
                if (
                    not version
                    and cpe
                    and (
                        not _sanitize_provider_technology_version_for_tech(
                            name=name, version=_provider_version_from_cpe(cpe), cpe=cpe, evidence=evidence
                        )
                    )
                ):
                    cpe = _provider_cpe_base(cpe)
                if not name and (not cpe):
                    continue
                compact_technologies.append({"name": name, "version": version, "cpe": cpe, "evidence": evidence})
            if compact_technologies:
                ai_payload["technologies"] = compact_technologies
        findings = host_ai_state.get("findings", [])
        if isinstance(findings, list):
            compact_findings = []
            for item in findings[:24]:
                if not isinstance(item, dict):
                    continue
                title = str(item.get("title", "")).strip()[:220]
                severity = str(item.get("severity", "")).strip().lower()[:16]
                cve = str(item.get("cve", "")).strip()[:64]
                evidence = _normalize_prompt_text(str(item.get("evidence", "")).strip(), 220)
                if not title and (not cve):
                    continue
                compact_findings.append({"title": title, "severity": severity, "cve": cve, "evidence": evidence})
            if compact_findings:
                ai_payload["findings"] = compact_findings
        manual_tests = host_ai_state.get("manual_tests", [])
        if isinstance(manual_tests, list):
            compact_manual = []
            for item in manual_tests[:16]:
                if not isinstance(item, dict):
                    continue
                command = _normalize_prompt_text(str(item.get("command", "")).strip(), 220)
                why = _normalize_prompt_text(str(item.get("why", "")).strip(), 180)
                scope_note = _normalize_prompt_text(str(item.get("scope_note", "")).strip(), 140)
                if not command and (not why):
                    continue
                primary_command = _shell_primary_command_token(command)
                if primary_command and primary_command in unavailable_tool_ids:
                    continue
                compact_manual.append({"command": command, "why": why, "scope_note": scope_note})
            if compact_manual:
                ai_payload["manual_tests"] = compact_manual
        reflection = host_ai_state.get("reflection", {})
        if isinstance(reflection, dict) and reflection:
            reflection_payload = {
                "state": str(reflection.get("state", "")).strip().lower()[:24],
                "priority_shift": str(reflection.get("priority_shift", "")).strip().lower()[:64],
                "reason": _normalize_prompt_text(str(reflection.get("reason", "")).strip(), 220),
            }
            promote_tool_ids = [
                str(item).strip().lower()[:80]
                for item in list(reflection.get("promote_tool_ids", []) or [])[:8]
                if str(item).strip()
            ]
            if promote_tool_ids:
                reflection_payload["promote_tool_ids"] = promote_tool_ids
            suppress_tool_ids = [
                str(item).strip().lower()[:80]
                for item in list(reflection.get("suppress_tool_ids", []) or [])[:8]
                if str(item).strip()
            ]
            if suppress_tool_ids:
                reflection_payload["suppress_tool_ids"] = suppress_tool_ids
            if any((value for value in reflection_payload.values())):
                ai_payload["reflection"] = reflection_payload
        if any((value for value in ai_payload.values())):
            lines.append(json.dumps({"host_ai_state": ai_payload}, separators=(",", ":")))
    return lines


def _context_attempts(context):
    lines = []
    attempted = context.get("attempted_tool_ids", [])
    if isinstance(attempted, list):
        attempted_values = [str(item).strip()[:80] for item in attempted if str(item).strip()]
        if attempted_values:
            lines.append(json.dumps({"attempted_tools": attempted_values[:120]}, separators=(",", ":")))
    return lines


def _context_scripts(context):
    lines = []
    script_signals = context.get("scripts", [])
    if isinstance(script_signals, list):
        for item in script_signals[:MAX_PROVIDER_CONTEXT_ITEMS]:
            if not isinstance(item, dict):
                continue
            script_id = str(item.get("script_id", "")).strip()
            excerpt = _normalize_prompt_text(str(item.get("excerpt", "")), 680)
            script_port = str(item.get("port", "")).strip()
            script_protocol = str(item.get("protocol", "")).strip().lower()
            if not script_id and (not excerpt):
                continue
            lines.append(
                json.dumps(
                    {
                        "script_signal": {
                            "script_id": script_id[:96],
                            "port": script_port[:20],
                            "protocol": script_protocol[:12],
                            "excerpt": excerpt,
                        }
                    },
                    separators=(",", ":"),
                )
            )
    return lines


def _context_processes(context):
    lines = []
    process_signals = context.get("recent_processes", [])
    if isinstance(process_signals, list):
        for item in process_signals[:MAX_PROVIDER_CONTEXT_ITEMS]:
            if not isinstance(item, dict):
                continue
            tool_id = str(item.get("tool_id", "")).strip()
            status = str(item.get("status", "")).strip()
            process_port = str(item.get("port", "")).strip()
            process_protocol = str(item.get("protocol", "")).strip().lower()
            command_excerpt = _normalize_prompt_text(str(item.get("command_excerpt", "")), 300)
            excerpt = _normalize_prompt_text(str(item.get("output_excerpt", "")), 680)
            if not tool_id and (not excerpt):
                continue
            lines.append(
                json.dumps(
                    {
                        "process_signal": {
                            "tool_id": tool_id[:96],
                            "status": status[:40],
                            "port": process_port[:20],
                            "protocol": process_protocol[:12],
                            "command_excerpt": command_excerpt,
                            "output_excerpt": excerpt,
                        }
                    },
                    separators=(",", ":"),
                )
            )
    return lines


def _context_target_scripts(context):
    lines = []
    target_scripts = context.get("target_scripts", [])
    if isinstance(target_scripts, list):
        compact_target_scripts = []
        for item in target_scripts[:24]:
            if not isinstance(item, dict):
                continue
            script_id = str(item.get("script_id", "")).strip()
            excerpt = _normalize_prompt_text(str(item.get("excerpt", "")), 320)
            if not script_id and (not excerpt):
                continue
            compact_target_scripts.append(
                {
                    "script_id": script_id[:96],
                    "port": str(item.get("port", "")).strip()[:20],
                    "protocol": str(item.get("protocol", "")).strip().lower()[:12],
                    "excerpt": excerpt,
                }
            )
        if compact_target_scripts:
            lines.append(json.dumps({"target_scripts": compact_target_scripts}, separators=(",", ":")))
    return lines


def _context_target_processes(context):
    lines = []
    target_processes = context.get("target_recent_processes", [])
    if isinstance(target_processes, list):
        compact_target_processes = []
        for item in target_processes[:24]:
            if not isinstance(item, dict):
                continue
            tool_id = str(item.get("tool_id", "")).strip()
            excerpt = _normalize_prompt_text(str(item.get("output_excerpt", "")), 320)
            if not tool_id and (not excerpt):
                continue
            compact_target_processes.append(
                {
                    "tool_id": tool_id[:96],
                    "status": str(item.get("status", "")).strip()[:40],
                    "port": str(item.get("port", "")).strip()[:20],
                    "protocol": str(item.get("protocol", "")).strip().lower()[:12],
                    "output_excerpt": excerpt,
                }
            )
        if compact_target_processes:
            lines.append(json.dumps({"target_processes": compact_target_processes}, separators=(",", ":")))
    return lines
