"""Scanner artifact manifest entries; checking actual bytes belongs to the importer."""

from pydantic import ConfigDict, Field
from app.contracts.base import ArtifactModel
from app.contracts.artifacts.references import ProjectRelativePath


class ContentIdentity(ArtifactModel):
    model_config = ConfigDict(extra="forbid")
    bytes: int = Field(ge=0, le=8 * 1024 * 1024, strict=True)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")


class Artifact(ContentIdentity):
    path: ProjectRelativePath = Field(max_length=1000)
