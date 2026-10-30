"""Synchronous service calls run in FastAPI's worker pool, away from the ASGI event loop."""

from typing import Annotated
from fastapi import APIRouter, Depends, Path, Query, Request, Response
from app.api.contracts import (
    Health,
    Project,
    ProjectResponse,
    RenameProject,
    Job,
    JobList,
    Snapshot,
    StopJobResponse,
    ApiError,
)
from app.web.services.project_service import ProjectService
from app.web.services.runtime_service import RuntimeService


def mark_native(response: Response):
    response.headers["X-Legion-API"] = "fastapi"


def get_runtime(request: Request):
    runtime = request.app.state.runtime
    if runtime is None:
        raise RuntimeError("No workspace runtime is available.")
    return runtime


Runtime = Annotated[object, Depends(get_runtime)]
JobId = Annotated[int, Path(ge=1)]
router = APIRouter(
    dependencies=[Depends(mark_native)],
    responses={400: {"model": ApiError}, 404: {"model": ApiError}, 409: {"model": ApiError}, 422: {"model": ApiError}},
)


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


@router.get("/api/snapshot", response_model=Snapshot, response_model_exclude_unset=True, operation_id="getSnapshot")
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
def stop_job(job_id: JobId, runtime: Runtime):
    return {"status": "ok", **RuntimeService(runtime).stop_job(job_id)}
