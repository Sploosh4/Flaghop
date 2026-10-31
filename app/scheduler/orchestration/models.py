"""Shared scheduler run models and defaults."""

from dataclasses import dataclass, field
from typing import Any, Dict

ROOT_DOMAIN_SCOPED_TOOL_IDS = set()


@dataclass(frozen=True)
class SchedulerTarget:
    host_id: int = 0
    host_ip: str = ""
    hostname: str = ""
    port: str = ""
    protocol: str = "tcp"
    service_name: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SchedulerExecutionTask:
    decision: Any
    tool_id: str
    host_ip: str
    port: str
    protocol: str
    service_name: str
    command_template: str
    timeout: int
    job_id: int = 0
    host_id: int = 0
    hostname: str = ""
    approval_id: int = 0
    runner_preference: str = ""


@dataclass(frozen=True)
class SchedulerDecisionDisposition:
    action: str
    reason: str = ""
    approval_id: int = 0


@dataclass(frozen=True)
class SchedulerRunOptions:
    scheduler_mode: str = "deterministic"
    scheduler_concurrency: int = 1
    host_concurrency: int = 1
    dig_deeper: bool = False
    max_runtime_seconds: int = 0
    max_total_actions: int = 0
    task_timeout_seconds: int = 300
    job_id: int = 0
