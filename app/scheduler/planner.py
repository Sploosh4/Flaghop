import logging
import json
from typing import Any, Dict, List, Optional, Set

from app.scheduler.family import build_command_family_id
from app.scheduler.models import PlanStep
from app.scheduler.policy_engine import evaluate_policy_for_risk_tags
from app.scheduler.policy import EngagementPolicy, normalize_engagement_policy
from app.scheduler.registry import ActionRegistry
from app.scheduler.strategy_packs import evaluate_action_strategy

logger = logging.getLogger(__name__)

ScheduledAction = PlanStep


from app.scheduler.planning.target_context import TargetContext
from app.scheduler.planning.strategy import Strategy


class SchedulerPlanner(TargetContext, Strategy):
    WEB_SERVICE_IDS = {"http", "https", "ssl", "soap", "http-proxy", "http-alt", "https-alt"}
    HOST_SCOPED_TOOL_IDS = set()
    INTERNAL_QUICK_RECON_DEEP_TOOL_TOKENS = (
        "dirsearch",
        "ffuf",
        "katana",
        "web-content-discovery",
        "nikto",
        "nuclei-cves",
        "nuclei-exposures",
        "wpscan",
        "nuclei-wordpress",
    )

    def __init__(self, config_manager):
        self.config_manager = config_manager

    def plan_actions(
        self,
        service: str,
        protocol: str,
        settings,
        *,
        context: Optional[Dict[str, Any]] = None,
        excluded_tool_ids: Optional[List[str]] = None,
        excluded_family_ids: Optional[List[str]] = None,
        excluded_command_signatures: Optional[List[str]] = None,
        limit: Optional[int] = None,
        engagement_policy: Optional[Dict[str, Any]] = None,
        mode_override: Optional[str] = None,
    ) -> List[PlanStep]:
        return self.plan_steps(
            service,
            protocol,
            settings,
            context=context,
            excluded_tool_ids=excluded_tool_ids,
            excluded_family_ids=excluded_family_ids,
            excluded_command_signatures=excluded_command_signatures,
            limit=limit,
            engagement_policy=engagement_policy,
            mode_override=mode_override,
        )

    def plan_steps(
        self,
        service: str,
        protocol: str,
        settings,
        *,
        context: Optional[Dict[str, Any]] = None,
        excluded_tool_ids: Optional[List[str]] = None,
        excluded_family_ids: Optional[List[str]] = None,
        excluded_command_signatures: Optional[List[str]] = None,
        limit: Optional[int] = None,
        engagement_policy: Optional[Dict[str, Any]] = None,
        mode_override: Optional[str] = None,
    ) -> List[PlanStep]:
        prefs = self.config_manager.load()
        mode = str(mode_override or prefs.get("mode", "deterministic") or "deterministic").strip().lower()
        if mode != "deterministic":
            mode = "deterministic"
        policy = normalize_engagement_policy(
            engagement_policy or prefs.get("engagement_policy", {}),
            fallback_goal_profile=str(
                prefs.get("goal_profile", "internal_asset_discovery") or "internal_asset_discovery"
            ),
        )
        dangerous_categories = self.config_manager.get_dangerous_categories()
        excluded = self._normalize_tool_id_set(excluded_tool_ids)
        excluded.update(self._normalize_tool_id_set(prefs.get("disabled_tool_ids", [])))
        excluded_families = self._normalize_text_token_set(excluded_family_ids)
        excluded_signatures = self._normalize_text_token_set(excluded_command_signatures)
        registry = self.build_action_registry(settings, dangerous_categories)

        return self._plan_deterministic(
            service,
            protocol,
            registry,
            policy,
            dangerous_categories,
            mode=mode,
            context=context,
            excluded_tool_ids=excluded,
            excluded_family_ids=excluded_families,
            excluded_command_signatures=excluded_signatures,
            limit=limit,
        )

    @staticmethod
    def build_action_registry(settings, dangerous_categories: Optional[List[str]] = None) -> ActionRegistry:
        return ActionRegistry.from_settings(settings, dangerous_categories=dangerous_categories)

    @classmethod
    def _blocked_by_internal_quick_recon(
        cls,
        *,
        tool_id: str,
        label: str,
        command_template: str,
        policy: EngagementPolicy,
    ) -> bool:
        if str(policy.preset or "").strip().lower() != "internal_quick_recon":
            return False
        text = " ".join([str(tool_id or ""), str(label or ""), str(command_template or "")]).lower()
        return cls._matches_any_token(text, cls.INTERNAL_QUICK_RECON_DEEP_TOOL_TOKENS)

    def _plan_deterministic(
        self,
        service: str,
        protocol: str,
        registry: ActionRegistry,
        policy: EngagementPolicy,
        dangerous_categories: List[str],
        mode: str = "deterministic",
        context: Optional[Dict[str, Any]] = None,
        excluded_tool_ids: Optional[Set[str]] = None,
        excluded_family_ids: Optional[Set[str]] = None,
        excluded_command_signatures: Optional[Set[str]] = None,
        limit: Optional[int] = None,
    ) -> List[PlanStep]:
        service_name = str(service or "").strip().rstrip("?")
        protocol_name = str(protocol or "tcp").strip().lower()
        decisions = []
        excluded = set(excluded_tool_ids or set())
        excluded_families = set(excluded_family_ids or set())
        excluded_signatures = set(excluded_command_signatures or set())
        policy_snapshot_hash = self._policy_snapshot_hash(policy, dangerous_categories)
        target_ref = self._build_target_ref(service_name, protocol_name, policy=policy, context=context)
        selected_packs = self._select_strategy_packs(
            service_name,
            protocol_name,
            policy,
            context=context,
        )
        ranked_steps = []

        for index, action in enumerate(registry.for_deterministic(service_name, protocol_name)):
            tool_id = str(action.tool_id)
            normalized_tool_id = self._normalized_tool_id(tool_id)
            action_scope = {
                str(item or "").strip().lower()
                for item in list(getattr(action, "service_scope", []) or [])
                if str(item or "").strip()
            }
            if (
                service_name.lower() == "host"
                and "host" not in action_scope
                and normalized_tool_id not in self.HOST_SCOPED_TOOL_IDS
            ):
                continue
            if self._blocked_by_internal_quick_recon(
                tool_id=tool_id,
                label=str(action.label or ""),
                command_template=str(action.command_template or ""),
                policy=policy,
            ):
                continue
            family_id = build_command_family_id(tool_id, protocol_name, action.command_template or tool_id)
            command_signature = self._command_signature(protocol_name, action.command_template or tool_id)
            if (
                normalized_tool_id in excluded
                or self._normalize_text_token(family_id) in excluded_families
                or self._normalize_text_token(command_signature) in excluded_signatures
            ):
                continue
            if self._candidate_blocked_by_tool_audit(
                tool_id=tool_id,
                command_template=str(action.command_template or ""),
                context=context,
            ):
                continue
            strategy_guidance = evaluate_action_strategy(
                action,
                selected_packs,
                policy,
                context=context,
            )
            step = PlanStep.from_action_spec(
                action,
                origin_mode=mode,
                origin_planner="scheduler_deterministic",
                engagement_preset=policy.preset,
                policy_snapshot_hash=policy_snapshot_hash,
                target_ref=target_ref,
                parameters={"protocol": protocol_name},
                rationale=self._build_deterministic_rationale(
                    action,
                    selected_packs,
                    strategy_guidance,
                ),
                success_criteria=["Action completed without execution errors."],
                selection_score=1.0 + float(strategy_guidance.bonus or 0.0),
                family_id=family_id,
                risk_tags=list(action.risk_tags),
                pack_ids=list(strategy_guidance.pack_ids),
                coverage_gap=str(strategy_guidance.coverage_gap or ""),
                coverage_notes=str(strategy_guidance.coverage_notes or ""),
                evidence_expectations=list(strategy_guidance.evidence_expectations),
            )
            self._apply_policy_decision(step, policy)
            ranked_steps.append((index, step))
        if self._context_has_strategy_signals(context):
            ranked_steps.sort(key=lambda item: (-float(item[1].score), int(item[0])))
        decisions = [item[1] for item in ranked_steps]
        if limit is not None:
            try:
                max_items = int(limit)
            except (TypeError, ValueError):
                max_items = 0
            if max_items > 0:
                return decisions[:max_items]
        return decisions

    @staticmethod
    def _policy_snapshot_hash(policy: EngagementPolicy, dangerous_categories: List[str]) -> str:
        payload = {
            "engagement_policy": policy.to_dict(),
            "dangerous_categories": sorted(
                str(item or "") for item in list(dangerous_categories or []) if str(item or "").strip()
            ),
        }
        rendered = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return build_command_family_id("scheduler-policy", "policy", rendered)

    def _apply_policy_decision(self, step: PlanStep, policy: EngagementPolicy) -> PlanStep:
        family_policy_state = self.config_manager.get_family_policy_state(step.family_id)
        decision = evaluate_policy_for_risk_tags(
            step.risk_tags,
            policy,
            family_policy_state=family_policy_state,
        )
        step.approval_state = (
            "blocked"
            if decision.is_blocked
            else ("approval_required" if decision.requires_approval else "not_required")
        )
        step.risk_tags = list(decision.risk_tags)
        step.policy_reason = str(decision.reason or "")
        step.risk_summary = str(decision.risk_summary or "")
        step.safer_alternative = str(decision.safer_alternative or "")
        step.family_policy_state = str(decision.family_policy_state or "")
        return step
