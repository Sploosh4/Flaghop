from typing import Any, Literal
from pydantic import BaseModel, Field


class ReaderWorker(BaseModel):
    available: bool
    heartbeat_at: float | None = None
    engines: list[str]


class ReaderAlert(BaseModel):
    id: str
    result_path: str
    size: int
    completed: float
    origins: list[dict[str, Any]]
    state: str
    label: str
    transformations: list[str]
    kind: Literal["cipher", "hash"] = "cipher"
    display_name: str = ""
    internal: bool = False
    history_reason: str = ""


class BackgroundStatus(BaseModel):
    project_id: str
    project: str
    running: bool
    requested_state: Literal["running", "paused"]
    control_configured: bool
    observed_state: Literal["unsupported"]
    worker_observation: Literal["unsupported"]
    worker: ReaderWorker
    alerts: list[ReaderAlert]
    history: list[ReaderAlert] = Field(default_factory=list)
    working: list[dict[str, str]]
    node_states: dict[str, int]
    hash_states: dict[str, int]
    reader_updated: str | None = None
    pause_semantics: str


class ReaderResult(BaseModel):
    status: Literal["ok"]
    data_b64: str
    truncated: bool
    size: int
    artifact: ReaderAlert
