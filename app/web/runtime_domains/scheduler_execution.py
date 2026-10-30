"""Scheduler Execution operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict
from app.scheduler.approvals import (
    ensure_scheduler_approval_table,
    get_pending_approval,
    update_pending_approval,
)
from app.scheduler.audit import (
    update_scheduler_decision_for_approval,
)
from app.web import runtime_scheduler as web_runtime_scheduler


class SchedulerExecutionRuntime:
    get_scheduler_execution_records = web_runtime_scheduler.get_scheduler_execution_records

    _read_text_excerpt = staticmethod(web_runtime_scheduler.read_text_excerpt)

    get_scheduler_execution_traces = web_runtime_scheduler.get_scheduler_execution_traces

    get_scheduler_execution_trace = web_runtime_scheduler.get_scheduler_execution_trace

    _persist_scheduler_execution_record = web_runtime_scheduler.persist_scheduler_execution_record

    def approve_scheduler_approval(
        self,
        approval_id: int,
        approve_family: bool = False,
        run_now: bool = True,
        family_action: str = "",
    ):
        return web_runtime_scheduler.approve_scheduler_approval(
            self,
            approval_id,
            approve_family=approve_family,
            run_now=run_now,
            family_action=family_action,
            ensure_scheduler_approval_table_fn=ensure_scheduler_approval_table,
            get_pending_approval_fn=get_pending_approval,
            update_pending_approval_fn=update_pending_approval,
            update_scheduler_decision_for_approval_fn=update_scheduler_decision_for_approval,
        )

    def reject_scheduler_approval(self, approval_id: int, reason: str = "rejected via web", family_action: str = ""):
        return web_runtime_scheduler.reject_scheduler_approval(
            self,
            approval_id,
            reason=reason,
            family_action=family_action,
            ensure_scheduler_approval_table_fn=ensure_scheduler_approval_table,
            get_pending_approval_fn=get_pending_approval,
            update_pending_approval_fn=update_pending_approval,
            update_scheduler_decision_for_approval_fn=update_scheduler_decision_for_approval,
        )

    start_scheduler_run_job = web_runtime_scheduler.start_scheduler_run_job

    start_host_dig_deeper_job = web_runtime_scheduler.start_host_dig_deeper_job

    _run_scheduler_actions_web = web_runtime_scheduler.run_scheduler_actions_web

    _run_scheduler_targets = web_runtime_scheduler.run_scheduler_targets

    _group_scheduler_targets_by_host = staticmethod(web_runtime_scheduler.group_scheduler_targets_by_host)

    _merge_scheduler_run_summaries = staticmethod(web_runtime_scheduler.merge_scheduler_run_summaries)

    def _execute_approved_scheduler_item(self, approval_id: int, job_id: int = 0) -> Dict[str, Any]:
        return web_runtime_scheduler.execute_approved_scheduler_item(
            self,
            approval_id,
            job_id=job_id,
            get_pending_approval_fn=get_pending_approval,
            update_pending_approval_fn=update_pending_approval,
            update_scheduler_decision_for_approval_fn=update_scheduler_decision_for_approval,
        )

    _execute_scheduler_decision = web_runtime_scheduler.execute_scheduler_decision
