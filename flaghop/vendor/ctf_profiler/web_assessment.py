"""Bounded HTTP/API retrieval and web assessment-tool adapters."""
from __future__ import annotations

import json
import re
import socket
from urllib.parse import urlsplit
from scope_proxy import in_scope


def curl_request(identifier, url, port, raw, execute, proxy, stage=5):
    headers = raw / (identifier + ".headers")
    result, _ = execute(identifier, "http", stage,
        ["curl", "--disable", "--silent", "--show-error", "--proxy", proxy, "--noproxy", "", "--proto", "=http,https", "--insecure", "--connect-timeout", "5", "--max-time", "10", "--dump-header", str(headers), "--url", url],
        "Retrieve bounded evidence from the same target", port=port, stdout_limit=262144)
    if result["status"] != "completed":
        return result, None
    text = (raw.parent / result["stdout"]).read_text(errors="replace")
    response_headers = headers.read_text(errors="replace") if headers.exists() else ""
    statuses = re.findall(r"HTTP/\S+\s+(\d{3})", response_headers)
    return result, {"body": text, "status": int(statuses[-1]) if statuses else None}


def fetch_api(url, base, port, raw, execute, proxy):
    result, response = curl_request(f"api-definition-{port}", url, port, raw, execute, proxy, stage=3)
    if not response or response["status"] != 200:
        return None
    try:
        spec = json.loads(response["body"])
        if not isinstance(spec, dict) or not isinstance(spec.get("paths"), dict) or "openapi" not in spec:
            return None
        # External refs and arbitrary server destinations must not expand scope.
        def external(value):
            if isinstance(value, dict):
                return any(k == "$ref" and not str(v).startswith("#/") or external(v) for k, v in value.items())
            return isinstance(value, list) and any(external(v) for v in value)
        if external(spec) or any(not path.startswith("/") or path.startswith("//") for path in spec["paths"]):
            return None
        spec["servers"] = [{"url": base.rstrip("/")}]
        for operations in spec["paths"].values():
            if isinstance(operations, dict):
                operations.pop("servers", None)
                for operation in operations.values():
                    if isinstance(operation, dict):
                        operation.pop("servers", None)
        path = raw / f"openapi-scoped-{port}.json"
        path.write_text(json.dumps(spec))
        return path
    except (ValueError, TypeError):
        return None


def collect_zap_findings(rows, source, findings, target, allowed_ports):
    """Normalise web and API ZAP alerts with explicit scanner provenance."""
    for row in rows:
        if not isinstance(row, dict):
            continue
        sites = row.get("site")
        if not isinstance(sites, list):
            continue
        for site in sites:
            if not isinstance(site, dict):
                continue
            alerts = site.get("alerts")
            if not isinstance(alerts, list):
                continue
            for alert in alerts:
                if not isinstance(alert, dict):
                    continue
                instances = alert.get("instances")
                if not isinstance(instances, list):
                    continue
                for instance in instances:
                    if not isinstance(instance, dict):
                        continue
                    url = instance.get("uri", "")
                    if in_scope(url, target, allowed_ports):
                        candidate = {"source": source, "title": alert.get("name"),
                                     "plugin_id": alert.get("pluginid"), "url": url,
                                     "status": "candidate"}
                        if candidate not in findings:
                            findings.append(candidate)


def zap_run(base, port, raw, execute, endpoints, proxy, api_file=None):
    name = f"zap-{'api-' if api_file else ''}{port}"
    jobs = []
    if api_file:
        jobs.append({"type": "openapi", "parameters": {"apiFile": str(api_file), "targetUrl": base.rstrip("/"), "context": "target"}})
    jobs += [{"type": "requestor", "requests": [{"url": u, "method": "GET"} for u in endpoints[:20]]},
             {"type": "spider", "parameters": {"context": "target", "maxDuration": 1, "maxDepth": 3, "maxChildren": 20}},
             {"type": "passiveScan-wait", "parameters": {"maxDuration": 1}},
             {"type": "activeScan", "parameters": {"context": "target", "maxRuleDurationInMins": 1, "maxScanDurationInMins": 2, "threadPerHost": 2},
              "policyDefinition": {"defaultStrength": "Low", "defaultThreshold": "Off", "rules": [{"id": 40018, "threshold": "Medium", "strength": "Low"}, {"id": 40012, "threshold": "Medium", "strength": "Low"}]}},
             {"type": "report", "parameters": {"template": "traditional-json", "reportDir": str(raw), "reportFile": name, "displayReport": False}}]
    plan = {"env": {"contexts": [{"name": "target", "urls": [base], "includePaths": ["^" + re.escape(base) + ".*"]}],
                    "parameters": {"failOnError": True, "failOnWarning": False, "progressToStdout": True}}, "jobs": jobs}
    plan_path = raw / (name + "-plan.yaml")
    # JSON is valid YAML; no optional YAML library is required by the profiler.
    plan_path.write_text(json.dumps(plan, indent=2))
    with socket.socket() as free:
        free.bind(("127.0.0.1", 0))
        listener = free.getsockname()[1]
    proxy_port = urlsplit(proxy).port
    return execute(name, "zap", 4,
        ["zap.sh", "-cmd", "-dir", str(raw / (name + "-home")), "-host", "127.0.0.1", "-port", str(listener),
         "-config", "connection.proxyChain.enabled=true", "-config", "connection.proxyChain.hostName=127.0.0.1", "-config", f"connection.proxyChain.port={proxy_port}",
         "-config", "checkForUpdates.checkOnStart=false", "-autorun", str(plan_path)],
        "Import same-origin API and assess inputs" if api_file else "Assess the confirmed web application using selected active rules",
        raw / (name + ".json"), format="json", port=port)
