"""One target's scheduler lifecycle. State, callbacks and the shared run budget are explicit."""

import time
import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Set
from app.scheduler.planner import SchedulerPlanner
from app.scheduler.orchestration.models import (
    SchedulerExecutionTask,
    SchedulerDecisionDisposition,
    ROOT_DOMAIN_SCOPED_TOOL_IDS,
)


@dataclass
class SchedulerCallbacks:
    should_cancel: Callable | None = None
    existing_attempts: Callable | None = None
    build_context: Callable | None = None
    on_ai_analysis: Callable | None = None
    reflect_progress: Callable | None = None
    on_reflection_analysis: Callable | None = None
    handle_blocked: Callable | None = None
    handle_approval: Callable | None = None
    execute_batch: Callable | None = None
    on_execution_result: Callable | None = None


@dataclass
class RunBudget:
    summary: dict
    started_at: float = field(default_factory=time.monotonic)
    root_domain_tool_attempts: set = field(default_factory=set)


@dataclass
class TargetRunState:
    attempted_tool_ids: set = field(default_factory=set)
    attempted_family_ids: set = field(default_factory=set)
    attempted_command_signatures: set = field(default_factory=set)
    suppressed_tool_ids: set = field(default_factory=set)
    promoted_tool_ids: list = field(default_factory=list)
    recent_rounds: list = field(default_factory=list)
    reflections_used: int = 0


@dataclass
class RoundState:
    round_progress: bool = False
    execution_tasks: list = field(default_factory=list)
    round_scheduled_tool_ids: set = field(default_factory=set)
    round_scheduled_family_ids: set = field(default_factory=set)
    round_scheduled_command_signatures: set = field(default_factory=set)
    round_selected_tool_ids: list = field(default_factory=list)
    round_selected_family_ids: list = field(default_factory=list)
    duplicate_filtered_count: int = 0
    suppressed_filtered_count: int = 0


@dataclass
class TargetRun:
    planning: Any
    settings: Any
    target: Any
    engagement_policy: Any
    options: Any
    callbacks: SchedulerCallbacks
    budget: RunBudget
    state: TargetRunState = field(default_factory=TargetRunState)
    use_feedback_loop: bool = False

    def run(self):
        if self.callbacks.should_cancel and self.callbacks.should_cancel(int(self.options.job_id or 0)):
            self.budget.summary["cancelled"] = True
            self.budget.summary["cancel_reason"] = "cancelled by user"
            return False
        self.use_feedback_loop = str(self.options.scheduler_mode or "").strip().lower() == "ai" and bool(
            self.options.ai_feedback_enabled
        )
        attempted_state = self.planning._normalize_attempt_summary(
            self.callbacks.existing_attempts(target=self.target) if self.callbacks.existing_attempts else {}
        )
        self.state.attempted_tool_ids = set(attempted_state["tool_ids"])
        self.state.attempted_family_ids = set(attempted_state["family_ids"])
        self.state.attempted_command_signatures = set(attempted_state["command_signatures"])
        self.state.suppressed_tool_ids: Set[str] = set()
        self.state.promoted_tool_ids: List[str] = []
        self.state.recent_rounds: List[Dict[str, Any]] = []
        self.state.reflections_used = 0
        for _round in range(int(self.options.max_rounds or 1) if self.use_feedback_loop else 1):
            if self.callbacks.should_cancel and self.callbacks.should_cancel(int(self.options.job_id or 0)):
                self.budget.summary["cancelled"] = True
                self.budget.summary["cancel_reason"] = "cancelled by user"
                return False
            if int(self.options.max_runtime_seconds or 0) > 0 and time.monotonic() - self.budget.started_at >= int(
                self.options.max_runtime_seconds or 0
            ):
                self.budget.summary["stopped_early"] = "dig_deeper_runtime_cap"
                return False
            if int(self.options.max_total_actions or 0) > 0 and self.budget.summary["executed"] + self.budget.summary[
                "skipped"
            ] + self.budget.summary["approval_queued"] >= int(self.options.max_total_actions or 0):
                self.budget.summary["stopped_early"] = "dig_deeper_action_cap"
                return False
            context = None
            if self.use_feedback_loop and self.callbacks.build_context:
                context = self.callbacks.build_context(
                    target=self.target,
                    attempted_tool_ids=set(self.state.attempted_tool_ids),
                    attempted_family_ids=set(self.state.attempted_family_ids),
                    attempted_command_signatures=set(self.state.attempted_command_signatures),
                    recent_output_chars=int(self.options.recent_output_chars or 900),
                    analysis_mode=self.options.analysis_mode,
                )
            if not self._reflect(context):
                break
            low_yield_stop_reason = self.planning._should_stop_low_yield_external_recon(
                target=self.target,
                context=context,
                attempted_tool_ids=sorted(self.state.attempted_tool_ids),
                recent_rounds=self.state.recent_rounds,
                engagement_policy=self.engagement_policy,
            )
            if low_yield_stop_reason:
                self.budget.summary.setdefault("target_stop_reasons", []).append(
                    {
                        "host_ip": str(self.target.host_ip or ""),
                        "port": str(self.target.port or ""),
                        "protocol": str(self.target.protocol or "tcp"),
                        "service": str(self.target.service_name or ""),
                        "reason": low_yield_stop_reason,
                    }
                )
                break
            decisions, provider_payload = self._plan(context)
            if not decisions:
                break
            round_state = self._select_tasks(decisions)
            self._execute_round(round_state)
            self._record_round(round_state, context, provider_payload)
            if not round_state.round_progress or not self.use_feedback_loop:
                break

        return True

    def _reflect(self, context):
        reflection_trigger = None
        if self.use_feedback_loop and self.callbacks.reflect_progress and (context is not None):
            reflection_trigger = self.planning._reflection_trigger(
                recent_rounds=self.state.recent_rounds,
                options=self.options,
                reflections_used=self.state.reflections_used,
                context=context,
            )
        if reflection_trigger:
            try:
                reflection_payload = self.callbacks.reflect_progress(
                    target=self.target,
                    context=context,
                    recent_rounds=list(self.state.recent_rounds),
                    trigger=reflection_trigger,
                )
            except Exception:
                reflection_payload = {}
            if isinstance(reflection_payload, dict) and reflection_payload:
                reflection_payload.setdefault(
                    "trigger_reason", str(reflection_trigger.get("reason", "") or "").strip().lower()
                )
                reflection_payload.setdefault("trigger_context", dict(reflection_trigger))
                self.state.reflections_used += 1
                self.budget.summary["reflections"] += 1
                if self.callbacks.on_reflection_analysis:
                    self.callbacks.on_reflection_analysis(
                        target=self.target,
                        reflection_payload=reflection_payload,
                        recent_rounds=list(self.state.recent_rounds),
                    )
                self.state.suppressed_tool_ids.update(
                    self.planning._expand_reflection_suppression_aliases(
                        reflection_payload.get("suppress_tool_ids", []),
                        attempted_tool_ids=self.state.attempted_tool_ids,
                        context=context,
                    )
                )
                self.state.promoted_tool_ids = [
                    self.planning._normalize_text_token(item)
                    for item in list(reflection_payload.get("promote_tool_ids", []) or [])
                    if self.planning._normalize_text_token(item)
                ]
                reflection_state = str(reflection_payload.get("state", "continue") or "continue").strip().lower()
                priority_shift = str(reflection_payload.get("priority_shift", "") or "").strip().lower()
                if reflection_state == "complete" or priority_shift in {"manual_validation", "stop"}:
                    self.budget.summary["reflection_stops"] += 1
                    return False
        return True

    def _plan(self, context):
        provider_payload = {}
        decisions = self.planning.planner.plan_actions(
            self.target.service_name,
            self.target.protocol,
            self.settings,
            context=context,
            excluded_tool_ids=sorted(set(self.state.attempted_tool_ids).union(self.state.suppressed_tool_ids)),
            excluded_family_ids=sorted(self.state.attempted_family_ids),
            excluded_command_signatures=sorted(self.state.attempted_command_signatures),
            limit=int(self.options.max_actions_per_round or 0) or None,
            engagement_policy=self.engagement_policy,
        )
        if str(self.options.scheduler_mode or "").strip().lower() == "ai":
            provider_payload = self.planning.planner.get_last_provider_payload(clear=True)
            if self.callbacks.on_ai_analysis:
                self.callbacks.on_ai_analysis(target=self.target, provider_payload=provider_payload)
        if not decisions:
            return [], provider_payload
        decisions = self.planning._trim_decisions_for_cost_control(
            target=self.target, decisions=decisions, context=context, engagement_policy=self.engagement_policy
        )
        if not decisions:
            return [], provider_payload
        if self.state.promoted_tool_ids:
            promoted_set = {
                self.planning._normalize_text_token(item)
                for item in self.state.promoted_tool_ids
                if self.planning._normalize_text_token(item)
            }
            decisions = sorted(
                list(decisions),
                key=lambda item: (
                    0 if self.planning._normalize_text_token(getattr(item, "tool_id", "")) in promoted_set else 1,
                ),
            )
        parallel_wave_tool_ids = self.planning._web_parallel_followup_wave_tool_ids(
            target=self.target,
            decisions=decisions,
            provider_payload=provider_payload if isinstance(provider_payload, dict) else {},
            options=self.options,
        )
        if parallel_wave_tool_ids:
            wave_order = {tool_id: index for index, tool_id in enumerate(parallel_wave_tool_ids) if tool_id}
            decisions = sorted(
                [
                    item
                    for item in list(decisions)
                    if self.planning._normalize_text_token(getattr(item, "tool_id", "")) in wave_order
                ],
                key=lambda item: wave_order.get(
                    self.planning._normalize_text_token(getattr(item, "tool_id", "")), len(wave_order)
                ),
            )
        return decisions, provider_payload

    def _select_tasks(self, decisions):
        round_state = RoundState()
        for decision in decisions:
            normalized_tool_id = str(decision.tool_id or "").strip().lower()
            normalized_family_id = self.planning._normalize_text_token(getattr(decision, "family_id", ""))
            root_domain_token = ""
            if normalized_tool_id and normalized_tool_id in self.state.suppressed_tool_ids:
                round_state.suppressed_filtered_count += 1
                continue
            if normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                root_domain_token = self.planning._target_host_root_token(self.target)
                if (
                    root_domain_token
                    and (root_domain_token, normalized_tool_id) in self.budget.root_domain_tool_attempts
                ):
                    round_state.duplicate_filtered_count += 1
                    continue
            if (
                not normalized_tool_id
                or normalized_tool_id in self.state.attempted_tool_ids
                or normalized_tool_id in round_state.round_scheduled_tool_ids
                or (normalized_family_id and normalized_family_id in self.state.attempted_family_ids)
                or (normalized_family_id and normalized_family_id in round_state.round_scheduled_family_ids)
            ):
                round_state.duplicate_filtered_count += 1
                continue
            self.budget.summary["considered"] += 1
            command_template = str(decision.command_template or "") or self.planning._find_command_template_for_tool(
                self.settings, decision.tool_id
            )
            validation_error = self.planning._target_tool_validation_error(
                settings=self.settings,
                target=self.target,
                tool_id=normalized_tool_id,
                command_template=command_template,
            )
            if validation_error:
                self.state.attempted_tool_ids.add(normalized_tool_id)
                if normalized_family_id:
                    self.state.attempted_family_ids.add(normalized_family_id)
                self.budget.summary["skipped"] += 1
                round_state.round_progress = True
                continue
            normalized_command_signature = self.planning._normalize_text_token(
                SchedulerPlanner._command_signature(str(self.target.protocol or "tcp"), command_template)
            )
            if normalized_command_signature and (
                normalized_command_signature in self.state.attempted_command_signatures
                or normalized_command_signature in round_state.round_scheduled_command_signatures
            ):
                round_state.duplicate_filtered_count += 1
                continue
            round_state.round_selected_tool_ids.append(normalized_tool_id)
            if normalized_family_id:
                round_state.round_selected_family_ids.append(normalized_family_id)
            if decision.is_blocked:
                disposition = (
                    self.callbacks.handle_blocked(
                        target=self.target, decision=decision, command_template=command_template
                    )
                    if self.callbacks.handle_blocked
                    else SchedulerDecisionDisposition(
                        action="skipped", reason=decision.policy_reason or "blocked by policy"
                    )
                )
                self.state.attempted_tool_ids.add(normalized_tool_id)
                if normalized_family_id:
                    self.state.attempted_family_ids.add(normalized_family_id)
                if normalized_command_signature:
                    self.state.attempted_command_signatures.add(normalized_command_signature)
                self.budget.summary["skipped"] += 1
                round_state.round_progress = True
                _ = disposition
                continue
            if decision.requires_approval:
                disposition = (
                    self.callbacks.handle_approval(
                        target=self.target, decision=decision, command_template=command_template
                    )
                    if self.callbacks.handle_approval
                    else SchedulerDecisionDisposition(
                        action="queued", reason=decision.policy_reason or "approval required"
                    )
                )
                action = str(getattr(disposition, "action", "queued") or "queued").strip().lower()
                if action == "execute":
                    round_state.round_scheduled_tool_ids.add(normalized_tool_id)
                    if normalized_family_id:
                        round_state.round_scheduled_family_ids.add(normalized_family_id)
                    if normalized_command_signature:
                        round_state.round_scheduled_command_signatures.add(normalized_command_signature)
                    if root_domain_token and normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                        self.budget.root_domain_tool_attempts.add((root_domain_token, normalized_tool_id))
                    round_state.execution_tasks.append(
                        SchedulerExecutionTask(
                            decision=decision,
                            tool_id=normalized_tool_id,
                            host_id=int(self.target.host_id or 0),
                            host_ip=str(self.target.host_ip or ""),
                            hostname=str(self.target.hostname or ""),
                            port=str(self.target.port or ""),
                            protocol=str(self.target.protocol or "tcp"),
                            service_name=str(self.target.service_name or ""),
                            command_template=command_template,
                            timeout=int(self.options.task_timeout_seconds or 300),
                            job_id=int(self.options.job_id or 0),
                            approval_id=int(getattr(disposition, "approval_id", 0) or 0),
                            runner_preference=str((self.engagement_policy or {}).get("runner_preference", "") or ""),
                        )
                    )
                else:
                    self.state.attempted_tool_ids.add(normalized_tool_id)
                    if normalized_family_id:
                        self.state.attempted_family_ids.add(normalized_family_id)
                    if normalized_command_signature:
                        self.state.attempted_command_signatures.add(normalized_command_signature)
                    if root_domain_token and normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                        self.budget.root_domain_tool_attempts.add((root_domain_token, normalized_tool_id))
                    round_state.round_progress = True
                    if action == "queued":
                        self.budget.summary["approval_queued"] += 1
                    else:
                        self.budget.summary["skipped"] += 1
                continue
            round_state.round_scheduled_tool_ids.add(normalized_tool_id)
            if normalized_family_id:
                round_state.round_scheduled_family_ids.add(normalized_family_id)
            if normalized_command_signature:
                round_state.round_scheduled_command_signatures.add(normalized_command_signature)
            if root_domain_token and normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                self.budget.root_domain_tool_attempts.add((root_domain_token, normalized_tool_id))
            round_state.execution_tasks.append(
                SchedulerExecutionTask(
                    decision=decision,
                    tool_id=normalized_tool_id,
                    host_id=int(self.target.host_id or 0),
                    host_ip=str(self.target.host_ip or ""),
                    hostname=str(self.target.hostname or ""),
                    port=str(self.target.port or ""),
                    protocol=str(self.target.protocol or "tcp"),
                    service_name=str(self.target.service_name or ""),
                    command_template=command_template,
                    timeout=int(self.options.task_timeout_seconds or 300),
                    job_id=int(self.options.job_id or 0),
                    runner_preference=str((self.engagement_policy or {}).get("runner_preference", "") or ""),
                )
            )
        return round_state

    def _execute_round(self, round_state):
        execution_results = (
            self.callbacks.execute_batch(round_state.execution_tasks, int(self.options.scheduler_concurrency or 1))
            if self.callbacks.execute_batch and round_state.execution_tasks
            else []
        )
        for result in list(execution_results or []):
            decision = result.get("decision")
            normalized_tool_id = str(result.get("tool_id", "") or "").strip().lower()
            executed = bool(result.get("executed", False))
            if self.callbacks.on_execution_result and decision is not None:
                self.callbacks.on_execution_result(target=self.target, decision=decision, result=result)
            if normalized_tool_id:
                self.state.attempted_tool_ids.add(normalized_tool_id)
            normalized_family_id = self.planning._normalize_text_token(getattr(decision, "family_id", ""))
            if normalized_family_id:
                self.state.attempted_family_ids.add(normalized_family_id)
            command_template = str(getattr(decision, "command_template", "") or "")
            if not command_template:
                command_template = self.planning._find_command_template_for_tool(
                    self.settings, getattr(decision, "tool_id", "")
                )
            normalized_command_signature = self.planning._normalize_text_token(
                SchedulerPlanner._command_signature(str(self.target.protocol or "tcp"), command_template)
            )
            if normalized_command_signature:
                self.state.attempted_command_signatures.add(normalized_command_signature)
            round_state.round_progress = True
            if executed:
                self.budget.summary["executed"] += 1
            else:
                self.budget.summary["skipped"] += 1

    def _record_round(self, round_state, context, provider_payload):
        post_round_context = context
        if self.use_feedback_loop and self.callbacks.build_context:
            post_round_context = self.callbacks.build_context(
                target=self.target,
                attempted_tool_ids=set(self.state.attempted_tool_ids),
                attempted_family_ids=set(self.state.attempted_family_ids),
                attempted_command_signatures=set(self.state.attempted_command_signatures),
                recent_output_chars=int(self.options.recent_output_chars or 900),
                analysis_mode=self.options.analysis_mode,
            )
        round_snapshot = self.planning._build_round_snapshot(
            round_number=len(self.state.recent_rounds) + 1,
            context=post_round_context,
            provider_payload=provider_payload if isinstance(provider_payload, dict) else {},
            decision_tool_ids=round_state.round_selected_tool_ids,
            decision_family_ids=round_state.round_selected_family_ids,
            duplicate_filtered_count=round_state.duplicate_filtered_count,
            suppressed_filtered_count=round_state.suppressed_filtered_count,
            recent_rounds=self.state.recent_rounds,
        )
        previous_round = self.state.recent_rounds[-1] if self.state.recent_rounds else None
        round_snapshot["progress_score"] = self.planning._round_progress_score(previous_round, round_snapshot)
        self.state.recent_rounds.append(round_snapshot)
        if len(self.state.recent_rounds) > 8:
            self.state.recent_rounds = self.state.recent_rounds[-8:]
