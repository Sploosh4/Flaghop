"""Evidence graph storage and synchronization: sync services."""

from __future__ import annotations

from typing import Dict

from app.scheduler.graph_support.storage import (
    _clean_text,
    _normalize_source_kind,
    _remember_mutation,
    _safe_float,
    _upsert_edge,
    _upsert_node,
)


def _sync_graph_services(context, host_node_id, mutations, resolved_host_id, session):
    """Synchronize services within the caller-owned graph transaction."""
    service_nodes: Dict[str, str] = {}
    for item in list(context.get("service_inventory", []) or []):
        if not isinstance(item, dict):
            continue
        port = _clean_text(item.get("port", ""), limit=20, allow_unknown=True)
        protocol = _clean_text(item.get("protocol", "tcp"), limit=12, lower=True, allow_unknown=True) or "tcp"
        service_name = _clean_text(item.get("service", ""), limit=64)
        service_product = _clean_text(item.get("service_product", ""), limit=120)
        service_version = _clean_text(item.get("service_version", ""), limit=80)
        service_banner = _clean_text(item.get("banner", ""), limit=320, allow_unknown=True)
        if not port:
            continue
        port_node_id, changed = _upsert_node(
            session,
            node_key=f"port:{resolved_host_id}:{port}/{protocol}",
            node_type="port",
            label=f"{port}/{protocol}",
            confidence=_safe_float(item.get("confidence", 95.0), 95.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:port:{port}/{protocol}",
            properties={
                "host_id": resolved_host_id,
                "port": port,
                "protocol": protocol,
                "state": _clean_text(item.get("state", ""), limit=32, lower=True, allow_unknown=True),
            },
        )
        if changed:
            _remember_mutation(mutations, "node", port_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=port_node_id,
            confidence=_safe_float(item.get("confidence", 95.0), 95.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:port:{port}/{protocol}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        service_node_id, changed = _upsert_node(
            session,
            node_key=f"service:{resolved_host_id}:{port}/{protocol}:{service_name or service_product or 'unknown'}",
            node_type="service",
            label=service_name or service_product or f"service:{port}/{protocol}",
            confidence=_safe_float(item.get("confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:service:{port}/{protocol}",
            properties={
                "host_id": resolved_host_id,
                "port": port,
                "protocol": protocol,
                "service": service_name,
                "product": service_product,
                "version": service_version,
                "banner": service_banner,
            },
        )
        service_nodes[f"{port}/{protocol}"] = service_node_id
        if changed:
            _remember_mutation(mutations, "node", service_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="exposes",
            from_node_id=port_node_id,
            to_node_id=service_node_id,
            confidence=_safe_float(item.get("confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:service:{port}/{protocol}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
    return service_nodes
