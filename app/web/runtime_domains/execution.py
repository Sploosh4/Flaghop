"""Execution operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_execution as web_runtime_execution


class ExecutionRuntime:
    _run_command_with_tracking = web_runtime_execution.run_command_with_tracking

    _write_process_output_partial = web_runtime_execution.write_process_output_partial

    _save_script_result_if_missing = web_runtime_execution.save_script_result_if_missing
