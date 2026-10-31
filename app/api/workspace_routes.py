"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from fastapi import Request
from app.api.dependencies import Runtime, native_router
from app.web.http_utils import json_error
from app.web.services.workspace_service import WorkspaceService

router = native_router()


@router.get("/api/workspace/hosts", operation_id="workspace_hosts")
def workspace_hosts(request: Request, runtime: Runtime):
    service = WorkspaceService(runtime)
    try:
        return service.list_workspace_hosts(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/workspace/services", operation_id="workspace_services")
def workspace_services(request: Request, runtime: Runtime):
    service = WorkspaceService(runtime)
    try:
        return service.list_workspace_services(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/workspace/hosts/{host_id}", operation_id="workspace_host_detail")
def workspace_host_detail(host_id: int, request: Request, runtime: Runtime):
    service = WorkspaceService(runtime)
    try:
        return service.get_host_workspace(host_id)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/workspace/hosts/{host_id}/target-state", operation_id="workspace_host_target_state")
def workspace_host_target_state(host_id: int, request: Request, runtime: Runtime):
    service = WorkspaceService(runtime)
    try:
        return service.get_host_target_state(host_id)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/workspace/findings", operation_id="workspace_findings")
def workspace_findings(request: Request, runtime: Runtime):
    service = WorkspaceService(runtime)
    try:
        return service.list_findings(request.query_params)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)
