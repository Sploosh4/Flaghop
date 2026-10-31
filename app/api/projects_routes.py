"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from typing import Any
from fastapi import Body, Request, File, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import tempfile
import shutil
from app.api.downloads import TemporaryFileResponse
from app.api.dependencies import Runtime, native_router
from app.web.http_utils import json_error
from app.web.services.project_service import ProjectService

router = native_router()


@router.get("/api/project/download-zip", response_class=FileResponse, operation_id="downloadWorkspaceZip")
def project_download_zip(runtime: Runtime):
    path, filename = runtime.build_project_bundle_zip()
    return TemporaryFileResponse(
        path,
        filename=filename,
        media_type="application/zip",
    )


@router.post("/api/project/restore-zip", operation_id="restoreWorkspaceZip")
def project_restore_zip(runtime: Runtime, bundle: UploadFile | None = File(default=None)):
    if bundle is None:
        return json_error("Field 'bundle' is required.", 400)
    if not str(bundle.filename or "").strip():
        return json_error("Uploaded bundle filename is required.", 400)
    with tempfile.NamedTemporaryFile(prefix="legion-restore-upload-", suffix=".zip", delete=False) as temporary:
        path = Path(temporary.name)
    handed_off = False
    try:
        with path.open("wb") as target:
            shutil.copyfileobj(bundle.file, target)
        if hasattr(runtime, "start_restore_project_zip_job"):
            job = runtime.start_restore_project_zip_job(str(path))
            handed_off = True
            return JSONResponse(jsonable_encoder({"status": "accepted", "job": job}), status_code=202)
        if hasattr(runtime, "restore_project_bundle_zip"):
            result = runtime.restore_project_bundle_zip(str(path))
            return {"status": "ok", "project": result.get("project", {}), "result": result}
        return json_error("Runtime does not support ZIP restore.", 501)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except RuntimeError as exc:
        return json_error(str(exc), 409)
    except Exception as exc:
        return json_error(str(exc), 500)
    finally:
        bundle.file.close()
        if not handed_off:
            path.unlink(missing_ok=True)


@router.get("/api/projects", operation_id="project_list")
def project_list(request: Request, runtime: Runtime):
    service = ProjectService(runtime)
    try:
        return service.list_projects(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/project/new-temp", operation_id="project_new_temp")
def project_new_temp(request: Request, runtime: Runtime):
    service = ProjectService(runtime)
    try:
        return service.create_new_temp()
    except RuntimeError as exc:
        return json_error(str(exc), 409)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/project/open", operation_id="project_open")
def project_open(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = ProjectService(runtime)
    try:
        return service.open_project(payload or {})
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except RuntimeError as exc:
        return json_error(str(exc), 409)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/project/save-as", operation_id="project_save_as")
def project_save_as(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = ProjectService(runtime)
    try:
        body, status_code = service.save_project_as(payload or {})
        return JSONResponse(jsonable_encoder(body), status_code=status_code)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except RuntimeError as exc:
        return json_error(str(exc), 409)
    except Exception as exc:
        return json_error(str(exc), 500)
