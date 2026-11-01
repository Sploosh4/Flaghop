"""Native activity endpoints, using the same services as the legacy application."""

from app.api.activity_contracts import Overview
from app.api.dependencies import Runtime, native_router
from app.contracts.actions.activity import (
    ApprovalList,
    ApprovalResponse,
    ApproveApproval,
    ClearProcesses,
    ClearedProcesses,
    DecisionList,
    ProcessAction,
    ProcessKillResult,
    ProcessList,
    ProcessOutput,
    RejectApproval,
    RetriedProcess,
    RetryProcess,
    ScanList,
)
from app.contracts.actions.inputs import EmptyAction
from app.web.services.process_service import ProcessService
from app.web.services.runtime_service import RuntimeService
from app.web.services.scan_service import ScanService
from app.web.services.scheduler_service import SchedulerService
from app.web.services.workspace_service import WorkspaceService
from fastapi import Body, Path, Query, Response
from typing import Annotated

router = native_router()
ActivityId = Annotated[int, Path(ge=1)]


@router.get(
    "/api/workspace/overview", response_model=Overview, response_model_exclude_unset=True, operation_id="getOverview"
)
def overview(runtime: Runtime):
    return WorkspaceService(runtime).get_workspace_overview()


@router.get(
    "/api/processes", response_model=ProcessList, response_model_exclude_unset=True, operation_id="listProcesses"
)
def processes(runtime: Runtime, limit: Annotated[int, Query(ge=1, le=500)] = 100):
    return RuntimeService(runtime).list_processes({"limit": limit})


@router.get(
    "/api/processes/{process_id}/output",
    response_model=ProcessOutput,
    response_model_exclude_unset=True,
    operation_id="getProcessOutput",
)
def process_output(
    process_id: ActivityId,
    runtime: Runtime,
    offset: Annotated[int, Query(ge=0, le=10**9)] = 0,
    max_chars: Annotated[int, Query(ge=1, le=50000)] = 12000,
):
    return ProcessService(runtime).get_process_output(process_id, {"offset": offset, "max_chars": max_chars})


@router.post(
    "/api/processes/{process_id}/kill",
    response_model=ProcessKillResult,
    response_model_exclude_unset=True,
    operation_id="killProcess",
)
def kill_process(process_id: ActivityId, runtime: Runtime, payload: EmptyAction = Body(default_factory=EmptyAction)):
    return {"status": "ok", **ProcessService(runtime).kill_process(process_id)}


@router.post(
    "/api/processes/{process_id}/close",
    response_model=ProcessAction,
    response_model_exclude_unset=True,
    operation_id="closeProcess",
)
def close_process(process_id: ActivityId, runtime: Runtime, payload: EmptyAction = Body(default_factory=EmptyAction)):
    return {"status": "ok", **ProcessService(runtime).close_process(process_id)}


@router.post(
    "/api/processes/{process_id}/retry",
    status_code=202,
    response_model=RetriedProcess,
    response_model_exclude_unset=True,
    operation_id="retryProcess",
)
def retry_process(process_id: ActivityId, runtime: Runtime, payload: Annotated[RetryProcess, Body()] = RetryProcess()):
    return ProcessService(runtime).retry_process(process_id, payload.model_dump())


@router.post(
    "/api/processes/clear",
    response_model=ClearedProcesses,
    response_model_exclude_unset=True,
    operation_id="clearProcesses",
)
def clear_processes(runtime: Runtime, payload: Annotated[ClearProcesses, Body()] = ClearProcesses()):
    return {"status": "ok", **ProcessService(runtime).clear_processes(payload.model_dump())}


@router.get("/api/scans/history", response_model=ScanList, response_model_exclude_unset=True, operation_id="listScans")
def scans(runtime: Runtime, limit: Annotated[int, Query(ge=1, le=1000)] = 100):
    return ScanService(runtime).scan_history(limit)


@router.get(
    "/api/scheduler/decisions",
    response_model=DecisionList,
    response_model_exclude_unset=True,
    operation_id="listDecisions",
)
def decisions(runtime: Runtime, limit: Annotated[int, Query(ge=1, le=500)] = 100):
    return SchedulerService(runtime).get_decisions({"limit": limit})


@router.get(
    "/api/scheduler/approvals",
    response_model=ApprovalList,
    response_model_exclude_unset=True,
    operation_id="listApprovals",
)
def approvals(
    runtime: Runtime,
    limit: Annotated[int, Query(ge=1, le=1000)] = 200,
    status: Annotated[str | None, Query(max_length=40)] = None,
):
    return SchedulerService(runtime).list_approvals({"limit": limit, "status": status})


@router.post(
    "/api/scheduler/approvals/{approval_id}/approve",
    response_model=ApprovalResponse,
    response_model_exclude_unset=True,
    responses={202: {"model": ApprovalResponse}},
    operation_id="approveApproval",
)
def approve(
    approval_id: ActivityId,
    runtime: Runtime,
    response: Response,
    payload: Annotated[ApproveApproval, Body()] = ApproveApproval(),
):
    body, response.status_code = SchedulerService(runtime).approve_approval(approval_id, payload.model_dump())
    return body


@router.post(
    "/api/scheduler/approvals/{approval_id}/reject",
    response_model=ApprovalResponse,
    response_model_exclude_unset=True,
    operation_id="rejectApproval",
)
def reject(approval_id: ActivityId, runtime: Runtime, payload: Annotated[RejectApproval, Body()] = RejectApproval()):
    return SchedulerService(runtime).reject_approval(approval_id, payload.model_dump())
