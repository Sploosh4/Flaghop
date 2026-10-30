"""Tools operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict
from app.web import runtime_tools as web_runtime_tools


class ToolsRuntime:
    start_tool_run_job = web_runtime_tools.start_tool_run_job

    _workspace_tools_rows = web_runtime_tools.workspace_tools_rows

    get_workspace_tool_targets = web_runtime_tools.get_workspace_tool_targets

    get_workspace_tools_page = web_runtime_tools.get_workspace_tools_page

    get_workspace_tools = web_runtime_tools.get_workspace_tools

    _run_manual_tool = web_runtime_tools.run_manual_tool

    def _tool_run_stats(self, project) -> Dict[str, Dict[str, Any]]:
        return web_runtime_tools.tool_run_stats(project)

    _get_settings = web_runtime_tools.get_settings

    _find_port_action = staticmethod(web_runtime_tools.find_port_action)

    _find_command_template_for_tool = web_runtime_tools.find_command_template_for_tool

    _runner_type_for_tool = web_runtime_tools.runner_type_for_tool

    _runner_type_for_approval_item = web_runtime_tools.runner_type_for_approval_item

    _build_command = web_runtime_tools.build_command
