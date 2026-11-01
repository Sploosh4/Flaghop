from app.contracts.artifacts.reader import ReaderAlert

from app.contracts.base import ActionModel
from typing import Literal
from pydantic import Field


class ReaderWorker(ActionModel):
    available: bool
    heartbeat_at: float | None = None
    engines: list[str]


class BackgroundStatus(ActionModel):
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


class ReaderResult(ActionModel):
    status: Literal["ok"]
    data_b64: str
    truncated: bool
    size: int
    artifact: ReaderAlert
