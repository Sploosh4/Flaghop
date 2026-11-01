"""Rebind copied application metadata, never original scanner evidence or work."""

import copy
import hashlib
import json
from pathlib import Path
import re
from sqlalchemy import text
from app.contracts.observations.scanner import ScanSummary
from app.scanning.history import read_record
from app.services.project_background import atomic_json


def _rebase(summary, before, after):
    value = copy.deepcopy(summary)
    # Preserve every observation, unknown extension and original network/source
    # context. Only app-owned relative path fields change with the copy.
    for field in ("profile_path", "directory"):
        path = value.get(field, "")
        if path == before or path.startswith(before + "/"):
            value[field] = after + path[len(before) :]
    ScanSummary.model_validate(value)
    return value


def rebind_history(project, owner_id, *, copied=False, source_project="", admission=None):
    if copied:
        from app.services.process_history import reconcile

        reconcile(project, copied=True, owner_id=owner_id, source_project=source_project, admission=admission)
    root = Path(project.properties.projectName).parent
    folder = Path(project.properties.outputFolder) / "deep-scans"
    if not folder.is_dir():
        return
    if folder.is_symlink() or not folder.resolve().is_relative_to(root.resolve()):
        raise ValueError("Copied scanner history is outside its workspace.")
    for parent in folder.iterdir():
        if not re.fullmatch(r"[a-f0-9]{32}", parent.name) or parent.is_symlink() or not parent.is_dir():
            continue
        path = parent / "run.json"
        row = read_record(path)
        if row.get("id") != parent.name:
            raise ValueError("Copied scan identity differs from its directory.")
        old_directory, directory = row["directory"], parent.relative_to(root).as_posix()
        changed_owner = row.get("project_id") != owner_id
        if not changed_owner and old_directory == directory:
            continue
        if changed_owner:
            fields = (
                "project_id",
                "job_id",
                "network_context",
                "process_id",
                "execution_id",
                "source_identity",
                "status",
                "settlement",
                "profile_sha256",
            )
            row.setdefault("lineage", []).append({key: copy.deepcopy(row[key]) for key in fields if key in row})
            row.update(project_id=owner_id, job_id=0, inherited_history=True)
            for field in ("network_context", "process_id", "execution_id", "execution_identity"):
                row.pop(field, None)
            if row["status"] in {"queued", "running"} or row.get("settlement") == "pending":
                row.update(
                    status="interrupted",
                    settlement="interrupted",
                    reason="Copied unfinished history; no process was resumed.",
                    recovery={"policy": "never-replay", "state": "copied", "retry_available": False},
                )
        row["directory"] = directory
        for field in ("profile_path", "log_path", "implementation_audit_path"):
            value = row.get(field, "")
            if value.startswith(old_directory + "/"):
                row[field] = directory + value[len(old_directory) :]
        # run.json holds the compact polling shape. It must never replace the
        # complete DB result or summary.json, which contain additional evidence.
        if row.get("summary"):
            row["summary"] = _rebase(row["summary"], old_directory, directory)
        summary_path = parent / "summary.json"
        if summary_path.is_symlink():
            raise ValueError("Linked summary cannot be adopted.")
        full_file = read_record(summary_path) if summary_path.is_file() else None
        with project.database.engine.begin() as connection:
            exists = connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='flaghop_deep_scans'")
            ).scalar()
            stored = (
                connection.execute(
                    text("SELECT profile_sha256,summary FROM flaghop_deep_scans WHERE run_id=:id"), {"id": row["id"]}
                ).first()
                if exists
                else None
            )
            if stored:
                profile = parent / "profile/device-profile.json"
                if (
                    profile.is_symlink()
                    or not profile.is_file()
                    or profile.stat().st_size > 16 * 1024 * 1024
                    or hashlib.sha256(profile.read_bytes()).hexdigest() != stored[0]
                ):
                    raise ValueError("Copied profile bytes differ from their stored identity.")
                complete = json.loads(stored[1])
                if complete.get("profile_sha256") != stored[0] or (full_file is not None and full_file != complete):
                    raise ValueError("Copied full summary differs from its database evidence.")
                full_file = _rebase(complete, old_directory, directory)
                connection.execute(
                    text("UPDATE flaghop_deep_scans SET summary=:summary WHERE run_id=:id"),
                    {"id": row["id"], "summary": json.dumps(full_file)},
                )
            elif full_file is not None:
                full_file = _rebase(full_file, old_directory, directory)
            if full_file is not None:
                atomic_json(summary_path, full_file)
        atomic_json(path, row)
