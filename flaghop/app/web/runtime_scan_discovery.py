from __future__ import annotations

import os
from types import SimpleNamespace
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse

from app.cli_utils import import_targets, import_targets_from_textfile
from app.scheduler.graph import rebuild_evidence_graph
from app.scheduler.state import build_attempted_action_entry
from app.timing import getTimestamp
from db.entities.port import portObj
from db.entities.service import serviceObj


def start_targets_import_job(runtime, path: str) -> Dict[str, Any]:
    file_path = runtime._normalize_existing_file(path)
    return runtime._start_job(
        "import-targets",
        lambda _job_id: runtime._import_targets_from_file(file_path),
        payload={"path": file_path},
    )


def import_targets_from_file(runtime, file_path: str) -> Dict[str, Any]:
    with runtime._lock:
        project = runtime._require_active_project()
        session = project.database.session()
        host_repo = project.repositoryContainer.hostRepository
        try:
            added = import_targets_from_textfile(session, host_repo, file_path)
        finally:
            session.close()
        return {
            "path": file_path,
            "added": int(added or 0),
        }


def import_discovered_hosts_into_project(runtime, discovered_hosts: List[str]) -> List[str]:
    targets = [str(item or "").strip() for item in list(discovered_hosts or []) if str(item or "").strip()]
    if not targets:
        return []
    with runtime._lock:
        project = runtime._require_active_project()
        session = project.database.session()
        host_repo = project.repositoryContainer.hostRepository
        try:
            added = import_targets(session, host_repo, targets)
        finally:
            session.close()
    return list(added or [])


def queue_discovered_host_followup_scan(runtime, targets: List[str]) -> Dict[str, Any]:
    target_list = [str(item or "").strip() for item in list(targets or []) if str(item or "").strip()]
    if not target_list:
        return {}
    scan_options = {
        "discovery": True,
        "skip_dns": False,
        "timing": "T3",
        "top_ports": 100,
        "service_detection": True,
        "default_scripts": True,
        "os_detection": False,
        "aggressive": False,
        "full_ports": False,
        "vuln_scripts": False,
        "host_discovery_only": False,
        "arp_ping": False,
    }
    return runtime.start_nmap_scan_job(
        targets=target_list,
        discovery=True,
        staged=False,
        run_actions=False,
        nmap_path="nmap",
        nmap_args="",
        scan_mode="easy",
        scan_options=scan_options,
    )


def resolve_host_by_token(runtime, host_token: str):
    token = str(host_token or "").strip()
    if not token:
        return None
    with runtime._lock:
        project = runtime._require_active_project()
        host_repo = project.repositoryContainer.hostRepository
        host = host_repo.getHostByIP(token)
        if host is None:
            host = host_repo.getHostByHostname(token)
        return host


def mark_discovered_host_origin(runtime, host_tokens: List[str], *, source_tool_id: str = ""):
    normalized_source = str(source_tool_id or "").strip().lower()
    if not normalized_source:
        return
    decision = SimpleNamespace(
        tool_id=normalized_source,
        label=normalized_source,
        action_id=normalized_source,
        family_id="",
        mode="deterministic",
        approval_state="approved",
        coverage_gap="",
        pack_ids=[],
    )
    command_template = "dnsmap [IP]" if normalized_source == "dnsmap" else normalized_source
    command_signature = runtime._command_signature_for_target(command_template, "tcp")
    attempted_at = getTimestamp(True)
    for host_token in list(host_tokens or []):
        host = resolve_host_by_token(runtime, str(host_token or "").strip())
        if host is None:
            continue
        host_id = int(getattr(host, "id", 0) or 0)
        if host_id <= 0:
            continue
        host_ip = str(getattr(host, "ip", "") or host_token or "").strip()
        hostname = str(getattr(host, "hostname", "") or host_ip).strip()
        runtime._persist_shared_target_state(
            host_id=host_id,
            host_ip=host_ip,
            hostname=hostname,
            protocol="tcp",
            scheduler_mode="deterministic",
            attempted_action=build_attempted_action_entry(
                decision=decision,
                status="executed",
                reason=f"discovered via {normalized_source}",
                attempted_at=attempted_at,
                port="",
                protocol="tcp",
                service="",
                command_signature=command_signature,
            ),
            raw={
                "discovered_via": normalized_source,
            },
        )


def ingest_discovered_hosts(runtime, discovered_hosts: List[str], *, source_tool_id: str = "") -> Dict[str, Any]:
    observed = [str(item or "").strip() for item in list(discovered_hosts or []) if str(item or "").strip()]
    if not observed:
        return {"added_hosts": [], "followup_job": {}, "followup_error": "", "bootstrap_job": {}, "bootstrap_error": ""}
    added_hosts = import_discovered_hosts_into_project(runtime, observed)
    mark_discovered_host_origin(runtime, added_hosts, source_tool_id=source_tool_id)
    followup_job: Dict[str, Any] = {}
    followup_error = ""
    bootstrap_job: Dict[str, Any] = {}
    bootstrap_error = ""
    return {
        "added_hosts": added_hosts,
        "followup_job": followup_job,
        "followup_error": followup_error,
        "bootstrap_job": bootstrap_job,
        "bootstrap_error": bootstrap_error,
    }


def run_governed_discovery(
    runtime,
    target: str,
    *,
    run_actions: bool = False,
) -> Dict[str, Any]:
    normalized_targets = runtime._normalize_targets([target])
    if not normalized_targets:
        raise ValueError("Discovery target is required.")

    runtime.create_new_temporary_project()
    scan_result = runtime._run_nmap_scan_and_import(
        normalized_targets,
        discovery=True,
        staged=False,
        run_actions=bool(run_actions),
        nmap_path="nmap",
        nmap_args="",
        scan_mode="legacy",
        scan_options={},
    )
    project = runtime.get_project_details()
    hosts = runtime.get_workspace_hosts(include_down=True)
    services = runtime.get_workspace_services(limit=300)
    response = {
        "target": str(normalized_targets[0] or ""),
        "run_actions": bool(run_actions),
        "project": project,
        "scan": scan_result,
        "results": hosts,
        "services": services,
    }
    if run_actions:
        response["approvals"] = runtime.get_scheduler_approvals(limit=100, status="pending")
        response["decisions"] = runtime.get_scheduler_decisions(limit=100)
    return response
