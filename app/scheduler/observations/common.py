"""Tool observation parsing: common."""

from __future__ import annotations

import ipaddress
import json
import os
import re
from typing import Any, Dict, Iterable, List, Tuple
from urllib.parse import urljoin, urlparse
from app.hostsfile import normalize_hostname_alias
from app.url_normalization import normalize_discovered_url

from app.scheduler.observations.constants import (
    _ANSI_ESCAPE_RE,
    _CVE_RE,
    _DISCOVERY_ACCESSIBLE_STATUSES,
    _DISCOVERY_ADMIN_TOKENS,
    _DISCOVERY_API_TOKENS,
    _DISCOVERY_BACKUP_PATH_RE,
    _DISCOVERY_PHPMYADMIN_TOKENS,
    _DISCOVERY_PRESENT_STATUSES,
    _DISCOVERY_SENSITIVE_PATH_RE,
    _DISCOVERY_WORDPRESS_TOKENS,
    _IGNORED_DISCOVERY_URL_HOSTS,
    _IGNORED_PRODUCT_NAMES,
    _NAME_VERSION_RE,
    _NUCLEI_QUALITY_ACTIONS,
    _NUCLEI_RATE_LIMIT_PHRASES,
    _NUCLEI_RATE_LIMIT_STATUS_MARKERS,
    _NUCLEI_REFLECTION_MARKERS,
    _NUCLEI_WAF_BLOCK_MARKERS,
    _NUCLEI_WAF_VENDOR_MARKERS,
    _PLACEHOLDER_VALUE_TOKENS,
    _PRODUCT_TOKEN_RE,
    _SEVERITY_LEVELS,
    _SUPPORTED_ARTIFACT_PARSE_PREFIXES,
)


def _clean_text(value: Any, limit: int = 320) -> str:
    text = _ANSI_ESCAPE_RE.sub("", str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text[: int(limit)] if limit > 0 else text


def _looks_placeholder_text(value: Any) -> bool:
    text = _clean_text(value, 200)
    if not text:
        return False
    lowered = text.lower()
    if lowered in _PLACEHOLDER_VALUE_TOKENS:
        return True
    if "[truncated]" in lowered:
        trimmed = lowered.replace("...[truncated]", "").replace("[truncated]", "").strip(" .:-")
        return not trimmed or trimmed == "truncated"
    if lowered.endswith("..."):
        return True
    return False


def _clean_url(value: Any) -> str:
    text = normalize_discovered_url(value)
    if not text:
        return ""
    try:
        parsed = urlparse(text)
        hostname = str(parsed.hostname or "").strip().lower()
        if hostname in _IGNORED_DISCOVERY_URL_HOSTS:
            return ""
    except Exception:
        return ""
    return text[:320]


def _normalize_discovered_host(value: Any) -> str:
    candidate = str(value or "").strip()
    if not candidate:
        return ""
    if "://" in candidate:
        try:
            parsed = urlparse(candidate)
            candidate = str(parsed.hostname or "").strip()
        except Exception:
            return ""
    candidate = candidate.lstrip("*.").rstrip(".")
    candidate = normalize_hostname_alias(candidate)
    candidate = str(candidate or "").strip().rstrip(".")
    if not candidate or any(token in candidate for token in (" ", "/", "\\")):
        return ""
    lowered = candidate.lower()
    if lowered in {"unknown", "localhost"}:
        return ""
    try:
        ipaddress.ip_address(candidate)
        return ""
    except ValueError:
        pass
    return candidate[:253]


def _normalize_tls_protocol_token(value: Any) -> str:
    token = re.sub(r"[^a-z0-9.]+", "", str(value or "").strip().lower())
    if token in {"ssl2", "ssl2.0", "sslv2", "sslv2.0"}:
        return "sslv2"
    if token in {"ssl3", "ssl3.0", "sslv3", "sslv3.0"}:
        return "sslv3"
    if token in {"tls1", "tls1.0", "tlsv1", "tlsv1.0"}:
        return "tlsv1.0"
    if token in {"tls1.1", "tls11", "tlsv1.1"}:
        return "tlsv1.1"
    return token


def _artifact_reader_supported(tool_id: str) -> bool:
    token = str(tool_id or "").strip().lower()
    return any(token.startswith(prefix) for prefix in _SUPPORTED_ARTIFACT_PARSE_PREFIXES)


def _select_artifact_refs_for_tool(tool_id: str, artifact_refs: Iterable[Any]) -> List[str]:
    refs = [str(ref or "").strip() for ref in list(artifact_refs or []) if str(ref or "").strip()]
    if not refs:
        return []
    token = str(tool_id or "").strip().lower()

    def _with_exts(*exts: str) -> List[str]:
        allowed = {str(ext or "").strip().lower() for ext in exts if str(ext or "").strip()}
        return [ref for ref in refs if os.path.splitext(ref)[1].strip().lower() in allowed]

    if token == "nmap-vuln.nse" or token.startswith("http-vuln-"):
        preferred = _with_exts(".nmap")
        if preferred:
            return preferred
    if token == "wpscan":
        preferred = _with_exts(".json")
        if preferred:
            return preferred + [ref for ref in refs if ref not in preferred]
    if token == "screenshooter":
        preferred = _with_exts(".json")
        if preferred:
            return preferred
    if token == "wafw00f":
        preferred = _with_exts(".json")
        if preferred:
            return preferred + [ref for ref in refs if ref not in preferred]
        preferred = _with_exts(".csv")
        if preferred:
            return preferred + [ref for ref in refs if ref not in preferred]
    if token.startswith("testssl"):
        preferred = _with_exts(".json")
        if preferred:
            return preferred
    if token.startswith("httpx"):
        preferred = _with_exts(".jsonl")
        if preferred:
            return preferred
    if token == "subfinder":
        preferred = _with_exts(".jsonl", ".json")
        if preferred:
            return preferred
    if token == "grayhatwarfare":
        preferred = _with_exts(".json")
        if preferred:
            return preferred
    return refs


def _load_artifact_texts(artifact_refs: Iterable[Any], *, max_files: int = 6, max_chars: int = 160000) -> List[str]:
    texts: List[str] = []
    allowed_exts = {".txt", ".json", ".jsonl", ".log", ".csv", ".xml", ".html", ".md", ".nmap", ".gnmap"}
    for ref in list(artifact_refs or [])[: int(max_files)]:
        path = str(ref or "").strip()
        if not path or not os.path.exists(path):
            continue
        ext = os.path.splitext(path)[1].strip().lower()
        if ext and ext not in allowed_exts:
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as handle:
                content = handle.read(int(max_chars))
        except Exception:
            continue
        if str(content or "").strip():
            texts.append(str(content))
    return texts


def _merge_results(left: Dict[str, Any], right: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "technologies": list(left.get("technologies", []) or []) + list(right.get("technologies", []) or []),
        "findings": list(left.get("findings", []) or []) + list(right.get("findings", []) or []),
        "urls": list(left.get("urls", []) or []) + list(right.get("urls", []) or []),
        "discovered_hosts": list(left.get("discovered_hosts", []) or [])
        + list(right.get("discovered_hosts", []) or []),
        "finding_quality_events": list(left.get("finding_quality_events", []) or [])
        + list(right.get("finding_quality_events", []) or []),
    }


def _iter_json_payloads(text: str) -> List[Any]:
    payloads: List[Any] = []
    stripped = str(text or "").strip()
    if not stripped:
        return payloads
    if stripped[:1] in {"{", "["}:
        try:
            payloads.append(json.loads(stripped))
        except Exception:
            pass
    for raw_line in stripped.splitlines():
        line = raw_line.strip()
        if not line or line[:1] not in {"{", "["}:
            continue
        try:
            payload = json.loads(line)
        except Exception:
            continue
        payloads.append(payload)
    return payloads


def _iter_discovery_records(payload: Any) -> Iterable[Dict[str, Any]]:
    if isinstance(payload, dict):
        if any(key in payload for key in ("url", "path", "redirect", "redirectlocation", "status", "status_code")):
            yield payload
        for value in payload.values():
            yield from _iter_discovery_records(value)
    elif isinstance(payload, list):
        for item in payload:
            yield from _iter_discovery_records(item)


def _nested_dict_value(payload: Any, *path_options: str) -> Any:
    for path in list(path_options or []):
        current = payload
        valid = True
        for part in str(path or "").split("."):
            if isinstance(current, dict):
                current = current.get(part)
            else:
                valid = False
                break
        if valid and current not in {None, ""}:
            return current
    return ""


def _iter_testssl_records(payload: Any, section: str = "") -> Iterable[Dict[str, Any]]:
    if isinstance(payload, dict):
        if "id" in payload and "finding" in payload:
            yield {
                "section": _clean_text(section, 64),
                "id": _clean_text(payload.get("id"), 120),
                "severity": _clean_text(payload.get("severity"), 24),
                "cve": _clean_text(payload.get("cve"), 64).upper(),
                "finding": _clean_text(payload.get("finding"), 520),
            }
        for key, value in payload.items():
            if not isinstance(value, (dict, list)):
                continue
            next_section = section
            if key in {
                "pretest",
                "singleCipher",
                "protocols",
                "grease",
                "ciphers",
                "pfs",
                "serverPreferences",
                "serverDefaults",
                "headerResponse",
                "vulnerabilities",
                "cipherTests",
                "browserSimulations",
                "scanResult",
            }:
                next_section = key
            yield from _iter_testssl_records(value, next_section)
    elif isinstance(payload, list):
        for item in payload:
            yield from _iter_testssl_records(item, section)


def _build_base_web_url(*, host_ip: Any = "", hostname: Any = "", port: Any = "", service: Any = "") -> str:
    resolved_host = normalize_hostname_alias(hostname) or str(host_ip or "").strip()
    if not resolved_host:
        return ""
    service_token = str(service or "").strip().rstrip("?").lower()
    scheme = (
        "https" if (service_token.startswith("https") or "ssl" in service_token or "tls" in service_token) else "http"
    )
    if str(port or "").strip():
        return _clean_url(f"{scheme}://{resolved_host}:{str(port).strip()}")
    return _clean_url(f"{scheme}://{resolved_host}")


def _resolve_web_url(value: Any, *, base_url: str = "") -> str:
    text = _clean_text(value, 320)
    if not text:
        return ""
    if text.startswith(("http://", "https://")):
        return _clean_url(text)
    if text.startswith("/") and base_url:
        return _clean_url(urljoin(base_url.rstrip("/") + "/", text))
    return ""


def _severity_token(value: Any, default: str = "info") -> str:
    token = str(value or "").strip().lower()
    if token == "informational":
        token = "info"
    if token in _SEVERITY_LEVELS:
        return "info" if token == "informational" else token
    return str(default or "info")


def _append_url(
    rows: List[Dict[str, Any]], url: str, *, port: str = "", protocol: str = "tcp", service: str = "", label: str = ""
):
    normalized_url = _clean_url(url)
    if not normalized_url:
        return
    rows.append(
        {
            "url": normalized_url,
            "port": str(port or "").strip(),
            "protocol": str(protocol or "tcp").strip().lower() or "tcp",
            "service": str(service or "").strip(),
            "label": _clean_text(label, 120),
            "confidence": 92.0,
            "source_kind": "observed",
            "observed": True,
        }
    )


def _append_technology(rows: List[Dict[str, Any]], name: str, *, version: str = "", cpe: str = "", evidence: str = ""):
    tech_name = _clean_text(name, 120)
    tech_version = _clean_text(version, 80)
    tech_cpe = _clean_text(cpe, 220)
    tech_evidence = _clean_text(evidence, 520)
    if _looks_placeholder_text(tech_name) and not tech_cpe:
        return
    if _looks_placeholder_text(tech_version):
        tech_version = ""
    if _looks_placeholder_text(tech_evidence):
        tech_evidence = ""
    if not tech_name and not tech_cpe:
        return
    rows.append(
        {
            "name": tech_name,
            "version": tech_version,
            "cpe": tech_cpe,
            "evidence": tech_evidence,
            "source_kind": "observed",
            "observed": True,
        }
    )


def _append_finding(
    rows: List[Dict[str, Any]],
    title: str,
    *,
    severity: str = "info",
    cve: str = "",
    evidence: str = "",
    evidence_items: Any = None,
    quality_action: str = "",
    quality_reason: str = "",
    severity_before: str = "",
):
    finding_title = _clean_text(title, 260)
    finding_cve = _clean_text(cve, 64).upper()
    finding_evidence = _clean_text(evidence, 640)
    if _looks_placeholder_text(finding_title) and not finding_cve:
        return
    if _looks_placeholder_text(finding_evidence):
        finding_evidence = ""
    if not finding_title and not finding_cve:
        return
    row = {
        "title": finding_title or finding_cve,
        "severity": _severity_token(severity, "info"),
        "cvss": 0.0,
        "cve": finding_cve,
        "evidence": finding_evidence or finding_title or finding_cve,
        "source_kind": "observed",
        "observed": True,
    }
    normalized_items: List[str] = []
    seen_items = set()
    for token in list(evidence_items or []):
        cleaned = _clean_text(token, 160)
        if not cleaned:
            continue
        lowered = cleaned.lower()
        if lowered in seen_items:
            continue
        seen_items.add(lowered)
        normalized_items.append(cleaned)
        if len(normalized_items) >= 16:
            break
    if normalized_items:
        row["evidence_items"] = normalized_items
    quality_action_token = str(quality_action or "").strip().lower()
    quality_reason_token = str(quality_reason or "").strip().lower()[:96]
    if quality_action_token in _NUCLEI_QUALITY_ACTIONS and quality_reason_token:
        row["quality_action"] = quality_action_token
        row["quality_reason"] = quality_reason_token
        if quality_action_token == "downgraded":
            row["severity_before"] = _severity_token(severity_before or "info", "info")
    rows.append(row)


def _dedupe_rows(rows: List[Dict[str, Any]], key_fields: Tuple[str, ...], limit: int) -> List[Dict[str, Any]]:
    deduped: List[Dict[str, Any]] = []
    seen = set()
    for row in rows:
        if not isinstance(row, dict):
            continue
        key = tuple(str(row.get(field, "") or "").strip().lower() for field in key_fields)
        if not any(key):
            continue
        if key in seen:
            continue
        seen.add(key)
        deduped.append(dict(row))
        if len(deduped) >= int(limit):
            break
    return deduped


def _append_finding_quality_event(
    rows: List[Dict[str, Any]],
    title: str,
    *,
    action: str,
    reason: str,
    severity_before: str = "",
    severity_after: str = "",
    cve: str = "",
    evidence: str = "",
    matched_url: str = "",
):
    action_token = str(action or "").strip().lower()
    reason_token = str(reason or "").strip().lower()[:96]
    if action_token not in _NUCLEI_QUALITY_ACTIONS or not reason_token:
        return
    finding_title = _clean_text(title, 260)
    finding_cve = _clean_text(cve, 64).upper()
    finding_evidence = _clean_text(evidence, 640)
    matched_url_value = _clean_url(matched_url)
    if not any([finding_title, finding_cve, finding_evidence, matched_url_value]):
        return
    row = {
        "title": finding_title or finding_cve,
        "cve": finding_cve,
        "action": action_token,
        "reason": reason_token,
        "severity_before": _severity_token(severity_before or "info", "info"),
        "evidence": finding_evidence or finding_title or finding_cve,
        "source_kind": "observed",
        "observed": True,
    }
    severity_after_token = str(severity_after or "").strip().lower()
    if severity_after_token:
        row["severity_after"] = _severity_token(severity_after_token, "info")
    if matched_url_value:
        row["matched_url"] = matched_url_value
    rows.append(row)


def _append_product_technology(rows: List[Dict[str, Any]], value: Any, *, evidence: str = ""):
    text = _clean_text(value, 160)
    if not text:
        return
    match = _PRODUCT_TOKEN_RE.search(text)
    if not match:
        return
    name = _clean_text(match.group(1), 96)
    if not name or name.lower() in _IGNORED_PRODUCT_NAMES:
        return
    version = _clean_text(match.group(2) or "", 80)
    _append_technology(rows, name, version=version, evidence=evidence or text)


def _append_named_version_technology(rows: List[Dict[str, Any]], value: Any, *, evidence: str = ""):
    text = _clean_text(value, 160)
    if not text or _looks_placeholder_text(text):
        return
    match = _NAME_VERSION_RE.match(text)
    if not match:
        _append_technology(rows, text, evidence=evidence or text)
        return
    name = _clean_text(match.group(1), 96)
    if not name or name.lower() in _IGNORED_PRODUCT_NAMES:
        return
    version = _clean_text(match.group(2) or "", 80)
    _append_technology(rows, name, version=version, evidence=evidence or text)


def _strip_nmap_preamble(output_text: Any) -> str:
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
        if re.match(r"(?i)^#\s*Nmap\b", stripped):
            continue
        if re.match(r"(?i)^Scanned at\b", stripped):
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


def _infer_finding_severity(value: Any, default: str = "info") -> str:
    lowered = _clean_text(value, 320).lower()
    if not lowered:
        return _severity_token(default, "info")
    if _CVE_RE.search(lowered):
        return "medium"
    if any(
        token in lowered
        for token in ("critical", "rce", "remote code", "auth bypass", "sql injection", "xss", "vulnerable", "exposure")
    ):
        return "medium"
    if any(
        token in lowered
        for token in ("missing", "self-signed", "expired", "directory listing", "xml-rpc", "weak cipher", "compression")
    ):
        return "low"
    return _severity_token(default, "info")


def _nuclei_quality_text(*values: Any) -> str:
    parts = []
    for value in list(values or []):
        cleaned = _clean_text(value, 320)
        if cleaned:
            parts.append(cleaned)
    return " | ".join(parts)[:2400]


def _evaluate_nuclei_finding_quality(
    *,
    title: str,
    severity: str,
    evidence: str,
    matched_url: str = "",
    evidence_items: Any = None,
) -> Dict[str, str]:
    evidence_tokens = [_clean_text(token, 160) for token in list(evidence_items or []) if _clean_text(token, 160)][:16]
    corpus = _nuclei_quality_text(title, evidence, matched_url, *evidence_tokens).lower()
    title_token = _clean_text(title, 240).lower()
    if not corpus:
        return {}

    has_rate_limit_status = any(marker in corpus for marker in _NUCLEI_RATE_LIMIT_STATUS_MARKERS) or bool(
        re.search(r"(?:^|[^0-9])429(?:[^0-9]|$)", corpus)
    )
    has_rate_limit_phrase = any(marker in corpus for marker in _NUCLEI_RATE_LIMIT_PHRASES)
    if has_rate_limit_phrase or (
        has_rate_limit_status
        and any(marker in corpus for marker in ("retry", "too many requests", "rate", "throttl", "quota"))
    ):
        return {
            "action": "suppressed",
            "reason": "rate_limited_response",
            "severity_before": _severity_token(severity, "info"),
        }

    has_waf_vendor = any(marker in corpus for marker in _NUCLEI_WAF_VENDOR_MARKERS)
    has_waf_block = any(marker in corpus for marker in _NUCLEI_WAF_BLOCK_MARKERS)
    title_mentions_waf = "waf" in title_token or any(marker in title_token for marker in _NUCLEI_WAF_VENDOR_MARKERS)
    if has_waf_block and (has_waf_vendor or "waf" in corpus or "captcha" in corpus or "blocked" in corpus):
        if not title_mentions_waf:
            return {
                "action": "suppressed",
                "reason": "waf_block_page",
                "severity_before": _severity_token(severity, "info"),
            }

    if any(marker in corpus for marker in _NUCLEI_REFLECTION_MARKERS):
        current_severity = _severity_token(severity, "info")
        if current_severity != "info":
            return {
                "action": "downgraded",
                "reason": "reflection_only_response",
                "severity_before": current_severity,
                "severity_after": "info",
            }

    return {}


def _is_interesting_web_path(path: str) -> bool:
    lowered = str(path or "").strip().lower()
    return bool(
        lowered
        and (
            any(
                token in lowered
                for token in _DISCOVERY_ADMIN_TOKENS + _DISCOVERY_API_TOKENS + _DISCOVERY_WORDPRESS_TOKENS
            )
            or bool(_DISCOVERY_SENSITIVE_PATH_RE.search(lowered))
            or bool(_DISCOVERY_BACKUP_PATH_RE.search(lowered))
        )
    )


def _classify_content_discovery_path(
    technologies: List[Dict[str, Any]],
    *,
    tool_id: str,
    candidate_path: str,
    status: str,
    interesting_paths: List[str],
    admin_paths: List[str],
    api_paths: List[str],
    sensitive_paths: List[str],
    backup_paths: List[str],
):
    normalized_path = str(candidate_path or "").strip()
    lowered = normalized_path.lower()
    if not normalized_path or not lowered:
        return
    display_item = f"{normalized_path} ({status})" if status else normalized_path

    if status in _DISCOVERY_PRESENT_STATUSES and _is_interesting_web_path(normalized_path):
        interesting_paths.append(display_item)
    if status in _DISCOVERY_PRESENT_STATUSES and any(token in lowered for token in _DISCOVERY_ADMIN_TOKENS):
        admin_paths.append(display_item)
    if status in _DISCOVERY_PRESENT_STATUSES and any(token in lowered for token in _DISCOVERY_API_TOKENS):
        api_paths.append(display_item)
    if status in _DISCOVERY_ACCESSIBLE_STATUSES and _DISCOVERY_SENSITIVE_PATH_RE.search(lowered):
        sensitive_paths.append(display_item)
    if status in _DISCOVERY_ACCESSIBLE_STATUSES and _DISCOVERY_BACKUP_PATH_RE.search(lowered):
        backup_paths.append(display_item)

    if status in _DISCOVERY_PRESENT_STATUSES and any(token in lowered for token in _DISCOVERY_WORDPRESS_TOKENS):
        _append_technology(technologies, "WordPress", evidence=f"{tool_id} discovered path {normalized_path}")
    if status in _DISCOVERY_PRESENT_STATUSES and any(token in lowered for token in _DISCOVERY_PHPMYADMIN_TOKENS):
        _append_technology(technologies, "phpMyAdmin", evidence=f"{tool_id} discovered path {normalized_path}")
    if status in _DISCOVERY_PRESENT_STATUSES and ("/adminer" in lowered or lowered.endswith("/adminer.php")):
        _append_technology(technologies, "Adminer", evidence=f"{tool_id} discovered path {normalized_path}")


def _infer_crawled_path_technologies(
    technologies: List[Dict[str, Any]],
    *,
    tool_id: str,
    candidate_path: str,
):
    normalized_path = str(candidate_path or "").strip()
    lowered = normalized_path.lower()
    if not normalized_path or not lowered:
        return
    if any(token in lowered for token in _DISCOVERY_WORDPRESS_TOKENS):
        _append_technology(technologies, "WordPress", evidence=f"{tool_id} crawled path {normalized_path}")
    if any(token in lowered for token in _DISCOVERY_PHPMYADMIN_TOKENS):
        _append_technology(technologies, "phpMyAdmin", evidence=f"{tool_id} crawled path {normalized_path}")
    if "/adminer" in lowered or lowered.endswith("/adminer.php"):
        _append_technology(technologies, "Adminer", evidence=f"{tool_id} crawled path {normalized_path}")
