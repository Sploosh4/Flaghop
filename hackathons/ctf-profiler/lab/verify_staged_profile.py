#!/usr/bin/env python3
"""Strengthened live-stage verifier for the owned lab; no Metasploit operations.

This verifier is deliberately independent of scanner task selection.  It checks
the saved profile against the lab's separately stored ground truth, parses URL
scope, resolves every evidence path, and re-checks meaningful proof content.
"""
import argparse
import configparser
from datetime import datetime, timezone
import hashlib
import ipaddress
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

PROJECT = Path(__file__).resolve().parents[1]

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("run", type=Path)
args = parser.parse_args()
root = args.run.resolve()
profile_dir = root / "profile"
p = json.loads((profile_dir / "device-profile.json").read_text())
ground = json.loads((PROJECT / "lab" / "ground-truth.json").read_text())
tasks = p["tasks"]
by_id = {task["id"]: task for task in tasks}
tools_completed = {task["tool"] for task in tasks if task["status"] == "completed"}
vulns = p["validated_vulnerabilities"]
open_tcp = {s["port"] for s in p["nmap"]["services"]
            if s.get("protocol") == "tcp" and s.get("state") == "open"}
expected_tcp = {s["port"] for s in ground["services"] if s.get("protocol") == "tcp"}
closed_port = int(ground["closed_control_tcp_port"])
allowed_ports = open_tcp
followups = {"smb", "ssh-12222", "http-18080", "whatweb-18080",
             "http-18443", "whatweb-18443", "tls-18443", "dns"}
archived = {record["path"]: record["sha256"] for record in p.get("artifacts", [])}


def url_in_scope(url, target, ports):
    """Independent parsed scope check; do not reuse the scanner's helper."""
    try:
        parsed = urlsplit(url)
        return (len(url) <= 4096 and parsed.scheme in ("http", "https")
                and not parsed.username and not parsed.password
                and ipaddress.ip_address(parsed.hostname) == ipaddress.ip_address(target)
                and (parsed.port or (443 if parsed.scheme == "https" else 80)) in ports)
    except (ValueError, TypeError):
        return False


def source_task_matches(task, url):
    if not task or task.get("status") != "completed" or task.get("stage") != 5:
        return False
    parts = urlsplit(url)
    command = " ".join(str(part) for part in task.get("command", []))
    return bool(parts.netloc and parts.netloc in command and (parts.path or "/") in command)


def read_evidence(name):
    path = profile_dir / name
    if not path.is_file():
        return None
    return path.read_text(errors="replace")


def evidence_resolves(finding):
    return all(name in archived and (profile_dir / name).is_file()
               and hashlib.sha256((profile_dir / name).read_bytes()).hexdigest() == archived[name]
               for name in finding.get("evidence", []))


def meaningful_git(finding):
    text = read_evidence(finding["evidence"][0])
    if text is None:
        return False
    config = configparser.ConfigParser(interpolation=None)
    try:
        config.read_string(text)
    except configparser.Error:
        return False
    return config.has_section("core") and config.has_option("core", "repositoryformatversion")


def meaningful_sql(finding):
    names = finding.get("evidence", [])
    sqlmap = next((read_evidence(name) for name in names if "sqlmap" in name), None)
    if sqlmap is None or "sqlmap identified the following injection point" not in sqlmap:
        return False
    if not re.search(r"Type: (?:boolean-based blind|UNION query|error-based)", sqlmap):
        return False
    bodies = {}
    for suffix in ("control", "true", "false"):
        name = next((n for n in names if n.endswith("-" + suffix + ".stdout")), None)
        bodies[suffix] = read_evidence(name) if name else None
    return (bodies["control"] is not None and bodies["control"] == bodies["true"]
            and bodies["true"] != bodies["false"])


def meaningful_xss(finding):
    names = finding.get("evidence", [])
    report = next((read_evidence(n) for n in names if "dalfox" in n and n.endswith(".json")), None)
    dom = next((read_evidence(n) for n in names if "browser-xss" in n), None)
    if report is None or dom is None:
        return False
    try:
        data = json.loads(report)
    except ValueError:
        return False
    reports = data if isinstance(data, list) else [data]
    if not any(isinstance(row, dict) and row.get("meta", {}).get("incomplete") is False
               and row.get("findings") for row in reports):
        return False
    parameter = finding.get("parameter", "")
    token = "ctfproof" + hashlib.sha256((finding["url"] + parameter).encode()).hexdigest()[:12]
    return bool(re.search(r"data-profiler-proof=[\"']" + re.escape(token) + r"[\"']", dom))


def stage_for(task_id):
    task = by_id.get(task_id) or {}
    if task.get("id") == "discovery":
        return {1, 2}
    return {task.get("stage")} if task.get("stage") else set()


stage_status = {stage["number"]: stage["status"] for stage in p.get("stages", [])}
parser_failures = [task for task in tasks if task.get("parse_status") == "failed"]
stage_parser_consistent = all(
    all(stage_status.get(number) != "completed" for number in stage_for(task["id"]))
    for task in parser_failures
) and (not parser_failures or p["run"]["status"] == "partial")

finding_keys = [(v.get("type"), v.get("url"), v.get("parameter")) for v in vulns]
finding_types = {v.get("type") for v in vulns}
def finding_lineage_ok(finding):
    source = by_id.get(finding.get("source_task"))
    if not source_task_matches(source, finding.get("url", "")):
        return False
    candidate = finding.get("candidate_source_task")
    if candidate:
        candidate_task = by_id.get(candidate)
        if not candidate_task or candidate_task.get("status") != "completed" or candidate_task.get("tool") != "dalfox":
            return False
    return True


source_tasks_ok = all(finding_lineage_ok(v) for v in vulns)
finding_urls_scoped = all(url_in_scope(v.get("url", ""), p["target"]["ip"], allowed_ports) for v in vulns)
endpoint_urls_scoped = all(url_in_scope(e.get("url", ""), p["target"]["ip"], allowed_ports)
                           for e in p.get("web_endpoints", []))
closed_commands = [
    task for task in tasks if task.get("tool") != "nmap" and (
        task.get("port") == closed_port
        or any(re.search(r"(?<!\d)" + str(closed_port) + r"(?!\d)", str(part)) for part in task.get("command", [])))
]
fingerprint_rows = [
    row for obs in p["observations"] if obs.get("tool") == "fingerprintx"
    for row in obs.get("data", []) if isinstance(row, dict)
]
fingerprint_fields_ok = bool(fingerprint_rows) and all(
    {"ip", "port", "protocol", "tls", "transport"}.issubset(row) for row in fingerprint_rows
)
dalfox_obs = [obs for obs in p["observations"] if obs.get("tool") == "dalfox"]
dalfox_ok = bool(dalfox_obs) and all(
    all(isinstance(row, dict) and row.get("meta", {}).get("incomplete") is False
        for row in obs.get("data", []))
    for obs in dalfox_obs)
inconsistent_tasks = [task for task in tasks
                      if task.get("status") in ("failed", "timed_out", "output_limit", "tool_missing")
                      or task.get("parse_status") == "failed"]
stage_task_consistent = all(
    all(stage_status.get(number) != "completed" for number in stage_for(task["id"]))
    for task in inconsistent_tasks
) and (not inconsistent_tasks or p["run"]["status"] == "partial")
proof_origins = {(v.get("type"), urlsplit(v.get("url", "")).scheme) for v in vulns}
required_origins = {(kind, scheme) for kind in
                    ("exposed_git_config", "sql_injection", "reflected_xss")
                    for scheme in ("http", "https")}
closed_state = next((s.get("state") for s in p["nmap"]["services"]
                     if s.get("protocol") == "tcp" and s["port"] == closed_port), None)
excluded_tasks = [t for t in tasks if t.get("tool") == "metasploit_check"]

checks = {
    "owned_target": p["target"]["ip"] == "127.0.0.2",
    "completed_run": p["run"]["status"] == "completed",
    "five_stage_records": [s["number"] for s in p.get("stages", [])] == [1, 2, 3, 4, 5],
    "all_stages_completed": all(s["status"] == "completed" for s in p.get("stages", [])),
    "parser_failure_propagates": stage_parser_consistent,
    "stage_task_consistency": stage_task_consistent,
    "discovery_real_nmap": p["nmap"]["nmap_version"] not in (None, "fixture"),
    "normal_user_followups": p["run"]["local_effective_uid"] != 0,
    "ground_truth_services": open_tcp == expected_tcp,
    "closed_control_port": closed_state == "closed" and bool(closed_commands) is False,
    "eight_followups_completed": followups.issubset(by_id)
    and all(by_id[name]["status"] == "completed" for name in followups)
    and all(by_id[name].get("parse_status") in (None, "completed") for name in followups),
    "identification_adapters": {"http", "whatweb", "httpx", "fingerprintx"}.issubset(tools_completed),
    "enumeration_adapters": {"katana", "ffuf", "smb", "ssh", "tls", "dns"}.issubset(tools_completed),
    "assessment_adapters": {"nuclei", "zap"}.issubset(tools_completed),
    "api_assessment": any(t["id"].startswith("zap-api-") and t["status"] == "completed" for t in tasks),
    "fingerprintx_contract": fingerprint_fields_ok
    and all(t.get("parse_status") == "completed" for t in tasks
            if t["tool"] == "fingerprintx" and t["status"] == "completed"),
    "dalfox_contract": dalfox_ok and all(
        t.get("parse_status") == "completed" for t in tasks
        if t["tool"] == "dalfox" and t["status"] == "completed"),
    "validation_tools": {"sqlmap", "dalfox", "browser"}.issubset(tools_completed),
    "wordpress_correctly_skipped": any(
        t["tool"] == "wpscan" and t["status"] == "skipped" and "WordPress" in t.get("reason", "")
        for t in tasks),
    "no_metasploit_executed": all(t.get("status") in ("skipped", "disabled") for t in excluded_tasks),
    "no_import_resource_created": not (profile_dir / "metasploit-import.rc").exists(),
    "three_weakness_types_reproduced": finding_types == {"exposed_git_config", "sql_injection", "reflected_xss"}
    and required_origins.issubset(proof_origins),
    "proof_artifacts_verify": all(evidence_resolves(v) for v in vulns)
    and all((profile_dir / name).is_file()
            and hashlib.sha256((profile_dir / name).read_bytes()).hexdigest() == digest
            for name, digest in archived.items()),
    "proof_content_meaningful": all(
        {"exposed_git_config": meaningful_git, "sql_injection": meaningful_sql,
         "reflected_xss": meaningful_xss}[v["type"]](v) for v in vulns),
    "finding_source_tasks": source_tasks_ok,
    "logical_findings_unique": len(finding_keys) == len(set(finding_keys)),
    "candidates_separate": all(f.get("status") == "candidate" for f in p.get("assessment_findings", []))
    and all(v.get("status") == "reproduced" for v in vulns),
    "scoped_finding_urls": finding_urls_scoped,
    "scoped_endpoint_urls": endpoint_urls_scoped,
    "run_identity_recorded": bool(p.get("source_identity"))
    and bool(p.get("tool_versions"))
    and {"ctf_profiler.py", "staged_workflow.py"}.issubset(p.get("source_identity", {})),
}
report = {
    "checked_at": datetime.now(timezone.utc).isoformat(),
    "passed": all(checks.values()),
    "checks": checks,
    "run": p.get("run"),
    "stages": p.get("stages"),
    "expected_open_tcp": sorted(expected_tcp),
    "observed_open_tcp": sorted(open_tcp),
    "closed_control_port": closed_port,
    "followups": sorted(followups),
    "completed_tools": sorted(tools_completed),
    "fingerprintx_rows": len(fingerprint_rows),
    "reproduced_findings": [
        {key: v.get(key) for key in ("type", "url", "parameter", "source_task", "status")}
        for v in vulns
    ],
}
(root / "staged-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print("Staged live verification:", "PASS" if report["passed"] else "FAIL")
for name, passed in checks.items():
    if not passed:
        print("FAILED:", name)
sys.exit(0 if report["passed"] else 1)
