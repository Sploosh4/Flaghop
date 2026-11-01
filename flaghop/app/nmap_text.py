"""Normalize Nmap output independently of HTTP/runtime state."""

import re


def strip_nmap_preamble(output_text: str) -> str:
    text_value = str(output_text or "")
    if not text_value.strip():
        return ""
    filtered = []
    for raw_line in text_value.splitlines():
        line = str(raw_line or "")
        stripped = line.strip()
        lowered = stripped.lower()
        if not stripped:
            if filtered:
                filtered.append("")
            continue
        if re.match(r"(?i)^Starting Nmap\b", stripped):
            continue
        if re.match(r"(?i)^Nmap scan report for\b", stripped):
            continue
        if re.match(r"(?i)^Host is up\b", stripped):
            continue
        if re.match(r"(?i)^Not shown:\b", stripped):
            continue
        if re.match(r"(?i)^All \d+ scanned ports\b", stripped):
            continue
        if re.match(r"(?i)^NSE:\s+(Loaded|Script Pre-scanning|Starting runlevel|Ending runlevel)\b", stripped):
            continue
        if re.match(r"(?i)^Service detection performed\b", stripped):
            continue
        if "nmap.org" in lowered and (
            lowered.startswith("starting nmap")
            or lowered.startswith("service detection performed")
            or lowered.startswith("read data files from")
            or lowered.startswith("please report")
        ):
            continue
        if re.match(r"(?i)^PORT\s+STATE\s+SERVICE\b", stripped):
            continue
        if re.match(r"(?i)^Nmap done:", stripped):
            continue
        filtered.append(line)
    cleaned = "\n".join(filtered).strip()
    return cleaned or text_value.strip()
