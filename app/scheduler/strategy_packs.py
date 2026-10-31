from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

from app.scheduler.models import ActionSpec

WEB_SERVICE_IDS = {"http", "https", "ssl", "soap", "http-proxy", "http-alt", "https-alt"}
TLS_SERVICE_IDS = {"https", "ssl", "https-alt"}
INTERNAL_SERVICE_IDS = {
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
    "rpcbind",
    "mysql",
    "postgres",
    "postgresql",
    "ms-sql",
    "ms-sql-s",
    "codasrv-se",
}
SPECIALIZED_ACTION_SIGNAL_TOKENS = {
    "wordpress_detected": ("wpscan", "wordpress", "wp-"),
    "vmware_detected": ("vmware", "vsphere", "vcenter", "esxi"),
    "coldfusion_detected": ("coldfusion", "cfusion"),
    "webdav_detected": ("webdav", "dav"),
    "iis_detected": ("iis", "microsoft-iis"),
    "huawei_detected": ("huawei", "hg5x"),
    "ubiquiti_detected": ("ubiquiti", "unifi", "ubnt"),
}

_COVERAGE_GAP_LABELS = {
    "missing_discovery": "initial discovery coverage",
    "missing_screenshot": "visual capture coverage",
    "missing_nmap_vuln": "baseline vulnerability validation",
    "missing_nuclei_auto": "web validation automation",
    "missing_cpe_cve_enrichment": "CPE/CVE enrichment",
    "missing_technology_fingerprint": "technology fingerprinting",
    "missing_whatweb": "web technology validation",
    "missing_nikto": "HTTP validation follow-up",
    "missing_web_content_discovery": "content discovery follow-up",
    "missing_smb_signing_checks": "SMB signing validation",
    "missing_followup_after_vuln": "vulnerability follow-up evidence",
    "missing_smb_followup_after_vuln": "SMB vulnerability follow-up evidence",
    "missing_deep_tls_waf_checks": "deep TLS/WAF exposure checks",
}


def _normalize_set(values: Any) -> Set[str]:
    if values is None:
        return set()
    if isinstance(values, str):
        values = [item.strip() for item in values.split(",")]
    result = set()
    for item in list(values or []):
        token = str(item or "").strip().lower()
        if token:
            result.add(token)
    return result


def _matches_any(text: str, tokens: Sequence[str]) -> bool:
    lowered = str(text or "").lower()
    return any(str(token or "").strip().lower() in lowered for token in list(tokens or []))


def describe_coverage_gap(gap_id: str) -> str:
    token = str(gap_id or "").strip().lower()
    return _COVERAGE_GAP_LABELS.get(token, token.replace("_", " ").strip())


def _context_signals(context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(context, dict):
        return {}
    signals = context.get("signals", {})
    return signals if isinstance(signals, dict) else {}


def _context_coverage(context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(context, dict):
        return {}
    coverage = context.get("coverage", {})
    return coverage if isinstance(coverage, dict) else {}


def _context_blob(context: Optional[Dict[str, Any]]) -> str:
    if not isinstance(context, dict):
        return ""
    parts: List[str] = []
    for key in ("target", "signals", "coverage", "host_ai_state"):
        value = context.get(key, {})
        if isinstance(value, dict):
            parts.extend(str(item or "") for item in value.values())
        elif isinstance(value, list):
            parts.extend(str(item or "") for item in value)
    host_cves = context.get("host_cves", [])
    if isinstance(host_cves, list):
        for item in host_cves[:32]:
            if isinstance(item, dict):
                parts.extend(str(value or "") for value in item.values())
    return " ".join(parts).lower()


@dataclass(frozen=True)
class StrategyPack:
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
class StrategyPackSelection:
    pack: StrategyPack
    score: float
    reasons: List[str] = field(default_factory=list)
    coverage_gaps: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class StrategyActionGuidance:
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


def get_default_strategy_packs() -> List[StrategyPack]:
    return list(DEFAULT_STRATEGY_PACKS)


def select_strategy_packs(service_name, protocol_name, policy, context=None):
    coverage = _context_coverage(context)
    missing = _normalize_set(coverage.get("missing", []))
    pack = DEFAULT_STRATEGY_PACKS[0]
    matched = [gap for gap in pack.coverage_gap_tools if gap in missing]
    return [StrategyPackSelection(pack=pack, score=22.0, reasons=["Local protocol checks"], coverage_gaps=matched)]


def evaluate_action_strategy(
    action: ActionSpec,
    selections: Sequence[StrategyPackSelection],
    policy,
    context: Optional[Dict[str, Any]] = None,
) -> StrategyActionGuidance:
    tool_id = str(action.tool_id or "").strip().lower()
    tool_text = " ".join(
        [
            str(action.tool_id or ""),
            str(action.label or ""),
            str(action.command_template or ""),
            " ".join(str(item or "") for item in list(action.service_scope or [])),
        ]
    ).lower()
    coverage = _context_coverage(context)
    signals = _context_signals(context)
    coverage_missing = _normalize_set(coverage.get("missing", []))
    coverage_recommended = _normalize_set(coverage.get("recommended_tool_ids", []))
    action_pack_tags = _normalize_set(action.pack_tags)
    action_methodology = _normalize_set(action.methodology_tags)
    action_risk_tags = _normalize_set(action.risk_tags)

    bonus = 0.0
    matched_pack_ids: List[str] = []
    evidence_expectations: List[str] = []
    rationale_fragments: List[str] = []
    coverage_gap = ""

    for selection in list(selections or []):
        pack = selection.pack
        matched = False
        preferred = False

        if pack.pack_id in action_pack_tags:
            bonus += 9.0
            matched = True
        if tool_id in _normalize_set(pack.preferred_tool_ids):
            bonus += 14.0
            matched = True
            preferred = True
        if _matches_any(tool_text, pack.preferred_tool_tokens):
            bonus += 6.0
            matched = True
            preferred = True
        if action_methodology & _normalize_set(pack.methodology_tags):
            bonus += 4.0
            matched = True

        for gap_id in list(selection.coverage_gaps or []):
            if gap_id not in coverage_missing:
                continue
            expected = pack.coverage_gap_tools.get(gap_id, [])
            if tool_id in _normalize_set(expected) or _matches_any(tool_text, expected):
                bonus += 18.0
                matched = True
                coverage_gap = coverage_gap or str(gap_id)

        if _matches_any(tool_text, pack.blocked_tool_tokens) and not preferred:
            bonus -= 12.0

        if matched:
            if pack.pack_id not in matched_pack_ids:
                matched_pack_ids.append(pack.pack_id)
            for item in pack.evidence_expectations:
                token = str(item or "").strip()
                if token and token not in evidence_expectations:
                    evidence_expectations.append(token)
            rationale_fragments.append(pack.label)

    if tool_id in coverage_recommended:
        bonus += 10.0

    specialized_signal_hits = []
    for signal_name, tokens in SPECIALIZED_ACTION_SIGNAL_TOKENS.items():
        if not bool(signals.get(signal_name)):
            continue
        if _matches_any(tool_text, tokens):
            specialized_signal_hits.append(signal_name)
    if specialized_signal_hits:
        bonus += min(36.0, 24.0 + (8.0 * float(len(specialized_signal_hits))))

    if not coverage_gap:
        for selection in list(selections or []):
            for gap_id, expected in selection.pack.coverage_gap_tools.items():
                if gap_id not in coverage_missing:
                    continue
                if tool_id in _normalize_set(expected) or _matches_any(tool_text, expected):
                    coverage_gap = str(gap_id)
                    break
            if coverage_gap:
                break

    if (
        str(getattr(policy, "intent", "") or "").strip().lower() == "recon"
        and {
            "credential_bruteforce",
            "password_spray",
            "exploit_execution",
            "lateral_movement",
        }
        & action_risk_tags
    ):
        bonus -= 10.0

    if (
        str(getattr(policy, "scope", "") or "").strip().lower() == "internal"
        and "web" in action_methodology
        and any(selection.pack.pack_id == "internal_network" for selection in list(selections or []))
        and not matched_pack_ids
    ):
        bonus -= 6.0

    if (
        str(getattr(policy, "scope", "") or "").strip().lower() == "external"
        and {
            "credential_access",
            "exploitation",
        }
        & action_methodology
        and any(selection.pack.pack_id == "external_surface" for selection in list(selections or []))
        and not matched_pack_ids
    ):
        bonus -= 6.0

    coverage_notes = ""
    if coverage_gap:
        coverage_notes = f"Closes {describe_coverage_gap(coverage_gap)}."

    if matched_pack_ids:
        rationale_fragments = [f"packs {', '.join(matched_pack_ids[:3])}"]
    if specialized_signal_hits:
        rationale_fragments.append("specialized signals " + ", ".join(specialized_signal_hits[:2]))
    if coverage_notes:
        rationale_fragments.append(coverage_notes.rstrip("."))

    return StrategyActionGuidance(
        bonus=bonus,
        pack_ids=matched_pack_ids[:4],
        coverage_gap=coverage_gap,
        coverage_notes=coverage_notes,
        evidence_expectations=evidence_expectations[:6],
        rationale_fragments=rationale_fragments[:4],
    )
