"""Local command execution adapter and result types."""

from app.contracts.actions.runner import RunnerExecutionRequest, RunnerExecutionResult


from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Tuple


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
