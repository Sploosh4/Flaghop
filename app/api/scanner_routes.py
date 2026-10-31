"""Typed selected-device Deep scan requests; commands remain owned by the adapter."""

from app.api.dependencies import native_router
from app.api.hub_routes import Hub
from app.scanning.contracts import DeepScanRequest, DeepScanRun, DeepScanList
from app.scanning.service import DeepScans

router = native_router()


@router.get("/api/hub/projects/{identifier}/deep-scans", response_model=DeepScanList, operation_id="getDeepScans")
def scans(identifier: str, hub: Hub):
    with hub.lock:
        return DeepScans(hub, identifier).list()


@router.post(
    "/api/hub/projects/{identifier}/deep-scans",
    response_model=DeepScanRun,
    status_code=202,
    operation_id="startDeepScan",
)
def start(identifier: str, payload: DeepScanRequest, hub: Hub):
    return DeepScans(hub, identifier).start(payload)
