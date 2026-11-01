"""Workspace and autosave state, independent of HTTP and process execution."""

import threading
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AutosaveState:
    lock: Any = field(default_factory=threading.Lock)
    next_due_monotonic: float = 0.0
    last_job_id: int = 0
    last_saved_at: str = ""
    last_path: str = ""
    last_error: str = ""


@dataclass
class WorkspaceSession:
    logic: Any = None
    lock: Any = field(default_factory=threading.RLock)
    autosave: AutosaveState = field(default_factory=AutosaveState)
    save_in_progress: bool = False

    @property
    def active_project(self):
        return getattr(self.logic, "activeProject", None)

    def require_active(self):
        project = self.active_project
        if project is None:
            raise RuntimeError("No active project is loaded.")
        return project
