"""Evidence graph storage and synchronization: sync urls."""

from __future__ import annotations

from app.url_normalization import normalize_discovered_url

from app.scheduler.graph_support.storage import (
    _clean_text,
    _delete_stale_host_url_nodes,
    _normalize_source_kind,
    _remember_mutation,
    _safe_float,
    _upsert_edge,
    _upsert_node,
)


def _sync_graph_urls(context, host_node_id, mutations, resolved_host_id, service_nodes, session):
    """Synchronize urls within the caller-owned graph transaction."""
    normalized_url_keys = set()
    for item in list(context.get("urls", []) or []):
        if not isinstance(item, dict):
            continue
        url = normalize_discovered_url(item.get("url", ""))
        url = _clean_text(url, limit=320, allow_unknown=True)
        if not url:
            continue
        port = _clean_text(item.get("port", ""), limit=20, allow_unknown=True)
        protocol = _clean_text(item.get("protocol", "tcp"), limit=12, lower=True, allow_unknown=True) or "tcp"
        node_key = f"url:{resolved_host_id}:{url}"
        normalized_url_keys.add(node_key)
        url_node_id, changed = _upsert_node(
            session,
            node_key=node_key,
            node_type="url",
            label=url,
            confidence=_safe_float(item.get("confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"url:{url}",
            properties={
                "host_id": resolved_host_id,
                "url": url,
                "port": port,
                "protocol": protocol,
                "service": _clean_text(item.get("service", ""), limit=64),
            },
        )
        if changed:
            _remember_mutation(mutations, "node", url_node_id)
        parent_service_id = service_nodes.get(f"{port}/{protocol}") or host_node_id
        edge_id, changed = _upsert_edge(
            session,
            edge_type="exposes",
            from_node_id=parent_service_id,
            to_node_id=url_node_id,
            confidence=_safe_float(item.get("confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"url:{url}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)

    _delete_stale_host_url_nodes(
        session,
        host_id=resolved_host_id,
        keep_node_keys=normalized_url_keys,
    )
