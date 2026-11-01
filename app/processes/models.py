"""Typed command/result contracts; only the web compatibility adapter produces tuples."""

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass(frozen=True)
class ExecutionPorts:
    repository: Callable
    registry: Any
    jobs: Any
    collect_command_artifacts: Callable
    emit_ui_invalidation: Callable
    process_progress_adapter_for_command: Callable
    process_tree_activity_changed: Callable
    register_job_process: Callable
    resolve_process_timeout_policy: Callable
    sample_process_tree_activity: Callable
    signal_process_tree: Callable
    unregister_job_process: Callable
    update_process_progress: Callable
    write_process_output_partial: Callable
    network_guard: Any = None
    record_network_context: Any = None
    ownership: Any = None


@dataclass
class ExecutionState:
    activity_sample_due_at: float = 0.0
    elapsed_due_at: float = 0.0
    flush_due_at: float = 0.0
    hard_timeout_seconds: int = 0
    inactivity_timeout_seconds: int = 0
    killed: bool = False
    last_activity_at: float = 0.0
    last_output_at: float = 0.0
    last_process_activity: Any = None
    output_parts: list[str] = field(default_factory=list)
    output_queue: Any = None
    proc: Any = None
    process_exited_at: float | None = None
    process_id: int = 0
    process_repo: Any = None
    progress_state: dict = field(default_factory=dict)
    quiet_long_running: bool = False
    reader_done: Any = None
    resolved_job_id: int = 0
    start_time: str = ""
    started_at: float = 0.0
    timed_out: bool = False
    timeout_reason: str = ""
