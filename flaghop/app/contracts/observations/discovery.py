"""Structured Nmap facts checked against the retained XML by the importer."""

from pydantic import ConfigDict, Field
from app.contracts.base import ObservationModel
from app.contracts.observations.scanner import ServiceFacts


class NmapServiceFacts(ServiceFacts):
    port: int = Field(ge=1, le=65535, strict=True)
    state_reason: str | None = None
    cpes: list[str | None] = Field(default_factory=list)
    scripts: list[dict[str, str | None]] = Field(default_factory=list)


class NmapOSClass(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    type: str | None = None
    vendor: str | None = None
    osfamily: str | None = None
    osgen: str | None = None
    accuracy: str | None = None
    cpes: list[str | None] = Field(default_factory=list)


class NmapOSCandidate(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    description: str | None = None
    nmap_match_accuracy: str | None = None
    classes: list[NmapOSClass] = Field(default_factory=list, max_length=1000)


class NmapFacts(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    services: list[NmapServiceFacts] = Field(max_length=65535)
    nmap_version: str | None = None
    recorded_arguments: str | None = None
    started_epoch: str | None = None
    finished_epoch: str | None = None
    host_status: dict[str, str] = Field(default_factory=dict)
    addresses: list[dict[str, str]] = Field(default_factory=list)
    hostnames: list[dict[str, str]] = Field(default_factory=list)
    scan_coverage: list[dict[str, str]] = Field(default_factory=list)
    other_port_states: list[dict[str, str]] = Field(default_factory=list)
    os_candidates: list[NmapOSCandidate] = Field(default_factory=list, max_length=1000)
    host_scripts: list[dict[str, str | None]] = Field(default_factory=list)
