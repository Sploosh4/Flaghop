from app.contracts.actions.jobs import JobOutcome
import datetime
import logging
import itertools
import threading
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional


class WebJobManager:
    def __init__(
        self,
        max_jobs: int = 200,
        worker_count: int = 1,
        on_change: Optional[Callable[[Dict[str, Any], str], None]] = None,
    ):
        self.max_jobs = max(20, int(max_jobs))
        self.worker_count = max(1, int(worker_count))
        self._on_change = on_change if callable(on_change) else None
        self._lock = threading.Lock()
        self._queue_cv = threading.Condition(self._lock)
        self._counter = itertools.count(1)
        self._jobs: List[Dict[str, Any]] = []
        self._jobs_by_id: Dict[int, Dict[str, Any]] = {}
        self._pending_job_ids: List[int] = []
        self._runners: Dict[int, Callable[[], Dict[str, Any]]] = {}
        self._completion_callbacks = {}
        self._workers: List[threading.Thread] = []
        self._running_job_count = 0
        self._running_exclusive_job_id = 0

        self.ensure_worker_count(self.worker_count)

    def start(
        self,
        job_type: str,
        runner: Callable[[], Dict[str, Any]],
        payload: Optional[Dict[str, Any]] = None,
        queue_front: bool = False,
        exclusive: bool = False,
        on_finish=None,
    ):
        job_id = next(self._counter)
        now = self._utc_now()
        job = {
            "id": job_id,
            "type": str(job_type),
            "status": "queued",
            "exclusive": bool(exclusive),
            "cancel_requested": False,
            "cancel_reason": "",
            "created_at": now,
            "started_at": "",
            "finished_at": "",
            "payload": payload or {},
            "result": {},
            "error": "",
        }
        with self._queue_cv:
            if sum(row["status"] in {"queued", "running"} for row in self._jobs) >= self.max_jobs:
                raise RuntimeError(f"Job queue is full ({self.max_jobs} active jobs). Wait or cancel queued work.")
            self._jobs.append(job)
            self._jobs_by_id[job_id] = job
            self._runners[job_id] = runner
            if callable(on_finish):
                self._completion_callbacks[job_id] = on_finish
            if queue_front:
                self._pending_job_ids.insert(0, job_id)
            else:
                self._pending_job_ids.append(job_id)
            self._trim_locked()
            self._queue_cv.notify_all()
        copied = self._copy_job(job)
        self._notify_change(copied, "queued")
        return copied

    def list_jobs(self, limit: int = 80) -> List[Dict[str, Any]]:
        limit = max(1, min(int(limit), self.max_jobs))
        with self._lock:
            active_statuses = {"queued", "running"}
            active_jobs = [
                job for job in self._jobs if str(job.get("status", "") or "").strip().lower() in active_statuses
            ]
            inactive_jobs = [
                job for job in self._jobs if str(job.get("status", "") or "").strip().lower() not in active_statuses
            ]
            selected = list(reversed(active_jobs)) + list(reversed(inactive_jobs[-limit:]))
            return [self._copy_job(item) for item in selected]

    def ensure_worker_count(self, worker_count: int) -> Dict[str, Any]:
        requested = max(1, int(worker_count))
        with self._queue_cv:
            before = len(self._workers)
            current = before
            if requested > current:
                for worker_index in range(current + 1, requested + 1):
                    self._spawn_worker(worker_index)
                current = len(self._workers)

            # Shrinking workers is not supported in-place because workers are daemon loops.
            effective = current
            self.worker_count = effective
            self._queue_cv.notify_all()
            return {
                "requested": int(requested),
                "effective": int(effective),
                "increased": requested > before,
                "decrease_deferred": requested < effective,
            }

    def ensure_max_jobs(self, max_jobs: int) -> Dict[str, Any]:
        requested = max(20, int(max_jobs))
        with self._queue_cv:
            before = int(self.max_jobs)
            self.max_jobs = requested
            self._trim_locked()
            self._queue_cv.notify_all()
            return {
                "requested": int(requested),
                "effective": int(self.max_jobs),
                "changed": int(before) != int(self.max_jobs),
            }

    def get_job(self, job_id: int) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs_by_id.get(int(job_id))
            if job is None:
                return None
            return self._copy_job(job)

    def cancel_job(self, job_id: int, reason: str = "cancelled by user") -> Optional[Dict[str, Any]]:
        target_id = int(job_id)
        cancel_reason = str(reason or "cancelled by user")
        with self._queue_cv:
            job = self._jobs_by_id.get(target_id)
            if job is None:
                return None
            status = job["status"]
            if status not in {"queued", "running"} or job.get("_settling"):
                return self._copy_job(job)
            job["cancel_requested"] = True
            job["cancel_reason"] = cancel_reason
            queued = status == "queued"
            if queued:
                self._pending_job_ids.remove(target_id)
                self._runners.pop(target_id, None)
                job["_settling"] = True
            copied = self._copy_job(job)
        if queued:
            return self._settle(target_id, "cancelled", {}, cancel_reason, running=False)
        self._notify_change(copied, "cancel_requested")
        return copied

    def is_cancel_requested(self, job_id: int) -> bool:
        target_id = int(job_id)
        with self._lock:
            job = self._jobs_by_id.get(target_id)
            if not job:
                return False
            return bool(job.get("cancel_requested", False))

    def _worker_loop(self):
        while True:
            started_job = None
            with self._queue_cv:
                selected = None
                while selected is None:
                    selected = self._dequeue_next_runnable_locked()
                    if selected is not None:
                        break
                    self._queue_cv.wait()

                job_id, runner = selected
                job = self._jobs_by_id.get(job_id)
                if not job:
                    continue
                started_job = self._copy_job(job)

            if started_job is not None:
                self._notify_change(started_job, "running")

            try:
                result = runner() or {}
                status = result.status if isinstance(result, JobOutcome) else "completed"
                error = result.error if isinstance(result, JobOutcome) else ""
                result = result.result if isinstance(result, JobOutcome) else result
                if not isinstance(result, dict):
                    raise TypeError("Job runner must return a result dictionary or JobOutcome.")
            except Exception as exc:
                from app.services.project_networks import NetworkHeld

                status = "held" if isinstance(exc, NetworkHeld) else "failed"
                result, error = {}, str(exc)
            self._settle(job_id, status, result, error, running=True)

    def _settle(self, job_id, status, result, error, *, running):
        """Keep the job active and its exclusive slot until persistence finishes.

        Callbacks run without the queue lock: they may need domain/project locks,
        and can safely query this manager. A failed callback is a failed job,
        with the execution outcome retained separately for diagnosis.
        """
        with self._lock:
            job = self._jobs_by_id[job_id]
            job["_settling"] = True
            candidate = self._copy_job(job)
            if job.get("cancel_requested"):
                status, error = "cancelled", error or job.get("cancel_reason") or "cancelled by user"
            candidate.update(status=status, result=result, error=error, finished_at=self._utc_now())
            callback = self._completion_callbacks.pop(job_id, None)
        if callback:
            try:
                callback(self._copy_job(candidate))
            except Exception as exc:
                logging.getLogger(__name__).exception("Job result persistence failed for job %s", job_id)
                candidate["result"] = {
                    **candidate["result"],
                    "execution_status": candidate["status"],
                    "persistence_error": str(exc),
                }
                candidate.update(status="failed", error=f"Result persistence failed: {exc}")
        with self._queue_cv:
            job.update(candidate)
            job.pop("_settling", None)
            if running:
                self._running_job_count -= 1
                if self._running_exclusive_job_id == job_id:
                    self._running_exclusive_job_id = 0
            copied = self._copy_job(job)
            self._trim_locked()
            self._queue_cv.notify_all()
        self._notify_change(copied, copied["status"])
        return copied

    def _dequeue_next_runnable_locked(self):
        while self._pending_job_ids:
            job_id = int(self._pending_job_ids[0])
            job = self._jobs_by_id.get(job_id)
            runner = self._runners.get(job_id)

            if not job or runner is None:
                self._pending_job_ids.pop(0)
                if job_id in self._runners:
                    del self._runners[job_id]
                continue

            status = str(job.get("status", "") or "").strip().lower()
            if status != "queued":
                self._pending_job_ids.pop(0)
                if job_id in self._runners:
                    del self._runners[job_id]
                continue

            if self._running_exclusive_job_id:
                return None

            if bool(job.get("exclusive", False)):
                if int(self._running_job_count) > 0:
                    return None
                self._pending_job_ids.pop(0)
                self._runners.pop(job_id, None)
                self._running_job_count += 1
                self._running_exclusive_job_id = int(job_id)
                job["status"] = "running"
                job["started_at"] = self._utc_now()
                return int(job_id), runner

            self._pending_job_ids.pop(0)
            self._runners.pop(job_id, None)
            self._running_job_count += 1
            job["status"] = "running"
            job["started_at"] = self._utc_now()
            return int(job_id), runner

        return None

    def _spawn_worker(self, worker_index: int):
        thread = threading.Thread(
            target=self._worker_loop,
            daemon=True,
            name=f"legion-web-job-{int(worker_index)}",
        )
        thread.start()
        self._workers.append(thread)

    def _trim_locked(self):
        while len(self._jobs) > self.max_jobs:
            drop_index = None
            for idx, candidate in enumerate(self._jobs):
                status = str(candidate.get("status", "") or "").strip().lower()
                if status in {"queued", "running"}:
                    continue
                drop_index = idx
                break

            if drop_index is None:
                break

            dropped = self._jobs.pop(drop_index)
            dropped_id = dropped.get("id")
            if dropped_id in self._jobs_by_id:
                del self._jobs_by_id[dropped_id]
            if dropped_id in self._runners:
                del self._runners[dropped_id]
            if dropped_id in self._pending_job_ids:
                self._pending_job_ids.remove(dropped_id)

    @staticmethod
    def _copy_job(job: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": job.get("id"),
            "type": job.get("type", ""),
            "status": job.get("status", ""),
            "exclusive": bool(job.get("exclusive", False)),
            "settling": bool(job.get("_settling", False)),
            "cancel_requested": bool(job.get("cancel_requested", False)),
            "cancel_reason": job.get("cancel_reason", ""),
            "created_at": job.get("created_at", ""),
            "started_at": job.get("started_at", ""),
            "finished_at": job.get("finished_at", ""),
            "payload": dict(job.get("payload", {})),
            "result": dict(job.get("result", {})),
            "error": job.get("error", ""),
        }

    @staticmethod
    def _utc_now() -> str:
        return datetime.datetime.now(datetime.timezone.utc).isoformat()

    def _notify_change(self, job: Optional[Dict[str, Any]], event_name: str):
        if job is None:
            return
        if self._on_change is not None:
            try:
                self._on_change(dict(job), str(event_name or "updated"))
            except Exception:
                logging.getLogger(__name__).exception("Job change callback failed for job %s", job.get("id"))
