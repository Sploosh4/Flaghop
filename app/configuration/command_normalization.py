"""LEGION (https://shanewilliamscott.com)
Copyright (c) 2025 Shane William Scott

    This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
    License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
    version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
    details.

    You should have received a copy of the GNU General Public License along with this program.
    If not, see <http://www.gnu.org/licenses/>.
"""

from __future__ import annotations

from app.logging.legionLog import getAppLogger

log = getAppLogger()


class CommandNormalization:
    @classmethod
    def _normalize_action_command(cls, tool_id: str, command: str) -> str:
        normalized_tool = str(tool_id or "").strip().lower()
        normalized = str(command or "")
        if normalized_tool == "banner":
            normalized = cls._ensure_banner_command(normalized)
        if normalized_tool == "nuclei-web":
            normalized = cls._ensure_nuclei_auto_scan(normalized)
        elif "nuclei" in normalized_tool or "nuclei" in normalized.lower():
            normalized = cls._ensure_nuclei_command(normalized, automatic_scan=False)
        if normalized_tool == "web-content-discovery":
            normalized = cls._ensure_web_content_discovery_command(normalized)
        if normalized_tool == "httpx":
            normalized = cls._ensure_httpx_command(normalized)
        if normalized_tool == "subfinder":
            normalized = cls._ensure_subfinder_command(normalized)
        if normalized_tool == "chaos":
            normalized = cls.CHAOS_COMMAND
        if normalized_tool == "grayhatwarfare":
            normalized = cls.GRAYHATWARFARE_COMMAND
        if normalized_tool == "shodan-enrichment":
            normalized = cls.SHODAN_ENRICHMENT_COMMAND
        if normalized_tool in {"whatweb", "whatweb-http", "whatweb-https"}:
            normalized = cls._ensure_whatweb_command(normalized)
        if normalized_tool == "nikto":
            normalized = cls._ensure_nikto_command(normalized)
        if normalized_tool == "katana":
            normalized = cls._ensure_katana_command(normalized)
        if normalized_tool == "wpscan":
            normalized = cls._ensure_wpscan_command(normalized)
        if normalized_tool == "dirsearch":
            normalized = cls._ensure_dirsearch_command(normalized)
        if normalized_tool == "ffuf":
            normalized = cls._ensure_ffuf_command(normalized)
        if "hydra" in normalized.lower():
            normalized = cls._ensure_hydra_command(normalized)
        if normalized_tool == "enum4linux-ng":
            normalized = cls._ensure_enum4linux_ng_command(normalized)
        if normalized_tool == "smbmap":
            normalized = cls._ensure_smbmap_command(normalized)
        if normalized_tool == "rpcclient-enum":
            normalized = cls._ensure_rpcclient_enum_command(normalized)
        if normalized_tool == "netexec":
            normalized = cls._ensure_netexec_command(normalized)
        if normalized_tool == "mysql-info.nse":
            normalized = cls.MYSQL_INFO_COMMAND
        if normalized_tool == "pgsql-info.nse":
            normalized = cls.PGSQL_INFO_COMMAND
        if normalized_tool == "ms-sql-info.nse":
            normalized = cls.MSSQL_INFO_COMMAND
        if normalized_tool == "responder":
            normalized = cls._ensure_responder_command(normalized)
        if normalized_tool == "ntlmrelayx":
            normalized = cls._ensure_ntlmrelayx_command(normalized)
        if normalized_tool == "samrdump":
            normalized = cls.SAMRDUMP_COMMAND
        if normalized_tool == "smb-enum-users-rpc":
            normalized = cls._canonicalize_legacy_rpcclient_action("enumdomusers")
        if normalized_tool == "smb-null-sessions":
            normalized = cls._canonicalize_legacy_rpcclient_action("srvinfo")
        if normalized_tool == "smb-enum-admins":
            normalized = cls._canonicalize_legacy_net_rpc_group_members_action("Domain Admins")
        if normalized_tool == "snmp-brute":
            normalized = cls._canonicalize_legacy_snmp_brute_action()
        if normalized_tool == "rpcclient":
            normalized = cls._ensure_terminal_rpcclient_command(normalized)
        if "wapiti" in normalized.lower():
            scheme = "https" if "https" in normalized_tool else "http"
            normalized = cls._ensure_wapiti_command(normalized, scheme=scheme)
        if "nmap" in normalized.lower():
            normalized = cls._ensure_nmap_stats_every(normalized)
        return normalized
