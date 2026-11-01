"""Scheduler runner input and output values."""

from app.contracts.base import ActionData
from dataclasses import dataclass, field
from typing import Any, Dict, List
from app.contracts.artifacts.references import ArtifactLocator


@dataclass(frozen=True)
class RunnerExecutionRequest(ActionData):
    decision: Any
    tool_id: str
    command_template: str
    host_ip: str = ""
    hostname: str = ""
    port: str = ""
    protocol: str = "tcp"
    service_name: str = ""
    timeout: int = 300
    job_id: int = 0
    approval_id: int = 0
    declared_runner_type: str = "local"


@dataclass
class RunnerExecutionResult(ActionData):
    executed: bool
    reason: str
    runner_type: str
    process_id: int = 0
    started_at: str = ""
    finished_at: str = ""
    stdout_ref: str = ""
    stderr_ref: str = ""
    artifact_refs: List[ArtifactLocator] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
