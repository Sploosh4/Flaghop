from typing import Literal
from pydantic import BaseModel
from app.contracts.actions.job_api import Job
from app.api.contracts import Project
from app.services.project_hub_requests import Connector


class HubProject(BaseModel):
    id: str
    name: str
    path: str
    folder: str
    managed: bool
    vpn: Literal["inherit", "none"] = "inherit"
    connector: Connector = "networkmanager"


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


class HubConnectorInstallation(BaseModel):
    status: Literal["accepted"]
    job: Job
