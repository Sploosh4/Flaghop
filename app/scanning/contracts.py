"""Deep scan wire contracts. API callers select targets, never commands or local paths."""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.scanning.profile import literal_ip
from app.scanning.models import ScanSummary, ImportProgress


class DeepScanRequest(BaseModel):
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


class DeepScanRun(BaseModel):
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
    summary: ScanSummary = Field(default_factory=ScanSummary)


class DeepScanList(BaseModel):
    runs: list[DeepScanRun]
