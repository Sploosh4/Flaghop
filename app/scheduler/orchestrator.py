from app.scheduler.orchestration.target_run import TargetRun, RunBudget, SchedulerCallbacks
import time
from typing import Tuple, Any, Callable, Dict, Iterable, List, Optional, Sequence, Set
from app.scheduler.planner import SchedulerPlanner
from app.scheduler.policy import (
    ensure_scheduler_engagement_policy_table,
    get_project_engagement_policy,
    normalize_engagement_policy,
    upsert_project_engagement_policy,
)

from app.contracts.actions.orchestration import (
    ROOT_DOMAIN_SCOPED_TOOL_IDS,
    SchedulerTarget,
    SchedulerExecutionTask,
    SchedulerDecisionDisposition,
    SchedulerRunOptions,
)

__all__ = [
    "SchedulerOrchestrator",
    "SchedulerTarget",
    "SchedulerExecutionTask",
    "SchedulerDecisionDisposition",
    "SchedulerRunOptions",
]

from app.scheduler.orchestration.targeting import Targeting
from app.scheduler.orchestration.options import Options


class SchedulerOrchestrator(Targeting, Options):
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
        }
        budget = RunBudget(summary)
        callbacks = SchedulerCallbacks(
            should_cancel=should_cancel,
            existing_attempts=existing_attempts,
            build_context=build_context,
            handle_blocked=handle_blocked,
            handle_approval=handle_approval,
            execute_batch=execute_batch,
            on_execution_result=on_execution_result,
        )
        for target in list(targets or []):
            run = TargetRun(self, settings, target, engagement_policy, resolved_options, callbacks, budget)
            if not run.run():
                break
        return summary
