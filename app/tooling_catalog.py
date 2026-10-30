"""Curated external-tool descriptions and installation hints."""

from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass(frozen=True)
class ToolSpec:
    key: str
    label: str
    commands: Tuple[str, ...]
    category: str
    purpose: str
    configured_setting: str = ""
    kali_install: str = ""
    ubuntu_install: str = ""
    notes: str = ""
    optional: bool = True
    file_candidates: Tuple[str, ...] = ()


@dataclass(frozen=True)
class ToolAuditEntry:
    key: str
    label: str
    category: str
    purpose: str
    status: str
    resolved_path: str
    resolved_command: str
    configured_value: str
    kali_install: str
    ubuntu_install: str
    notes: str
    optional: bool

    def to_dict(self) -> Dict[str, object]:
        return {
            "key": self.key,
            "label": self.label,
            "category": self.category,
            "purpose": self.purpose,
            "status": self.status,
            "resolved_path": self.resolved_path,
            "resolved_command": self.resolved_command,
            "configured_value": self.configured_value,
            "kali_install": self.kali_install,
            "ubuntu_install": self.ubuntu_install,
            "notes": self.notes,
            "optional": self.optional,
        }


def _tool_specs() -> List[ToolSpec]:
    return [
        ToolSpec(
            "nmap",
            "Nmap",
            ("nmap",),
            "core",
            "Host discovery, service detection, XML import parity, and most NSE-driven actions.",
            configured_setting="tools_path_nmap",
            kali_install="sudo apt install nmap",
            ubuntu_install="sudo apt install nmap",
            notes="This is the baseline requirement for most Legion workflows.",
            optional=False,
        ),
        ToolSpec(
            "cisco-smart-install",
            "cisco-smart-install",
            ("cisco-smart-install",),
            "internal",
            "Optional Cisco Smart Install validation helper used by Smart Install pipettes when an approved read-only invocation is configured.",
            notes="Legion does not currently invoke this automatically because command syntax and safety characteristics vary by implementation.",
        ),
        ToolSpec(
            "siet",
            "SIET",
            ("siet", "SmartInstallExploit.py"),
            "internal",
            "Optional Cisco Smart Install proof tooling. Active use should remain approval-gated because SIET-style tooling can perform configuration download, upload, reload, or other invasive actions.",
            notes="Detected for operator awareness only; the bundled read-only Cisco Smart Install pipette does not run SIET.",
        ),
        ToolSpec(
            "hydra",
            "Hydra",
            ("hydra",),
            "credentials",
            "Credential brute-force and validation workflows.",
            configured_setting="tools_path_hydra",
            kali_install="sudo apt install hydra",
            ubuntu_install="sudo apt install hydra",
        ),
        ToolSpec(
            "medusa",
            "Medusa",
            ("medusa",),
            "credentials",
            "Legacy credential brute-force workflows such as SNMP community validation.",
            kali_install="sudo apt install medusa",
            ubuntu_install="sudo apt install medusa",
        ),
        ToolSpec(
            "curl",
            "curl",
            ("curl",),
            "core",
            "HTTP headers, OPTIONS, robots.txt, and fallback content checks.",
            kali_install="sudo apt install curl",
            ubuntu_install="sudo apt install curl",
            optional=False,
        ),
        ToolSpec(
            "nuclei",
            "Nuclei",
            ("nuclei",),
            "web",
            "Governed web, CVE, exposure, and targeted validation follow-up.",
            kali_install="go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest && nuclei -up && nuclei -ut",
            ubuntu_install="go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest && nuclei -up && nuclei -ut",
            notes="ProjectDiscovery currently documents the v3 install path and template update flow.",
        ),
        ToolSpec(
            "whatweb",
            "WhatWeb",
            ("whatweb",),
            "web",
            "Technology fingerprinting and graph/state enrichment.",
            kali_install="sudo apt install whatweb",
            ubuntu_install="sudo apt install whatweb",
        ),
        ToolSpec(
            "nikto",
            "Nikto",
            ("nikto",),
            "web",
            "Broad HTTP validation and known issue checks.",
            kali_install="sudo apt install nikto",
            ubuntu_install="sudo apt install nikto",
        ),
        ToolSpec(
            "wafw00f",
            "WAFW00F",
            ("wafw00f",),
            "web",
            "WAF detection and exposure fingerprinting.",
            kali_install="sudo apt install wafw00f",
            ubuntu_install="python3 -m pipx install --force wafw00f",
            notes="Ubuntu installs prefer the upstream pipx path because distro package dependency drift has caused local import failures in recent runs.",
        ),
        ToolSpec(
            "sslscan",
            "sslscan",
            ("sslscan",),
            "web",
            "TLS posture checks.",
            kali_install="sudo apt install sslscan",
            ubuntu_install="sudo apt install sslscan",
        ),
        ToolSpec(
            "sslyze",
            "sslyze",
            ("sslyze",),
            "web",
            "TLS protocol, certificate, and cipher validation.",
            kali_install="sudo apt install sslyze",
            ubuntu_install="python3 -m pipx install --force sslyze",
            notes="Ubuntu installs prefer the upstream pipx path because distro package dependency skew has caused local import failures in recent runs.",
        ),
        ToolSpec(
            "testssl.sh",
            "testssl.sh",
            ("testssl.sh", "testssl"),
            "web",
            "Alternative TLS posture, certificate, and cipher validation.",
            kali_install="sudo apt install testssl.sh",
            ubuntu_install="sudo apt install testssl.sh",
            notes="Useful as a pragmatic TLS fallback when sslyze is unavailable or broken locally.",
        ),
        ToolSpec(
            "wpscan",
            "WPScan",
            ("wpscan",),
            "web",
            "WordPress-focused follow-up and validation.",
            kali_install="sudo apt install wpscan",
            ubuntu_install="sudo apt install wpscan",
        ),
        ToolSpec(
            "wapiti",
            "Wapiti",
            ("wapiti",),
            "web",
            "Application follow-up scanning for HTTP/HTTPS services.",
            kali_install="sudo apt install wapiti",
            ubuntu_install="sudo apt install wapiti",
        ),
        ToolSpec(
            "gobuster",
            "Gobuster",
            ("gobuster",),
            "web",
            "Legacy web content discovery fallback.",
            kali_install="sudo apt install gobuster",
            ubuntu_install="sudo apt install gobuster",
        ),
        ToolSpec(
            "feroxbuster",
            "Feroxbuster",
            ("feroxbuster",),
            "web",
            "Legacy web content discovery fallback.",
            kali_install="sudo apt install feroxbuster",
            ubuntu_install="cargo install feroxbuster",
            notes="Ubuntu users can install Feroxbuster from the upstream Rust/Cargo release path when apt does not ship it.",
        ),
        ToolSpec(
            "dirsearch",
            "dirsearch",
            ("dirsearch",),
            "web",
            "Governed directory/content discovery follow-up.",
            kali_install="sudo apt install dirsearch",
            ubuntu_install="sudo apt install dirsearch",
            notes="If not packaged on your Ubuntu release, install from the upstream dirsearch project.",
        ),
        ToolSpec(
            "ffuf",
            "ffuf",
            ("ffuf",),
            "web",
            "Governed content fuzzing follow-up.",
            kali_install="sudo apt install ffuf",
            ubuntu_install="sudo apt install ffuf",
        ),
        ToolSpec(
            "enum4linux-ng",
            "enum4linux-ng",
            ("enum4linux-ng",),
            "internal",
            "Safer SMB/AD-aware internal enumeration.",
            kali_install="sudo apt install enum4linux-ng",
            ubuntu_install=(
                "sudo apt install smbclient samba-common-bin python3-ldap3 python3-yaml python3-impacket && "
                'tmpdir="$(mktemp -d)" && '
                'git clone --depth 1 https://github.com/cddmp/enum4linux-ng.git "$tmpdir/enum4linux-ng" && '
                'sudo install -m 0755 "$tmpdir/enum4linux-ng/enum4linux-ng.py" /usr/local/bin/enum4linux-ng && '
                'rm -rf "$tmpdir"'
            ),
            notes="Ubuntu support uses upstream enum4linux-ng plus its documented Debian/Ubuntu dependencies instead of a Kali-only apt package.",
        ),
        ToolSpec(
            "smbmap",
            "smbmap",
            ("smbmap",),
            "internal",
            "SMB share and access enumeration.",
            kali_install="sudo apt install smbmap",
            ubuntu_install="sudo apt install smbmap",
        ),
        ToolSpec(
            "netexec",
            "NetExec",
            ("netexec", "nxc"),
            "internal",
            "Modern SMB/LDAP/WinRM-aware internal enumeration and credential validation.",
            kali_install="sudo apt install netexec",
            ubuntu_install=(
                'tmpdir="$(mktemp -d)" && '
                'git clone --depth 1 https://github.com/Pennyw0rth/NetExec.git "$tmpdir/NetExec" && '
                'python3 -m pipx install --force "$tmpdir/NetExec" && '
                'rm -rf "$tmpdir"'
            ),
            notes="Ubuntu support follows the upstream NetExec recommendation to clone the repository and install it with pipx.",
        ),
        ToolSpec(
            "rpcclient",
            "rpcclient",
            ("rpcclient",),
            "internal",
            "SMB/RPC enumeration for internal workflows.",
            kali_install="sudo apt install samba-common-bin",
            ubuntu_install="sudo apt install samba-common-bin",
        ),
        ToolSpec(
            "polenum",
            "polenum",
            ("polenum",),
            "internal",
            "Legacy Windows password policy enumeration.",
            kali_install="sudo apt install polenum",
            ubuntu_install="sudo apt install polenum",
        ),
        ToolSpec(
            "enum4linux",
            "enum4linux",
            ("enum4linux",),
            "internal",
            "Legacy SMB enumeration workflows.",
            kali_install="sudo apt install enum4linux",
            ubuntu_install=(
                "sudo apt install perl smbclient samba-common-bin && "
                'tmpdir="$(mktemp -d)" && '
                'git clone --depth 1 https://github.com/CiscoCXSecurity/enum4linux.git "$tmpdir/enum4linux" && '
                'sudo install -m 0755 "$tmpdir/enum4linux/enum4linux.pl" /usr/local/bin/enum4linux && '
                'rm -rf "$tmpdir"'
            ),
            notes="Ubuntu support installs the upstream enum4linux wrapper and its Samba client dependencies instead of mixing Kali repositories.",
        ),
        ToolSpec(
            "ldapsearch",
            "ldapsearch",
            ("ldapsearch",),
            "internal",
            "LDAP and directory enumeration.",
            kali_install="sudo apt install ldap-utils",
            ubuntu_install="sudo apt install ldap-utils",
        ),
        ToolSpec(
            "nbtscan",
            "nbtscan",
            ("nbtscan",),
            "internal",
            "NetBIOS name enumeration.",
            kali_install="sudo apt install nbtscan",
            ubuntu_install="sudo apt install nbtscan",
        ),
        ToolSpec(
            "rpcinfo",
            "rpcinfo",
            ("rpcinfo",),
            "internal",
            "RPC exposure enumeration.",
            kali_install="sudo apt install rpcbind",
            ubuntu_install="sudo apt install rpcbind",
        ),
        ToolSpec(
            "showmount",
            "showmount",
            ("showmount",),
            "internal",
            "NFS export enumeration.",
            kali_install="sudo apt install nfs-common",
            ubuntu_install="sudo apt install nfs-common",
        ),
        ToolSpec(
            "finger",
            "finger",
            ("finger",),
            "legacy",
            "Legacy service enumeration.",
            kali_install="sudo apt install finger",
            ubuntu_install="sudo apt install finger",
        ),
        ToolSpec(
            "dnsmap",
            "dnsmap",
            ("dnsmap",),
            "passive",
            "Legacy DNS brute-force and expansion workflows.",
            kali_install="sudo apt install dnsmap",
            ubuntu_install="Install from the upstream dnsmap project or Kali package sources.",
        ),
        ToolSpec(
            "theHarvester",
            "theHarvester",
            ("theHarvester", "theharvester", "theHarvester.py"),
            "passive",
            "Legacy external recon and passive collection.",
            kali_install="sudo apt install theharvester",
            ubuntu_install=(
                'PYTHON_BIN="$(if command -v python3.12 >/dev/null 2>&1; then printf python3.12; else printf python3; fi)" && '
                'tmpdir="$(mktemp -d)" && '
                'git clone --depth 1 https://github.com/laramies/theHarvester.git "$tmpdir/theHarvester" && '
                'python3 -m pipx install --force --python "$PYTHON_BIN" "$tmpdir/theHarvester" && '
                'rm -rf "$tmpdir"'
            ),
            notes="Ubuntu support follows the upstream git + pipx install path. Install Playwright browsers separately if you need browser-backed providers.",
        ),
        ToolSpec(
            "snmpcheck",
            "snmpcheck",
            ("snmpcheck",),
            "internal",
            "Legacy SNMP enumeration.",
            kali_install="sudo apt install snmpcheck",
            ubuntu_install="Use a Kali container/VM or install snmpcheck from upstream source; Legion does not mix Kali repositories into Ubuntu.",
            notes="Ubuntu does not have a curated native package path for snmpcheck in Legion today.",
        ),
        ToolSpec(
            "samrdump",
            "samrdump",
            ("impacket-samrdump", "samrdump.py", "samrdump"),
            "internal",
            "Legacy Impacket SAMR enumeration.",
            kali_install="sudo apt install impacket-scripts",
            ubuntu_install="python3 -m pipx install --force impacket",
            notes="Ubuntu support uses the official Impacket pipx install path and detects the modern impacket-samrdump entry point.",
        ),
        ToolSpec(
            "mssqlclient",
            "mssqlclient",
            ("impacket-mssqlclient", "mssqlclient.py", "mssqlclient"),
            "internal",
            "Legacy MSSQL client terminal support via Impacket.",
            kali_install="sudo apt install impacket-scripts",
            ubuntu_install="python3 -m pipx install --force impacket",
            notes="Ubuntu support uses the official Impacket pipx install path and detects the modern impacket-mssqlclient entry point.",
        ),
        ToolSpec(
            "sqlmap",
            "sqlmap",
            ("sqlmap",),
            "web",
            "Legacy SQL injection validation path.",
            kali_install="sudo apt install sqlmap",
            ubuntu_install="sudo apt install sqlmap",
        ),
        ToolSpec(
            "hping3",
            "hping3",
            ("hping3",),
            "legacy",
            "Low-level packet crafting and timestamp/ICMP probing.",
            kali_install="sudo apt install hping3",
            ubuntu_install="sudo apt install hping3",
        ),
        ToolSpec(
            "unicornscan",
            "Unicornscan",
            ("unicornscan",),
            "legacy",
            "Legacy high-speed TCP/UDP scan path.",
            kali_install="sudo apt install unicornscan",
            ubuntu_install="Install from the upstream unicornscan project or use a Kali container/VM; Legion does not mix Kali repositories into Ubuntu.",
        ),
        ToolSpec(
            "smtp-user-enum",
            "smtp-user-enum",
            ("smtp-user-enum",),
            "legacy",
            "Legacy SMTP user enumeration.",
            kali_install="python3 -m pipx install --force smtp-user-enum",
            ubuntu_install="python3 -m pipx install --force smtp-user-enum",
            notes="The upstream Python package provides a more consistent cross-distro install path than relying on distro-specific packaging.",
        ),
        ToolSpec(
            "nc",
            "netcat",
            ("nc", "netcat", "ncat"),
            "core",
            "Banner and low-level connectivity probes.",
            kali_install="sudo apt install netcat-openbsd",
            ubuntu_install="sudo apt install netcat-openbsd",
        ),
        ToolSpec(
            "eyewitness",
            "EyeWitness",
            ("eyewitness", "EyeWitness.py", "EyeWitness"),
            "screenshot",
            "Primary screenshot engine when available.",
            kali_install="sudo apt install eyewitness",
            ubuntu_install="Install EyeWitness from the upstream project if unavailable in apt.",
            notes="Legion also has browser fallbacks, but EyeWitness remains a preferred path when present.",
        ),
        ToolSpec(
            "chromium",
            "Chromium / Chrome",
            ("chromium-browser", "chromium", "google-chrome-stable", "google-chrome", "chrome"),
            "screenshot",
            "Browser-based screenshot capture fallback.",
            kali_install="sudo apt install chromium",
            ubuntu_install="sudo apt install chromium-browser || sudo apt install chromium",
        ),
        ToolSpec(
            "firefox",
            "Firefox",
            ("firefox",),
            "screenshot",
            "Browser-based screenshot fallback.",
            kali_install="sudo apt install firefox-esr",
            ubuntu_install="sudo apt install firefox",
        ),
        ToolSpec(
            "geckodriver",
            "geckodriver",
            ("geckodriver",),
            "screenshot",
            "Firefox Selenium driver used by screenshot fallbacks.",
            kali_install="sudo apt install firefox-geckodriver || sudo apt install geckodriver",
            ubuntu_install="sudo apt install firefox-geckodriver || sudo apt install geckodriver",
        ),
        ToolSpec(
            "xvfb-run",
            "xvfb-run",
            ("xvfb-run",),
            "screenshot",
            "Headless display wrapper for EyeWitness/browser capture paths.",
            kali_install="sudo apt install xvfb",
            ubuntu_install="sudo apt install xvfb",
        ),
        ToolSpec(
            "responder",
            "Responder",
            ("responder",),
            "relay",
            "Responder workspace support.",
            configured_setting="tools_path_responder",
            kali_install="sudo apt install responder",
            ubuntu_install="Install from the upstream Responder project or Kali package sources.",
        ),
        ToolSpec(
            "ntlmrelayx",
            "ntlmrelayx",
            ("impacket-ntlmrelayx", "ntlmrelayx.py", "ntlmrelayx"),
            "relay",
            "NTLM relay workspace support.",
            configured_setting="tools_path_ntlmrelay",
            kali_install="sudo apt install impacket-scripts",
            ubuntu_install="python3 -m pipx install --force impacket",
        ),
        ToolSpec(
            "httpx",
            "httpx",
            ("httpx",),
            "web",
            "Governed HTTP probing and technology detection follow-up.",
            kali_install="go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest",
            ubuntu_install="go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest",
            notes="Used for lightweight HTTP probing, title capture, and technology detection in governed web follow-up.",
        ),
        ToolSpec(
            "subfinder",
            "subfinder",
            ("subfinder",),
            "web",
            "Governed passive external subdomain discovery.",
            kali_install="go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest",
            ubuntu_install="go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest",
            notes="Used for passive external hostname expansion before httpx, screenshots, and bounded web follow-up.",
        ),
        ToolSpec(
            "uncover",
            "uncover",
            ("uncover",),
            "planned",
            "Planned external exposure discovery support.",
            kali_install="go install -v github.com/projectdiscovery/uncover/cmd/uncover@latest",
            ubuntu_install="go install -v github.com/projectdiscovery/uncover/cmd/uncover@latest",
            notes="Useful when Shodan/Censys style exposure discovery is part of workflow.",
        ),
        ToolSpec(
            "cvemap",
            "vulnx / cvemap",
            ("vulnx", "cvemap"),
            "planned",
            "Planned ProjectDiscovery vulnerability/CPE exploration support.",
            kali_install="go install github.com/projectdiscovery/cvemap/cmd/vulnx@latest",
            ubuntu_install="go install github.com/projectdiscovery/cvemap/cmd/vulnx@latest",
            notes="ProjectDiscovery now recommends vulnx as the successor to cvemap.",
        ),
        ToolSpec(
            "xdg-open",
            "xdg-open",
            ("xdg-open",),
            "desktop",
            "Open artifacts and exported files from the UI.",
            configured_setting="tools_path_texteditor",
            kali_install="sudo apt install xdg-utils",
            ubuntu_install="sudo apt install xdg-utils",
        ),
        ToolSpec(
            "rwho",
            "rwho",
            ("rwho",),
            "legacy",
            "Legacy remote user enumeration against rwhod services.",
            kali_install="sudo apt install rwho",
            ubuntu_install="sudo apt install rwho",
        ),
    ]
