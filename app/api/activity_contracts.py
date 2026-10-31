"""Activity wire contracts retain historical SQLite fields and extension metadata."""

from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, JsonValue
from app.api.contracts import ExtensibleModel, Job, Project, Snapshot

TargetPort = str | int | None
Text = str | None


class Process(ExtensibleModel):
    id: int
    name: Text = ""
    hostIp: Text = ""
    port: TargetPort = ""
    protocol: Text = ""
    status: Text = ""
    percent: str | float | None = ""
    estimatedRemaining: float | str | None = None


class ProcessList(BaseModel):
    processes: list[Process]


class ProcessProgress(ExtensibleModel):
    summary: str = ""
    source: str = ""
    updated_at: str = ""


class ProcessOutput(Process):
    command: Text = ""
    output: str = ""
    output_chunk: str
    output_length: int
    offset: int
    next_offset: int
    completed: bool
    progress: ProcessProgress = Field(default_factory=ProcessProgress)
    network_context: dict[str, JsonValue] = Field(default_factory=dict)


class ActivityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RetryProcess(ActivityRequest):
    timeout: Annotated[int, Field(strict=True, ge=1)] = 300


class ClearProcesses(ActivityRequest):
    reset_all: Annotated[bool, Field(strict=True)] = False


class ProcessAction(ExtensibleModel):
    status: Literal["ok"] = "ok"
    process_id: int


class ClearedProcesses(ExtensibleModel):
    status: Literal["ok"] = "ok"
    cleared: bool
    reset_all: bool


class RetriedProcess(BaseModel):
    status: Literal["accepted"]
    job: Job


class Target(ExtensibleModel):
    host_ip: Text = ""
    port: TargetPort = ""
    protocol: Text = ""


class Decision(Target):
    id: int
    timestamp: Text = ""
    tool_id: Text = ""
    label: Text = ""
    scheduler_mode: Text = ""
    approved: str | bool | None = ""
    executed: str | bool | None = ""
    reason: Text = ""
    command_family_id: Text = ""


class DecisionList(BaseModel):
    decisions: list[Decision]


class Rationale(Target):
    timestamp: Text = ""
    headline: str = ""
    kind: str = ""
    tags: list[str] = Field(default_factory=list)
    summary: str = ""
    details: list[str] = Field(default_factory=list)


class Overview(ExtensibleModel):
    project: Project
    summary: dict[str, JsonValue]
    scheduler: dict[str, JsonValue]
    scheduler_rationale_feed: list[Rationale] = Field(default_factory=list)


class Approval(Target):
    id: int
    status: Text = ""
    label: Text = ""
    tool_id: Text = ""
    command_template: Text = ""
    risk_tags: Text = ""
    danger_categories: Text = ""
    policy_decision: Text = ""
    risk_summary: Text = ""
    policy_reason: Text = ""
    safer_alternative: Text = ""
    family_policy_state: Text = ""
    rationale: Text = ""
    evidence_refs: Text = ""


class ApprovalList(BaseModel):
    approvals: list[Approval]


class ApproveApproval(ActivityRequest):
    approve_family: Annotated[bool, Field(strict=True)] = False
    run_now: Annotated[bool, Field(strict=True)] = True
    family_action: Literal["", "allowed", "approval_required"] = ""


class RejectApproval(ActivityRequest):
    reason: Annotated[str, Field(strict=True, max_length=4000)] = "rejected via web"
    family_action: Literal["", "approval_required", "suppressed", "blocked"] = ""


class ApprovalResponse(ExtensibleModel):
    status: Literal["ok"] = "ok"
    approval: Approval
    job: Job | None = None


class Scan(ExtensibleModel):
    id: int
    submission_kind: Text = ""
    status: Text = ""
    target_summary: Text = ""
    scope_summary: Text = ""
    scan_mode: Text = ""
    created_at: Text = ""
    result_summary: Text = ""


class ScanList(BaseModel):
    scans: list[Scan]


class ActivitySnapshot(Snapshot):
    processes: list[Process] = Field(default_factory=list)
    scheduler_decisions: list[Decision] = Field(default_factory=list)
    scheduler_approvals: list[Approval] = Field(default_factory=list)
    scheduler_rationale_feed: list[Rationale] = Field(default_factory=list)
    scan_history: list[Scan] = Field(default_factory=list)
