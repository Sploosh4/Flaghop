"""Shared execution control request definitions."""

from typing import Literal
from pydantic import ConfigDict, Field
from app.contracts.base import ActionModel


class ProxyMessage(ActionModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    token: str
    sequence: str = Field(pattern=r"^[a-f0-9]{32}$")
    operation: Literal["open", "close"]
    port: int = Field(ge=1, le=65535)
