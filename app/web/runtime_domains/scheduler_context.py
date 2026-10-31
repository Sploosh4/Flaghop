"""Scheduler Context operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from app.web import runtime_scheduler as web_runtime_scheduler


class SchedulerContextRuntime:
    get_scheduler_rationale_feed = web_runtime_scheduler.get_scheduler_rationale_feed

    _scheduler_rationale_feed_locked = web_runtime_scheduler.scheduler_rationale_feed_locked

    def _build_scheduler_target_context(
        self,
        *,
        host_id: int,
        host_ip: str,
        port: str,
        protocol: str,
        service_name: str,
        goal_profile: str = "internal_asset_discovery",
        engagement_preset: str = "",
        attempted_tool_ids: set,
        attempted_family_ids: Optional[set] = None,
        attempted_command_signatures: Optional[set] = None,
        recent_output_chars: int,
        analysis_mode: str = "standard",
    ) -> Dict[str, Any]:
        return web_runtime_scheduler.build_scheduler_target_context(
            self,
            host_id=host_id,
            host_ip=host_ip,
            port=port,
            protocol=protocol,
            service_name=service_name,
            goal_profile=goal_profile,
            engagement_preset=engagement_preset,
            attempted_tool_ids=attempted_tool_ids,
            attempted_family_ids=attempted_family_ids,
            attempted_command_signatures=attempted_command_signatures,
            recent_output_chars=recent_output_chars,
            analysis_mode=analysis_mode,
        )

    _build_scheduler_context_summary = staticmethod(web_runtime_scheduler.build_scheduler_context_summary)

    _build_scheduler_coverage_summary = staticmethod(web_runtime_scheduler.build_scheduler_coverage_summary)

    _scheduler_banner_from_evidence = staticmethod(web_runtime_scheduler.scheduler_banner_from_evidence)

    _scheduler_service_banner_fallback = staticmethod(web_runtime_scheduler.scheduler_service_banner_fallback)

    _truncate_scheduler_text = staticmethod(web_runtime_scheduler.truncate_scheduler_text)

    _scheduler_output_lines = staticmethod(web_runtime_scheduler.scheduler_output_lines)

    _scheduler_line_signal_score = staticmethod(web_runtime_scheduler.scheduler_line_signal_score)

    @classmethod
    def _build_scheduler_excerpt(
        cls,
        value: Any,
        max_chars: int,
        *,
        multiline: bool,
        head_lines: int,
        signal_lines: int,
        tail_lines: int,
        max_line_chars: int,
    ) -> str:
        return web_runtime_scheduler.build_scheduler_excerpt(
            value,
            max_chars,
            multiline=multiline,
            head_lines=head_lines,
            signal_lines=signal_lines,
            tail_lines=tail_lines,
            max_line_chars=max_line_chars,
        )

    @classmethod
    def _build_scheduler_prompt_excerpt(cls, value: Any, max_chars: int) -> str:
        return web_runtime_scheduler.build_scheduler_prompt_excerpt(value, max_chars)

    @classmethod
    def _build_scheduler_analysis_excerpt(cls, value: Any, max_chars: int) -> str:
        return web_runtime_scheduler.build_scheduler_analysis_excerpt(value, max_chars)

    _scheduler_tool_alias_tokens = staticmethod(web_runtime_scheduler.scheduler_tool_alias_tokens)

    _extract_unavailable_tool_tokens = staticmethod(web_runtime_scheduler.extract_unavailable_tool_tokens)

    _extract_missing_nse_script_tokens = staticmethod(web_runtime_scheduler.extract_missing_nse_script_tokens)

    _looks_like_local_tool_dependency_failure = staticmethod(
        web_runtime_scheduler.looks_like_local_tool_dependency_failure
    )
