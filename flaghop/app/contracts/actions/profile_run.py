"""Scanner execution metadata carried by a profile."""

from datetime import datetime
from typing import Literal
from pydantic import ConfigDict, Field, field_validator
from app.contracts.base import ActionModel


class Run(ActionModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["running", "completed", "partial", "dry_run"]
    mode: Literal["active", "offline", "dry_run"]
    started_at: str = Field(min_length=1, max_length=100)
    finished_at: str = Field(min_length=1, max_length=100)

    @field_validator("started_at", "finished_at")
    @classmethod
    def timestamp(cls, value):
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            raise ValueError("Scanner timestamps must include their timezone.")
        return value
