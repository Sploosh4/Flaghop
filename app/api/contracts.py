"""Validated contracts for the first native API slice; extension fields remain compatible."""

from app.contracts.base import ExtensibleModel
from app.contracts.actions.job_api import Job


from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, JsonValue, field_validator


class Autosave(ExtensibleModel):
    interval_minutes: float = 0
    last_error: str = ""
    last_job_id: int = 0
    last_path: str = ""
    last_saved_at: str = ""


class Project(ExtensibleModel):
    name: str
    display_name: str = ""
    is_temporary: bool = False
    output_folder: str = ""
    running_folder: str = ""
    autosave: Autosave = Field(default_factory=Autosave)


class RenameProject(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: Annotated[str, Field(strict=True, min_length=1, max_length=120)]
    expected_path: str = ""

    @field_validator("name")
    @classmethod
    def reject_control_characters(cls, value):
        if any(ord(char) < 32 or ord(char) == 127 for char in value):
            raise ValueError("Workspace name cannot contain control characters.")
        return value


class ProjectResponse(BaseModel):
    status: Literal["ok"] = "ok"
    project: Project


class Snapshot(ExtensibleModel):
    project: Project
    jobs: list[Job] = Field(default_factory=list)


class Health(BaseModel):
    status: Literal["ok"] = "ok"


class ApiError(BaseModel):
    status: Literal["error"] = "error"
    error: str
    details: list[dict[str, JsonValue]] = Field(default_factory=list)
