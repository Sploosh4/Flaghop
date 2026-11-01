from __future__ import annotations

import json
import shlex
from typing import Any, Dict, List, Optional

from app.device_categories import built_in_device_category_rules, device_category_options
from app.hostsfile import registrable_root_domain


def job_worker_count(preferences: Optional[Dict[str, Any]] = None) -> int:
    source = preferences if isinstance(preferences, dict) else {}
    try:
        value = int(source.get("max_concurrency", 1))
    except (TypeError, ValueError):
        value = 1
    return max(1, min(value, 8))


from app.scheduler.preferences import scheduler_max_concurrency as scheduler_max_concurrency


from app.scheduler.preferences import scheduler_max_host_concurrency as scheduler_max_host_concurrency


def scheduler_max_jobs(preferences: Optional[Dict[str, Any]] = None) -> int:
    source = preferences if isinstance(preferences, dict) else {}
    try:
        value = int(source.get("max_jobs", 200))
    except (TypeError, ValueError):
        value = 200
    return max(20, min(value, 2000))


def device_category_options_for_runtime(runtime) -> List[Dict[str, Any]]:
    return device_category_options(runtime.scheduler_config.get_device_categories())


def built_in_device_category_options() -> List[Dict[str, Any]]:
    return [
        {"id": str(item.get("id", "") or ""), "name": str(item.get("name", "") or ""), "built_in": True}
        for item in built_in_device_category_rules()
    ]


def is_host_scoped_scheduler_tool(tool_id):
    return False
