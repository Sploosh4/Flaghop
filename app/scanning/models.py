"""Validated scanner facts; extension fields remain available to old profiles."""

from pathlib import PurePosixPath
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, JsonValue, field_validator

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


class Facts(BaseModel):
    model_config = ConfigDict(extra="allow")


class TaskProblem(Facts):
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
        if value and (
            not value.startswith("raw/") or ".." in PurePosixPath(value).parts or "\\" in value or "\x00" in value
        ):
            raise ValueError("Scanner task references evidence outside its raw output.")
        return value


class ServiceFacts(Facts):
    port: int | str
    protocol: str
    state: str
    fingerprint: dict[str, JsonValue] = Field(default_factory=dict)


class FindingFacts(Facts):
    title: str | None = None
    type: str | None = None


class CandidateFinding(FindingFacts):
    status: Literal["candidate"] = "candidate"


class ReproducedFinding(FindingFacts):
    status: Literal["reproduced"] = "reproduced"
    evidence: str | list[str] | None = None


class VerifiedFinding(ReproducedFinding):
    # Incoming profiles must explicitly claim reproduction and identify its
    # retained proof. Summary readers keep defaults for historical records.
    status: Literal["reproduced"]
    evidence: str | list[str]

    @field_validator("evidence")
    @classmethod
    def proof_references(cls, value):
        references = [value] if isinstance(value, str) else value
        if not references or len(references) > 64:
            raise ValueError("Reproduced finding requires bounded raw evidence references.")
        for reference in references:
            if not reference:
                raise ValueError("Reproduced finding requires a raw evidence reference.")
            TaskFacts.raw_reference(reference)
        return value


class ScanSummary(Facts):
    profile_status: str = ""
    problems: list[TaskProblem] = Field(default_factory=list)
    classification: dict[str, JsonValue] = Field(default_factory=dict)
    services: list[ServiceFacts] = Field(default_factory=list)
    candidates: list[CandidateFinding] = Field(default_factory=list)
    reproduced: list[ReproducedFinding] = Field(default_factory=list)
    dependency_audit: str = ""
    artifacts: list[dict[str, JsonValue]] = Field(default_factory=list)


class ImportProgress(BaseModel):
    status: Literal["running", "completed", "failed"]
    phase: Literal["inventory", "summary_database", "summary_file", "complete"]
    inventory_committed: bool = False
    summary_committed: bool = False
    inventory_may_be_partial: bool = False
    reason: str = ""
