"""Action submission and scan-history responses."""

from app.contracts.base import ActionData
from dataclasses import dataclass
from typing import Any, Dict, List, Mapping


def _mapping_payload(value: Any, field_name: str) -> Dict[str, Any]:
    if not isinstance(value, Mapping):
        raise ValueError(f"{field_name} must be an object.")
    return dict(value)


def _list_payload(value: Any, field_name: str) -> List[Any]:
    if not isinstance(value, list):
        raise ValueError(f"{field_name} must be a list.")
    return list(value)


@dataclass(frozen=True)
class AcceptedJobResponse(ActionData):
    job: Dict[str, Any]

    @classmethod
    def from_job(cls, job: Any) -> "AcceptedJobResponse":
        return cls(job=_mapping_payload(job, "job"))

    def to_dict(self) -> Dict[str, Any]:
        return {"status": "accepted", "job": dict(self.job)}


@dataclass(frozen=True)
class ScanHistoryResponse(ActionData):
    scans: List[Any]

    @classmethod
    def from_scans(cls, scans: Any) -> "ScanHistoryResponse":
        return cls(scans=_list_payload(scans, "scans"))

    def to_dict(self) -> Dict[str, Any]:
        return {"scans": list(self.scans)}
