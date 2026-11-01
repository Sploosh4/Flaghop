"""Deep scan wire contracts. API callers select targets, never commands or local paths."""

from app.core.contract_values import literal_ip

from app.contracts.base import ActionModel

from typing import Literal
from pydantic import ConfigDict, Field, field_validator
from app.contracts.observations.scanner import ScanSummary
from app.contracts.actions.scanner_facts import ImportProgress


class DeepScanRequest(ActionModel):
    model_config = ConfigDict(extra="forbid")
    host_id: int = Field(ge=1, strict=True)
    target_ip: str = Field(min_length=1, max_length=45, strict=True)
    expected_revision: int = Field(ge=0, strict=True)
    dns_resolver: str | None = Field(default=None, max_length=45)
    timeout: int = Field(default=1800, ge=1, le=3600, strict=True)

    @field_validator("target_ip", "dns_resolver")
    @classmethod
    def single_target(cls, value):
        return literal_ip(value) if value is not None else None


class ScanRecovery(ActionModel):
    policy: Literal["never-replay"] = "never-replay"
    state: Literal[
        "available",
        "no_profile",
        "copied",
        "cleaning",
        "importing",
        "cleanup_required",
        "cleaned",
        "failed",
        "complete",
    ] = "available"
    retry_available: bool = False
    previous_status: str = ""


class DeepScanRun(ActionModel):
    model_config = ConfigDict(extra="allow")
    id: str
    project_id: str
    host_id: int
    target_ip: str
    status: Literal[
        "queued", "running", "completed", "partial", "failed", "cancelled", "held", "planned", "interrupted"
    ]
    job_id: int = 0
    settling: bool = False
    summary_omitted: bool = False
    reason: str = ""
    profile_path: str = ""
    log_path: str = ""
    directory: str = ""
    import_progress: ImportProgress | None = None
    recovery: ScanRecovery | None = None
    summary: ScanSummary = Field(default_factory=ScanSummary)


class DeepScanList(ActionModel):
    runs: list[DeepScanRun]
