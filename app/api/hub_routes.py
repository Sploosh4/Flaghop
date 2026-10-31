from typing import Annotated
from fastapi import Depends, Request, Query
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from starlette.concurrency import run_in_threadpool
from pathlib import Path
import tempfile
from app.api.dependencies import native_router
from app.api.hub_contracts import (
    HubConnectorInstallation,
    HubFiles,
    HubOk,
    HubProjects,
    HubSettings,
    OpenHubProject,
)
from app.services.project_hub import ProjectHub
from app.services.network_models import NetworkContext, NetworkUpdate, NetworkCheckRequest, NetworkReport
from app.services.project_hub_requests import (
    CreateHubProject,
    HubConnector,
    HubConnectorInstall,
    HubVpn,
    OpenHubPath,
    HubSaveFolder,
)

router = native_router()


def hub_service(request: Request):
    legacy = request.app.state.legacy
    if "project_hub" not in legacy.extensions:
        legacy.extensions["project_hub"] = ProjectHub(request.app.state.runtime)
    return legacy.extensions["project_hub"]


Hub = Annotated[ProjectHub, Depends(hub_service)]


@router.get("/api/hub/projects/{identifier}/network", response_model=NetworkContext, operation_id="getProjectNetwork")
def project_network(identifier: str, hub: Hub):
    return hub.networks.get(identifier)


@router.put("/api/hub/projects/{identifier}/network", response_model=NetworkContext, operation_id="saveProjectNetwork")
def save_project_network(identifier: str, payload: NetworkUpdate, hub: Hub):
    return hub.networks.save(identifier, payload)


@router.post(
    "/api/hub/projects/{identifier}/network/check", response_model=NetworkReport, operation_id="checkProjectNetwork"
)
def check_project_network(identifier: str, payload: NetworkCheckRequest, hub: Hub):
    return hub.networks.check(identifier, payload)


@router.get("/api/hub/projects", response_model=HubProjects, operation_id="listHubProjects")
def list_projects(hub: Hub):
    return hub.list()


@router.post("/api/hub/projects", response_model=OpenHubProject, operation_id="createHubProject")
def create_project(payload: CreateHubProject, hub: Hub):
    return hub.create(payload.name)


@router.post("/api/hub/projects/{identifier}/open", response_model=OpenHubProject, operation_id="openHubProject")
def open_project(identifier: str, hub: Hub):
    return hub.open(identifier)


@router.post("/api/hub/open-path", response_model=OpenHubProject, operation_id="openHubPath")
def open_path(payload: OpenHubPath, hub: Hub):
    return hub.operations.open_path(payload.path)


@router.post("/api/hub/projects/{identifier}/rename", response_model=OpenHubProject, operation_id="renameHubProject")
def rename(identifier: str, payload: CreateHubProject, hub: Hub):
    return hub.operations.rename(identifier, payload.name)


@router.post("/api/hub/projects/{identifier}/save", response_model=OpenHubProject, operation_id="saveHubProject")
def save(identifier: str, hub: Hub):
    return hub.operations.save(identifier)


@router.post("/api/hub/projects/{identifier}/save-as", response_model=OpenHubProject, operation_id="saveHubProjectAs")
def save_as(identifier: str, payload: CreateHubProject, hub: Hub):
    return hub.operations.save_as(identifier, payload.name)


@router.get("/api/hub/projects/{identifier}/bundle", response_class=FileResponse, operation_id="downloadHubBundle")
def bundle(identifier: str, hub: Hub):
    path, filename = hub.operations.bundle(identifier)
    return FileResponse(
        path,
        media_type="application/zip",
        filename=filename,
        background=BackgroundTask(Path(path).unlink, missing_ok=True),
    )


@router.post("/api/hub/restore-zip", response_model=OpenHubProject, operation_id="restoreHubBundle")
async def restore(request: Request, hub: Hub):
    with tempfile.NamedTemporaryFile(prefix="legion-hub-restore-", suffix=".zip", delete=False) as upload:
        path = Path(upload.name)
        try:
            async for chunk in request.stream():
                upload.write(chunk)
            upload.close()
            return await run_in_threadpool(hub.operations.restore_zip, str(path))
        finally:
            path.unlink(missing_ok=True)


@router.get("/api/hub/settings", response_model=HubSettings, operation_id="getHubSettings")
def settings(hub: Hub):
    return hub.settings()


@router.post("/api/hub/settings/vpn", response_model=HubOk, operation_id="setHubDefaultVpn")
def default_vpn(payload: HubVpn, hub: Hub):
    return hub.set_vpn(None, payload.selection)


@router.post("/api/hub/settings/save-folder", response_model=HubSettings, operation_id="setHubSaveFolder")
def save_folder(payload: HubSaveFolder, hub: Hub):
    return hub.set_save_folder(payload.path, payload.move_existing)


@router.post("/api/hub/projects/{identifier}/vpn", response_model=HubOk, operation_id="setHubProjectVpn")
def project_vpn(identifier: str, payload: HubVpn, hub: Hub):
    return hub.set_vpn(identifier, payload.selection)


@router.get("/api/hub/projects/{identifier}/files", response_model=HubFiles, operation_id="listHubFiles")
def files(identifier: str, hub: Hub):
    return hub.files(identifier)


@router.post("/api/hub/projects/{identifier}/connector", response_model=HubOk, operation_id="setHubProjectConnector")
def project_connector(identifier: str, payload: HubConnector, hub: Hub):
    return hub.set_connector(identifier, payload.selection)


@router.post(
    "/api/hub/connectors/install",
    response_model=HubConnectorInstallation,
    status_code=202,
    operation_id="installHubConnector",
)
def install_connector(payload: HubConnectorInstall, hub: Hub):
    return hub.install_connector(payload.connector)


@router.get("/api/hub/projects/{identifier}/file", response_class=FileResponse, operation_id="downloadHubFile")
def file(identifier: str, hub: Hub, path: Annotated[str, Query(min_length=1)]):
    file_path = hub.file_path(identifier, path)
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=file_path.name,
        headers={"X-Content-Type-Options": "nosniff"},
    )
