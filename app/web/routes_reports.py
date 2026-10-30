from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.web.http_utils import json_error, runtime_from_app
from app.web.services.report_service import ReportService

reports_bp = Blueprint("reports_api", __name__)


def _report_service() -> ReportService:
    return ReportService(runtime_from_app())


@reports_bp.post("/api/workspace/project-ai-report/push")
def workspace_project_ai_report_push():
    service = _report_service()
    try:
        body, status_code = service.push_project_ai_report(request.get_json(silent=True) or {})
        return jsonify(body), status_code
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@reports_bp.post("/api/workspace/project-report/push")
def workspace_project_report_push():
    service = _report_service()
    try:
        body, status_code = service.push_project_report(request.get_json(silent=True) or {})
        return jsonify(body), status_code
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
