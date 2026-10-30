"""Status operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_status as web_runtime_status


class StatusRuntime:
    get_workspace_processes = web_runtime_status.get_workspace_processes

    get_snapshot = web_runtime_status.get_snapshot
