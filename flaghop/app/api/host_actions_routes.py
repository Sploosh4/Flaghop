"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from app.api.dependencies import Runtime, native_router
from app.contracts.actions.host_action_requests import WorkspacePortMutationRequest, WorkspaceServiceMutationRequest
from app.contracts.actions.inputs import EmptyAction
from app.contracts.actions.mutation_results import WorkspaceMutationResult
from app.web.http_utils import json_error
from app.web.services.host_action_service import HostActionService
from fastapi import Body, Request

router = native_router()


@router.post(
    "/api/workspace/ports/delete",
    operation_id="workspace_port_delete",
    response_model=WorkspaceMutationResult,
    response_model_exclude_unset=True,
)
def workspace_port_delete(request: Request, runtime: Runtime, payload: WorkspacePortMutationRequest):
    service = HostActionService(runtime)
    try:
        return {"status": "ok", **service.delete_workspace_port(payload)}
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/workspace/services/delete",
    operation_id="workspace_service_delete",
    response_model=WorkspaceMutationResult,
    response_model_exclude_unset=True,
)
def workspace_service_delete(request: Request, runtime: Runtime, payload: WorkspaceServiceMutationRequest):
    service = HostActionService(runtime)
    try:
        return {"status": "ok", **service.delete_workspace_service(payload)}
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/workspace/scripts/{script_id}/output", operation_id="workspace_host_script_output")
def workspace_host_script_output(script_id: int, request: Request, runtime: Runtime):
    service = HostActionService(runtime)
    try:
        return service.get_script_output(script_id, request.query_params)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.delete(
    "/api/workspace/hosts/{host_id}",
    operation_id="workspace_host_remove",
    response_model=WorkspaceMutationResult,
    response_model_exclude_unset=True,
)
def workspace_host_remove(
    host_id: int, request: Request, runtime: Runtime, payload: EmptyAction = Body(default_factory=EmptyAction)
):
    service = HostActionService(runtime)
    try:
        return {"status": "ok", **service.delete_host_workspace(host_id)}
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)
