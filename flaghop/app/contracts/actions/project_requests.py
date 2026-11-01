"""Project open/save/rename inputs; project snapshots remain transport views."""

from app.contracts.actions.inputs import LegacyBool
from app.contracts.base import ActionRequest
from pydantic import Field, field_validator


class ProjectPathRequest(ActionRequest):
    path: str = Field(min_length=1, max_length=4096)


class ProjectSaveRequest(ProjectPathRequest):
    replace: LegacyBool = True


class RenameProject(ActionRequest):
    name: str = Field(min_length=1, max_length=120)
    expected_path: str = Field(default="", max_length=4096)

    @field_validator("name")
    @classmethod
    def reject_control_characters(cls, value):
        if any(ord(char) < 32 or ord(char) == 127 for char in value):
            raise ValueError("Workspace name cannot contain control characters.")
        return value
