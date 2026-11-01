"""Jobs operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_jobs as web_runtime_jobs


class JobsRuntime:
    def _emit_ui_invalidation(self, *channels: str, throttle_seconds: float = 0.0):
        return web_runtime_jobs.emit_ui_invalidation(
            self,
            *channels,
            throttle_seconds=throttle_seconds,
        )

    wait_for_ui_event = web_runtime_jobs.wait_for_ui_event

    _handle_job_change = web_runtime_jobs.handle_job_change

    _start_job = web_runtime_jobs.start_job

    _find_active_job = web_runtime_jobs.find_active_job
