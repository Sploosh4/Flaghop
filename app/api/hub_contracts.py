from typing import Literal
from pydantic import BaseModel
from app.api.contracts import Project


class HubProject(BaseModel):
    id: str
    name: str
    path: str
    folder: str
    managed: bool
    vpn: Literal["inherit", "none"] = "inherit"


class HubProjects(BaseModel):
    projects: list[HubProject]


class OpenHubProject(BaseModel):
    project: HubProject
    workspace: Project


class HubComputer(BaseModel):
    name: str
    system: str


class HubSettings(BaseModel):
    default_vpn: None = None
    vpn_status: Literal["unconfigured"]
    computer: HubComputer
    projects_folder: str
    vpns: list[str]


class HubFile(BaseModel):
    path: str
    size: int


class HubFiles(BaseModel):
    files: list[HubFile]
    truncated: bool


class HubOk(BaseModel):
    status: Literal["ok"]
