"""Shared limits and the supported tool/stage registry."""
from __future__ import annotations




VERSION = "0.3.0"


MAX_XML = 8 * 1024 * 1024


MAX_ARTIFACT = 8 * 1024 * 1024


MAX_LOG = 512 * 1024


TOOLS = {
    "nmap": ("nmap",),
    "http": ("curl",),
    "whatweb": ("whatweb",),
    "tls": ("testssl.sh", "testssl"),
    "smb": ("enum4linux-ng", "enum4linux-ng.py"),
    "ssh": ("ssh-keyscan",),
    "dns": ("dig",),
}


EXTRA_TOOLS = {
    "httpx": ("httpx",), "fingerprintx": ("fingerprintx",),
    "katana": ("katana",), "ffuf": ("ffuf",),
    "nuclei": ("nuclei",), "zap": ("zap.sh", "zaproxy"),
    "wpscan": ("wpscan",), "sqlmap": ("sqlmap",),
    "dalfox": ("dalfox",), "metasploit_check": ("msfconsole",),
    "browser": ("google-chrome", "chromium", "chromium-browser"),
}


TOOLS.update(EXTRA_TOOLS)


STAGES = {1: "Discovery", 2: "Identification", 3: "Enumeration", 4: "Assessment", 5: "Validation"}
