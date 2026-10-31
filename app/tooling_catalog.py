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
            "curl",
            "curl",
            ("curl",),
            "core",
            "HTTP metadata used by the Windows/AD CS protocol checks.",
            kali_install="sudo apt install curl",
            ubuntu_install="sudo apt install curl",
            optional=False,
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
            "dnsmap",
            "dnsmap",
            ("dnsmap",),
            "passive",
            "Legacy DNS brute-force and expansion workflows.",
            kali_install="sudo apt install dnsmap",
            ubuntu_install="Install from the upstream dnsmap project or Kali package sources.",
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
            "nc",
            "netcat",
            ("nc", "netcat", "ncat"),
            "core",
            "Banner and low-level connectivity probes.",
            kali_install="sudo apt install netcat-openbsd",
            ubuntu_install="sudo apt install netcat-openbsd",
        ),
    ]
