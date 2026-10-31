from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class CreateHubProject(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=120, strict=True)


class HubVpn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    selection: Literal["inherit", "none"] | None = None


class OpenHubPath(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    path: str = Field(min_length=1, strict=True)
