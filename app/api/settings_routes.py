"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from app.api.dependencies import Runtime, native_router
from app.contracts.actions.display import DisplaySettingsRequest, DisplaySettingsResponse
from app.contracts.actions.responses import AcceptedJobResponse
from app.contracts.actions.tooling_requests import ToolAuditInstallRequest
from app.web.http_utils import json_error
from app.web.services.settings_service import SettingsService
from fastapi import Body, Request, Response
from app.contracts.actions.tool_updates import ToolUpdateRequest, ToolUpdateState

router = native_router()


def tool_updates(request, runtime):
    with runtime._lock:
        if not hasattr(runtime, "tool_updates"):
            from app.services.tool_updates import ToolUpdates

            runtime.tool_updates = ToolUpdates(runtime)
        return runtime.tool_updates


@router.get("/api/settings/tool-updates", response_model=ToolUpdateState, operation_id="getToolUpdates")
def settings_tool_updates(request: Request, runtime: Runtime):
    return tool_updates(request, runtime).snapshot()


@router.post(
    "/api/settings/tool-updates",
    response_model=ToolUpdateState,
    operation_id="startToolUpdates",
    status_code=202,
)
def settings_tool_updates_start(
    request: Request,
    runtime: Runtime,
    payload: ToolUpdateRequest = Body(default_factory=ToolUpdateRequest),
):
    return tool_updates(request, runtime).start(payload)


@router.get("/api/settings/display", operation_id="settings_display_get")
def settings_display_get(request: Request, runtime: Runtime):
    service = SettingsService(runtime)
    try:
        return service.get_display_settings()
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/settings/display",
    operation_id="settings_display_save",
    response_model=DisplaySettingsResponse,
    response_model_exclude_unset=True,
)
def settings_display_save(request: Request, runtime: Runtime, payload: DisplaySettingsRequest):
    service = SettingsService(runtime)
    try:
        payload = service.save_display_settings(payload)
        request.app.state.config["LEGION_COLORFUL_ASCII_BACKGROUND"] = bool(
            payload.get("colorful_ascii_background", False)
        )
        return payload
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/settings/tool-audit", operation_id="settings_tool_audit")
def settings_tool_audit(request: Request, runtime: Runtime):
    service = SettingsService(runtime)
    try:
        return service.get_tool_audit()
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/settings/tool-audit/install-plan", operation_id="settings_tool_audit_install_plan")
def settings_tool_audit_install_plan(request: Request, runtime: Runtime):
    service = SettingsService(runtime)
    try:
        return service.get_tool_install_plan(request.query_params)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/settings/tool-audit/install",
    operation_id="settings_tool_audit_install",
    response_model=AcceptedJobResponse,
    response_model_exclude_unset=True,
)
def settings_tool_audit_install(
    request: Request, runtime: Runtime, response: Response, payload: ToolAuditInstallRequest
):
    service = SettingsService(runtime)
    try:
        response.status_code = 202
        return service.start_tool_install(payload)
    except NotImplementedError as exc:
        return json_error(str(exc), 501)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
