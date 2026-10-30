"""Scheduler State operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, List, Tuple
from app.web import runtime_scheduler_state as web_runtime_scheduler_state
from app.web import runtime_workspace as web_runtime_workspace


class SchedulerStateRuntime:
    _existing_attempt_summary_for_target = web_runtime_scheduler_state.existing_attempt_summary_for_target

    _existing_tool_attempts_for_target = web_runtime_scheduler_state.existing_tool_attempts_for_target

    _ai_confidence_value = staticmethod(web_runtime_scheduler_state.ai_confidence_value)

    _sanitize_ai_hostname = staticmethod(web_runtime_scheduler_state.sanitize_ai_hostname)

    _extract_cpe_tokens = staticmethod(web_runtime_scheduler_state.extract_cpe_tokens)

    _extract_version_token = staticmethod(web_runtime_scheduler_state.extract_version_token)

    _is_ipv4_like = staticmethod(web_runtime_scheduler_state.is_ipv4_like)

    _sanitize_technology_version = staticmethod(web_runtime_scheduler_state.sanitize_technology_version)

    _sanitize_technology_version_for_tech = staticmethod(
        web_runtime_scheduler_state.sanitize_technology_version_for_tech
    )

    @staticmethod
    def _technology_hint_source_text(source_id: Any, output_text: Any) -> str:
        return web_runtime_scheduler_state.technology_hint_source_text(
            source_id,
            output_text,
            strip_nmap_preamble_fn=web_runtime_workspace.strip_nmap_preamble,
        )

    @staticmethod
    def _observation_text_for_analysis(source_id: Any, output_text: Any) -> str:
        return web_runtime_scheduler_state.observation_text_for_analysis(
            source_id,
            output_text,
            strip_nmap_preamble_fn=web_runtime_workspace.strip_nmap_preamble,
        )

    @staticmethod
    def _cve_evidence_lines(source_id: Any, output_text: Any, limit: int = 24) -> List[Tuple[str, str]]:
        return web_runtime_scheduler_state.cve_evidence_lines(
            source_id,
            output_text,
            limit=limit,
            strip_nmap_preamble_fn=web_runtime_workspace.strip_nmap_preamble,
        )

    _extract_version_near_tokens = staticmethod(web_runtime_scheduler_state.extract_version_near_tokens)

    _normalize_cpe_token = staticmethod(web_runtime_scheduler_state.normalize_cpe_token)

    _cpe_base = staticmethod(web_runtime_scheduler_state.cpe_base)

    _is_weak_technology_name = staticmethod(web_runtime_scheduler_state.is_weak_technology_name)

    _technology_canonical_key = staticmethod(web_runtime_scheduler_state.technology_canonical_key)

    _technology_quality_score = staticmethod(web_runtime_scheduler_state.technology_quality_score)

    _name_from_cpe = staticmethod(web_runtime_scheduler_state.name_from_cpe)

    _version_from_cpe = staticmethod(web_runtime_scheduler_state.version_from_cpe)

    _guess_technology_hint = staticmethod(web_runtime_scheduler_state.guess_technology_hint)

    _guess_technology_hints = staticmethod(web_runtime_scheduler_state.guess_technology_hints)

    _severity_from_text = staticmethod(web_runtime_scheduler_state.severity_from_text)

    _finding_sort_key = staticmethod(web_runtime_scheduler_state.finding_sort_key)

    _normalize_command_signature_source = staticmethod(web_runtime_scheduler_state.normalize_command_signature_source)

    def _command_signature_for_target(self, command_text: str, protocol: str) -> str:
        return web_runtime_scheduler_state.command_signature_for_target(command_text, protocol)

    _target_attempt_matches = staticmethod(web_runtime_scheduler_state.target_attempt_matches)
