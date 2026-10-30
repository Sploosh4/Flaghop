"""SchedulerOrchestrator: reflection."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence, Set
from app.scheduler.planner import SchedulerPlanner
from app.scheduler.orchestration.models import (
    EXTERNAL_RECON_LOW_YIELD_PHASES,
    EXTERNAL_RECON_METADATA_TOOL_IDS,
    EXTERNAL_RECON_CONTENT_DISCOVERY_TOOL_IDS,
    EXTERNAL_RECON_HEAVY_VALIDATION_TOOL_IDS,
    EXTERNAL_RECON_CLOUD_FOLLOWUP_TOOL_IDS,
    EXTERNAL_RECON_HIGH_SIGNAL_KEYS,
    SchedulerTarget,
    SchedulerRunOptions,
)


class Reflection:
    @classmethod
    def _should_stop_low_yield_external_recon(
        cls,
        *,
        target: SchedulerTarget,
        context: Optional[Dict[str, Any]],
        attempted_tool_ids: Sequence[Any],
        recent_rounds: Sequence[Dict[str, Any]],
        engagement_policy: Optional[Dict[str, Any]],
    ) -> str:
        preset = cls._normalize_text_token((engagement_policy or {}).get("preset", ""))
        if preset != "external_recon":
            return ""

        service_name = cls._normalize_text_token(getattr(target, "service_name", ""))
        if service_name not in SchedulerPlanner.WEB_SERVICE_IDS:
            return ""

        current_phase = cls._normalize_text_token(SchedulerPlanner._context_current_phase(context))
        if current_phase not in EXTERNAL_RECON_LOW_YIELD_PHASES:
            return ""

        if cls._context_coverage_missing(context):
            return ""

        signals = (
            context.get("signals", {})
            if isinstance(context, dict) and isinstance(context.get("signals", {}), dict)
            else {}
        )
        if any(bool(signals.get(key)) for key in EXTERNAL_RECON_HIGH_SIGNAL_KEYS):
            return ""

        rounds = [item for item in list(recent_rounds or []) if isinstance(item, dict)]
        if len(rounds) < 2:
            return ""
        window = rounds[-2:]
        if any(int(item.get("progress_score", 0) or 0) > 0 for item in window):
            return ""
        if any(int(item.get("findings_count", 0) or 0) > 0 for item in window):
            return ""

        attempted = {
            cls._normalize_text_token(item)
            for item in list(attempted_tool_ids or [])
            if cls._normalize_text_token(item)
        }
        if not attempted:
            return ""
        explored = (
            EXTERNAL_RECON_METADATA_TOOL_IDS
            | EXTERNAL_RECON_CONTENT_DISCOVERY_TOOL_IDS
            | EXTERNAL_RECON_HEAVY_VALIDATION_TOOL_IDS
            | EXTERNAL_RECON_CLOUD_FOLLOWUP_TOOL_IDS
        )
        if not (attempted & explored):
            return ""
        return "external_recon_low_yield_web_stop"

    @classmethod
    def _expand_reflection_suppression_aliases(
        cls,
        values: Iterable[Any],
        *,
        attempted_tool_ids: Optional[Iterable[Any]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Set[str]:
        exact = {cls._normalize_text_token(item) for item in list(values or []) if cls._normalize_text_token(item)}
        if not exact:
            return set()

        expanded = set(exact)
        whatweb_family = {"whatweb", "whatweb-http", "whatweb-https"}
        if not (exact & whatweb_family):
            return expanded

        evidence = {
            cls._normalize_text_token(item)
            for item in list(attempted_tool_ids or set())
            if cls._normalize_text_token(item)
        }
        if isinstance(context, dict):
            evidence.update(
                cls._normalize_text_token(item)
                for item in list(context.get("attempted_tool_ids", []) or [])
                if cls._normalize_text_token(item)
            )
            recent_processes = (
                context.get("recent_processes", []) if isinstance(context.get("recent_processes", []), list) else []
            )
            evidence.update(
                cls._normalize_text_token(item.get("tool_id", ""))
                for item in recent_processes
                if isinstance(item, dict) and cls._normalize_text_token(item.get("tool_id", ""))
            )
            host_ports = context.get("host_ports", []) if isinstance(context.get("host_ports", []), list) else []
            for port_row in host_ports:
                if not isinstance(port_row, dict):
                    continue
                evidence.update(
                    cls._normalize_text_token(item)
                    for item in list(port_row.get("scripts", []) or [])
                    if cls._normalize_text_token(item)
                )
            signals = context.get("signals", {}) if isinstance(context.get("signals", {}), dict) else {}
            evidence.update(
                cls._normalize_text_token(item)
                for item in list(signals.get("missing_tools", []) or [])
                + list(signals.get("audited_missing_tools", []) or [])
                if cls._normalize_text_token(item)
            )
            tool_audit = context.get("tool_audit", {}) if isinstance(context.get("tool_audit", {}), dict) else {}
            evidence.update(
                cls._normalize_text_token(item)
                for item in list(tool_audit.get("unavailable_tool_ids", []) or [])
                if cls._normalize_text_token(item)
            )
            context_summary = (
                context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
            )
            evidence.update(
                cls._normalize_text_token(item)
                for item in list(context_summary.get("recent_attempts", []) or [])
                if cls._normalize_text_token(item)
            )

        if evidence & whatweb_family:
            expanded.update(whatweb_family)
        return expanded

    @classmethod
    def _normalize_attempt_summary(cls, payload: Any) -> Dict[str, Set[str]]:
        if isinstance(payload, dict):
            return {
                "tool_ids": {
                    cls._normalize_text_token(item)
                    for item in list(payload.get("tool_ids", []) or [])
                    if cls._normalize_text_token(item)
                },
                "family_ids": {
                    cls._normalize_text_token(item)
                    for item in list(payload.get("family_ids", []) or [])
                    if cls._normalize_text_token(item)
                },
                "command_signatures": {
                    cls._normalize_text_token(item)
                    for item in list(payload.get("command_signatures", []) or [])
                    if cls._normalize_text_token(item)
                },
            }
        normalized = {
            cls._normalize_text_token(item) for item in list(payload or set()) if cls._normalize_text_token(item)
        }
        return {
            "tool_ids": normalized,
            "family_ids": set(),
            "command_signatures": set(),
        }

    @staticmethod
    def _context_coverage_missing(context: Optional[Dict[str, Any]]) -> List[str]:
        coverage = context.get("coverage", {}) if isinstance(context, dict) else {}
        if not isinstance(coverage, dict):
            return []
        values = []
        for item in list(coverage.get("missing", []) or []):
            token = str(item or "").strip().lower()
            if token and token not in values:
                values.append(token[:64])
        return values[:24]

    @classmethod
    def _context_signal_key(cls, context: Optional[Dict[str, Any]]) -> str:
        if not isinstance(context, dict):
            return ""
        parts: List[str] = []
        coverage = context.get("coverage", {})
        if isinstance(coverage, dict):
            stage = str(coverage.get("stage", "") or "").strip().lower()
            if stage:
                parts.append(f"stage:{stage[:32]}")
        signals = context.get("signals", {})
        if isinstance(signals, dict):
            enabled = sorted(
                [str(key or "").strip().lower() for key, value in signals.items() if isinstance(value, bool) and value]
            )[:12]
            parts.extend(enabled)
            observed = [
                str(item or "").strip().lower()
                for item in list(signals.get("observed_technologies", []) or [])[:6]
                if str(item or "").strip()
            ]
            parts.extend([f"tech:{item[:32]}" for item in observed])
        return "|".join(parts)[:240]

    @classmethod
    def _context_current_phase(cls, context: Optional[Dict[str, Any]]) -> str:
        if not isinstance(context, dict):
            return ""
        context_summary = (
            context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        )
        focus = context_summary.get("focus", {}) if isinstance(context_summary.get("focus", {}), dict) else {}
        for value in (
            focus.get("current_phase", ""),
            context.get("current_phase", ""),
            context.get("phase", ""),
            context.get("next_phase", ""),
        ):
            token = cls._normalize_text_token(value)
            if token:
                return token[:64]
        host_ai_state = context.get("host_ai_state", {}) if isinstance(context.get("host_ai_state", {}), dict) else {}
        return cls._normalize_text_token(host_ai_state.get("next_phase", ""))[:64]

    @classmethod
    def _context_recent_failures(cls, context: Optional[Dict[str, Any]]) -> List[str]:
        if not isinstance(context, dict):
            return []
        context_summary = (
            context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        )
        summary_failures = [
            cls._normalize_text_token(item)
            for item in list(context_summary.get("recent_failures", []) or [])[:8]
            if cls._normalize_text_token(item)
        ]
        if summary_failures:
            return summary_failures[:8]

        rows = (
            context.get("target_recent_processes", [])
            if isinstance(context.get("target_recent_processes", []), list)
            else []
        )
        if not rows:
            rows = context.get("recent_processes", []) if isinstance(context.get("recent_processes", []), list) else []
        labels: List[str] = []
        for item in rows[:32]:
            if not isinstance(item, dict):
                continue
            tool_id = cls._normalize_text_token(item.get("tool_id", ""))
            status = cls._normalize_text_token(item.get("status", ""))
            output_excerpt = cls._normalize_text_token(item.get("output_excerpt", ""))
            failure_reason = ""
            if any(token in status for token in ("crash", "fail", "error", "timeout", "cancel", "kill", "missing")):
                failure_reason = status[:80]
            elif "command not found" in output_excerpt:
                failure_reason = "command not found"
            elif "no such file" in output_excerpt or "missing file" in output_excerpt:
                failure_reason = "missing file"
            elif "traceback" in output_excerpt or "exception" in output_excerpt:
                failure_reason = "exception"
            if not failure_reason:
                continue
            label = ": ".join(part for part in (tool_id[:80], failure_reason[:80]) if part)
            if label and label not in labels:
                labels.append(label)
        return labels[:8]

    @classmethod
    def _reflection_trigger(
        cls,
        *,
        recent_rounds: Sequence[Dict[str, Any]],
        options: SchedulerRunOptions,
        reflections_used: int,
        context: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        if not bool(options.reflection_enabled):
            return None
        if int(options.max_reflections_per_target or 0) <= 0:
            return None
        if int(reflections_used or 0) >= int(options.max_reflections_per_target or 0):
            return None

        rounds = [item for item in list(recent_rounds or []) if isinstance(item, dict)]
        current_phase = cls._context_current_phase(context)
        round_number = len(rounds) + 1
        window_size = max(1, int(options.stall_rounds_without_progress or 1))
        analysis_mode = (
            cls._normalize_text_token((context or {}).get("analysis_mode", "")) if isinstance(context, dict) else ""
        )

        if not rounds:
            if bool(options.dig_deeper) or analysis_mode == "dig_deeper":
                return {
                    "reason": "first_round",
                    "round_number": round_number,
                    "current_phase": current_phase,
                }
            return None

        previous_phase = cls._normalize_text_token(
            rounds[-1].get("observed_phase", "") or rounds[-1].get("next_phase", "")
        )[:64]
        if current_phase and previous_phase and current_phase != previous_phase:
            return {
                "reason": "phase_transition",
                "round_number": round_number,
                "current_phase": current_phase,
                "previous_phase": previous_phase,
            }

        if len(rounds) < window_size:
            return None

        window = rounds[-window_size:]
        if any(int(item.get("progress_score", 0) or 0) > 0 for item in window):
            return None

        stable_coverage = len({tuple(item.get("coverage_missing", []) or []) for item in window}) == 1
        stable_signal = len({str(item.get("signal_key", "") or "") for item in window}) <= 1
        if not (stable_coverage and stable_signal):
            return None

        failure_sets = []
        for item in window:
            values = {
                cls._normalize_text_token(entry)
                for entry in list(item.get("recent_failures", []) or [])[:8]
                if cls._normalize_text_token(entry)
            }
            if not values:
                failure_sets = []
                break
            failure_sets.append(values)
        if len(failure_sets) >= 2:
            shared_failures = sorted(set.intersection(*failure_sets))
            if shared_failures:
                return {
                    "reason": "repeated_failures",
                    "round_number": round_number,
                    "current_phase": current_phase,
                    "window_size": window_size,
                    "recent_failures": shared_failures[:6],
                }

        repeated_threshold = max(1, int(options.stall_repeat_selection_threshold or 1))
        repeated_selection_count = max(int(item.get("repeated_selection_count", 0) or 0) for item in window)
        if repeated_selection_count >= repeated_threshold:
            return {
                "reason": "repeated_selection_stagnation",
                "round_number": round_number,
                "current_phase": current_phase,
                "window_size": window_size,
                "repeated_selection_count": repeated_selection_count,
            }

        if window_size <= 2:
            return {
                "reason": "stalled_window",
                "round_number": round_number,
                "current_phase": current_phase,
                "window_size": window_size,
            }

        empty_decisions = all(not list(item.get("decision_tool_ids", []) or []) for item in window)
        if empty_decisions:
            return {
                "reason": "stalled_window",
                "round_number": round_number,
                "current_phase": current_phase,
                "window_size": window_size,
            }
        return None

    @classmethod
    def _round_repeated_selection_count(
        cls,
        *,
        recent_rounds: Sequence[Dict[str, Any]],
        tool_ids: Sequence[str],
        family_ids: Sequence[str],
        duplicate_filtered_count: int = 0,
        suppressed_filtered_count: int = 0,
    ) -> int:
        prior_tool_ids: Set[str] = set()
        prior_family_ids: Set[str] = set()
        for item in list(recent_rounds or [])[-4:]:
            if not isinstance(item, dict):
                continue
            prior_tool_ids.update(
                {
                    cls._normalize_text_token(entry)
                    for entry in list(item.get("decision_tool_ids", []) or [])
                    if cls._normalize_text_token(entry)
                }
            )
            prior_family_ids.update(
                {
                    cls._normalize_text_token(entry)
                    for entry in list(item.get("decision_family_ids", []) or [])
                    if cls._normalize_text_token(entry)
                }
            )
        repeated = int(duplicate_filtered_count or 0) + int(suppressed_filtered_count or 0)
        repeated += sum(1 for item in list(tool_ids or []) if cls._normalize_text_token(item) in prior_tool_ids)
        repeated += sum(1 for item in list(family_ids or []) if cls._normalize_text_token(item) in prior_family_ids)
        return max(0, repeated)

    @classmethod
    def _build_round_snapshot(
        cls,
        *,
        round_number: int,
        context: Optional[Dict[str, Any]],
        provider_payload: Optional[Dict[str, Any]],
        decision_tool_ids: Sequence[str],
        decision_family_ids: Sequence[str],
        duplicate_filtered_count: int = 0,
        suppressed_filtered_count: int = 0,
        recent_rounds: Optional[Sequence[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        payload = provider_payload if isinstance(provider_payload, dict) else {}
        tool_ids = [
            cls._normalize_text_token(item) for item in list(decision_tool_ids or []) if cls._normalize_text_token(item)
        ]
        family_ids = [
            cls._normalize_text_token(item)
            for item in list(decision_family_ids or [])
            if cls._normalize_text_token(item)
        ]
        snapshot = {
            "round": int(round_number or 0),
            "coverage_missing": cls._context_coverage_missing(context),
            "findings_count": len(list(payload.get("findings", []) or [])),
            "manual_tests_count": len(list(payload.get("manual_tests", []) or [])),
            "technologies_count": len(list(payload.get("technologies", []) or [])),
            "next_phase": str(payload.get("next_phase", "") or "")[:64],
            "observed_phase": cls._context_current_phase(context),
            "recent_failures": cls._context_recent_failures(context),
            "decision_tool_ids": tool_ids[:16],
            "decision_family_ids": family_ids[:16],
            "signal_key": cls._context_signal_key(context),
            "repeated_selection_count": cls._round_repeated_selection_count(
                recent_rounds=recent_rounds or [],
                tool_ids=tool_ids,
                family_ids=family_ids,
                duplicate_filtered_count=duplicate_filtered_count,
                suppressed_filtered_count=suppressed_filtered_count,
            ),
        }
        return snapshot

    @staticmethod
    def _round_progress_score(previous_round: Optional[Dict[str, Any]], current_round: Optional[Dict[str, Any]]) -> int:
        if not isinstance(previous_round, dict) or not isinstance(current_round, dict):
            return 0

        score = 0
        previous_missing = set(previous_round.get("coverage_missing", []) or [])
        current_missing = set(current_round.get("coverage_missing", []) or [])
        if current_missing != previous_missing:
            if len(current_missing) < len(previous_missing):
                score += 2
            else:
                score += 1

        for key, weight in (
            ("findings_count", 2),
            ("manual_tests_count", 1),
            ("technologies_count", 1),
        ):
            try:
                previous_value = int(previous_round.get(key, 0) or 0)
                current_value = int(current_round.get(key, 0) or 0)
            except (TypeError, ValueError):
                continue
            if current_value > previous_value:
                score += weight

        previous_phase = str(previous_round.get("next_phase", "") or "").strip().lower()
        current_phase = str(current_round.get("next_phase", "") or "").strip().lower()
        if current_phase and current_phase != previous_phase:
            score += 1
        return score

    @classmethod
    def _should_trigger_reflection(
        cls,
        recent_rounds: Sequence[Dict[str, Any]],
        options: SchedulerRunOptions,
        reflections_used: int,
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        return bool(
            cls._reflection_trigger(
                recent_rounds=recent_rounds,
                options=options,
                reflections_used=reflections_used,
                context=context,
            )
        )
