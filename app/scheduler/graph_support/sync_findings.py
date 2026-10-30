"""Evidence graph storage and synchronization: sync findings."""

from __future__ import annotations

import hashlib

from app.scheduler.graph_support.storage import (
    _clean_text,
    _dedupe_tokens,
    _normalize_source_kind,
    _remember_mutation,
    _safe_float,
    _upsert_edge,
    _upsert_node,
)


def _sync_graph_findings(context, host_node_id, mutations, resolved_host_id, session):
    """Synchronize findings within the caller-owned graph transaction."""
    for item in list(context.get("findings", []) or []):
        if not isinstance(item, dict):
            continue
        title = _clean_text(item.get("title", ""), limit=220, allow_unknown=True)
        cve_id = _clean_text(item.get("cve", ""), limit=64, allow_unknown=True).upper()
        if not title and not cve_id:
            continue
        evidence_text = _clean_text(item.get("evidence", ""), limit=320, allow_unknown=True)
        evidence_items = _dedupe_tokens(
            item.get("evidence_items", []) if isinstance(item.get("evidence_items", []), list) else [],
            limit=16,
            token_limit=160,
        )
        finding_evidence_refs = []
        if evidence_text:
            finding_evidence_refs.append(evidence_text)
        finding_evidence_refs.extend(evidence_items)
        finding_node_id, changed = _upsert_node(
            session,
            node_key=f"finding:{resolved_host_id}:{title.lower()}:{cve_id.lower()}",
            node_type="finding",
            label=title or cve_id,
            confidence=_safe_float(item.get("confidence", 80.0), 80.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:finding:{title or cve_id}",
            properties={
                "host_id": resolved_host_id,
                "title": title,
                "severity": _clean_text(item.get("severity", "info"), limit=16, lower=True, allow_unknown=True),
                "cvss": _safe_float(item.get("cvss", 0.0)),
                "cve": cve_id,
                "evidence_items": evidence_items,
            },
            evidence_refs=finding_evidence_refs,
        )
        if changed:
            _remember_mutation(mutations, "node", finding_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=finding_node_id,
            confidence=_safe_float(item.get("confidence", 80.0), 80.0),
            source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
            source_ref=f"host:{resolved_host_id}:finding:{title or cve_id}",
            evidence_refs=finding_evidence_refs,
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        if cve_id:
            cve_node_id, changed = _upsert_node(
                session,
                node_key=f"cve:{cve_id.lower()}",
                node_type="cve",
                label=cve_id,
                confidence=95.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"cve:{cve_id}",
                properties={"cve": cve_id},
            )
            if changed:
                _remember_mutation(mutations, "node", cve_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="affected_by",
                from_node_id=finding_node_id,
                to_node_id=cve_node_id,
                confidence=95.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"cve:{cve_id}",
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
        if evidence_text:
            evidence_node_id, changed = _upsert_node(
                session,
                node_key=f"evidence:finding:{resolved_host_id}:{hashlib.sha1(evidence_text.encode('utf-8')).hexdigest()[:12]}",
                node_type="evidence_record",
                label=evidence_text[:120],
                confidence=100.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:finding:evidence",
                properties={
                    "host_id": resolved_host_id,
                    "evidence": evidence_text,
                    "entity_type": "finding",
                    "evidence_items": evidence_items,
                },
                evidence_refs=finding_evidence_refs,
            )
            if changed:
                _remember_mutation(mutations, "node", evidence_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="derived_from",
                from_node_id=finding_node_id,
                to_node_id=evidence_node_id,
                confidence=100.0,
                source_kind=_normalize_source_kind(item.get("source_kind", "observed"), "observed"),
                source_ref=f"host:{resolved_host_id}:finding:evidence",
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)

    for row in list(context.get("cves", []) or []):
        if not isinstance(row, dict):
            continue
        cve_name = _clean_text(row.get("name", ""), limit=120, allow_unknown=True).upper()
        if not cve_name:
            continue
        finding_node_id, changed = _upsert_node(
            session,
            node_key=f"finding:{resolved_host_id}:{cve_name.lower()}",
            node_type="finding",
            label=cve_name,
            confidence=96.0,
            source_kind="observed",
            source_ref=f"cve_row:{int(row.get('id', 0) or 0)}",
            properties={
                "host_id": resolved_host_id,
                "title": cve_name,
                "severity": _clean_text(row.get("severity", "info"), limit=16, lower=True, allow_unknown=True),
                "product": _clean_text(row.get("product", ""), limit=120, allow_unknown=True),
                "version": _clean_text(row.get("version", ""), limit=80, allow_unknown=True),
                "source": _clean_text(row.get("source", ""), limit=80, allow_unknown=True),
                "cve": cve_name if cve_name.startswith("CVE-") else "",
            },
            evidence_refs=[_clean_text(row.get("url", ""), limit=320, allow_unknown=True)],
        )
        if changed:
            _remember_mutation(mutations, "node", finding_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=finding_node_id,
            confidence=96.0,
            source_kind="observed",
            source_ref=f"cve_row:{int(row.get('id', 0) or 0)}",
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        if cve_name.startswith("CVE-"):
            cve_node_id, changed = _upsert_node(
                session,
                node_key=f"cve:{cve_name.lower()}",
                node_type="cve",
                label=cve_name,
                confidence=98.0,
                source_kind="observed",
                source_ref=f"cve:{cve_name}",
                properties={"cve": cve_name, "url": _clean_text(row.get("url", ""), limit=320, allow_unknown=True)},
            )
            if changed:
                _remember_mutation(mutations, "node", cve_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="affected_by",
                from_node_id=finding_node_id,
                to_node_id=cve_node_id,
                confidence=98.0,
                source_kind="observed",
                source_ref=f"cve_row:{int(row.get('id', 0) or 0)}",
                evidence_refs=[_clean_text(row.get("url", ""), limit=320, allow_unknown=True)],
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
            exploit_ref = _clean_text(row.get("exploit_url", ""), limit=320, allow_unknown=True) or _clean_text(
                row.get("exploit", ""), limit=220, allow_unknown=True
            )
            if exploit_ref:
                exploit_node_id, changed = _upsert_node(
                    session,
                    node_key=f"exploit:{hashlib.sha1(exploit_ref.encode('utf-8')).hexdigest()[:16]}",
                    node_type="exploit_reference",
                    label=exploit_ref[:160],
                    confidence=84.0,
                    source_kind="observed",
                    source_ref=f"cve_row:{int(row.get('id', 0) or 0)}",
                    properties={
                        "exploit_id": int(row.get("exploit_id", 0) or 0),
                        "exploit": _clean_text(row.get("exploit", ""), limit=220, allow_unknown=True),
                        "exploit_url": _clean_text(row.get("exploit_url", ""), limit=320, allow_unknown=True),
                    },
                )
                if changed:
                    _remember_mutation(mutations, "node", exploit_node_id)
                edge_id, changed = _upsert_edge(
                    session,
                    edge_type="supports_exploit",
                    from_node_id=cve_node_id,
                    to_node_id=exploit_node_id,
                    confidence=84.0,
                    source_kind="observed",
                    source_ref=f"cve_row:{int(row.get('id', 0) or 0)}",
                    evidence_refs=[exploit_ref],
                )
                if changed:
                    _remember_mutation(mutations, "edge", edge_id)
