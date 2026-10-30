"""Tool observation parsing: network."""

from __future__ import annotations

import csv
import io
import ipaddress
import re
from typing import Any, Dict, List

from app.scheduler.observations.cloud import (
    _append_cloud_technologies_from_text,
)
from app.scheduler.observations.common import (
    _append_finding,
    _append_named_version_technology,
    _append_technology,
    _clean_text,
    _dedupe_rows,
    _iter_json_payloads,
    _normalize_discovered_host,
    _strip_nmap_preamble,
)
from app.scheduler.observations.constants import (
    _ANSI_ESCAPE_RE,
    _DNSMAP_HOST_RE,
    _DNSMAP_IP_RE,
    _MSSQL_INFO_CLUSTERED_RE,
    _MSSQL_INFO_NAMED_PIPE_RE,
    _MSSQL_INFO_PRODUCT_RE,
    _MSSQL_INFO_VERSION_RE,
    _MYSQL_INFO_AUTH_PLUGIN_RE,
    _MYSQL_INFO_PROTOCOL_RE,
    _MYSQL_INFO_VERSION_RE,
    _NBTSCAN_MAC_RE,
    _NBTSCAN_NAME_RE,
    _NBTSCAN_SCRIPT_ROW_RE,
    _NBTSCAN_SUMMARY_IP_RE,
    _NBTSCAN_TABLE_HEADER_RE,
    _NBTSCAN_VERBOSE_ROW_RE,
    _NETEXEC_AUTH_SUCCESS_RE,
    _NETEXEC_DOMAIN_TOKEN_RE,
    _NETEXEC_SIGNING_TOKEN_RE,
    _NETEXEC_SMBV1_TOKEN_RE,
    _NETEXEC_USER_ROW_RE,
    _PGSQL_INFO_AUTH_RE,
    _PGSQL_INFO_SSL_RE,
    _PGSQL_INFO_VERSION_RE,
    _SMB_DOMAIN_RE,
    _SMB_FOUND_DOMAIN_RE,
    _SMB_FOUND_USER_RE,
    _SMB_PASSWORD_POLICY_RE,
    _SMB_RPC_USER_RE,
    _SMB_SHARE_RE,
    _SMB_SHARE_TABLE_RE,
    _SMB_USER_RE,
)


def _parse_database_info_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    raw_text = _strip_nmap_preamble(output_text)
    cleaned_text = "\n".join(
        re.sub(r"^\s*\|_?\s*", "", _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).rstrip())
        for raw_line in str(raw_text or "").splitlines()
    )

    if tool_id == "mysql-info.nse":
        version_match = _MYSQL_INFO_VERSION_RE.search(cleaned_text)
        protocol_match = _MYSQL_INFO_PROTOCOL_RE.search(cleaned_text)
        auth_plugin_match = _MYSQL_INFO_AUTH_PLUGIN_RE.search(cleaned_text)
        version = _clean_text(version_match.group(1) if version_match else "", 120)
        protocol = _clean_text(protocol_match.group(1) if protocol_match else "", 48)
        auth_plugin = _clean_text(auth_plugin_match.group(1) if auth_plugin_match else "", 96)
        if version:
            _append_cloud_technologies_from_text(technologies, version, evidence=f"{tool_id}: {version}")
            if "mariadb" in version.lower():
                _append_technology(technologies, "MariaDB", version=version, evidence=f"{tool_id}: {version}")
                _append_technology(technologies, "MySQL", evidence=f"{tool_id}: {version}")
            else:
                _append_technology(technologies, "MySQL", version=version, evidence=f"{tool_id}: {version}")
        else:
            _append_technology(technologies, "MySQL", evidence=f"{tool_id} handshake metadata")
        if protocol:
            _append_finding(
                findings,
                f"MySQL protocol version identified: {protocol}",
                severity="info",
                evidence=f"{tool_id}: {protocol}",
            )
        if auth_plugin:
            _append_finding(
                findings,
                f"MySQL authentication plugin exposed: {auth_plugin}",
                severity="info",
                evidence=f"{tool_id}: {auth_plugin}",
            )

    elif tool_id == "pgsql-info.nse":
        version_match = _PGSQL_INFO_VERSION_RE.search(cleaned_text)
        ssl_match = _PGSQL_INFO_SSL_RE.search(cleaned_text)
        auth_method_match = _PGSQL_INFO_AUTH_RE.search(cleaned_text)
        version = _clean_text(version_match.group(1) if version_match else "", 120)
        ssl_state = _clean_text(ssl_match.group(1) if ssl_match else "", 64)
        auth_method = _clean_text(auth_method_match.group(1) if auth_method_match else "", 96)
        if version:
            _append_cloud_technologies_from_text(technologies, version, evidence=f"{tool_id}: {version}")
            _append_technology(technologies, "PostgreSQL", version=version, evidence=f"{tool_id}: {version}")
        else:
            _append_technology(technologies, "PostgreSQL", evidence=f"{tool_id} server metadata")
        if ssl_state and any(token in ssl_state.lower() for token in ("support", "enable", "on", "yes", "true")):
            _append_finding(findings, "PostgreSQL SSL supported", severity="info", evidence=f"{tool_id}: {ssl_state}")
        if auth_method:
            _append_finding(
                findings,
                f"PostgreSQL auth method exposed: {auth_method}",
                severity="info",
                evidence=f"{tool_id}: {auth_method}",
            )

    elif tool_id == "ms-sql-info.nse":
        product_match = _MSSQL_INFO_PRODUCT_RE.search(cleaned_text)
        version_match = _MSSQL_INFO_VERSION_RE.search(cleaned_text)
        clustered_match = _MSSQL_INFO_CLUSTERED_RE.search(cleaned_text)
        named_pipe_match = _MSSQL_INFO_NAMED_PIPE_RE.search(cleaned_text)
        product = _clean_text(product_match.group(1) if product_match else "", 120)
        version = _clean_text(version_match.group(1) if version_match else "", 64)
        clustered = _clean_text(clustered_match.group(1) if clustered_match else "", 16).lower()
        named_pipe = _clean_text(named_pipe_match.group(1) if named_pipe_match else "", 120)
        if product:
            _append_cloud_technologies_from_text(technologies, product, evidence=f"{tool_id}: {product}")
            if product.lower().startswith("microsoft sql server"):
                _append_technology(
                    technologies, "Microsoft SQL Server", version=version, evidence=f"{tool_id}: {product}"
                )
            else:
                _append_named_version_technology(technologies, product, evidence=f"{tool_id}: {product}")
        else:
            _append_technology(
                technologies, "Microsoft SQL Server", version=version, evidence=f"{tool_id} instance metadata"
            )
        if clustered == "true":
            _append_finding(
                findings,
                "Microsoft SQL Server clustered deployment",
                severity="info",
                evidence=f"{tool_id}: clustered=true",
            )
        if named_pipe:
            _append_finding(
                findings,
                f"Microsoft SQL Server named pipe exposed: {named_pipe}",
                severity="info",
                evidence=f"{tool_id}: {named_pipe}",
            )

    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=16),
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=24),
        "urls": [],
    }


def _parse_smb_enum_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    technologies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    raw_text = str(output_text or "")
    lowered = raw_text.lower()

    if "windows" in lowered:
        _append_technology(technologies, "Windows", evidence=f"{tool_id} smb enumeration")
    if "samba" in lowered:
        _append_technology(technologies, "Samba", evidence=f"{tool_id} smb enumeration")
    if "active directory" in lowered:
        _append_technology(technologies, "Active Directory", evidence=f"{tool_id} smb enumeration")

    domains = {
        _clean_text(match, 96)
        for match in (
            list(_SMB_DOMAIN_RE.findall(raw_text))
            + list(_SMB_FOUND_DOMAIN_RE.findall(raw_text))
            + list(_NETEXEC_DOMAIN_TOKEN_RE.findall(raw_text))
        )
        if _clean_text(match, 96) and _clean_text(match, 96).upper() not in {"WORKGROUP", "UNKNOWN"}
    }
    for domain in sorted(domains)[:4]:
        _append_technology(technologies, "Active Directory", evidence=f"{tool_id} domain {domain}")
        _append_finding(findings, f"SMB domain identified: {domain}", severity="info", evidence=f"{tool_id}: {domain}")

    share_names = {
        _clean_text(match, 96)
        for match in list(_SMB_SHARE_RE.findall(raw_text)) + list(_SMB_SHARE_TABLE_RE.findall(raw_text))
        if _clean_text(match, 96) and _clean_text(match, 96).lower() not in {"sharename", "name", "type", "comment"}
    }
    for raw_line in raw_text.splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).rstrip()
        share_line_match = re.match(r"^SMB\s+\S+\s+\d+\s+\S+\s+(?P<rest>.+)$", line)
        if not share_line_match:
            continue
        rest = str(share_line_match.group("rest") or "").strip()
        if not rest or rest.startswith("[") or " rid:" in rest.lower():
            continue
        parts = [item.strip() for item in re.split(r"\s{2,}", rest) if item.strip()]
        if not parts:
            continue
        share_name = _clean_text(parts[0], 96)
        if share_name and ":" not in share_name and share_name.lower() not in {"share", "permissions", "remark"}:
            share_names.add(share_name)
    try:
        if "," in raw_text and "\n" in raw_text:
            reader = csv.DictReader(io.StringIO(raw_text))
            for row in list(reader or [])[:64]:
                if not isinstance(row, dict):
                    continue
                for key in ("share", "share name", "netname", "name"):
                    value = _clean_text(row.get(key, "") or row.get(key.title(), ""), 96)
                    if value:
                        share_names.add(value)
    except Exception:
        pass

    user_names = {
        _clean_text(match, 96)
        for match in (
            list(_SMB_RPC_USER_RE.findall(raw_text))
            + list(_SMB_USER_RE.findall(raw_text))
            + list(_SMB_FOUND_USER_RE.findall(raw_text))
        )
        if _clean_text(match, 96) and _clean_text(match, 96).lower() not in {"user", "username", "account"}
    }
    for match in list(_NETEXEC_USER_ROW_RE.finditer(raw_text)):
        account = _clean_text(match.group("account"), 96)
        if "\\" in account:
            account = account.split("\\", 1)[1].strip()
        if account and account.lower() not in {"user", "username", "account"}:
            user_names.add(account)

    signing_disabled = any(
        str(match or "").strip().lower() == "false" for match in _NETEXEC_SIGNING_TOKEN_RE.findall(raw_text)
    )
    smbv1_enabled = any(
        str(match or "").strip().lower() == "true" for match in _NETEXEC_SMBV1_TOKEN_RE.findall(raw_text)
    )
    anonymous_allowed = False
    for match in list(_NETEXEC_AUTH_SUCCESS_RE.finditer(raw_text)):
        account = _clean_text(match.group("account"), 48).replace(" ", "")
        if account in {"\\", "\\\\", "guest", ".\\guest", ".\\\\guest"}:
            anonymous_allowed = True
            break

    password_policy_lines = [
        _clean_text(match, 160) for match in _SMB_PASSWORD_POLICY_RE.findall(raw_text) if _clean_text(match, 160)
    ]

    if share_names:
        _append_finding(
            findings,
            f"SMB shares enumerated ({len(share_names)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(share_names)[:8])}",
            evidence_items=sorted(share_names),
        )
    if user_names:
        _append_finding(
            findings,
            f"SMB users enumerated ({len(user_names)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(user_names)[:8])}",
            evidence_items=sorted(user_names),
        )
    if password_policy_lines:
        _append_finding(
            findings,
            "SMB password policy disclosed",
            severity="info",
            evidence=f"{tool_id}: {', '.join(password_policy_lines[:4])}",
            evidence_items=password_policy_lines[:6],
        )
    if anonymous_allowed:
        _append_finding(
            findings,
            "Anonymous SMB access allowed",
            severity="low",
            evidence=f"{tool_id}: null or guest session succeeded",
        )
    if signing_disabled:
        _append_finding(findings, "SMB signing disabled", severity="medium", evidence=f"{tool_id}: signing:false")
    if smbv1_enabled:
        _append_finding(findings, "SMBv1 enabled", severity="medium", evidence=f"{tool_id}: smbv1:true")
    return {
        "technologies": _dedupe_rows(technologies, ("name", "version", "cpe"), limit=24),
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": [],
    }


def _parse_nbtscan_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    findings: List[Dict[str, Any]] = []
    host_names = set()
    user_names = set()
    domain_names = set()
    file_servers = set()
    current_host_ip = ""

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).rstrip()
        stripped = line.strip()
        if not stripped:
            continue
        lowered = stripped.lower()
        table_match = _NBTSCAN_TABLE_HEADER_RE.match(stripped)
        if table_match:
            current_host_ip = str(table_match.group(1) or "").strip()
            continue
        if lowered.startswith("adapter address:") or lowered.startswith("ip address") or set(stripped) == {"-"}:
            continue

        verbose_match = _NBTSCAN_VERBOSE_ROW_RE.match(line)
        if verbose_match:
            name = _clean_text(verbose_match.group(1), 96).strip("? ")
            suffix = str(verbose_match.group(2) or "").strip().upper()
            name_type = str(verbose_match.group(3) or "").strip().upper()
            if not name:
                continue
            if suffix == "20" and name_type == "UNIQUE":
                file_servers.add(current_host_ip or name)
                host_names.add(name)
            elif suffix == "03" and name_type == "UNIQUE":
                user_names.add(name)
            elif suffix == "00" and name_type == "GROUP":
                domain_names.add(name)
            elif suffix == "00" and name_type == "UNIQUE":
                host_names.add(name)
            continue

        script_match = _NBTSCAN_SCRIPT_ROW_RE.match(stripped)
        if script_match:
            host_ip = str(script_match.group(1) or "").strip()
            name = _clean_text(script_match.group(2), 96).strip("? ")
            suffix = str(script_match.group(3) or "").strip().upper()
            name_type = "GROUP" if str(script_match.group(4) or "").strip().upper() == "G" else "UNIQUE"
            current_host_ip = host_ip
            if not name:
                continue
            if suffix == "20" and name_type == "UNIQUE":
                file_servers.add(host_ip or name)
                host_names.add(name)
            elif suffix == "03" and name_type == "UNIQUE":
                user_names.add(name)
            elif suffix == "00" and name_type == "GROUP":
                domain_names.add(name)
            elif suffix == "00" and name_type == "UNIQUE":
                host_names.add(name)
            continue

        parts = re.split(r"\s{2,}", stripped)
        if len(parts) >= 4 and _NBTSCAN_SUMMARY_IP_RE.match(parts[0]) and _NBTSCAN_NAME_RE.match(parts[1]):
            host_ip = parts[0]
            host_name = _clean_text(parts[1], 96)
            current_host_ip = host_ip
            if host_name:
                host_names.add(host_name)
            tail = parts[2:]
            if tail and str(tail[0] or "").strip().lower() == "<server>":
                file_servers.add(host_ip or host_name)
                tail = tail[1:]
            if tail:
                last_token = str(tail[-1] or "").strip()
                if _NBTSCAN_MAC_RE.match(last_token):
                    tail = tail[:-1]
            if tail:
                user_name = _clean_text(tail[0], 96)
                if user_name and user_name.lower() != host_name.lower():
                    user_names.add(user_name)

    if host_names:
        _append_finding(
            findings,
            f"NetBIOS hosts enumerated ({len(host_names)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(host_names)[:8])}",
            evidence_items=sorted(host_names),
        )
    if domain_names:
        _append_finding(
            findings,
            f"NetBIOS workgroups/domains enumerated ({len(domain_names)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(domain_names)[:8])}",
            evidence_items=sorted(domain_names),
        )
    if user_names:
        _append_finding(
            findings,
            f"NetBIOS users enumerated ({len(user_names)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(user_names)[:8])}",
            evidence_items=sorted(user_names),
        )
    if file_servers:
        _append_finding(
            findings,
            f"NetBIOS file servers advertised ({len(file_servers)})",
            severity="info",
            evidence=f"{tool_id}: file sharing/server service advertised",
            evidence_items=sorted(file_servers),
        )

    return {
        "technologies": [],
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": [],
    }


def _parse_dnsmap_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    findings: List[Dict[str, Any]] = []
    discovered_hosts = set()
    internal_records = set()
    current_host = ""

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        lowered = line.lower()
        if line.startswith("[+]"):
            if "warning: internal ip address disclosed" in lowered:
                _append_finding(
                    findings,
                    "Internal DNS records disclosed",
                    severity="low",
                    evidence=f"{tool_id}: {line}",
                )
            continue
        if _DNSMAP_HOST_RE.match(line) and " " not in line:
            current_host = _normalize_discovered_host(line)
            if current_host:
                discovered_hosts.add(current_host)
            continue
        ip_match = _DNSMAP_IP_RE.match(line)
        if ip_match and current_host:
            ip_token = str(ip_match.group(1) or "").strip()
            try:
                ip_obj = ipaddress.ip_address(ip_token)
            except ValueError:
                continue
            if ip_obj.is_private:
                internal_records.add(f"{current_host} -> {ip_token}")

    if discovered_hosts:
        _append_finding(
            findings,
            f"DNS subdomains discovered ({len(discovered_hosts)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(discovered_hosts)[:8])}",
            evidence_items=sorted(discovered_hosts),
        )
    if internal_records:
        _append_finding(
            findings,
            f"Internal DNS records disclosed ({len(internal_records)})",
            severity="low",
            evidence=f"{tool_id}: {', '.join(sorted(internal_records)[:8])}",
            evidence_items=sorted(internal_records),
        )

    return {
        "technologies": [],
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": [],
        "discovered_hosts": sorted(discovered_hosts),
    }


def _parse_subfinder_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    findings: List[Dict[str, Any]] = []
    discovered_hosts = set()

    for payload in _iter_json_payloads(str(output_text or "")):
        if not isinstance(payload, dict):
            continue
        for key in ("host", "name", "value", "matched", "input"):
            candidate = _normalize_discovered_host(payload.get(key, ""))
            if candidate and "." in candidate:
                discovered_hosts.add(candidate)
                break

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line or line[:1] in {"{", "["}:
            continue
        candidate = _normalize_discovered_host(line)
        if candidate and "." in candidate:
            discovered_hosts.add(candidate)

    if discovered_hosts:
        _append_finding(
            findings,
            f"Passive subdomains discovered ({len(discovered_hosts)})",
            severity="info",
            evidence=f"{tool_id}: {', '.join(sorted(discovered_hosts)[:8])}",
            evidence_items=sorted(discovered_hosts),
        )

    return {
        "technologies": [],
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": [],
        "discovered_hosts": sorted(discovered_hosts),
    }
