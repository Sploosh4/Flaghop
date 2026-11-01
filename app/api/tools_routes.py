"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from app.api.dependencies import Runtime, native_router
from app.contracts.actions.responses import AcceptedJobResponse
from app.contracts.actions.tool_requests import ToolRunRequest
from app.web.http_utils import json_error
from app.web.services.tool_service import ToolService
from fastapi import Request, Response

router = native_router()


@router.get("/api/workspace/tools", operation_id="workspace_tools")
def workspace_tools(request: Request, runtime: Runtime):
    service = ToolService(runtime)
    try:
        return service.list_workspace_tools(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/workspace/tool-targets", operation_id="workspace_tool_targets")
def workspace_tool_targets(request: Request, runtime: Runtime):
    service = ToolService(runtime)
    try:
        return service.list_workspace_tool_targets(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/workspace/tools/run",
    operation_id="workspace_tool_run",
    response_model=AcceptedJobResponse,
    response_model_exclude_unset=True,
)
def workspace_tool_run(request: Request, runtime: Runtime, response: Response, payload: ToolRunRequest):
    service = ToolService(runtime)
    try:
        response.status_code = 202
        return service.start_tool_run(payload)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
