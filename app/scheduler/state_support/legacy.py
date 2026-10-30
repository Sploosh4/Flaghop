"""Shared target state: legacy."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from app.device_categories import normalize_manual_device_categories
from sqlalchemy import text
from app.scheduler.policy import preset_from_legacy_goal_profile

from app.scheduler.state_support.constants import (
    _utc_now,
)
from app.scheduler.state_support.normalization import (
    _as_json,
    _from_json,
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
    _normalize_source_kind,
    _normalize_technologies,
    _normalize_urls,
    _safe_bool,
    _safe_float,
)
from app.scheduler.state_support.storage import (
    _ensure_target_state_table,
)


def target_state_to_legacy_ai_state(target_state: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not isinstance(target_state, dict) or not target_state:
        return None
    return {
        "host_id": int(target_state.get("host_id", 0) or 0),
        "host_ip": str(target_state.get("host_ip", "") or ""),
        "updated_at": str(target_state.get("updated_at", "") or ""),
        "provider": str(target_state.get("provider", "") or ""),
        "goal_profile": str(target_state.get("goal_profile", "") or ""),
        "last_port": str(target_state.get("last_port", "") or ""),
        "last_protocol": str(target_state.get("last_protocol", "") or ""),
        "last_service": str(target_state.get("last_service", "") or ""),
        "hostname": str(target_state.get("hostname", "") or ""),
        "hostname_confidence": _safe_float(target_state.get("hostname_confidence", 0.0)),
        "os_match": str(target_state.get("os_match", "") or ""),
        "os_confidence": _safe_float(target_state.get("os_confidence", 0.0)),
        "next_phase": str(target_state.get("next_phase", "") or ""),
        "technologies": _normalize_technologies(target_state.get("technologies", []), default_source="observed"),
        "findings": _normalize_findings(target_state.get("findings", []), default_source="observed"),
        "finding_quality_events": _normalize_finding_quality_events(
            target_state.get("finding_quality_events", []), default_source="observed"
        ),
        "manual_tests": _normalize_manual_tests(target_state.get("manual_tests", []), default_source="ai_suggested"),
        "device_categories": _normalize_device_categories(
            target_state.get("device_categories", []), default_source="observed", default_origin="auto"
        ),
        "manual_device_categories": _normalize_device_categories(
            target_state.get("manual_device_categories", []), default_source="user_entered", default_origin="manual"
        ),
        "device_category_override": _safe_bool(target_state.get("device_category_override", False)),
        "raw": target_state.get("raw", {}) if isinstance(target_state.get("raw", {}), dict) else {},
    }


def legacy_ai_payload_to_target_state(host_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    goal_profile = str(payload.get("goal_profile", "") or "").strip()
    engagement_preset = str(payload.get("engagement_preset", "") or "").strip().lower()
    provider = str(payload.get("provider", "") or "").strip()
    explicit_mode = str(payload.get("last_mode", "") or "").strip().lower()
    resolved_mode = explicit_mode or ("ai" if provider else "deterministic")
    default_source = "ai_suggested" if resolved_mode == "ai" else "observed"
    if not engagement_preset and goal_profile:
        try:
            engagement_preset = preset_from_legacy_goal_profile(goal_profile)
        except Exception:
            engagement_preset = ""
    raw_payload = payload.get("raw", {}) if isinstance(payload.get("raw", {}), dict) else {}
    manual_device_categories = payload.get("manual_device_categories", raw_payload.get("manual_device_categories"))
    if manual_device_categories is not None:
        raw_payload = dict(raw_payload)
        raw_payload["manual_device_categories"] = normalize_manual_device_categories(manual_device_categories)
    if "device_category_override" in payload or "device_category_override" in raw_payload:
        raw_payload = dict(raw_payload)
        raw_payload["device_category_override"] = _safe_bool(
            payload.get("device_category_override", raw_payload.get("device_category_override", False))
        )
    finding_quality_events = _normalize_finding_quality_events(
        payload.get("finding_quality_events", raw_payload.get("finding_quality_events", [])),
        default_source=default_source,
    )
    if finding_quality_events:
        raw_payload = dict(raw_payload)
        raw_payload["finding_quality_events"] = finding_quality_events
    return {
        "host_id": int(host_id or 0),
        "host_ip": str(payload.get("host_ip", "") or ""),
        "updated_at": str(payload.get("updated_at", "") or _utc_now()),
        "state_version": 1,
        "last_mode": resolved_mode,
        "provider": provider,
        "goal_profile": goal_profile,
        "engagement_preset": engagement_preset,
        "last_port": str(payload.get("last_port", "") or ""),
        "last_protocol": str(payload.get("last_protocol", "") or ""),
        "last_service": str(payload.get("last_service", "") or ""),
        "hostname": str(payload.get("hostname", "") or ""),
        "hostname_confidence": _safe_float(payload.get("hostname_confidence", 0.0)),
        "hostname_source_kind": (
            _normalize_source_kind(
                payload.get("hostname_source_kind", default_source),
                default_source,
            )
            if str(payload.get("hostname", "") or "").strip()
            else ""
        ),
        "os_match": str(payload.get("os_match", "") or ""),
        "os_confidence": _safe_float(payload.get("os_confidence", 0.0)),
        "os_source_kind": (
            _normalize_source_kind(
                payload.get("os_source_kind", default_source),
                default_source,
            )
            if str(payload.get("os_match", "") or "").strip()
            else ""
        ),
        "next_phase": str(payload.get("next_phase", "") or ""),
        "technologies": _normalize_technologies(payload.get("technologies", []), default_source=default_source),
        "findings": _normalize_findings(payload.get("findings", []), default_source=default_source),
        "manual_tests": _normalize_manual_tests(payload.get("manual_tests", []), default_source=default_source),
        "service_inventory": _normalize_service_inventory(payload.get("service_inventory", [])),
        "urls": _normalize_urls(payload.get("urls", [])),
        "coverage_gaps": _normalize_coverage_gaps(payload.get("coverage_gaps", [])),
        "attempted_actions": _normalize_attempted_actions(payload.get("attempted_actions", [])),
        "credentials": _normalize_credentials(payload.get("credentials", [])),
        "sessions": _normalize_sessions(payload.get("sessions", [])),
        "screenshots": _normalize_screenshots(payload.get("screenshots", [])),
        "artifacts": _normalize_artifacts(payload.get("artifacts", [])),
        "raw": raw_payload,
    }


def migrate_legacy_ai_state_to_target_state(database, host_id: Optional[int] = None) -> int:
    session = database.session()
    migrated = 0
    migrated_host_ids: List[int] = []
    try:
        _ensure_target_state_table(session)
        session.execute(
            text(
                "CREATE TABLE IF NOT EXISTS scheduler_host_ai_state ("
                "host_id INTEGER PRIMARY KEY,"
                "host_ip TEXT,"
                "updated_at TEXT,"
                "provider TEXT,"
                "goal_profile TEXT,"
                "last_port TEXT,"
                "last_protocol TEXT,"
                "last_service TEXT,"
                "hostname TEXT,"
                "hostname_confidence REAL,"
                "os_match TEXT,"
                "os_confidence REAL,"
                "next_phase TEXT,"
                "technologies_json TEXT,"
                "findings_json TEXT,"
                "manual_tests_json TEXT,"
                "raw_json TEXT"
                ")"
            )
        )
        query = (
            "SELECT host_id, host_ip, updated_at, provider, goal_profile, last_port, last_protocol, last_service, "
            "hostname, hostname_confidence, os_match, os_confidence, next_phase, technologies_json, findings_json, "
            "manual_tests_json, raw_json "
            "FROM scheduler_host_ai_state"
        )
        params: Dict[str, Any] = {}
        if host_id is not None:
            query += " WHERE host_id = :host_id"
            params["host_id"] = int(host_id or 0)
        rows = session.execute(text(query), params).fetchall()
        for row in rows:
            payload = dict(
                zip(
                    [
                        "host_id",
                        "host_ip",
                        "updated_at",
                        "provider",
                        "goal_profile",
                        "last_port",
                        "last_protocol",
                        "last_service",
                        "hostname",
                        "hostname_confidence",
                        "os_match",
                        "os_confidence",
                        "next_phase",
                        "technologies_json",
                        "findings_json",
                        "manual_tests_json",
                        "raw_json",
                    ],
                    row,
                )
            )
            existing = session.execute(
                text("SELECT host_id FROM scheduler_target_state WHERE host_id = :host_id LIMIT 1"),
                {"host_id": int(payload.get("host_id", 0) or 0)},
            ).fetchone()
            if existing is not None:
                continue
            target_payload = legacy_ai_payload_to_target_state(
                int(payload.get("host_id", 0) or 0),
                {
                    "host_ip": payload.get("host_ip", ""),
                    "updated_at": payload.get("updated_at", ""),
                    "provider": payload.get("provider", ""),
                    "goal_profile": payload.get("goal_profile", ""),
                    "last_port": payload.get("last_port", ""),
                    "last_protocol": payload.get("last_protocol", ""),
                    "last_service": payload.get("last_service", ""),
                    "hostname": payload.get("hostname", ""),
                    "hostname_confidence": payload.get("hostname_confidence", 0.0),
                    "os_match": payload.get("os_match", ""),
                    "os_confidence": payload.get("os_confidence", 0.0),
                    "next_phase": payload.get("next_phase", ""),
                    "technologies": _from_json(payload.get("technologies_json"), []),
                    "findings": _from_json(payload.get("findings_json"), []),
                    "manual_tests": _from_json(payload.get("manual_tests_json"), []),
                    "raw": _from_json(payload.get("raw_json"), {}),
                },
            )
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
                {
                    "host_id": int(target_payload.get("host_id", 0) or 0),
                    "host_ip": str(target_payload.get("host_ip", "") or ""),
                    "updated_at": str(target_payload.get("updated_at", "") or _utc_now()),
                    "state_version": int(target_payload.get("state_version", 1) or 1),
                    "last_mode": str(target_payload.get("last_mode", "") or ""),
                    "provider": str(target_payload.get("provider", "") or ""),
                    "goal_profile": str(target_payload.get("goal_profile", "") or ""),
                    "engagement_preset": str(target_payload.get("engagement_preset", "") or ""),
                    "last_port": str(target_payload.get("last_port", "") or ""),
                    "last_protocol": str(target_payload.get("last_protocol", "") or ""),
                    "last_service": str(target_payload.get("last_service", "") or ""),
                    "hostname": str(target_payload.get("hostname", "") or ""),
                    "hostname_confidence": float(target_payload.get("hostname_confidence", 0.0) or 0.0),
                    "hostname_source_kind": str(target_payload.get("hostname_source_kind", "") or ""),
                    "os_match": str(target_payload.get("os_match", "") or ""),
                    "os_confidence": float(target_payload.get("os_confidence", 0.0) or 0.0),
                    "os_source_kind": str(target_payload.get("os_source_kind", "") or ""),
                    "next_phase": str(target_payload.get("next_phase", "") or ""),
                    "technologies_json": _as_json(target_payload.get("technologies", []), []),
                    "findings_json": _as_json(target_payload.get("findings", []), []),
                    "manual_tests_json": _as_json(target_payload.get("manual_tests", []), []),
                    "service_inventory_json": _as_json(target_payload.get("service_inventory", []), []),
                    "urls_json": _as_json(target_payload.get("urls", []), []),
                    "coverage_gaps_json": _as_json(target_payload.get("coverage_gaps", []), []),
                    "attempted_actions_json": _as_json(target_payload.get("attempted_actions", []), []),
                    "credentials_json": _as_json(target_payload.get("credentials", []), []),
                    "sessions_json": _as_json(target_payload.get("sessions", []), []),
                    "screenshots_json": _as_json(target_payload.get("screenshots", []), []),
                    "artifacts_json": _as_json(target_payload.get("artifacts", []), []),
                    "raw_json": _as_json(target_payload.get("raw", {}), {}),
                },
            )
            migrated += 1
            migrated_host_ids.append(int(target_payload.get("host_id", 0) or 0))
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
    if migrated_host_ids:
        try:
            from app.scheduler.graph import sync_target_state_to_evidence_graph

            for migrated_host_id in list(dict.fromkeys(migrated_host_ids)):
                if int(migrated_host_id or 0) > 0:
                    sync_target_state_to_evidence_graph(database, host_id=int(migrated_host_id))
        except Exception:
            pass
    return migrated
