"""Thread-safe ownership of subprocess handles, cancellation and job membership."""

import threading
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ProcessRegistry:
    lock: Any = field(default_factory=threading.Lock)
    active: dict = field(default_factory=dict)
    kill_requests: set = field(default_factory=set)
    job_process_ids: dict = field(default_factory=dict)
    process_job_id: dict = field(default_factory=dict)

    def register(self, job_id, process_id):
        job_id, process_id = int(job_id or 0), int(process_id or 0)
        if job_id <= 0 or process_id <= 0:
            return
        with self.lock:
            self.job_process_ids.setdefault(job_id, set()).add(process_id)
            self.process_job_id[process_id] = job_id

    def unregister(self, process_id):
        with self.lock:
            job_id = self.process_job_id.pop(int(process_id), None)
            if job_id is None:
                return
            members = self.job_process_ids.get(job_id, set())
            members.discard(int(process_id))
            if not members:
                self.job_process_ids.pop(job_id, None)

    def members(self, job_id):
        with self.lock:
            return sorted(self.job_process_ids.get(int(job_id or 0), set()))
