from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.scheduler.approvals import ensure_scheduler_approval_table, queue_pending_approval
from app.scheduler.audit import log_scheduler_decision
from app.scheduler.planner import ScheduledAction
from app.scheduler.state import ensure_scheduler_target_state_table, upsert_target_state
from app.timing import getTimestamp


def queue_scheduler_approval(
    runtime,
    decision: ScheduledAction,
    host_ip: str,
    port: str,
    protocol: str,
    service_name: str,
    command_template: str,
) -> int:
    with runtime._lock:
        project = runtime._require_active_project()
        ensure_scheduler_approval_table(project.database)
        approval_id = queue_pending_approval(
            project.database,
            {
                "status": "pending",
                "host_ip": str(host_ip),
                "port": str(port),
                "protocol": str(protocol),
                "service": str(service_name),
                "tool_id": str(decision.tool_id),
                "label": str(decision.label),
                "command_template": str(command_template or ""),
                "command_family_id": str(decision.family_id),
                "danger_categories": ",".join(decision.danger_categories),
                "risk_tags": ",".join(decision.risk_tags),
                "scheduler_mode": str(decision.mode),
                "goal_profile": str(decision.goal_profile),
                "engagement_preset": str(decision.engagement_preset),
                "rationale": str(decision.rationale),
                "policy_decision": str(decision.policy_decision),
                "policy_reason": str(decision.policy_reason),
                "risk_summary": str(decision.risk_summary),
                "safer_alternative": str(decision.safer_alternative),
                "family_policy_state": str(decision.family_policy_state),
                "evidence_refs": ",".join(
                    str(item) for item in list(decision.linked_evidence_refs or []) if str(item).strip()
                ),
                "decision_reason": "pending approval",
                "execution_job_id": "",
            },
        )
    runtime._emit_ui_invalidation("approvals", "overview")
    return approval_id


def record_scheduler_decision(
    runtime,
    decision: ScheduledAction,
    host_ip: str,
    port: str,
    protocol: str,
    service_name: str,
    *,
    approved: bool,
    executed: bool,
    reason: str,
    approval_id: Optional[int] = None,
):
    with runtime._lock:
        project = getattr(runtime.logic, "activeProject", None)
        if not project:
            return
        log_scheduler_decision(
            project.database,
            {
                "timestamp": getTimestamp(True),
                "host_ip": str(host_ip),
                "port": str(port),
                "protocol": str(protocol),
                "service": str(service_name),
                "scheduler_mode": str(decision.mode),
                "goal_profile": str(decision.goal_profile),
                "engagement_preset": str(decision.engagement_preset),
                "tool_id": str(decision.tool_id),
                "label": str(decision.label),
                "command_family_id": str(decision.family_id),
                "danger_categories": ",".join(decision.danger_categories),
                "risk_tags": ",".join(decision.risk_tags),
                "requires_approval": "True" if decision.requires_approval else "False",
                "policy_decision": str(decision.policy_decision),
                "policy_reason": str(decision.policy_reason),
                "risk_summary": str(decision.risk_summary),
                "safer_alternative": str(decision.safer_alternative),
                "family_policy_state": str(decision.family_policy_state),
                "approved": "True" if approved else "False",
                "executed": "True" if executed else "False",
                "reason": str(reason),
                "rationale": str(decision.rationale),
                "approval_id": str(approval_id or ""),
            },
        )
    runtime._emit_ui_invalidation("decisions")
