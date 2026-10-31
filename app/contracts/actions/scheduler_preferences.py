from __future__ import annotations

from app.contracts.base import ActionData

from dataclasses import dataclass
from typing import Any, Dict, Optional

from app.core.contract_values import as_bool, clamp_int

SCHEDULER_PREFERENCE_ALLOWED_FIELDS = {
    "mode",
    "goal_profile",
    "engagement_policy",
    "feature_flags",
    "max_concurrency",
    "max_host_concurrency",
    "max_jobs",
    "device_categories",
    "dangerous_categories",
}


@dataclass(frozen=True)
class SchedulerPreferencesPatch(ActionData):
    updates: Dict[str, Any]

    @classmethod
    def from_payload(cls, payload: Any) -> "SchedulerPreferencesPatch":
        source = payload if isinstance(payload, dict) else {}
        return cls({key: value for key, value in source.items() if key in SCHEDULER_PREFERENCE_ALLOWED_FIELDS})
