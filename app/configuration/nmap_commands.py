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
from app.hostsfile import normalize_hostname_alias
from app.logging.legionLog import getAppLogger

log = getAppLogger()


class NmapCommands:
    @staticmethod
    def _ensure_nuclei_command(command: str, automatic_scan: bool = False) -> str:
        raw = str(command or "")
        if "nuclei" not in raw.lower():
            return raw
        probe_marker = "__LEGION_NUCLEI_PROBE__"
        normalized = re.sub(r"(?i)command\s+-v\s+nuclei", f"command -v {probe_marker}", raw)
        if automatic_scan:
            # Only patch direct scan invocations (`nuclei -u ...`), not probe checks
            # like `command -v nuclei` and not tokens embedded in output filenames.
            normalized = re.sub(
                r"(?i)\bnuclei\b(?!\s+-as\b)(?=[^|;&()\n]*\s+-u\b)",
                "nuclei -as",
                normalized,
            )
        normalized = re.sub(
            r"(?i)\bnuclei(?:\s+-as)?(?![^|;&()\n]*\s+-stats\b)(?=[^|;&()\n]*\s+-u\b)",
            lambda match: f"{match.group(0)} -stats",
            normalized,
        )
        normalized = re.sub(
            r"(?i)(\s(?:-si|--stats-interval)\b(?:\s+|=))\S+",
            lambda match: f"{match.group(1)}15",
            normalized,
        )
        normalized = re.sub(
            r"(?i)\bnuclei(?:\s+-as)?(?:\s+-stats)?(?![^|;&()\n]*\s+(?:-si|--stats-interval)(?:\s+|=))(?=[^|;&()\n]*\s+-u\b)",
            lambda match: f"{match.group(0)} -si 15",
            normalized,
        )
        normalized = re.sub(
            r"(?i)\bnuclei(?:\s+-as)?(?:\s+-stats)?(?:\s+-si\s+15)?(?![^|;&()\n]*\s+(?:-silent|--silent)\b)(?=[^|;&()\n]*\s+-u\b)",
            lambda match: f"{match.group(0)} -silent",
            normalized,
        )
        normalized = re.sub(r"(?i)(?<!\S)--?no-color\b", "", normalized)
        normalized = re.sub(r"[ \t]{2,}", " ", normalized)
        return normalized.replace(probe_marker, "nuclei")

    @classmethod
    def _ensure_nuclei_auto_scan(cls, command: str) -> str:
        return cls._ensure_nuclei_command(command, automatic_scan=True)

    @classmethod
    def _ensure_banner_command(cls, command: str) -> str:
        raw = str(command or "").strip()
        lowered = raw.lower()
        if "nc" not in lowered and "netcat" not in lowered:
            return raw
        if "[ip]" not in lowered or "[port]" not in lowered:
            return raw
        protocol = "udp" if re.search(r"(?i)(?:^|\s)-u(?:\s|$)", raw) else "tcp"
        return cls.BANNER_COMMAND.replace("LEGION_BANNER_PROTOCOL=tcp", f"LEGION_BANNER_PROTOCOL={protocol}")

    @staticmethod
    def _ensure_nmap_stats_every(command: str, interval: str = "15s") -> str:
        raw = str(command or "")
        stats_interval = str(interval or "15s").strip() or "15s"
        if "nmap" not in raw.lower():
            return raw

        separators = {"||", "&&", ";", "|", "(", ")", "\n"}
        parts = []
        start = 0
        index = 0
        quote = ""
        escaped = False

        while index < len(raw):
            char = raw[index]
            if escaped:
                escaped = False
                index += 1
                continue
            if char == "\\" and quote != "'":
                escaped = True
                index += 1
                continue
            if quote:
                if char == quote:
                    quote = ""
                index += 1
                continue
            if char in ("'", '"'):
                quote = char
                index += 1
                continue
            if raw.startswith("||", index) or raw.startswith("&&", index):
                parts.append(raw[start:index])
                parts.append(raw[index : index + 2])
                index += 2
                start = index
                continue
            if char in ";|()\n":
                parts.append(raw[start:index])
                parts.append(char)
                index += 1
                start = index
                continue
            index += 1
        parts.append(raw[start:])

        updated_parts = []
        nmap_prefix = re.compile(r"(?i)^(?:(?:sudo|doas|env|timeout|nice|ionice)\b[^\n;|&()]*?\s+)*nmap\b")
        has_stats = re.compile(r"(?i)(?:^|\s)--stats-every(?:=|\s)")
        has_verbose = re.compile(r"(?i)(?:^|\s)(?:-v{1,3}|--verbose)(?:\s|$)")

        for part in parts:
            if part in separators:
                updated_parts.append(part)
                continue
            stripped = part.strip()
            if not stripped or not nmap_prefix.match(stripped):
                updated_parts.append(part)
                continue
            leading = part[: len(part) - len(part.lstrip())]
            trailing = part[len(part.rstrip()) :]
            normalized = stripped
            if not has_stats.search(normalized):
                normalized = f"{normalized} --stats-every {stats_interval}"
            if has_stats.search(normalized) and not has_verbose.search(normalized):
                normalized = f"{normalized} -vv"
            updated_parts.append(f"{leading}{normalized}{trailing}")

        return "".join(updated_parts)

    @staticmethod
    def _ensure_nmap_hostname_target_support(command: str, target_host: str) -> str:
        raw = str(command or "")
        hostname = normalize_hostname_alias(target_host)
        if "nmap" not in raw.lower() or not hostname:
            return raw
        normalized = re.sub(r"(?<!\S)-n(?!\S)", "", raw)
        normalized = re.sub(r"[ \t]{2,}", " ", normalized)
        normalized = re.sub(r"\(\s+", "(", normalized)
        normalized = re.sub(r"\s+\)", ")", normalized)
        return normalized.strip()

    @staticmethod
    def _scheduler_target_input_error(tool_id: str, command_template: str, *, port: str = "") -> str:
        normalized_tool = str(tool_id or "").strip().lower()
        normalized_port = str(port or "").strip()
        command_text = str(command_template or "")
        requires_port = (
            normalized_tool in {"banner", "nmap"} or "[PORT]" in command_text or "LEGION_BANNER_PORT" in command_text
        )
        if requires_port and not normalized_port:
            return f"skipped: {normalized_tool or 'tool'} requires target port"
        return ""

    @classmethod
    def _ensure_nmap_vuln_command(cls, command: str) -> str:
        raw = str(command or "").strip()
        if "nmap" not in raw.lower() or "--script" not in raw.lower():
            return raw
        if "vuln" not in raw.lower():
            return raw

        normalized = raw
        if "||" not in raw or "vulners" not in raw.lower():
            with_vulners = re.sub(
                r"(?i)--script(?:=|\s+)vuln\b",
                "--script=vuln,vulners",
                raw,
                count=1,
            )
            if with_vulners == raw and "vulners" not in raw.lower():
                return raw

            fallback = re.sub(
                r"(?i)--script(?:=|\s+)vuln(?:,vulners)?\b",
                "--script=vuln",
                with_vulners,
                count=1,
            )

            if with_vulners == fallback:
                normalized = with_vulners
            else:
                normalized = f"({with_vulners} || {fallback})"

        return cls._ensure_nmap_output_argument(normalized, "[OUTPUT]")

    @staticmethod
    def _ensure_nmap_output_argument(command: str, output_target: str) -> str:
        raw = str(command or "")
        output = str(output_target or "").strip()
        if "nmap" not in raw.lower() or not output:
            return raw

        separators = {"||", "&&", ";", "|", "(", ")", "\n"}
        parts = []
        start = 0
        index = 0
        quote = ""
        escaped = False

        while index < len(raw):
            char = raw[index]
            if escaped:
                escaped = False
                index += 1
                continue
            if char == "\\" and quote != "'":
                escaped = True
                index += 1
                continue
            if quote:
                if char == quote:
                    quote = ""
                index += 1
                continue
            if char in ("'", '"'):
                quote = char
                index += 1
                continue
            if raw.startswith("||", index) or raw.startswith("&&", index):
                parts.append(raw[start:index])
                parts.append(raw[index : index + 2])
                index += 2
                start = index
                continue
            if char in ";|()\n":
                parts.append(raw[start:index])
                parts.append(char)
                index += 1
                start = index
                continue
            index += 1
        parts.append(raw[start:])

        updated_parts = []
        nmap_prefix = re.compile(r"(?i)^(?:(?:sudo|doas|env|timeout|nice|ionice)\b[^\n;|&()]*?\s+)*nmap\b")
        has_output = re.compile(r"(?i)(?:^|\s)-oA(?:\s|$)")

        for part in parts:
            if part in separators:
                updated_parts.append(part)
                continue

            stripped = part.strip()
            if not stripped or has_output.search(stripped) or not nmap_prefix.match(stripped):
                updated_parts.append(part)
                continue

            leading = part[: len(part) - len(part.lstrip())]
            trailing = part[len(part.rstrip()) :]
            updated_parts.append(f"{leading}{stripped} -oA {output}{trailing}")

        return "".join(updated_parts)

    @staticmethod
    def _ensure_scope_contains_services(scope: str, required_services):
        existing = [item.strip() for item in str(scope or "").split(",") if item.strip()]
        lowered = {item.lower() for item in existing}
        changed = False
        for service in list(required_services or []):
            token = str(service or "").strip()
            if not token:
                continue
            if token.lower() not in lowered:
                existing.append(token)
                lowered.add(token.lower())
                changed = True
        if not existing:
            return ""
        return ",".join(existing) if changed else str(scope)

    @classmethod
    def _wrap_command_presence_probe(cls, command: str, binary: str) -> str:
        raw = str(command or "")
        tool = str(binary or "").strip()
        if not raw.strip() or not tool:
            return raw
        canonical_wrapper = re.compile(
            rf"(?is)^\s*if\s+command\s+-v\s+{re.escape(tool)}\s*>/dev/null\s+2>&1\s*;\s*"
            rf"then\b.+;\s*else\s+echo\s+{re.escape(tool)}\s+not\s+found\s*;\s*fi\s*$"
        )
        if canonical_wrapper.match(raw):
            return raw.strip()
        probe_marker = f"__LEGION_{re.sub(r'[^A-Za-z0-9]+', '_', tool).upper()}_PROBE__"
        normalized = re.sub(
            rf"(?i)command\s+-v\s+{re.escape(tool)}",
            f"command -v {probe_marker}",
            raw,
        )
        normalized = re.sub(
            rf"(?is)^\s*\(\s*command\s+-v\s+{re.escape(probe_marker)}\s*>/dev/null\s+2>&1\s*&&\s*",
            "",
            normalized,
            count=1,
        )
        normalized = re.sub(
            rf"(?is)\)\s*\|\|\s*echo\s+{re.escape(tool)}\s+not\s+found\s*$",
            "",
            normalized,
            count=1,
        )
        normalized = normalized.strip()
        return f"if command -v {tool} >/dev/null 2>&1; then {normalized}; else echo {tool} not found; fi"
