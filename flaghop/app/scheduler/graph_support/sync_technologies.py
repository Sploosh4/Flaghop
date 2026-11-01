"""Evidence graph storage and synchronization: sync technologies."""

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


def _sync_graph_technologies(context, host_node_id, mutations, resolved_host_id, session):
    """Synchronize technologies within the caller-owned graph transaction."""
    for item in list(context.get("technologies", []) or []):
        if not isinstance(item, dict):
            continue
        name = _clean_text(item.get("name", ""), limit=120)
        cpe = _clean_text(item.get("cpe", ""), limit=180, allow_unknown=True)
        if not name and not cpe:
            continue
        tech_node_id, changed = _upsert_node(
            session,
            node_key=f"technology:{resolved_host_id}:{name.lower()}:{_clean_text(item.get('version', ''), limit=80, allow_unknown=True)}:{cpe.lower()}",
            node_type="technology",
            label=" ".join(
                part for part in [name, _clean_text(item.get("version", ""), limit=80, allow_unknown=True)] if part
            )
            or cpe,
            confidence=_safe_float(item.get("confidence", 72.0), 72.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:technology:{name or cpe}",
            properties={
                "host_id": resolved_host_id,
                "name": name,
                "version": _clean_text(item.get("version", ""), limit=80, allow_unknown=True),
                "cpe": cpe,
            },
            evidence_refs=[_clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)],
        )
        if changed:
            _remember_mutation(mutations, "node", tech_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="fingerprinted_as",
            from_node_id=host_node_id,
            to_node_id=tech_node_id,
            confidence=_safe_float(item.get("confidence", 72.0), 72.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:technology:{name or cpe}",
            evidence_refs=[_clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)],
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        evidence_text = _clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)
        if evidence_text:
            evidence_node_id, changed = _upsert_node(
                session,
                node_key=f"evidence:technology:{resolved_host_id}:{name.lower()}:{hashlib.sha1(evidence_text.encode('utf-8')).hexdigest()[:12]}",
                node_type="evidence_record",
                label=evidence_text[:120],
                confidence=100.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:technology:evidence",
                properties={"host_id": resolved_host_id, "evidence": evidence_text, "entity_type": "technology"},
            )
            if changed:
                _remember_mutation(mutations, "node", evidence_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="derived_from",
                from_node_id=tech_node_id,
                to_node_id=evidence_node_id,
                confidence=100.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:technology:evidence",
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
        if cpe:
            cpe_node_id, changed = _upsert_node(
                session,
                node_key=f"cpe:{cpe.lower()}",
                node_type="cpe",
                label=cpe,
                confidence=_safe_float(item.get("confidence", 82.0), 82.0),
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:cpe:{cpe}",
                properties={"cpe": cpe},
            )
            if changed:
                _remember_mutation(mutations, "node", cpe_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="mapped_to_cpe",
                from_node_id=tech_node_id,
                to_node_id=cpe_node_id,
                confidence=_safe_float(item.get("confidence", 82.0), 82.0),
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:cpe:{cpe}",
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
