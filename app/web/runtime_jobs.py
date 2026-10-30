from __future__ import annotations

from typing import Any, Dict, Optional


def emit_ui_invalidation(runtime, *channels, throttle_seconds=0.0):
    return _event_stream(runtime).emit(*channels, throttle_seconds=throttle_seconds)


def wait_for_ui_event(runtime, after_seq=0, timeout_seconds=30.0):
    return _event_stream(runtime).wait(after_seq, timeout_seconds)


def handle_job_change(runtime, job: Dict[str, Any], event_name: str):
    _ = event_name
    channels = {"jobs", "overview"}
    job_type = str(job.get("type", "") or "").strip().lower()
    if job_type in {
        "nmap-scan",
        "import-nmap-xml",
        "scheduler-run",
        "scheduler-approval-execute",
        "scheduler-dig-deeper",
        "tool-run",
        "process-retry",
        "credential-capture-session",
    }:
        channels.add("processes")
    if job_type in {"credential-capture-session"}:
        channels.add("credential_capture")
    if job_type in {"nmap-scan", "import-nmap-xml", "project-restore-zip"}:
        channels.update({"scan_history", "hosts", "services", "graph"})
    emit_ui_invalidation(runtime, *sorted(channels))


def start_job(
    runtime,
    job_type: str,
    runner_with_job_id,
    *,
    payload: Optional[Dict[str, Any]] = None,
    queue_front: bool = False,
    exclusive: bool = False,
) -> Dict[str, Any]:
    if not callable(runner_with_job_id):
        raise ValueError("runner_with_job_id must be callable.")

    job_ref = {"id": 0}

    def _wrapped_runner():
        return runner_with_job_id(int(job_ref.get("id", 0) or 0)) or {}

    job = runtime.jobs.start(
        str(job_type),
        _wrapped_runner,
        payload=dict(payload or {}),
        queue_front=bool(queue_front),
        exclusive=bool(exclusive),
    )
    job_ref["id"] = int(job.get("id", 0) or 0)
    return job


def find_active_job(runtime, *, job_type: str, host_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
    for job in runtime.jobs.list_jobs(limit=200):
        if str(job.get("type", "")).strip() != str(job_type or "").strip():
            continue
        status = str(job.get("status", "")).strip().lower()
        if status not in {"queued", "running"}:
            continue
        if host_id is None:
            return job
        payload = job.get("payload", {}) if isinstance(job.get("payload", {}), dict) else {}
        try:
            payload_host_id = int(payload.get("host_id", 0) or 0)
        except (TypeError, ValueError):
            payload_host_id = 0
        if payload_host_id == int(host_id):
            return job
    return None


def _event_stream(runtime):
    from app.services.events import EventStream

    stream = getattr(runtime, "events", None)
    if stream is None:
        stream = EventStream()
        runtime.events = stream
    return stream
