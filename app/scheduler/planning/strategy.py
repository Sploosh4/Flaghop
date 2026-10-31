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
