"""Reports operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict
from app.web import runtime_reports as web_runtime_reports


class ReportsRuntime:

    get_project_ai_report = web_runtime_reports.get_project_ai_report

    def render_project_ai_report_markdown(self, report: Dict[str, Any]) -> str:
        return web_runtime_reports.render_project_ai_report_markdown(report)

    get_project_report = web_runtime_reports.get_project_report

    def render_project_report_markdown(self, report: Dict[str, Any]) -> str:
        return web_runtime_reports.render_project_report_markdown(report)

    push_project_ai_report = web_runtime_reports.push_project_ai_report

    push_project_report = web_runtime_reports.push_project_report
