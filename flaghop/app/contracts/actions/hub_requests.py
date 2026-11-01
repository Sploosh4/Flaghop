from app.contracts.base import ActionRequest
from pydantic import ConfigDict, Field
from typing import Literal


class CreateHubProject(ActionRequest):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=120, strict=True)


class HubVpn(ActionRequest):
    model_config = ConfigDict(extra="forbid")
    selection: Literal["inherit", "none"] | None = None


Connector = Literal["networkmanager", "openvpn", "wireguard"]


class HubConnector(ActionRequest):
    model_config = ConfigDict(extra="forbid")
    selection: Connector


class HubConnectorInstall(ActionRequest):
    model_config = ConfigDict(extra="forbid")
    connector: Literal["openvpn", "wireguard"]


class OpenHubPath(ActionRequest):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    path: str = Field(min_length=1, strict=True)


class HubSaveFolder(ActionRequest):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    path: str = Field(min_length=1, max_length=4096, strict=True)
    move_existing: bool = Field(default=False, strict=True)
