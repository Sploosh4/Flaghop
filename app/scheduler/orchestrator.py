import time
from typing import Tuple, Any, Callable, Dict, Iterable, List, Optional, Sequence, Set
from app.scheduler.planner import SchedulerPlanner
from app.scheduler.tool_prompt_registry import get_scheduler_tool_prompt_info
from app.scheduler.policy import (
    ensure_scheduler_engagement_policy_table,
    get_project_engagement_policy,
    normalize_engagement_policy,
    upsert_project_engagement_policy,
)

from app.scheduler.orchestration.models import (
    WEB_PARALLEL_FOLLOWUP_MAX_TOOLS,
    ROOT_DOMAIN_SCOPED_TOOL_IDS,
    SchedulerTarget,
    SchedulerExecutionTask,
    SchedulerDecisionDisposition,
    SchedulerRunOptions,
)

from app.scheduler.orchestration.models import DEFAULT_AI_FEEDBACK_CONFIG

__all__ = [
    "DEFAULT_AI_FEEDBACK_CONFIG",
    "SchedulerOrchestrator",
    "SchedulerTarget",
    "SchedulerExecutionTask",
    "SchedulerDecisionDisposition",
    "SchedulerRunOptions",
]

from app.scheduler.orchestration.targeting import Targeting
from app.scheduler.orchestration.options import Options
from app.scheduler.orchestration.reflection import Reflection


class SchedulerOrchestrator(Targeting, Options, Reflection):
    def __init__(self, config_manager, planner: Optional[SchedulerPlanner] = None):
        self.config_manager = config_manager
        self.planner = planner or SchedulerPlanner(config_manager)

    def load_project_engagement_policy(
        self,
        database,
        *,
        persist_if_missing: bool = True,
        updated_at: str = "",
    ) -> Dict[str, Any]:
        config = self.config_manager.load()
        fallback_policy = normalize_engagement_policy(
            config.get("engagement_policy", {}),
            fallback_goal_profile=str(
                config.get("goal_profile", "internal_asset_discovery") or "internal_asset_discovery"
            ),
        )
        if database is None:
            return fallback_policy.to_dict()

        ensure_scheduler_engagement_policy_table(database)
        stored = get_project_engagement_policy(database)
        if stored is None:
            payload = fallback_policy.to_dict()
            if persist_if_missing:
                upsert_project_engagement_policy(
                    database,
                    payload,
                    updated_at=str(updated_at or ""),
                )
            return payload

        normalized = normalize_engagement_policy(
            stored,
            fallback_goal_profile=fallback_policy.legacy_goal_profile,
        )
        return normalized.to_dict()

    @staticmethod
    def collect_project_targets(
        project,
        *,
        host_ids: Optional[Iterable[Any]] = None,
        allowed_states: Optional[Iterable[str]] = None,
    ) -> List[SchedulerTarget]:
        if not project:
            return []

        normalized_host_ids = SchedulerOrchestrator._normalize_host_id_set(host_ids)
        allowed_state_set = {
            str(item or "").strip().lower()
            for item in list(allowed_states or {"open", "open|filtered"})
            if str(item or "").strip()
        }
        repo_container = getattr(project, "repositoryContainer", None)
        host_repo = getattr(repo_container, "hostRepository", None)
        port_repo = getattr(repo_container, "portRepository", None)
        service_repo = getattr(repo_container, "serviceRepository", None)
        if not host_repo or not port_repo:
            return []

        targets: List[SchedulerTarget] = []
        for host in list(host_repo.getAllHostObjs() or []):
            host_id = int(getattr(host, "id", 0) or 0)
            if normalized_host_ids and host_id not in normalized_host_ids:
                continue
            host_ip = str(getattr(host, "ip", "") or "")
            hostname = str(getattr(host, "hostname", "") or "")
            host_root_token = SchedulerOrchestrator._candidate_host_root_token(host_ip, hostname)
            if host_root_token:
                targets.append(
                    SchedulerTarget(
                        host_id=host_id,
                        host_ip=host_ip,
                        hostname=hostname,
                        port="",
                        protocol="tcp",
                        service_name="host",
                        metadata={
                            "state": "up",
                            "service_id": 0,
                            "target_type": "host_root",
                            "host_root_token": host_root_token,
                        },
                    )
                )
            for port_obj in list(port_repo.getPortsByHostId(host_id) or []):
                state = str(getattr(port_obj, "state", "") or "").strip().lower()
                if allowed_state_set and state not in allowed_state_set:
                    continue
                service_name = ""
                service_id = getattr(port_obj, "serviceId", None)
                if service_id and service_repo:
                    try:
                        service_obj = service_repo.getServiceById(service_id)
                        if service_obj:
                            service_name = str(getattr(service_obj, "name", "") or "")
                    except Exception:
                        service_name = ""
                targets.append(
                    SchedulerTarget(
                        host_id=host_id,
                        host_ip=host_ip,
                        hostname=hostname,
                        port=str(getattr(port_obj, "portId", "") or ""),
                        protocol=str(getattr(port_obj, "protocol", "tcp") or "tcp").lower(),
                        service_name=str(service_name or "").rstrip("?"),
                        metadata={
                            "state": state,
                            "service_id": int(service_id or 0) if str(service_id or "").strip() else 0,
                        },
                    )
                )
        return targets

    @staticmethod
    def collect_parser_targets(parser) -> List[SchedulerTarget]:
        targets: List[SchedulerTarget] = []
        if parser is None or not hasattr(parser, "getAllHosts"):
            return targets
        for host in list(parser.getAllHosts() or []):
            hostname = str(getattr(host, "hostname", "") or "")
            host_ip = str(getattr(host, "ip", "") or "")
            host_root_token = SchedulerOrchestrator._candidate_host_root_token(host_ip, hostname)
            if host_root_token:
                targets.append(
                    SchedulerTarget(
                        host_id=0,
                        host_ip=host_ip,
                        hostname=hostname,
                        port="",
                        protocol="tcp",
                        service_name="host",
                        metadata={
                            "state": "up",
                            "parser_host": host,
                            "target_type": "host_root",
                            "host_root_token": host_root_token,
                        },
                    )
                )
            for port in list(host.all_ports() or []):
                state = str(getattr(port, "state", "") or "").strip().lower()
                if state != "open":
                    continue
                service = port.getService() if hasattr(port, "getService") else None
                service_name = str(getattr(service, "name", "") or "").rstrip("?") if service else ""
                targets.append(
                    SchedulerTarget(
                        host_id=0,
                        host_ip=host_ip,
                        hostname=hostname,
                        port=str(getattr(port, "portId", "") or ""),
                        protocol=str(getattr(port, "protocol", "tcp") or "tcp").lower(),
                        service_name=service_name,
                        metadata={"state": state, "parser_host": host},
                    )
                )
        return targets

    @staticmethod
    def _find_command_template_for_tool(settings, tool_id: str) -> str:
        for action in list(getattr(settings, "portActions", []) or []):
            if str(action[1]) == str(tool_id):
                return str(action[2])
        return ""

    @classmethod
    def _web_parallel_followup_wave_tool_ids(
        cls,
        *,
        target: SchedulerTarget,
        decisions: Sequence[Any],
        provider_payload: Optional[Dict[str, Any]],
        options: SchedulerRunOptions,
    ) -> List[str]:
        service_name = cls._normalize_text_token(getattr(target, "service_name", ""))
        if service_name not in SchedulerPlanner.WEB_SERVICE_IDS:
            return []

        payload = provider_payload if isinstance(provider_payload, dict) else {}
        specialist_sidecars = payload.get("specialist_sidecars", [])
        if not isinstance(specialist_sidecars, list) or not specialist_sidecars:
            return []

        wave_cap = min(
            int(WEB_PARALLEL_FOLLOWUP_MAX_TOOLS),
            max(1, int(options.scheduler_concurrency or 1)),
            max(1, int(options.max_actions_per_round or 0) or int(WEB_PARALLEL_FOLLOWUP_MAX_TOOLS)),
        )
        if wave_cap < 2:
            return []

        decision_tool_ids = {
            cls._normalize_text_token(getattr(item, "tool_id", ""))
            for item in list(decisions or [])
            if cls._normalize_text_token(getattr(item, "tool_id", ""))
        }
        if not decision_tool_ids:
            return []

        selected_tool_ids: List[str] = []
        seen: Set[str] = set()
        for sidecar in reversed(specialist_sidecars):
            if not isinstance(sidecar, dict):
                continue
            for item in list(sidecar.get("selected_tool_ids", []) or []):
                tool_id = cls._normalize_text_token(item)
                if not tool_id or tool_id in seen:
                    continue
                seen.add(tool_id)
                selected_tool_ids.append(tool_id)

        if not selected_tool_ids:
            return []

        wave_tool_ids: List[str] = []
        for tool_id in selected_tool_ids:
            if tool_id not in decision_tool_ids:
                continue
            if not bool(get_scheduler_tool_prompt_info(tool_id).safe_parallel):
                continue
            wave_tool_ids.append(tool_id)
            if len(wave_tool_ids) >= wave_cap:
                break

        if len(wave_tool_ids) < 2:
            return []
        return wave_tool_ids

    def run_targets(
        self,
        *,
        settings,
        targets: Sequence[SchedulerTarget],
        engagement_policy: Optional[Dict[str, Any]] = None,
        options: Optional[SchedulerRunOptions] = None,
        should_cancel: Optional[Callable[[int], bool]] = None,
        existing_attempts: Optional[Callable[[SchedulerTarget], Set[str]]] = None,
        build_context: Optional[Callable[..., Dict[str, Any]]] = None,
        on_ai_analysis: Optional[Callable[..., None]] = None,
        reflect_progress: Optional[Callable[..., Dict[str, Any]]] = None,
        on_reflection_analysis: Optional[Callable[..., None]] = None,
        handle_blocked: Optional[Callable[..., SchedulerDecisionDisposition]] = None,
        handle_approval: Optional[Callable[..., SchedulerDecisionDisposition]] = None,
        execute_batch: Optional[Callable[[List[SchedulerExecutionTask], int], List[Dict[str, Any]]]] = None,
        on_execution_result: Optional[Callable[..., None]] = None,
    ) -> Dict[str, Any]:
        resolved_options = options or SchedulerRunOptions()
        summary = {
            "considered": 0,
            "approval_queued": 0,
            "executed": 0,
            "skipped": 0,
            "host_scope_count": len(list(targets or [])),
            "dig_deeper": bool(resolved_options.dig_deeper),
            "reflections": 0,
            "reflection_stops": 0,
        }
        started_at = time.monotonic()
        root_domain_tool_attempts: Set[Tuple[str, str]] = set()

        for target in list(targets or []):
            if should_cancel and should_cancel(int(resolved_options.job_id or 0)):
                summary["cancelled"] = True
                summary["cancel_reason"] = "cancelled by user"
                return summary

            use_feedback_loop = str(resolved_options.scheduler_mode or "").strip().lower() == "ai" and bool(
                resolved_options.ai_feedback_enabled
            )
            attempted_state = self._normalize_attempt_summary(
                existing_attempts(target=target) if existing_attempts else {}
            )
            attempted_tool_ids = set(attempted_state["tool_ids"])
            attempted_family_ids = set(attempted_state["family_ids"])
            attempted_command_signatures = set(attempted_state["command_signatures"])
            suppressed_tool_ids: Set[str] = set()
            promoted_tool_ids: List[str] = []
            recent_rounds: List[Dict[str, Any]] = []
            reflections_used = 0

            for _round in range(int(resolved_options.max_rounds or 1) if use_feedback_loop else 1):
                if should_cancel and should_cancel(int(resolved_options.job_id or 0)):
                    summary["cancelled"] = True
                    summary["cancel_reason"] = "cancelled by user"
                    return summary
                if int(resolved_options.max_runtime_seconds or 0) > 0 and (time.monotonic() - started_at) >= int(
                    resolved_options.max_runtime_seconds or 0
                ):
                    summary["stopped_early"] = "dig_deeper_runtime_cap"
                    return summary
                if int(resolved_options.max_total_actions or 0) > 0 and (
                    summary["executed"] + summary["skipped"] + summary["approval_queued"]
                ) >= int(resolved_options.max_total_actions or 0):
                    summary["stopped_early"] = "dig_deeper_action_cap"
                    return summary

                context = None
                if use_feedback_loop and build_context:
                    context = build_context(
                        target=target,
                        attempted_tool_ids=set(attempted_tool_ids),
                        attempted_family_ids=set(attempted_family_ids),
                        attempted_command_signatures=set(attempted_command_signatures),
                        recent_output_chars=int(resolved_options.recent_output_chars or 900),
                        analysis_mode=resolved_options.analysis_mode,
                    )

                reflection_trigger = None
                if use_feedback_loop and reflect_progress and context is not None:
                    reflection_trigger = self._reflection_trigger(
                        recent_rounds=recent_rounds,
                        options=resolved_options,
                        reflections_used=reflections_used,
                        context=context,
                    )

                if reflection_trigger:
                    try:
                        reflection_payload = reflect_progress(
                            target=target,
                            context=context,
                            recent_rounds=list(recent_rounds),
                            trigger=reflection_trigger,
                        )
                    except Exception:
                        reflection_payload = {}
                    if isinstance(reflection_payload, dict) and reflection_payload:
                        reflection_payload.setdefault(
                            "trigger_reason", str(reflection_trigger.get("reason", "") or "").strip().lower()
                        )
                        reflection_payload.setdefault("trigger_context", dict(reflection_trigger))
                        reflections_used += 1
                        summary["reflections"] += 1
                        if on_reflection_analysis:
                            on_reflection_analysis(
                                target=target,
                                reflection_payload=reflection_payload,
                                recent_rounds=list(recent_rounds),
                            )
                        suppressed_tool_ids.update(
                            self._expand_reflection_suppression_aliases(
                                reflection_payload.get("suppress_tool_ids", []),
                                attempted_tool_ids=attempted_tool_ids,
                                context=context,
                            )
                        )
                        promoted_tool_ids = [
                            self._normalize_text_token(item)
                            for item in list(reflection_payload.get("promote_tool_ids", []) or [])
                            if self._normalize_text_token(item)
                        ]
                        reflection_state = (
                            str(reflection_payload.get("state", "continue") or "continue").strip().lower()
                        )
                        priority_shift = str(reflection_payload.get("priority_shift", "") or "").strip().lower()
                        if reflection_state == "complete" or priority_shift in {"manual_validation", "stop"}:
                            summary["reflection_stops"] += 1
                            break

                low_yield_stop_reason = self._should_stop_low_yield_external_recon(
                    target=target,
                    context=context,
                    attempted_tool_ids=sorted(attempted_tool_ids),
                    recent_rounds=recent_rounds,
                    engagement_policy=engagement_policy,
                )
                if low_yield_stop_reason:
                    summary.setdefault("target_stop_reasons", []).append(
                        {
                            "host_ip": str(target.host_ip or ""),
                            "port": str(target.port or ""),
                            "protocol": str(target.protocol or "tcp"),
                            "service": str(target.service_name or ""),
                            "reason": low_yield_stop_reason,
                        }
                    )
                    break

                decisions = self.planner.plan_actions(
                    target.service_name,
                    target.protocol,
                    settings,
                    context=context,
                    excluded_tool_ids=sorted(set(attempted_tool_ids).union(suppressed_tool_ids)),
                    excluded_family_ids=sorted(attempted_family_ids),
                    excluded_command_signatures=sorted(attempted_command_signatures),
                    limit=int(resolved_options.max_actions_per_round or 0) or None,
                    engagement_policy=engagement_policy,
                )

                if str(resolved_options.scheduler_mode or "").strip().lower() == "ai":
                    provider_payload = self.planner.get_last_provider_payload(clear=True)
                    if on_ai_analysis:
                        on_ai_analysis(target=target, provider_payload=provider_payload)

                if not decisions:
                    break

                decisions = self._trim_decisions_for_cost_control(
                    target=target,
                    decisions=decisions,
                    context=context,
                    engagement_policy=engagement_policy,
                )

                if not decisions:
                    break

                if promoted_tool_ids:
                    promoted_set = {
                        self._normalize_text_token(item)
                        for item in promoted_tool_ids
                        if self._normalize_text_token(item)
                    }
                    decisions = sorted(
                        list(decisions),
                        key=lambda item: (
                            0 if self._normalize_text_token(getattr(item, "tool_id", "")) in promoted_set else 1,
                        ),
                    )

                parallel_wave_tool_ids = self._web_parallel_followup_wave_tool_ids(
                    target=target,
                    decisions=decisions,
                    provider_payload=provider_payload if isinstance(locals().get("provider_payload"), dict) else {},
                    options=resolved_options,
                )
                if parallel_wave_tool_ids:
                    wave_order = {tool_id: index for index, tool_id in enumerate(parallel_wave_tool_ids) if tool_id}
                    decisions = sorted(
                        [
                            item
                            for item in list(decisions)
                            if self._normalize_text_token(getattr(item, "tool_id", "")) in wave_order
                        ],
                        key=lambda item: wave_order.get(
                            self._normalize_text_token(getattr(item, "tool_id", "")),
                            len(wave_order),
                        ),
                    )

                round_progress = False
                execution_tasks: List[SchedulerExecutionTask] = []
                round_scheduled_tool_ids: Set[str] = set()
                round_scheduled_family_ids: Set[str] = set()
                round_scheduled_command_signatures: Set[str] = set()
                round_selected_tool_ids: List[str] = []
                round_selected_family_ids: List[str] = []
                duplicate_filtered_count = 0
                suppressed_filtered_count = 0

                for decision in decisions:
                    normalized_tool_id = str(decision.tool_id or "").strip().lower()
                    normalized_family_id = self._normalize_text_token(getattr(decision, "family_id", ""))
                    root_domain_token = ""
                    if normalized_tool_id and normalized_tool_id in suppressed_tool_ids:
                        suppressed_filtered_count += 1
                        continue
                    if normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                        root_domain_token = self._target_host_root_token(target)
                        if root_domain_token and (root_domain_token, normalized_tool_id) in root_domain_tool_attempts:
                            duplicate_filtered_count += 1
                            continue
                    if (
                        not normalized_tool_id
                        or normalized_tool_id in attempted_tool_ids
                        or normalized_tool_id in round_scheduled_tool_ids
                        or (normalized_family_id and normalized_family_id in attempted_family_ids)
                        or (normalized_family_id and normalized_family_id in round_scheduled_family_ids)
                    ):
                        duplicate_filtered_count += 1
                        continue

                    summary["considered"] += 1
                    command_template = str(decision.command_template or "") or self._find_command_template_for_tool(
                        settings,
                        decision.tool_id,
                    )
                    validation_error = self._target_tool_validation_error(
                        settings=settings,
                        target=target,
                        tool_id=normalized_tool_id,
                        command_template=command_template,
                    )
                    if validation_error:
                        attempted_tool_ids.add(normalized_tool_id)
                        if normalized_family_id:
                            attempted_family_ids.add(normalized_family_id)
                        summary["skipped"] += 1
                        round_progress = True
                        continue
                    normalized_command_signature = self._normalize_text_token(
                        SchedulerPlanner._command_signature(str(target.protocol or "tcp"), command_template)
                    )
                    if normalized_command_signature and (
                        normalized_command_signature in attempted_command_signatures
                        or normalized_command_signature in round_scheduled_command_signatures
                    ):
                        duplicate_filtered_count += 1
                        continue

                    round_selected_tool_ids.append(normalized_tool_id)
                    if normalized_family_id:
                        round_selected_family_ids.append(normalized_family_id)

                    if decision.is_blocked:
                        disposition = (
                            handle_blocked(
                                target=target,
                                decision=decision,
                                command_template=command_template,
                            )
                            if handle_blocked
                            else SchedulerDecisionDisposition(
                                action="skipped",
                                reason=decision.policy_reason or "blocked by policy",
                            )
                        )
                        attempted_tool_ids.add(normalized_tool_id)
                        if normalized_family_id:
                            attempted_family_ids.add(normalized_family_id)
                        if normalized_command_signature:
                            attempted_command_signatures.add(normalized_command_signature)
                        summary["skipped"] += 1
                        round_progress = True
                        _ = disposition
                        continue

                    if decision.requires_approval:
                        disposition = (
                            handle_approval(
                                target=target,
                                decision=decision,
                                command_template=command_template,
                            )
                            if handle_approval
                            else SchedulerDecisionDisposition(
                                action="queued",
                                reason=decision.policy_reason or "approval required",
                            )
                        )
                        action = str(getattr(disposition, "action", "queued") or "queued").strip().lower()
                        if action == "execute":
                            round_scheduled_tool_ids.add(normalized_tool_id)
                            if normalized_family_id:
                                round_scheduled_family_ids.add(normalized_family_id)
                            if normalized_command_signature:
                                round_scheduled_command_signatures.add(normalized_command_signature)
                            if root_domain_token and normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                                root_domain_tool_attempts.add((root_domain_token, normalized_tool_id))
                            execution_tasks.append(
                                SchedulerExecutionTask(
                                    decision=decision,
                                    tool_id=normalized_tool_id,
                                    host_id=int(target.host_id or 0),
                                    host_ip=str(target.host_ip or ""),
                                    hostname=str(target.hostname or ""),
                                    port=str(target.port or ""),
                                    protocol=str(target.protocol or "tcp"),
                                    service_name=str(target.service_name or ""),
                                    command_template=command_template,
                                    timeout=int(resolved_options.task_timeout_seconds or 300),
                                    job_id=int(resolved_options.job_id or 0),
                                    approval_id=int(getattr(disposition, "approval_id", 0) or 0),
                                    runner_preference=str((engagement_policy or {}).get("runner_preference", "") or ""),
                                )
                            )
                        else:
                            attempted_tool_ids.add(normalized_tool_id)
                            if normalized_family_id:
                                attempted_family_ids.add(normalized_family_id)
                            if normalized_command_signature:
                                attempted_command_signatures.add(normalized_command_signature)
                            if root_domain_token and normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                                root_domain_tool_attempts.add((root_domain_token, normalized_tool_id))
                            round_progress = True
                            if action == "queued":
                                summary["approval_queued"] += 1
                            else:
                                summary["skipped"] += 1
                        continue

                    round_scheduled_tool_ids.add(normalized_tool_id)
                    if normalized_family_id:
                        round_scheduled_family_ids.add(normalized_family_id)
                    if normalized_command_signature:
                        round_scheduled_command_signatures.add(normalized_command_signature)
                    if root_domain_token and normalized_tool_id in ROOT_DOMAIN_SCOPED_TOOL_IDS:
                        root_domain_tool_attempts.add((root_domain_token, normalized_tool_id))
                    execution_tasks.append(
                        SchedulerExecutionTask(
                            decision=decision,
                            tool_id=normalized_tool_id,
                            host_id=int(target.host_id or 0),
                            host_ip=str(target.host_ip or ""),
                            hostname=str(target.hostname or ""),
                            port=str(target.port or ""),
                            protocol=str(target.protocol or "tcp"),
                            service_name=str(target.service_name or ""),
                            command_template=command_template,
                            timeout=int(resolved_options.task_timeout_seconds or 300),
                            job_id=int(resolved_options.job_id or 0),
                            runner_preference=str((engagement_policy or {}).get("runner_preference", "") or ""),
                        )
                    )

                execution_results = (
                    execute_batch(execution_tasks, int(resolved_options.scheduler_concurrency or 1))
                    if execute_batch and execution_tasks
                    else []
                )
                for result in list(execution_results or []):
                    decision = result.get("decision")
                    normalized_tool_id = str(result.get("tool_id", "") or "").strip().lower()
                    executed = bool(result.get("executed", False))

                    if on_execution_result and decision is not None:
                        on_execution_result(
                            target=target,
                            decision=decision,
                            result=result,
                        )

                    if normalized_tool_id:
                        attempted_tool_ids.add(normalized_tool_id)
                    normalized_family_id = self._normalize_text_token(getattr(decision, "family_id", ""))
                    if normalized_family_id:
                        attempted_family_ids.add(normalized_family_id)
                    command_template = str(getattr(decision, "command_template", "") or "")
                    if not command_template:
                        command_template = self._find_command_template_for_tool(
                            settings, getattr(decision, "tool_id", "")
                        )
                    normalized_command_signature = self._normalize_text_token(
                        SchedulerPlanner._command_signature(str(target.protocol or "tcp"), command_template)
                    )
                    if normalized_command_signature:
                        attempted_command_signatures.add(normalized_command_signature)
                    round_progress = True
                    if executed:
                        summary["executed"] += 1
                    else:
                        summary["skipped"] += 1

                post_round_context = context
                if use_feedback_loop and build_context:
                    post_round_context = build_context(
                        target=target,
                        attempted_tool_ids=set(attempted_tool_ids),
                        attempted_family_ids=set(attempted_family_ids),
                        attempted_command_signatures=set(attempted_command_signatures),
                        recent_output_chars=int(resolved_options.recent_output_chars or 900),
                        analysis_mode=resolved_options.analysis_mode,
                    )

                round_snapshot = self._build_round_snapshot(
                    round_number=len(recent_rounds) + 1,
                    context=post_round_context,
                    provider_payload=provider_payload if isinstance(locals().get("provider_payload"), dict) else {},
                    decision_tool_ids=round_selected_tool_ids,
                    decision_family_ids=round_selected_family_ids,
                    duplicate_filtered_count=duplicate_filtered_count,
                    suppressed_filtered_count=suppressed_filtered_count,
                    recent_rounds=recent_rounds,
                )
                previous_round = recent_rounds[-1] if recent_rounds else None
                round_snapshot["progress_score"] = self._round_progress_score(previous_round, round_snapshot)
                recent_rounds.append(round_snapshot)
                if len(recent_rounds) > 8:
                    recent_rounds = recent_rounds[-8:]

                if not round_progress:
                    break
                if not use_feedback_loop:
                    break

        return summary
