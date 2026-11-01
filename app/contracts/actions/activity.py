"""Process, scheduler action, approval and scan history views."""

from app.contracts.base import ActionModel
from typing import Annotated, Literal
from pydantic import ConfigDict, Field, JsonValue
from app.contracts.actions.job_api import Job
from app.contracts.observations.process_history import ProcessHistoryView

TargetPort = str | int | None
Text = str | None


class Process(ActionModel):
    model_config = ConfigDict(extra="allow")
    id: int
    name: Text = ""
    hostIp: Text = ""
    port: TargetPort = ""
    protocol: Text = ""
    status: Text = ""
    percent: str | float | None = ""
    estimatedRemaining: float | str | None = None


class ProcessList(ActionModel):
    processes: list[Process]


class ProcessProgress(ActionModel):
    model_config = ConfigDict(extra="allow")
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
    history_origin: ProcessHistoryView | None = None


class ActivityRequest(ActionModel):
    model_config = ConfigDict(extra="forbid")


class RetryProcess(ActivityRequest):
    timeout: Annotated[int, Field(strict=True, ge=1)] = 300


class ClearProcesses(ActivityRequest):
    reset_all: Annotated[bool, Field(strict=True)] = False


class ProcessAction(ActionModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["ok"] = "ok"
    process_id: int


class ProcessKillResult(ProcessAction):
    killed: bool
    had_live_handle: bool = False
    cancel_requested: bool = False
    reason: str = ""


class ClearedProcesses(ActionModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["ok"] = "ok"
    cleared: bool
    reset_all: bool


class RetriedProcess(ActionModel):
    status: Literal["accepted"]
    job: Job


class Target(ActionModel):
    model_config = ConfigDict(extra="allow")
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


class DecisionList(ActionModel):
    decisions: list[Decision]


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


class ApprovalList(ActionModel):
    approvals: list[Approval]


class ApproveApproval(ActivityRequest):
    approve_family: Annotated[bool, Field(strict=True)] = False
    run_now: Annotated[bool, Field(strict=True)] = True
    family_action: Literal["", "allowed", "approval_required"] = ""


class RejectApproval(ActivityRequest):
    reason: Annotated[str, Field(strict=True, max_length=4000)] = "rejected via web"
    family_action: Literal["", "approval_required", "suppressed", "blocked"] = ""


class ApprovalResponse(ActionModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["ok"] = "ok"
    approval: Approval
    job: Job | None = None


class Scan(ActionModel):
    model_config = ConfigDict(extra="allow")
    id: int
    submission_kind: Text = ""
    status: Text = ""
    target_summary: Text = ""
    scope_summary: Text = ""
    scan_mode: Text = ""
    created_at: Text = ""
    result_summary: Text = ""


class ScanList(ActionModel):
    scans: list[Scan]
