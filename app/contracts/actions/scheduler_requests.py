"""Scheduler action requests and history queries."""

from app.contracts.base import ActionData
from app.contracts.base import ActionRequest
from app.core.contract_values import as_bool, clamp_int
from dataclasses import dataclass
from pydantic import Field
from typing import Any, Optional


@dataclass(frozen=True)
class SchedulerLogQuery(ActionData):
    limit: int

    @classmethod
    def from_args(cls, args) -> "SchedulerLogQuery":
        return cls(limit=clamp_int(args.get("limit"), 300, 1, 1000))


@dataclass(frozen=True)
class SchedulerDecisionQuery(ActionData):
    limit: int

    @classmethod
    def from_args(cls, args) -> "SchedulerDecisionQuery":
        return cls(limit=clamp_int(args.get("limit"), 100, 1, 500))


@dataclass(frozen=True)
class SchedulerPlanPreviewQuery(ActionData):
    host_id: int
    host_ip: str
    service: str
    port: str
    protocol: str
    mode: str
    limit_targets: int
    limit_actions: int

    @classmethod
    def from_args(cls, args) -> "SchedulerPlanPreviewQuery":
        return cls(
            host_id=clamp_int(args.get("host_id"), 0, 0, 2**31 - 1),
            host_ip=str(args.get("host_ip", "") or ""),
            service=str(args.get("service", "") or ""),
            port=str(args.get("port", "") or ""),
            protocol=str(args.get("protocol", "tcp") or "tcp"),
            mode=str(args.get("mode", "compare") or "compare"),
            limit_targets=clamp_int(args.get("limit_targets"), 20, 1, 200),
            limit_actions=clamp_int(args.get("limit_actions"), 6, 1, 50),
        )


@dataclass(frozen=True)
class SchedulerApprovalListQuery(ActionData):
    status: Optional[str]
    limit: int

    @classmethod
    def from_args(cls, args) -> "SchedulerApprovalListQuery":
        status = str(args.get("status", "") or "").strip().lower() or None
        return cls(status=status, limit=clamp_int(args.get("limit"), 200, 1, 1000))


@dataclass(frozen=True)
class SchedulerApprovalRequest(ActionData):
    approve_family: bool
    run_now: bool
    family_action: str

    @classmethod
    def from_payload(cls, payload: Any) -> "SchedulerApprovalRequest":
        source = payload if isinstance(payload, dict) else {}
        family_action = str(source.get("family_action", "") or "").strip().lower()
        return cls(
            approve_family=as_bool(source.get("approve_family", False), default=False),
            run_now=as_bool(source.get("run_now", True), default=True),
            family_action=family_action,
        )


@dataclass(frozen=True)
class SchedulerRejectionRequest(ActionData):
    reason: str
    family_action: str

    @classmethod
    def from_payload(cls, payload: Any) -> "SchedulerRejectionRequest":
        source = payload if isinstance(payload, dict) else {}
        return cls(
            reason=str(source.get("reason", "rejected via web") or "rejected via web"),
            family_action=str(source.get("family_action", "") or "").strip().lower(),
        )


class SchedulerFamilyApprovalRequest(ActionRequest):
    family_id: str = Field(min_length=1, max_length=512)
    tool_id: str = Field(default="", max_length=512)
    label: str = Field(default="", max_length=1000)
    danger_categories: list[str] = Field(default_factory=list, max_length=1000)

    @property
    def metadata(self):
        return self.model_dump(exclude={"family_id"})


@dataclass(frozen=True)
class SchedulerExecutionQuery(ActionData):
    limit: int
    host_id: int
    host_ip: str
    tool_id: str
    include_output: bool

    @classmethod
    def from_args(cls, args) -> "SchedulerExecutionQuery":
        return cls(
            limit=clamp_int(args.get("limit"), 200, 1, 1000),
            host_id=clamp_int(args.get("host_id"), 0, 0, 2**31 - 1),
            host_ip=str(args.get("host_ip", "") or ""),
            tool_id=str(args.get("tool_id", "") or ""),
            include_output=as_bool(args.get("include_output", False), default=False),
        )


@dataclass(frozen=True)
class SchedulerExecutionTraceQuery(ActionData):
    max_chars: int

    @classmethod
    def from_args(cls, args) -> "SchedulerExecutionTraceQuery":
        return cls(max_chars=clamp_int(args.get("max_chars"), 4000, 200, 50000))
