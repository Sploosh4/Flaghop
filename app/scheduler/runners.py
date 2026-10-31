"""Local command execution adapter and result types."""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Tuple


@dataclass(frozen=True)
class RunnerExecutionRequest:
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
class RunnerExecutionResult:
    executed: bool
    reason: str
    runner_type: str
    process_id: int = 0
    started_at: str = ""
    finished_at: str = ""
    stdout_ref: str = ""
    stderr_ref: str = ""
    artifact_refs: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class LocalRunner:
    runner_type = "local"

    def execute(
        self,
        request: RunnerExecutionRequest,
        *,
        build_command: Callable[[RunnerExecutionRequest], Tuple[str, str]],
        execute_command: Callable[..., RunnerExecutionResult],
    ) -> RunnerExecutionResult:
        command, outputfile = build_command(request)
        if not str(command or "").strip():
            return RunnerExecutionResult(
                executed=False,
                reason="skipped: no matching command template",
                runner_type=self.runner_type,
            )
        return execute_command(
            request=request,
            rendered_command=str(command),
            outputfile=str(outputfile or ""),
            runner_type=self.runner_type,
        )
