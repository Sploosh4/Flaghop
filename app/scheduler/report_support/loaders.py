"""Evidence-backed reports: loaders."""

from __future__ import annotations

from typing import Any, Dict, List
from sqlalchemy import text
from app.scheduler.audit import ensure_scheduler_audit_table


def _load_cves(database, host_id: int = 0) -> List[Dict[str, Any]]:
    session = database.session()
    try:
        query = (
            "SELECT id, name, severity, product, version, url, source, exploitId, exploit, exploitUrl, hostId "
            "FROM cve"
        )
        params: Dict[str, Any] = {}
        if int(host_id or 0) > 0:
            query += " WHERE hostId = :host_id"
            params["host_id"] = str(host_id)
        query += " ORDER BY id DESC"
        result = session.execute(text(query), params)
        rows = result.fetchall()
        keys = result.keys()
        return [dict(zip(keys, row)) for row in rows]
    except Exception:
        return []
    finally:
        session.close()


def _load_notes(database, host_id: int = 0) -> List[Dict[str, Any]]:
    session = database.session()
    try:
        query = "SELECT id, hostId, text FROM note"
        params: Dict[str, Any] = {}
        if int(host_id or 0) > 0:
            query += " WHERE hostId = :host_id"
            params["host_id"] = int(host_id)
        query += " ORDER BY id DESC"
        result = session.execute(text(query), params)
        rows = result.fetchall()
        keys = result.keys()
        return [dict(zip(keys, row)) for row in rows]
    except Exception:
        return []
    finally:
        session.close()


def _load_audit_rows(database, host_ip: str = "", limit: int = 800) -> List[Dict[str, Any]]:
    session = database.session()
    try:
        ensure_scheduler_audit_table(database)
        query = (
            "SELECT id, timestamp, host_ip, port, protocol, service, scheduler_mode, goal_profile, "
            "engagement_preset, tool_id, label, command_family_id, danger_categories, risk_tags, requires_approval, "
            "policy_decision, policy_reason, risk_summary, safer_alternative, family_policy_state, approved, "
            "executed, reason, rationale, approval_id "
            "FROM scheduler_decision_log"
        )
        params: Dict[str, Any] = {"limit": max(1, min(int(limit or 800), 5000))}
        if str(host_ip or "").strip():
            query += " WHERE host_ip = :host_ip"
            params["host_ip"] = str(host_ip or "").strip()
        query += " ORDER BY id DESC LIMIT :limit"
        result = session.execute(text(query), params)
        rows = result.fetchall()
        keys = result.keys()
        return [dict(zip(keys, row)) for row in rows]
    except Exception:
        return []
    finally:
        session.close()
