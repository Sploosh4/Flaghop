from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List

from app.web.http_utils import as_bool
from app.tooling import resolve_tool_install_platform


@dataclass(frozen=True)
class DisplaySettingsRequest:
    colorful_ascii_background: bool

    @classmethod
    def from_payload(cls, payload: Any) -> "DisplaySettingsRequest":
        source = payload if isinstance(payload, dict) else {}
        return cls(colorful_ascii_background=as_bool(source.get("colorful_ascii_background"), False))
