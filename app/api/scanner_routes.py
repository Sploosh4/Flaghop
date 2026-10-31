"""Typed selected-device Deep scan requests; commands remain owned by the adapter."""

from fastapi import Query
from app.api.dependencies import native_router
from app.api.hub_routes import Hub
from app.scanning.contracts import DeepScanRequest, DeepScanRun, DeepScanList
from app.scanning.service import DeepScans

router = native_router()


@router.get("/api/hub/projects/{identifier}/deep-scans", response_model=DeepScanList, operation_id="getDeepScans")
def scans(identifier: str, hub: Hub, compact: bool = Query(default=False)):
    with hub.lock:
        return DeepScans(hub, identifier).list(compact=compact)


@router.post(
    "/api/hub/projects/{identifier}/deep-scans",
    response_model=DeepScanRun,
    status_code=202,
    operation_id="startDeepScan",
)
def start(identifier: str, payload: DeepScanRequest, hub: Hub):
    return DeepScans(hub, identifier).start(payload)


@router.get(
    "/api/hub/projects/{identifier}/deep-scans/{scan_id}", response_model=DeepScanRun, operation_id="getDeepScan"
)
def detail(identifier: str, scan_id: str, hub: Hub):
    return DeepScans(hub, identifier).detail(scan_id)
