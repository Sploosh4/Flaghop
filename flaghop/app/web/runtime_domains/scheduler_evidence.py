"""Scheduler Evidence operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict
from app.scheduler.planner import ScheduledAction
from app.web import runtime_scheduler as web_runtime_scheduler


class SchedulerEvidenceRuntime:
    def _serialize_plan_step_preview(self, step: ScheduledAction) -> Dict[str, Any]:
        return web_runtime_scheduler.serialize_plan_step_preview(step)

    get_scheduler_plan_preview = web_runtime_scheduler.get_scheduler_plan_preview

    _execute_scheduler_task_batch = web_runtime_scheduler.execute_scheduler_task_batch

    _execute_scheduler_task = web_runtime_scheduler.execute_scheduler_task

    _extract_scheduler_signals = web_runtime_scheduler.extract_scheduler_signals

    _is_placeholder_scheduler_text = staticmethod(web_runtime_scheduler.is_placeholder_scheduler_text)

    _infer_technologies_from_observations = web_runtime_scheduler.infer_technologies_from_observations

    _infer_host_technologies = web_runtime_scheduler.infer_host_technologies

    _normalize_ai_technologies = web_runtime_scheduler.normalize_ai_technologies

    _merge_technologies = web_runtime_scheduler.merge_technologies

    _infer_findings_from_observations = web_runtime_scheduler.infer_findings_from_observations

    _infer_host_findings = web_runtime_scheduler.infer_host_findings

    _infer_urls_from_observations = web_runtime_scheduler.infer_urls_from_observations

    _infer_host_urls = web_runtime_scheduler.infer_host_urls

    _normalize_ai_findings = web_runtime_scheduler.normalize_ai_findings

    _normalize_ai_manual_tests = web_runtime_scheduler.normalize_ai_manual_tests

    _merge_ai_items = staticmethod(web_runtime_scheduler.merge_ai_items)

    _coverage_gaps_from_summary = staticmethod(web_runtime_scheduler.coverage_gaps_from_summary)

    _persist_shared_target_state = web_runtime_scheduler.persist_shared_target_state

    _enrich_host_from_observed_results = web_runtime_scheduler.enrich_host_from_observed_results

    _queue_scheduler_approval = web_runtime_scheduler.queue_scheduler_approval

    _record_scheduler_decision = web_runtime_scheduler.record_scheduler_decision

    _load_host_observations = web_runtime_scheduler.load_host_observations
