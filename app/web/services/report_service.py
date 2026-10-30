from __future__ import annotations

from typing import Any, Dict, Tuple

from app.web.report_schema import ProjectReportPushRequest


class ReportService:
    def __init__(self, runtime):
        self.runtime = runtime


    def push_project_ai_report(self, payload: Any) -> Tuple[Dict[str, Any], int]:
        request = ProjectReportPushRequest.from_payload(payload)
        result = self.runtime.push_project_ai_report(overrides=request.overrides)
        status_code = 200 if bool(result.get("ok", False)) else 400
        status_value = "ok" if bool(result.get("ok", False)) else "error"
        return {"status": status_value, **result}, status_code

    def push_project_report(self, payload: Any) -> Tuple[Dict[str, Any], int]:
        request = ProjectReportPushRequest.from_payload(payload)
        result = self.runtime.push_project_report(overrides=request.overrides)
        status_code = 200 if bool(result.get("ok", False)) else 400
        status_value = "ok" if bool(result.get("ok", False)) else "error"
        return {"status": status_value, **result}, status_code
