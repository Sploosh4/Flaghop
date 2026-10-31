"""Scanner observations keep candidates distinct from reproduced findings."""

from typing import Literal
from pydantic import ConfigDict, Field, JsonValue, field_validator
from app.contracts.base import ObservationModel
from app.core.contract_values import raw_reference
from app.contracts.actions.scanner_facts import TaskProblem
from app.contracts.artifacts.scanner import Artifact


class Facts(ObservationModel):
    model_config = ConfigDict(extra="allow")


class ServiceFacts(Facts):
    port: int | str
    protocol: str
    state: str
    fingerprint: dict[str, JsonValue] = Field(default_factory=dict)


class ScannerObservation(Facts):
    """Stable profiler fields with tool-specific extensions retained verbatim."""

    tool: str
    task_id: str | None = None
    port: int | str | None = None
    source: str | None = None

    @field_validator("source")
    @classmethod
    def source_reference(cls, value):
        return raw_reference(value)


class FindingFacts(Facts):
    title: str | None = None
    type: str | None = None


class CandidateFinding(FindingFacts):
    status: Literal["candidate"] = "candidate"


class ReproducedFinding(FindingFacts):
    status: Literal["reproduced"] = "reproduced"
    evidence: str | list[str] | None = None


class VerifiedFinding(ReproducedFinding):
    # Incoming profiles must explicitly claim reproduction and identify its
    # retained proof. Summary readers keep defaults for historical records.
    status: Literal["reproduced"]
    evidence: str | list[str]

    @field_validator("evidence")
    @classmethod
    def proof_references(cls, value):
        references = [value] if isinstance(value, str) else value
        if not references or len(references) > 64:
            raise ValueError("Reproduced finding requires bounded raw evidence references.")
        for reference in references:
            if not reference:
                raise ValueError("Reproduced finding requires a raw evidence reference.")
            raw_reference(reference)
        return value


class ScanSummary(Facts):
    profile_status: str = ""
    problems: list[TaskProblem] = Field(default_factory=list)
    classification: dict[str, JsonValue] = Field(default_factory=dict)
    services: list[ServiceFacts] = Field(default_factory=list)
    candidates: list[CandidateFinding] = Field(default_factory=list)
    reproduced: list[ReproducedFinding] = Field(default_factory=list)
    dependency_audit: str = ""
    artifacts: list[Artifact] = Field(default_factory=list)
