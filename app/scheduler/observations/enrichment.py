"""Tool observation parsing: enrichment."""

from __future__ import annotations

import ipaddress
from typing import Any, Dict, List
from urllib.parse import urlparse

from app.scheduler.observations.common import (
    _append_finding,
    _append_technology,
    _append_url,
    _clean_text,
    _clean_url,
    _dedupe_rows,
    _iter_json_payloads,
    _normalize_discovered_host,
)
from app.scheduler.observations.constants import (
    _GRAYHAT_BUCKET_TECH_MAP,
)


def _append_grayhat_bucket_technologies(
    technologies: List[Dict[str, Any]],
    *,
    bucket_type: str,
    bucket_name: str,
    tool_id: str,
):
    mapped = _GRAYHAT_BUCKET_TECH_MAP.get(str(bucket_type or "").strip().lower(), ())
    if not mapped:
        return
    for tech_name in mapped:
        _append_technology(
            technologies,
            tech_name,
            evidence=f"{tool_id} bucket match {bucket_name}",
        )


def _parse_grayhatwarfare_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    findings: List[Dict[str, Any]] = []
    technologies: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    discovered_hosts = set()

    payloads = _iter_json_payloads(str(output_text or ""))
    payload = next((item for item in payloads if isinstance(item, dict)), {})
    if not isinstance(payload, dict) or not payload:
        return {"technologies": [], "findings": [], "urls": [], "discovered_hosts": []}

    root_domain = _clean_text(payload.get("root_domain", "") or payload.get("input_domain", ""), 120)
    buckets = payload.get("buckets", []) if isinstance(payload.get("buckets", []), list) else []
    files = payload.get("files", []) if isinstance(payload.get("files", []), list) else []
    meta = payload.get("meta", {}) if isinstance(payload.get("meta", {}), dict) else {}

    bucket_evidence_items: List[str] = []
    file_evidence_items: List[str] = []

    for item in buckets:
        if not isinstance(item, dict):
            continue
        bucket_name = _normalize_discovered_host(item.get("bucket", ""))
        bucket_type = _clean_text(item.get("type", ""), 16).lower()
        if bucket_name:
            discovered_hosts.add(bucket_name)
            bucket_evidence_items.append(bucket_name)
            _append_url(urls, f"https://{bucket_name}", label=f"{tool_id} bucket")
            _append_grayhat_bucket_technologies(
                technologies,
                bucket_type=bucket_type,
                bucket_name=bucket_name,
                tool_id=tool_id,
            )

    for item in files:
        if not isinstance(item, dict):
            continue
        file_url = _clean_url(item.get("url", ""))
        bucket_name = _normalize_discovered_host(item.get("bucket", ""))
        bucket_type = _clean_text(item.get("type", ""), 16).lower()
        if bucket_name:
            discovered_hosts.add(bucket_name)
            _append_grayhat_bucket_technologies(
                technologies,
                bucket_type=bucket_type,
                bucket_name=bucket_name,
                tool_id=tool_id,
            )
        if file_url:
            file_evidence_items.append(file_url)
            _append_url(urls, file_url, label=f"{tool_id} file")
            parsed = urlparse(file_url)
            discovered = _normalize_discovered_host(parsed.hostname or "")
            if discovered:
                discovered_hosts.add(discovered)

    bucket_results = int(meta.get("bucket_results", len(bucket_evidence_items)) or 0)
    file_results = int(meta.get("file_results", len(file_evidence_items)) or 0)
    evidence_prefix = f"{tool_id}: {root_domain}" if root_domain else tool_id

    if bucket_evidence_items or bucket_results:
        _append_finding(
            findings,
            f"Grayhat Warfare public bucket matches ({max(bucket_results, len(bucket_evidence_items))})",
            severity="info",
            evidence=f"{evidence_prefix} buckets",
            evidence_items=sorted(set(bucket_evidence_items))[:16],
        )
    if file_evidence_items or file_results:
        _append_finding(
            findings,
            f"Grayhat Warfare public file matches ({max(file_results, len(file_evidence_items))})",
            severity="low",
            evidence=f"{evidence_prefix} files",
            evidence_items=sorted(set(file_evidence_items))[:16],
        )

    fallback_keyword = _clean_text(meta.get("file_fallback_keyword_query", ""), 64)
    if fallback_keyword:
        _append_finding(
            findings,
            "Grayhat Warfare regex search downgraded to keyword search",
            severity="info",
            evidence=f"{tool_id}: {fallback_keyword}",
        )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe", "evidence"), limit=24),
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": _dedupe_rows(urls, ("url",), limit=48),
        "discovered_hosts": sorted(discovered_hosts),
    }


def _shodan_match_ip(match: Dict[str, Any]) -> str:
    ip_str = _clean_text(match.get("ip_str", ""), 64)
    if ip_str:
        return ip_str
    try:
        raw_value = match.get("ip")
        if raw_value in (None, ""):
            return ""
        return str(ipaddress.ip_address(int(raw_value)))
    except Exception:
        return ""


def _parse_shodan_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    findings: List[Dict[str, Any]] = []
    technologies: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    discovered_hosts = set()

    payloads = _iter_json_payloads(str(output_text or ""))
    payload = next((item for item in payloads if isinstance(item, dict)), {})
    if not isinstance(payload, dict) or not payload:
        return {"technologies": [], "findings": [], "urls": [], "discovered_hosts": []}

    exact_hostname = _normalize_discovered_host(payload.get("exact_hostname", "") or payload.get("input_target", ""))
    root_domain = _clean_text(payload.get("root_domain", ""), 120)
    dns_resolve = payload.get("dns_resolve", {}) if isinstance(payload.get("dns_resolve", {}), dict) else {}
    dns_domain = payload.get("dns_domain", {}) if isinstance(payload.get("dns_domain", {}), dict) else {}
    matches = payload.get("matches", []) if isinstance(payload.get("matches", []), list) else []
    total = int(payload.get("total", len(matches)) or 0)

    if exact_hostname:
        discovered_hosts.add(exact_hostname)
    if exact_hostname and exact_hostname in dns_resolve:
        resolved_ip = _clean_text(dns_resolve.get(exact_hostname, ""), 64)
        if resolved_ip:
            _append_finding(
                findings,
                "Shodan DNS resolve hit",
                severity="info",
                evidence=f"{tool_id}: {exact_hostname} -> {resolved_ip}",
            )

    for record in list(dns_domain.get("data", []) or [])[:100]:
        if not isinstance(record, dict):
            continue
        subdomain = _clean_text(record.get("subdomain", ""), 255).strip(".")
        if not subdomain:
            continue
        if subdomain == "@":
            discovered_host = root_domain
        elif root_domain:
            discovered_host = _normalize_discovered_host(f"{subdomain}.{root_domain}")
        else:
            discovered_host = _normalize_discovered_host(subdomain)
        if discovered_host:
            discovered_hosts.add(discovered_host)

    evidence_items: List[str] = []
    http_port_map = {
        80: "http",
        443: "https",
        8000: "http",
        8080: "http",
        8443: "https",
        8888: "http",
        9443: "https",
    }
    for item in list(matches or [])[:25]:
        if not isinstance(item, dict):
            continue
        match_ip = _shodan_match_ip(item)
        try:
            match_port = int(item.get("port", 0) or 0)
        except (TypeError, ValueError):
            match_port = 0
        hostnames = {
            host
            for host in (_normalize_discovered_host(raw_host) for raw_host in list(item.get("hostnames", []) or []))
            if host
        }
        domains = {
            host
            for host in (_normalize_discovered_host(raw_host) for raw_host in list(item.get("domains", []) or []))
            if host
        }
        for host in sorted(hostnames | domains):
            if root_domain and not (host == root_domain or host.endswith(f".{root_domain}")):
                continue
            discovered_hosts.add(host)
            if match_port in http_port_map:
                scheme = http_port_map[match_port]
                _append_url(urls, f"{scheme}://{host}:{match_port}", label=f"{tool_id} host")

        product = _clean_text(item.get("product", ""), 120)
        if product and match_ip and match_port:
            _append_technology(
                technologies,
                product,
                evidence=f"{tool_id} {match_ip}:{match_port}",
            )

        display_host = next(iter(sorted(hostnames)), exact_hostname or match_ip)
        display = ":".join(part for part in [display_host or match_ip, str(match_port) if match_port else ""] if part)
        if product:
            display = f"{display} {product}".strip()
        if display:
            evidence_items.append(display)

    if total or evidence_items:
        _append_finding(
            findings,
            f"Shodan indexed matches ({max(total, len(evidence_items))})",
            severity="info",
            evidence=f"{tool_id}: {exact_hostname or root_domain}",
            evidence_items=sorted(set(evidence_items))[:16],
        )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe", "evidence"), limit=24),
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": _dedupe_rows(urls, ("url",), limit=48),
        "discovered_hosts": sorted(discovered_hosts),
    }
