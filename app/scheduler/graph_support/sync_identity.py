"""Evidence graph storage and synchronization: sync identity."""

from __future__ import annotations

from app.device_categories import category_names

from app.scheduler.graph_support.storage import (
    _clean_text,
    _ensure_tables,
    _normalize_source_kind,
    _remember_mutation,
    _safe_float,
    _subnet_for_host,
    _upsert_edge,
    _upsert_node,
)


def _sync_graph_identity(context, host_id, mutations, session):
    """Synchronize identity within the caller-owned graph transaction."""
    _ensure_tables(session)
    resolved_host_id = int(context.get("host_id", 0) or host_id or 0)
    host_ip = _clean_text(context.get("host_ip", ""), limit=160)
    hostname = _clean_text(context.get("hostname", ""), limit=200)
    os_match = _clean_text(context.get("os_match", ""), limit=120)
    goal_profile = _clean_text(context.get("goal_profile", ""), limit=80, allow_unknown=True)
    engagement_preset = _clean_text(context.get("engagement_preset", ""), limit=80, allow_unknown=True)
    last_mode = _clean_text(context.get("last_mode", ""), limit=32, lower=True, allow_unknown=True)
    device_categories = category_names(context.get("device_categories", []))
    scope_node_id, changed = _upsert_node(
        session,
        node_key="scope:project",
        node_type="scope",
        label="Project Scope",
        confidence=100.0,
        source_kind="user_entered",
        source_ref="project:active",
        properties={},
    )
    if changed:
        _remember_mutation(mutations, "node", scope_node_id)

    host_label = hostname or host_ip or f"host-{resolved_host_id}"
    host_node_id, changed = _upsert_node(
        session,
        node_key=f"host:{host_ip or resolved_host_id}",
        node_type="host",
        label=host_label,
        confidence=95.0 if host_ip else 75.0,
        source_kind="observed",
        source_ref=f"host:{resolved_host_id}" if resolved_host_id > 0 else f"host_ip:{host_ip}",
        properties={
            "host_id": resolved_host_id,
            "ip": host_ip,
            "hostname": hostname,
            "os_match": os_match,
            "goal_profile": goal_profile,
            "engagement_preset": engagement_preset,
            "last_mode": last_mode,
            "device_categories": device_categories,
            "device_category_override": bool(context.get("device_category_override", False)),
        },
        evidence_refs=[f"host:{host_ip}" if host_ip else ""],
    )
    if changed:
        _remember_mutation(mutations, "node", host_node_id)

    subnet = _subnet_for_host(host_ip)
    if subnet:
        subnet_node_id, changed = _upsert_node(
            session,
            node_key=f"subnet:{subnet}",
            node_type="subnet",
            label=subnet,
            confidence=100.0,
            source_kind="observed",
            source_ref=f"host:{resolved_host_id}" if resolved_host_id > 0 else f"host_ip:{host_ip}",
            properties={"cidr": subnet},
        )
        if changed:
            _remember_mutation(mutations, "node", subnet_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=scope_node_id,
            to_node_id=subnet_node_id,
            confidence=100.0,
            source_kind="observed",
            source_ref="project:scope",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=subnet_node_id,
            to_node_id=host_node_id,
            confidence=100.0,
            source_kind="observed",
            source_ref=f"host:{resolved_host_id}" if resolved_host_id > 0 else host_ip,
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
    else:
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=scope_node_id,
            to_node_id=host_node_id,
            confidence=100.0,
            source_kind="observed",
            source_ref="project:scope",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)

    if hostname:
        fqdn_node_id, changed = _upsert_node(
            session,
            node_key=f"fqdn:{hostname.lower()}",
            node_type="fqdn",
            label=hostname,
            confidence=_safe_float(context.get("hostname_confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(context.get("hostname_source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}" if resolved_host_id > 0 else host_ip,
            properties={"hostname": hostname},
        )
        if changed:
            _remember_mutation(mutations, "node", fqdn_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="resolves_to",
            from_node_id=fqdn_node_id,
            to_node_id=host_node_id,
            confidence=_safe_float(context.get("hostname_confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(context.get("hostname_source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}" if resolved_host_id > 0 else host_ip,
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
    return host_ip, host_node_id, resolved_host_id
