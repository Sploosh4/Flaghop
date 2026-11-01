"""Processes operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from app.web import runtime_processes as web_runtime_processes


class ProcessesRuntime:
    _register_job_process = web_runtime_processes.register_job_process

    _unregister_job_process = web_runtime_processes.unregister_job_process

    _job_active_process_ids = web_runtime_processes.job_active_process_ids

    start_process_retry_job = web_runtime_processes.start_process_retry_job

    retry_process = web_runtime_processes.retry_process

    _build_process_retry_plan = web_runtime_processes.build_process_retry_plan

    _split_process_retry_targets = staticmethod(web_runtime_processes.split_process_retry_targets)

    _signal_process_tree = staticmethod(web_runtime_processes.signal_process_tree)

    kill_process = web_runtime_processes.kill_process

    clear_processes = web_runtime_processes.clear_processes

    close_process = web_runtime_processes.close_process

    get_process_output = web_runtime_processes.get_process_output

    list_jobs = web_runtime_processes.list_jobs

    get_job = web_runtime_processes.get_job

    stop_job = web_runtime_processes.stop_job

    _tool_execution_profile = web_runtime_processes.tool_execution_profile

    _resolve_process_timeout_policy = web_runtime_processes.resolve_process_timeout_policy

    _sample_process_tree_activity = staticmethod(web_runtime_processes.sample_process_tree_activity)

    _process_tree_activity_changed = staticmethod(web_runtime_processes.process_tree_activity_changed)

    _coerce_float = staticmethod(web_runtime_processes.coerce_float)

    _format_duration_label = staticmethod(web_runtime_processes.format_duration_label)

    _redact_command_secrets = staticmethod(web_runtime_processes.redact_command_secrets)

    _normalize_progress_source_label = staticmethod(web_runtime_processes.normalize_progress_source_label)

    _build_process_progress_payload = staticmethod(web_runtime_processes.build_process_progress_payload)

    _processes = web_runtime_processes.list_processes

    @staticmethod
    def _process_history_records(project, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        return web_runtime_processes.process_history_records(
            project,
            limit=limit,
            redact_command=web_runtime_processes.redact_command_secrets,
        )

    _normalize_process_timestamp_to_utc = staticmethod(web_runtime_processes.normalize_process_timestamp_to_utc)

    _process_timestamp_utc_candidates = staticmethod(web_runtime_processes.process_timestamp_utc_candidates)

    _normalize_process_time_range_to_utc = staticmethod(web_runtime_processes.normalize_process_time_range_to_utc)

    _ensure_process_tables = web_runtime_processes.ensure_process_tables

    _is_nmap_command = staticmethod(web_runtime_processes.is_nmap_command)

    _is_nuclei_command = staticmethod(web_runtime_processes.is_nuclei_command)

    _is_tshark_passive_capture_command = staticmethod(web_runtime_processes.is_tshark_passive_capture_command)

    _process_progress_adapter_for_command = classmethod(web_runtime_processes.process_progress_adapter_for_command)

    _estimate_remaining_from_percent = staticmethod(web_runtime_processes.estimate_remaining_from_percent)

    _extract_progress_line = staticmethod(web_runtime_processes.extract_progress_line)

    @classmethod
    def _extract_nmap_progress_message(cls, text: str) -> str:
        return web_runtime_processes.extract_nmap_progress_message(text)

    @classmethod
    def _extract_nuclei_progress_from_text(
        cls,
        text: str,
        runtime_seconds: float,
    ) -> Tuple[Optional[float], Optional[int], str]:
        return web_runtime_processes.extract_nuclei_progress_from_text(text, runtime_seconds)

    @classmethod
    def _extract_tshark_passive_progress(
        cls,
        command: str,
        runtime_seconds: float,
    ) -> Tuple[Optional[float], Optional[int], str]:
        return web_runtime_processes.extract_tshark_passive_progress(command, runtime_seconds)

    _update_process_progress = web_runtime_processes.update_process_progress

    _update_nmap_process_progress = web_runtime_processes.update_nmap_process_progress

    _extract_nmap_progress_from_text = staticmethod(web_runtime_processes.extract_nmap_progress_from_text)

    _parse_duration_seconds = staticmethod(web_runtime_processes.parse_duration_seconds)
