"""Typed selected-device Deep scan requests; commands remain owned by the adapter."""

from app.api.dependencies import native_router
from app.api.hub_routes import Hub
from app.contracts.actions.scanner import DeepScanList, DeepScanRequest, DeepScanRun
from app.scanning.service import DeepScans
from app.contracts.actions.inputs import EmptyAction
from app.contracts.actions.execution_journal import ExecutionRecoveryReport
from app.api.dependencies import Runtime
from fastapi import Query, Body

router = native_router()


@router.get("/api/recovery", response_model=ExecutionRecoveryReport, operation_id="getExecutionRecovery")
def recovery_status(runtime: Runtime):
    from app.scanning.recovery import recovery_status

    return recovery_status(runtime)


@router.post("/api/recovery", response_model=ExecutionRecoveryReport, operation_id="retryExecutionRecovery")
def retry_recovery(runtime: Runtime, hub: Hub, payload: EmptyAction = Body(default_factory=EmptyAction)):
    from app.scanning.recovery import reconcile_orphans, recovery_status

    result = reconcile_orphans(runtime, hub, include_current=True)
    return {**result, **recovery_status(runtime)}


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


@router.post(
    "/api/hub/projects/{identifier}/deep-scans/{scan_id}/recover",
    response_model=DeepScanRun,
    operation_id="recoverDeepScan",
)
def recover(identifier: str, scan_id: str, hub: Hub, payload: EmptyAction = Body(default_factory=EmptyAction)):
    from app.scanning.recovery import recover
    from app.services.project_background import ProjectBackground

    return recover(ProjectBackground(hub, identifier), scan_id)
