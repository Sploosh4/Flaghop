"""Tool observation parsing: tls."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from app.scheduler.observations.common import (
    _append_finding,
    _clean_text,
    _dedupe_rows,
    _iter_testssl_records,
    _normalize_tls_protocol_token,
)
from app.scheduler.observations.constants import (
    _ANSI_ESCAPE_RE,
    _LEGACY_TLS_FINDINGS,
    _TLS_ACCEPTED_CIPHER_COUNT_RE,
    _TLS_ISSUER_RE,
    _TLS_KEY_SIZE_RE,
    _TLS_MD5_RE,
    _TLS_PROTOCOL_SECTION_RE,
    _TLS_SHA1_RE,
    _TLS_SUBJECT_RE,
    _TLS_WEAK_CIPHER_RE,
)


def _parse_tls_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    findings: List[Dict[str, Any]] = []
    subject_name = ""
    issuer_name = ""
    explicit_self_signed = False
    seen_legacy_protocol_titles = set()
    seen_weak_cipher = False
    current_protocol_title = ""
    current_protocol_severity = ""
    current_protocol_supported = False

    def _mark_protocol_supported(evidence_line: str) -> None:
        nonlocal current_protocol_supported
        if not current_protocol_title:
            return
        current_protocol_supported = True
        if current_protocol_title in seen_legacy_protocol_titles:
            return
        seen_legacy_protocol_titles.add(current_protocol_title)
        _append_finding(
            findings, current_protocol_title, severity=current_protocol_severity, evidence=f"{tool_id}: {evidence_line}"
        )

    for raw_line in str(output_text or "").splitlines():
        line = _ANSI_ESCAPE_RE.sub("", str(raw_line or "")).strip()
        if not line:
            continue
        lowered = line.lower()

        section_match = _TLS_PROTOCOL_SECTION_RE.match(line)
        if section_match:
            normalized_protocol = _normalize_tls_protocol_token(section_match.group("protocol"))
            current_protocol_title = ""
            current_protocol_severity = ""
            current_protocol_supported = False
            if normalized_protocol in _LEGACY_TLS_FINDINGS:
                current_protocol_title, current_protocol_severity = _LEGACY_TLS_FINDINGS[normalized_protocol]
            if any(marker in lowered for marker in ("enabled", "accepted", "offered", "supported")):
                if "disabled" not in lowered and "not supported" not in lowered and "rejected" not in lowered:
                    _mark_protocol_supported(line)
        elif line.startswith("*") or line.startswith("-"):
            current_protocol_title = ""
            current_protocol_severity = ""
            current_protocol_supported = False

        if current_protocol_title:
            accepted_match = _TLS_ACCEPTED_CIPHER_COUNT_RE.search(lowered)
            if accepted_match:
                try:
                    accepted_count = int(accepted_match.group("count") or 0)
                except (TypeError, ValueError):
                    accepted_count = 0
                if accepted_count > 0:
                    _mark_protocol_supported(line)
                else:
                    current_protocol_supported = False
            elif "accepted the following" in lowered or "server accepted" in lowered:
                _mark_protocol_supported(line)
            elif "not supported" in lowered or "rejected all cipher suites" in lowered:
                current_protocol_supported = False

        subject_match = _TLS_SUBJECT_RE.match(line)
        if subject_match:
            subject_name = _clean_text(subject_match.group(1), 180)
        issuer_match = _TLS_ISSUER_RE.match(line)
        if issuer_match:
            issuer_name = _clean_text(issuer_match.group(1), 180)
        for protocol_token, (title, severity) in _LEGACY_TLS_FINDINGS.items():
            if protocol_token in lowered and any(
                marker in lowered for marker in ("enabled", "accepted", "offered", "supported")
            ):
                if "disabled" in lowered or "not supported" in lowered or "rejected" in lowered:
                    continue
                current_protocol_title = title
                current_protocol_severity = severity
                _mark_protocol_supported(line)
        if "self-signed" in lowered or "self signed" in lowered:
            explicit_self_signed = True
            _append_finding(findings, "Self-signed TLS certificate", severity="low", evidence=f"{tool_id}: {line}")
        if "certificate expired" in lowered or "expired certificate" in lowered:
            _append_finding(findings, "Expired TLS certificate", severity="medium", evidence=f"{tool_id}: {line}")
        if (
            "heartbleed" in lowered
            and "not vulnerable" not in lowered
            and any(token in lowered for token in ("vulnerable", "exploitable", "affected"))
        ):
            cve_id = "CVE-2014-0160" if "cve-2014-0160" in lowered or "heartbleed" in lowered else ""
            _append_finding(findings, "Heartbleed exposure", severity="high", cve=cve_id, evidence=f"{tool_id}: {line}")
        if (
            not seen_weak_cipher
            and _TLS_WEAK_CIPHER_RE.search(line)
            and (
                current_protocol_supported
                or any(marker in lowered for marker in ("accepted", "offered", "supported", "preferred"))
            )
        ):
            seen_weak_cipher = True
            _append_finding(findings, "Weak TLS cipher supported", severity="medium", evidence=f"{tool_id}: {line}")
        if (
            "compression" in lowered
            and any(marker in lowered for marker in ("enabled", "supported", "supports", "available"))
            and "disabled" not in lowered
        ):
            _append_finding(findings, "TLS compression enabled", severity="medium", evidence=f"{tool_id}: {line}")
        if any(token in lowered for token in ("tls fallback scsv", "tls_fallback_scsv")) and any(
            marker in lowered for marker in ("does not support", "not support", "unsupported")
        ):
            _append_finding(findings, "TLS downgrade protection missing", severity="low", evidence=f"{tool_id}: {line}")
        if "renegotiation" in lowered and (
            "insecure" in lowered or "vulnerable" in lowered or ("secure" in lowered and "not supported" in lowered)
        ):
            _append_finding(findings, "Insecure TLS renegotiation", severity="medium", evidence=f"{tool_id}: {line}")
        key_match = _TLS_KEY_SIZE_RE.search(line)
        if key_match:
            try:
                key_bits = int(key_match.group(1) or 0)
            except (TypeError, ValueError):
                key_bits = 0
            if 0 < key_bits < 2048:
                _append_finding(
                    findings,
                    "Weak TLS certificate key size",
                    severity="medium",
                    evidence=f"{tool_id}: {line}",
                )
        if ("hostname mismatch" in lowered or "does not match" in lowered) and "certificate" in lowered:
            _append_finding(
                findings, "TLS certificate hostname mismatch", severity="medium", evidence=f"{tool_id}: {line}"
            )
        if _TLS_SHA1_RE.search(line) and any(marker in lowered for marker in ("signature", "signed", "algorithm")):
            _append_finding(findings, "TLS certificate uses SHA-1", severity="low", evidence=f"{tool_id}: {line}")
        if _TLS_MD5_RE.search(line) and any(marker in lowered for marker in ("signature", "signed", "algorithm")):
            _append_finding(findings, "TLS certificate uses MD5", severity="medium", evidence=f"{tool_id}: {line}")
        if any(
            token in lowered
            for token in ("untrusted", "not trusted", "failed chain validation", "unable to build verified chain")
        ):
            _append_finding(
                findings, "Untrusted TLS certificate chain", severity="medium", evidence=f"{tool_id}: {line}"
            )
    if subject_name and issuer_name:
        normalized_subject = re.sub(r"\s+", " ", subject_name).strip().lower()
        normalized_issuer = re.sub(r"\s+", " ", issuer_name).strip().lower()
        if normalized_subject and normalized_subject == normalized_issuer and not explicit_self_signed:
            _append_finding(
                findings,
                "Self-signed TLS certificate",
                severity="low",
                evidence=f"{tool_id}: subject={subject_name}; issuer={issuer_name}",
            )
    return {
        "technologies": [],
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=32),
        "urls": [],
    }


def _parse_testssl_output(tool_id: str, output_text: str) -> Dict[str, Any]:
    try:
        payload = json.loads(str(output_text or ""))
    except Exception:
        return _parse_tls_output(tool_id, output_text)
    if not isinstance(payload, (dict, list)):
        return _parse_tls_output(tool_id, output_text)

    findings: List[Dict[str, Any]] = []
    subject_name = ""
    issuer_name = ""
    explicit_self_signed = False
    seen_legacy_protocol_titles = set()
    seen_weak_cipher = False

    def _mark_legacy_protocol(protocol_token: str, evidence: str) -> None:
        if protocol_token not in _LEGACY_TLS_FINDINGS:
            return
        title, severity = _LEGACY_TLS_FINDINGS[protocol_token]
        if title in seen_legacy_protocol_titles:
            return
        seen_legacy_protocol_titles.add(title)
        _append_finding(findings, title, severity=severity, evidence=evidence)

    for record in _iter_testssl_records(payload):
        record_id = _clean_text(record.get("id"), 120)
        finding = _clean_text(record.get("finding"), 520)
        if not record_id and not finding:
            continue
        record_id_lower = record_id.lower()
        finding_lower = finding.lower()
        evidence = f"{tool_id}: {record_id}: {finding}" if record_id else f"{tool_id}: {finding}"

        protocol_token = _normalize_tls_protocol_token(record_id)
        if protocol_token in _LEGACY_TLS_FINDINGS:
            if (
                any(marker in finding_lower for marker in ("offered", "supported", "default protocol"))
                and "not offered" not in finding_lower
                and "not supported" not in finding_lower
            ):
                _mark_legacy_protocol(protocol_token, evidence)

        if "self-signed" in finding_lower or "self signed" in finding_lower:
            explicit_self_signed = True
            _append_finding(findings, "Self-signed TLS certificate", severity="low", evidence=evidence)

        if (
            not seen_weak_cipher
            and (
                _TLS_WEAK_CIPHER_RE.search(finding)
                or (record_id_lower == "sweet32" and "not vulnerable" not in finding_lower)
            )
            and "not offered" not in finding_lower
            and "not supported" not in finding_lower
            and "not vulnerable" not in finding_lower
        ):
            seen_weak_cipher = True
            _append_finding(findings, "Weak TLS cipher supported", severity="medium", evidence=evidence)

        if ("crime" in record_id_lower or "compression" in record_id_lower) and "not vulnerable" not in finding_lower:
            if any(
                marker in finding_lower for marker in ("supported", "supports", "enabled", "available", "vulnerable")
            ):
                _append_finding(findings, "TLS compression enabled", severity="medium", evidence=evidence)

        if "fallback" in record_id_lower and "scsv" in record_id_lower and "not supported" in finding_lower:
            _append_finding(findings, "TLS downgrade protection missing", severity="low", evidence=evidence)

        if (
            "renego" in record_id_lower or "renegotiation" in record_id_lower
        ) and "not vulnerable" not in finding_lower:
            if "not supported" in finding_lower or "vulnerable" in finding_lower or "insecure" in finding_lower:
                _append_finding(findings, "Insecure TLS renegotiation", severity="medium", evidence=evidence)

        if "heartbleed" in record_id_lower and "not vulnerable" not in finding_lower:
            if any(token in finding_lower for token in ("vulnerable", "exploitable", "affected")):
                _append_finding(
                    findings,
                    "Heartbleed exposure",
                    severity="high",
                    cve=str(record.get("cve") or "CVE-2014-0160"),
                    evidence=evidence,
                )

        if record_id_lower.startswith("cert_keysize"):
            key_match = re.search(r"\b(\d{3,5})\s*bits\b", finding_lower)
            if key_match:
                try:
                    key_bits = int(key_match.group(1) or 0)
                except (TypeError, ValueError):
                    key_bits = 0
                if 0 < key_bits < 2048:
                    _append_finding(findings, "Weak TLS certificate key size", severity="medium", evidence=evidence)

        if record_id_lower.startswith("cert_signaturealgorithm"):
            if _TLS_SHA1_RE.search(finding):
                _append_finding(findings, "TLS certificate uses SHA-1", severity="low", evidence=evidence)
            if _TLS_MD5_RE.search(finding):
                _append_finding(findings, "TLS certificate uses MD5", severity="medium", evidence=evidence)

        if record_id_lower.startswith("cert_commonname") and "wo_sni" not in record_id_lower:
            subject_name = finding
        elif record_id_lower.startswith("cert_caissuers") or record_id_lower.startswith("cert_issuer"):
            issuer_name = re.sub(r"\s*\([^)]*\)\s*$", "", finding).strip()

        if record_id_lower.startswith("cert_expirationstatus") and "expired" in finding_lower:
            _append_finding(findings, "Expired TLS certificate", severity="medium", evidence=evidence)

        if (record_id_lower.startswith("cert_trust") or record_id_lower.startswith("cert_commonname")) and (
            "hostname mismatch" in finding_lower
            or ("mismatch" in finding_lower and "host" in finding_lower)
            or ("does not match" in finding_lower and "host" in finding_lower)
        ):
            _append_finding(findings, "TLS certificate hostname mismatch", severity="medium", evidence=evidence)

        if record_id_lower.startswith("cert_chain_of_trust") or record_id_lower.startswith("cert_trust"):
            if any(
                token in finding_lower
                for token in ("untrusted", "not trusted", "failed", "unable to build", "self-signed")
            ):
                if "passed" not in finding_lower and " ok" not in finding_lower and not finding_lower.startswith("ok"):
                    _append_finding(findings, "Untrusted TLS certificate chain", severity="medium", evidence=evidence)

    if subject_name and issuer_name:
        normalized_subject = re.sub(r"\s+", " ", subject_name).strip().lower()
        normalized_issuer = re.sub(r"\s+", " ", issuer_name).strip().lower()
        if normalized_subject and normalized_subject == normalized_issuer and not explicit_self_signed:
            _append_finding(
                findings,
                "Self-signed TLS certificate",
                severity="low",
                evidence=f"{tool_id}: subject={subject_name}; issuer={issuer_name}",
            )

    return {
        "technologies": [],
        "findings": _dedupe_rows(findings, ("title", "cve", "evidence"), limit=32),
        "urls": [],
    }
