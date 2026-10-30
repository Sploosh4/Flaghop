"""Tool observation parsing: discovery."""

from __future__ import annotations

import re
from typing import Any, Dict, List
from urllib.parse import urljoin, urlparse

from app.scheduler.observations.common import (
    _append_finding,
    _append_named_version_technology,
    _append_url,
    _classify_content_discovery_path,
    _clean_text,
    _clean_url,
    _dedupe_rows,
    _infer_crawled_path_technologies,
    _is_interesting_web_path,
    _iter_discovery_records,
    _iter_json_payloads,
    _nested_dict_value,
)
from app.scheduler.observations.constants import (
    _ANSI_ESCAPE_RE,
    _DISCOVERY_ADMIN_TOKENS,
    _DISCOVERY_API_TOKENS,
    _DISCOVERY_PATH_RE,
    _FEROX_LINE_RE,
    _GOBUSTER_LINE_RE,
    _GOBUSTER_URL_LINE_RE,
    _URL_RE,
)


def _parse_content_discovery_output(
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
    interesting_paths: List[str] = []
    admin_paths: List[str] = []
    api_paths: List[str] = []
    sensitive_paths: List[str] = []
    backup_paths: List[str] = []

    for payload in _iter_json_payloads(output_text):
        for item in _iter_discovery_records(payload):
            if not isinstance(item, dict):
                continue
            if "results" in item and not any(
                key in item for key in ("status", "status_code", "path", "location", "redirect", "redirectlocation")
            ):
                continue
            url = item.get("url") or item.get("input") or item.get("host") or ""
            path = item.get("path") or item.get("location") or ""
            status = str(item.get("status") or item.get("status_code") or "").strip()
            normalized_url = str(url or "").strip()
            if normalized_url and "FUZZ" not in normalized_url.upper():
                _append_url(
                    urls,
                    normalized_url,
                    port=port,
                    protocol=protocol,
                    service=service,
                    label=f"{tool_id} discovered content",
                )
            joined_path_url = ""
            if path:
                join_base = normalized_url or base_url
                if join_base:
                    joined_path_url = urljoin(f"{str(join_base).rstrip('/')}/", str(path).lstrip("/"))
                    _append_url(
                        urls,
                        joined_path_url,
                        port=port,
                        protocol=protocol,
                        service=service,
                        label=f"{tool_id} discovered path",
                    )
            elif not normalized_url and base_url:
                joined_path_url = urljoin(f"{base_url.rstrip('/')}/", str(path).lstrip("/"))
            redirect_target = item.get("redirect") or item.get("redirectlocation") or item.get("redirect_url") or ""
            if redirect_target:
                _append_url(
                    urls, redirect_target, port=port, protocol=protocol, service=service, label=f"{tool_id} redirect"
                )
            candidate_path = str(path or urlparse(str(joined_path_url or normalized_url or "")).path or "").strip()
            _classify_content_discovery_path(
                technologies,
                tool_id=tool_id,
                candidate_path=candidate_path,
                status=status,
                interesting_paths=interesting_paths,
                admin_paths=admin_paths,
                api_paths=api_paths,
                sensitive_paths=sensitive_paths,
                backup_paths=backup_paths,
            )

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        if line[:1] in {"{", "["}:
            continue
        ferox_match = _FEROX_LINE_RE.match(line)
        if ferox_match:
            status = str(ferox_match.group("status") or "").strip()
            target_url = _clean_url(ferox_match.group("url") or "")
            redirect_url = _clean_url(ferox_match.group("redirect") or "")
            if target_url:
                _append_url(
                    urls,
                    target_url,
                    port=port,
                    protocol=protocol,
                    service=service,
                    label=f"{tool_id} discovered content",
                )
                candidate_path = str(urlparse(target_url).path or "").strip()
                _classify_content_discovery_path(
                    technologies,
                    tool_id=tool_id,
                    candidate_path=candidate_path,
                    status=status,
                    interesting_paths=interesting_paths,
                    admin_paths=admin_paths,
                    api_paths=api_paths,
                    sensitive_paths=sensitive_paths,
                    backup_paths=backup_paths,
                )
            if redirect_url:
                _append_url(
                    urls, redirect_url, port=port, protocol=protocol, service=service, label=f"{tool_id} redirect"
                )
            continue
        gobuster_url_match = _GOBUSTER_URL_LINE_RE.match(line)
        if gobuster_url_match:
            status = str(gobuster_url_match.group("status") or "").strip()
            target_url = _clean_url(gobuster_url_match.group("url") or "")
            redirect_url = _clean_url(gobuster_url_match.group("redirect") or "")
            if target_url:
                _append_url(
                    urls,
                    target_url,
                    port=port,
                    protocol=protocol,
                    service=service,
                    label=f"{tool_id} discovered content",
                )
                _classify_content_discovery_path(
                    technologies,
                    tool_id=tool_id,
                    candidate_path=str(urlparse(target_url).path or "").strip(),
                    status=status,
                    interesting_paths=interesting_paths,
                    admin_paths=admin_paths,
                    api_paths=api_paths,
                    sensitive_paths=sensitive_paths,
                    backup_paths=backup_paths,
                )
            if redirect_url:
                _append_url(
                    urls, redirect_url, port=port, protocol=protocol, service=service, label=f"{tool_id} redirect"
                )
            continue
        gobuster_match = _GOBUSTER_LINE_RE.match(line)
        if gobuster_match and base_url:
            path = str(gobuster_match.group("path") or "").strip()
            status = str(gobuster_match.group("status") or "").strip()
            redirect_url = _clean_url(gobuster_match.group("redirect") or "")
            if path:
                joined = urljoin(f"{base_url.rstrip('/')}/", path.lstrip("/"))
                _append_url(
                    urls, joined, port=port, protocol=protocol, service=service, label=f"{tool_id} discovered path"
                )
                _classify_content_discovery_path(
                    technologies,
                    tool_id=tool_id,
                    candidate_path=path,
                    status=status,
                    interesting_paths=interesting_paths,
                    admin_paths=admin_paths,
                    api_paths=api_paths,
                    sensitive_paths=sensitive_paths,
                    backup_paths=backup_paths,
                )
            if redirect_url:
                _append_url(
                    urls, redirect_url, port=port, protocol=protocol, service=service, label=f"{tool_id} redirect"
                )
            continue
        for url in _URL_RE.findall(line):
            _append_url(urls, url, port=port, protocol=protocol, service=service, label=f"{tool_id} discovered url")
        if base_url:
            for path in _DISCOVERY_PATH_RE.findall(line):
                joined = urljoin(f"{base_url.rstrip('/')}/", str(path).lstrip("/"))
                _append_url(
                    urls, joined, port=port, protocol=protocol, service=service, label=f"{tool_id} discovered path"
                )

    if interesting_paths:
        _append_finding(
            findings,
            f"Interesting web paths discovered ({len(set(interesting_paths))})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(set(interesting_paths))[:8])}",
            evidence_items=sorted(set(interesting_paths)),
        )
    if admin_paths:
        _append_finding(
            findings,
            f"Administrative/authentication paths discovered ({len(set(admin_paths))})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(set(admin_paths))[:8])}",
            evidence_items=sorted(set(admin_paths)),
        )
    if api_paths:
        _append_finding(
            findings,
            f"API/diagnostic paths discovered ({len(set(api_paths))})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(set(api_paths))[:8])}",
            evidence_items=sorted(set(api_paths)),
        )
    if sensitive_paths:
        _append_finding(
            findings,
            f"Sensitive web files exposed ({len(set(sensitive_paths))})",
            severity="low",
            evidence=f"{tool_id}: {', '.join(sorted(set(sensitive_paths))[:8])}",
            evidence_items=sorted(set(sensitive_paths)),
        )
    if backup_paths:
        _append_finding(
            findings,
            f"Backup/config artifacts exposed ({len(set(backup_paths))})",
            severity="low",
            evidence=f"{tool_id}: {', '.join(sorted(set(backup_paths))[:8])}",
            evidence_items=sorted(set(backup_paths)),
        )
    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe", "evidence"), limit=16),
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=16),
        "urls": _dedupe_rows(urls, ("url",), limit=96),
    }


def _parse_katana_output(
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
    interesting_paths: List[str] = []
    admin_paths: List[str] = []
    api_paths: List[str] = []
    javascript_paths: List[str] = []

    for payload in _iter_json_payloads(output_text):
        records: List[Any] = []
        if isinstance(payload, dict):
            records.append(payload)
        elif isinstance(payload, list):
            records.extend(list(payload))
        for item in records:
            if not isinstance(item, dict):
                continue
            target_url = _nested_dict_value(
                item,
                "url",
                "endpoint",
                "request.endpoint",
                "request.url",
                "response.url",
                "response.endpoint",
                "final_url",
            )
            normalized_url = str(target_url or "").strip()
            if normalized_url and not re.match(r"(?i)^https?://", normalized_url) and base_url:
                normalized_url = urljoin(f"{base_url.rstrip('/')}/", normalized_url.lstrip("/"))
            if normalized_url:
                _append_url(
                    urls, normalized_url, port=port, protocol=protocol, service=service, label=f"{tool_id} crawled url"
                )

            status = str(
                _nested_dict_value(item, "status", "status_code", "response.status", "response.status_code") or ""
            ).strip()
            redirect_target = _nested_dict_value(
                item, "redirect", "redirect_url", "response.redirect", "response.redirect_url", "response.location"
            )
            redirect_url = str(redirect_target or "").strip()
            if redirect_url and not re.match(r"(?i)^https?://", redirect_url) and base_url:
                redirect_url = urljoin(f"{base_url.rstrip('/')}/", redirect_url.lstrip("/"))
            if redirect_url:
                _append_url(
                    urls, redirect_url, port=port, protocol=protocol, service=service, label=f"{tool_id} redirect"
                )

            candidate_path = str(urlparse(normalized_url).path or "").strip()
            if not candidate_path:
                candidate_path = str(_nested_dict_value(item, "path", "request.path") or "").strip()
            if candidate_path and not candidate_path.startswith("/"):
                candidate_path = "/" + candidate_path.lstrip("/")
            if candidate_path:
                _infer_crawled_path_technologies(technologies, tool_id=tool_id, candidate_path=candidate_path)
                display_item = f"{candidate_path} ({status})" if status else candidate_path
                if _is_interesting_web_path(candidate_path):
                    interesting_paths.append(display_item)
                lowered_path = candidate_path.lower()
                if any(token in lowered_path for token in _DISCOVERY_ADMIN_TOKENS):
                    admin_paths.append(display_item)
                if any(token in lowered_path for token in _DISCOVERY_API_TOKENS):
                    api_paths.append(display_item)
                if lowered_path.endswith(".js") or lowered_path.endswith(".mjs") or lowered_path.endswith(".map"):
                    javascript_paths.append(display_item)

            for tech_value in list(item.get("technologies", []) or []):
                _append_named_version_technology(technologies, tech_value, evidence=f"{tool_id} technology hint")
            for tech_value in list(item.get("tech", []) or []):
                _append_named_version_technology(technologies, tech_value, evidence=f"{tool_id} technology hint")
            content_type = _clean_text(
                _nested_dict_value(item, "response.headers.content_type", "response.content_type", "content_type"), 160
            )
            if "javascript" in content_type.lower() and candidate_path:
                display_item = f"{candidate_path} ({status})" if status else candidate_path
                javascript_paths.append(display_item)

    if interesting_paths:
        _append_finding(
            findings,
            f"Interesting crawl paths discovered ({len(set(interesting_paths))})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(set(interesting_paths))[:8])}",
            evidence_items=sorted(set(interesting_paths)),
        )
    if admin_paths:
        _append_finding(
            findings,
            f"Administrative/authentication crawl endpoints discovered ({len(set(admin_paths))})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(set(admin_paths))[:8])}",
            evidence_items=sorted(set(admin_paths)),
        )
    if api_paths:
        _append_finding(
            findings,
            f"API/diagnostic crawl endpoints discovered ({len(set(api_paths))})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(set(api_paths))[:8])}",
            evidence_items=sorted(set(api_paths)),
        )
    if javascript_paths:
        _append_finding(
            findings,
            f"JavaScript crawl endpoints discovered ({len(set(javascript_paths))})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(set(javascript_paths))[:8])}",
            evidence_items=sorted(set(javascript_paths)),
        )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe", "evidence"), limit=16),
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=16),
        "urls": _dedupe_rows(urls, ("url",), limit=96),
    }
