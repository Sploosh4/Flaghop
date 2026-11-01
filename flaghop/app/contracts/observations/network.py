"""Observed routes and service responses, separate from configured scope."""

from typing import Literal
from pydantic import ConfigDict, Field, model_serializer
from app.contracts.base import ObservationModel


class RouteObservation(ObservationModel):
    model_config = ConfigDict(extra="allow")
    destination: str
    interface: str
    source: str | None = None
    gateway: str | None = None

    @model_serializer(mode="wrap")
    def serialize_present_fields(self, handler):
        return {name: value for name, value in handler(self).items() if name in self.model_fields_set}


class ServiceProbeObservation(ObservationModel):
    address: str
    port: int = Field(ge=1, le=65535, strict=True)
    outcome: str


class NetworkReport(ObservationModel):
    status: Literal["ready", "held", "no_response"]
    reason: str
    checked_at: str
    revision: int
    target: str = ""
    routes: list[RouteObservation] = Field(default_factory=list)
    services: list[ServiceProbeObservation] = Field(default_factory=list)
