"""Shared target state: observations."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy import text

from app.scheduler.state_support.constants import (
    WEB_SERVICE_IDS,
    _utc_now,
)
from app.scheduler.state_support.normalization import (
    _normalize_artifacts,
    _normalize_service_inventory,
    _normalize_urls,
)
from app.scheduler.state_support.storage import (
    _ensure_target_state_table,
)


def build_target_urls(host_ip: str, hostname: str, service_inventory: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    candidates: List[Dict[str, Any]] = []
    preferred_hosts = []
    for token in [str(hostname or "").strip(), str(host_ip or "").strip()]:
        if token and token not in preferred_hosts:
            preferred_hosts.append(token)
    for item in list(service_inventory or []):
        if not isinstance(item, dict):
            continue
        service_name = str(item.get("service", "") or "").strip().lower()
        if service_name not in WEB_SERVICE_IDS:
            continue
        port = str(item.get("port", "") or "").strip()
        protocol = str(item.get("protocol", "tcp") or "tcp").strip().lower()
        scheme = "https" if service_name in {"https", "ssl", "https-alt"} else "http"
        for host in preferred_hosts[:2]:
            url = f"{scheme}://{host}"
            if port and port not in {"80", "443"}:
                url = f"{url}:{port}"
            candidates.append(
                {
                    "url": url,
                    "port": port,
                    "protocol": protocol,
                    "service": service_name,
                    "label": f"{service_name} base URL",
                    "source_kind": "observed",
                    "observed": True,
                }
            )
    return _normalize_urls(candidates)


def load_observed_service_inventory(database, host_id: int) -> List[Dict[str, Any]]:
    session = database.session()
    try:
        _ensure_target_state_table(session)
        result = session.execute(
            text(
                "SELECT COALESCE(p.portId, '') AS port, "
                "COALESCE(p.protocol, 'tcp') AS protocol, "
                "COALESCE(p.state, '') AS state, "
                "COALESCE(s.name, '') AS service, "
                "COALESCE(s.product, '') AS service_product, "
                "COALESCE(s.version, '') AS service_version, "
                "COALESCE(s.extrainfo, '') AS service_extrainfo "
                "FROM portObj AS p "
                "LEFT JOIN serviceObj AS s ON s.id = p.serviceId "
                "WHERE p.hostId = :host_id "
                "ORDER BY p.id ASC"
            ),
            {"host_id": int(host_id or 0)},
        )
        rows = result.fetchall()
        keys = result.keys()
        return _normalize_service_inventory([dict(zip(keys, row)) for row in rows])
    finally:
        session.close()


def build_attempted_action_entry(
    *,
    decision,
    status: str,
    reason: str,
    attempted_at: str,
    port: str,
    protocol: str,
    service: str,
    family_id: str = "",
    command_signature: str = "",
    artifact_refs: Optional[List[str]] = None,
) -> Dict[str, Any]:
    return {
        "tool_id": str(getattr(decision, "tool_id", "") or ""),
        "label": str(getattr(decision, "label", "") or getattr(decision, "tool_id", "") or ""),
        "action_id": str(getattr(decision, "action_id", "") or getattr(decision, "tool_id", "") or ""),
        "family_id": str(family_id or getattr(decision, "family_id", "") or ""),
        "command_signature": str(command_signature or ""),
        "status": str(status or "").strip().lower(),
        "attempted_at": str(attempted_at or _utc_now()),
        "port": str(port or ""),
        "protocol": str(protocol or "tcp"),
        "service": str(service or ""),
        "origin_mode": str(getattr(decision, "mode", "") or ""),
        "approval_state": str(getattr(decision, "approval_state", "") or ""),
        "reason": str(reason or ""),
        "coverage_gap": str(getattr(decision, "coverage_gap", "") or ""),
        "pack_ids": list(getattr(decision, "pack_ids", []) or []),
        "artifact_refs": list(artifact_refs or []),
        "source_kind": "observed",
        "observed": True,
    }


def build_artifact_entries(
    artifact_refs: List[str],
    *,
    tool_id: str,
    port: str,
    protocol: str,
) -> List[Dict[str, Any]]:
    rows = []
    for ref in list(artifact_refs or []):
        token = str(ref or "").strip()
        if not token:
            continue
        kind = "screenshot" if token.lower().endswith(".png") else "artifact"
        rows.append(
            {
                "ref": token,
                "kind": kind,
                "tool_id": str(tool_id or ""),
                "port": str(port or ""),
                "protocol": str(protocol or "tcp"),
                "source_kind": "observed",
                "observed": True,
            }
        )
    return _normalize_artifacts(rows)
