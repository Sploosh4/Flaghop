"""SchedulerOrchestrator: options."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence
from app.scheduler.planner import SchedulerPlanner
from app.scheduler.orchestration.models import (
    DEFAULT_AI_FEEDBACK_CONFIG,
    DIG_DEEPER_MAX_RUNTIME_SECONDS,
    DIG_DEEPER_MAX_TOTAL_ACTIONS,
    DIG_DEEPER_TASK_TIMEOUT_SECONDS,
    EXTERNAL_RECON_WEB_BUCKET_CAPS,
    EXTERNAL_RECON_LOW_YIELD_PHASES,
    EXTERNAL_RECON_METADATA_TOOL_IDS,
    EXTERNAL_RECON_CONTENT_DISCOVERY_TOOL_IDS,
    EXTERNAL_RECON_HEAVY_VALIDATION_TOOL_IDS,
    EXTERNAL_RECON_CLOUD_FOLLOWUP_TOOL_IDS,
    SchedulerTarget,
    SchedulerRunOptions,
)


class Options:
    @staticmethod
    def _scheduler_max_concurrency(preferences: Optional[Dict[str, Any]] = None) -> int:
        source = preferences if isinstance(preferences, dict) else {}
        try:
            value = int(source.get("max_concurrency", 1))
        except (TypeError, ValueError):
            value = 1
        return max(1, min(value, 16))

    @staticmethod
    def _scheduler_max_host_concurrency(preferences: Optional[Dict[str, Any]] = None) -> int:
        source = preferences if isinstance(preferences, dict) else {}
        try:
            value = int(source.get("max_host_concurrency", 1))
        except (TypeError, ValueError):
            value = 1
        return max(1, min(value, 8))

    @staticmethod
    def _scheduler_feedback_config(preferences: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        merged = dict(DEFAULT_AI_FEEDBACK_CONFIG)
        source = preferences.get("ai_feedback", {}) if isinstance(preferences, dict) else {}
        if isinstance(source, dict):
            merged.update(source)

        try:
            merged["max_rounds_per_target"] = int(merged.get("max_rounds_per_target", 4))
        except (TypeError, ValueError):
            merged["max_rounds_per_target"] = 4
        try:
            merged["max_actions_per_round"] = int(merged.get("max_actions_per_round", 4))
        except (TypeError, ValueError):
            merged["max_actions_per_round"] = 4
        for key, default_value in (
            ("recent_output_chars", 900),
            ("stall_rounds_without_progress", 2),
            ("stall_repeat_selection_threshold", 2),
            ("max_reflections_per_target", 1),
        ):
            try:
                merged[key] = int(merged.get(key, default_value))
            except (TypeError, ValueError):
                merged[key] = default_value

        merged["enabled"] = bool(merged.get("enabled", True))
        merged["reflection_enabled"] = bool(merged.get("reflection_enabled", True))
        merged["max_rounds_per_target"] = max(1, min(int(merged["max_rounds_per_target"]), 12))
        merged["max_actions_per_round"] = max(1, min(int(merged["max_actions_per_round"]), 8))
        merged["recent_output_chars"] = max(320, min(int(merged["recent_output_chars"]), 4000))
        merged["stall_rounds_without_progress"] = max(1, min(int(merged["stall_rounds_without_progress"]), 6))
        merged["stall_repeat_selection_threshold"] = max(1, min(int(merged["stall_repeat_selection_threshold"]), 8))
        merged["max_reflections_per_target"] = max(0, min(int(merged["max_reflections_per_target"]), 4))
        return merged

    @staticmethod
    def _normalize_text_token(value: Any) -> str:
        return str(value or "").strip().lower()

    @classmethod
    def _decision_cost_bucket(cls, decision: Any) -> str:
        tool_id = cls._normalize_text_token(getattr(decision, "tool_id", ""))
        if tool_id in EXTERNAL_RECON_METADATA_TOOL_IDS:
            return "metadata"
        if tool_id in EXTERNAL_RECON_CONTENT_DISCOVERY_TOOL_IDS:
            return "content_discovery"
        if tool_id in EXTERNAL_RECON_HEAVY_VALIDATION_TOOL_IDS:
            return "heavy_validation"
        if tool_id in EXTERNAL_RECON_CLOUD_FOLLOWUP_TOOL_IDS:
            return "cloud_followup"
        return "other"

    @classmethod
    def _trim_decisions_for_cost_control(
        cls,
        *,
        target: SchedulerTarget,
        decisions: Sequence[Any],
        context: Optional[Dict[str, Any]],
        engagement_policy: Optional[Dict[str, Any]],
    ) -> List[Any]:
        preset = cls._normalize_text_token((engagement_policy or {}).get("preset", ""))
        if preset != "external_recon":
            return list(decisions or [])

        service_name = cls._normalize_text_token(getattr(target, "service_name", ""))
        if service_name not in SchedulerPlanner.WEB_SERVICE_IDS:
            return list(decisions or [])

        current_phase = cls._normalize_text_token(SchedulerPlanner._context_current_phase(context))
        if current_phase not in EXTERNAL_RECON_LOW_YIELD_PHASES:
            return list(decisions or [])

        bucket_caps = dict(EXTERNAL_RECON_WEB_BUCKET_CAPS)
        kept: List[Any] = []
        bucket_counts: Dict[str, int] = {}
        total_cap = sum(int(value or 0) for value in bucket_caps.values())
        for decision in list(decisions or []):
            bucket = cls._decision_cost_bucket(decision)
            bucket_cap = bucket_caps.get(bucket)
            if bucket_cap is not None and int(bucket_counts.get(bucket, 0) or 0) >= int(bucket_cap):
                continue
            kept.append(decision)
            if bucket_cap is not None:
                bucket_counts[bucket] = int(bucket_counts.get(bucket, 0) or 0) + 1
            if total_cap > 0 and len(kept) >= int(total_cap):
                break
        return kept

    def build_run_options(
        self,
        preferences: Optional[Dict[str, Any]] = None,
        *,
        dig_deeper: bool = False,
        job_id: int = 0,
        enable_feedback: Optional[bool] = None,
        max_actions_per_round: Optional[int] = None,
        max_rounds: Optional[int] = None,
    ) -> SchedulerRunOptions:
        prefs = preferences if isinstance(preferences, dict) else self.config_manager.load()
        scheduler_mode = str(prefs.get("mode", "deterministic") or "deterministic").strip().lower()
        scheduler_concurrency = self._scheduler_max_concurrency(prefs)
        host_concurrency = self._scheduler_max_host_concurrency(prefs)
        ai_feedback_cfg = self._scheduler_feedback_config(prefs)
        ai_feedback_enabled = bool(ai_feedback_cfg.get("enabled", True))
        if enable_feedback is not None:
            ai_feedback_enabled = bool(enable_feedback)

        resolved_max_rounds = int(ai_feedback_cfg.get("max_rounds_per_target", 4)) if ai_feedback_enabled else 1
        resolved_max_actions = int(ai_feedback_cfg.get("max_actions_per_round", 4)) if ai_feedback_enabled else 0
        recent_output_chars = int(ai_feedback_cfg.get("recent_output_chars", 900))
        reflection_enabled = bool(ai_feedback_cfg.get("reflection_enabled", True)) if ai_feedback_enabled else False
        stall_rounds_without_progress = int(ai_feedback_cfg.get("stall_rounds_without_progress", 2))
        stall_repeat_selection_threshold = int(ai_feedback_cfg.get("stall_repeat_selection_threshold", 2))
        max_reflections_per_target = (
            int(ai_feedback_cfg.get("max_reflections_per_target", 1)) if ai_feedback_enabled else 0
        )
        task_timeout_seconds = DIG_DEEPER_TASK_TIMEOUT_SECONDS if bool(dig_deeper) else 300

        if max_rounds is not None:
            resolved_max_rounds = max(1, int(max_rounds))
        if max_actions_per_round is not None:
            resolved_max_actions = max(0, int(max_actions_per_round))

        if ai_feedback_enabled:
            resolved_max_actions = max(
                resolved_max_actions,
                max(1, min(int(scheduler_concurrency), 8)),
            )

        if ai_feedback_enabled and bool(dig_deeper):
            resolved_max_rounds = max(resolved_max_rounds, 4)
            resolved_max_actions = max(resolved_max_actions, 3)
            recent_output_chars = max(recent_output_chars, 1600)
            max_reflections_per_target = max(max_reflections_per_target, 1)
            host_concurrency = 1

        return SchedulerRunOptions(
            scheduler_mode=scheduler_mode,
            scheduler_concurrency=scheduler_concurrency,
            host_concurrency=max(1, min(int(host_concurrency or 1), 8)),
            ai_feedback_enabled=ai_feedback_enabled,
            max_rounds=max(1, min(int(resolved_max_rounds), 12)),
            max_actions_per_round=max(0, min(int(resolved_max_actions), 8)),
            recent_output_chars=max(320, min(int(recent_output_chars), 4000)),
            reflection_enabled=bool(reflection_enabled),
            stall_rounds_without_progress=max(1, min(int(stall_rounds_without_progress), 6)),
            stall_repeat_selection_threshold=max(1, min(int(stall_repeat_selection_threshold), 8)),
            max_reflections_per_target=max(0, min(int(max_reflections_per_target), 4)),
            dig_deeper=bool(dig_deeper),
            max_runtime_seconds=DIG_DEEPER_MAX_RUNTIME_SECONDS if bool(dig_deeper) else 0,
            max_total_actions=DIG_DEEPER_MAX_TOTAL_ACTIONS if bool(dig_deeper) else 0,
            task_timeout_seconds=task_timeout_seconds,
            job_id=int(job_id or 0),
        )
