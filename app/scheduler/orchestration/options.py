"""Local scheduler concurrency and timeout options."""

from app.scheduler.preferences import scheduler_max_concurrency, scheduler_max_host_concurrency
from app.contracts.actions.orchestration import SchedulerRunOptions


class Options:
    @staticmethod
    def _normalize_text_token(value):
        return str(value or "").strip().lower()

    def build_run_options(self, preferences=None, *, job_id=0):
        prefs = preferences if isinstance(preferences, dict) else self.config_manager.load()
        return SchedulerRunOptions(
            scheduler_concurrency=scheduler_max_concurrency(prefs),
            host_concurrency=scheduler_max_host_concurrency(prefs),
            job_id=int(job_id or 0),
        )
