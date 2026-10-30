"""Settings operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_settings as web_runtime_settings


class SettingsRuntime:
    get_tool_audit = web_runtime_settings.get_tool_audit

    _tool_audit_availability = staticmethod(web_runtime_settings.tool_audit_availability)

    get_tool_install_plan = web_runtime_settings.get_tool_install_plan

    start_tool_install_job = web_runtime_settings.start_tool_install_job

    _run_tool_install_job = web_runtime_settings.run_tool_install_job
