"""Evidence graph storage and synchronization: sync actions."""

from __future__ import annotations


from app.scheduler.graph_support.storage import (
    _clean_text,
    _dedupe_tokens,
    _normalize_source_kind,
    _remember_mutation,
    _safe_float,
    _upsert_annotation,
    _upsert_edge,
    _upsert_node,
)


def _sync_graph_actions(artifact_nodes, context, host_ip, host_node_id, mutations, resolved_host_id, session):
    """Synchronize actions within the caller-owned graph transaction."""
    for item in list(context.get("attempted_actions", []) or []):
        if not isinstance(item, dict):
            continue
        tool_id = _clean_text(item.get("tool_id", ""), limit=96, lower=True, allow_unknown=True)
        if not tool_id:
            continue
        action_port = _clean_text(item.get("port", ""), limit=20, allow_unknown=True)
        action_protocol = _clean_text(item.get("protocol", "tcp"), limit=12, lower=True, allow_unknown=True) or "tcp"
        action_node_id, changed = _upsert_node(
            session,
            node_key=f"action:{host_ip}:{tool_id}:{action_port}:{action_protocol}",
            node_type="action",
            label=_clean_text(item.get("label", ""), limit=140, allow_unknown=True) or tool_id,
            confidence=_safe_float(item.get("confidence", 94.0), 94.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:action:{tool_id}",
            properties={
                "host_id": resolved_host_id,
                "tool_id": tool_id,
                "action_id": _clean_text(item.get("action_id", ""), limit=120, allow_unknown=True),
                "status": _clean_text(item.get("status", ""), limit=32, lower=True, allow_unknown=True),
                "attempted_at": _clean_text(item.get("attempted_at", ""), limit=64, allow_unknown=True),
                "port": action_port,
                "protocol": action_protocol,
                "service": _clean_text(item.get("service", ""), limit=64, allow_unknown=True),
                "origin_mode": _clean_text(item.get("origin_mode", ""), limit=24, lower=True, allow_unknown=True),
                "approval_state": _clean_text(item.get("approval_state", ""), limit=32, lower=True, allow_unknown=True),
                "reason": _clean_text(item.get("reason", ""), limit=320, allow_unknown=True),
                "coverage_gap": _clean_text(item.get("coverage_gap", ""), limit=96, lower=True, allow_unknown=True),
                "pack_ids": _dedupe_tokens(
                    item.get("pack_ids", []) if isinstance(item.get("pack_ids", []), list) else [],
                    limit=8,
                    token_limit=64,
                ),
            },
            evidence_refs=list(item.get("artifact_refs", []) or []),
        )
        if changed:
            _remember_mutation(mutations, "node", action_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=action_node_id,
            confidence=_safe_float(item.get("confidence", 94.0), 94.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:action:{tool_id}",
            evidence_refs=list(item.get("artifact_refs", []) or []),
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        for artifact_ref in list(item.get("artifact_refs", []) or []):
            artifact_token = _clean_text(artifact_ref, limit=320, allow_unknown=True)
            if not artifact_token:
                continue
            artifact_node_id = artifact_nodes.get(artifact_token)
            if not artifact_node_id:
                artifact_node_id, changed = _upsert_node(
                    session,
                    node_key=f"artifact:{resolved_host_id}:{artifact_token}",
                    node_type="artifact",
                    label=artifact_token.split("/")[-1] or artifact_token,
                    confidence=90.0,
                    source_kind="observed",
                    source_ref=f"artifact:{artifact_token}",
                    properties={"host_id": resolved_host_id, "ref": artifact_token, "tool_id": tool_id},
                )
                artifact_nodes[artifact_token] = artifact_node_id
                if changed:
                    _remember_mutation(mutations, "node", artifact_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="produced",
                from_node_id=action_node_id,
                to_node_id=artifact_node_id,
                confidence=96.0,
                source_kind="observed",
                source_ref=f"host:{resolved_host_id}:action:{tool_id}",
                evidence_refs=[artifact_token],
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)

    for note in list(context.get("notes", []) or []):
        if not isinstance(note, dict):
            continue
        annotation_id, changed = _upsert_annotation(
            session,
            target_kind="node",
            target_ref=host_node_id,
            body=_clean_text(note.get("text", ""), limit=4000, allow_unknown=True),
            created_by="legacy_note_import",
            source_ref=f"note:{int(note.get('id', 0) or 0)}",
        )
        if changed:
            _remember_mutation(mutations, "annotation", annotation_id)
