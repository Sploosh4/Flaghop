from __future__ import annotations
from app.contracts.actions.inputs import LegacyInt, PortText
from app.contracts.base import ActionData
from app.contracts.base import ActionRequest
from app.core.contract_values import clamp_int
from dataclasses import dataclass
from pydantic import Field, JsonValue
from typing import Any
from typing import Literal


@dataclass(frozen=True)
class WorkspaceToolsPageQuery(ActionData):
    service: str
    port: str
    protocol: str
    limit: int
    offset: int

    @classmethod
    def from_args(cls, args: Any) -> "WorkspaceToolsPageQuery":
        return cls(
            service=str(args.get("service", "") or "").strip(),
            port=str(args.get("port", "") or "").strip(),
            protocol=str(args.get("protocol", "") or "tcp").strip().lower() or "tcp",
            limit=clamp_int(args.get("limit", 300), 300, 1, 500),
            offset=clamp_int(args.get("offset", 0), 0, 0, 10**9),
        )


@dataclass(frozen=True)
class WorkspaceToolTargetsQuery(ActionData):
    service: str
    host_id: int
    limit: int

    @classmethod
    def from_args(cls, args: Any) -> "WorkspaceToolTargetsQuery":
        return cls(
            service=str(args.get("service", "") or "").strip(),
            host_id=clamp_int(args.get("host_id", 0), 0, 0, 10**9),
            limit=clamp_int(args.get("limit", 300), 300, 1, 5000),
        )


class ToolRunRequest(ActionRequest):
    host_ip: str = Field(min_length=1, max_length=253)
    port: PortText
    protocol: Literal["tcp", "udp"] = "tcp"
    tool_id: str = Field(min_length=1, max_length=256)
    parameters: dict[str, JsonValue] = Field(default_factory=dict)
    timeout: LegacyInt = Field(default=300, ge=1, le=86400)
