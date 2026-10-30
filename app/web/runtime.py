from __future__ import annotations

import sys
import subprocess
import threading
from collections import defaultdict
from typing import Any, Dict, List

from app.scheduler.orchestrator import SchedulerOrchestrator
from app.scheduler.config import SchedulerConfigManager
from app.scheduler.planner import SchedulerPlanner
from app.settings import AppSettings, Settings
from app.web import runtime_credential_capture as web_runtime_credential_capture
from app.web import runtime_scans as web_runtime_scans
from app.web.jobs import WebJobManager


def _get_requests_module():
    try:
        import requests as requests_module
    except Exception as exc:  # pragma: no cover - depends on local environment packaging
        raise RuntimeError(
            f"requests dependency unavailable under {sys.executable} ({sys.version.split()[0]}): {exc}"
        ) from exc
    return requests_module


from app.web.runtime_domains.jobs import JobsRuntime
from app.web.runtime_domains.workspace import WorkspaceRuntime
from app.web.runtime_domains.status import StatusRuntime
from app.web.runtime_domains.scheduler_preferences import SchedulerPreferencesRuntime
from app.web.runtime_domains.credential_capture import CredentialCaptureRuntime
from app.web.runtime_domains.scheduler_execution import SchedulerExecutionRuntime
from app.web.runtime_domains.scheduler_context import SchedulerContextRuntime
from app.web.runtime_domains.projects import ProjectsRuntime
from app.web.runtime_domains.scheduler_evidence import SchedulerEvidenceRuntime
from app.web.runtime_domains.graph import GraphRuntime
from app.web.runtime_domains.artifacts import ArtifactsRuntime
from app.web.runtime_domains.settings import SettingsRuntime
from app.web.runtime_domains.processes import ProcessesRuntime
from app.web.runtime_domains.scans import ScansRuntime
from app.web.runtime_domains.screenshots import ScreenshotsRuntime
from app.web.runtime_domains.tools import ToolsRuntime
from app.web.runtime_domains.reports import ReportsRuntime
from app.web.runtime_domains.scheduler_state import SchedulerStateRuntime
from app.web.runtime_domains.execution import ExecutionRuntime


class WebRuntime(
    JobsRuntime,
    WorkspaceRuntime,
    StatusRuntime,
    SchedulerPreferencesRuntime,
    CredentialCaptureRuntime,
    SchedulerExecutionRuntime,
    SchedulerContextRuntime,
    ProjectsRuntime,
    SchedulerEvidenceRuntime,
    GraphRuntime,
    ArtifactsRuntime,
    SettingsRuntime,
    ProcessesRuntime,
    ScansRuntime,
    ScreenshotsRuntime,
    ToolsRuntime,
    ReportsRuntime,
    SchedulerStateRuntime,
    ExecutionRuntime,
):
    """Own the active workspace, worker lifecycle and domain operations."""

    INTERNAL_QUICK_RECON_TCP_PORTS = "80,81,88,111,135,139,443,445,515,591,593,623,631,2049,8000,8008,8010,8080,8081,8088,8443,8888,9000,9090,9100,9443,10443"
    RFC1918_COMPREHENSIVE_TCP_PORTS = "22,25,53,80,81,88,110,111,123,135,139,143,389,443,445,465,500,515,587,591,593,623,631,636,993,995,1025,1433,1521,2049,2375,2376,3000,3306,3389,5000,5432,5601,5672,5900,5985,5986,6379,7001,8000,8008,8010,8080,8081,8088,8443,8888,9000,9090,9100,9200,9443,10443,27017"
    RFC1918_SWEEP_CHUNK_PREFIX = 24
    RFC1918_SWEEP_BATCH_SIZE = 2
    RFC1918_SWEEP_MAX_CONCURRENCY = 4

    def __init__(self, logic):
        self.logic = logic
        self.scheduler_config = SchedulerConfigManager()
        self.scheduler_planner = SchedulerPlanner(self.scheduler_config)
        self.scheduler_orchestrator = SchedulerOrchestrator(self.scheduler_config, self.scheduler_planner)
        self.settings_file = AppSettings()
        self.settings = Settings(self.settings_file)
        self._ui_event_condition = threading.Condition()
        self._ui_event_seq = 0
        self._ui_events: List[Dict[str, Any]] = []
        self._ui_last_emit_monotonic: Dict[str, float] = defaultdict(float)
        scheduler_preferences = self.scheduler_config.load()
        job_workers = self._job_worker_count(scheduler_preferences)
        job_max = self._scheduler_max_jobs(scheduler_preferences)
        self.jobs = WebJobManager(max_jobs=job_max, worker_count=job_workers, on_change=self._handle_job_change)
        self._lock = threading.RLock()
        self._process_runtime_lock = threading.Lock()
        self._active_processes: Dict[int, subprocess.Popen] = {}
        self._kill_requests: set[int] = set()
        self._job_process_ids: Dict[int, set] = {}
        self._process_job_id: Dict[int, int] = {}
        self._save_in_progress = False
        self._autosave_lock = threading.Lock()
        self._autosave_next_due_monotonic = 0.0
        self._autosave_last_job_id = 0
        self._autosave_last_saved_at = ""
        self._autosave_last_path = ""
        self._autosave_last_error = ""

    def get_credential_capture_state(self, *, include_captures: bool = False) -> Dict[str, Any]:
        with self._lock:
            return web_runtime_credential_capture.credential_capture_state_locked(
                self,
                include_captures=include_captures,
            )

    @classmethod
    def _iter_rfc1918_scan_batches(cls, targets: List[str]):
        yield from web_runtime_scans.iter_rfc1918_scan_batches(cls, targets)

    @staticmethod
    def _split_csv(raw: str) -> List[str]:
        return [item.strip() for item in str(raw or "").split(",") if item.strip()]
