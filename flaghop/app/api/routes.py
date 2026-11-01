"""Synchronous service calls run in FastAPI's worker pool, away from the ASGI event loop."""

from app.api.activity_contracts import ActivitySnapshot
from app.api.contracts import Health, Project, ProjectResponse
from app.api.dependencies import Runtime, native_router
from app.contracts.actions.inputs import EmptyAction
from app.contracts.actions.job_api import Job, JobList, StopJobResponse
from app.contracts.actions.project_requests import RenameProject
from app.web.services.project_service import ProjectService
from app.web.services.runtime_service import RuntimeService
from fastapi import Body, Path, Query
from typing import Annotated

JobId = Annotated[int, Path(ge=1)]
router = native_router()


@router.get("/health", response_model=Health, operation_id="health")
def health():
    return {"status": "ok"}


@router.get("/api/project", response_model=Project, response_model_exclude_unset=True, operation_id="getProject")
def get_project(runtime: Runtime):
    return ProjectService(runtime).get_details()


@router.post(
    "/api/project/rename",
    response_model=ProjectResponse,
    response_model_exclude_unset=True,
    operation_id="renameProject",
)
def rename_project(payload: RenameProject, runtime: Runtime):
    return ProjectService(runtime).rename_project(payload.model_dump())


@router.get(
    "/api/snapshot", response_model=ActivitySnapshot, response_model_exclude_unset=True, operation_id="getSnapshot"
)
def get_snapshot(runtime: Runtime):
    return RuntimeService(runtime).get_snapshot()


@router.get("/api/jobs", response_model=JobList, response_model_exclude_unset=True, operation_id="listJobs")
def list_jobs(runtime: Runtime, limit: Annotated[int, Query(ge=1, le=500)] = 100):
    return RuntimeService(runtime).list_jobs({"limit": limit})


@router.get("/api/jobs/{job_id}", response_model=Job, response_model_exclude_unset=True, operation_id="getJob")
def get_job(job_id: JobId, runtime: Runtime):
    return RuntimeService(runtime).get_job(job_id)


@router.post(
    "/api/jobs/{job_id}/stop", response_model=StopJobResponse, response_model_exclude_unset=True, operation_id="stopJob"
)
def stop_job(job_id: JobId, runtime: Runtime, payload: EmptyAction = Body(default_factory=EmptyAction)):
    return {"status": "ok", **RuntimeService(runtime).stop_job(job_id)}
