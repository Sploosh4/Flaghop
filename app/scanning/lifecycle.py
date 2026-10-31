"""Persist terminal states even when a queued scan is cancelled or held before launch."""

import json
from app.services.project_background import ProjectBackground, atomic_json

TERMINAL = {"completed", "partial", "failed", "cancelled", "held", "planned", "interrupted"}


def settled(owner, job):
    with owner.hub.lock:
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
        atomic_json(path, record)
