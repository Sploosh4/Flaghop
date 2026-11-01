"""Tool audit/install request values; OS detection belongs to the service."""

from app.contracts.base import ActionData
from app.contracts.base import ActionRequest
from dataclasses import dataclass
from pydantic import Field
from typing import Any, List
from typing import Literal


def _platform_input(value):
    platform = str(value or "").strip().lower()
    if platform and platform not in {"kali", "ubuntu"}:
        raise ValueError("Automatic installation supports Kali and Ubuntu only.")
    return platform


def _split_query_tokens(value: Any) -> List[str]:
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


@dataclass(frozen=True)
class ToolAuditPlanQuery(ActionData):
    platform: str
    scope: str
    tool_keys: List[str]

    @classmethod
    def from_args(cls, args: Any) -> "ToolAuditPlanQuery":
        return cls(
            platform=_platform_input(args.get("platform", "")),
            scope=str(args.get("scope", "missing") or "missing"),
            tool_keys=_split_query_tokens(args.get("tool_keys", "")),
        )


class ToolAuditInstallRequest(ActionRequest):
    platform: Literal["", "kali", "ubuntu"] = ""
    scope: Literal["missing", "all", "selected"] = "missing"
    tool_keys: list[str] = Field(default_factory=list, max_length=1000)
