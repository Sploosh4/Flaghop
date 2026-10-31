"""Canonical rows produced by target-state normalization and protocol parsers."""

from typing import Literal
from pydantic import Field
from app.contracts.base import ObservationRow


class TechnologyObservation(ObservationRow):
    confidence: float = Field(default=0, ge=0, le=100)
    name: str
    version: str = ""
    cpe: str = ""
    evidence: str = ""


class DeviceCategoryObservation(ObservationRow):
    id: str
    name: str
    origin: str
    observed: bool = False
    reasons: list[str] = Field(default_factory=list)


class FindingObservation(ObservationRow):
    """A reported finding; observed text does not establish reproduction."""

    confidence: float = Field(default=0, ge=0, le=100)
    title: str
    severity: str
    cvss: float
    cve: str
    evidence: str
    evidence_items: list[str] = Field(default_factory=list)
    quality_action: Literal["suppressed", "downgraded"] | None = None
    quality_reason: str = ""
    severity_before: str = ""


class FindingQualityObservation(ObservationRow):
    confidence: float = Field(default=0, ge=0, le=100)
    title: str
    cve: str
    action: Literal["suppressed", "downgraded"]
    reason: str
    severity_before: str
    severity_after: str = ""
    evidence: str
    matched_url: str = ""


class ServiceObservation(ObservationRow):
    port: str
    protocol: str
    state: str
    service: str
    service_product: str
    service_version: str
    service_extrainfo: str
    banner: str


class UrlObservation(ObservationRow):
    url: str
    port: str
    protocol: str
    service: str
    label: str


class CoverageGapObservation(ObservationRow):
    gap_id: str
    description: str
    recommended_tool_ids: list[str]
    analysis_mode: str
    stage: str
    host_cve_count: int


class CredentialObservation(ObservationRow):
    """A reported credential reference; no automatic authentication is implied."""

    username: str
    secret_ref: str
    realm: str
    type: str
    evidence: str


class SessionObservation(ObservationRow):
    """Saved observation only; this is not a live session handle."""

    session_type: str
    username: str
    host: str
    port: str
    protocol: str
    evidence: str
    obtained_at: str
