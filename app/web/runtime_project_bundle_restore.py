from __future__ import annotations

import os
import shutil
from app.services.storage_admission import StorageAdmission
from typing import Any, Dict

from app.web import runtime_project_bundle_archive as web_runtime_project_bundle_archive
from app.web import runtime_project_bundle_rebase as web_runtime_project_bundle_rebase


def start_restore_project_zip_job(runtime, path: str) -> Dict[str, Any]:
    zip_path = web_runtime_project_bundle_archive.normalize_existing_file(path)
    admission = getattr(runtime, "storage_admission", None) or StorageAdmission()
    return runtime._start_job(
        "project-restore-zip",
        lambda _job_id: restore_project_bundle_zip_job(runtime, zip_path, cleanup_source=True),
        payload={"path": zip_path},
        queue_front=True,
        exclusive=True,
        on_finish=lambda _job: admission.release_upload(zip_path),
    )


def restore_project_bundle_zip(runtime, path: str) -> Dict[str, Any]:
    zip_path = web_runtime_project_bundle_archive.normalize_existing_file(path)
    return restore_project_bundle_zip_job(runtime, zip_path, cleanup_source=False)


def restore_project_bundle_zip_job(runtime, zip_path: str, cleanup_source: bool) -> Dict[str, Any]:
    normalized = web_runtime_project_bundle_archive.normalize_existing_file(zip_path)
    try:
        return restore_project_bundle_zip_impl(runtime, normalized)
    finally:
        if cleanup_source:
            admission = getattr(runtime, "storage_admission", None) or StorageAdmission()
            admission.release_upload(normalized)


def restore_project_bundle_zip_impl(runtime, zip_path: str) -> Dict[str, Any]:
    from app.services.project_hub import ProjectHub

    hub = getattr(getattr(runtime, "project_networks", None), "hub", None) or ProjectHub(runtime)
    result = hub.operations.restore_zip(zip_path)
    return {"project": result["workspace"], "restored": result["restored"], "hub_project": result["project"]}


def close_project_instance(runtime, project) -> None:
    try:
        db = getattr(project, "database", None)
        if db and hasattr(db, "dispose"):
            db.dispose()
    except Exception:
        pass

    try:
        runtime.logic.projectManager.closeProject(project)
    except Exception:
        pass


def attach_restored_running_folder_locked(runtime, running_folder: str) -> None:
    project = getattr(runtime.logic, "activeProject", None)
    if project is None:
        return
    restored_running_folder = os.path.abspath(str(running_folder or "").strip())
    if not restored_running_folder:
        return
    os.makedirs(restored_running_folder, exist_ok=True)
    current_running_folder = str(getattr(project.properties, "runningFolder", "") or "").strip()
    if current_running_folder and os.path.abspath(current_running_folder) != restored_running_folder:
        try:
            shutil.rmtree(current_running_folder, ignore_errors=True)
        except Exception:
            pass
    if hasattr(project.properties, "_replace"):
        project.properties = project.properties._replace(runningFolder=restored_running_folder)
