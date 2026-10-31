from __future__ import annotations

import os
from typing import Any, Dict, Optional

from app.pipettes import find_pipette
from app.scheduler.planner import SchedulerPlanner
from app.command_targets import apply_preferred_target_placeholders
from app.settings import AppSettings, Settings
from app.timing import getTimestamp
from app.web.runtime_tool_catalog import (
    get_workspace_tool_targets,
    get_workspace_tools,
    get_workspace_tools_page,
    tool_run_stats,
    workspace_tools_rows,
)


def get_settings(runtime) -> Settings:
    return runtime.settings


def find_port_action(settings: Settings, tool_id: str):
    for action in settings.portActions:
        if str(action[1]) == str(tool_id):
            return action
    pipette = find_pipette(tool_id)
    if pipette is not None:
        return pipette.as_port_action()
    return None


def find_command_template_for_tool(runtime, settings: Settings, tool_id: str) -> str:
    action = find_port_action(settings, tool_id)
    if not action:
        return ""
    return str(action[2])


def build_command(
    runtime,
    template: str,
    host_ip: str,
    port: str,
    protocol: str,
    tool_id: str,
    service_name: str = "",
):
    project = runtime._require_active_project()
    running_folder = project.properties.runningFolder
    outputfile = os.path.join(running_folder, f"{getTimestamp()}-{tool_id}-{host_ip}-{port}")
    outputfile = os.path.normpath(outputfile).replace("\\", "/")

    command = str(template or "")
    resolved_service_name = str(service_name or "").strip() or runtime._service_name_for_target(host_ip, port, protocol)
    if "nmap" in str(command).lower():
        command = AppSettings._ensure_nmap_stats_every(command)
    hostname = runtime._hostname_for_ip(host_ip)
    command, target_host = apply_preferred_target_placeholders(
        command,
        hostname=hostname,
        ip=str(host_ip),
        port=str(port),
        output=outputfile,
        service_name=resolved_service_name,
    )
    command = AppSettings._collapse_redundant_fallbacks(command)
    command = AppSettings._ensure_nmap_hostname_target_support(command, target_host)
    command = AppSettings._ensure_nmap_output_argument(command, outputfile)
    if "nmap" in command and str(protocol).lower() == "udp":
        command = command.replace("-sV", "-sVU")
    return command, outputfile


def start_tool_run_job(
    runtime,
    host_ip: str,
    port: str,
    protocol: str,
    tool_id: str,
    timeout: int = 300,
    parameters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    resolved_host_ip = str(host_ip or "").strip()
    resolved_port = str(port or "").strip()
    resolved_protocol = str(protocol or "tcp").strip().lower() or "tcp"
    resolved_tool_id = str(tool_id or "").strip()
    if not resolved_host_ip or not resolved_port or not resolved_tool_id:
        raise ValueError("host_ip, port and tool_id are required.")
    pipette = find_pipette(resolved_tool_id)
    resolved_parameters = pipette.validate_parameter_values(parameters) if pipette is not None else {}

    payload = {
        "host_ip": resolved_host_ip,
        "port": resolved_port,
        "protocol": resolved_protocol,
        "tool_id": resolved_tool_id,
        "timeout": int(timeout),
    }
    if resolved_parameters:
        payload["parameters"] = dict(resolved_parameters)

    return runtime._start_job(
        "tool-run",
        lambda job_id: run_manual_tool(
            runtime,
            host_ip=resolved_host_ip,
            port=resolved_port,
            protocol=resolved_protocol,
            tool_id=resolved_tool_id,
            timeout=int(timeout),
            parameters=resolved_parameters,
            job_id=int(job_id or 0),
        ),
        payload=payload,
    )


def run_manual_tool(
    runtime,
    host_ip: str,
    port: str,
    protocol: str,
    tool_id: str,
    timeout: int,
    parameters: Optional[Dict[str, Any]] = None,
    job_id: int = 0,
):
    with runtime._lock:
        runtime._require_active_project()
        settings = runtime._get_settings()
        action = runtime._find_port_action(settings, tool_id)
        if action is None:
            raise KeyError(f"Unknown tool id: {tool_id}")

        label = str(action[0])
        template = str(action[2])
        pipette = find_pipette(tool_id)
        if pipette is not None:
            template = pipette.command_template_for_values(parameters)
        command, outputfile = runtime._build_command(template, host_ip, port, protocol, tool_id)

    executed, reason, process_id = runtime._run_command_with_tracking(
        tool_name=tool_id,
        tab_title=f"{tool_id} ({port}/{protocol})",
        host_ip=host_ip,
        port=port,
        protocol=protocol,
        command=command,
        outputfile=outputfile,
        timeout=int(timeout),
        job_id=int(job_id or 0),
    )

    return {
        "tool_id": tool_id,
        "label": label,
        "host_ip": host_ip,
        "port": str(port),
        "protocol": str(protocol),
        "command": command,
        "outputfile": outputfile,
        "executed": bool(executed),
        "reason": reason,
        "process_id": process_id,
    }


def runner_type_for_tool(runtime, tool_id, command_template=""):
    return "local"


def runner_type_for_approval_item(runtime, item):
    return "local"
