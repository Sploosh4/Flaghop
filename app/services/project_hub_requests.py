from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class CreateHubProject(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=120, strict=True)


class HubVpn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    selection: Literal["inherit", "none"] | None = None


Connector = Literal["networkmanager", "openvpn", "wireguard"]


class HubConnector(BaseModel):
    model_config = ConfigDict(extra="forbid")
    selection: Connector


class HubConnectorInstall(BaseModel):
    model_config = ConfigDict(extra="forbid")
    connector: Literal["openvpn", "wireguard"]


class OpenHubPath(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    path: str = Field(min_length=1, strict=True)


class HubSaveFolder(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    path: str = Field(min_length=1, max_length=4096, strict=True)
    move_existing: bool = Field(default=False, strict=True)


class BackgroundControl(BaseModel):
    model_config = ConfigDict(extra="forbid")
    running: bool = Field(strict=True)
