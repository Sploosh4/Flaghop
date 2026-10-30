"""Evidence graph storage and synchronization: sync credentials."""

from __future__ import annotations

import hashlib

from app.scheduler.graph_support.storage import (
    _clean_text,
    _normalize_source_kind,
    _remember_mutation,
    _safe_float,
    _upsert_edge,
    _upsert_node,
)


def _sync_graph_credentials(context, host_node_id, mutations, resolved_host_id, session):
    """Synchronize credentials within the caller-owned graph transaction."""
    for item in list(context.get("credentials", []) or []):
        if not isinstance(item, dict):
            continue
        username = _clean_text(item.get("username", ""), limit=160, allow_unknown=True)
        realm = _clean_text(item.get("realm", ""), limit=160, allow_unknown=True)
        if not username and not _clean_text(item.get("secret_ref", ""), limit=240, allow_unknown=True):
            continue
        cred_node_id, changed = _upsert_node(
            session,
            node_key=f"credential:{resolved_host_id}:{username.lower()}:{realm.lower()}:{_clean_text(item.get('type', ''), limit=64, lower=True, allow_unknown=True)}:{_clean_text(item.get('secret_ref', ''), limit=240, allow_unknown=True)}",
            node_type="credential",
            label=username or _clean_text(item.get("secret_ref", ""), limit=120, allow_unknown=True),
            confidence=_safe_float(item.get("confidence", 75.0), 75.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:credential:{username or realm}",
            properties={
                "host_id": resolved_host_id,
                "username": username,
                "realm": realm,
                "type": _clean_text(item.get("type", ""), limit=64, lower=True, allow_unknown=True),
                "secret_ref": _clean_text(item.get("secret_ref", ""), limit=240, allow_unknown=True),
            },
            evidence_refs=[_clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)],
        )
        if changed:
            _remember_mutation(mutations, "node", cred_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=cred_node_id,
            confidence=_safe_float(item.get("confidence", 75.0), 75.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:credential:{username or realm}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        identity_node_id, changed = _upsert_node(
            session,
            node_key=f"identity:{username.lower()}:{realm.lower()}",
            node_type="identity",
            label="\\".join(part for part in [realm, username] if part) or username or realm,
            confidence=_safe_float(item.get("confidence", 75.0), 75.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"identity:{username or realm}",
            properties={"username": username, "realm": realm},
        )
        if changed:
            _remember_mutation(mutations, "node", identity_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="authenticated_as",
            from_node_id=cred_node_id,
            to_node_id=identity_node_id,
            confidence=_safe_float(item.get("confidence", 75.0), 75.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"identity:{username or realm}",
            evidence_refs=[_clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)],
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        evidence_text = _clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)
        if evidence_text:
            evidence_node_id, changed = _upsert_node(
                session,
                node_key=f"evidence:credential:{resolved_host_id}:{hashlib.sha1(evidence_text.encode('utf-8')).hexdigest()[:12]}",
                node_type="evidence_record",
                label=evidence_text[:120],
                confidence=100.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:credential:evidence",
                properties={"host_id": resolved_host_id, "evidence": evidence_text, "entity_type": "credential"},
            )
            if changed:
                _remember_mutation(mutations, "node", evidence_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="derived_from",
                from_node_id=cred_node_id,
                to_node_id=evidence_node_id,
                confidence=100.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:credential:evidence",
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)

    for item in list(context.get("sessions", []) or []):
        if not isinstance(item, dict):
            continue
        username = _clean_text(item.get("username", ""), limit=160, allow_unknown=True)
        pivot_host = _clean_text(item.get("host", ""), limit=160, allow_unknown=True)
        session_port = _clean_text(item.get("port", ""), limit=20, allow_unknown=True)
        session_protocol = _clean_text(item.get("protocol", ""), limit=12, lower=True, allow_unknown=True)
        session_type = _clean_text(item.get("session_type", ""), limit=64, lower=True, allow_unknown=True)
        if not any([username, pivot_host, session_type]):
            continue
        session_node_id, changed = _upsert_node(
            session,
            node_key=f"session:{resolved_host_id}:{session_type}:{username.lower()}:{pivot_host.lower()}:{session_port}/{session_protocol}",
            node_type="session",
            label=session_type or username or pivot_host,
            confidence=_safe_float(item.get("confidence", 78.0), 78.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:session:{session_type}:{username}",
            properties={
                "host_id": resolved_host_id,
                "session_type": session_type,
                "username": username,
                "host": pivot_host,
                "port": session_port,
                "protocol": session_protocol,
                "obtained_at": _clean_text(item.get("obtained_at", ""), limit=64, allow_unknown=True),
            },
            evidence_refs=[_clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)],
        )
        if changed:
            _remember_mutation(mutations, "node", session_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=session_node_id,
            confidence=_safe_float(item.get("confidence", 78.0), 78.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:session:{session_type}:{username}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        identity_node_id, changed = _upsert_node(
            session,
            node_key=f"identity:{username.lower()}",
            node_type="identity",
            label=username or session_type,
            confidence=_safe_float(item.get("confidence", 78.0), 78.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"identity:{username}",
            properties={"username": username},
        )
        if changed:
            _remember_mutation(mutations, "node", identity_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="authenticated_as",
            from_node_id=session_node_id,
            to_node_id=identity_node_id,
            confidence=_safe_float(item.get("confidence", 78.0), 78.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"identity:{username}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        if pivot_host:
            pivot_node_id, changed = _upsert_node(
                session,
                node_key=f"host:pivot:{pivot_host.lower()}",
                node_type="host",
                label=pivot_host,
                confidence=_safe_float(item.get("confidence", 68.0), 68.0),
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"pivot:{pivot_host}",
                properties={"ip": pivot_host},
            )
            if changed:
                _remember_mutation(mutations, "node", pivot_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="pivoted_to",
                from_node_id=session_node_id,
                to_node_id=pivot_node_id,
                confidence=_safe_float(item.get("confidence", 78.0), 78.0),
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"pivot:{pivot_host}",
                evidence_refs=[_clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)],
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
