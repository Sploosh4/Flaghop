#!/usr/bin/env python3
"""Profile one CTF target using exposed services; no target agent or credentials."""
from __future__ import annotations

# CLI/run coordinator; helper imports preserve the existing public Python API.

import argparse
from collections import Counter
import ipaddress
import json
import os
from pathlib import Path
import re
import subprocess  # Public compatibility: existing callers patch child process creation here.
import sys
import xml.etree.ElementTree as ET
from settings import VERSION, MAX_XML, MAX_ARTIFACT, MAX_LOG, TOOLS
from evidence import hash_file, read_bounded, write_json, artifact_manifest
from execution import Runner, TaskSpec, TaskResult, task, utc_now, child_environment, stop_process
from identities import (inventory, SOURCE_FILES, VERSION_COMMANDS, VERSION_PATTERNS, VERSION_TIMEOUTS,
                        source_identity, input_identity, extract_version, tool_identity)
from discovery import parse_nmap, nmap_task
from service_plan import plan_followups
from service_parsers import PageClues, parse_http, normalise_result
from dependencies import snapshot_dependencies
from device_classifier import classify_device
from metasploit_adapter import write_import_script
from staged_workflow import EXTRA_TOOLS, annotate_stages, run as run_staged
from workspace import Workspace, cleanup_transient, tree_stats


def single_ip(value):
    try:
        address = ipaddress.ip_address(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("Use one literal IP, not a hostname or range") from error
    if address.is_multicast or address.is_unspecified or "%" in value:
        raise argparse.ArgumentTypeError("Use a unicast IP without an interface zone")
    if str(address) == "255.255.255.255":
        raise argparse.ArgumentTypeError("Broadcast targets are not supported")
    return str(address)


def port_selection(value):
    if value in ("top1000", "all"):
        return value
    if not re.fullmatch(r"\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*", value):
        raise argparse.ArgumentTypeError("Use top1000, all, or TCP ports such as 22,80,8000-8100")
    for part in value.split(","):
        bounds = [int(x) for x in part.split("-")]
        if not all(1 <= x <= 65535 for x in bounds) or bounds[0] > bounds[-1]:
            raise argparse.ArgumentTypeError("Port ranges must be within 1..65535 and ascending")
    return value


def positive_int(value):
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("Must be greater than zero")
    return number


def initial_profile(args, tools, collect_metadata=True, workspace=None):
    dependency_before = snapshot_dependencies(tools) if collect_metadata else None
    version_provenance = {}
    version_identity = tool_identity(
        tools, query_versions=not (args.offline or args.dry_run),
        workspace=workspace, provenance=version_provenance) if collect_metadata else {}
    return {
        "schema_version": "1.0",
        "profiler_version": VERSION,
        "label": args.label,
        "run": {
            "started_at": utc_now(), "status": "running",
            "local_effective_uid": os.geteuid(),
            "mode": "offline" if args.offline else "dry_run" if args.dry_run else "active",
        },
        "target": {
            "ip": args.target, "ip_version": ipaddress.ip_address(args.target).version,
            "scope": "single_ip", "dns_resolver": args.dns_server,
        },
        "policy": {
            "supplied_target_credentials": False, "target_installation": False,
            "http_redirects": "never", "implicit_dns": False,
            "optional_tools": "run if applicable and installed",
            "supplied_xml_authentication": "unverified" if args.from_nmap else "not_applicable",
        },
        "configuration": {
            "ports": args.ports, "os_detection": args.os_detection,
            "max_followup_services": args.max_services,
            "tool_timeout_seconds": args.tool_timeout,
            "tls_timeout_seconds": args.tls_timeout,
            "max_http_body_bytes": args.max_body_bytes,
            "stages": args.stages, "skip": sorted(args.skip or []),
            "udp_ports": args.udp_ports,
            "assessment_timeout": args.assessment_timeout,
            "validation_timeout": args.validation_timeout,
            "max_web_origins": args.max_web_origins,
            "max_endpoints": args.max_endpoints,
            "max_validation_urls": args.max_validation_urls,
            "verify_tls": args.verify_tls,
            "effective_privileged_discovery": bool(os.geteuid() == 0 or args.sudo),
        },
        "source_identity": source_identity(),
        "input_identity": input_identity(),
        "workspace": {"declared_base": str(workspace.base) if workspace else None,
                      "owned_root": str(workspace.root) if workspace else None},
        "dependency_identity": {"before": dependency_before, "after": None, "unchanged": None},
        "tool_inventory": tools,
        "tool_versions": version_identity,
        "version_provenance": version_provenance,
        "nmap": None, "tasks": [], "observations": [],
        "candidate_products": [],
        "identity_hypotheses": {
            field: {"value": None, "status": "unassessed", "evidence": []}
            for field in ("vendor", "product_family", "model", "firmware", "device_role")
        },
        "ngfw_capability": "unknown", "ngfw_features_active": "unknown",
        "validated_vulnerabilities": [],
        "limitations": [
            "A service fingerprint does not establish physical device identity.",
            "OS match scores are fingerprint similarity, not identity probabilities.",
            "No supplied credentials; anonymous SMB sessions may be denied.",
            "Only the default IP-based web site is examined; named virtual hosts may differ.",
            "Redirect destinations and names in certificates are recorded, not scanned.",
            "Active discovery scans TCP only; UDP coverage is absent unless present in supplied XML.",
            "STARTTLS negotiation, WAF probes, ARP and packet capture are not implemented by this version.",
            "Optional parsers preserve tool JSON; tools may have additional local dependencies.",
        ],
    }


def build(args):
    tools = inventory()
    supplied = None
    if args.from_nmap:
        supplied = read_bounded(args.from_nmap, MAX_XML)
        parse_nmap(supplied, args.target)  # validate before creating any output
    args.out = args.out.expanduser().absolute()
    args.out.mkdir(mode=0o700, parents=True, exist_ok=False)
    (args.out / "raw").mkdir()
    workspace = Workspace.create("run")
    args.runtime_workspace = workspace
    profile = None
    runner = None
    valid_xml = None
    try:
        profile = initial_profile(args, tools, workspace=workspace)
        runner = Runner(args.out, tools, args.offline, args.dry_run, args.skip,
                        workspace=workspace)
        if supplied is not None:
            (args.out / "raw" / "nmap.xml").write_bytes(supplied)
            profile["tasks"].append({
                "id": "discovery", "tool": "nmap", "status": "supplied",
                "source": str(args.from_nmap.resolve()),
                "reason": "Existing single-target XML; no discovery command executed",
            })
            valid_xml = supplied
        else:
            spec = nmap_task(args, tools, os.geteuid() == 0 or args.sudo)
            print("[discovery] Nmap", flush=True)
            result = runner.execute(spec)
            profile["tasks"].append(result)
            xml_path = args.out / "raw" / "nmap.xml"
            if xml_path.exists():
                data = read_bounded(xml_path, MAX_XML)
                parse_nmap(data, args.target)
                valid_xml = data
        if valid_xml is not None:
            nmap = parse_nmap(valid_xml, args.target)
            profile["nmap"] = nmap
            profile["candidate_products"] = [
                {
                    "product": service["fingerprint"]["product"],
                    "version": service["fingerprint"].get("version"),
                    "endpoint": f"{service['protocol']}/{service['port']}",
                    "source": "Nmap service fingerprint",
                    "physical_device_identity": False,
                }
                for service in nmap["services"]
                if service["state"] == "open" and service["fingerprint"].get("product")
            ]
            plans, omitted = plan_followups(args, nmap)
            profile["followup_services_omitted_by_limit"] = omitted
            confirmed_http = set()
            for spec in plans:
                print(f"[{spec['id']}] {spec['trigger']}", flush=True)
                if spec.get("skip_reason"):
                    result = {**spec, "status": "skipped", "reason": spec["skip_reason"]}
                elif spec.get("requires") and spec["requires"] not in confirmed_http and not (
                    args.offline or args.dry_run
                ):
                    result = {
                        **spec, "status": "skipped",
                        "reason": "No HTTP response confirmed by the prerequisite curl check",
                    }
                else:
                    # Resolve aliases without asking the shell to interpret arguments.
                    if tools.get(spec["tool"]):
                        spec["command"][0] = tools[spec["tool"]]
                    result = runner.execute(spec)
                profile["tasks"].append(result)
                observation = normalise_result(result, args.out)
                detail = " (parse failed)" if result.get("parse_status") == "failed" else (
                    " (access restrictions)" if result.get("access_restrictions") else ""
                )
                print(f"  {result['status']}{detail}", flush=True)
                if observation is not None:
                    profile["observations"].append(observation)
                    if spec["tool"] == "http":
                        confirmed_http.add(spec["id"])
            run_staged(args, profile, runner, task, normalise_result)
        elif not args.dry_run:
            profile["run"]["error"] = "No complete single-target Nmap result was available"
    except KeyboardInterrupt:
        if profile is None:
            profile = initial_profile(args, tools, collect_metadata=False, workspace=workspace)
        profile["run"]["error"] = "Interrupted; completed evidence was retained"
        profile["run"]["interrupted"] = True
        profile["run"]["unfinished_work"] = "Workflow stopped before all planned tasks and stages completed"
    except (OSError, ValueError, ET.ParseError) as error:
        if profile is None:
            profile = initial_profile(args, tools, collect_metadata=False, workspace=workspace)
        profile["run"]["error"] = str(error)
        valid_xml = None
    raw_cleanup = cleanup_transient(args.out, workspace)
    workspace_cleanup = workspace.cleanup()
    per_tool_cleanup = profile.pop("cleanup", [])
    cleanup_ok = raw_cleanup["success"] and workspace_cleanup["success"] and all(
        item.get("success") for item in per_tool_cleanup)
    profile["workspace"] = {
        "declared_base": str(workspace.base), "owned_root": str(workspace.root),
        "cleanup": workspace_cleanup,
    }
    profile["cleanup"] = {"per_tool": per_tool_cleanup, "run": raw_cleanup,
                          "success": cleanup_ok}
    if not cleanup_ok:
        profile["run"]["error"] = "Cleanup failed; owned temporary state remains"
        profile["run"]["cleanup_failed"] = True
    try:
        dependency_after = snapshot_dependencies(tools)
    except OSError as error:
        dependency_after = {"error": str(error)}
    dependency = profile.get("dependency_identity") or {}
    dependency["after"] = dependency_after
    dependency["unchanged"] = dependency.get("before") == dependency_after
    profile["dependency_identity"] = dependency
    profile["run"]["dependency_unchanged"] = dependency["unchanged"]
    if not dependency["unchanged"]:
        profile["run"].setdefault("error", "Dependency identity changed during the run")
        profile["run"]["dependency_changed"] = True
    profile["run"]["finished_at"] = utc_now()
    counts = Counter(t["status"] for t in profile["tasks"])
    profile["task_summary"] = dict(counts)
    has_error = "error" in profile["run"]
    annotate_stages(profile)
    stage_partial = any(stage["status"] == "partial" for stage in profile["stages"])
    profile["run"]["status"] = (
        "dry_run" if args.dry_run and not has_error
        else "partial" if has_error or stage_partial or any(
            t["status"] in ("failed", "timed_out", "output_limit", "tool_missing") or t.get("parse_status") == "failed"
            or bool(t.get("access_restrictions"))
            for t in profile["tasks"]
        ) else "completed"
    )
    profile["artifacts"] = artifact_manifest(args.out)
    classification, identities, ngfw = classify_device(profile)
    profile["classification"] = classification
    profile["identity_hypotheses"] = identities
    profile["ngfw_capability"] = ngfw
    write_json(args.out / "device-profile.json", profile)
    if not args.no_metasploit:
        write_import_script(args.out / "metasploit-import.rc", profile, valid_xml, args.workspace)
    print(f"Profile: {args.out / 'device-profile.json'}")
    if not args.no_metasploit:
        print(f"Import:  {args.out / 'metasploit-import.rc'}")
    print(f"Result:  {profile['run']['status']} ({dict(counts)})")
    return 2 if profile["run"]["status"] == "partial" else 0


def argument_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="?", type=single_ip, help="One assigned target IP")
    parser.add_argument("--out", type=Path, help="New output directory; existing directories are not overwritten")
    parser.add_argument("--ports", type=port_selection, default="top1000")
    parser.add_argument("--udp-ports", type=port_selection, help="Explicit UDP ports; requires root/sudo and explicit TCP ports or all")
    parser.add_argument("--stages", choices=("1-3", "1-4", "1-5"), help="Enable extended conditional workflow through the selected stage; omit for legacy profiling")
    parser.add_argument("--no-metasploit", action="store_true", help="Exclude Metasploit checks and import-resource generation; JSON output only")
    parser.add_argument("--assessment-timeout", type=positive_int, default=180)
    parser.add_argument("--validation-timeout", type=positive_int, default=180)
    parser.add_argument("--max-web-origins", type=positive_int, default=2)
    parser.add_argument("--max-endpoints", type=positive_int, default=100)
    parser.add_argument("--max-validation-urls", type=positive_int, default=1)
    parser.add_argument("--sudo", action="store_true", help="Use sudo -n for Nmap only; run sudo -v first")
    parser.add_argument("--os-detection", choices=("auto", "on", "off"), default="auto")
    parser.add_argument("--from-nmap", type=Path, help="Use existing single-target XML instead of scanning")
    parser.add_argument("--offline", action="store_true", help="Parse supplied XML; execute no tools")
    parser.add_argument("--dry-run", action="store_true", help="Write the plan/profile without executing tools")
    parser.add_argument("--dns-server", type=single_ip, help="Explicit resolver IP for a PTR query; otherwise DNS is skipped")
    parser.add_argument("--skip", action="append", choices=tuple(k for k in TOOLS if k != "nmap"), default=[])
    parser.add_argument("--verify-tls", action="store_true", help="Require curl certificate validation; default permits CTF self-signed certificates")
    parser.add_argument("--tool-timeout", type=positive_int, default=30)
    parser.add_argument("--tls-timeout", type=positive_int, default=120)
    parser.add_argument("--nmap-timeout", type=positive_int, default=300)
    parser.add_argument("--max-services", type=positive_int, default=32)
    parser.add_argument("--max-body-bytes", type=positive_int, default=262144)
    parser.add_argument("--workspace", help="Metasploit workspace name")
    parser.add_argument("--label", default="CTF target", help="Description saved in the profile")
    parser.add_argument("--check-tools", action="store_true", help="List local dependencies and exit")
    parser.add_argument("--version", action="version", version=VERSION)
    return parser


def main(argv=None):
    parser = argument_parser()
    args = parser.parse_args(argv)
    if args.check_tools:
        print(json.dumps(inventory(), indent=2))
        return 0
    if not args.target or args.out is None:
        parser.error("target and --out are required")
    if args.offline and not args.from_nmap:
        parser.error("--offline requires --from-nmap")
    if args.offline and args.dry_run:
        parser.error("Choose --offline or --dry-run")
    if args.udp_ports and (args.udp_ports in ("all", "top1000") or args.ports == "top1000"):
        parser.error("UDP ports must be numeric; combine with explicit TCP --ports or --ports all")
    if args.udp_ports and not args.from_nmap and os.geteuid() != 0 and not args.sudo:
        parser.error("UDP discovery requires root or --sudo")
    if args.os_detection == "on" and os.geteuid() != 0 and not args.sudo and not args.from_nmap:
        parser.error("OS detection needs local root or --sudo")
    args.workspace = args.workspace or "ctf-" + args.target.replace(":", "_")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}", args.workspace):
        parser.error("Workspace must be 1..64 letters, digits, dots, underscores or hyphens")
    try:
        return build(args)
    except (OSError, ValueError, ET.ParseError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
