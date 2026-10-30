"""Web adapter for the scheduler evidence repository."""

from types import SimpleNamespace
from app.scheduler.context.repository import HostEvidenceRepository


def load_scheduler_host_evidence(runtime, **target):
    workspace = getattr(runtime, "workspace", None)
    if workspace is None:
        workspace = SimpleNamespace(lock=runtime._lock, active_project=getattr(runtime.logic, "activeProject", None))
    return HostEvidenceRepository(workspace, runtime.scheduler_config, runtime._load_cves_for_host).load(**target)
