"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from typing import Any
from fastapi import Body, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.api.dependencies import Runtime, native_router
from app.web.http_utils import json_error
from app.web.services.scheduler_service import SchedulerService

router = native_router()


@router.post("/api/scheduler/run", operation_id="scheduler_run")
def scheduler_run(request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    try:
        body, status_code = service.start_run()
        return JSONResponse(jsonable_encoder(body), status_code=status_code)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/scheduler/preferences", operation_id="scheduler_preferences")
def scheduler_preferences(request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    return service.get_preferences()


@router.post("/api/scheduler/preferences", operation_id="scheduler_preferences_update")
def scheduler_preferences_update(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = SchedulerService(runtime)
    try:
        return service.update_preferences(payload or {})
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/engagement-policy", operation_id="engagement_policy_get")
def engagement_policy_get(request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    return service.get_engagement_policy()


@router.post("/api/engagement-policy", operation_id="engagement_policy_update")
def engagement_policy_update(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = SchedulerService(runtime)
    try:
        return service.update_engagement_policy(payload or {})
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/scheduler/approve-family", operation_id="scheduler_approve_family")
def scheduler_approve_family(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = SchedulerService(runtime)
    try:
        return service.approve_family(payload or {})
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/scheduler/plan-preview", operation_id="scheduler_plan_preview")
def scheduler_plan_preview(request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    try:
        return service.get_plan_preview(request.query_params)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/scheduler/executions", operation_id="scheduler_execution_traces")
def scheduler_execution_traces(request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    try:
        return service.list_executions(request.query_params)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/scheduler/executions/{execution_id}", operation_id="scheduler_execution_trace")
def scheduler_execution_trace(execution_id: str, request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    try:
        return service.get_execution_trace(execution_id, request.query_params)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)
