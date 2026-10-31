"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from typing import Any
from fastapi import Body, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.api.dependencies import Runtime, native_router
from app.web.http_utils import json_error
from app.web.services.settings_service import SettingsService

router = native_router()


@router.get("/api/settings/display", operation_id="settings_display_get")
def settings_display_get(request: Request, runtime: Runtime):
    service = SettingsService(runtime)
    try:
        return service.get_display_settings()
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/settings/display", operation_id="settings_display_save")
def settings_display_save(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = SettingsService(runtime)
    try:
        payload = service.save_display_settings(payload or {})
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


@router.post("/api/settings/tool-audit/install", operation_id="settings_tool_audit_install")
def settings_tool_audit_install(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = SettingsService(runtime)
    try:
        return JSONResponse(jsonable_encoder(service.start_tool_install(payload or {})), status_code=202)
    except NotImplementedError as exc:
        return json_error(str(exc), 501)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
