"""Prepare a whole restore before committing its workspace/catalog ownership."""

import copy
import hashlib
import os
from pathlib import Path
import shutil
import sqlite3
import uuid
from contextlib import closing
from app.services.project_background import atomic_json
from app.services.storage_admission import StorageAdmission
from app.scanning.history_identity import rebind_history


def merge_documents(root):
    documents = root / "project-documents"
    if not documents.exists():
        return
    for source in list(documents.rglob("*")):
        if source.is_symlink():
            raise ValueError("Linked project documents are unsupported.")
        relative = source.relative_to(documents)
        if any(part.startswith(".") for part in relative.parts) or ".legion" in relative.name:
            raise ValueError("Invalid project document path in ZIP.")
        if source.is_dir():
            continue
        if relative.as_posix() in {"reader-control.json", "reader-alerts.json"}:
            continue
        destination = root / relative
        if destination.exists():
            if (
                not destination.is_file()
                or hashlib.sha256(source.read_bytes()).digest() != hashlib.sha256(destination.read_bytes()).digest()
            ):
                raise ValueError("Project documents collide with bundled workspace evidence.")
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            source.replace(destination)
    shutil.rmtree(documents)


def move_owned_tree(source, destination, admission):
    """One rename on the same filesystem; otherwise reserve the real target."""
    files = [p for p in source.rglob("*") if p.is_file()]
    same_device = source.stat().st_dev == destination.stat().st_dev
    amount = 0 if same_device else sum(p.stat().st_size + 8192 for p in files) + 32768
    lease = admission.reserve(amount, destination)
    try:
        if same_device:
            os.replace(source, destination)
        else:
            for path in files:
                target = destination / path.relative_to(source)
                target.parent.mkdir(parents=True, exist_ok=True)
                with path.open("rb") as src, target.open("xb") as dst:
                    while chunk := src.read(65536):
                        lease.write(dst, chunk)
            shutil.rmtree(source)
    finally:
        lease.close()


def restore_into_hub(hub, path):
    from app.web.runtime_project_bundle_archive import extract_project_bundle_zip
    from app.web.runtime_project_bundle_rebase import rebase_restored_project_paths
    from app.web.runtime_project_bundle_restore import attach_restored_running_folder_locked, close_project_instance
    from app.services.project_hub import project_name

    runtime = hub.runtime
    admission = getattr(runtime, "storage_admission", None) or StorageAdmission()
    with hub.lock:
        hub._check_idle()
        original_path = hub._current().get("name")
    restored = extract_project_bundle_zip(path, admission)
    staging = Path(restored["restore_root"])
    destination = None
    opened = None
    committed = False
    preserve_failed = False
    backup = None
    catalog_existed = False
    previous = None
    try:
        merge_documents(staging)
        # Every byte is now prepared. Cleanup errors happen before adoption,
        # never after reporting a newly active project as if nothing changed.
        admission.release_upload(path)
        project_file = Path(restored["project_path"])
        try:
            with closing(sqlite3.connect(project_file)) as db:
                if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                    raise ValueError("Restored workspace database is invalid.")
                table = db.execute("SELECT name FROM sqlite_master WHERE name='legion_workspace_metadata'").fetchone()
                name = (
                    db.execute("SELECT value FROM legion_workspace_metadata WHERE key='display_name'").fetchone()
                    if table
                    else None
                )
        except sqlite3.DatabaseError as exc:
            raise ValueError("Restored workspace database is invalid.") from exc
        label = project_name(name[0] if name and name[0] else project_file.stem)
        atomic_json(staging / "reader-control.json", {"running": False, "pause_policy": "finish-bounded-step"})
        with hub.lock:
            hub._check_idle()
            if hub._current().get("name") != original_path:
                raise RuntimeError("Active project changed while preparing the restore; no project was adopted.")
            before = copy.deepcopy(hub._read())
            destination = hub._folder(label)
            move_owned_tree(staging, destination, admission)
            project_path = destination / project_file.name
            output = destination / Path(restored["output_folder"]).name
            running = destination / Path(restored["running_folder"]).name
            rebase_restored_project_paths(
                project_path=str(project_path),
                manifest=restored["manifest"],
                output_folder=str(output),
                running_folder=str(running),
            )
            owner = uuid.uuid4().hex
            record = {
                "id": owner,
                "name": label,
                "path": str(project_path),
                "folder": str(destination),
                "managed": True,
                "vpn": "inherit",
                "connector": "networkmanager",
            }
            previous = runtime.logic.activeProject
            opened = runtime.logic.projectManager.openExistingProject(str(project_path), projectType="legion")
            try:
                runtime.logic.activeProject = opened
                attach_restored_running_folder_locked(runtime, str(running))
                runtime._ensure_scheduler_table()
                runtime._ensure_scheduler_approval_store()
                runtime._ensure_process_tables()
                rebind_history(opened, owner, copied=True, admission=admission)
                details = hub._current()
                data = copy.deepcopy(before)
                # Preserve an unsaved previous workspace as a recoverable entry;
                # successful restore does not silently discard its original files.
                if (
                    previous is not None
                    and previous.properties.isTemporary
                    and not any(row["path"] == original_path for row in data["projects"])
                ):
                    data["projects"].append(hub._legacy({"name": original_path, "display_name": "Before restore"}))
                data["projects"].append(record)
                data["active_project"] = owner
                catalog_existed = hub.config_path.exists()
                backup = hub.config_path.with_name(".restore-before-" + uuid.uuid4().hex)
                if catalog_existed:
                    shutil.copy2(hub.config_path, backup)
                hub._write(data)
                committed = True
            except BaseException:
                runtime.logic.activeProject = previous
                opened.database.dispose()
                opened = None
                if backup is not None:
                    try:
                        if catalog_existed:
                            os.replace(backup, hub.config_path)
                        else:
                            hub.config_path.unlink(missing_ok=True)
                    except OSError:
                        preserve_failed = True
                        raise RuntimeError(
                            "Restore failed; both workspaces and the catalog backup were preserved for recovery."
                        )
                raise
            if previous is not None and previous is not opened:
                if previous.properties.isTemporary:
                    previous.database.dispose()
                else:
                    close_project_instance(runtime, previous)
        return {
            "project": record,
            "workspace": details,
            "restored": {
                "restore_root": str(destination),
                "project_path": str(project_path),
                "output_folder": str(output),
                "running_folder": str(running),
                "manifest_project_file": str(restored["manifest"].get("project_file", "")),
                "manifest_format": str(restored["manifest"].get("format", "")),
            },
        }
    finally:
        if not committed:
            if opened is not None:
                opened.database.dispose()
            if destination is not None and destination.exists() and not preserve_failed:
                shutil.rmtree(destination)
        if backup is not None and backup.exists() and not preserve_failed:
            backup.unlink()
        if staging.exists():
            shutil.rmtree(staging)
