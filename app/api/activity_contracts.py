"""Activity wire contracts retain historical SQLite fields and extension metadata."""

from app.contracts.actions.activity import Process, Decision, Approval, Scan
from app.contracts.observations.rationale import Rationale


from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, JsonValue
from app.contracts.base import ExtensibleModel
from app.contracts.actions.job_api import Job
from app.api.contracts import Project, Snapshot

TargetPort = str | int | None
Text = str | None


class Overview(ExtensibleModel):
    project: Project
    summary: dict[str, JsonValue]
    scheduler: dict[str, JsonValue]
    scheduler_rationale_feed: list[Rationale] = Field(default_factory=list)


class ActivitySnapshot(Snapshot):
    processes: list[Process] = Field(default_factory=list)
    scheduler_decisions: list[Decision] = Field(default_factory=list)
    scheduler_approvals: list[Approval] = Field(default_factory=list)
    scheduler_rationale_feed: list[Rationale] = Field(default_factory=list)
    scan_history: list[Scan] = Field(default_factory=list)
