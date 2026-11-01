"""Conditional stage orchestration; tool adapters and validators own their details."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urljoin, urlsplit, urlunsplit
from settings import EXTRA_TOOLS, STAGES
from scope_proxy import TargetProxy, in_scope
from workspace import Workspace, cleanup_tool_state, tree_stats
from web_parsers import (Links, json_rows, normalise_fingerprintx, normalise_dalfox, parse_result_artifact)
from web_assessment import curl_request, fetch_api, collect_zap_findings, zap_run
from finding_validation import (validate_git, validate_inputs, replace_query, validate_boolean, validate_browser)
from metasploit_adapter import metasploit_checks


PROJECT = Path(__file__).resolve().parent


def annotate_stages(profile):
    for task in profile["tasks"]:
        task.setdefault("stage", 1 if task["id"] == "discovery" else 2 if task["tool"] in ("http", "whatweb") else 3)
        if task["id"] == "discovery":
            task["provides_stages"] = [1, 2]
    for obs in profile["observations"]:
        obs.setdefault("stage", 2 if obs["tool"] in ("http", "whatweb") else 3)
    profile["stages"] = []
    for number, name in STAGES.items():
        tasks = [t for t in profile["tasks"] if t.get("stage") == number or number in t.get("provides_stages", [])]
        counts = {}
        for task in tasks:
            counts[task["status"]] = counts.get(task["status"], 0) + 1
        profile["stages"].append({"number": number, "name": name, "task_summary": counts,
                                  "status": "partial" if any(t["status"] in ("failed", "timed_out", "output_limit", "tool_missing") or t.get("parse_status") == "failed" for t in tasks)
                                  else "completed" if any(t["status"] in ("completed", "supplied") for t in tasks)
                                  else "not_run"})


def run(args, profile, runner, make_task, normalise_http):
    if not args.stages:
        annotate_stages(profile)
        return
    maximum = int(args.stages[-1])
    raw = args.out / "raw"
    findings = profile.setdefault("assessment_findings", [])
    endpoints = profile.setdefault("web_endpoints", [])
    decisions = profile.setdefault("workflow_decisions", [])
    allowed_ports = {s["port"] for s in profile["nmap"]["services"] if s["state"] == "open" and s["protocol"] == "tcp"}
    pending = args.dry_run or args.offline

    def execute(identifier, tool, stage, command, trigger, artifact=None, format="jsonl", **extra):
        spec = make_task(identifier, tool, command, trigger,
                         args.assessment_timeout if stage == 4 else args.validation_timeout if stage == 5 else args.tool_timeout,
                         stage=stage, **extra)
        spec["isolated_tool_state"] = tool in EXTRA_TOOLS and tool != "metasploit_check"
        if artifact:
            spec.update(watch=[str(artifact)], result_artifact=str(artifact.relative_to(args.out)), format=format)
        if extra.get("skip_reason"):
            result = {**spec, "status": "skipped", "reason": extra["skip_reason"]}
        elif stage > maximum:
            result = {**spec, "status": "skipped", "reason": "Stage not requested"}
        else:
            if runner.tools.get(tool) and command:
                spec["command"][0] = runner.tools[tool]
            print(f"[stage {stage}: {identifier}] {trigger}", flush=True)
            result = runner.execute(spec)
        profile["tasks"].append(result)
        rows = []
        if result["status"] == "completed" and artifact:
            rows = parse_result_artifact(result, tool, artifact, args.out, format)
            if result.get("parse_status") == "completed":
                profile["observations"].append({"task_id": identifier, "tool": tool, "stage": stage,
                                                "port": extra.get("port"), "execution_status": result["status"],
                                                "data": rows, "source": str(artifact.relative_to(args.out))})
        cleanup_report = cleanup_tool_state(args.out, tool, identifier)
        profile.setdefault("cleanup", []).append(cleanup_report)
        if not cleanup_report["success"]:
            result["cleanup_failed"] = True
        print("  " + result["status"], flush=True)
        return result, rows

    def skip(tool, stage, reason, suffix=""):
        profile["tasks"].append({"id": "skip-" + tool + suffix, "tool": tool, "stage": stage,
                                  "status": "skipped", "reason": reason, "command": []})

    def remember(url, source):
        if not in_scope(url, args.target, allowed_ports):
            decisions.append({"action": "excluded_url", "url": str(url)[:500], "reason": "Outside the assigned IP/port scope"})
            return
        url = urlunsplit(urlsplit(url)._replace(fragment=""))
        if not any(e["url"] == url for e in endpoints) and len(endpoints) < args.max_endpoints:
            endpoints.append({"url": url, "source": source, "parameters": sorted(parse_qs(urlsplit(url).query, keep_blank_values=True))})

    def confirmed(kind, title, url, evidence, **extra):
        if not in_scope(url, args.target, allowed_ports):
            return
        key = hashlib.sha256((kind + url + str(extra.get("parameter") or "")).encode()).hexdigest()[:16]
        if not any(v["id"] == key for v in profile["validated_vulnerabilities"]):
            profile["validated_vulnerabilities"].append({"id": key, "type": kind, "title": title,
                "url": url, "port": urlsplit(url).port or (443 if urlsplit(url).scheme == "https" else 80),
                "status": "reproduced", "evidence": evidence, "stage": 5, **extra})

    with TargetProxy(args.target, allowed_ports) as proxy:
        profile["policy"]["extended_web_egress"] = "Local proxy restricted to the assigned IP and discovered TCP ports; no implicit hostname targets"
        # A second fingerprinting opinion is restricted to unidentified ports.
        unknown = [s for s in profile["nmap"]["services"] if s["protocol"] == "tcp" and s["state"] == "open" and s["fingerprint"].get("name", "unknown") in ("unknown", "ssl", "")]
        for service in unknown[:4]:
            port = service["port"]
            _, identified = execute(f"fingerprintx-{port}", "fingerprintx", 2,
                    ["fingerprintx", "--json", "-t", f"[{args.target}]:{port}" if ":" in args.target else f"{args.target}:{port}", "-w", "1000", "-o", str(raw / f"fingerprintx-{port}.jsonl")],
                    "Nmap did not identify the application", raw / f"fingerprintx-{port}.jsonl", port=port)
            existing_http = any(o.get("tool") == "http" and o.get("port") == port for o in profile["observations"])
            found = next((r for r in identified if isinstance(r, dict)
                          and (r.get("service") or r.get("protocol")) in ("http", "https")), None)
            if found and not existing_http:
                scheme = found.get("service") or found["protocol"]
                authority = f"[{args.target}]" if ":" in args.target else args.target
                url = f"{scheme}://{authority}:{port}/"
                headers = raw / f"http-{port}.headers"
                spec = make_task(f"http-{port}", "http", [runner.tools.get("http") or "curl", "--disable", "--silent", "--show-error", "--noproxy", "*", "--proto", "=http,https", "--connect-timeout", "5", "--max-time", str(args.tool_timeout), "--insecure", "--dump-header", str(headers), "--url", url],
                                 "fingerprintx identified HTTP on an otherwise unidentified port", args.tool_timeout, stage=2, port=port, url=url, watch=[str(headers)], stdout_limit=args.max_body_bytes)
                result = runner.execute(spec)
                profile["tasks"].append(result)
                observation = normalise_http(result, args.out)
                if observation:
                    profile["observations"].append(observation)
        if not unknown:
            skip("fingerprintx", 2, "All discovered TCP applications were identified by Nmap")

        roots = [o for o in profile["observations"] if o["tool"] == "http" and o.get("execution_status") == "completed" and o.get("url")]
        profile["extended_web_origins_omitted"] = [o["url"] for o in roots[args.max_web_origins:]]
        roots = roots[:args.max_web_origins]
        if not roots:
            for tool, stage in (("httpx", 2), ("katana", 3), ("ffuf", 3), ("nuclei", 4), ("zap", 4), ("wpscan", 4), ("sqlmap", 5), ("dalfox", 5)):
                skip(tool, stage, "No HTTP service confirmed by curl")

        for root in roots:
            base = root["url"]
            port = root["port"]
            remember(base, root["task_id"])
            body_path = args.out / root["body_source"]
            if body_path.exists():
                links = Links()
                links.feed(body_path.read_text(errors="replace"))
                for link in links.links:
                    remember(urljoin(base, link), root["task_id"])
            empty_config = raw / f"empty-{port}.yaml"
            empty_config.write_text("{}\n")
            execute(f"httpx-{port}", "httpx", 2,
                    ["httpx", "-u", base, "-silent", "-duc", "-no-stdin", "-nfs", "-json", "-title", "-server", "-td", "-favicon", "-timeout", "5", "-retries", "0", "-http-proxy", proxy.url,
                     "-config", str(empty_config), "-o", str(raw / f"httpx-{port}.jsonl")],
                    "HTTP service confirmed", raw / f"httpx-{port}.jsonl", port=port)

            _, crawled = execute(f"katana-{port}", "katana", 3,
                ["katana", "-u", base, "-silent", "-duc", "-d", "3", "-jc", "-fx", "-kf", "all", "-ct", "15s", "-mdp", "30", "-dr", "-cs", "^" + re.escape(base),
                 "-proxy", proxy.url, "-jsonl", "-mrs", "262144", "-rl", "20", "-c", "3", "-p", "1", "-timeout", "5", "-config", str(empty_config), "-o", str(raw / f"katana-{port}.jsonl")],
                "Crawl the confirmed web origin and extract inputs", raw / f"katana-{port}.jsonl", port=port)
            for row in crawled:
                if isinstance(row, dict):
                    remember(row.get("request", {}).get("endpoint", ""), f"katana-{port}")
            _, discovered = execute(f"ffuf-{port}", "ffuf", 3,
                ["ffuf", "-u", base + "FUZZ", "-w", str(PROJECT / "wordlists/web-small.txt"), "-noninteractive", "-s", "-t", "4", "-rate", "20", "-timeout", "5", "-maxtime", "25", "-mc", "all", "-fc", "404", "-ac", "-of", "json", "-o", str(raw / f"ffuf-{port}.json"), "-x", proxy.url, "-k"],
                "Discover unlinked paths after HTTP confirmation", raw / f"ffuf-{port}.json", format="json", port=port)
            for row in discovered:
                for match in row.get("results", []) if isinstance(row, dict) else []:
                    remember(match.get("url", ""), f"ffuf-{port}")

            origin_endpoints = [e["url"] for e in endpoints if urlsplit(e["url"]).netloc == urlsplit(base).netloc and urlsplit(e["url"]).scheme == urlsplit(base).scheme]
            self_api = next((u for u in origin_endpoints if urlsplit(u).path in ("/openapi.json", "/swagger.json")), None)
            api_file = None
            if self_api and not pending:
                api_file = fetch_api(self_api, base, port, raw, execute, proxy.url)
                if api_file:
                    profile.setdefault("api_definitions", []).append({"url": self_api, "scoped_file": str(api_file.relative_to(args.out))})

            if maximum < 4:
                for tool, stage in (("nuclei", 4), ("zap", 4), ("wpscan", 4), ("sqlmap", 5), ("dalfox", 5), ("metasploit_check", 5)):
                    skip(tool, stage, "Stage not requested", f"-{port}")
                continue
            _, matches = execute(f"nuclei-{port}", "nuclei", 4,
                ["nuclei", "-u", base, "-t", str(PROJECT / "templates/assessment"), "-ni", "-duc", "-no-stdin", "-silent", "-jsonl", "-o", str(raw / f"nuclei-{port}.jsonl"), "-rl", "10", "-c", "2", "-retries", "0", "-timeout", "5", "-proxy", proxy.url, "-dr"],
                "Run the bundled, reviewed product/exposure templates", raw / f"nuclei-{port}.jsonl", port=port)
            for match in matches:
                if isinstance(match, dict):
                    url = match.get("matched-at", base)
                    if in_scope(url, args.target, allowed_ports):
                        findings.append({"source": f"nuclei-{port}", "template_id": match.get("template-id"),
                                         "title": match.get("info", {}).get("name"), "url": url, "status": "candidate"})

            wordpress = any(m.get("template-id") == "profiler-wordpress-detection" for m in matches if isinstance(m, dict))
            wordpress = wordpress or any(o.get("tool") == "whatweb" and o.get("port") == port and "WordPress" in json.dumps(o.get("data", {})) for o in profile["observations"])
            if wordpress:
                execute(f"wpscan-{port}", "wpscan", 4,
                    ["wpscan", "--url", base, "--no-update", "--format", "json", "--output", str(raw / f"wpscan-{port}.json"), "--cookie-jar", str(raw / f"wpscan-{port}-cookies.txt"), "--detection-mode", "passive", "--plugins-detection", "passive", "--disable-tls-checks", "--max-threads", "2", "--proxy", proxy.url],
                    "WordPress product markers were observed", raw / f"wpscan-{port}.json", format="json", port=port, success_exit_codes=[0, 5])
            else:
                skip("wpscan", 4, "No WordPress product markers", f"-{port}")

            _, zap_rows = zap_run(base, port, raw, execute, origin_endpoints, proxy.url)
            collect_zap_findings(zap_rows, f"zap-{port}", findings, args.target, allowed_ports)
            if api_file:
                _, api_zap_rows = zap_run(base, port, raw, execute, origin_endpoints, proxy.url, api_file)
                collect_zap_findings(api_zap_rows, f"zap-api-{port}", findings, args.target, allowed_ports)
            else:
                skip("zap", 4, "No usable same-target OpenAPI definition", f"-api-{port}")

            if maximum < 5:
                for tool in ("sqlmap", "dalfox", "metasploit_check"):
                    skip(tool, 5, "Stage not requested", f"-{port}")
                continue
            # Exposure validation independently fetches and parses the resource.
            for match in matches:
                if isinstance(match, dict) and match.get("template-id") == "profiler-exposed-git-config":
                    validate_git(base, port, raw, execute, confirmed, proxy.url)
                    break
            validate_inputs(base, port, raw, origin_endpoints, execute, confirmed, proxy.url, args,
                            workspace=getattr(args, "runtime_workspace", None))
            if args.no_metasploit:
                skip("metasploit_check", 5, "Metasploit work is excluded from this run", f"-{port}")
            else:
                metasploit_checks(base, port, profile, raw, execute, skip)

        profile["policy"]["blocked_extended_destinations"] = proxy.blocked
    annotate_stages(profile)
