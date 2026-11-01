"""Reader artifact provenance and presentation references."""

from typing import Literal
from pydantic import ConfigDict, Field, model_serializer
from app.contracts.base import ArtifactModel
from app.contracts.artifacts.references import ProjectRelativePath


class ReaderOrigin(ArtifactModel):
    """Source metadata; a historical hash label is not proof of authenticity."""

    model_config = ConfigDict(extra="allow")
    id: str | None = None
    path: str | None = None
    source_path: str | None = None
    sha256: str | None = None
    transport: str | None = None
    snapshot_id: str | None = None
    connection_id: str | int | None = None
    session_id: str | int | None = None

    @model_serializer(mode="wrap")
    def serialize_present_fields(self, handler):
        # Missing provenance must remain unknown, including through FastAPI.
        return {name: value for name, value in handler(self).items() if name in self.model_fields_set}


class ReaderAlert(ArtifactModel):
    id: str
    result_path: ProjectRelativePath
    size: int = Field(ge=0, strict=True)
    completed: float = Field(ge=0, allow_inf_nan=False)
    origins: list[ReaderOrigin]
    state: str
    label: str
    transformations: list[str]
    kind: Literal["cipher", "hash"] = "cipher"
    display_name: str = ""
    internal: bool = False
    history_reason: str = ""
