"""Historical process control values carry provenance, never signalling authority."""

from pydantic import Field, JsonValue
from app.contracts.base import ObservationModel


class ProcessHistoryEvent(ObservationModel):
    reason: str = Field(max_length=1024)
    recorded_at: str = Field(max_length=128)
    owner_id: str = Field(default="", max_length=128)
    source_project: str = Field(default="", max_length=4096)


class ProcessHistoryOrigin(ObservationModel):
    original_controls: dict[str, JsonValue] = Field(max_length=6)
    events: list[ProcessHistoryEvent] = Field(min_length=1, max_length=32)


class ProcessHistoryView(ObservationModel):
    original_status: str
    original_pid: str
    reason: str
    recorded_at: str
    source_project: str = ""
