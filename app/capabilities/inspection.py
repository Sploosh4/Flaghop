"""Read-only inspection of current workspace action sources."""

from app.capabilities.catalog import catalog_sources, inspect_sources


def inspect_workspace(runtime):
    with runtime._lock:
        if not getattr(runtime.logic, "activeProject", None):
            return {"status": "no_active_project", "integrations": [], "actions": [], "pipettes": [], "categories": []}
        sources = catalog_sources(runtime._get_settings(), runtime.scheduler_config.get_dangerous_categories())
        return {"status": "ok", **inspect_sources(sources)}
