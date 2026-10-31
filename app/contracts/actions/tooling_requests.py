"""Tool audit/install request values; OS detection belongs to the service."""

from dataclasses import dataclass
from typing import Any, List
from app.contracts.base import ActionData


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


@dataclass(frozen=True)
class ToolAuditInstallRequest(ActionData):
    platform: str
    scope: str
    tool_keys: List[str]

    @classmethod
    def from_payload(cls, payload: Any) -> "ToolAuditInstallRequest":
        source = payload if isinstance(payload, dict) else {}
        tool_keys = source.get("tool_keys", [])
        if tool_keys is None:
            tool_keys = []
        if not isinstance(tool_keys, list):
            raise ValueError("Field 'tool_keys' must be an array when provided.")
        return cls(
            platform=_platform_input(source.get("platform", "")),
            scope=str(source.get("scope", "missing") or "missing"),
            tool_keys=[str(item or "").strip() for item in tool_keys if str(item or "").strip()],
        )
