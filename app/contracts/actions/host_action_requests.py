from __future__ import annotations
from app.contracts.actions.inputs import LegacyInt, PortText
from app.contracts.base import ActionData
from app.contracts.base import ActionRequest
from app.core.contract_values import as_bool, clamp_int
from dataclasses import dataclass
from pydantic import Field
from typing import Any, List
from typing import Literal


class WorkspacePortMutationRequest(ActionRequest):
    host_id: LegacyInt = Field(ge=1)
    port: PortText
    protocol: Literal["tcp", "udp"] = "tcp"
    service: str = Field(default="", max_length=256)


class WorkspaceServiceMutationRequest(WorkspacePortMutationRequest):
    service: str = Field(min_length=1, max_length=256)


@dataclass(frozen=True)
class HostNoteRequest(ActionData):
    text_value: str

    @classmethod
    def from_payload(cls, payload: Any) -> "HostNoteRequest":
        source = payload if isinstance(payload, dict) else {}
        return cls(text_value=str(source.get("text", "") or ""))


@dataclass(frozen=True)
class HostCategoriesRequest(ActionData):
    manual_categories: List[Any]
    override_auto: bool

    @classmethod
    def from_payload(cls, payload: Any) -> "HostCategoriesRequest":
        source = payload if isinstance(payload, dict) else {}
        raw_categories = source.get("manual_categories", [])
        if raw_categories is None:
            raw_categories = []
        categories = list(raw_categories) if isinstance(raw_categories, list) else [raw_categories]
        return cls(
            manual_categories=categories,
            override_auto=as_bool(source.get("override_auto", False), default=False),
        )


@dataclass(frozen=True)
class ScriptCreateRequest(ActionData):
    script_id: str
    port: str
    protocol: str
    output: str

    @classmethod
    def from_payload(cls, payload: Any) -> "ScriptCreateRequest":
        source = payload if isinstance(payload, dict) else {}
        return cls(
            script_id=str(source.get("script_id", "") or "").strip(),
            port=str(source.get("port", "") or "").strip(),
            protocol=str(source.get("protocol", "tcp") or "tcp").strip().lower() or "tcp",
            output=str(source.get("output", "") or ""),
        )


@dataclass(frozen=True)
class ScriptOutputQuery(ActionData):
    offset: int
    max_chars: int

    @classmethod
    def from_args(cls, args: Any) -> "ScriptOutputQuery":
        return cls(
            offset=clamp_int(args.get("offset", 0), 0, 0, 10**9),
            max_chars=clamp_int(args.get("max_chars", 12000), 12000, 1, 50000),
        )
