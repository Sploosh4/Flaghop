"""Evidence graph storage and synchronization: queries."""

from __future__ import annotations

import json
from typing import Any, Dict, Iterable, List, Optional
from sqlalchemy import text

from app.scheduler.graph_support.annotations import (
    list_graph_annotations,
    list_graph_layout_states,
)
from app.scheduler.graph_support.storage import (
    _clean_text,
    _ensure_tables,
    _from_json,
    _normalize_source_kind,
    _safe_float,
)


def _graph_artifact_filename(item: Dict[str, Any]) -> str:
    if not isinstance(item, dict):
        return ""
    props = item.get("properties", {}) if isinstance(item.get("properties", {}), dict) else {}
    tokens = [
        props.get("filename", ""),
        props.get("ref", ""),
        props.get("artifact_ref", ""),
        item.get("label", ""),
    ]
    for token in tokens:
        text = str(token or "").strip().replace("\\", "/")
        if not text:
            continue
        return text.rsplit("/", 1)[-1]
    return ""


def _graph_should_hide_artifact_node(item: Dict[str, Any], *, hide_nmap_xml_artifacts: bool = False) -> bool:
    if str(item.get("type", "") or "").strip().lower() != "artifact":
        return False
    props = item.get("properties", {}) if isinstance(item.get("properties", {}), dict) else {}
    filename = _graph_artifact_filename(item).lower()
    ref = str(props.get("ref", "") or props.get("artifact_ref", "") or "").strip().lower()
    label = str(item.get("label", "") or "").strip().lower()
    tool_id = str(props.get("tool_id", "") or "").strip().lower()
    source_ref = str(item.get("source_ref", "") or "").strip().lower()

    if filename.endswith(".gnmap") or filename.endswith(".nmap"):
        return True

    if not hide_nmap_xml_artifacts or not filename.endswith(".xml"):
        return False

    signals = [filename, ref, label, tool_id, source_ref]
    return any("nmap" in token for token in signals if token)


def _normalize_filter_list(values: Any, *, limit: int = 32, lower: bool = True) -> List[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [item.strip() for item in values.split(",")]
    rows: List[str] = []
    seen = set()
    for value in list(values or []):
        token = _clean_text(value, limit=96, lower=lower, allow_unknown=True)
        if not token or token in seen:
            continue
        seen.add(token)
        rows.append(token)
        if len(rows) >= int(limit):
            break
    return rows


def _node_matches_search(node: Dict[str, Any], search_token: str) -> bool:
    token = str(search_token or "").strip().lower()
    if not token:
        return True
    props = node.get("properties", {}) if isinstance(node.get("properties", {}), dict) else {}
    haystack = " ".join(
        [
            str(node.get("type", "") or ""),
            str(node.get("label", "") or ""),
            str(node.get("source_ref", "") or ""),
            json.dumps(props, sort_keys=True, default=str),
        ]
    ).lower()
    return token in haystack


def _edge_matches_search(edge: Dict[str, Any], search_token: str) -> bool:
    token = str(search_token or "").strip().lower()
    if not token:
        return True
    props = edge.get("properties", {}) if isinstance(edge.get("properties", {}), dict) else {}
    haystack = " ".join(
        [
            str(edge.get("type", "") or ""),
            str(edge.get("source_ref", "") or ""),
            json.dumps(props, sort_keys=True, default=str),
        ]
    ).lower()
    return token in haystack


def query_evidence_graph(
    database,
    *,
    node_types: Any = None,
    edge_types: Any = None,
    source_kinds: Any = None,
    min_confidence: float = 0.0,
    search: str = "",
    include_ai_suggested: bool = True,
    hide_nmap_xml_artifacts: bool = False,
    hide_down_hosts: bool = False,
    host_id: Optional[int] = None,
    host_ids: Optional[Iterable[int]] = None,
    limit_nodes: int = 600,
    limit_edges: int = 1200,
) -> Dict[str, Any]:
    snapshot = get_evidence_graph_snapshot(database)
    requested_node_types = set(_normalize_filter_list(node_types, limit=24, lower=True))
    requested_edge_types = set(_normalize_filter_list(edge_types, limit=24, lower=True))
    requested_source_kinds = set(_normalize_filter_list(source_kinds, limit=12, lower=True))
    resolved_host_id = int(host_id or 0)
    host_scope_requested = host_ids is not None or resolved_host_id > 0
    resolved_host_ids = set()
    if host_ids is not None:
        for item in list(host_ids or []):
            try:
                normalized_host_id = int(item or 0)
            except (TypeError, ValueError):
                normalized_host_id = 0
            if normalized_host_id > 0:
                resolved_host_ids.add(normalized_host_id)
    if resolved_host_id > 0:
        if host_ids is not None:
            resolved_host_ids = resolved_host_ids.intersection({resolved_host_id})
        else:
            resolved_host_ids = {resolved_host_id}
    resolved_search = str(search or "").strip().lower()
    min_conf = _safe_float(min_confidence, default=0.0, minimum=0.0, maximum=100.0)
    max_nodes = max(1, min(int(limit_nodes or 600), 10000))
    max_edges = max(1, min(int(limit_edges or 1200), 30000))
    down_host_ids = _list_down_host_ids(database) if hide_down_hosts else set()

    nodes = []
    for item in list(snapshot.get("nodes", []) or []):
        if not isinstance(item, dict):
            continue
        source_kind = _normalize_source_kind(item.get("source_kind", "observed"), "observed")
        if not include_ai_suggested and source_kind == "ai_suggested":
            continue
        if requested_node_types and str(item.get("type", "") or "").strip().lower() not in requested_node_types:
            continue
        if requested_source_kinds and source_kind not in requested_source_kinds:
            continue
        if float(item.get("confidence", 0.0) or 0.0) < min_conf:
            continue
        item_host_id = (
            int((item.get("properties", {}) or {}).get("host_id", 0) or 0)
            if isinstance(item.get("properties", {}), dict)
            else 0
        )
        if down_host_ids and item_host_id in down_host_ids:
            continue
        if _graph_should_hide_artifact_node(item, hide_nmap_xml_artifacts=bool(hide_nmap_xml_artifacts)):
            continue
        if not _node_matches_search(item, resolved_search):
            continue
        nodes.append(dict(item))

    if host_scope_requested:
        base_node_ids = {
            str(item.get("node_id", "") or "")
            for item in nodes
            if isinstance(item.get("properties", {}), dict)
            and int(item.get("properties", {}).get("host_id", 0) or 0) in resolved_host_ids
        }
        expanded_ids = set(base_node_ids)
        for edge in list(snapshot.get("edges", []) or []):
            if not isinstance(edge, dict):
                continue
            from_node_id = str(edge.get("from_node_id", "") or "")
            to_node_id = str(edge.get("to_node_id", "") or "")
            if from_node_id in base_node_ids or to_node_id in base_node_ids:
                expanded_ids.add(from_node_id)
                expanded_ids.add(to_node_id)
        nodes = [item for item in nodes if str(item.get("node_id", "") or "") in expanded_ids]

    node_ids = {str(item.get("node_id", "") or "") for item in nodes}
    edges = []
    for item in list(snapshot.get("edges", []) or []):
        if not isinstance(item, dict):
            continue
        source_kind = _normalize_source_kind(item.get("source_kind", "observed"), "observed")
        if not include_ai_suggested and source_kind == "ai_suggested":
            continue
        if requested_edge_types and str(item.get("type", "") or "").strip().lower() not in requested_edge_types:
            continue
        if requested_source_kinds and source_kind not in requested_source_kinds:
            continue
        if float(item.get("confidence", 0.0) or 0.0) < min_conf:
            continue
        if not _edge_matches_search(item, resolved_search):
            continue
        if (
            str(item.get("from_node_id", "") or "") not in node_ids
            or str(item.get("to_node_id", "") or "") not in node_ids
        ):
            continue
        edges.append(dict(item))

    nodes = nodes[:max_nodes]
    node_ids = {str(item.get("node_id", "") or "") for item in nodes}
    edges = [
        item
        for item in edges
        if str(item.get("from_node_id", "") or "") in node_ids and str(item.get("to_node_id", "") or "") in node_ids
    ][:max_edges]

    return {
        "nodes": nodes,
        "edges": edges,
        "meta": {
            "total_nodes": len(snapshot.get("nodes", []) or []),
            "total_edges": len(snapshot.get("edges", []) or []),
            "returned_nodes": len(nodes),
            "returned_edges": len(edges),
            "filters": {
                "node_types": sorted(requested_node_types),
                "edge_types": sorted(requested_edge_types),
                "source_kinds": sorted(requested_source_kinds),
                "min_confidence": min_conf,
                "search": resolved_search,
                "include_ai_suggested": bool(include_ai_suggested),
                "hide_nmap_xml_artifacts": bool(hide_nmap_xml_artifacts),
                "hide_down_hosts": bool(hide_down_hosts),
                "host_id": int(resolved_host_id or 0) or None,
                "host_ids": sorted(resolved_host_ids) if host_ids is not None else None,
                "limit_nodes": max_nodes,
                "limit_edges": max_edges,
            },
        },
    }


def _list_down_host_ids(database) -> set:
    session = database.session()
    try:
        rows = session.execute(
            text("SELECT id FROM hostObj WHERE LOWER(TRIM(COALESCE(status, ''))) = 'down'")
        ).fetchall()
        host_ids = set()
        for row in rows:
            try:
                host_id = int(row[0] or 0)
            except (TypeError, ValueError, IndexError):
                host_id = 0
            if host_id > 0:
                host_ids.add(host_id)
        return host_ids
    finally:
        session.close()


def _list_evidence_refs(session) -> Dict[str, List[str]]:
    result = session.execute(text("SELECT owner_kind, owner_id, evidence_ref FROM graph_evidence_ref ORDER BY id ASC"))
    grouped: Dict[str, List[str]] = {}
    for row in result.fetchall():
        key = f"{_clean_text(row[0], limit=16, lower=True, allow_unknown=True)}:{_clean_text(row[1], limit=80, allow_unknown=True)}"
        grouped.setdefault(key, []).append(_clean_text(row[2], limit=320, allow_unknown=True))
    return grouped


def get_evidence_graph_snapshot(database) -> Dict[str, Any]:
    session = database.session()
    try:
        _ensure_tables(session)
        evidence_map = _list_evidence_refs(session)
        node_result = session.execute(
            text(
                "SELECT node_id, node_key, type, label, confidence, source_kind, source_ref, first_seen, last_seen, properties_json "
                "FROM graph_node ORDER BY id ASC"
            )
        )
        nodes = []
        for row in node_result.fetchall():
            node_id = _clean_text(row[0], limit=80, allow_unknown=True)
            nodes.append(
                {
                    "node_id": node_id,
                    "node_key": _clean_text(row[1], limit=320, allow_unknown=True),
                    "type": _clean_text(row[2], limit=80, lower=True, allow_unknown=True),
                    "label": _clean_text(row[3], limit=240, allow_unknown=True),
                    "confidence": _safe_float(row[4]),
                    "source_kind": _normalize_source_kind(row[5], "observed"),
                    "source_ref": _clean_text(row[6], limit=320, allow_unknown=True),
                    "first_seen": _clean_text(row[7], limit=64, allow_unknown=True),
                    "last_seen": _clean_text(row[8], limit=64, allow_unknown=True),
                    "properties": _from_json(row[9], {}),
                    "evidence_refs": evidence_map.get(f"node:{node_id}", []),
                }
            )
        edge_result = session.execute(
            text(
                "SELECT edge_id, edge_key, type, from_node_id, to_node_id, confidence, source_kind, source_ref, first_seen, last_seen, properties_json "
                "FROM graph_edge ORDER BY id ASC"
            )
        )
        edges = []
        for row in edge_result.fetchall():
            edge_id = _clean_text(row[0], limit=80, allow_unknown=True)
            edges.append(
                {
                    "edge_id": edge_id,
                    "edge_key": _clean_text(row[1], limit=320, allow_unknown=True),
                    "type": _clean_text(row[2], limit=80, lower=True, allow_unknown=True),
                    "from_node_id": _clean_text(row[3], limit=80, allow_unknown=True),
                    "to_node_id": _clean_text(row[4], limit=80, allow_unknown=True),
                    "confidence": _safe_float(row[5]),
                    "source_kind": _normalize_source_kind(row[6], "observed"),
                    "source_ref": _clean_text(row[7], limit=320, allow_unknown=True),
                    "first_seen": _clean_text(row[8], limit=64, allow_unknown=True),
                    "last_seen": _clean_text(row[9], limit=64, allow_unknown=True),
                    "properties": _from_json(row[10], {}),
                    "evidence_refs": evidence_map.get(f"edge:{edge_id}", []),
                }
            )
        layouts = list_graph_layout_states(database)
        annotations = list_graph_annotations(database)
        return {
            "nodes": nodes,
            "edges": edges,
            "layouts": layouts,
            "annotations": annotations,
        }
    finally:
        session.close()
