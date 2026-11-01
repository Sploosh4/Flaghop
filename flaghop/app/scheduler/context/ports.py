"""Dependencies used by scheduler context assembly, supplied by its application service."""

from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class ContextPorts:
    load_evidence: Callable
    infer_technologies_from_observations: Callable
    scheduler_tool_audit_snapshot: Callable
    load_host_observations: Callable
    persist_shared_target_state: Callable
    observation_text_for_analysis: Callable
    merge_technologies: Callable
    ai_confidence_value: Callable
