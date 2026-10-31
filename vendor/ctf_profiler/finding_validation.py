"""Independent reproduction of Git, SQL and browser XSS candidates."""
from __future__ import annotations

import configparser
import hashlib
import re
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit
from web_assessment import curl_request
from workspace import Workspace


def validate_git(base, port, raw, execute, confirmed, proxy):
    git_url = base.rstrip("/") + "/.git/config"
    result, response = curl_request(f"verify-git-{port}", git_url, port, raw, execute, proxy)
    if response and response["status"] == 200:
        config = configparser.ConfigParser(interpolation=None)
        try:
            config.read_string(response["body"])
            if config.has_section("core") and config.has_option("core", "repositoryformatversion"):
                confirmed("exposed_git_config", "Publicly accessible Git configuration", git_url, [result["stdout"]], source_task=result["id"], explanation="Independent HTTP retrieval parsed as Git configuration; complete repository access was not established.")
        except configparser.Error:
            pass


def validate_inputs(base, port, raw, endpoints, execute, confirmed, proxy, args, workspace=None):
    numeric = []
    reflected = []
    for url in endpoints:
        for parameter, values in parse_qs(urlsplit(url).query).items():
            if re.fullmatch(r"id|item|item_id|product|product_id|page", parameter, re.I) and values[0].isdigit():
                numeric.append((url, parameter))
            if re.fullmatch(r"q|query|search|term|message|name", parameter, re.I):
                reflected.append((url, parameter))
    for index, (url, parameter) in enumerate(numeric[:args.max_validation_urls]):
        name = f"sqlmap-{port}-{index}"
        result, _ = execute(name, "sqlmap", 5,
            ["sqlmap", "-u", url, "-p", parameter, "--batch", "--level", "1", "--risk", "1", "--technique", "BEU", "--threads", "1", "--timeout", "5", "--retries", "0", "--flush-session", "--disable-coloring", "--ignore-redirects", "--proxy", proxy, "--output-dir", str(raw / name)],
            "A discovered GET endpoint contains a numeric identifier", port=port)
        if result["status"] == "completed":
            output = (raw.parent / result["stdout"]).read_text(errors="replace")
            if "sqlmap identified the following injection point" in output and re.search(r"Type: (?:boolean-based blind|UNION query|error-based)", output):
                validate_boolean(url, parameter, port, index, raw, execute, confirmed, proxy, result["stdout"], result["id"])
    if not numeric:
        execute(f"skip-sqlmap-{port}", "sqlmap", 5, [], "No discovered numeric GET identifiers", skip_reason="No eligible request")
    for index, (url, parameter) in enumerate(reflected[:args.max_validation_urls]):
        name = f"dalfox-{port}-{index}"
        config = raw / (name + "-config.toml")
        config.write_text("")
        result, _ = execute(name, "dalfox", 5,
            ["dalfox", "scan", url, "-p", parameter, "--config", str(config), "--skip-mining", "--skip-discovery", "--skip-reflection-header", "--skip-reflection-cookie", "--skip-reflection-path", "--skip-waf-probe", "--waf-bypass", "off", "--workers", "2", "--timeout", "5", "--scan-timeout", "45", "--max-payloads-per-param", "30", "--format", "json", "--output", str(raw / (name + ".json")), "--proxy", proxy],
            "A discovered text-input endpoint is eligible for XSS validation", raw / (name + ".json"), format="json", port=port, success_exit_codes=[0, 1])
        if result["status"] == "completed":
            validate_browser(url, parameter, port, index, raw, execute, confirmed, proxy, name,
                             workspace=workspace)
    if not reflected:
        execute(f"skip-dalfox-{port}", "dalfox", 5, [], "No discovered text-input GET endpoint", skip_reason="No eligible request")


def replace_query(url, parameter, value):
    parsed = urlsplit(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    query[parameter] = [value]
    return urlunsplit(parsed._replace(query=urlencode(query, doseq=True), fragment=""))


def validate_boolean(url, parameter, port, index, raw, execute, confirmed, proxy, source, source_task):
    original = parse_qs(urlsplit(url).query)[parameter][0]
    evidence = [source]
    bodies = []
    for suffix, value in (("control", original), ("true", original + " AND 1=1"), ("false", original + " AND 1=2")):
        result, response = curl_request(f"verify-sql-{port}-{index}-{suffix}", replace_query(url, parameter, value), port, raw, execute, proxy)
        if not response or response["status"] != 200:
            return
        evidence.append(result["stdout"])
        bodies.append(response["body"])
    if bodies[0] == bodies[1] and bodies[1] != bodies[2]:
        confirmed("sql_injection", "Reproduced SQL injection", url, evidence, parameter=parameter,
                  source_task=source_task, explanation="sqlmap reported an injection technique; independent baseline/true/false requests reproduced the boolean response difference. No database dumping was requested.")


def validate_browser(url, parameter, port, index, raw, execute, confirmed, proxy, source, workspace=None):
    token = "ctfproof" + hashlib.sha256((url + parameter).encode()).hexdigest()[:12]
    payload = '<svg onload="document.documentElement.setAttribute(\'data-profiler-proof\',\'' + token + '\')">'
    proof_url = replace_query(url, parameter, payload)
    own_workspace = workspace is None
    workspace = workspace or Workspace.create("browser")
    user_data = workspace.path("browser", f"chrome-{port}-{index}")
    try:
        result, _ = execute(f"browser-xss-{port}-{index}", "browser", 5,
            ["google-chrome", "--headless=new", "--no-first-run", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--disable-extensions", "--disable-default-apps", "--force-webrtc-ip-handling-policy=disable_non_proxied_udp", "--ignore-certificate-errors", "--proxy-server=" + proxy, "--proxy-bypass-list=<-loopback>", "--user-data-dir=" + str(user_data), "--timeout=10000", "--dump-dom", proof_url],
            "Independently test whether injected markup executes in a browser", port=port, stdout_limit=262144)
        if result["status"] == "completed":
            dom = (raw.parent / result["stdout"]).read_text(errors="replace")
            if re.search(r"<html\b[^>]*\bdata-profiler-proof=[\"']" + token + r"[\"']", dom):
                confirmed("reflected_xss", "Browser-confirmed reflected XSS", url, [str((raw / (source + ".json")).relative_to(raw.parent)), result["stdout"]], parameter=parameter,
                          source_task=result["id"], candidate_source_task=source, explanation="A controlled injected handler executed and set a DOM attribute; the browser-rendered document contains the expected proof marker.")
    finally:
        if own_workspace:
            workspace.cleanup()
