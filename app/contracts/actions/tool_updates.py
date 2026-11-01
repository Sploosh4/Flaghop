from typing import Literal
from pydantic import Field
from app.contracts.base import ActionModel, ActionRequest


class ToolUpdateRequest(ActionRequest):
    retry_failed: bool = False


class ToolUpdateEntry(ActionModel):
    name: str = Field(min_length=1, max_length=80)
    status: Literal["pending", "checking", "updating", "current", "updated", "failed"] = "pending"
    installed: str = Field(default="", max_length=200)
    latest: str = Field(default="", max_length=200)
    error: str = Field(default="", max_length=1000)


class ToolUpdateState(ActionModel):
    running: bool = False
    job_id: int | None = None
    tools: list[ToolUpdateEntry] = Field(default_factory=list, max_length=100)
    error: str = ""
