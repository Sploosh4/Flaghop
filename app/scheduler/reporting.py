"""Evidence-backed reports: facade."""

from __future__ import annotations

from typing import Any, Dict, Optional, Sequence
from app.scheduler.approvals import ensure_scheduler_approval_table, list_pending_approvals
from app.scheduler.audit import ensure_scheduler_audit_table
from app.scheduler.execution import ensure_scheduler_execution_table, list_execution_records
from app.scheduler.graph import ensure_scheduler_graph_tables, get_evidence_graph_snapshot
from app.scheduler.state import ensure_scheduler_target_state_table, get_target_state

from app.scheduler.report_support.common import (
    _dedupe_dicts,
    _dedupe_tokens,
    _normalize_source_kind,
    _safe_int,
    _utc_now,
)
from app.scheduler.report_support.loaders import (
    _load_audit_rows,
    _load_cves,
    _load_notes,
)
from app.scheduler.report_support.sections import (
    _build_attack_paths,
    _build_credentials_section,
    _build_evidence_references,
    _build_findings_section,
    _build_methodology_coverage,
    _build_next_steps,
    _build_policy_actions,
    _build_provenance_buckets,
    _filter_graph_snapshot,
)
from app.scheduler.report_support.markdown import render_host_report_markdown as render_host_report_markdown
from app.scheduler.report_support.markdown import render_project_report_markdown as render_project_report_markdown

__all__ = ["build_host_report", "build_project_report", "render_host_report_markdown", "render_project_report_markdown"]


def build_host_report(
    database,
    *,
    host_row: Dict[str, Any],
    engagement_policy: Optional[Dict[str, Any]] = None,
    project_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    ensure_scheduler_target_state_table(database)
    ensure_scheduler_execution_table(database)
    ensure_scheduler_graph_tables(database)
    ensure_scheduler_audit_table(database)
    ensure_scheduler_approval_table(database)

    resolved_host = dict(host_row or {})
    host_id = _safe_int(resolved_host.get("id", 0), 0)
    host_ip = str(resolved_host.get("ip", "") or "")
    target_state = get_target_state(database, host_id) or {}
    graph_snapshot = _filter_graph_snapshot(get_evidence_graph_snapshot(database), host_id=host_id, host_ip=host_ip)
    all_executions = list_execution_records(database, limit=1000)
    executions = [
        item
        for item in list(all_executions or [])
        if isinstance(item, dict) and str(item.get("host_ip", "") or "") == host_ip
    ]
    decisions = _load_audit_rows(database, host_ip=host_ip, limit=1200)
    cves = _load_cves(database, host_id=host_id)
    notes = _load_notes(database, host_id=host_id)
    approvals = [
        item
        for item in list(list_pending_approvals(database, limit=400, status="pending") or [])
        if isinstance(item, dict) and str(item.get("host_ip", "") or "") == host_ip
    ]
    findings = _build_findings_section(resolved_host, target_state, cves, graph_snapshot)
    credentials_and_sessions = _build_credentials_section(target_state, graph_snapshot)
    evidence_references = _build_evidence_references(target_state, executions, graph_snapshot)
    recommended_next_steps = _build_next_steps(target_state, approvals)
    policy_actions = _build_policy_actions(decisions)
    methodology_coverage = _build_methodology_coverage(target_state, executions, decisions)
    provenance = _build_provenance_buckets(resolved_host, target_state, graph_snapshot, notes)

    service_inventory = list(target_state.get("service_inventory", []) or [])
    urls = list(target_state.get("urls", []) or [])
    technologies = list(target_state.get("technologies", []) or [])
    screenshots = list(target_state.get("screenshots", []) or [])
    artifacts = list(target_state.get("artifacts", []) or [])
    attack_paths = _build_attack_paths(graph_snapshot)

    return {
        "generated_at": _utc_now(),
        "report_version": 2,
        "report_kind": "host",
        "project": dict(project_metadata or {}),
        "host": {
            "id": host_id,
            "ip": host_ip,
            "hostname": str(resolved_host.get("hostname", "") or ""),
            "status": str(resolved_host.get("status", "") or ""),
            "os": str(resolved_host.get("os", "") or ""),
        },
        "scope_and_policy": {
            "scope": [host_ip] if host_ip else [],
            "engagement_policy": dict(engagement_policy or {}),
        },
        "summary_of_discovered_assets": {
            "service_count": len(service_inventory),
            "url_count": len(urls),
            "technology_count": len(technologies),
            "finding_count": int(findings.get("count", 0) or 0),
            "credential_count": len(credentials_and_sessions.get("credentials", [])),
            "identity_count": len(credentials_and_sessions.get("identities", [])),
            "session_count": len(credentials_and_sessions.get("sessions", [])),
            "screenshot_count": len(screenshots),
            "artifact_count": len(artifacts),
            "services": service_inventory,
            "urls": urls,
            "technologies": technologies,
            "screenshots": screenshots,
        },
        "validated_findings": findings,
        "attack_paths": attack_paths,
        "credentials_and_sessions": credentials_and_sessions,
        "evidence_references": evidence_references,
        "recommended_next_steps": recommended_next_steps,
        "skipped_or_blocked_actions": policy_actions,
        "methodology_coverage": methodology_coverage,
        "execution_ledger": {
            "count": len(executions),
            "recent_executions": executions[:40],
        },
        "graph_overview": {
            "node_count": len(list(graph_snapshot.get("nodes", []) or [])),
            "edge_count": len(list(graph_snapshot.get("edges", []) or [])),
            "annotation_count": len(list(graph_snapshot.get("annotations", []) or [])),
        },
        "observed_facts": provenance["observed_facts"],
        "inferred_relationships": provenance["inferred_relationships"],
        "ai_suggestions": provenance["ai_suggestions"],
        "operator_conclusions": provenance["operator_conclusions"],
    }


def build_project_report(
    database,
    *,
    project_metadata: Optional[Dict[str, Any]] = None,
    engagement_policy: Optional[Dict[str, Any]] = None,
    summary: Optional[Dict[str, Any]] = None,
    host_inventory: Optional[Sequence[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    ensure_scheduler_target_state_table(database)
    ensure_scheduler_execution_table(database)
    ensure_scheduler_graph_tables(database)
    ensure_scheduler_audit_table(database)
    ensure_scheduler_approval_table(database)

    hosts = [dict(item) for item in list(host_inventory or []) if isinstance(item, dict)]
    host_reports = [
        build_host_report(
            database,
            host_row=item,
            engagement_policy=engagement_policy,
            project_metadata=project_metadata,
        )
        for item in hosts
    ]
    graph_snapshot = get_evidence_graph_snapshot(database)
    executions = list_execution_records(database, limit=1000)
    decisions = _load_audit_rows(database, limit=2000)
    approvals = list_pending_approvals(database, limit=600, status="pending")

    summary_assets = {
        "host_count": len(host_reports),
        "service_count": sum(
            int(item.get("summary_of_discovered_assets", {}).get("service_count", 0) or 0) for item in host_reports
        ),
        "url_count": sum(
            int(item.get("summary_of_discovered_assets", {}).get("url_count", 0) or 0) for item in host_reports
        ),
        "technology_count": sum(
            int(item.get("summary_of_discovered_assets", {}).get("technology_count", 0) or 0) for item in host_reports
        ),
        "finding_count": sum(int(item.get("validated_findings", {}).get("count", 0) or 0) for item in host_reports),
        "credential_count": sum(
            len(item.get("credentials_and_sessions", {}).get("credentials", [])) for item in host_reports
        ),
        "identity_count": sum(
            len(item.get("credentials_and_sessions", {}).get("identities", [])) for item in host_reports
        ),
        "session_count": sum(
            len(item.get("credentials_and_sessions", {}).get("sessions", [])) for item in host_reports
        ),
        "screenshot_count": sum(
            int(item.get("summary_of_discovered_assets", {}).get("screenshot_count", 0) or 0) for item in host_reports
        ),
        "artifact_count": sum(
            int(item.get("summary_of_discovered_assets", {}).get("artifact_count", 0) or 0) for item in host_reports
        ),
        "hosts": [
            {
                "host": dict(item.get("host", {}) or {}),
                "finding_count": int(item.get("validated_findings", {}).get("count", 0) or 0),
                "credential_count": len(item.get("credentials_and_sessions", {}).get("credentials", [])),
                "session_count": len(item.get("credentials_and_sessions", {}).get("sessions", [])),
                "next_phase": str(item.get("recommended_next_steps", {}).get("next_phase", "") or ""),
            }
            for item in host_reports
        ],
    }

    findings_rows = _dedupe_dicts(
        [
            finding
            for report in host_reports
            for finding in list(report.get("validated_findings", {}).get("items", []) or [])
        ],
        limit=1200,
    )
    grouped_findings = {
        "observed": [
            item for item in findings_rows if _normalize_source_kind(item.get("source_kind", "")) == "observed"
        ],
        "inferred": [
            item for item in findings_rows if _normalize_source_kind(item.get("source_kind", "")) == "inferred"
        ],
        "ai_suggested": [
            item for item in findings_rows if _normalize_source_kind(item.get("source_kind", "")) == "ai_suggested"
        ],
        "operator": [
            item
            for item in findings_rows
            if _normalize_source_kind(item.get("source_kind", "")) in {"operator", "manual", "user_entered"}
        ],
    }

    credentials = _dedupe_dicts(
        [
            item
            for report in host_reports
            for item in list(report.get("credentials_and_sessions", {}).get("credentials", []) or [])
            if isinstance(item, dict)
        ],
        limit=400,
    )
    identities = _dedupe_dicts(
        [
            item
            for report in host_reports
            for item in list(report.get("credentials_and_sessions", {}).get("identities", []) or [])
            if isinstance(item, dict)
        ],
        limit=400,
    )
    sessions = _dedupe_dicts(
        [
            item
            for report in host_reports
            for item in list(report.get("credentials_and_sessions", {}).get("sessions", []) or [])
            if isinstance(item, dict)
        ],
        limit=400,
    )
    attack_paths = _build_attack_paths(graph_snapshot)
    evidence_references = _dedupe_dicts(
        [
            item
            for report in host_reports
            for item in list(report.get("evidence_references", []) or [])
            if isinstance(item, dict)
        ],
        limit=1200,
    )
    next_steps = {
        "next_phases": _dedupe_tokens(
            [report.get("recommended_next_steps", {}).get("next_phase", "") for report in host_reports],
            limit=80,
        ),
        "manual_tests": _dedupe_dicts(
            [
                item
                for report in host_reports
                for item in list(report.get("recommended_next_steps", {}).get("manual_tests", []) or [])
                if isinstance(item, dict)
            ],
            limit=400,
        ),
        "coverage_gaps": _dedupe_dicts(
            [
                item
                for report in host_reports
                for item in list(report.get("recommended_next_steps", {}).get("coverage_gaps", []) or [])
                if isinstance(item, dict)
            ],
            limit=240,
        ),
        "pending_approvals": [
            {
                "approval_id": _safe_int(item.get("id", 0), 0),
                "host_ip": str(item.get("host_ip", "") or ""),
                "tool_id": str(item.get("tool_id", "") or ""),
                "label": str(item.get("label", "") or ""),
                "policy_reason": str(item.get("policy_reason", "") or ""),
            }
            for item in list(approvals or [])
            if isinstance(item, dict)
        ],
    }
    methodology_coverage = {
        "strategy_packs_seen": _dedupe_tokens(
            [
                token
                for report in host_reports
                for token in list(report.get("methodology_coverage", {}).get("strategy_packs_seen", []) or [])
            ],
            limit=200,
        ),
        "coverage_gaps": next_steps["coverage_gaps"],
        "runner_usage": {},
        "decision_modes": _dedupe_tokens([item.get("scheduler_mode", "") for item in decisions], limit=16),
        "attempted_action_count": sum(
            int(report.get("methodology_coverage", {}).get("attempted_action_count", 0) or 0) for report in host_reports
        ),
    }
    for report in host_reports:
        for runner_type, count in dict(report.get("methodology_coverage", {}).get("runner_usage", {}) or {}).items():
            key = str(runner_type or "local").strip().lower() or "local"
            methodology_coverage["runner_usage"][key] = methodology_coverage["runner_usage"].get(key, 0) + int(
                count or 0
            )

    provenance = {
        "observed_facts": _dedupe_dicts(
            [item for report in host_reports for item in list(report.get("observed_facts", []) or [])],
            limit=600,
        ),
        "inferred_relationships": _dedupe_dicts(
            [item for report in host_reports for item in list(report.get("inferred_relationships", []) or [])],
            limit=600,
        ),
        "ai_suggestions": _dedupe_dicts(
            [item for report in host_reports for item in list(report.get("ai_suggestions", []) or [])],
            limit=600,
        ),
        "operator_conclusions": _dedupe_dicts(
            [item for report in host_reports for item in list(report.get("operator_conclusions", []) or [])],
            limit=600,
        ),
    }

    return {
        "generated_at": _utc_now(),
        "report_version": 2,
        "report_kind": "project",
        "project": dict(project_metadata or {}),
        "scope_and_policy": {
            "project": dict(project_metadata or {}),
            "engagement_policy": dict(engagement_policy or {}),
        },
        "summary": dict(summary or {}),
        "summary_of_discovered_assets": summary_assets,
        "validated_findings": {
            "count": len(findings_rows),
            "items": findings_rows,
            "observed": grouped_findings["observed"],
            "inferred": grouped_findings["inferred"],
            "ai_suggested": grouped_findings["ai_suggested"],
            "operator": grouped_findings["operator"],
        },
        "attack_paths": attack_paths,
        "credentials_and_sessions": {
            "credentials": credentials,
            "identities": identities,
            "sessions": sessions,
        },
        "evidence_references": evidence_references,
        "recommended_next_steps": next_steps,
        "skipped_or_blocked_actions": _build_policy_actions(decisions),
        "methodology_coverage": methodology_coverage,
        "execution_ledger": {
            "count": len(executions),
            "recent_executions": executions[:80],
        },
        "graph_overview": {
            "node_count": len(list(graph_snapshot.get("nodes", []) or [])),
            "edge_count": len(list(graph_snapshot.get("edges", []) or [])),
            "annotation_count": len(list(graph_snapshot.get("annotations", []) or [])),
        },
        "hosts": summary_assets["hosts"],
        "observed_facts": provenance["observed_facts"],
        "inferred_relationships": provenance["inferred_relationships"],
        "ai_suggestions": provenance["ai_suggestions"],
        "operator_conclusions": provenance["operator_conclusions"],
    }
