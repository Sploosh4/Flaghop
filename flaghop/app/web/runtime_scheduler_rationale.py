"""Rationale from local rule decisions, without provider prompts or logs."""


def get_scheduler_rationale_feed(runtime, limit=18):
    with runtime._lock:
        return scheduler_rationale_feed_locked(runtime, limit=limit)


def scheduler_rationale_feed_locked(runtime, limit=18):
    project = getattr(runtime.logic, "activeProject", None)
    if project is None:
        return []
    return [
        {
            **row,
            "rationale": str(row.get("rationale", "") or row.get("reason", "")),
            "source": "local",
            "title": str(row.get("label", "") or row.get("tool_id", "")),
        }
        for row in runtime.get_scheduler_decisions(limit=max(1, min(int(limit), 48)))
    ]
