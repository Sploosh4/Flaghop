"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from typing import Any
from fastapi import Body, Request
from app.api.dependencies import Runtime, native_router
from app.web.http_utils import json_error
from app.web.services.host_action_service import HostActionService

router = native_router()


@router.post("/api/workspace/ports/delete", operation_id="workspace_port_delete")
def workspace_port_delete(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = HostActionService(runtime)
    try:
        return {"status": "ok", **service.delete_workspace_port(payload or {})}
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/workspace/services/delete", operation_id="workspace_service_delete")
def workspace_service_delete(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = HostActionService(runtime)
    try:
        return {"status": "ok", **service.delete_workspace_service(payload or {})}
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


@router.delete("/api/workspace/hosts/{host_id}", operation_id="workspace_host_remove")
def workspace_host_remove(host_id: int, request: Request, runtime: Runtime):
    service = HostActionService(runtime)
    try:
        return {"status": "ok", **service.delete_host_workspace(host_id)}
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)
