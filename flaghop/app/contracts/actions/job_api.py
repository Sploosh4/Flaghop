"""Validated job views."""

from pydantic import ConfigDict

from app.contracts.base import ActionModel
from typing import Literal
from pydantic import Field, JsonValue


class Job(ActionModel):
    model_config = ConfigDict(extra="allow")
    id: int
    type: str
    status: Literal["queued", "running", "completed", "partial", "failed", "cancelled", "held"]
    created_at: str = ""
    started_at: str | None = ""
    finished_at: str | None = ""
    error: str = ""
    settling: bool = False
    cancel_requested: bool = False
    cancel_reason: str = ""
    payload: dict[str, JsonValue] = Field(default_factory=dict)
    result: dict[str, JsonValue] = Field(default_factory=dict)


class JobList(ActionModel):
    jobs: list[Job]


class StopJobResponse(ActionModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["ok"] = "ok"
    stopped: bool
    job: Job
    killed_process_ids: list[int] = Field(default_factory=list)
    message: str = ""
