"""Approved roots for domain contracts, without application or transport dependencies."""

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class ExtensibleModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class ActionModel(BaseModel):
    """Validated action data. Declare legacy extension policies explicitly."""

    model_config = ConfigDict(extra="forbid")


class ActionRequest(ActionModel):
    """Canonical untrusted action input, also consumed by service adapters."""

    model_config = ConfigDict(extra="forbid", strict=True, str_strip_whitespace=True)

    @classmethod
    def from_payload(cls, payload):
        return cls.model_validate(payload)


class ActionData:
    """Marker for typed internal action dataclasses; not an execution interface."""


class ActionConstants:
    """Marker for literal action catalogue namespaces, with no methods."""


class ObservationModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ArtifactModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProvenanceModel(BaseModel):
    """Historical evidence provenance; confidence is a legacy score, not probability."""

    confidence: float = Field(ge=0, le=100)
    source_kind: Literal["observed", "inferred", "ai_suggested", "user_entered"]
    observed: bool


class ObservationRow(ObservationModel, ProvenanceModel):
    """Approved base for normalized target observations."""
