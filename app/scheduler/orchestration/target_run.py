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
        attempted = self.planning._normalize_attempt_summary(
            self.callbacks.existing_attempts(target=self.target) if self.callbacks.existing_attempts else {}
        )
        self.state.attempted_tool_ids = set(attempted["tool_ids"])
        self.state.attempted_family_ids = set(attempted["family_ids"])
        self.state.attempted_command_signatures = set(attempted["command_signatures"])
        context = (
            self.callbacks.build_context(
                target=self.target,
                attempted_tool_ids=self.state.attempted_tool_ids,
                attempted_family_ids=self.state.attempted_family_ids,
                attempted_command_signatures=self.state.attempted_command_signatures,
                recent_output_chars=900,
                analysis_mode="standard",
            )
            if self.callbacks.build_context
            else None
        )
        decisions = self.planning.planner.plan_actions(
            self.target.service_name,
            self.target.protocol,
            self.settings,
            context=context,
            excluded_tool_ids=list(self.state.attempted_tool_ids),
            excluded_family_ids=list(self.state.attempted_family_ids),
            excluded_command_signatures=list(self.state.attempted_command_signatures),
            engagement_policy=self.engagement_policy,
        )
        self._execute_round(self._select_tasks(decisions))
        return True

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
