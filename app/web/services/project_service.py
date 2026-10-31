from __future__ import annotations

from typing import Any, Dict, Tuple

from app.web.project_schema import ProjectListQuery, ProjectPathRequest, ProjectSaveRequest
from app.contracts.actions.responses import AcceptedJobResponse
from app.web.response_schema import ProjectListResponse, ProjectOkResponse


class ProjectService:
    def __init__(self, runtime):
        self.runtime = runtime

    def get_details(self) -> Dict[str, Any]:
        return self.runtime.get_project_details()

    def rename_project(self, payload: Any) -> Dict[str, Any]:
        source = payload if isinstance(payload, dict) else {}
        name = source.get("name")
        expected_path = source.get("expected_path", "")
        if not isinstance(name, str) or not isinstance(expected_path, str):
            raise ValueError("A workspace name is required.")
        project = self.runtime.rename_project(name, expected_path=expected_path)
        return ProjectOkResponse.from_project(project).to_dict()

    def list_projects(self, args) -> Dict[str, Any]:
        query = ProjectListQuery.from_args(args)
        return ProjectListResponse.from_projects(self.runtime.list_projects(limit=query.limit)).to_dict()

    def create_new_temp(self) -> Dict[str, Any]:
        project = self.runtime.create_new_temporary_project()
        return ProjectOkResponse.from_project(project).to_dict()

    def open_project(self, payload: Any) -> Dict[str, Any]:
        request = ProjectPathRequest.from_payload(payload)
        if not request.path:
            raise ValueError("Project path is required.")
        return ProjectOkResponse.from_project(self.runtime.open_project(request.path)).to_dict()

    def save_project_as(self, payload: Any, *, prefer_async: bool = True) -> Tuple[Dict[str, Any], int]:
        request = ProjectSaveRequest.from_payload(payload)
        if not request.path:
            raise ValueError("Project path is required.")
        if prefer_async and hasattr(self.runtime, "start_save_project_as_job"):
            job = self.runtime.start_save_project_as_job(request.path, replace=request.replace)
            return AcceptedJobResponse.from_job(job).to_dict(), 202
        project = self.runtime.save_project_as(request.path, replace=request.replace)
        return ProjectOkResponse.from_project(project).to_dict(), 200
