"""Workspace operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict, List
from app.web import runtime_workspace as web_runtime_workspace


class WorkspaceRuntime:
    get_workspace_overview = web_runtime_workspace.get_workspace_overview

    get_target_state_view = web_runtime_workspace.get_target_state_view

    get_findings = web_runtime_workspace.get_findings

    _host_is_down = staticmethod(web_runtime_workspace.host_is_down)

    @staticmethod
    def _workspace_host_services(port_rows: List[Any], service_repo: Any) -> List[str]:
        return web_runtime_workspace.workspace_host_services(None, port_rows, service_repo)

    _resolve_host_device_categories = web_runtime_workspace.resolve_host_device_categories

    def _build_workspace_host_row(self, host: Any, port_repo: Any, service_repo: Any, project: Any) -> Dict[str, Any]:
        return web_runtime_workspace.build_workspace_host_row(self, host, port_repo, service_repo, project)

    get_workspace_hosts = web_runtime_workspace.get_workspace_hosts

    get_workspace_services = web_runtime_workspace.get_workspace_services

    _strip_nmap_preamble = staticmethod(web_runtime_workspace.strip_nmap_preamble)

    @classmethod
    def _host_detail_script_preview(cls, script_id: str, output_text: str, max_chars: int = 220) -> str:
        return web_runtime_workspace.host_detail_script_preview(
            script_id,
            output_text,
            max_chars=max_chars,
        )

    get_host_workspace = web_runtime_workspace.get_host_workspace

    update_host_note = web_runtime_workspace.update_host_note

    update_host_categories = web_runtime_workspace.update_host_categories

    delete_host_workspace = web_runtime_workspace.delete_host_workspace

    create_script_entry = web_runtime_workspace.create_script_entry

    delete_script_entry = web_runtime_workspace.delete_script_entry

    get_script_output = web_runtime_workspace.get_script_output

    _summary = web_runtime_workspace.summary

    _hosts = web_runtime_workspace.hosts

    _ensure_workspace_settings_table = web_runtime_workspace.ensure_workspace_settings_table

    _get_workspace_setting_locked = web_runtime_workspace.get_workspace_setting_locked

    _set_workspace_setting_locked = web_runtime_workspace.set_workspace_setting_locked

    _resolve_host = web_runtime_workspace.resolve_host

    def _load_cves_for_host(self, project, host_id: int) -> List[Dict[str, Any]]:
        return web_runtime_workspace.load_cves_for_host(project, host_id)

    _hostname_for_ip = web_runtime_workspace.hostname_for_ip

    _service_name_for_target = web_runtime_workspace.service_name_for_target
