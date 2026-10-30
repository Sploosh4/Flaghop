from __future__ import annotations

import datetime
from typing import Any, Dict, List


def get_host_ai_report(runtime, host_id: int) -> Dict[str, Any]:
    details = runtime.get_host_workspace(int(host_id))
    host = details.get("host", {}) if isinstance(details.get("host", {}), dict) else {}
    ports = details.get("ports", []) if isinstance(details.get("ports", []), list) else []
    cves = details.get("cves", []) if isinstance(details.get("cves", []), list) else []
    screenshots = details.get("screenshots", []) if isinstance(details.get("screenshots", []), list) else []
    ai_analysis = details.get("ai_analysis", {}) if isinstance(details.get("ai_analysis", {}), dict) else {}
    target_state = details.get("target_state", {}) if isinstance(details.get("target_state", {}), dict) else {}

    port_rows = []
    for item in ports:
        if not isinstance(item, dict):
            continue
        service = item.get("service", {}) if isinstance(item.get("service", {}), dict) else {}
        scripts = item.get("scripts", []) if isinstance(item.get("scripts", []), list) else []
        script_rows = []
        banner = ""
        for script in scripts:
            if not isinstance(script, dict):
                continue
            script_id = str(script.get("script_id", "")).strip()
            output_excerpt = runtime._truncate_scheduler_text(script.get("output", ""), 280)
            script_rows.append({
                "script_id": script_id,
                "output_excerpt": output_excerpt,
            })
            if not banner:
                candidate = runtime._scheduler_banner_from_evidence(script_id, output_excerpt)
                if candidate:
                    banner = candidate
        if not banner:
            banner = runtime._scheduler_service_banner_fallback(
                service_name=str(service.get("name", "") or ""),
                product=str(service.get("product", "") or ""),
                version=str(service.get("version", "") or ""),
                extrainfo=str(service.get("extrainfo", "") or ""),
            )

        port_rows.append({
            "port": str(item.get("port", "") or ""),
            "protocol": str(item.get("protocol", "") or ""),
            "state": str(item.get("state", "") or ""),
            "service": str(service.get("name", "") or ""),
            "service_product": str(service.get("product", "") or ""),
            "service_version": str(service.get("version", "") or ""),
            "service_extrainfo": str(service.get("extrainfo", "") or ""),
            "banner": banner,
            "scripts": script_rows,
        })

    return {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "report_version": 1,
        "host": {
            "id": int(host.get("id", 0) or 0),
            "ip": str(host.get("ip", "") or ""),
            "hostname": str(host.get("hostname", "") or ""),
            "status": str(host.get("status", "") or ""),
            "os": str(host.get("os", "") or ""),
        },
        "note": str(details.get("note", "") or ""),
        "ports": port_rows,
        "cves": cves,
        "screenshots": screenshots,
        "ai_analysis": ai_analysis,
        "target_state": target_state,
    }


def get_project_ai_report(runtime) -> Dict[str, Any]:
    with runtime._lock:
        runtime._require_active_project()
        project_meta = dict(runtime._project_metadata())
        summary = dict(runtime._summary())
        host_rows = list(runtime._hosts(limit=5000))

    host_reports: List[Dict[str, Any]] = []
    for row in host_rows:
        host_id = int(row.get("id", 0) or 0)
        if host_id <= 0:
            continue
        try:
            host_reports.append(get_host_ai_report(runtime, host_id))
        except Exception:
            continue

    return {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "report_version": 1,
        "project": project_meta,
        "summary": summary,
        "host_count": len(host_reports),
        "hosts": host_reports,
    }


def render_project_ai_report_markdown(report: Dict[str, Any]) -> str:
    payload = report if isinstance(report, dict) else {}
    project = payload.get("project", {}) if isinstance(payload.get("project", {}), dict) else {}
    summary = payload.get("summary", {}) if isinstance(payload.get("summary", {}), dict) else {}
    hosts = payload.get("hosts", []) if isinstance(payload.get("hosts", []), list) else []

    lines = [
        "# Legion Project AI Report",
        "",
        f"- Generated: {payload.get('generated_at', '')}",
        f"- Report Version: {payload.get('report_version', '')}",
        f"- Project: {project.get('name', '')}",
        f"- Temporary: {bool(project.get('is_temporary', False))}",
        f"- Output Folder: {project.get('output_folder', '')}",
        f"- Running Folder: {project.get('running_folder', '')}",
        "",
        "## Summary",
        "",
        f"- Hosts: {summary.get('hosts', 0)}",
        f"- Open Ports: {summary.get('open_ports', 0)}",
        f"- Services: {summary.get('services', 0)}",
        f"- CVEs: {summary.get('cves', 0)}",
        f"- Running Jobs: {summary.get('running_processes', 0)}",
        f"- Finished Jobs: {summary.get('finished_processes', 0)}",
        "",
        "## Hosts",
        "",
    ]

    if not hosts:
        lines.append("- none")
        return "\n".join(lines).strip() + "\n"

    for item in hosts:
        if not isinstance(item, dict):
            continue
        host = item.get("host", {}) if isinstance(item.get("host", {}), dict) else {}
        ai = item.get("ai_analysis", {}) if isinstance(item.get("ai_analysis", {}), dict) else {}
        technologies = ai.get("technologies", []) if isinstance(ai.get("technologies", []), list) else []
        findings = ai.get("findings", []) if isinstance(ai.get("findings", []), list) else []
        manual_tests = ai.get("manual_tests", []) if isinstance(ai.get("manual_tests", []), list) else []
        ports = item.get("ports", []) if isinstance(item.get("ports", []), list) else []
        cves = item.get("cves", []) if isinstance(item.get("cves", []), list) else []
        host_ip = str(host.get("ip", "") or "")
        host_name = str(host.get("hostname", "") or "")
        host_heading = host_ip
        if host_name:
            host_heading = f"{host_ip} ({host_name})".strip()
        lines.extend([
            f"### {host_heading}",
            "",
            f"- Host ID: {host.get('id', '')}",
            f"- Status: {host.get('status', '')}",
            f"- OS: {host.get('os', '')}",
            f"- Open Services: {len(ports)}",
            f"- CVEs: {len(cves)}",
            f"- Provider: {ai.get('provider', '')}",
            f"- Goal Profile: {ai.get('goal_profile', '')}",
            f"- Updated: {ai.get('updated_at', '')}",
            f"- Next Phase: {ai.get('next_phase', '')}",
            "",
            "#### Technologies",
        ])
        if technologies:
            for tech in technologies:
                if not isinstance(tech, dict):
                    continue
                lines.append(
                    f"- {tech.get('name', '')} {tech.get('version', '')} | CPE: {tech.get('cpe', '')} | Evidence: {tech.get('evidence', '')}"
                )
        else:
            lines.append("- none")
        lines.extend(["", "#### Findings"])
        if findings:
            for finding in findings:
                if not isinstance(finding, dict):
                    continue
                lines.append(
                    f"- [{finding.get('severity', 'info')}] {finding.get('title', '')} | CVE: {finding.get('cve', '')} | CVSS: {finding.get('cvss', '')}"
                )
        else:
            lines.append("- none")
        lines.extend(["", "#### Manual Tests"])
        if manual_tests:
            for test in manual_tests:
                if not isinstance(test, dict):
                    continue
                lines.append(
                    f"- Why: {test.get('why', '')} | Command: `{test.get('command', '')}` | Scope: {test.get('scope_note', '')}"
                )
        else:
            lines.append("- none")
        lines.append("")

    return "\n".join(lines).strip() + "\n"
