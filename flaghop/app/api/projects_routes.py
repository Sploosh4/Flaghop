"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

import shutil
import tempfile
from app.api.contracts import ProjectResponse
from app.api.dependencies import Runtime, native_router
from app.api.downloads import TemporaryFileResponse
from app.contracts.actions.inputs import EmptyAction
from app.contracts.actions.project_requests import ProjectPathRequest, ProjectSaveRequest
from app.contracts.actions.responses import AcceptedJobResponse
from app.web.http_utils import json_error
from app.web.services.project_service import ProjectService
from fastapi import Body, File, Request, Response, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path

router = native_router()


@router.get("/api/project/download-zip", response_class=FileResponse, operation_id="downloadWorkspaceZip")
def project_download_zip(runtime: Runtime):
    path, filename = runtime.build_project_bundle_zip()
    return TemporaryFileResponse(
        path,
        filename=filename,
        media_type="application/zip",
    )


@router.post(
    "/api/project/restore-zip",
    operation_id="restoreWorkspaceZip",
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["bundle"],
                        "properties": {"bundle": {"type": "string", "format": "binary"}},
                        "additionalProperties": False,
                    }
                }
            },
        }
    },
    response_model=AcceptedJobResponse | ProjectResponse,
    response_model_exclude_unset=True,
)
async def project_restore_zip(request: Request, runtime: Runtime, response: Response):
    from app.api.uploads import staged_upload
    from starlette.concurrency import run_in_threadpool

    async with staged_upload(request, multipart=True) as upload:
        if hasattr(runtime, "start_restore_project_zip_job"):
            job = await run_in_threadpool(runtime.start_restore_project_zip_job, str(upload.path))
            body = AcceptedJobResponse.from_job(job).to_dict()
            upload.handoff()
            response.status_code = 202
            return body
        if hasattr(runtime, "restore_project_bundle_zip"):
            result = await run_in_threadpool(runtime.restore_project_bundle_zip, str(upload.path))
            return {"status": "ok", "project": result.get("project", {}), "result": result}
        return json_error("Runtime does not support ZIP restore.", 501)


@router.get("/api/projects", operation_id="project_list")
def project_list(request: Request, runtime: Runtime):
    service = ProjectService(runtime)
    try:
        return service.list_projects(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/project/new-temp",
    operation_id="project_new_temp",
    response_model=ProjectResponse,
    response_model_exclude_unset=True,
)
def project_new_temp(request: Request, runtime: Runtime, payload: EmptyAction = Body(default_factory=EmptyAction)):
    service = ProjectService(runtime)
    try:
        return service.create_new_temp()
    except RuntimeError as exc:
        return json_error(str(exc), 409)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/project/open", operation_id="project_open", response_model=ProjectResponse, response_model_exclude_unset=True
)
def project_open(request: Request, runtime: Runtime, payload: ProjectPathRequest):
    service = ProjectService(runtime)
    try:
        return service.open_project(payload)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except RuntimeError as exc:
        return json_error(str(exc), 409)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/project/save-as",
    operation_id="project_save_as",
    response_model=AcceptedJobResponse | ProjectResponse,
    response_model_exclude_unset=True,
)
def project_save_as(request: Request, runtime: Runtime, response: Response, payload: ProjectSaveRequest):
    service = ProjectService(runtime)
    try:
        body, status_code = service.save_project_as(payload)
        response.status_code = status_code
        return body
    except ValueError as exc:
        return json_error(str(exc), 400)
    except RuntimeError as exc:
        return json_error(str(exc), 409)
    except Exception as exc:
        return json_error(str(exc), 500)
