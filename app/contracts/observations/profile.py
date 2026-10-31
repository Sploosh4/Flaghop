"""Scanner profile envelope and source target."""

from app.contracts.actions.profile_run import Run

from typing import Literal
from pydantic import ConfigDict, Field
from app.contracts.base import ObservationModel
from app.contracts.actions.scanner_facts import TaskFacts
from app.contracts.observations.scanner import CandidateFinding, VerifiedFinding, ScannerObservation
from app.contracts.artifacts.scanner import Artifact


class ProfileTarget(ObservationModel):
    model_config = ConfigDict(extra="allow")
    ip: str
    scope: Literal["single_ip"]
    dns_resolver: str | None = None


class Profile(ObservationModel):
    model_config = ConfigDict(extra="allow")
    schema_version: Literal["1.0"]
    target: ProfileTarget
    run: Run
    tasks: list[TaskFacts] = Field(max_length=1000)
    observations: list[ScannerObservation] = Field(default_factory=list, max_length=1000)
    assessment_findings: list[CandidateFinding] = Field(default_factory=list, max_length=1000)
    validated_vulnerabilities: list[VerifiedFinding] = Field(default_factory=list, max_length=1000)
    artifacts: list[Artifact] = Field(max_length=248)
    classification: dict | None = None
    nmap: dict | None = None
