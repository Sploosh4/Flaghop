from __future__ import annotations

from app.tooling import resolve_tool_install_platform

import logging

from typing import Any, Dict

from app.settings import AppSettings, Settings
from app.tooling import (
    audit_legion_tools,
    build_tool_install_plan,
    detect_supported_tool_install_platform,
    tool_audit_summary,
)
from app.web.http_utils import as_bool
from app.contracts.actions.display import DisplaySettingsRequest
from app.contracts.actions.tooling_requests import ToolAuditInstallRequest, ToolAuditPlanQuery


def load_display_settings(runtime=None) -> Dict[str, Any]:
    settings = getattr(runtime, "settings", None)
    if settings is None:
        try:
            settings = Settings(AppSettings())
        except Exception:
            logging.getLogger(__name__).exception("Unable to load display settings; using defaults")
            settings = None
    colorful_ascii_background = as_bool(
        getattr(settings, "general_colorful_ascii_background", False) if settings is not None else False,
        False,
    )
    return {
        "colorful_ascii_background": bool(colorful_ascii_background),
    }


def _refresh_runtime_settings(runtime) -> None:
    if runtime is None:
        return
    # Construct both values before changing the live configuration.
    settings_file = AppSettings()
    settings = Settings(settings_file)
    runtime.settings_file = settings_file
    runtime.settings = settings


class SettingsService:
    def __init__(self, runtime):
        self.runtime = runtime

    def get_display_settings(self) -> Dict[str, Any]:
        return load_display_settings(self.runtime)

    def save_display_settings(self, payload: Any) -> Dict[str, Any]:
        request = DisplaySettingsRequest.from_payload(payload)
        settings_file = AppSettings()
        settings_file.actions.beginGroup("GeneralSettings")
        settings_file.actions.setValue(
            "colorful-ascii-background",
            "True" if request.colorful_ascii_background else "False",
        )
        settings_file.actions.endGroup()
        settings_file.actions.sync()
        _refresh_runtime_settings(self.runtime)
        return {
            "status": "ok",
            "colorful_ascii_background": bool(request.colorful_ascii_background),
        }

    def get_tool_audit(self) -> Dict[str, Any]:
        runtime_getter = getattr(self.runtime, "get_tool_audit", None) if self.runtime is not None else None
        if callable(runtime_getter):
            return runtime_getter()
        settings = getattr(self.runtime, "settings", None) if self.runtime is not None else None
        if settings is None:
            settings = Settings(AppSettings())
        entries = audit_legion_tools(settings)
        return {
            "summary": tool_audit_summary(entries),
            "tools": [entry.to_dict() for entry in entries],
            "supported_platforms": ["kali", "ubuntu"],
            "recommended_platform": detect_supported_tool_install_platform(),
        }

    def get_tool_install_plan(self, args: Any) -> Dict[str, Any]:
        query = ToolAuditPlanQuery.from_args(args)
        platform = resolve_tool_install_platform(query.platform)
        runtime_getter = getattr(self.runtime, "get_tool_install_plan", None) if self.runtime is not None else None
        if callable(runtime_getter):
            return runtime_getter(platform=platform, scope=query.scope, tool_keys=query.tool_keys)
        settings = getattr(self.runtime, "settings", None) if self.runtime is not None else None
        if settings is None:
            settings = Settings(AppSettings())
        entries = audit_legion_tools(settings)
        return build_tool_install_plan(
            entries,
            platform=platform,
            scope=query.scope,
            tool_keys=query.tool_keys,
        )

    def start_tool_install(self, payload: Any) -> Dict[str, Any]:
        runtime_start = getattr(self.runtime, "start_tool_install_job", None) if self.runtime is not None else None
        if not callable(runtime_start):
            raise NotImplementedError("Tool installation is unavailable in this runtime.")
        request = ToolAuditInstallRequest.from_payload(payload)
        platform = resolve_tool_install_platform(request.platform)
        job = runtime_start(
            platform=platform,
            scope=request.scope,
            tool_keys=request.tool_keys,
        )
        return {"status": "accepted", "job": job}
