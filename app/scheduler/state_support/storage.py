"""Shared target state: storage."""

from __future__ import annotations

from typing import Any, Dict, Optional
from sqlalchemy import text

from app.scheduler.state_support.normalization import (
    _from_json,
    _normalize_device_categories,
    _normalize_finding_quality_events,
    _safe_bool,
)


def _ensure_column(session, table_name: str, column_name: str, column_type: str):
    rows = session.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    existing = {str(row[1]) for row in rows if len(row) > 1}
    if str(column_name) in existing:
        return
    session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))


def _ensure_target_state_table(session):
    session.execute(
        text(
            "CREATE TABLE IF NOT EXISTS scheduler_target_state ("
            "host_id INTEGER PRIMARY KEY,"
            "host_ip TEXT,"
            "updated_at TEXT,"
            "state_version INTEGER,"
            "last_mode TEXT,"
            "provider TEXT,"
            "goal_profile TEXT,"
            "engagement_preset TEXT,"
            "last_port TEXT,"
            "last_protocol TEXT,"
            "last_service TEXT,"
            "hostname TEXT,"
            "hostname_confidence REAL,"
            "hostname_source_kind TEXT,"
            "os_match TEXT,"
            "os_confidence REAL,"
            "os_source_kind TEXT,"
            "next_phase TEXT,"
            "technologies_json TEXT,"
            "findings_json TEXT,"
            "manual_tests_json TEXT,"
            "service_inventory_json TEXT,"
            "urls_json TEXT,"
            "coverage_gaps_json TEXT,"
            "attempted_actions_json TEXT,"
            "credentials_json TEXT,"
            "sessions_json TEXT,"
            "screenshots_json TEXT,"
            "artifacts_json TEXT,"
            "raw_json TEXT"
            ")"
        )
    )
    _ensure_column(session, "scheduler_target_state", "host_ip", "TEXT")
    _ensure_column(session, "scheduler_target_state", "updated_at", "TEXT")
    _ensure_column(session, "scheduler_target_state", "state_version", "INTEGER")
    _ensure_column(session, "scheduler_target_state", "last_mode", "TEXT")
    _ensure_column(session, "scheduler_target_state", "provider", "TEXT")
    _ensure_column(session, "scheduler_target_state", "goal_profile", "TEXT")
    _ensure_column(session, "scheduler_target_state", "engagement_preset", "TEXT")
    _ensure_column(session, "scheduler_target_state", "last_port", "TEXT")
    _ensure_column(session, "scheduler_target_state", "last_protocol", "TEXT")
    _ensure_column(session, "scheduler_target_state", "last_service", "TEXT")
    _ensure_column(session, "scheduler_target_state", "hostname", "TEXT")
    _ensure_column(session, "scheduler_target_state", "hostname_confidence", "REAL")
    _ensure_column(session, "scheduler_target_state", "hostname_source_kind", "TEXT")
    _ensure_column(session, "scheduler_target_state", "os_match", "TEXT")
    _ensure_column(session, "scheduler_target_state", "os_confidence", "REAL")
    _ensure_column(session, "scheduler_target_state", "os_source_kind", "TEXT")
    _ensure_column(session, "scheduler_target_state", "next_phase", "TEXT")
    _ensure_column(session, "scheduler_target_state", "technologies_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "findings_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "manual_tests_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "service_inventory_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "urls_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "coverage_gaps_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "attempted_actions_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "credentials_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "sessions_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "screenshots_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "artifacts_json", "TEXT")
    _ensure_column(session, "scheduler_target_state", "raw_json", "TEXT")


def ensure_scheduler_target_state_table(database):
    session = database.session()
    try:
        _ensure_target_state_table(session)
        session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()


def _fetch_target_state_row(database, host_id: int) -> Optional[Dict[str, Any]]:
    session = database.session()
    try:
        _ensure_target_state_table(session)
        result = session.execute(
            text(
                "SELECT host_id, host_ip, updated_at, state_version, last_mode, provider, goal_profile, engagement_preset, "
                "last_port, last_protocol, last_service, hostname, hostname_confidence, hostname_source_kind, "
                "os_match, os_confidence, os_source_kind, next_phase, technologies_json, findings_json, manual_tests_json, "
                "service_inventory_json, urls_json, coverage_gaps_json, attempted_actions_json, credentials_json, "
                "sessions_json, screenshots_json, artifacts_json, raw_json "
                "FROM scheduler_target_state WHERE host_id = :host_id LIMIT 1"
            ),
            {"host_id": int(host_id or 0)},
        )
        row = result.fetchone()
        if row is None:
            return None
        payload = dict(zip(result.keys(), row))
        payload["technologies"] = _from_json(payload.get("technologies_json"), [])
        payload["findings"] = _from_json(payload.get("findings_json"), [])
        payload["manual_tests"] = _from_json(payload.get("manual_tests_json"), [])
        payload["service_inventory"] = _from_json(payload.get("service_inventory_json"), [])
        payload["urls"] = _from_json(payload.get("urls_json"), [])
        payload["coverage_gaps"] = _from_json(payload.get("coverage_gaps_json"), [])
        payload["attempted_actions"] = _from_json(payload.get("attempted_actions_json"), [])
        payload["credentials"] = _from_json(payload.get("credentials_json"), [])
        payload["sessions"] = _from_json(payload.get("sessions_json"), [])
        payload["screenshots"] = _from_json(payload.get("screenshots_json"), [])
        payload["artifacts"] = _from_json(payload.get("artifacts_json"), [])
        payload["raw"] = _from_json(payload.get("raw_json"), {})
        payload["manual_device_categories"] = _normalize_device_categories(
            payload["raw"].get("manual_device_categories", []) if isinstance(payload.get("raw", {}), dict) else [],
            default_source="user_entered",
            default_origin="manual",
        )
        payload["auto_device_categories"] = _normalize_device_categories(
            payload["raw"].get("auto_device_categories", []) if isinstance(payload.get("raw", {}), dict) else [],
            default_source="observed",
            default_origin="auto",
        )
        payload["device_categories"] = _normalize_device_categories(
            payload["raw"].get("device_categories", []) if isinstance(payload.get("raw", {}), dict) else [],
            default_source="observed",
            default_origin="auto",
        )
        payload["device_category_override"] = _safe_bool(
            payload["raw"].get("device_category_override", False) if isinstance(payload.get("raw", {}), dict) else False
        )
        raw_quality_events = (
            payload["raw"].get("finding_quality_events", []) if isinstance(payload.get("raw", {}), dict) else []
        )
        payload["finding_quality_events"] = _normalize_finding_quality_events(
            raw_quality_events, default_source="observed"
        )
        return payload
    finally:
        session.close()
