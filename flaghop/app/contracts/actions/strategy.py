"""Strategy action definitions and selection results."""

from app.contracts.base import ActionData
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class StrategyPack(ActionData):
    pack_id: str
    label: str
    methodology_tags: List[str] = field(default_factory=list)
    trigger_services: List[str] = field(default_factory=list)
    trigger_signals: List[str] = field(default_factory=list)
    trigger_observed_technologies: List[str] = field(default_factory=list)
    preferred_tool_ids: List[str] = field(default_factory=list)
    preferred_tool_tokens: List[str] = field(default_factory=list)
    blocked_tool_tokens: List[str] = field(default_factory=list)
    coverage_gap_tools: Dict[str, List[str]] = field(default_factory=dict)
    evidence_expectations: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class StrategyPackSelection(ActionData):
    pack: StrategyPack
    score: float
    reasons: List[str] = field(default_factory=list)
    coverage_gaps: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class StrategyActionGuidance(ActionData):
    bonus: float = 0.0
    pack_ids: List[str] = field(default_factory=list)
    coverage_gap: str = ""
    coverage_notes: str = ""
    evidence_expectations: List[str] = field(default_factory=list)
    rationale_fragments: List[str] = field(default_factory=list)


DEFAULT_STRATEGY_PACKS = (
    StrategyPack(
        pack_id="internal_network",
        label="Internal Network",
        methodology_tags=["enumeration", "credential_access"],
        trigger_services=[
            "smb",
            "microsoft-ds",
            "netbios-ssn",
            "ldap",
            "kerberos",
            "msrpc",
            "rdp",
            "ms-wbt-server",
            "winrm",
            "snmp",
            "mysql",
            "postgres",
            "postgresql",
            "ms-sql",
            "ms-sql-s",
            "codasrv-se",
        ],
        trigger_signals=[
            "smb_signing_disabled",
            "rdp_service",
            "vnc_service",
            "mysql_detected",
            "postgresql_detected",
            "mssql_detected",
        ],
        trigger_observed_technologies=[
            "active",
            "directory",
            "windows",
            "smb",
            "mysql",
            "postgresql",
            "microsoft sql server",
            "mariadb",
        ],
        preferred_tool_ids=[
            "smb-security-mode.nse",
            "smb2-security-mode.nse",
            "smb-enum-users.nse",
            "enum4linux-ng",
            "smbmap",
            "rpcclient-enum",
            "netexec",
            "mysql-info.nse",
            "pgsql-info.nse",
            "ms-sql-info.nse",
        ],
        preferred_tool_tokens=[
            "smb",
            "ldap",
            "kerberos",
            "rpc",
            "winrm",
            "rdp",
            "snmp",
            "enum",
            "enum4linux",
            "smbmap",
            "rpcclient",
            "netexec",
            "nxc",
            "mysql",
            "mariadb",
            "postgres",
            "pgsql",
            "mssql",
            "sql server",
            "database",
        ],
        blocked_tool_tokens=["nikto", "whatweb", "wpscan", "web-content-discovery", "dirsearch", "ffuf"],
        coverage_gap_tools={
            "missing_smb_signing_checks": ["smb-security-mode.nse", "smb2-security-mode"],
            "missing_smb_followup_after_vuln": ["smb-security-mode.nse", "smb2-security-mode"],
            "missing_internal_safe_enum": ["enum4linux-ng", "smbmap", "rpcclient-enum", "netexec"],
        },
        evidence_expectations=[
            "identity/trust evidence",
            "SMB posture checks",
            "service banners",
        ],
    ),
)
