from __future__ import annotations

from app.contracts.base import ActionData

from dataclasses import dataclass
from typing import Any

from app.core.contract_values import as_bool, clamp_int


@dataclass(frozen=True)
class ProcessOutputQuery(ActionData):
    offset: int
    max_chars: int

    @classmethod
    def from_args(cls, args: Any) -> "ProcessOutputQuery":
        return cls(
            offset=clamp_int(args.get("offset", 0), 0, 0, 10**9),
            max_chars=clamp_int(args.get("max_chars", 12000), 12000, 1, 50000),
        )


@dataclass(frozen=True)
class ProcessRetryRequest(ActionData):
    timeout: int

    @classmethod
    def from_payload(cls, payload: Any) -> "ProcessRetryRequest":
        source = payload if isinstance(payload, dict) else {}
        timeout_value = source.get("timeout", 300)
        try:
            timeout = int(timeout_value or 300)
        except (TypeError, ValueError):
            raise ValueError("timeout must be an integer.")
        return cls(timeout=timeout)


@dataclass(frozen=True)
class ProcessClearRequest(ActionData):
    reset_all: bool

    @classmethod
    def from_payload(cls, payload: Any) -> "ProcessClearRequest":
        source = payload if isinstance(payload, dict) else {}
        return cls(reset_all=as_bool(source.get("reset_all", False), default=False))
