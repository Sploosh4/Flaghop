"""Read-only inspection of current workspace action sources."""

from app.capabilities.catalog import catalog_sources, inspect_sources


def inspect_workspace(runtime):
    with runtime._lock:
        if not getattr(runtime.logic, "activeProject", None):
            return {"status": "no_active_project", "integrations": [], "actions": [], "pipettes": [], "categories": []}
        from app.web.runtime_tool_catalog import _is_supported_tool

        sources = catalog_sources(
            runtime._get_settings(), runtime.scheduler_config.get_dangerous_categories(), _is_supported_tool
        )
        return {"status": "ok", **inspect_sources(sources)}
