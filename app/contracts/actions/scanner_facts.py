"""Scanner execution and import outcomes."""

from typing import Literal
from pydantic import ConfigDict, Field, field_validator
from app.contracts.base import ActionModel
from app.core.contract_values import raw_reference

TaskStatus = Literal[
    "completed",
    "failed",
    "timed_out",
    "output_limit",
    "tool_missing",
    "supplied",
    "skipped",
    "skipped_offline",
    "disabled",
    "planned",
]


class TaskProblem(ActionModel):
    model_config = ConfigDict(extra="allow")
    id: str = Field(min_length=1, max_length=256, strict=True)
    tool: str = Field(default="", max_length=256, strict=True)
    status: TaskStatus
    reason: str = ""
    parse_status: Literal["completed", "failed"] | None = None
    parse_error: str = ""


class TaskFacts(TaskProblem):
    command: list[str] = Field(default_factory=list, max_length=512)
    exit_code: int | None = Field(default=None, strict=True)
    duration_seconds: float | None = Field(default=None, ge=0)
    stdout: str | None = None
    stderr: str | None = None
    result_artifact: str | None = None

    @field_validator("stdout", "stderr", "result_artifact")
    @classmethod
    def raw_reference(cls, value):
        return raw_reference(value)


class ImportProgress(ActionModel):
    status: Literal["running", "completed", "failed"]
    phase: Literal["inventory", "summary_database", "summary_file", "complete"]
    inventory_committed: bool = False
    summary_committed: bool = False
    inventory_may_be_partial: bool = False
    reason: str = ""
