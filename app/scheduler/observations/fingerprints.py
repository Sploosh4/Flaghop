"""Tool observation parsing: fingerprints."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List
from urllib.parse import urljoin

from app.scheduler.observations.common import (
    _append_finding,
    _append_named_version_technology,
    _append_product_technology,
    _append_technology,
    _append_url,
    _clean_text,
    _clean_url,
    _dedupe_rows,
    _infer_finding_severity,
    _resolve_web_url,
)
from app.scheduler.observations.constants import (
    _ANSI_ESCAPE_RE,
    _CVE_RE,
    _DISCOVERY_ACCESSIBLE_STATUSES,
    _DISCOVERY_ADMIN_TOKENS,
    _DISCOVERY_PRESENT_STATUSES,
    _HTML_TITLE_RE,
    _HTTP_HEADER_RE,
    _HTTP_STATUS_RE,
    _NIKTO_OSVDB_RE,
    _NIKTO_PATH_RE,
    _NIKTO_POWERED_BY_RE,
    _NIKTO_SERVER_RE,
    _NIKTO_VERB_PATH_RE,
    _URL_RE,
    _WAF_REASON_RE,
    _WAF_SITE_VENDORS_RE,
    _WAF_VENDOR_DETAIL_RE,
    _WAF_VENDOR_RE,
    _WHATWEB_IGNORED_NAMES,
    _WHATWEB_PAIR_RE,
)


def _parse_whatweb_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    for raw_line in str(output_text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        url_match = _URL_RE.search(line)
        if url_match:
            _append_url(urls, url_match.group(0), label=f"{tool_id} fingerprint")
        for name, value in _WHATWEB_PAIR_RE.findall(line):
            name_token = _clean_text(name, 64)
            value_token = _clean_text(value, 180)
            if not name_token or not value_token:
                continue
            if name_token.lower() in _WHATWEB_IGNORED_NAMES:
                continue
            lowered_name = name_token.lower()
            if lowered_name.endswith((".jsp", ".php", ".asp", ".aspx", ".cgi", ".html", ".htm")):
                continue
            if re.fullmatch(r"\d{3}\s+[A-Za-z][A-Za-z ]{1,40}", value_token):
                continue
            if name_token.lower() == "httpserver":
                server_match = re.search(r"([A-Za-z][A-Za-z0-9+_.-]+)(?:/([0-9][A-Za-z0-9._-]*))?", value_token)
                if server_match:
                    _append_technology(
                        technologies,
                        server_match.group(1),
                        version=server_match.group(2) or "",
                        evidence=f"{tool_id} httpserver {value_token}",
                    )
                continue
            version = ""
            if re.fullmatch(r"[0-9][A-Za-z0-9._-]{0,31}", value_token) and (
                "." in value_token or bool(re.search(r"[A-Za-z]", value_token))
            ):
                version = value_token
            _append_technology(
                technologies,
                name_token,
                version=version,
                evidence=f"{tool_id} {name_token}[{value_token}]",
            )
    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=48),
        "findings": [],
        "urls": _dedupe_rows(urls, ("url",), limit=48),
    }


def _parse_httpx_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []

    def _resolve_httpx_url(parsed: Dict[str, Any]) -> str:
        explicit_url = _clean_url(parsed.get("url") or "")
        if explicit_url:
            return explicit_url
        scheme = _clean_text(parsed.get("scheme", "") or "", 16).lower()
        host = _clean_text(parsed.get("host", "") or parsed.get("input", "") or "", 180)
        path = str(parsed.get("path", "") or "").strip()
        if not scheme or not host:
            return ""
        if path and not str(path).startswith("/"):
            path = f"/{path}"
        return _clean_url(f"{scheme}://{host}{path}")

    def _resolve_httpx_location(current_url: str, location_value: Any) -> str:
        location = _clean_text(location_value, 240)
        if not location:
            return ""
        absolute = _clean_url(location)
        if absolute:
            return absolute
        if current_url:
            return _clean_url(urljoin(current_url, location))
        return ""

    for raw_line in str(output_text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        parsed = None
        if line.startswith("{") and line.endswith("}"):
            try:
                parsed = json.loads(line)
            except Exception:
                parsed = None
        if isinstance(parsed, dict):
            url = _resolve_httpx_url(parsed)
            status_code = str(
                parsed.get("status-code") or parsed.get("status_code") or parsed.get("status") or ""
            ).strip()
            title = _clean_text(parsed.get("title", "") or "", 180)
            content_type = _clean_text(parsed.get("content-type", "") or parsed.get("content_type", "") or "", 120)
            lowered_title = title.lower()
            lowered_url = str(url or "").lower()
            _append_url(
                urls,
                url,
                port=str(parsed.get("port", "") or ""),
                service="https" if str(url).startswith("https://") else "http",
                label=title or "httpx",
            )
            for location_key in ("location", "redirectlocation", "redirect", "final-url", "final_url"):
                resolved_location = _resolve_httpx_location(url, parsed.get(location_key))
                if resolved_location:
                    _append_url(
                        urls,
                        resolved_location,
                        port=str(parsed.get("port", "") or ""),
                        service="https" if str(resolved_location).startswith("https://") else "http",
                        label=f"{tool_id} redirect",
                    )
            tech_list = parsed.get("tech") if isinstance(parsed.get("tech"), list) else parsed.get("technologies", [])
            if isinstance(tech_list, list):
                for item in tech_list[:24]:
                    _append_named_version_technology(technologies, item, evidence=f"{tool_id} fingerprint tech detect")
            webserver = _clean_text(parsed.get("webserver", "") or parsed.get("server", ""), 120)
            if webserver:
                server_match = re.search(r"([A-Za-z][A-Za-z0-9+_.-]+)(?:/([0-9][A-Za-z0-9._-]*))?", webserver)
                if server_match:
                    _append_technology(
                        technologies,
                        server_match.group(1),
                        version=server_match.group(2) or "",
                        evidence=f"{tool_id} fingerprint webserver {webserver}",
                    )
            cdn_name = ""
            for key in ("cdn-name", "cdn_name", "cdn"):
                value = parsed.get(key)
                if not isinstance(value, str):
                    continue
                cdn_name = _clean_text(value, 96)
                if cdn_name:
                    break
            if cdn_name:
                _append_named_version_technology(
                    technologies, cdn_name, evidence=f"{tool_id} fingerprint cdn {cdn_name}"
                )

            evidence_parts = [tool_id]
            if url:
                evidence_parts.append(url)
            if status_code:
                evidence_parts.append(f"status {status_code}")
            if title:
                evidence_parts.append(f"title {title}")
            if content_type:
                evidence_parts.append(f"content-type {content_type}")
            evidence_text = " | ".join(evidence_parts)

            if status_code in _DISCOVERY_PRESENT_STATUSES and (
                any(token in lowered_url for token in _DISCOVERY_ADMIN_TOKENS)
                or any(token in lowered_title for token in _DISCOVERY_ADMIN_TOKENS)
            ):
                _append_finding(
                    findings,
                    "Administrative/authentication web page observed",
                    severity="info",
                    evidence=evidence_text,
                )
            if status_code in _DISCOVERY_PRESENT_STATUSES and (
                any(
                    token in lowered_url for token in ("swagger", "openapi", "redoc", "graphql", "graphiql", "actuator")
                )
                or any(
                    token in lowered_title
                    for token in ("swagger", "openapi", "redoc", "graphql", "graphiql", "actuator")
                )
            ):
                _append_finding(
                    findings,
                    "API/diagnostic web page observed",
                    severity="info",
                    evidence=evidence_text,
                )
            if status_code in _DISCOVERY_ACCESSIBLE_STATUSES and (
                "index of /" in lowered_title or "directory listing" in lowered_title
            ):
                _append_finding(
                    findings,
                    "Directory listing observed",
                    severity="low",
                    evidence=evidence_text,
                )
            continue
        for url in _URL_RE.findall(line):
            _append_url(urls, url, label=f"{tool_id} response")
    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=48),
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": _dedupe_rows(urls, ("url",), limit=48),
    }


def _parse_nikto_output(
    tool_id: str,
    output_text: str,
    *,
    base_url: str = "",
    port: str = "",
    protocol: str = "tcp",
    service: str = "",
) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    root_base = f"{base_url.rstrip('/')}/" if base_url else ""

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        lowered = line.lower()
        if lowered.startswith(
            ("- nikto", "+ target ", "+ start time", "+ end time", "+ 1 host(s) tested", "+ host(s) tested")
        ):
            continue

        for url in _URL_RE.findall(line):
            _append_url(urls, url, port=port, protocol=protocol, service=service, label=f"{tool_id} finding")

        server_match = _NIKTO_SERVER_RE.match(line)
        if server_match:
            _append_product_technology(technologies, server_match.group(1), evidence=f"{tool_id}: {line}")
            continue

        powered_by_match = _NIKTO_POWERED_BY_RE.search(line)
        if powered_by_match:
            _append_product_technology(technologies, powered_by_match.group(1), evidence=f"{tool_id}: {line}")

        osvdb_match = _NIKTO_OSVDB_RE.match(line)
        if osvdb_match:
            path_or_url = osvdb_match.group(2)
            if path_or_url.startswith("/") and base_url:
                _append_url(
                    urls,
                    urljoin(f"{base_url.rstrip('/')}/", path_or_url.lstrip("/")),
                    port=port,
                    protocol=protocol,
                    service=service,
                    label=f"{tool_id} finding",
                )
            else:
                _append_url(
                    urls, path_or_url, port=port, protocol=protocol, service=service, label=f"{tool_id} finding"
                )
            _append_finding(
                findings,
                osvdb_match.group(3),
                severity=_infer_finding_severity(osvdb_match.group(3)),
                evidence=line,
            )
            continue

        path_match = _NIKTO_PATH_RE.match(line)
        if not path_match:
            path_match = _NIKTO_VERB_PATH_RE.match(line)
        if path_match:
            path_or_url = path_match.group(1)
            detail = path_match.group(2)
            normalized_path = "/" if path_or_url == "." else path_or_url
            if normalized_path.startswith("/") and base_url:
                _append_url(
                    urls,
                    urljoin(root_base, normalized_path.lstrip("/")),
                    port=port,
                    protocol=protocol,
                    service=service,
                    label=f"{tool_id} finding",
                )
            else:
                _append_url(
                    urls, normalized_path, port=port, protocol=protocol, service=service, label=f"{tool_id} finding"
                )
            if detail and not detail.lower().startswith(
                ("retrieved x-powered-by header", "server leaks inodes via etags")
            ):
                if detail.lower().startswith("uncommon header '"):
                    continue
                title = detail
                if "allowed http methods" in detail.lower():
                    title = "HTTP methods exposed"
                _append_finding(
                    findings,
                    title,
                    severity=_infer_finding_severity(detail),
                    cve=_CVE_RE.search(detail).group(0).upper() if _CVE_RE.search(detail) else "",
                    evidence=line,
                )
            continue

        if "allowed http methods" in lowered:
            _append_finding(findings, "HTTP methods exposed", severity="low", evidence=line)
        elif any(token in lowered for token in ("phpinfo()", "xmlrpc", "directory indexing", "directory listing")):
            _append_finding(
                findings, _clean_text(line.lstrip("+ "), 240), severity=_infer_finding_severity(line), evidence=line
            )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=24),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=48),
        "urls": _dedupe_rows(urls, ("url",), limit=64),
    }


def _parse_curl_output(
    tool_id: str,
    output_text: str,
    *,
    port: str = "",
    protocol: str = "tcp",
    service: str = "",
    base_url: str = "",
) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    header_lines = 0
    robots_paths = set()
    seen_auth_headers = set()

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        if tool_id == "curl-robots":
            sitemap_match = re.match(r"(?i)^sitemap:\s*(\S+)$", line)
            if sitemap_match:
                resolved = _resolve_web_url(sitemap_match.group(1), base_url=base_url) or _clean_url(
                    sitemap_match.group(1)
                )
                _append_url(urls, resolved, port=port, protocol=protocol, service=service, label=f"{tool_id} sitemap")
                continue
            path_match = re.match(r"(?i)^(?:allow|disallow):\s*(/\S+)\s*$", line)
            if path_match:
                path_value = str(path_match.group(1) or "").strip()
                robots_paths.add(path_value)
                resolved = _resolve_web_url(path_value, base_url=base_url)
                _append_url(urls, resolved, port=port, protocol=protocol, service=service, label=f"{tool_id} path")
                _append_finding(findings, "robots.txt directives exposed", severity="info", evidence=line)
                continue
            if re.match(r"(?i)^user-agent:\s*", line):
                _append_finding(findings, "robots.txt directives exposed", severity="info", evidence=line)
                continue
        status_match = _HTTP_STATUS_RE.match(line)
        if status_match:
            status_code = str(status_match.group(1) or "").strip()
            status_reason = _clean_text(status_match.group(2) or "", 120)
            if status_code in {"401", "407"}:
                _append_finding(
                    findings,
                    "HTTP authentication required",
                    severity="info",
                    evidence=_clean_text(f"{line} {status_reason}", 240),
                )
            continue
        header_match = _HTTP_HEADER_RE.match(line)
        if header_match:
            header_lines += 1
            key = str(header_match.group(1) or "").strip().lower()
            value = _clean_text(header_match.group(2), 240)
            if key == "server":
                _append_product_technology(technologies, value, evidence=f"{tool_id} header server {value}")
            elif key == "x-powered-by":
                _append_product_technology(technologies, value, evidence=f"{tool_id} header x-powered-by {value}")
            elif key == "location":
                resolved = _resolve_web_url(value, base_url=base_url) or _clean_url(value)
                _append_url(urls, resolved, port=port, protocol=protocol, service=service, label=f"{tool_id} redirect")
                _append_finding(findings, "HTTP redirect observed", severity="info", evidence=line)
            elif key == "allow" and value:
                _append_finding(findings, "HTTP methods exposed", severity="low", evidence=line)
                dangerous_methods = [
                    method
                    for method in ("PUT", "DELETE", "TRACE", "CONNECT", "PATCH")
                    if re.search(rf"(?i)\b{re.escape(method)}\b", value)
                ]
                if dangerous_methods:
                    _append_finding(
                        findings,
                        f"Potentially dangerous HTTP methods allowed ({', '.join(dangerous_methods)})",
                        severity="medium" if "TRACE" in dangerous_methods else "low",
                        evidence=line,
                    )
            elif key == "sitemap":
                resolved = _resolve_web_url(value, base_url=base_url) or _clean_url(value)
                _append_url(urls, resolved, port=port, protocol=protocol, service=service, label=f"{tool_id} sitemap")
            elif key == "www-authenticate" and value:
                auth_scheme = value.split()[0].strip(",").strip() if value else ""
                auth_scheme_lower = auth_scheme.lower()
                if auth_scheme_lower and auth_scheme_lower not in seen_auth_headers:
                    seen_auth_headers.add(auth_scheme_lower)
                    _append_finding(
                        findings,
                        f"HTTP authentication challenge exposed ({auth_scheme})",
                        severity="info",
                        evidence=line,
                    )
            elif key == "strict-transport-security" and value:
                _append_finding(findings, "HSTS header observed", severity="info", evidence=line)
            elif key == "content-security-policy" and value:
                _append_finding(findings, "Content-Security-Policy header observed", severity="info", evidence=line)
            elif key == "x-frame-options" and value:
                _append_finding(findings, "X-Frame-Options header observed", severity="info", evidence=line)
            continue

    if not header_lines:
        title_match = _HTML_TITLE_RE.search(str(output_text or ""))
        if title_match:
            title = _clean_text(title_match.group(1), 180)
            if "plain http request was sent to https port" in title.lower():
                _append_finding(findings, title, severity="info", evidence=title)

    if robots_paths:
        _append_finding(
            findings,
            f"robots.txt paths disclosed ({len(robots_paths)})",
            severity="info",
            evidence_items=sorted(robots_paths),
            evidence=f"{tool_id}: {', '.join(sorted(robots_paths)[:8])}",
        )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=24),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=16),
        "urls": _dedupe_rows(urls, ("url",), limit=32),
    }


def _parse_waf_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []

    def _append_waf_vendor(vendor_name: Any, *, manufacturer: Any = "", evidence: str = "") -> bool:
        firewall = _clean_text(vendor_name, 96).strip(" .")
        maker = _clean_text(manufacturer, 96).strip(" .")
        if not firewall:
            return False
        lowered_firewall = firewall.lower()
        if lowered_firewall in {"none", "generic", "unknown"} or "some sort of security" in lowered_firewall:
            return False
        evidence_text = _clean_text(evidence or f"{tool_id}: {firewall}", 520)
        if maker and maker.lower() not in {"none", "unknown"}:
            evidence_text = _clean_text(f"{evidence_text} [{maker}]", 520)
        _append_technology(technologies, f"{firewall} WAF", evidence=evidence_text)
        _append_finding(findings, f"WAF detected: {firewall}", severity="info", evidence=evidence_text)
        return True

    text = str(output_text or "")
    stripped = text.lstrip()
    if stripped.startswith("[") or stripped.startswith("{"):
        try:
            payload = json.loads(text)
        except Exception:
            payload = None
        if isinstance(payload, dict):
            payload = payload.get("results", payload)
        if isinstance(payload, list):
            vendor_detected = False
            generic_detected = False
            for record in payload:
                if not isinstance(record, dict):
                    continue
                record_url = _clean_url(record.get("url"))
                if record_url:
                    _append_url(urls, record_url, label=f"{tool_id} target")
                if not record.get("detected"):
                    continue
                firewall = _clean_text(record.get("firewall"), 96)
                manufacturer = _clean_text(record.get("manufacturer"), 96)
                evidence = f"{tool_id} json: firewall={firewall or 'unknown'}"
                if manufacturer and manufacturer.lower() not in {"none", "unknown"}:
                    evidence += f" manufacturer={manufacturer}"
                if _append_waf_vendor(firewall, manufacturer=manufacturer, evidence=evidence):
                    vendor_detected = True
                elif firewall.lower() == "generic":
                    generic_detected = True
            if generic_detected and not vendor_detected:
                _append_finding(
                    findings, "WAF detected", severity="info", evidence=f"{tool_id} json: generic detection"
                )
            return {
                "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=12),
                "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=16),
                "urls": _dedupe_rows(urls, ("url",), limit=16),
            }

    generic_detected = False
    generic_reason = ""
    vendor_detected = False

    for raw_line in text.splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        lowered = line.lower()
        for url in _URL_RE.findall(line):
            _append_url(urls, url, label=f"{tool_id} target")

        if "no waf" in lowered or "not behind a waf" in lowered or "was not detected on" in lowered:
            continue

        reason_match = _WAF_REASON_RE.match(line)
        if reason_match:
            generic_reason = _clean_text(reason_match.group(1), 240)
            continue

        site_match = _WAF_SITE_VENDORS_RE.search(line)
        if site_match:
            vendor_blob = _clean_text(site_match.group("vendors"), 180)
            vendor_chunks = [chunk.strip(" .") for chunk in re.split(r"\s+and/or\s+", vendor_blob) if chunk.strip()]
            for chunk in vendor_chunks:
                detail_match = _WAF_VENDOR_DETAIL_RE.match(chunk)
                if detail_match and _append_waf_vendor(
                    detail_match.group("firewall"),
                    manufacturer=detail_match.group("manufacturer") or "",
                    evidence=f"{tool_id}: {line}",
                ):
                    vendor_detected = True
            if vendor_detected:
                continue

        vendor_match = _WAF_VENDOR_RE.search(line)
        if vendor_match:
            vendor = _clean_text(vendor_match.group(1), 96).strip(" .")
            if _append_waf_vendor(vendor, evidence=f"{tool_id}: {line}"):
                vendor_detected = True
                continue

        if "seems to be behind a waf" in lowered or ("waf" in lowered and "generic detection" in lowered):
            generic_detected = True
            continue

    if generic_detected and not vendor_detected:
        evidence = f"{tool_id}: generic detection"
        if generic_reason:
            evidence += f" ({generic_reason})"
        _append_finding(findings, "WAF detected", severity="info", evidence=evidence)

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=12),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=16),
        "urls": _dedupe_rows(urls, ("url",), limit=16),
    }
