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


class WebCommands:
    @classmethod
    def _ensure_web_content_discovery_command(cls, command: str) -> str:
        raw = str(command or "")
        if "gobuster" not in raw.lower():
            return raw
        if cls.LEGACY_WEB_CONTENT_DISCOVERY_COMMAND == raw:
            return cls.WEB_CONTENT_DISCOVERY_COMMAND
        legacy_gobuster_block = (
            "(command -v gobuster >/dev/null 2>&1 && "
            "gobuster dir -u http://[IP]:[PORT]/ -w /usr/share/wordlists/dirb/common.txt -o [OUTPUT].txt)"
        )
        if legacy_gobuster_block in raw:
            return raw.replace(legacy_gobuster_block, cls.WEB_CONTENT_GOBUSTER_COMMAND)
        return raw

    @classmethod
    def _ensure_httpx_command(cls, command: str) -> str:
        raw = cls._canonicalize_web_target_placeholders(str(command or ""))
        if "httpx" not in raw.lower():
            return raw
        probe_marker = "__LEGION_HTTPX_PROBE__"
        normalized = re.sub(r"(?i)command\s+-v\s+httpx", f"command -v {probe_marker}", raw)
        wrapped_prefix = re.search(
            rf"(?i)^\s*\(\s*command\s+-v\s+{re.escape(probe_marker)}\s*>/dev/null\s+2>&1\s*&&\s*",
            normalized,
        )
        fallback = ""
        fallback_match = re.search(
            r"(?i)\s*\|\|\s*echo\s+httpx\s+not\s+found(?:\s+-o\s+\S+)?\s*$",
            normalized,
        )
        if fallback_match:
            fallback = " || echo httpx not found"
            normalized = normalized[: fallback_match.start()]
        if wrapped_prefix:
            normalized = normalized[wrapped_prefix.end() :]
            normalized = re.sub(r"\)\s*$", "", normalized)
            prefix = f"(command -v {probe_marker} >/dev/null 2>&1 && "
        else:
            prefix = ""
        httpx_match = re.search(r"(?i)\bhttpx\b", normalized)
        if not httpx_match:
            return re.sub(r"\s{2,}", " ", raw).strip()
        if not wrapped_prefix:
            prefix = normalized[: httpx_match.start()]
        httpx_command = normalized[httpx_match.start() :]
        httpx_command = re.sub(r"(?i)(?:^|\s)-(?:j|json)(?=\s|$)", " ", httpx_command)
        httpx_command = re.sub(r"(?i)(?:^|\s)-silent(?=\s|$)", " ", httpx_command)
        httpx_command = re.sub(r"(?i)(?:^|\s)-title(?=\s|$)", " ", httpx_command)
        httpx_command = re.sub(r"(?i)(?:^|\s)-tech-detect(?=\s|$)", " ", httpx_command)
        httpx_command = re.sub(r"(?i)(?:^|\s)-(?:web-server|server)(?=\s|$)", " ", httpx_command)
        httpx_command = re.sub(r"(?i)(?:^|\s)-status-code(?=\s|$)", " ", httpx_command)
        httpx_command = re.sub(r"(?i)(?:^|\s)-content-type(?=\s|$)", " ", httpx_command)
        httpx_command = re.sub(r"(?i)(?:^|\s)-o\s+\S+", " ", httpx_command)
        httpx_command = re.sub(r"\s*>\s*\[OUTPUT\][^\s\)]*", " ", httpx_command)
        if not re.search(r"(?i)(?:^|\s)-(?:u|target)(?:\s|$)", httpx_command):
            httpx_command = re.sub(r"(?i)\bhttpx\b", "httpx -u [WEB_URL]", httpx_command, count=1)
        else:
            httpx_command = re.sub(r"(?i)(?:^|\s)-(?:u|target)\s+\S+", " -u [WEB_URL]", httpx_command, count=1)
        httpx_command = re.sub(
            r"(?i)\bhttpx\b",
            "httpx -silent -json -title -tech-detect -web-server -status-code -content-type",
            httpx_command,
            count=1,
        )
        if not re.search(r"(?i)(?:^|\s)-o(?:\s|$)", httpx_command):
            httpx_command += " -o [OUTPUT].jsonl"
        if wrapped_prefix:
            combined = f"{prefix}{httpx_command}){fallback or ' || echo httpx not found'}"
        else:
            combined = f"{prefix}{httpx_command}{fallback}"
        return re.sub(r"\s{2,}", " ", combined).strip().replace(probe_marker, "httpx")

    @classmethod
    def _ensure_subfinder_command(cls, command: str) -> str:
        raw = str(command or "")
        if "subfinder" not in raw.lower():
            return raw
        probe_marker = "__LEGION_SUBFINDER_PROBE__"
        normalized = re.sub(
            r"(?i)command\s+-v\s+subfinder(?:\s+\S+)*?\s*>/dev/null\s+2>&1",
            f"command -v {probe_marker} >/dev/null 2>&1",
            raw,
        )
        wrapped_prefix = re.search(
            rf"(?i)^\s*\(\s*command\s+-v\s+{re.escape(probe_marker)}\s*>/dev/null\s+2>&1\s*&&\s*",
            normalized,
        )
        fallback = ""
        fallback_match = re.search(
            r"(?i)\s*\|\|\s*echo\s+subfinder\s+not\s+found(?:\s+-o\s+\S+)?\s*$",
            normalized,
        )
        if fallback_match:
            fallback = " || echo subfinder not found"
            normalized = normalized[: fallback_match.start()]
        if wrapped_prefix:
            normalized = normalized[wrapped_prefix.end() :]
            normalized = re.sub(r"\)\s*$", "", normalized)
            prefix = f"(command -v {probe_marker} >/dev/null 2>&1 && "
        else:
            prefix = ""

        subfinder_match = re.search(r"(?i)\bsubfinder\b", normalized)
        if not subfinder_match:
            return re.sub(r"\s{2,}", " ", raw).strip()
        if not wrapped_prefix:
            prefix = normalized[: subfinder_match.start()]
        subfinder_command = normalized[subfinder_match.start() :]
        subfinder_command = re.sub(r"(?i)(?:^|\s)-d(?:omain)?\s+\S+", " -d [IP]", subfinder_command)
        subfinder_command = re.sub(r"(?i)(?:^|\s)-dL\s+\S+", " ", subfinder_command)
        subfinder_command = re.sub(r"(?i)(?:^|\s)-o\s+\S+", " ", subfinder_command)
        subfinder_command = re.sub(r"(?i)(?:^|\s)-max-time\s+\S+", " ", subfinder_command)
        subfinder_command = re.sub(r"(?i)(?:^|\s)-oJ\b", " ", subfinder_command)
        subfinder_command = re.sub(r"(?i)(?:^|\s)-silent\b", " ", subfinder_command)
        subfinder_command = re.sub(r"(?i)(?:^|\s)-recursive\b", " ", subfinder_command)
        subfinder_command = re.sub(r"(?i)(?:^|\s)-duc\b", " ", subfinder_command)
        if not re.search(r"(?i)(?:^|\s)-d(?:omain)?(?:\s|$)", subfinder_command):
            subfinder_command = re.sub(r"(?i)\bsubfinder\b", "subfinder -d [IP]", subfinder_command, count=1)
        subfinder_command = re.sub(
            r"(?i)\bsubfinder\b",
            "subfinder -silent -recursive -duc -max-time 5 -oJ",
            subfinder_command,
            count=1,
        )
        if not re.search(r"(?i)(?:^|\s)-o(?:\s|$)", subfinder_command):
            subfinder_command += " -o [OUTPUT].jsonl"
        if wrapped_prefix:
            combined = f"{prefix}{subfinder_command}){fallback or ' || echo subfinder not found'}"
        else:
            combined = f"{prefix}{subfinder_command}{fallback}"
        return re.sub(r"\s{2,}", " ", combined).strip().replace(probe_marker, "subfinder")

    @classmethod
    def _ensure_katana_command(cls, command: str) -> str:
        raw = cls._canonicalize_web_target_placeholders(str(command or ""))
        if "katana" not in raw.lower():
            return raw
        probe_marker = "__LEGION_KATANA_PROBE__"
        normalized = re.sub(
            r"(?i)command\s+-v\s+katana(?:\s+\S+)*?\s*>/dev/null\s+2>&1",
            f"command -v {probe_marker} >/dev/null 2>&1",
            raw,
        )
        wrapped_prefix = re.search(
            rf"(?i)^\s*\(\s*command\s+-v\s+{re.escape(probe_marker)}\s*>/dev/null\s+2>&1\s*&&\s*",
            normalized,
        )
        fallback = ""
        fallback_match = re.search(
            r"(?i)\s*\|\|\s*echo\s+katana\s+not\s+found(?:\s+-o\s+\S+)?\s*$",
            normalized,
        )
        if fallback_match:
            fallback = " || echo katana not found"
            normalized = normalized[: fallback_match.start()]
        if wrapped_prefix:
            normalized = normalized[wrapped_prefix.end() :]
            normalized = re.sub(r"\)\s*$", "", normalized)
            prefix = f"(command -v {probe_marker} >/dev/null 2>&1 && "
        else:
            prefix = ""

        katana_match = re.search(r"(?i)\bkatana\b", normalized)
        if not katana_match:
            return re.sub(r"\s{2,}", " ", raw).strip()
        if not wrapped_prefix:
            prefix = normalized[: katana_match.start()]
        katana_command = normalized[katana_match.start() :]
        katana_command = re.sub(r"(?i)(?:^|\s)-jsonl\b", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-silent\b", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-jc\b", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-kf\s+\S+", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-d\s+\S+", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-c\s+\S+", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-p\s+\S+", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-rl\s+\S+", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-o\s+\S+", " ", katana_command)
        katana_command = re.sub(r"(?i)(?:^|\s)-u\s+\S+", " -u [WEB_URL]", katana_command, count=1)
        if not re.search(r"(?i)(?:^|\s)-u(?:\s|$)", katana_command):
            katana_command = re.sub(r"(?i)\bkatana\b", "katana -u [WEB_URL]", katana_command, count=1)
        katana_command = re.sub(
            r"(?i)\bkatana\b",
            "katana -silent -jsonl -d 2 -jc -kf robotstxt,sitemapxml -c 5 -p 1 -rl 5",
            katana_command,
            count=1,
        )
        if not re.search(r"(?i)(?:^|\s)-o(?:\s|$)", katana_command):
            katana_command += " -o [OUTPUT].jsonl"
        if wrapped_prefix:
            combined = f"{prefix}{katana_command}){fallback or ' || echo katana not found'}"
        else:
            combined = f"{prefix}{katana_command}{fallback}"
        return re.sub(r"\s{2,}", " ", combined).strip().replace(probe_marker, "katana")

    @classmethod
    def _ensure_whatweb_command(cls, command: str) -> str:
        raw = str(command or "")
        if "whatweb" not in raw.lower():
            return raw
        normalized = cls._canonicalize_web_target_placeholders(raw)
        probe_marker = "__LEGION_WHATWEB_PROBE__"
        fallback_marker = "__LEGION_WHATWEB_FALLBACK__"
        normalized = re.sub(r"(?i)command\s+-v\s+whatweb", f"command -v {probe_marker}", normalized)
        normalized = re.sub(r"(?i)echo\s+whatweb\s+not\s+found", fallback_marker, normalized)
        normalized = re.sub(
            r"(?i)(?:^|\s)--color(?:=|\s+)[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)(?:^|\s)--log-brief(?:=|\s+)[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)\bwhatweb\b",
            "whatweb --color=never --log-brief=[OUTPUT].txt",
            normalized,
        )
        normalized = normalized.replace(probe_marker, "whatweb")
        normalized = normalized.replace(fallback_marker, "echo whatweb not found")
        normalized = re.sub(r"\s{2,}", " ", normalized).strip()
        return re.sub(r"\s+\)", ")", normalized)

    @classmethod
    def _ensure_nikto_command(cls, command: str) -> str:
        raw = cls._canonicalize_web_target_placeholders(str(command or ""))
        if "nikto" not in raw.lower():
            return raw
        probe_marker = "__LEGION_NIKTO_PROBE__"
        normalized = re.sub(r"(?i)command\s+-v\s+nikto", f"command -v {probe_marker}", raw)
        normalized = re.sub(
            r"(?i)(?:^|\s)-p(?:ort)?\s+\[PORT\](?=\s|[);&|]|$)",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)(?:^|\s)-(?:h|host)\s+[^\s);&|]+",
            " -h [WEB_URL]",
            normalized,
            count=1,
        )
        normalized = re.sub(
            r"(?i)(?:^|\s)-(?:o|output)\s+[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)(?:^|\s)-format\s+[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(r"(?i)(?:^|\s)-nointeractive(?=\s|[);&|]|$)", " ", normalized)
        if "-h [WEB_URL]" not in normalized:
            normalized = re.sub(r"(?i)\bnikto\b", "nikto -h [WEB_URL]", normalized, count=1)
        normalized = re.sub(
            r"(?i)\bnikto\b", "nikto -nointeractive -Format txt -output [OUTPUT].txt", normalized, count=1
        )
        return re.sub(r"\s{2,}", " ", normalized).strip().replace(probe_marker, "nikto")

    @classmethod
    def _ensure_wpscan_command(cls, command: str) -> str:
        raw = cls._canonicalize_web_target_placeholders(str(command or ""))
        if "wpscan" not in raw.lower():
            return raw
        if re.match(r"(?i)^\s*echo\s+wpscan\b", raw):
            return raw.strip()
        # Older normalization passes could consume the wrapper's closing
        # parenthesis and then expand the fallback itself into a WPScan
        # invocation. Recover only that exact nested, unbalanced legacy shape;
        # a custom command or diagnostic echo must never become executable.
        polluted_fallback = re.search(
            r"(?i)\s*\|\|\s*echo\s+wpscan"
            r"(?:"
            r"\s+--disable-tls-checks"
            r"|\s+--(?:no-)?update"
            r"|\s+--format(?:=|\s+)[^\s);&|]+"
            r"|\s+(?:-o|--output)(?:=|\s+)[^\s);&|]+"
            r"|\s+--url(?:=|\s+)[^\s);&|]+"
            r")+"
            r"\s+not\s+found\s*$",
            raw,
        )
        legacy_nested_wrapper = re.match(
            r"(?i)^\s*\(\s*command\s+-v\s+wpscan\s*>/dev/null\s+2>&1\s*&&\s*\(",
            raw,
        )
        if polluted_fallback and legacy_nested_wrapper:
            command_body = raw[: polluted_fallback.start()].rstrip()
            if command_body.count("(") - command_body.count(")") == 2:
                raw = cls.WPSCAN_COMMAND
        probe_marker = "__LEGION_WPSCAN_PROBE__"
        fallback_marker = "__LEGION_WPSCAN_FALLBACK__"
        normalized = re.sub(r"(?i)command\s+-v\s+wpscan", f"command -v {probe_marker}", raw)
        normalized = re.sub(r"(?i)echo\s+wpscan\s+not\s+found", fallback_marker, normalized)
        normalized = re.sub(
            r"(?i)(?:^|\s)--url(?:=|\s+)[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(r"(?i)(?:^|\s)--(?:no-)?update(?=\s|[);&|]|$)", " ", normalized)
        normalized = re.sub(r"(?i)(?:^|\s)--disable-tls-checks(?=\s|[);&|]|$)", " ", normalized)
        normalized = re.sub(
            r"(?i)(?:^|\s)--format(?:=|\s+)[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)(?:^|\s)(?:-o|--output)(?:=|\s+)[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)\bwpscan\b",
            "wpscan --disable-tls-checks --no-update --format json --output [OUTPUT].json --url [WEB_URL]",
            normalized,
        )
        normalized = normalized.replace(probe_marker, "wpscan")
        normalized = normalized.replace(fallback_marker, "echo wpscan not found")
        normalized = re.sub(r"\s{2,}", " ", normalized).strip()
        return re.sub(r"\s+\)", ")", normalized)

    @classmethod
    def _ensure_dirsearch_command(cls, command: str) -> str:
        raw = cls._canonicalize_web_target_placeholders(str(command or ""))
        if "dirsearch" not in raw.lower():
            return raw
        probe_marker = "__LEGION_DIRSEARCH_PROBE__"
        fallback_marker = "__LEGION_DIRSEARCH_FALLBACK__"
        normalized = re.sub(r"(?i)command\s+-v\s+dirsearch", f"command -v {probe_marker}", raw)
        normalized = re.sub(r"(?i)echo\s+dirsearch\s+not\s+found", fallback_marker, normalized)
        normalized = re.sub(r"\[WEB_URL\](?!/)", "[WEB_URL]/", normalized)
        normalized = re.sub(r"(?i)(?:^|\s)(?:-q|--quiet-mode)(?=\s|[);&|]|$)", " ", normalized)
        normalized = re.sub(
            r"(?i)(?:^|\s)--format(?:=|\s+)[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)(?:^|\s)(?:-o|--output)(?:=|\s+)[^\s);&|]+",
            " ",
            normalized,
        )
        normalized = re.sub(
            r"(?i)\bdirsearch\b",
            "dirsearch --quiet-mode --format=json --output=[OUTPUT].json",
            normalized,
        )
        normalized = normalized.replace(probe_marker, "dirsearch")
        normalized = normalized.replace(fallback_marker, "echo dirsearch not found")
        normalized = re.sub(r"\s{2,}", " ", normalized).strip()
        return re.sub(r"\s+\)", ")", normalized)

    @classmethod
    def _ensure_ffuf_command(cls, command: str) -> str:
        raw = cls._canonicalize_web_target_placeholders(str(command or ""))
        if "ffuf" not in raw.lower():
            return raw
        probe_marker = "__LEGION_FFUF_PROBE__"
        normalized = re.sub(r"(?i)command\s+-v\s+ffuf", f"command -v {probe_marker}", raw)
        normalized = re.sub(r"\[WEB_URL\](?:/FUZZ|/)?", "[WEB_URL]/FUZZ", normalized, count=1)
        normalized = re.sub(r"(?i)(?:^|\s)-json(?=\s|[);&|]|$)", " ", normalized)
        normalized = re.sub(r"(?i)(?:^|\s)-noninteractive(?=\s|[);&|]|$)", " ", normalized)
        normalized = re.sub(r"(?i)(?:^|\s)-s(?=\s|[);&|]|$)", " ", normalized)
        normalized = re.sub(r"(?i)(?:^|\s)-of\s+[^\s);&|]+", " ", normalized)
        normalized = re.sub(r"(?i)(?:^|\s)-o\s+[^\s);&|]+", " ", normalized)
        normalized = re.sub(r"\s*>\s*\[OUTPUT\][^\s\)]*", " ", normalized)
        normalized = re.sub(r"(?i)\bffuf\b", "ffuf -s -of json -o [OUTPUT].json", normalized, count=1)
        normalized = re.sub(r"\s{2,}", " ", normalized).strip().replace(probe_marker, "ffuf")
        return re.sub(r"\s+\)", ")", normalized)

    @staticmethod
    def _ensure_wapiti_command(command: str, scheme: str = "http") -> str:
        raw = str(command or "")
        if "wapiti" not in raw.lower():
            return raw

        selected_scheme = "https" if str(scheme or "").strip().lower() == "https" else "http"
        url_target = f"{selected_scheme}://[IP]:[PORT]"

        # Keep tool-presence probe fragments untouched, for example:
        # `command -v wapiti >/dev/null 2>&1 && ...`
        probe_marker = "__LEGION_WAPITI_PROBE__"
        normalized = re.sub(
            r"(?i)command\s+-v\s+wapiti",
            f"command -v {probe_marker}",
            raw,
        )

        # Already valid command templates do not need further mutation.
        if re.search(r"(?i)\bwapiti\s+-u\s+https?://\[IP\](?::\[PORT\])?", normalized):
            return normalized.replace(probe_marker, "wapiti")

        # Remove positional URL argument after `wapiti` (legacy format).
        normalized = re.sub(
            r"(?i)\bwapiti\s+https?://\[IP\](?::\[PORT\])?",
            "wapiti",
            normalized,
            count=1,
        )
        # Remove explicit --url/-u usages so we can insert one canonical URL.
        normalized = re.sub(r"(?i)(?:--url|-u)\s+(?!-)\S+", "", normalized)
        normalized = re.sub(r"(?i)(?:^|\s)(?:--url|-u)(?=\s|$)", " ", normalized)
        # Insert canonical URL argument.
        normalized = re.sub(r"(?i)\bwapiti\b", f"wapiti -u {url_target}", normalized, count=1)
        normalized = re.sub(r"\s{2,}", " ", normalized).strip()
        return normalized.replace(probe_marker, "wapiti")
