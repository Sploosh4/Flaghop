"""Validated contracts for the first native API slice; extension fields remain compatible."""

from app.contracts.actions.job_api import Job
from app.contracts.base import ExtensibleModel
from pydantic import BaseModel, Field, JsonValue
from typing import Literal


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


class ProjectResponse(ExtensibleModel):
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
