"""SchedulerPlanner: strategy."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from app.scheduler.models import PlanStep
from app.scheduler.policy import EngagementPolicy
from app.scheduler.strategy_packs import select_strategy_packs

logger = logging.getLogger(__name__)
ScheduledAction = PlanStep


class Strategy:
    @classmethod
    def _build_target_ref(
        cls,
        service_name: str,
        protocol_name: str,
        *,
        policy: Optional[EngagementPolicy] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        target_ref = {
            "service": str(service_name or ""),
            "protocol": str(protocol_name or "tcp"),
        }
        if isinstance(policy, EngagementPolicy):
            target_ref["scope"] = str(policy.scope)
            target_ref["intent"] = str(policy.intent)
            target_ref["engagement_preset"] = str(policy.preset)
        if not isinstance(context, dict):
            return target_ref
        target = context.get("target", {})
        if isinstance(target, dict):
            for key in (
                "host_id",
                "host_ip",
                "hostname",
                "port",
                "service",
                "protocol",
                "service_product",
                "service_version",
                "service_extrainfo",
            ):
                value = target.get(key)
                if value is None:
                    continue
                text = str(value).strip()
                if text:
                    target_ref[key] = text
        return target_ref

    @staticmethod
    def _build_rationale(
        tool_id: str,
        policy: EngagementPolicy,
        danger_categories: List[str],
        provider_name: str = "",
        provider_error: str = "",
        provider_returned_rankings: bool = True,
        context_signals: Optional[List[str]] = None,
    ) -> str:
        profile_hint = f"prioritizes {policy.scope} {policy.intent} coverage for preset {policy.preset}"
        provider_hint = ""
        if provider_error and provider_name:
            provider_hint = f" Provider '{provider_name}' failed ({provider_error}); heuristic fallback applied."
        elif provider_name and not provider_returned_rankings:
            provider_hint = f" Provider '{provider_name}' returned no ranking; heuristic fallback applied."

        context_hint = ""
        if context_signals:
            picked = [item for item in context_signals if item][:3]
            if picked:
                context_hint = " Context signals: " + ", ".join(picked) + "."

        if danger_categories:
            return (
                f"AI profile {profile_hint}; selected {tool_id} with elevated risk markers: "
                + ", ".join(danger_categories)
                + "."
                + context_hint
                + provider_hint
            )
        return (
            f"AI profile {profile_hint}; selected {tool_id} for highest expected signal.{context_hint}{provider_hint}"
        )

    @staticmethod
    def _append_strategy_context(rationale: str, strategy_guidance) -> str:
        base = str(rationale or "").strip()
        fragments = []
        if getattr(strategy_guidance, "pack_ids", []):
            fragments.append("strategy packs " + ", ".join(list(strategy_guidance.pack_ids or [])[:3]))
        if str(getattr(strategy_guidance, "coverage_notes", "") or "").strip():
            fragments.append(str(strategy_guidance.coverage_notes).strip().rstrip("."))
        evidence_expectations = list(getattr(strategy_guidance, "evidence_expectations", []) or [])
        if evidence_expectations:
            fragments.append("expects " + ", ".join(str(item) for item in evidence_expectations[:2]))
        if not fragments:
            return base
        strategy_text = " ".join(fragment + "." for fragment in fragments if fragment)
        if not base:
            return strategy_text.strip()
        return f"{base} {strategy_text}".strip()

    @classmethod
    def _build_deterministic_rationale(
        cls,
        action,
        selected_packs,
        strategy_guidance,
    ) -> str:
        rationale = "Selected by deterministic scheduler mapping."
        if selected_packs:
            rationale += (
                " Active packs: " + ", ".join(str(item.pack.pack_id) for item in list(selected_packs or [])[:3]) + "."
            )
        rationale = cls._append_strategy_context(rationale, strategy_guidance)
        if not str(getattr(strategy_guidance, "coverage_gap", "") or "").strip():
            action_tags = list(getattr(action, "methodology_tags", []) or [])
            if action_tags:
                rationale += " Methodology tags: " + ", ".join(str(item) for item in action_tags[:3]) + "."
        return rationale.strip()

    @staticmethod
    def _context_has_strategy_signals(context: Optional[Dict[str, Any]]) -> bool:
        if not isinstance(context, dict):
            return False
        for key in ("signals", "coverage", "host_cves", "host_ai_state", "inferred_technologies"):
            value = context.get(key)
            if isinstance(value, dict) and value:
                return True
            if isinstance(value, list) and value:
                return True
        return False

    @staticmethod
    def _select_strategy_packs(
        service_name: str,
        protocol_name: str,
        policy: EngagementPolicy,
        *,
        context: Optional[Dict[str, Any]] = None,
    ):
        return select_strategy_packs(
            service_name,
            protocol_name,
            policy,
            context=context,
        )
