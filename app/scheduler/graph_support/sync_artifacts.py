"""Evidence graph storage and synchronization: sync artifacts."""

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


def _sync_graph_artifacts(context, host_node_id, mutations, resolved_host_id, session):
    """Synchronize artifacts within the caller-owned graph transaction."""
    artifact_nodes: Dict[str, str] = {}
    for item in list(context.get("artifacts", []) or []):
        if not isinstance(item, dict):
            continue
        ref = _clean_text(item.get("ref", ""), limit=320, allow_unknown=True)
        if not ref:
            continue
        artifact_node_id, changed = _upsert_node(
            session,
            node_key=f"artifact:{resolved_host_id}:{ref}",
            node_type="artifact",
            label=ref.split("/")[-1] or ref,
            confidence=_safe_float(item.get("confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"artifact:{ref}",
            properties={
                "host_id": resolved_host_id,
                "ref": ref,
                "kind": _clean_text(item.get("kind", ""), limit=64, lower=True, allow_unknown=True),
                "tool_id": _clean_text(item.get("tool_id", ""), limit=96, lower=True, allow_unknown=True),
                "port": _clean_text(item.get("port", ""), limit=20, allow_unknown=True),
                "protocol": _clean_text(item.get("protocol", "tcp"), limit=12, lower=True, allow_unknown=True),
            },
        )
        artifact_nodes[ref] = artifact_node_id
        if changed:
            _remember_mutation(mutations, "node", artifact_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=artifact_node_id,
            confidence=_safe_float(item.get("confidence", 90.0), 90.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"artifact:{ref}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)

    for item in list(context.get("screenshots", []) or []):
        if not isinstance(item, dict):
            continue
        artifact_ref = _clean_text(item.get("artifact_ref", ""), limit=320, allow_unknown=True)
        if not artifact_ref:
            continue
        screenshot_node_id, changed = _upsert_node(
            session,
            node_key=f"screenshot:{resolved_host_id}:{artifact_ref}",
            node_type="screenshot",
            label=_clean_text(item.get("filename", ""), limit=200, allow_unknown=True)
            or artifact_ref.split("/")[-1]
            or artifact_ref,
            confidence=_safe_float(item.get("confidence", 96.0), 96.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"screenshot:{artifact_ref}",
            properties={
                "host_id": resolved_host_id,
                "artifact_ref": artifact_ref,
                "filename": _clean_text(item.get("filename", ""), limit=200, allow_unknown=True),
                "port": _clean_text(item.get("port", ""), limit=20, allow_unknown=True),
                "protocol": _clean_text(item.get("protocol", "tcp"), limit=12, lower=True, allow_unknown=True),
            },
        )
        if changed:
            _remember_mutation(mutations, "node", screenshot_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="captured",
            from_node_id=host_node_id,
            to_node_id=screenshot_node_id,
            confidence=_safe_float(item.get("confidence", 96.0), 96.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"screenshot:{artifact_ref}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        artifact_node_id = artifact_nodes.get(artifact_ref)
        if artifact_node_id:
            edge_id, changed = _upsert_edge(
                session,
                edge_type="captured",
                from_node_id=artifact_node_id,
                to_node_id=screenshot_node_id,
                confidence=96.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"screenshot:{artifact_ref}",
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
    return artifact_nodes
