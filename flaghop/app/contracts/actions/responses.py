"""Action submission and scan-history responses."""

from app.contracts.base import ActionData
from app.contracts.base import ActionModel
from app.contracts.actions.job_api import Job
from typing import Literal
from pydantic import ValidationError
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


class AcceptedJobResponse(ActionModel):
    status: Literal["accepted"] = "accepted"
    job: Job

    @classmethod
    def from_job(cls, job: Any) -> "AcceptedJobResponse":
        try:
            return cls(status="accepted", job=_mapping_payload(job, "job"))
        except (ValidationError, ValueError) as exc:
            raise TypeError("Runtime returned an invalid job result.") from exc

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump(exclude_unset=True)


@dataclass(frozen=True)
class ScanHistoryResponse(ActionData):
    scans: List[Any]

    @classmethod
    def from_scans(cls, scans: Any) -> "ScanHistoryResponse":
        return cls(scans=_list_payload(scans, "scans"))

    def to_dict(self) -> Dict[str, Any]:
        return {"scans": list(self.scans)}
