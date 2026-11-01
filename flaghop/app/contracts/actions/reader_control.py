"""Shared execution control request definitions."""

from pydantic import ConfigDict, Field
from app.contracts.base import ActionModel


class BackgroundControl(ActionModel):
    model_config = ConfigDict(extra="forbid")
    running: bool = Field(strict=True)
