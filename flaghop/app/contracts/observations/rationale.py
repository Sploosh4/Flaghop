"""Recorded scheduler rationale observations."""

from pydantic import ConfigDict, Field
from app.contracts.base import ObservationModel


class Rationale(ObservationModel):
    model_config = ConfigDict(extra="allow")
    host_ip: str | None = ""
    port: str | int | None = ""
    protocol: str | None = ""
    timestamp: str | None = ""
    headline: str = ""
    kind: str = ""
    tags: list[str] = Field(default_factory=list)
    summary: str = ""
    details: list[str] = Field(default_factory=list)
