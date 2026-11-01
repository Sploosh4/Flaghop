"""Evidence locators and historical reference rows, without filesystem operations."""

from typing import Annotated, TypeAlias
from pydantic import AfterValidator, Field
from app.contracts.base import ArtifactModel, ProvenanceModel
from app.core.contract_values import project_relative_path

# Legacy locators may be local paths or opaque process-output identifiers.
# Only the service owning that locator may resolve it or decide whether to open it.
ArtifactLocator: TypeAlias = Annotated[str, Field(strict=True, min_length=1, max_length=4096)]
ProjectRelativePath: TypeAlias = Annotated[ArtifactLocator, AfterValidator(project_relative_path)]


class ArtifactReference(ArtifactModel, ProvenanceModel):
    ref: ArtifactLocator
    kind: str
    tool_id: str
    port: str
    protocol: str


class ScreenshotReference(ArtifactModel, ProvenanceModel):
    """Historical screenshot metadata, not a new screenshot action."""

    artifact_ref: str
    filename: str
    port: str
    protocol: str
    target_url: str = ""
    capture_engine: str = ""
    capture_reason: str = ""
    captured_at: str = ""
    service_name: str = ""
    hostname: str = ""
