"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from typing import Any
from fastapi import Body, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.api.dependencies import Runtime, native_router
from app.web.http_utils import json_error
from app.web.services.tool_service import ToolService

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


@router.post("/api/workspace/tools/run", operation_id="workspace_tool_run")
def workspace_tool_run(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = ToolService(runtime)
    try:
        return JSONResponse(jsonable_encoder(service.start_tool_run(payload or {})), status_code=202)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
