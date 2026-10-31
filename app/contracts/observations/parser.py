"""Protocol parser output; parsing and evidence interpretation remain outside."""

from pydantic import Field
from app.contracts.base import ObservationModel
from app.contracts.observations.target import (
    TechnologyObservation,
    FindingObservation,
    FindingQualityObservation,
    UrlObservation,
)


class ParsedObservations(ObservationModel):
    technologies: list[TechnologyObservation] = Field(default_factory=list)
    findings: list[FindingObservation] = Field(default_factory=list)
    urls: list[UrlObservation] = Field(default_factory=list)
    discovered_hosts: list[str] = Field(default_factory=list)
    finding_quality_events: list[FindingQualityObservation] = Field(default_factory=list)
