from __future__ import annotations

import datetime
import json
import re
from typing import Any, Dict, List, Optional

from sqlalchemy import text

from app.scheduler.planner import SchedulerPlanner
from app.scheduler.state import (
    build_artifact_entries,
    build_target_urls,
    ensure_scheduler_target_state_table,
    get_target_state,
    load_observed_service_inventory,
    upsert_target_state,
)


def coverage_gaps_from_summary(coverage: Any) -> List[Dict[str, Any]]:
    if not isinstance(coverage, dict):
        return []
    missing = coverage.get("missing", [])
    if not isinstance(missing, list):
        return []
    recommended = coverage.get("recommended_tool_ids", [])
    if not isinstance(recommended, list):
        recommended = []
    rows = []
    for gap_id in missing[:32]:
        token = str(gap_id or "").strip().lower()
        if not token:
            continue
        rows.append(
            {
                "gap_id": token,
                "description": token.replace("_", " "),
                "recommended_tool_ids": list(recommended[:16]),
                "analysis_mode": str(coverage.get("analysis_mode", "") or "").strip().lower(),
                "stage": str(coverage.get("stage", "") or "").strip().lower(),
                "host_cve_count": int(coverage.get("host_cve_count", 0) or 0),
                "source_kind": "inferred",
                "observed": False,
            }
        )
    return rows


def normalize_command_signature_source(command_text: str) -> str:
    normalized = str(command_text or "").strip().lower()
    if not normalized:
        return ""
    replacements = (
        (r"(?i)(-oA\s+)(?:\"[^\"]+\"|'[^']+'|\S+)", r"\1[OUTPUT]"),
        (r"(?i)(-o\s+)(?:\"[^\"]+\"|'[^']+'|\S+)", r"\1[OUTPUT]"),
        (r"(?i)(--output(?:-dir)?\s+)(?:\"[^\"]+\"|'[^']+'|\S+)", r"\1[OUTPUT]"),
        (r"(?i)(--resume\s+)(?:\"[^\"]+\"|'[^']+'|\S+)", r"\1[OUTPUT]"),
        (r"(?i)(>\s*)(?:\"[^\"]+\"|'[^']+'|\S+)", r"\1[OUTPUT]"),
    )
    for pattern, replacement in replacements:
        normalized = re.sub(pattern, replacement, normalized)
    normalized = re.sub(r"\s{2,}", " ", normalized).strip()
    return normalized


def command_signature_for_target(command_text: str, protocol: str) -> str:
    normalized = normalize_command_signature_source(command_text)
    if not normalized:
        return ""
    return SchedulerPlanner._command_signature(str(protocol or "tcp"), normalized)


def target_attempt_matches(item: Dict[str, Any], port: str, protocol: str) -> bool:
    entry_port = str(item.get("port", "") or "").strip()
    entry_protocol = str(item.get("protocol", "tcp") or "tcp").strip().lower() or "tcp"
    target_port = str(port or "").strip()
    target_protocol = str(protocol or "tcp").strip().lower() or "tcp"
    if entry_protocol != target_protocol:
        return False
    if target_port:
        return entry_port == target_port
    return not entry_port


def existing_attempt_summary_for_target(
    runtime,
    host_id: int,
    host_ip: str,
    port: str,
    protocol: str,
    *,
    get_target_state_fn=get_target_state,
) -> Dict[str, set]:
    attempted = {
        "tool_ids": set(),
        "family_ids": set(),
        "command_signatures": set(),
    }
    with runtime._lock:
        project = getattr(runtime.logic, "activeProject", None)
        if not project:
            return attempted

        runtime._ensure_scheduler_approval_store()
        runtime._ensure_scheduler_table()
        session = project.database.session()
        try:
            scripts_result = session.execute(
                text(
                    "SELECT COALESCE(s.scriptId, '') AS script_id "
                    "FROM l1ScriptObj AS s "
                    "LEFT JOIN portObj AS p ON p.id = s.portId "
                    "WHERE s.hostId = :host_id "
                    "AND s.portId IS NOT NULL "
                    "AND COALESCE(p.portId, '') = :port "
                    "AND LOWER(COALESCE(p.protocol, '')) = LOWER(:protocol) "
                    "ORDER BY s.id DESC LIMIT 100"
                ),
                {
                    "host_id": int(host_id or 0),
                    "port": str(port or ""),
                    "protocol": str(protocol or "tcp"),
                },
            )
            for row in scripts_result.fetchall():
                tool = str(row[0] or "").strip().lower()
                if tool:
                    attempted["tool_ids"].add(tool)

            target_state = get_target_state_fn(project.database, int(host_id or 0)) or {}
            for item in list(target_state.get("attempted_actions", []) or []):
                if not isinstance(item, dict):
                    continue
                tool = str(item.get("tool_id", "") or "").strip().lower()
                if not (target_attempt_matches(item, port, protocol) or runtime._is_host_scoped_scheduler_tool(tool)):
                    continue
                family_id = str(item.get("family_id", "") or "").strip().lower()
                command_signature = str(item.get("command_signature", "") or "").strip().lower()
                if tool:
                    attempted["tool_ids"].add(tool)
                if family_id:
                    attempted["family_ids"].add(family_id)
                if command_signature:
                    attempted["command_signatures"].add(command_signature)

            process_result = session.execute(
                text(
                    "SELECT COALESCE(p.name, '') AS tool_id, "
                    "COALESCE(p.command, '') AS command_text "
                    "FROM process AS p "
                    "WHERE COALESCE(p.hostIp, '') = :host_ip "
                    "AND COALESCE(p.port, '') = :port "
                    "AND LOWER(COALESCE(p.protocol, '')) = LOWER(:protocol) "
                    "ORDER BY p.id DESC LIMIT 160"
                ),
                {
                    "host_ip": str(host_ip or ""),
                    "port": str(port or ""),
                    "protocol": str(protocol or "tcp"),
                },
            )
            for row in process_result.fetchall():
                tool = str(row[0] or "").strip().lower()
                command_text = str(row[1] or "")
                if tool:
                    attempted["tool_ids"].add(tool)
                command_signature = command_signature_for_target(command_text, protocol)
                if command_signature:
                    attempted["command_signatures"].add(str(command_signature).strip().lower())

            if str(host_ip or "").strip():
                host_process_result = session.execute(
                    text(
                        "SELECT COALESCE(p.name, '') AS tool_id, "
                        "COALESCE(p.command, '') AS command_text "
                        "FROM process AS p "
                        "WHERE COALESCE(p.hostIp, '') = :host_ip "
                        "ORDER BY p.id DESC LIMIT 200"
                    ),
                    {
                        "host_ip": str(host_ip or ""),
                    },
                )
                for row in host_process_result.fetchall():
                    tool = str(row[0] or "").strip().lower()
                    if not runtime._is_host_scoped_scheduler_tool(tool):
                        continue
                    attempted["tool_ids"].add(tool)
                    command_signature = command_signature_for_target(str(row[1] or ""), protocol)
                    if command_signature:
                        attempted["command_signatures"].add(str(command_signature).strip().lower())

            approval_result = session.execute(
                text(
                    "SELECT COALESCE(tool_id, '') AS tool_id, "
                    "COALESCE(command_template, '') AS command_template, "
                    "COALESCE(command_family_id, '') AS command_family_id "
                    "FROM scheduler_pending_approval "
                    "WHERE COALESCE(host_ip, '') = :host_ip "
                    "AND COALESCE(port, '') = :port "
                    "AND LOWER(COALESCE(protocol, '')) = LOWER(:protocol) "
                    "AND LOWER(COALESCE(status, '')) IN ('pending', 'approved', 'running', 'executed') "
                    "ORDER BY id DESC LIMIT 100"
                ),
                {
                    "host_ip": str(host_ip or ""),
                    "port": str(port or ""),
                    "protocol": str(protocol or "tcp"),
                },
            )
            for row in approval_result.fetchall():
                tool = str(row[0] or "").strip().lower()
                command_template = str(row[1] or "")
                family_id = str(row[2] or "").strip().lower()
                if tool:
                    attempted["tool_ids"].add(tool)
                if family_id:
                    attempted["family_ids"].add(family_id)
                command_signature = command_signature_for_target(command_template, protocol)
                if command_signature:
                    attempted["command_signatures"].add(str(command_signature).strip().lower())

            if str(host_ip or "").strip():
                host_approval_result = session.execute(
                    text(
                        "SELECT COALESCE(tool_id, '') AS tool_id, "
                        "COALESCE(command_template, '') AS command_template, "
                        "COALESCE(command_family_id, '') AS command_family_id "
                        "FROM scheduler_pending_approval "
                        "WHERE COALESCE(host_ip, '') = :host_ip "
                        "AND LOWER(COALESCE(status, '')) IN ('pending', 'approved', 'running', 'executed') "
                        "ORDER BY id DESC LIMIT 120"
                    ),
                    {
                        "host_ip": str(host_ip or ""),
                    },
                )
                for row in host_approval_result.fetchall():
                    tool = str(row[0] or "").strip().lower()
                    if not runtime._is_host_scoped_scheduler_tool(tool):
                        continue
                    command_template = str(row[1] or "")
                    family_id = str(row[2] or "").strip().lower()
                    attempted["tool_ids"].add(tool)
                    if family_id:
                        attempted["family_ids"].add(family_id)
                    command_signature = command_signature_for_target(command_template, protocol)
                    if command_signature:
                        attempted["command_signatures"].add(str(command_signature).strip().lower())
        finally:
            session.close()
    return attempted


def existing_tool_attempts_for_target(
    runtime,
    host_id: int,
    host_ip: str,
    port: str,
    protocol: str,
    *,
    get_target_state_fn=get_target_state,
) -> set:
    summary = existing_attempt_summary_for_target(
        runtime,
        host_id,
        host_ip,
        port,
        protocol,
        get_target_state_fn=get_target_state_fn,
    )
    return set(summary.get("tool_ids", set()) or set())


def persist_shared_target_state(
    runtime,
    *,
    host_id: int,
    host_ip: str,
    port: str = "",
    protocol: str = "tcp",
    service_name: str = "",
    scheduler_mode: str = "",
    goal_profile: str = "",
    engagement_preset: str = "",
    provider: str = "",
    hostname: str = "",
    hostname_confidence: float = 0.0,
    os_match: str = "",
    os_confidence: float = 0.0,
    next_phase: str = "",
    technologies: Optional[List[Dict[str, Any]]] = None,
    findings: Optional[List[Dict[str, Any]]] = None,
    manual_tests: Optional[List[Dict[str, Any]]] = None,
    service_inventory: Optional[List[Dict[str, Any]]] = None,
    urls: Optional[List[Dict[str, Any]]] = None,
    coverage: Optional[Dict[str, Any]] = None,
    attempted_action: Optional[Dict[str, Any]] = None,
    artifact_refs: Optional[List[str]] = None,
    raw: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if int(host_id or 0) <= 0:
        return {}

    with runtime._lock:
        project = getattr(runtime.logic, "activeProject", None)
        if not project:
            return {}
        ensure_scheduler_target_state_table(project.database)
        host_obj = runtime._resolve_host(int(host_id))
        resolved_host_ip = str(host_ip or getattr(host_obj, "ip", "") or "")
        resolved_hostname = str(hostname or getattr(host_obj, "hostname", "") or "")
        resolved_os = str(os_match or getattr(host_obj, "osMatch", "") or "")
        if service_inventory is None:
            try:
                resolved_service_inventory = load_observed_service_inventory(project.database, int(host_id))
            except Exception:
                resolved_service_inventory = []
        else:
            resolved_service_inventory = list(service_inventory or [])
        resolved_urls = build_target_urls(resolved_host_ip, resolved_hostname, resolved_service_inventory)
        for item in list(urls or []):
            if isinstance(item, dict):
                resolved_urls.append(dict(item))
        coverage_gaps = coverage_gaps_from_summary(coverage)
        attempted_actions = [attempted_action] if isinstance(attempted_action, dict) and attempted_action else []
        artifact_entries = build_artifact_entries(
            list(artifact_refs or []),
            tool_id=str((attempted_action or {}).get("tool_id", "") or ""),
            port=str(port or ""),
            protocol=str(protocol or "tcp"),
        )
        payload = {
            "host_ip": resolved_host_ip,
            "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "last_mode": str(scheduler_mode or ""),
            "provider": str(provider or ""),
            "goal_profile": str(goal_profile or ""),
            "engagement_preset": str(engagement_preset or ""),
            "last_port": str(port or ""),
            "last_protocol": str(protocol or "tcp"),
            "last_service": str(service_name or ""),
            "hostname": resolved_hostname,
            "hostname_confidence": float(hostname_confidence or 0.0),
            "hostname_source_kind": "observed" if resolved_hostname else "",
            "os_match": resolved_os,
            "os_confidence": float(os_confidence or 0.0),
            "os_source_kind": "observed" if resolved_os else "",
            "next_phase": str(next_phase or ""),
            "service_inventory": resolved_service_inventory,
            "urls": resolved_urls,
            "coverage_gaps": coverage_gaps,
            "attempted_actions": attempted_actions,
            "artifacts": [{"artifact_ref": row.get("ref", ""), **row} for row in artifact_entries],
            "raw": raw if isinstance(raw, dict) else {},
        }
        if technologies is not None:
            payload["technologies"] = list(technologies or [])
        if findings is not None:
            payload["findings"] = list(findings or [])
        if manual_tests is not None:
            payload["manual_tests"] = list(manual_tests or [])
        return upsert_target_state(project.database, int(host_id), payload, merge=True)


def load_host_observations(runtime, project, host_id, host_ip):
    return {
        "host_id": int(host_id),
        "host_ip": str(host_ip),
        "technologies": runtime._infer_host_technologies(project, int(host_id), str(host_ip)),
        "findings": runtime._infer_host_findings(
            project,
            host_id=int(host_id),
            host_ip=str(host_ip),
            host_cves_raw=runtime._load_cves_for_host(project, int(host_id)),
        ),
        "manual_tests": [],
    }


from app.scheduler.scan_targets import scan_history_targets as scan_history_targets
