"""Tool observation parsing: vulnerabilities."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Tuple

from app.scheduler.observations.cloud import (
    _append_cloud_exposure_findings_from_text,
    _append_cloud_technologies_from_text,
)
from app.scheduler.observations.common import (
    _append_finding,
    _append_finding_quality_event,
    _append_named_version_technology,
    _append_technology,
    _append_url,
    _clean_text,
    _clean_url,
    _dedupe_rows,
    _evaluate_nuclei_finding_quality,
    _iter_json_payloads,
    _severity_token,
    _strip_nmap_preamble,
)
from app.scheduler.observations.constants import (
    _ANSI_ESCAPE_RE,
    _CVE_RE,
    _NAME_VERSION_RE,
    _NMAP_BLOCK_HEADER_RE,
    _NUCLEI_LOG_LEVELS,
    _NUCLEI_PROTOCOL_TOKENS,
    _NUCLEI_STATS_RE,
    _SEVERITY_LEVELS,
    _SQLMAP_AVAILABLE_DBS_RE,
    _SQLMAP_BANNER_RE,
    _SQLMAP_DBA_RE,
    _SQLMAP_DBMS_RE,
    _SQLMAP_LIST_ITEM_RE,
    _SQLMAP_PARAMETER_RE,
    _SQLMAP_TITLE_RE,
    _SQLMAP_TYPE_RE,
    _SQLMAP_WEB_TECH_RE,
    _URL_RE,
    _WPSCAN_LOCATION_RE,
    _WPSCAN_URL_RE,
    _WPSCAN_VERSION_RE,
)


def _parse_nuclei_output(
    tool_id: str, output_text: str, *, port: str = "", protocol: str = "tcp", service: str = ""
) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    quality_events: List[Dict[str, Any]] = []
    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        if _NUCLEI_STATS_RE.match(line):
            continue
        parsed = None
        if line.startswith("{") and line.endswith("}"):
            try:
                parsed = json.loads(line)
            except Exception:
                parsed = None
        if isinstance(parsed, dict):
            info = parsed.get("info", {}) if isinstance(parsed.get("info"), dict) else {}
            classification = info.get("classification", {}) if isinstance(info.get("classification"), dict) else {}
            cve_list = classification.get("cve-id", []) if isinstance(classification.get("cve-id"), list) else []
            cve_id = str(cve_list[0] or "").strip().upper() if cve_list else ""
            severity = _severity_token(info.get("severity", "") or parsed.get("severity", ""), "info")
            title = str(
                info.get("name", "") or parsed.get("template-id", "") or parsed.get("matcher-name", "") or cve_id
            ).strip()
            matched_at = parsed.get("matched-at") or parsed.get("host") or parsed.get("matched") or ""
            extracted_results = parsed.get("extracted-results", [])
            evidence_items = extracted_results if isinstance(extracted_results, list) else [extracted_results]
            _append_cloud_technologies_from_text(
                technologies,
                " ".join(
                    [
                        str(parsed.get("template-id", "") or ""),
                        str(title or ""),
                        str(matched_at or ""),
                        " ".join(str(item or "") for item in list(evidence_items or [])),
                    ]
                ),
                evidence=line,
            )
            _append_cloud_exposure_findings_from_text(
                findings,
                " ".join(
                    [
                        str(parsed.get("template-id", "") or ""),
                        str(title or ""),
                        str(matched_at or ""),
                        " ".join(str(item or "") for item in list(evidence_items or [])),
                    ]
                ),
                evidence=line,
            )
            _append_url(urls, matched_at, port=port, protocol=protocol, service=service, label=title or cve_id)
            quality = _evaluate_nuclei_finding_quality(
                title=title or cve_id or "Nuclei match",
                severity=severity,
                evidence=line,
                matched_url=matched_at,
                evidence_items=evidence_items,
            )
            if str(quality.get("action", "") or "") == "suppressed":
                _append_finding_quality_event(
                    quality_events,
                    title or cve_id or "Nuclei match",
                    action=quality.get("action", ""),
                    reason=quality.get("reason", ""),
                    severity_before=quality.get("severity_before", severity),
                    severity_after=quality.get("severity_after", ""),
                    cve=cve_id,
                    evidence=line,
                    matched_url=matched_at,
                )
                continue
            adjusted_severity = str(quality.get("severity_after", "") or severity)
            _append_finding(
                findings,
                title or cve_id or "Nuclei match",
                severity=adjusted_severity,
                cve=cve_id,
                evidence=line,
                evidence_items=evidence_items,
                quality_action=quality.get("action", ""),
                quality_reason=quality.get("reason", ""),
                severity_before=quality.get("severity_before", severity),
            )
            if str(quality.get("action", "") or "") == "downgraded":
                _append_finding_quality_event(
                    quality_events,
                    title or cve_id or "Nuclei match",
                    action=quality.get("action", ""),
                    reason=quality.get("reason", ""),
                    severity_before=quality.get("severity_before", severity),
                    severity_after=quality.get("severity_after", ""),
                    cve=cve_id,
                    evidence=line,
                    matched_url=matched_at,
                )
            continue
        brackets = [token.strip() for token in re.findall(r"\[([^\]]+)\]", line) if str(token or "").strip()]
        severity = "info"
        for token in brackets:
            token_lower = str(token).strip().lower()
            if token_lower in _SEVERITY_LEVELS:
                severity = _severity_token(token_lower, "info")
                break
        cve_match = _CVE_RE.search(line)
        cve_id = cve_match.group(0).upper() if cve_match else ""
        title = ""
        for token in brackets:
            token_lower = str(token).strip().lower()
            if token_lower in _SEVERITY_LEVELS or token_lower in _NUCLEI_PROTOCOL_TOKENS:
                continue
            if token_lower.startswith("http://") or token_lower.startswith("https://"):
                continue
            title = str(token).strip()
            break
        matched_url = _clean_url(_URL_RE.search(line).group(0)) if _URL_RE.search(line) else ""
        if not matched_url and not cve_id:
            lowered_tokens = {str(token or "").strip().lower() for token in brackets}
            if lowered_tokens and (
                lowered_tokens <= _NUCLEI_LOG_LEVELS
                or all(re.fullmatch(r"[0-9:]+", token or "") for token in lowered_tokens)
                or lowered_tokens <= (_NUCLEI_LOG_LEVELS | {"info"})
            ):
                continue
        if not matched_url and not cve_id and title and re.fullmatch(r"[0-9:]+", title):
            continue
        _append_cloud_technologies_from_text(
            technologies,
            " ".join(
                [
                    str(title or ""),
                    str(cve_id or ""),
                    str(matched_url or ""),
                    line,
                ]
            ),
            evidence=line,
        )
        _append_cloud_exposure_findings_from_text(
            findings,
            " ".join(
                [
                    str(title or ""),
                    str(cve_id or ""),
                    str(matched_url or ""),
                    line,
                ]
            ),
            evidence=line,
        )
        _append_url(urls, matched_url, port=port, protocol=protocol, service=service, label=title or cve_id or "nuclei")
        if cve_id or title or matched_url:
            quality = _evaluate_nuclei_finding_quality(
                title=cve_id or title or "Nuclei match",
                severity=severity,
                evidence=line,
                matched_url=matched_url,
            )
            if str(quality.get("action", "") or "") == "suppressed":
                _append_finding_quality_event(
                    quality_events,
                    cve_id or title or "Nuclei match",
                    action=quality.get("action", ""),
                    reason=quality.get("reason", ""),
                    severity_before=quality.get("severity_before", severity),
                    severity_after=quality.get("severity_after", ""),
                    cve=cve_id,
                    evidence=line,
                    matched_url=matched_url,
                )
                continue
            _append_finding(
                findings,
                cve_id or title or "Nuclei match",
                severity=str(quality.get("severity_after", "") or severity),
                cve=cve_id,
                evidence=line,
                quality_action=quality.get("action", ""),
                quality_reason=quality.get("reason", ""),
                severity_before=quality.get("severity_before", severity),
            )
            if str(quality.get("action", "") or "") == "downgraded":
                _append_finding_quality_event(
                    quality_events,
                    cve_id or title or "Nuclei match",
                    action=quality.get("action", ""),
                    reason=quality.get("reason", ""),
                    severity_before=quality.get("severity_before", severity),
                    severity_after=quality.get("severity_after", ""),
                    cve=cve_id,
                    evidence=line,
                    matched_url=matched_url,
                )
    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe", "evidence"), limit=24),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=64),
        "urls": _dedupe_rows(urls, ("url",), limit=64),
        "finding_quality_events": _dedupe_rows(
            quality_events, ("title", "cve", "action", "reason", "evidence"), limit=96
        ),
    }


def _parse_vuln_script_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    suite_tool = str(tool_id or "").strip().lower()
    stripped_input = str(output_text or "").lstrip()
    if stripped_input.startswith("<?xml") or stripped_input.startswith("<nmaprun"):
        return {"technologies": [], "findings": [], "urls": []}
    cleaned = _strip_nmap_preamble(output_text)
    if not cleaned:
        return {"technologies": [], "findings": [], "urls": []}

    known_tech_markers = {
        "apache http server": "Apache HTTP Server",
        "nginx": "nginx",
        "jetty": "Jetty",
        "wordpress": "WordPress",
        "drupal": "Drupal",
        "tomcat": "Apache Tomcat",
        "jenkins": "Jenkins",
    }

    blocks: List[Tuple[str, List[str]]] = []
    current_id = str(tool_id or "").strip().lower()
    current_lines: List[str] = []
    saw_script_block = False
    for raw_line in cleaned.splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).rstrip()
        stripped = re.sub(r"^[|_ ]+", "", line).strip()
        if not stripped:
            continue
        header_match = _NMAP_BLOCK_HEADER_RE.match(line)
        if header_match:
            block_id = str(header_match.group(1) or "").strip().lower()
            if block_id and (suite_tool == "nmap-vuln.nse" or block_id.endswith(".nse") or "vuln" in block_id):
                saw_script_block = True
                if current_lines and current_id != str(tool_id or "").strip().lower():
                    blocks.append((current_id, list(current_lines)))
                current_id = block_id
                current_lines = []
                header_detail = _clean_text(header_match.group(2), 240)
                if header_detail:
                    current_lines.append(header_detail)
                continue
        current_lines.append(stripped)
    if current_lines:
        blocks.append((current_id, list(current_lines)))
    if not saw_script_block:
        return {"technologies": [], "findings": [], "urls": []}

    for block_id, lines in blocks:
        block_text = "\n".join(line for line in lines if str(line or "").strip())
        lowered = block_text.lower()
        if not block_text.strip():
            continue
        negative = any(
            token in lowered
            for token in (
                "no finding",
                "not vulnerable",
                "no vulnerabilities found",
                "not exploitable",
                "not found",
                "couldn't find",
                "might not be vulnerable",
                "script execution failed",
                "[error]",
            )
        )
        positive = (
            any(
                token in lowered
                for token in ("vulnerable", "likely vulnerable", "state: vulnerable", "state: likely vulnerable")
            )
            and not negative
        )
        if block_id == "http-csrf" and "possible csrf vulnerab" in lowered:
            positive = True
        cve_ids = [str(match or "").strip().upper() for match in _CVE_RE.findall(block_text)]
        risk_match = re.search(r"risk factor\s*:\s*(critical|high|medium|low|info)", block_text, flags=re.IGNORECASE)
        severity = _severity_token(risk_match.group(1) if risk_match else ("medium" if cve_ids else "info"))

        for marker, tech_name in known_tech_markers.items():
            if marker in lowered and not negative:
                _append_technology(technologies, tech_name, evidence=f"{block_id} output fingerprint")

        if negative and not positive:
            continue

        title = ""
        if block_id == "http-csrf" and "possible csrf vulnerab" in lowered:
            title = "Possible CSRF vulnerabilities detected"
        if not title:
            for line in lines:
                candidate = _clean_text(line, 240)
                lowered_candidate = candidate.lower()
                if not candidate:
                    continue
                if candidate.startswith(("# ", "<?xml", "<nmaprun")):
                    continue
                if re.match(r"^\d+/(tcp|udp)\s+open\b", lowered_candidate):
                    continue
                if lowered_candidate in {"vulnerable:", "vulnerable", "ids", "description", "references"}:
                    continue
                if lowered_candidate.startswith(("state:", "risk factor:", "description:", "references:", "ids:")):
                    continue
                title = candidate
                break

        evidence = ""
        for line in lines:
            candidate = _clean_text(line, 320)
            if candidate and _CVE_RE.search(candidate):
                evidence = candidate
                break
        if not evidence:
            for line in lines:
                candidate = _clean_text(line, 320)
                if not candidate:
                    continue
                if candidate.lower().startswith(("vulnerable", "state:", "risk factor:")):
                    evidence = candidate
                    break
        evidence = evidence or _clean_text(block_text, 520)

        if cve_ids or positive:
            for url in _URL_RE.findall(block_text):
                _append_url(urls, url, label=f"{block_id} reference")
        if cve_ids:
            for cve_id in cve_ids[:6]:
                _append_finding(
                    findings,
                    title or cve_id,
                    severity=severity,
                    cve=cve_id,
                    evidence=evidence,
                )
        elif positive:
            _append_finding(
                findings,
                title or _clean_text(block_id, 160),
                severity=severity,
                evidence=evidence,
            )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=24),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=32),
        "urls": _dedupe_rows(urls, ("url",), limit=24),
    }


def _parse_wpscan_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    section = ""

    for payload in _iter_json_payloads(output_text):
        if not isinstance(payload, dict):
            continue
        target_url = payload.get("target_url") or payload.get("url") or ""
        _append_url(urls, target_url, label=f"{tool_id} target")
        aborted_reason = _clean_text(payload.get("scan_aborted") or payload.get("message") or "", 260)
        if aborted_reason:
            title = aborted_reason
            lowered_reason = aborted_reason.lower()
            if "not seem to be running wordpress" in lowered_reason or "not a wordpress site" in lowered_reason:
                title = "WPScan: target does not appear to be WordPress"
            _append_finding(findings, title, severity="info", evidence=aborted_reason)

        version_info = payload.get("version")
        if isinstance(version_info, dict):
            number = version_info.get("number") or version_info.get("release_date") or ""
            _append_technology(
                technologies, "WordPress", version=str(number or "").strip(), evidence=f"{tool_id} wordpress version"
            )

        interesting = payload.get("interesting_findings")
        if isinstance(interesting, list):
            for item in interesting[:24]:
                if not isinstance(item, dict):
                    continue
                title = item.get("to_s") or item.get("type") or item.get("url") or ""
                _append_finding(findings, title, severity="info", evidence=_clean_text(json.dumps(item), 420))
                _append_url(urls, item.get("url") or item.get("location") or "", label=f"{tool_id} finding")

        for plugin_name, plugin_data in list((payload.get("plugins") or {}).items())[:32]:
            if not isinstance(plugin_data, dict):
                continue
            _append_technology(technologies, _clean_text(plugin_name, 96), evidence=f"{tool_id} wordpress plugin")
            _append_url(urls, plugin_data.get("location") or "", label=f"{tool_id} plugin")
            vulnerabilities = plugin_data.get("vulnerabilities")
            if isinstance(vulnerabilities, list):
                for vuln in vulnerabilities[:8]:
                    if not isinstance(vuln, dict):
                        continue
                    title = vuln.get("title") or plugin_name
                    fixed_in = _clean_text(vuln.get("fixed_in") or "", 48)
                    if fixed_in:
                        title = f"{title} (fixed in {fixed_in})"
                    _append_finding(
                        findings,
                        title,
                        severity="medium",
                        cve=_CVE_RE.search(str(vuln or "")).group(0).upper() if _CVE_RE.search(str(vuln or "")) else "",
                        evidence=_clean_text(json.dumps(vuln), 420),
                    )

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        lowered = line.lower()
        if line.startswith("[+] ") or line.startswith("| Location:"):
            for url in _URL_RE.findall(line):
                _append_url(urls, url, label=f"{tool_id} output")

        url_match = _WPSCAN_URL_RE.match(line)
        if url_match:
            _append_url(urls, url_match.group(1), label=f"{tool_id} target")
            continue

        version_match = _WPSCAN_VERSION_RE.search(line)
        if version_match:
            _append_technology(technologies, "WordPress", version=version_match.group(1), evidence=f"{tool_id}: {line}")

        location_match = _WPSCAN_LOCATION_RE.match(line)
        if location_match:
            _append_url(urls, location_match.group(1), label=f"{tool_id} location")

        if lowered.startswith("[i] plugin(s) identified"):
            section = "plugins"
            continue
        if lowered.startswith("[i] theme(s) identified"):
            section = "themes"
            continue

        if line.startswith("[+] "):
            content = _clean_text(line[4:], 220)
            if (
                section == "plugins"
                and content
                and ":" not in content
                and not content.lower().startswith(("url", "started", "headers", "interesting finding"))
            ):
                _append_technology(technologies, content, evidence=f"{tool_id} wordpress plugin")
                continue
            if (
                section == "themes"
                and content
                and ":" not in content
                and not content.lower().startswith(("url", "started"))
            ):
                _append_technology(technologies, content, evidence=f"{tool_id} wordpress theme")
                continue
            if any(
                token in lowered
                for token in (
                    "xml-rpc seems to be enabled",
                    "registration is enabled",
                    "directory has listing enabled",
                    "debug log found",
                )
            ):
                _append_finding(findings, content, severity="low", evidence=line)
                continue

        if "[!] title:" in lowered:
            title = (
                _clean_text(line.split("Title:", 1)[1], 260)
                if "Title:" in line
                else _clean_text(line.split("title:", 1)[1], 260)
            )
            _append_finding(
                findings,
                title,
                severity="medium",
                cve=_CVE_RE.search(title).group(0).upper() if _CVE_RE.search(title) else "",
                evidence=line,
            )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=48),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=48),
        "urls": _dedupe_rows(urls, ("url",), limit=64),
    }


def _parse_sqlmap_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    current_parameter = ""
    current_location = ""
    current_types: List[str] = []
    current_titles: List[str] = []
    enumerated_databases: List[str] = []
    collecting_databases = False
    advertised_database_count = 0
    dbms_name = ""

    def _flush_parameter():
        nonlocal current_parameter, current_location, current_types, current_titles
        if not current_parameter:
            return
        location = _clean_text(current_location or "request", 64).upper()
        title = f"SQL injection: {location} {current_parameter} parameter injectable"
        evidence_parts = [f"{tool_id}: parameter {current_parameter} ({location}) injectable"]
        if current_types:
            evidence_parts.append(f"types: {', '.join(current_types[:4])}")
        if current_titles:
            evidence_parts.append(f"titles: {', '.join(current_titles[:3])}")
        _append_finding(
            findings,
            title,
            severity="high",
            evidence=" | ".join(evidence_parts),
            evidence_items=current_titles or current_types,
        )
        current_parameter = ""
        current_location = ""
        current_types = []
        current_titles = []

    def _parse_dbms_token(value: Any) -> Tuple[str, str]:
        text = _clean_text(value, 160)
        if not text:
            return "", ""
        match = _NAME_VERSION_RE.match(text)
        if match:
            return _clean_text(match.group(1), 96), _clean_text(match.group(2) or "", 80)
        return text, ""

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            collecting_databases = False
            continue

        if line.startswith("[") and not line.startswith("[*]"):
            bracket_parts = re.split(r"\]\s*", line, maxsplit=1)
            if len(bracket_parts) == 2:
                line = bracket_parts[1].strip()
            else:
                line = line.strip("[] ")
        if not line:
            continue

        for url in _URL_RE.findall(line):
            _append_url(urls, url, label=f"{tool_id} target")

        if collecting_databases:
            db_item_match = _SQLMAP_LIST_ITEM_RE.match(line)
            if db_item_match:
                database_name = _clean_text(db_item_match.group(1), 96)
                if database_name:
                    enumerated_databases.append(database_name)
                continue
            if line.lower().startswith(("database:", "table:", "current database:", "current user:")):
                collecting_databases = False
            elif not line.startswith("["):
                collecting_databases = False

        parameter_match = _SQLMAP_PARAMETER_RE.match(line)
        if parameter_match:
            _flush_parameter()
            current_parameter = _clean_text(parameter_match.group(1), 96)
            current_location = _clean_text(parameter_match.group(2), 48)
            continue

        type_match = _SQLMAP_TYPE_RE.match(line)
        if type_match and current_parameter:
            injection_type = _clean_text(type_match.group(1), 120)
            if injection_type and injection_type.lower() not in {item.lower() for item in current_types}:
                current_types.append(injection_type)
            continue

        title_match = _SQLMAP_TITLE_RE.match(line)
        if title_match and current_parameter:
            injection_title = _clean_text(title_match.group(1), 160)
            if injection_title and injection_title.lower() not in {item.lower() for item in current_titles}:
                current_titles.append(injection_title)
            continue

        web_tech_match = _SQLMAP_WEB_TECH_RE.match(line)
        if web_tech_match:
            for token in str(web_tech_match.group(1) or "").split(","):
                _append_named_version_technology(technologies, token, evidence=f"{tool_id}: {line}")
            continue

        dbms_match = _SQLMAP_DBMS_RE.match(line)
        if dbms_match:
            dbms_name, dbms_version = _parse_dbms_token(dbms_match.group(1))
            if dbms_name:
                _append_technology(technologies, dbms_name, version=dbms_version, evidence=f"{tool_id}: {line}")
            continue

        banner_match = _SQLMAP_BANNER_RE.match(line)
        if banner_match and dbms_name:
            banner_value = _clean_text(banner_match.group(1), 80)
            if banner_value:
                _append_technology(technologies, dbms_name, version=banner_value, evidence=f"{tool_id}: {line}")
            continue

        dba_match = _SQLMAP_DBA_RE.match(line)
        if dba_match:
            dba_state = str(dba_match.group(1) or "").strip().lower()
            if dba_state in {"true", "yes"}:
                _append_finding(
                    findings,
                    "SQLMap: current database user has DBA privileges",
                    severity="high",
                    evidence=f"{tool_id}: {line}",
                )
            continue

        available_dbs_match = _SQLMAP_AVAILABLE_DBS_RE.match(line)
        if available_dbs_match:
            collecting_databases = True
            advertised_database_count = int(available_dbs_match.group(1) or 0)
            continue

    _flush_parameter()

    deduped_databases = []
    seen_databases = set()
    for database_name in enumerated_databases:
        lowered = str(database_name or "").strip().lower()
        if not lowered or lowered in seen_databases:
            continue
        seen_databases.add(lowered)
        deduped_databases.append(database_name)
    if deduped_databases:
        _append_finding(
            findings,
            f"SQLMap enumerated databases ({advertised_database_count or len(deduped_databases)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(deduped_databases[:8])}",
            evidence_items=deduped_databases,
        )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=32),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=32),
        "urls": _dedupe_rows(urls, ("url",), limit=32),
    }
