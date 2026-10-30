from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class ProjectReportPushRequest:
    overrides: Dict[str, Any]

    @classmethod
    def from_payload(cls, payload: Any) -> "ProjectReportPushRequest":
        source = payload if isinstance(payload, dict) else {}
        overrides = source.get("project_report_delivery")
        if overrides is None and isinstance(source, dict):
            overrides = {
                key: value
                for key, value in source.items()
                if key in {"provider_name", "endpoint", "method", "format", "headers", "timeout_seconds", "mtls"}
            }
        if not isinstance(overrides, dict):
            overrides = {}
        return cls(overrides=overrides)
