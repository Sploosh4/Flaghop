"""Scheduler configuration, planning and orchestration have one application owner."""

from dataclasses import dataclass
from typing import Any
from app.scheduler.config import SchedulerConfigManager
from app.scheduler.planner import SchedulerPlanner
from app.scheduler.orchestrator import SchedulerOrchestrator


@dataclass
class SchedulerService:
    config: Any = None
    planner: Any = None
    orchestrator: Any = None

    @classmethod
    def create(cls):
        config = SchedulerConfigManager()
        planner = SchedulerPlanner(config)
        return cls(config, planner, SchedulerOrchestrator(config, planner))

    def run(self, **request):
        return self.orchestrator.run_targets(**request)
