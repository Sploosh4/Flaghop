"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from app.api.dependencies import Runtime, native_router
from app.contracts.actions.inputs import EmptyAction
from app.contracts.actions.mutation_results import (
    EngagementPolicyResult,
    FamilyApprovalResult,
    SchedulerPreferencesResult,
)
from app.contracts.actions.responses import AcceptedJobResponse
from app.contracts.actions.scheduler_preferences import EngagementPolicyPatch, SchedulerPreferencesPatch
from app.contracts.actions.scheduler_requests import SchedulerFamilyApprovalRequest
from app.web.http_utils import json_error
from app.web.services.scheduler_service import SchedulerService
from fastapi import Body, Request, Response

router = native_router()


@router.post(
    "/api/scheduler/run",
    operation_id="scheduler_run",
    response_model=AcceptedJobResponse,
    response_model_exclude_unset=True,
)
def scheduler_run(
    request: Request, runtime: Runtime, response: Response, payload: EmptyAction = Body(default_factory=EmptyAction)
):
    service = SchedulerService(runtime)
    try:
        body, status_code = service.start_run()
        response.status_code = status_code
        return body
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/scheduler/preferences", operation_id="scheduler_preferences")
def scheduler_preferences(request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    return service.get_preferences()


@router.post(
    "/api/scheduler/preferences",
    operation_id="scheduler_preferences_update",
    response_model=SchedulerPreferencesResult,
    response_model_exclude_unset=True,
)
def scheduler_preferences_update(request: Request, runtime: Runtime, payload: SchedulerPreferencesPatch):
    service = SchedulerService(runtime)
    try:
        return service.update_preferences(payload)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/engagement-policy", operation_id="engagement_policy_get")
def engagement_policy_get(request: Request, runtime: Runtime):
    service = SchedulerService(runtime)
    return service.get_engagement_policy()


@router.post(
    "/api/engagement-policy",
    operation_id="engagement_policy_update",
    response_model=EngagementPolicyResult,
    response_model_exclude_unset=True,
)
def engagement_policy_update(request: Request, runtime: Runtime, payload: EngagementPolicyPatch):
    service = SchedulerService(runtime)
    try:
        return service.update_engagement_policy(payload)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/scheduler/approve-family",
    operation_id="scheduler_approve_family",
    response_model=FamilyApprovalResult,
    response_model_exclude_unset=True,
)
def scheduler_approve_family(request: Request, runtime: Runtime, payload: SchedulerFamilyApprovalRequest):
    service = SchedulerService(runtime)
    try:
        return service.approve_family(payload)
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
