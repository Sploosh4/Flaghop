"""Persist terminal states even when a queued scan is cancelled or held before launch."""

import json
from app.services.project_background import ProjectBackground, atomic_json

TERMINAL = {"completed", "partial", "failed", "cancelled", "held", "planned", "interrupted"}


def settled(owner, job):
    with owner.hub.workspace(owner.identifier):
        # Resolve the catalog again in case the folder was moved after the job settled.
        current = ProjectBackground(owner.hub, owner.identifier)
        payload = job["payload"]
        parent = current.path(payload["directory"])
        path = parent / "run.json"
        record = json.loads(path.read_text())
        if record["id"] != payload["scan_id"] or record["project_id"] != owner.identifier:
            raise ValueError("Scan completion belongs to different evidence.")
        if record["status"] not in TERMINAL or job["status"] == "cancelled":
            record.update(status=job["status"], reason=job.get("error") or record.get("reason", ""))
        if not record.get("log_path") and record.get("reason"):
            (parent / "log.txt").write_text(record["reason"])
            record["log_path"] = str((parent / "log.txt").relative_to(current.root))
        record["settlement"] = "complete"
        atomic_json(path, record)


def reconcile(owner, path, record):
    """Recover metadata once; never replay a process from persisted argv.

    Queue IDs restart at one. Only an exact scan/project/type match belongs to
    this process. Original profiles and raw evidence are never changed here.
    """
    job = owner.hub.runtime.jobs.get_job(record["job_id"])
    payload = (job or {}).get("payload", {})
    matches = bool(
        job
        and job["type"] == "deep-scan"
        and payload.get("scan_id") == record["id"]
        and payload.get("project_id") == owner.identifier
    )
    if matches and job["status"] in {"queued", "running"}:
        # The worker may have written evidence while its completion callback is
        # still settling. Keep the public view active without downgrading disk.
        return {
            **record,
            "status": job["status"],
            "reason": job.get("error", ""),
            "settling": job.get("settling", False),
        }
    updated = dict(record)
    if matches and job.get("result", {}).get("persistence_error"):
        updated.update(status="failed", reason=job["error"], settlement="failed")
    elif record["status"] not in TERMINAL or record.get("settlement") == "pending":
        if matches:
            updated.update(status=job["status"], reason=job.get("error", ""))
        else:
            updated.update(
                status="interrupted",
                reason="App restarted before this scan recorded completion.",
                recovery={"policy": "never-replay", "previous_status": record["status"]},
                settlement="interrupted",
            )
    if updated != record:
        atomic_json(path, updated)
    return updated
