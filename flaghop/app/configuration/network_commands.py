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

import re
from app.logging.legionLog import getAppLogger

log = getAppLogger()


class NetworkCommands:

    @classmethod
    def _ensure_enum4linux_ng_command(cls, command: str) -> str:
        raw = str(command or "")
        if "enum4linux-ng" not in raw.lower():
            return raw
        return cls.ENUM4LINUX_NG_COMMAND

    @classmethod
    def _ensure_smbmap_command(cls, command: str) -> str:
        raw = str(command or "")
        if "smbmap" not in raw.lower():
            return raw
        return cls.SMBMAP_COMMAND

    @classmethod
    def _ensure_rpcclient_enum_command(cls, command: str) -> str:
        raw = str(command or "")
        if "rpcclient" not in raw.lower():
            return raw
        return cls.RPCCLIENT_ENUM_COMMAND

    @classmethod
    def _ensure_netexec_command(cls, command: str) -> str:
        raw = str(command or "")
        lowered = raw.lower()
        if "netexec" not in lowered and "nxc" not in lowered and "crackmapexec" not in lowered:
            return raw
        return cls.NETEXEC_COMMAND

    @staticmethod
    def _canonicalize_legacy_rpcclient_action(rpc_command: str) -> str:
        token = str(rpc_command or "").strip() or "srvinfo"
        return f"rpcclient [IP] -U '%' -c '{token}'"

    @staticmethod
    def _canonicalize_legacy_net_rpc_group_members_action(group_name: str) -> str:
        token = str(group_name or "").strip() or "Domain Admins"
        safe_token = token.replace("'", "'\"'\"'")
        return f"net rpc group members '{safe_token}' -I [IP] -U '%'"

    @staticmethod
    def _canonicalize_legacy_snmp_brute_action() -> str:
        return "medusa -h [IP] -u root -P ./wordlists/snmp-default.txt -M snmp | grep SUCCESS"

    @staticmethod
    def _canonicalize_web_target_placeholders(command: str) -> str:
        normalized = str(command or "")
        replacements = (
            ("https://[IP]:[PORT]", "[WEB_URL]"),
            ("http://[IP]:[PORT]", "[WEB_URL]"),
            ("https://[IP]", "[WEB_URL]"),
            ("http://[IP]", "[WEB_URL]"),
        )
        for old, new in replacements:
            normalized = normalized.replace(old, new)
        return normalized

    @staticmethod
    def _collapse_redundant_fallbacks(command: str) -> str:
        normalized = str(command or "")
        duplicate_or_pattern = re.compile(r"\(\s*([^()]+?)\s*\|\|\s*([^()]+?)\s*\)")

        while True:
            changed = False

            def _replace(match):
                nonlocal changed
                left = re.sub(r"\s+", " ", str(match.group(1) or "")).strip()
                right = re.sub(r"\s+", " ", str(match.group(2) or "")).strip()
                if left == right and left:
                    changed = True
                    return f"({left})"
                return match.group(0)

            updated = duplicate_or_pattern.sub(_replace, normalized)
            if not changed:
                return updated
            normalized = updated

    @classmethod
    def allowed_nonzero_exit_codes(cls, tool_id: str):
        normalized_tool = str(tool_id or "").strip().lower()
        return {int(value) for value in cls.ALLOWED_NONZERO_EXIT_CODES.get(normalized_tool, set())}
