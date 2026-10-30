"""SchedulerPlanner: web followup."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from app.scheduler.models import PlanStep

logger = logging.getLogger(__name__)
ScheduledAction = PlanStep


class WebFollowup:
    @classmethod
    def _should_run_web_followup_sidecar(
        cls,
        service_name: str,
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        if not cls._is_web_service(service_name) or not isinstance(context, dict):
            return False

        coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        analysis_mode = (
            str(coverage.get("analysis_mode", "") or context.get("analysis_mode", "") or "standard").strip().lower()
        )
        signals = context.get("signals", {}) if isinstance(context.get("signals", {}), dict) else {}
        host_cves = context.get("host_cves", []) if isinstance(context.get("host_cves", []), list) else []
        summary = context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        reflection = (
            summary.get("reflection_posture", {}) if isinstance(summary.get("reflection_posture", {}), dict) else {}
        )
        reflection_priority = str(reflection.get("priority_shift", "") or "").strip().lower()
        reflection_promotes = cls._normalize_tool_id_set(reflection.get("promote_tool_ids", []))

        return (
            bool(
                coverage_missing
                & {
                    "missing_whatweb",
                    "missing_nikto",
                    "missing_web_content_discovery",
                    "missing_followup_after_vuln",
                    "missing_http_followup",
                    "missing_cpe_cve_enrichment",
                }
            )
            or analysis_mode == "dig_deeper"
            or int(signals.get("vuln_hits", 0) or 0) > 0
            or bool(host_cves)
            or reflection_priority in {"targeted_followup", "manual_validation"}
            or bool(reflection_promotes)
        )

    @classmethod
    def _web_followup_sidecar_candidates(
        cls,
        candidates: List[Dict[str, Any]],
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not candidates:
            return []

        signals = (
            context.get("signals", {})
            if isinstance(context, dict) and isinstance(context.get("signals", {}), dict)
            else {}
        )
        suppressed_tools = cls._context_suppressed_tool_ids(context)
        selected = []
        seen = set()
        for candidate in candidates:
            tool_id = str(candidate.get("tool_id", "") or "").strip()
            tool_norm = cls._normalized_tool_id(tool_id)
            if (
                not tool_norm
                or tool_norm in seen
                or tool_norm in suppressed_tools
                or cls._covered_web_followup_tool_already_satisfied(tool_id=tool_id, context=context)
            ):
                continue
            tool_text = " ".join(
                [
                    tool_id,
                    str(candidate.get("label", "") or ""),
                    str(candidate.get("command_template", "") or ""),
                ]
            ).lower()

            include = tool_norm in cls.WEB_AI_SPECIALIST_FOLLOWUP_TOOL_IDS or cls._matches_any_token(
                tool_text,
                (
                    "whatweb",
                    "nikto",
                    "web-content-discovery",
                    "dirsearch",
                    "ffuf",
                    "feroxbuster",
                    "gobuster",
                    "curl-headers",
                    "curl-options",
                    "curl-robots",
                    "wafw00f",
                    "wpscan",
                    "nuclei-cves",
                    "nuclei-exposures",
                    "nuclei-wordpress",
                ),
            )
            if not include:
                for rule in cls.SPECIALIZED_WEB_TOOL_RULES:
                    if not cls._matches_any_token(tool_text, rule.get("tokens", ())):
                        continue
                    if cls._has_any_signal(signals, rule.get("required_signals", ())):
                        include = True
                    break

            if not include:
                continue
            seen.add(tool_norm)
            selected.append(candidate)
            if len(selected) >= 10:
                break
        return selected

    @staticmethod
    def _merge_specialist_sidecar_payload(
        provider_payload: Optional[Dict[str, Any]],
        sidecar_payload: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        merged = dict(provider_payload or {})
        payload = dict(sidecar_payload or {})
        specialist_sidecars = list(merged.get("specialist_sidecars", []) or [])
        specialist_sidecars.append(payload)
        merged["specialist_sidecars"] = specialist_sidecars

        manual_tests = list(merged.get("manual_tests", []) or [])
        seen = {
            str(item.get("command", "") or "").strip().lower()
            for item in manual_tests
            if isinstance(item, dict) and str(item.get("command", "") or "").strip()
        }
        for item in list(payload.get("manual_tests", []) or []):
            if not isinstance(item, dict):
                continue
            key = str(item.get("command", "") or "").strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            manual_tests.append(item)
        merged["manual_tests"] = manual_tests
        return merged

    @staticmethod
    def _append_specialist_sidecar_context(
        rationale: str,
        *,
        tool_id: str,
        specialist_reason: str,
    ) -> str:
        if not specialist_reason:
            return rationale
        note = f"Web follow-up specialist favored {tool_id}: {specialist_reason}"
        if note in str(rationale or ""):
            return rationale
        if not rationale:
            return note
        return f"{rationale} {note}"

    @classmethod
    def _apply_web_ai_baseline(
        cls,
        service_name: str,
        decisions: List[PlanStep],
        context: Optional[Dict[str, Any]] = None,
        limit: int = 4,
    ) -> List[PlanStep]:
        if not cls._is_web_service(service_name):
            return decisions[:limit]

        required = list(cls.WEB_AI_BASELINE_TOOL_IDS)
        coverage = (
            context.get("coverage", {})
            if isinstance(context, dict) and isinstance(context.get("coverage", {}), dict)
            else {}
        )
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        signals = (
            context.get("signals", {})
            if isinstance(context, dict) and isinstance(context.get("signals", {}), dict)
            else {}
        )
        analysis_mode = (
            str(
                coverage.get("analysis_mode", "")
                or (context.get("analysis_mode", "") if isinstance(context, dict) else "")
                or "standard"
            )
            .strip()
            .lower()
        )
        host_cves = (
            context.get("host_cves", [])
            if isinstance(context, dict) and isinstance(context.get("host_cves", []), list)
            else []
        )
        vuln_hits = int(signals.get("vuln_hits", 0) or 0)
        needs_deep_web = (
            bool(
                coverage_missing
                & {
                    "missing_whatweb",
                    "missing_nikto",
                    "missing_web_content_discovery",
                    "missing_followup_after_vuln",
                }
            )
            or analysis_mode == "dig_deeper"
            or vuln_hits > 0
            or bool(host_cves)
        )
        needs_targeted_nuclei = (
            bool(
                coverage_missing
                & {
                    "missing_cpe_cve_enrichment",
                    "missing_followup_after_vuln",
                }
            )
            or analysis_mode == "dig_deeper"
            or vuln_hits > 0
            or bool(host_cves)
        )
        if needs_deep_web:
            required.extend(cls.WEB_AI_DEEP_WEB_TOOL_IDS)
        if needs_targeted_nuclei:
            required.extend(("nuclei-cves", "nuclei-exposures"))
        if bool(signals.get("wordpress_detected")):
            required.extend(("nuclei-wordpress", "wpscan"))
        selected = list(decisions[:limit])
        selected_ids = {item.tool_id for item in selected}

        by_tool = {item.tool_id: item for item in decisions}
        for tool_id in required:
            item = by_tool.get(tool_id)
            if item and tool_id not in selected_ids:
                selected.append(item)
                selected_ids.add(tool_id)

        while len(selected) > limit:
            removable = [item for item in selected if item.tool_id not in required]
            if not removable:
                break
            lowest = min(removable, key=lambda item: float(item.score))
            selected.remove(lowest)

        selected.sort(key=lambda item: item.score, reverse=True)
        return selected[:limit]

    @classmethod
    def _default_ai_limit(
        cls,
        service_name: str,
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> int:
        if not cls._is_web_service(service_name):
            return 4
        coverage = (
            context.get("coverage", {})
            if isinstance(context, dict) and isinstance(context.get("coverage", {}), dict)
            else {}
        )
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        signals = (
            context.get("signals", {})
            if isinstance(context, dict) and isinstance(context.get("signals", {}), dict)
            else {}
        )
        analysis_mode = (
            str(
                coverage.get("analysis_mode", "")
                or (context.get("analysis_mode", "") if isinstance(context, dict) else "")
                or "standard"
            )
            .strip()
            .lower()
        )
        host_cves = (
            context.get("host_cves", [])
            if isinstance(context, dict) and isinstance(context.get("host_cves", []), list)
            else []
        )
        if (
            analysis_mode == "dig_deeper"
            or bool(host_cves)
            or int(signals.get("vuln_hits", 0) or 0) > 0
            or bool(coverage_missing & {"missing_followup_after_vuln", "missing_cpe_cve_enrichment"})
        ):
            return 6
        return 4
