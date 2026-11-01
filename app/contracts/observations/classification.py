"""Typed role hypotheses, retaining scores as rule strength rather than probability."""

from typing import Literal
from pydantic import ConfigDict, Field
from app.contracts.base import ObservationModel

Confidence = Literal["unknown", "low", "medium", "high"]


class ClassificationEvidence(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    source: str
    path: str
    value: str
    channel: str


class ClassificationHypothesis(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    device_type: str = Field(min_length=1)
    score: float = Field(ge=0, le=100)
    confidence: Confidence
    explanation: str = ""
    evidence: list[ClassificationEvidence] = Field(default_factory=list)


class ClassificationConflict(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    id: str
    explanation: str


class OSAssessment(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    likely_family: str | None = None
    confidence: Confidence = "unknown"
    evidence: list[ClassificationEvidence] = Field(default_factory=list)
    explanation: str = ""


class ClassificationFacts(ObservationModel):
    model_config = ConfigDict(extra="allow", strict=True)
    status: Literal["hypothesis", "insufficient_evidence", "unassessed"] = "unassessed"
    confidence: Confidence = "unknown"
    primary: ClassificationHypothesis | None = None
    alternatives: list[ClassificationHypothesis] = Field(default_factory=list, max_length=1000)
    conflicts: list[ClassificationConflict] = Field(default_factory=list, max_length=1000)
    os_assessment: OSAssessment | None = None
