"""Shared target state: normalization."""

from __future__ import annotations

import json
import math
from pydantic import BaseModel
from app.contracts.actions.target_state import ManualTestSuggestion, AttemptedAction
from app.contracts.artifacts.references import ArtifactReference, ScreenshotReference
from app.contracts.observations.target import (
    TechnologyObservation,
    DeviceCategoryObservation,
    FindingObservation,
    FindingQualityObservation,
    ServiceObservation,
    UrlObservation,
    CoverageGapObservation,
    CredentialObservation,
    SessionObservation,
)
from app.core.serialization import decode_json as _from_json
from typing import Any, Dict, List
from app.device_categories import slugify_device_category
from app.url_normalization import normalize_discovered_url

from app.scheduler.state_support.constants import (
    TARGET_SOURCE_KINDS,
    _FINDING_QUALITY_ACTIONS,
    _LOW_SIGNAL_FINDING_EVIDENCE,
    _REFERENCE_ONLY_FINDING_RE,
    _utc_now,
)


def _as_json(value: Any, fallback: Any) -> str:
    try:
        return json.dumps(value if value is not None else fallback, ensure_ascii=False)
    except Exception:
        return json.dumps(fallback, ensure_ascii=False)


def _safe_float(value: Any, default: float = 0.0, minimum: float = 0.0, maximum: float = 100.0) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = float(default)
    if not math.isfinite(parsed):
        parsed = float(default)
    if parsed < minimum:
        return float(minimum)
    if parsed > maximum:
        return float(maximum)
    return float(parsed)


def _safe_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    token = str(value or "").strip().lower()
    if token in {"1", "true", "yes", "y", "on"}:
        return True
    if token in {"0", "false", "no", "n", "off", ""}:
        return False
    return bool(default)


def _normalize_source_kind(value: Any, default: str = "observed") -> str:
    token = str(value or default or "observed").strip().lower()
    if token not in TARGET_SOURCE_KINDS:
        return str(default or "observed")
    return token


def _merge_rows(
    existing: List[Dict[str, Any]], incoming: List[Dict[str, Any]], *, key_fields: List[str], limit: int
) -> List[Dict[str, Any]]:
    merged: List[Dict[str, Any]] = []
    seen = set()
    for source in (incoming, existing):
        for item in list(source or []):
            if not isinstance(item, dict):
                continue
            key = "|".join(str(item.get(field, "")).strip().lower() for field in key_fields)
            if not key or key in seen:
                continue
            seen.add(key)
            merged.append(dict(item))
            if len(merged) >= int(limit):
                return merged
    return merged


def _validated_rows(model: type[BaseModel], rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Validate canonical output while preserving historical missing optional keys."""
    return [model.model_validate(row).model_dump(exclude_unset=True) for row in rows]


def _normalize_technologies(items: Any, default_source: str = "observed") -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "") or "").strip()[:120]
        version = str(item.get("version", "") or "").strip()[:80]
        cpe = str(item.get("cpe", "") or "").strip()[:180]
        evidence = str(item.get("evidence", "") or "").strip()[:280]
        if not name and not cpe:
            continue
        rows.append(
            {
                "name": name,
                "version": version,
                "cpe": cpe,
                "evidence": evidence,
                "confidence": _safe_float(item.get("confidence", 82.0 if cpe else 68.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", default_source), default_source),
                "observed": bool(
                    item.get(
                        "observed",
                        _normalize_source_kind(item.get("source_kind", default_source), default_source) == "observed",
                    )
                ),
            }
        )
    return _validated_rows(
        TechnologyObservation, _merge_rows([], rows, key_fields=["name", "version", "cpe"], limit=240)
    )


def _normalize_device_categories(
    items: Any,
    *,
    default_source: str = "observed",
    default_origin: str = "auto",
) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in list(items or []):
        if isinstance(item, dict):
            name = str(item.get("name", "") or "").strip()[:80]
            confidence = _safe_float(item.get("confidence", 80.0))
            source_kind = _normalize_source_kind(item.get("source_kind", default_source), default_source)
            origin = str(item.get("origin", default_origin) or default_origin).strip().lower()[:16]
            reasons = [
                str(reason or "").strip()[:120]
                for reason in list(item.get("reasons", []) or [])
                if str(reason or "").strip()
            ][:8]
        else:
            name = str(item or "").strip()[:80]
            confidence = 100.0 if default_origin == "manual" else 80.0
            source_kind = _normalize_source_kind(default_source, default_source)
            origin = default_origin
            reasons = ["manual classification"] if default_origin == "manual" else []
        if not name:
            continue
        row = {
            "id": slugify_device_category(name),
            "name": name,
            "confidence": confidence,
            "source_kind": source_kind,
            "origin": origin,
        }
        if reasons:
            row["reasons"] = reasons
        rows.append(row)
    return _validated_rows(DeviceCategoryObservation, _merge_rows([], rows, key_fields=["name"], limit=32))


def _load_custom_device_category_rules() -> List[Dict[str, Any]]:
    try:
        from app.scheduler.config import SchedulerConfigManager

        return list(SchedulerConfigManager().get_device_categories() or [])
    except Exception:
        return []


def _normalize_findings(items: Any, default_source: str = "observed") -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "") or "").strip()[:220]
        severity = str(item.get("severity", "info") or "info").strip().lower()[:16]
        cve = str(item.get("cve", "") or "").strip()[:64]
        evidence = str(item.get("evidence", "") or "").strip()[:320]
        if not title and not cve:
            continue
        if (
            _REFERENCE_ONLY_FINDING_RE.match(title)
            or str(evidence or "").strip().lower() in _LOW_SIGNAL_FINDING_EVIDENCE
        ):
            continue
        try:
            cvss_value = float(item.get("cvss", 0.0) or 0.0)
        except (TypeError, ValueError):
            cvss_value = 0.0
        if not math.isfinite(cvss_value):
            cvss_value = 0.0
        evidence_items = [
            str(token or "").strip()[:160]
            for token in list(item.get("evidence_items", []) or [])
            if str(token or "").strip()
        ][:16]
        row = {
            "title": title,
            "severity": severity,
            "cvss": cvss_value,
            "cve": cve,
            "evidence": evidence,
            "confidence": _safe_float(item.get("confidence", 88.0 if cve else 72.0)),
            "source_kind": _normalize_source_kind(item.get("source_kind", default_source), default_source),
            "observed": bool(
                item.get(
                    "observed",
                    _normalize_source_kind(item.get("source_kind", default_source), default_source) == "observed",
                )
            ),
        }
        if evidence_items:
            row["evidence_items"] = evidence_items
        quality_action = str(item.get("quality_action", "") or "").strip().lower()[:16]
        quality_reason = str(item.get("quality_reason", "") or "").strip().lower()[:96]
        if quality_action in _FINDING_QUALITY_ACTIONS and quality_reason:
            row["quality_action"] = quality_action
            row["quality_reason"] = quality_reason
            severity_before = str(item.get("severity_before", "") or "").strip().lower()[:16]
            if quality_action == "downgraded" and severity_before:
                row["severity_before"] = severity_before
        rows.append(row)
    return _validated_rows(
        FindingObservation, _merge_rows([], rows, key_fields=["title", "cve", "severity"], limit=260)
    )


def _normalize_finding_quality_events(items: Any, default_source: str = "observed") -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        action = str(item.get("action", item.get("quality_action", "")) or "").strip().lower()[:16]
        reason = str(item.get("reason", item.get("quality_reason", "")) or "").strip().lower()[:96]
        title = str(item.get("title", "") or "").strip()[:220]
        cve = str(item.get("cve", "") or "").strip()[:64]
        evidence = str(item.get("evidence", "") or "").strip()[:320]
        matched_url = normalize_discovered_url(item.get("matched_url", ""))[:320]
        if action not in _FINDING_QUALITY_ACTIONS or not reason:
            continue
        if not any([title, cve, evidence, matched_url]):
            continue
        row = {
            "title": title,
            "cve": cve,
            "action": action,
            "reason": reason,
            "severity_before": str(item.get("severity_before", "") or "").strip().lower()[:16],
            "severity_after": str(item.get("severity_after", "") or "").strip().lower()[:16],
            "evidence": evidence,
            "matched_url": matched_url,
            "confidence": _safe_float(item.get("confidence", 82.0)),
            "source_kind": _normalize_source_kind(item.get("source_kind", default_source), default_source),
            "observed": bool(
                item.get(
                    "observed",
                    _normalize_source_kind(item.get("source_kind", default_source), default_source) == "observed",
                )
            ),
        }
        rows.append(row)
    return _validated_rows(
        FindingQualityObservation,
        _merge_rows([], rows, key_fields=["title", "cve", "action", "reason", "evidence", "matched_url"], limit=260),
    )


def _normalize_manual_tests(items: Any, default_source: str = "ai_suggested") -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        why = str(item.get("why", "") or "").strip()[:220]
        command = str(item.get("command", "") or "").strip()[:520]
        scope_note = str(item.get("scope_note", "") or "").strip()[:220]
        if not command and not why:
            continue
        rows.append(
            {
                "why": why,
                "command": command,
                "scope_note": scope_note,
                "confidence": _safe_float(item.get("confidence", 65.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", default_source), default_source),
                "observed": bool(item.get("observed", False)),
            }
        )
    return _validated_rows(ManualTestSuggestion, _merge_rows([], rows, key_fields=["command", "why"], limit=200))


def _normalize_service_inventory(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        rows.append(
            {
                "port": str(item.get("port", "") or "").strip()[:20],
                "protocol": str(item.get("protocol", "tcp") or "tcp").strip().lower()[:12],
                "state": str(item.get("state", "") or "").strip().lower()[:32],
                "service": str(item.get("service", "") or item.get("service_name", "") or "").strip()[:64],
                "service_product": str(item.get("service_product", "") or "").strip()[:120],
                "service_version": str(item.get("service_version", "") or "").strip()[:80],
                "service_extrainfo": str(item.get("service_extrainfo", "") or "").strip()[:120],
                "banner": str(item.get("banner", "") or "").strip()[:280],
                "confidence": _safe_float(item.get("confidence", 95.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                "observed": bool(item.get("observed", True)),
            }
        )
    return _validated_rows(
        ServiceObservation, _merge_rows([], rows, key_fields=["port", "protocol", "service"], limit=320)
    )


def _normalize_urls(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        url = normalize_discovered_url(item.get("url", ""))
        if not url:
            continue
        rows.append(
            {
                "url": url[:320],
                "port": str(item.get("port", "") or "").strip()[:20],
                "protocol": str(item.get("protocol", "tcp") or "tcp").strip().lower()[:12],
                "service": str(item.get("service", "") or "").strip()[:64],
                "label": str(item.get("label", "") or "").strip()[:120],
                "confidence": _safe_float(item.get("confidence", 90.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                "observed": bool(item.get("observed", True)),
            }
        )
    rows.sort(
        key=lambda item: (
            0 if str(item.get("port", "") or "").strip() else 1,
            0 if str(item.get("service", "") or "").strip() else 1,
            -float(item.get("confidence", 0.0) or 0.0),
            str(item.get("url", "") or ""),
        )
    )
    return _validated_rows(UrlObservation, _merge_rows([], rows, key_fields=["url"], limit=240))


def _normalize_coverage_gaps(items: Any) -> List[Dict[str, Any]]:
    rows = []
    if isinstance(items, dict):
        missing = items.get("missing", [])
        recommended = items.get("recommended_tool_ids", [])
        analysis_mode = str(items.get("analysis_mode", "") or "").strip().lower()[:24]
        stage = str(items.get("stage", "") or "").strip().lower()[:32]
        host_cve_count = int(items.get("host_cve_count", 0) or 0)
        items = [
            {
                "gap_id": str(gap or "").strip().lower(),
                "description": str(gap or "").strip().replace("_", " "),
                "recommended_tool_ids": list(recommended or []),
                "analysis_mode": analysis_mode,
                "stage": stage,
                "host_cve_count": host_cve_count,
            }
            for gap in list(missing or [])
            if str(gap or "").strip()
        ]
    if not isinstance(items, list):
        return []
    for item in items:
        if isinstance(item, str):
            item = {"gap_id": str(item).strip().lower(), "description": str(item).strip().replace("_", " ")}
        if not isinstance(item, dict):
            continue
        gap_id = str(item.get("gap_id", "") or "").strip().lower()[:96]
        if not gap_id:
            continue
        recommended = [
            str(token or "").strip().lower()[:80]
            for token in list(item.get("recommended_tool_ids", []) or [])
            if str(token or "").strip()
        ]
        rows.append(
            {
                "gap_id": gap_id,
                "description": str(item.get("description", "") or gap_id.replace("_", " ")).strip()[:220],
                "recommended_tool_ids": recommended[:16],
                "analysis_mode": str(item.get("analysis_mode", "") or "").strip().lower()[:24],
                "stage": str(item.get("stage", "") or "").strip().lower()[:32],
                "host_cve_count": int(item.get("host_cve_count", 0) or 0),
                "confidence": _safe_float(item.get("confidence", 72.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", "inferred"), "inferred"),
                "observed": bool(item.get("observed", False)),
            }
        )
    return _validated_rows(CoverageGapObservation, _merge_rows([], rows, key_fields=["gap_id"], limit=64))


def _normalize_attempted_actions(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        tool_id = str(item.get("tool_id", "") or "").strip()[:96]
        if not tool_id:
            continue
        rows.append(
            {
                "tool_id": tool_id,
                "label": str(item.get("label", "") or tool_id).strip()[:140],
                "action_id": str(item.get("action_id", "") or tool_id).strip()[:120],
                "family_id": str(item.get("family_id", "") or "").strip()[:160],
                "command_signature": str(item.get("command_signature", "") or "").strip()[:160],
                "status": str(item.get("status", "") or "").strip().lower()[:32],
                "attempted_at": str(item.get("attempted_at", "") or _utc_now()).strip()[:64],
                "port": str(item.get("port", "") or "").strip()[:20],
                "protocol": str(item.get("protocol", "tcp") or "tcp").strip().lower()[:12],
                "service": str(item.get("service", "") or "").strip()[:64],
                "origin_mode": str(item.get("origin_mode", "") or "").strip().lower()[:24],
                "approval_state": str(item.get("approval_state", "") or "").strip().lower()[:32],
                "reason": str(item.get("reason", "") or "").strip()[:320],
                "coverage_gap": str(item.get("coverage_gap", "") or "").strip().lower()[:96],
                "pack_ids": [
                    str(token or "").strip().lower()[:64]
                    for token in list(item.get("pack_ids", []) or [])
                    if str(token or "").strip()
                ][:8],
                "artifact_refs": [
                    str(token or "").strip()[:320]
                    for token in list(item.get("artifact_refs", []) or [])
                    if str(token or "").strip()
                ][:12],
                "confidence": _safe_float(item.get("confidence", 94.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                "observed": bool(item.get("observed", True)),
            }
        )
    return _validated_rows(
        AttemptedAction,
        _merge_rows([], rows, key_fields=["tool_id", "status", "port", "protocol", "attempted_at"], limit=360),
    )


def _normalize_credentials(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        username = str(item.get("username", "") or "").strip()[:160]
        secret_ref = str(item.get("secret_ref", "") or "").strip()[:240]
        realm = str(item.get("realm", "") or "").strip()[:160]
        if not username and not secret_ref:
            continue
        rows.append(
            {
                "username": username,
                "secret_ref": secret_ref,
                "realm": realm,
                "type": str(item.get("type", "") or "").strip()[:64],
                "evidence": str(item.get("evidence", "") or "").strip()[:280],
                "confidence": _safe_float(item.get("confidence", 75.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                "observed": bool(item.get("observed", True)),
            }
        )
    return _validated_rows(
        CredentialObservation, _merge_rows([], rows, key_fields=["username", "realm", "type", "secret_ref"], limit=160)
    )


def _normalize_sessions(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        session_type = str(item.get("session_type", "") or "").strip()[:64]
        username = str(item.get("username", "") or "").strip()[:160]
        host = str(item.get("host", "") or "").strip()[:160]
        if not any([session_type, username, host]):
            continue
        rows.append(
            {
                "session_type": session_type,
                "username": username,
                "host": host,
                "port": str(item.get("port", "") or "").strip()[:20],
                "protocol": str(item.get("protocol", "") or "").strip().lower()[:12],
                "evidence": str(item.get("evidence", "") or "").strip()[:280],
                "obtained_at": str(item.get("obtained_at", "") or "").strip()[:64],
                "confidence": _safe_float(item.get("confidence", 78.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                "observed": bool(item.get("observed", True)),
            }
        )
    return _validated_rows(
        SessionObservation,
        _merge_rows([], rows, key_fields=["session_type", "username", "host", "port", "protocol"], limit=160),
    )


def _normalize_screenshots(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        artifact_ref = str(item.get("artifact_ref", "") or item.get("ref", "") or item.get("url", "") or "").strip()[
            :320
        ]
        filename = str(item.get("filename", "") or "").strip()[:200]
        if not artifact_ref and not filename:
            continue
        row = {
            "artifact_ref": artifact_ref,
            "filename": filename,
            "port": str(item.get("port", "") or "").strip()[:20],
            "protocol": str(item.get("protocol", "tcp") or "tcp").strip().lower()[:12],
            "confidence": _safe_float(item.get("confidence", 96.0)),
            "source_kind": _normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            "observed": bool(item.get("observed", True)),
        }
        optional_fields = {
            "target_url": 320,
            "capture_engine": 80,
            "capture_reason": 160,
            "captured_at": 64,
            "service_name": 64,
            "hostname": 160,
        }
        for field, limit in optional_fields.items():
            value = str(item.get(field, "") or "").strip()[:limit]
            if value:
                row[field] = value
        rows.append(row)
    return _validated_rows(
        ScreenshotReference,
        _merge_rows([], rows, key_fields=["artifact_ref", "filename", "port", "protocol"], limit=160),
    )


def _normalize_artifacts(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        ref = str(item.get("ref", "") or item.get("artifact_ref", "") or "").strip()[:320]
        if not ref:
            continue
        rows.append(
            {
                "ref": ref,
                "kind": str(item.get("kind", "") or "").strip().lower()[:64],
                "tool_id": str(item.get("tool_id", "") or "").strip()[:96],
                "port": str(item.get("port", "") or "").strip()[:20],
                "protocol": str(item.get("protocol", "tcp") or "tcp").strip().lower()[:12],
                "confidence": _safe_float(item.get("confidence", 90.0)),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                "observed": bool(item.get("observed", True)),
            }
        )
    return _validated_rows(
        ArtifactReference, _merge_rows([], rows, key_fields=["ref", "kind", "tool_id", "port", "protocol"], limit=240)
    )
