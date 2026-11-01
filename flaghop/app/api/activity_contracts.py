"""Activity wire contracts retain historical SQLite fields and extension metadata."""

from app.api.contracts import Project, Snapshot
from app.contracts.actions.activity import Approval, Decision, Process, Scan
from app.contracts.base import ExtensibleModel
from app.contracts.observations.rationale import Rationale
from pydantic import Field, JsonValue

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
