"""Tool observation parsing: facade."""

from __future__ import annotations

from typing import Any, Dict, List
from urllib.parse import urljoin

from app.scheduler.observations.common import (
    _append_url,
    _artifact_reader_supported,
    _build_base_web_url,
    _dedupe_rows,
    _load_artifact_texts,
    _merge_results,
    _normalize_discovered_host,
    _select_artifact_refs_for_tool,
)
from app.scheduler.observations.constants import (
    _DISCOVERY_PATH_RE,
    _URL_RE,
)
from app.scheduler.observations.discovery import (
    _parse_content_discovery_output,
    _parse_katana_output,
)
from app.scheduler.observations.enrichment import (
    _parse_grayhatwarfare_output,
    _parse_shodan_output,
)
from app.scheduler.observations.fingerprints import (
    _parse_curl_output,
    _parse_httpx_output,
    _parse_nikto_output,
    _parse_waf_output,
    _parse_whatweb_output,
)
from app.scheduler.observations.network import (
    _parse_database_info_output,
    _parse_dnsmap_output,
    _parse_nbtscan_output,
    _parse_smb_enum_output,
    _parse_subfinder_output,
)
from app.scheduler.observations.screenshots import (
    _parse_screenshot_output,
)
from app.scheduler.observations.tls import (
    _parse_testssl_output,
    _parse_tls_output,
)
from app.scheduler.observations.vulnerabilities import (
    _parse_nuclei_output,
    _parse_sqlmap_output,
    _parse_vuln_script_output,
    _parse_wpscan_output,
)

__all__ = ["extract_tool_observations"]


def extract_tool_observations(
    tool_id: Any,
    output_text: Any,
    *,
    port: Any = "",
    protocol: Any = "tcp",
    service: Any = "",
    artifact_refs: Any = None,
    host_ip: Any = "",
    hostname: Any = "",
) -> Dict[str, Any]:
    normalized_tool = str(tool_id or "").strip().lower()
    text = str(output_text or "")
    if not normalized_tool or (not text.strip() and not list(artifact_refs or [])):
        return {"technologies": [], "findings": [], "urls": [], "discovered_hosts": [], "finding_quality_events": []}

    base_url = _build_base_web_url(
        host_ip=host_ip,
        hostname=hostname,
        port=port,
        service=service,
    )
    sources = [text]
    if _artifact_reader_supported(normalized_tool):
        sources.extend(_load_artifact_texts(_select_artifact_refs_for_tool(normalized_tool, artifact_refs or [])))

    result = {"technologies": [], "findings": [], "urls": [], "discovered_hosts": [], "finding_quality_events": []}
    for source_text in sources:
        source = str(source_text or "")
        if not source.strip():
            continue
        current = {"technologies": [], "findings": [], "urls": [], "discovered_hosts": [], "finding_quality_events": []}
        if normalized_tool.startswith("whatweb"):
            current = _parse_whatweb_output(normalized_tool, source)
        elif normalized_tool.startswith("httpx"):
            current = _parse_httpx_output(normalized_tool, source)
        elif normalized_tool == "nikto":
            current = _parse_nikto_output(
                normalized_tool,
                source,
                base_url=base_url,
                port=str(port or ""),
                protocol=str(protocol or "tcp"),
                service=str(service or ""),
            )
        elif "nuclei" in normalized_tool:
            current = _parse_nuclei_output(
                normalized_tool,
                source,
                port=str(port or ""),
                protocol=str(protocol or "tcp"),
                service=str(service or ""),
            )
        elif normalized_tool == "nmap-vuln.nse" or normalized_tool.startswith("http-vuln-"):
            current = _parse_vuln_script_output(normalized_tool, source)
        elif normalized_tool in {"sslscan", "sslyze"}:
            current = _parse_tls_output(normalized_tool, source)
        elif normalized_tool in {"testssl", "testssl.sh"}:
            current = _parse_testssl_output(normalized_tool, source)
        elif normalized_tool == "wafw00f":
            current = _parse_waf_output(normalized_tool, source)
        elif normalized_tool in {"curl-headers", "curl-options", "curl-robots"}:
            current = _parse_curl_output(
                normalized_tool,
                source,
                port=str(port or ""),
                protocol=str(protocol or "tcp"),
                service=str(service or ""),
                base_url=base_url,
            )
        elif normalized_tool in {"web-content-discovery", "dirsearch", "ffuf"}:
            current = _parse_content_discovery_output(
                normalized_tool,
                source,
                base_url=base_url,
                port=str(port or ""),
                protocol=str(protocol or "tcp"),
                service=str(service or ""),
            )
        elif normalized_tool == "katana":
            current = _parse_katana_output(
                normalized_tool,
                source,
                base_url=base_url,
                port=str(port or ""),
                protocol=str(protocol or "tcp"),
                service=str(service or ""),
            )
        elif normalized_tool in {"sqlmap", "http-sqlmap"}:
            current = _parse_sqlmap_output(normalized_tool, source)
        elif normalized_tool == "wpscan":
            current = _parse_wpscan_output(normalized_tool, source)
        elif normalized_tool in {"mysql-info.nse", "pgsql-info.nse", "ms-sql-info.nse"}:
            current = _parse_database_info_output(normalized_tool, source)
        elif normalized_tool in {
            "enum4linux-ng",
            "enum4linux",
            "smbenum",
            "samrdump",
            "smbmap",
            "rpcclient-enum",
            "netexec",
        } or normalized_tool.startswith("rpcclient"):
            current = _parse_smb_enum_output(normalized_tool, source)
        elif normalized_tool == "nbtscan":
            current = _parse_nbtscan_output(normalized_tool, source)
        elif normalized_tool == "subfinder":
            current = _parse_subfinder_output(normalized_tool, source)
        elif normalized_tool == "grayhatwarfare":
            current = _parse_grayhatwarfare_output(normalized_tool, source)
        elif normalized_tool == "shodan-enrichment":
            current = _parse_shodan_output(normalized_tool, source)
        elif normalized_tool == "dnsmap":
            current = _parse_dnsmap_output(normalized_tool, source)
        elif normalized_tool == "screenshooter":
            current = _parse_screenshot_output(
                normalized_tool,
                source,
                base_url=base_url,
                port=str(port or ""),
                protocol=str(protocol or "tcp"),
                service=str(service or ""),
            )
        result = _merge_results(result, current)

    # Generic URL harvesting helps the graph even when the tool-specific parser
    # does not expose structured URLs.
    extra_urls = list(result.get("urls", []))
    for source_text in sources:
        if not (
            normalized_tool == "nmap-vuln.nse"
            or normalized_tool.startswith("http-vuln-")
            or normalized_tool == "wpscan"
        ):
            for url in _URL_RE.findall(str(source_text or "")):
                if (
                    normalized_tool in {"web-content-discovery", "dirsearch", "ffuf"}
                    and "FUZZ" in str(url or "").upper()
                ):
                    continue
                _append_url(
                    extra_urls,
                    url,
                    port=str(port or ""),
                    protocol=str(protocol or "tcp"),
                    service=str(service or ""),
                    label=normalized_tool,
                )
        if base_url and normalized_tool in {"web-content-discovery", "dirsearch", "ffuf", "katana"}:
            for path in _DISCOVERY_PATH_RE.findall(str(source_text or "")):
                _append_url(
                    extra_urls,
                    urljoin(f"{base_url.rstrip('/')}/", str(path).lstrip("/")),
                    port=str(port or ""),
                    protocol=str(protocol or "tcp"),
                    service=str(service or ""),
                    label=f"{normalized_tool} path",
                )
    result["technologies"] = _dedupe_rows(
        list(result.get("technologies", []) or []), ("name", "version", "cpe", "evidence"), limit=64
    )
    result["findings"] = _dedupe_rows(list(result.get("findings", []) or []), ("title", "cve", "evidence"), limit=64)
    result["urls"] = _dedupe_rows(extra_urls, ("url",), limit=96)
    deduped_hosts: List[str] = []
    seen_hosts = set()
    for item in list(result.get("discovered_hosts", []) or []):
        host = _normalize_discovered_host(item)
        if not host:
            continue
        lowered = host.lower()
        if lowered in seen_hosts:
            continue
        seen_hosts.add(lowered)
        deduped_hosts.append(host)
    result["discovered_hosts"] = deduped_hosts[:160]
    result["finding_quality_events"] = _dedupe_rows(
        list(result.get("finding_quality_events", []) or []),
        ("title", "cve", "action", "reason", "evidence"),
        limit=96,
    )
    return result
