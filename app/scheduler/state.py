"""Shared target state: facade."""

from __future__ import annotations

from typing import Any, Dict, Optional
from app.device_categories import (
    classify_device_categories,
    merge_effective_device_categories,
    normalize_manual_device_categories,
)
from sqlalchemy import text

from app.scheduler.state_support.constants import (
    _utc_now,
)
from app.scheduler.state_support.normalization import (
    _as_json,
    _load_custom_device_category_rules,
    _merge_rows,
    _normalize_artifacts,
    _normalize_attempted_actions,
    _normalize_coverage_gaps,
    _normalize_credentials,
    _normalize_device_categories,
    _normalize_finding_quality_events,
    _normalize_findings,
    _normalize_manual_tests,
    _normalize_screenshots,
    _normalize_service_inventory,
    _normalize_sessions,
    _normalize_technologies,
    _normalize_urls,
    _safe_bool,
    _safe_float,
)
from app.scheduler.state_support.storage import _ensure_target_state_table, _fetch_target_state_row
from app.scheduler.state_support.observations import build_artifact_entries as build_artifact_entries
from app.scheduler.state_support.observations import build_attempted_action_entry as build_attempted_action_entry
from app.scheduler.state_support.observations import build_target_urls as build_target_urls
from app.scheduler.state_support.storage import (
    ensure_scheduler_target_state_table as ensure_scheduler_target_state_table,
)
from app.scheduler.state_support.legacy import legacy_ai_payload_to_target_state as legacy_ai_payload_to_target_state
from app.scheduler.state_support.observations import load_observed_service_inventory as load_observed_service_inventory
from app.scheduler.state_support.legacy import (
    migrate_legacy_ai_state_to_target_state as migrate_legacy_ai_state_to_target_state,
)
from app.scheduler.state_support.legacy import target_state_to_legacy_ai_state as target_state_to_legacy_ai_state

__all__ = [
    "build_artifact_entries",
    "build_attempted_action_entry",
    "build_target_urls",
    "delete_target_state",
    "ensure_scheduler_target_state_table",
    "get_target_state",
    "legacy_ai_payload_to_target_state",
    "load_observed_service_inventory",
    "migrate_legacy_ai_state_to_target_state",
    "target_state_to_legacy_ai_state",
    "upsert_target_state",
]


def get_target_state(database, host_id: int) -> Optional[Dict[str, Any]]:
    payload = _fetch_target_state_row(database, int(host_id or 0))
    if payload is not None:
        return payload
    migrated = migrate_legacy_ai_state_to_target_state(database, host_id=int(host_id or 0))
    if migrated <= 0:
        return None
    return _fetch_target_state_row(database, int(host_id or 0))


def upsert_target_state(database, host_id: int, payload: Dict[str, Any], *, merge: bool = True) -> Dict[str, Any]:
    ensure_scheduler_target_state_table(database)
    existing = get_target_state(database, int(host_id or 0)) if merge else None
    normalized = legacy_ai_payload_to_target_state(int(host_id or 0), payload)
    merged = dict(existing or {})
    merged.update(
        {
            "host_id": int(host_id or 0),
            "host_ip": str(normalized.get("host_ip", "") or merged.get("host_ip", "")),
            "updated_at": str(normalized.get("updated_at", "") or _utc_now()),
            "state_version": 1,
            "last_mode": str(normalized.get("last_mode", "") or merged.get("last_mode", "")),
            "provider": str(normalized.get("provider", "") or merged.get("provider", "")),
            "goal_profile": str(normalized.get("goal_profile", "") or merged.get("goal_profile", "")),
            "engagement_preset": str(normalized.get("engagement_preset", "") or merged.get("engagement_preset", "")),
            "last_port": str(normalized.get("last_port", "") or merged.get("last_port", "")),
            "last_protocol": str(normalized.get("last_protocol", "") or merged.get("last_protocol", "")),
            "last_service": str(normalized.get("last_service", "") or merged.get("last_service", "")),
            "hostname": str(normalized.get("hostname", "") or merged.get("hostname", "")),
            "hostname_confidence": (
                max(
                    _safe_float(merged.get("hostname_confidence", 0.0)),
                    _safe_float(normalized.get("hostname_confidence", 0.0)),
                )
                if str(normalized.get("hostname", "") or "").strip()
                else _safe_float(merged.get("hostname_confidence", 0.0))
            ),
            "hostname_source_kind": str(
                normalized.get("hostname_source_kind", "") or merged.get("hostname_source_kind", "")
            ),
            "os_match": str(normalized.get("os_match", "") or merged.get("os_match", "")),
            "os_confidence": (
                max(
                    _safe_float(merged.get("os_confidence", 0.0)),
                    _safe_float(normalized.get("os_confidence", 0.0)),
                )
                if str(normalized.get("os_match", "") or "").strip()
                else _safe_float(merged.get("os_confidence", 0.0))
            ),
            "os_source_kind": str(normalized.get("os_source_kind", "") or merged.get("os_source_kind", "")),
            "next_phase": str(normalized.get("next_phase", "") or merged.get("next_phase", "")),
        }
    )
    merged["technologies"] = _merge_rows(
        _normalize_technologies(merged.get("technologies", []), default_source="observed"),
        _normalize_technologies(normalized.get("technologies", []), default_source="observed"),
        key_fields=["name", "version", "cpe"],
        limit=240,
    )
    merged["findings"] = _merge_rows(
        _normalize_findings(merged.get("findings", []), default_source="observed"),
        _normalize_findings(normalized.get("findings", []), default_source="observed"),
        key_fields=["title", "cve", "severity"],
        limit=260,
    )
    merged["manual_tests"] = _merge_rows(
        _normalize_manual_tests(merged.get("manual_tests", []), default_source="ai_suggested"),
        _normalize_manual_tests(normalized.get("manual_tests", []), default_source="ai_suggested"),
        key_fields=["command", "why"],
        limit=200,
    )
    merged["attempted_actions"] = _merge_rows(
        _normalize_attempted_actions(merged.get("attempted_actions", [])),
        _normalize_attempted_actions(normalized.get("attempted_actions", [])),
        key_fields=["tool_id", "status", "port", "protocol", "attempted_at"],
        limit=360,
    )
    merged["credentials"] = _merge_rows(
        _normalize_credentials(merged.get("credentials", [])),
        _normalize_credentials(normalized.get("credentials", [])),
        key_fields=["username", "realm", "type", "secret_ref"],
        limit=160,
    )
    merged["sessions"] = _merge_rows(
        _normalize_sessions(merged.get("sessions", [])),
        _normalize_sessions(normalized.get("sessions", [])),
        key_fields=["session_type", "username", "host", "port", "protocol"],
        limit=160,
    )
    merged["screenshots"] = _merge_rows(
        _normalize_screenshots(merged.get("screenshots", [])),
        _normalize_screenshots(normalized.get("screenshots", [])),
        key_fields=["artifact_ref", "filename", "port", "protocol"],
        limit=160,
    )
    merged["artifacts"] = _merge_rows(
        _normalize_artifacts(merged.get("artifacts", [])),
        _normalize_artifacts(normalized.get("artifacts", [])),
        key_fields=["ref", "kind", "tool_id", "port", "protocol"],
        limit=240,
    )

    incoming_services = _normalize_service_inventory(normalized.get("service_inventory", []))
    merged["service_inventory"] = incoming_services or _normalize_service_inventory(merged.get("service_inventory", []))
    incoming_urls = _normalize_urls(normalized.get("urls", []))
    merged["urls"] = incoming_urls or _normalize_urls(merged.get("urls", []))
    incoming_gaps = _normalize_coverage_gaps(normalized.get("coverage_gaps", []))
    merged["coverage_gaps"] = incoming_gaps or _normalize_coverage_gaps(merged.get("coverage_gaps", []))
    existing_raw = merged.get("raw", {}) if isinstance(merged.get("raw", {}), dict) else {}
    incoming_raw = normalized.get("raw", {}) if isinstance(normalized.get("raw", {}), dict) else {}
    merged_raw = dict(existing_raw)
    for key, value in incoming_raw.items():
        if str(key or "") == "finding_quality_events":
            continue
        merged_raw[str(key)] = value
    merged_quality_events = _merge_rows(
        _normalize_finding_quality_events(existing_raw.get("finding_quality_events", []), default_source="observed"),
        _normalize_finding_quality_events(incoming_raw.get("finding_quality_events", []), default_source="observed"),
        key_fields=["title", "cve", "action", "reason", "evidence", "matched_url"],
        limit=260,
    )
    if merged_quality_events:
        merged_raw["finding_quality_events"] = merged_quality_events
    elif "finding_quality_events" in merged_raw:
        merged_raw.pop("finding_quality_events", None)
    merged["raw"] = merged_raw
    merged["finding_quality_events"] = merged_quality_events
    manual_device_categories = normalize_manual_device_categories(merged_raw.get("manual_device_categories", []))
    device_category_override = _safe_bool(merged_raw.get("device_category_override", False))
    auto_device_categories = classify_device_categories(
        {
            "hostname": str(merged.get("hostname", "") or ""),
            "os_match": str(merged.get("os_match", "") or ""),
            "service_inventory": list(merged.get("service_inventory", []) or []),
            "technologies": list(merged.get("technologies", []) or []),
            "findings": list(merged.get("findings", []) or []),
        },
        custom_rules=_load_custom_device_category_rules(),
    )
    effective_device_categories = merge_effective_device_categories(
        auto_device_categories,
        manual_device_categories,
        override_auto=device_category_override,
    )
    merged["auto_device_categories"] = _normalize_device_categories(
        auto_device_categories,
        default_source="observed",
        default_origin="auto",
    )
    merged["manual_device_categories"] = _normalize_device_categories(
        manual_device_categories,
        default_source="user_entered",
        default_origin="manual",
    )
    merged["device_categories"] = _normalize_device_categories(
        effective_device_categories,
        default_source="observed",
        default_origin="auto",
    )
    merged["device_category_override"] = bool(device_category_override)
    merged_raw["auto_device_categories"] = merged["auto_device_categories"]
    merged_raw["manual_device_categories"] = merged["manual_device_categories"]
    merged_raw["device_categories"] = merged["device_categories"]
    merged_raw["device_category_override"] = bool(device_category_override)
    merged["raw"] = merged_raw

    session = database.session()
    try:
        _ensure_target_state_table(session)
        existing_row = session.execute(
            text("SELECT host_id FROM scheduler_target_state WHERE host_id = :host_id LIMIT 1"),
            {"host_id": int(host_id or 0)},
        ).fetchone()
        row_payload = {
            "host_id": int(host_id or 0),
            "host_ip": str(merged.get("host_ip", "") or ""),
            "updated_at": str(merged.get("updated_at", "") or _utc_now()),
            "state_version": 1,
            "last_mode": str(merged.get("last_mode", "") or ""),
            "provider": str(merged.get("provider", "") or ""),
            "goal_profile": str(merged.get("goal_profile", "") or ""),
            "engagement_preset": str(merged.get("engagement_preset", "") or ""),
            "last_port": str(merged.get("last_port", "") or ""),
            "last_protocol": str(merged.get("last_protocol", "") or ""),
            "last_service": str(merged.get("last_service", "") or ""),
            "hostname": str(merged.get("hostname", "") or ""),
            "hostname_confidence": _safe_float(merged.get("hostname_confidence", 0.0)),
            "hostname_source_kind": str(merged.get("hostname_source_kind", "") or ""),
            "os_match": str(merged.get("os_match", "") or ""),
            "os_confidence": _safe_float(merged.get("os_confidence", 0.0)),
            "os_source_kind": str(merged.get("os_source_kind", "") or ""),
            "next_phase": str(merged.get("next_phase", "") or ""),
            "technologies_json": _as_json(merged.get("technologies", []), []),
            "findings_json": _as_json(merged.get("findings", []), []),
            "manual_tests_json": _as_json(merged.get("manual_tests", []), []),
            "service_inventory_json": _as_json(merged.get("service_inventory", []), []),
            "urls_json": _as_json(merged.get("urls", []), []),
            "coverage_gaps_json": _as_json(merged.get("coverage_gaps", []), []),
            "attempted_actions_json": _as_json(merged.get("attempted_actions", []), []),
            "credentials_json": _as_json(merged.get("credentials", []), []),
            "sessions_json": _as_json(merged.get("sessions", []), []),
            "screenshots_json": _as_json(merged.get("screenshots", []), []),
            "artifacts_json": _as_json(merged.get("artifacts", []), []),
            "raw_json": _as_json(merged.get("raw", {}), {}),
        }
        if existing_row is None:
            session.execute(
                text(
                    "INSERT INTO scheduler_target_state ("
                    "host_id, host_ip, updated_at, state_version, last_mode, provider, goal_profile, engagement_preset, "
                    "last_port, last_protocol, last_service, hostname, hostname_confidence, hostname_source_kind, "
                    "os_match, os_confidence, os_source_kind, next_phase, technologies_json, findings_json, manual_tests_json, "
                    "service_inventory_json, urls_json, coverage_gaps_json, attempted_actions_json, credentials_json, "
                    "sessions_json, screenshots_json, artifacts_json, raw_json"
                    ") VALUES ("
                    ":host_id, :host_ip, :updated_at, :state_version, :last_mode, :provider, :goal_profile, :engagement_preset, "
                    ":last_port, :last_protocol, :last_service, :hostname, :hostname_confidence, :hostname_source_kind, "
                    ":os_match, :os_confidence, :os_source_kind, :next_phase, :technologies_json, :findings_json, :manual_tests_json, "
                    ":service_inventory_json, :urls_json, :coverage_gaps_json, :attempted_actions_json, :credentials_json, "
                    ":sessions_json, :screenshots_json, :artifacts_json, :raw_json"
                    ")"
                ),
                row_payload,
            )
        else:
            session.execute(
                text(
                    "UPDATE scheduler_target_state SET "
                    "host_ip = :host_ip, updated_at = :updated_at, state_version = :state_version, "
                    "last_mode = :last_mode, provider = :provider, goal_profile = :goal_profile, engagement_preset = :engagement_preset, "
                    "last_port = :last_port, last_protocol = :last_protocol, last_service = :last_service, "
                    "hostname = :hostname, hostname_confidence = :hostname_confidence, hostname_source_kind = :hostname_source_kind, "
                    "os_match = :os_match, os_confidence = :os_confidence, os_source_kind = :os_source_kind, "
                    "next_phase = :next_phase, technologies_json = :technologies_json, findings_json = :findings_json, "
                    "manual_tests_json = :manual_tests_json, service_inventory_json = :service_inventory_json, urls_json = :urls_json, "
                    "coverage_gaps_json = :coverage_gaps_json, attempted_actions_json = :attempted_actions_json, credentials_json = :credentials_json, "
                    "sessions_json = :sessions_json, screenshots_json = :screenshots_json, artifacts_json = :artifacts_json, raw_json = :raw_json "
                    "WHERE host_id = :host_id"
                ),
                row_payload,
            )
        session.commit()
        merged["updated_at"] = row_payload["updated_at"]
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
    try:
        from app.scheduler.graph import sync_target_state_to_evidence_graph

        sync_target_state_to_evidence_graph(database, host_id=int(host_id or 0), target_state=merged)
    except Exception:
        pass
    return merged


def delete_target_state(database, host_id: int) -> int:
    session = database.session()
    try:
        _ensure_target_state_table(session)
        result = session.execute(
            text("DELETE FROM scheduler_target_state WHERE host_id = :host_id"), {"host_id": int(host_id or 0)}
        )
        session.commit()
        return max(0, int(result.rowcount or 0))
    except Exception:
        session.rollback()
        return 0
    finally:
        session.close()
