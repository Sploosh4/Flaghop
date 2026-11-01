"""Protected execution identities are local authority, never imported history."""

from typing import Literal
from pydantic import ConfigDict, Field
from app.contracts.base import ActionModel
from app.contracts.artifacts.scanner import ContentIdentity


class ExecutionJournalRecord(ActionModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    id: str = Field(pattern=r"^[a-f0-9]{32}$")
    token: str = Field(pattern=r"^[a-f0-9]{64}$")
    uid: int = Field(ge=0)
    owner_pid: int = Field(ge=1)
    owner_stamp: str
    project_id: str = ""
    project_path: str
    run_id: str = ""
    run_published: bool = False
    directory: str = ""
    host_id: int = Field(default=0, ge=0)
    target_ip: str = ""
    scratch: str = ""
    source_identity: dict[str, ContentIdentity] = Field(default_factory=dict)
    profile_sha256: str = ""
    process_id: int = Field(default=0, ge=0)
    job_id: int = Field(default=0, ge=0)
    pid: int = Field(default=0, ge=0)
    pid_stamp: str = ""
    pgid: int = Field(default=0, ge=0)
    gid: int = Field(default=0, ge=0)
    table: str = ""
    hosts_folder: str = ""
    phase: Literal["prepared", "guard_preparing", "running", "cleanup_required", "cleaned", "settled"] = "prepared"
    reason: str = ""


class ExecutionRecoveryItem(ActionModel):
    execution_id: str
    project_id: str = ""
    run_id: str = ""
    phase: str
    reason: str


class ExecutionRecoveryReport(ActionModel):
    pending: list[ExecutionRecoveryItem] = Field(default_factory=list)
    recovered: list[str] = Field(default_factory=list)
    held: list[ExecutionRecoveryItem] = Field(default_factory=list)
