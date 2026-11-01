"""Reader routes are bound to catalog IDs, never the globally active database."""

from app.api.dependencies import native_router
from app.api.hub_contracts import HubOk
from app.api.hub_routes import Hub
from app.contracts.actions.inputs import EmptyAction
from app.contracts.actions.reader import BackgroundStatus, ReaderResult
from app.contracts.actions.reader_control import BackgroundControl
from app.services.project_background import ProjectBackground
from app.services.project_files import ProjectFiles
from fastapi import Body, Query
from fastapi.responses import FileResponse
from pathlib import Path

router = native_router()


@router.get(
    "/api/hub/projects/{identifier}/background", response_model=BackgroundStatus, operation_id="getHubBackground"
)
def status(identifier: str, hub: Hub):
    with hub.lock:
        return ProjectBackground(hub, identifier).status()


@router.post(
    "/api/hub/projects/{identifier}/background/control",
    response_model=BackgroundStatus,
    operation_id="controlHubBackground",
)
def control(identifier: str, payload: BackgroundControl, hub: Hub):
    with hub.lock:
        return ProjectBackground(hub, identifier).control(payload.running)


@router.post(
    "/api/hub/projects/{identifier}/background/alerts/{alert_id}/dismiss",
    response_model=HubOk,
    operation_id="dismissHubAlert",
)
def dismiss(identifier: str, alert_id: str, hub: Hub, payload: EmptyAction = Body(default_factory=EmptyAction)):
    with hub.lock:
        return ProjectBackground(hub, identifier).dismiss(alert_id)


@router.get(
    "/api/hub/projects/{identifier}/background/results/{alert_id}",
    response_model=ReaderResult,
    operation_id="getHubResult",
)
def result(identifier: str, alert_id: str, hub: Hub):
    with hub.lock:
        return ProjectBackground(hub, identifier).result(alert_id)


@router.get("/api/hub/projects/{identifier}/filesystem", response_class=FileResponse, operation_id="hubFilesystem")
def filesystem(identifier: str, hub: Hub):
    with hub.lock:
        ProjectFiles(hub, identifier)
    return FileResponse(
        Path(__file__).parents[1] / "web/templates/hub-files.html",
        media_type="text/html",
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.get("/api/hub/projects/{identifier}/editor", response_class=FileResponse, operation_id="hubEditor")
def editor(identifier: str, hub: Hub):
    with hub.lock:
        ProjectFiles(hub, identifier)
    return FileResponse(
        Path(__file__).parents[1] / "web/templates/hub-files.html",
        media_type="text/html",
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.get("/api/hub/projects/{identifier}/filesystem/api/session", operation_id="hubFilesystemSession")
def filesystem_session(identifier: str, hub: Hub):
    with hub.lock:
        return ProjectFiles(hub, identifier).session()


@router.get("/api/hub/projects/{identifier}/filesystem/api/list", operation_id="hubFilesystemList")
def filesystem_list(identifier: str, hub: Hub, path: str = Query(min_length=1)):
    with hub.lock:
        return ProjectFiles(hub, identifier).listing(path)


@router.get("/api/hub/projects/{identifier}/filesystem/api/preview", operation_id="hubFilesystemPreview")
def filesystem_preview(identifier: str, hub: Hub, path: str = Query(min_length=1)):
    with hub.lock:
        return ProjectFiles(hub, identifier).preview(path)
