"""Evidence graph storage and synchronization: storage."""

from __future__ import annotations

import datetime
import hashlib
import ipaddress
import json
from typing import Any, Dict, Iterable, List, Optional, Tuple
from sqlalchemy import text

GRAPH_SOURCE_KINDS = {"observed", "inferred", "ai_suggested", "user_entered"}

_SOURCE_PRIORITY = {
    "ai_suggested": 1,
    "inferred": 2,
    "user_entered": 3,
    "observed": 4,
}

_UNKNOWN_TOKENS = {"", "unknown", "n/a", "na", "none", "null", "nil"}


def _utc_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _ensure_column(session, table_name: str, column_name: str, column_type: str):
    rows = session.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    existing = {str(row[1]) for row in rows if len(row) > 1}
    if str(column_name) in existing:
        return
    session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))


def _stable_id(prefix: str, payload: Dict[str, Any]) -> str:
    rendered = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    digest = hashlib.sha256(rendered.encode("utf-8")).hexdigest()
    return f"{str(prefix or '').strip().lower()}-{digest[:16]}"


def _ensure_tables(session):
    session.execute(
        text(
            "CREATE TABLE IF NOT EXISTS graph_node ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "node_id TEXT UNIQUE,"
            "node_key TEXT UNIQUE,"
            "type TEXT,"
            "label TEXT,"
            "confidence REAL,"
            "source_kind TEXT,"
            "source_ref TEXT,"
            "first_seen TEXT,"
            "last_seen TEXT,"
            "properties_json TEXT"
            ")"
        )
    )
    session.execute(
        text(
            "CREATE TABLE IF NOT EXISTS graph_edge ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "edge_id TEXT UNIQUE,"
            "edge_key TEXT UNIQUE,"
            "type TEXT,"
            "from_node_id TEXT,"
            "to_node_id TEXT,"
            "confidence REAL,"
            "source_kind TEXT,"
            "source_ref TEXT,"
            "first_seen TEXT,"
            "last_seen TEXT,"
            "properties_json TEXT"
            ")"
        )
    )
    session.execute(
        text(
            "CREATE TABLE IF NOT EXISTS graph_evidence_ref ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "owner_kind TEXT,"
            "owner_id TEXT,"
            "evidence_ref TEXT,"
            "created_at TEXT"
            ")"
        )
    )
    session.execute(
        text(
            "CREATE TABLE IF NOT EXISTS graph_layout_state ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "layout_id TEXT UNIQUE,"
            "view_id TEXT,"
            "name TEXT,"
            "layout_json TEXT,"
            "updated_at TEXT"
            ")"
        )
    )
    session.execute(
        text(
            "CREATE TABLE IF NOT EXISTS graph_annotation ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "annotation_id TEXT UNIQUE,"
            "target_kind TEXT,"
            "target_ref TEXT,"
            "body TEXT,"
            "created_by TEXT,"
            "created_at TEXT,"
            "updated_at TEXT,"
            "source_ref TEXT"
            ")"
        )
    )
    for column_name, column_type in (
        ("node_id", "TEXT"),
        ("node_key", "TEXT"),
        ("type", "TEXT"),
        ("label", "TEXT"),
        ("confidence", "REAL"),
        ("source_kind", "TEXT"),
        ("source_ref", "TEXT"),
        ("first_seen", "TEXT"),
        ("last_seen", "TEXT"),
        ("properties_json", "TEXT"),
    ):
        _ensure_column(session, "graph_node", column_name, column_type)
    for column_name, column_type in (
        ("edge_id", "TEXT"),
        ("edge_key", "TEXT"),
        ("type", "TEXT"),
        ("from_node_id", "TEXT"),
        ("to_node_id", "TEXT"),
        ("confidence", "REAL"),
        ("source_kind", "TEXT"),
        ("source_ref", "TEXT"),
        ("first_seen", "TEXT"),
        ("last_seen", "TEXT"),
        ("properties_json", "TEXT"),
    ):
        _ensure_column(session, "graph_edge", column_name, column_type)
    for column_name, column_type in (
        ("owner_kind", "TEXT"),
        ("owner_id", "TEXT"),
        ("evidence_ref", "TEXT"),
        ("created_at", "TEXT"),
    ):
        _ensure_column(session, "graph_evidence_ref", column_name, column_type)
    for column_name, column_type in (
        ("layout_id", "TEXT"),
        ("view_id", "TEXT"),
        ("name", "TEXT"),
        ("layout_json", "TEXT"),
        ("updated_at", "TEXT"),
    ):
        _ensure_column(session, "graph_layout_state", column_name, column_type)
    for column_name, column_type in (
        ("annotation_id", "TEXT"),
        ("target_kind", "TEXT"),
        ("target_ref", "TEXT"),
        ("body", "TEXT"),
        ("created_by", "TEXT"),
        ("created_at", "TEXT"),
        ("updated_at", "TEXT"),
        ("source_ref", "TEXT"),
    ):
        _ensure_column(session, "graph_annotation", column_name, column_type)


def _from_json(value: Any, fallback: Any):
    raw = str(value or "").strip()
    if not raw:
        return fallback
    try:
        return json.loads(raw)
    except Exception:
        return fallback


def _to_json(value: Any, fallback: Any) -> str:
    try:
        return json.dumps(value if value is not None else fallback, ensure_ascii=False)
    except Exception:
        return json.dumps(fallback, ensure_ascii=False)


def _sql_in_clause(prefix: str, values: Iterable[str]) -> Tuple[str, Dict[str, Any]]:
    params: Dict[str, Any] = {}
    placeholders: List[str] = []
    for index, value in enumerate(list(values or [])):
        key = f"{prefix}_{index}"
        placeholders.append(f":{key}")
        params[key] = str(value or "")
    if not placeholders:
        return "", {}
    return ", ".join(placeholders), params


def _delete_url_nodes(session, node_ids: List[str]):
    resolved_node_ids = [str(item or "").strip() for item in list(node_ids or []) if str(item or "").strip()]
    if not resolved_node_ids:
        return

    node_placeholders, node_params = _sql_in_clause("node_id", resolved_node_ids)
    if not node_placeholders:
        return

    edge_rows = session.execute(
        text(
            f"SELECT edge_id FROM graph_edge "
            f"WHERE from_node_id IN ({node_placeholders}) OR to_node_id IN ({node_placeholders})"
        ),
        dict(node_params),
    ).fetchall()
    edge_ids = [str(row[0] or "").strip() for row in edge_rows if row and str(row[0] or "").strip()]

    if edge_ids:
        edge_placeholders, edge_params = _sql_in_clause("edge_id", edge_ids)
        session.execute(
            text(f"DELETE FROM graph_evidence_ref WHERE owner_kind = 'edge' AND owner_id IN ({edge_placeholders})"),
            edge_params,
        )
        session.execute(
            text(f"DELETE FROM graph_annotation WHERE target_kind = 'edge' AND target_ref IN ({edge_placeholders})"),
            edge_params,
        )
        session.execute(text(f"DELETE FROM graph_edge WHERE edge_id IN ({edge_placeholders})"), edge_params)

    session.execute(
        text(f"DELETE FROM graph_evidence_ref WHERE owner_kind = 'node' AND owner_id IN ({node_placeholders})"),
        node_params,
    )
    session.execute(
        text(f"DELETE FROM graph_annotation WHERE target_kind = 'node' AND target_ref IN ({node_placeholders})"),
        node_params,
    )
    session.execute(text(f"DELETE FROM graph_node WHERE node_id IN ({node_placeholders})"), node_params)


def _delete_stale_host_url_nodes(session, *, host_id: int, keep_node_keys: Iterable[str]):
    resolved_host_id = int(host_id or 0)
    keep = {str(item or "").strip() for item in list(keep_node_keys or []) if str(item or "").strip()}
    rows = session.execute(
        text("SELECT node_id, node_key FROM graph_node " "WHERE type = 'url' AND node_key LIKE :prefix"),
        {"prefix": f"url:{resolved_host_id}:%"},
    ).fetchall()
    stale_node_ids = [
        str(row[0] or "").strip()
        for row in rows
        if row and str(row[0] or "").strip() and str(row[1] or "").strip() not in keep
    ]
    _delete_url_nodes(session, stale_node_ids)


def _safe_float(value: Any, default: float = 0.0, minimum: float = 0.0, maximum: float = 100.0) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = float(default)
    if parsed < minimum:
        return float(minimum)
    if parsed > maximum:
        return float(maximum)
    return float(parsed)


def _clean_text(value: Any, *, limit: int = 240, lower: bool = False, allow_unknown: bool = False) -> str:
    text_value = str(value or "").strip()
    if lower:
        text_value = text_value.lower()
    if not allow_unknown and text_value.lower() in _UNKNOWN_TOKENS:
        return ""
    return text_value[:limit]


def _normalize_source_kind(value: Any, default: str = "observed") -> str:
    token = _clean_text(value or default, limit=32, lower=True, allow_unknown=True) or str(default or "observed")
    return token if token in GRAPH_SOURCE_KINDS else str(default or "observed")


def _choose_source_kind(existing: Any, incoming: Any) -> str:
    existing_token = _normalize_source_kind(existing, "observed")
    incoming_token = _normalize_source_kind(incoming, "observed")
    if _SOURCE_PRIORITY.get(incoming_token, 0) >= _SOURCE_PRIORITY.get(existing_token, 0):
        return incoming_token
    return existing_token


def _merge_values(existing: Any, incoming: Any):
    if isinstance(existing, dict) and isinstance(incoming, dict):
        merged = dict(existing)
        for key, value in incoming.items():
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key] = _merge_values(merged.get(key), value)
            elif isinstance(value, list) and isinstance(merged.get(key), list):
                combined = []
                seen = set()
                for item in list(value) + list(merged.get(key) or []):
                    marker = json.dumps(item, sort_keys=True, default=str, separators=(",", ":"))
                    if marker in seen:
                        continue
                    seen.add(marker)
                    combined.append(item)
                merged[key] = combined[:240]
            elif value not in [None, "", [], {}]:
                merged[key] = value
        return merged
    return incoming if incoming not in [None, "", [], {}] else existing


def _dedupe_tokens(values: Iterable[Any], *, limit: int = 64, token_limit: int = 320) -> List[str]:
    rows: List[str] = []
    seen = set()
    for value in values:
        token = _clean_text(value, limit=token_limit, allow_unknown=True)
        if not token or token in seen:
            continue
        seen.add(token)
        rows.append(token)
        if len(rows) >= int(limit):
            break
    return rows


def _remember_mutation(mutations: List[str], kind: str, ref: str):
    token = f"{str(kind or '').strip().lower()}:{str(ref or '').strip()}"
    if token and token not in mutations:
        mutations.append(token)


def _upsert_node(
    session,
    *,
    node_key: str,
    node_type: str,
    label: str,
    confidence: float,
    source_kind: str,
    source_ref: str,
    properties: Optional[Dict[str, Any]] = None,
    evidence_refs: Optional[List[str]] = None,
) -> Tuple[str, bool]:
    now = _utc_now()
    key = _clean_text(node_key, limit=320, allow_unknown=True)
    if not key:
        return "", False
    node_id = _stable_id("graph-node", {"node_key": key})
    result = session.execute(
        text(
            "SELECT node_id, label, confidence, source_kind, source_ref, first_seen, properties_json "
            "FROM graph_node WHERE node_key = :node_key LIMIT 1"
        ),
        {"node_key": key},
    ).fetchone()
    changed = False
    incoming_props = dict(properties or {})
    if result is None:
        session.execute(
            text(
                "INSERT INTO graph_node ("
                "node_id, node_key, type, label, confidence, source_kind, source_ref, first_seen, last_seen, properties_json"
                ") VALUES ("
                ":node_id, :node_key, :type, :label, :confidence, :source_kind, :source_ref, :first_seen, :last_seen, :properties_json"
                ")"
            ),
            {
                "node_id": node_id,
                "node_key": key,
                "type": _clean_text(node_type, limit=80, lower=True, allow_unknown=True),
                "label": _clean_text(label, limit=240, allow_unknown=True),
                "confidence": _safe_float(confidence),
                "source_kind": _normalize_source_kind(source_kind),
                "source_ref": _clean_text(source_ref, limit=320, allow_unknown=True),
                "first_seen": now,
                "last_seen": now,
                "properties_json": _to_json(incoming_props, {}),
            },
        )
        changed = True
    else:
        existing_props = _from_json(result[6], {})
        merged_props = _merge_values(existing_props if isinstance(existing_props, dict) else {}, incoming_props)
        resolved_label = _clean_text(label, limit=240, allow_unknown=True) or _clean_text(
            result[1], limit=240, allow_unknown=True
        )
        resolved_kind = _choose_source_kind(result[3], source_kind)
        resolved_ref = (
            _clean_text(source_ref, limit=320, allow_unknown=True)
            if _SOURCE_PRIORITY.get(resolved_kind, 0)
            >= _SOURCE_PRIORITY.get(_normalize_source_kind(result[3], "observed"), 0)
            and _clean_text(source_ref, limit=320, allow_unknown=True)
            else _clean_text(result[4], limit=320, allow_unknown=True)
        )
        resolved_conf = max(_safe_float(result[2]), _safe_float(confidence))
        session.execute(
            text(
                "UPDATE graph_node SET "
                "type = :type, label = :label, confidence = :confidence, source_kind = :source_kind, "
                "source_ref = :source_ref, last_seen = :last_seen, properties_json = :properties_json "
                "WHERE node_key = :node_key"
            ),
            {
                "type": _clean_text(node_type, limit=80, lower=True, allow_unknown=True),
                "label": resolved_label,
                "confidence": resolved_conf,
                "source_kind": resolved_kind,
                "source_ref": resolved_ref,
                "last_seen": now,
                "properties_json": _to_json(merged_props, {}),
                "node_key": key,
            },
        )
        changed = True
    _attach_evidence_refs(session, "node", node_id, evidence_refs or [])
    return node_id, changed


def _upsert_edge(
    session,
    *,
    edge_type: str,
    from_node_id: str,
    to_node_id: str,
    confidence: float,
    source_kind: str,
    source_ref: str,
    properties: Optional[Dict[str, Any]] = None,
    evidence_refs: Optional[List[str]] = None,
) -> Tuple[str, bool]:
    from_ref = _clean_text(from_node_id, limit=80, allow_unknown=True)
    to_ref = _clean_text(to_node_id, limit=80, allow_unknown=True)
    edge_kind = _clean_text(edge_type, limit=80, lower=True, allow_unknown=True)
    if not edge_kind or not from_ref or not to_ref:
        return "", False
    edge_key = f"{edge_kind}:{from_ref}:{to_ref}"
    edge_id = _stable_id("graph-edge", {"edge_key": edge_key})
    now = _utc_now()
    result = session.execute(
        text(
            "SELECT edge_id, confidence, source_kind, source_ref, properties_json "
            "FROM graph_edge WHERE edge_key = :edge_key LIMIT 1"
        ),
        {"edge_key": edge_key},
    ).fetchone()
    changed = False
    incoming_props = dict(properties or {})
    if result is None:
        session.execute(
            text(
                "INSERT INTO graph_edge ("
                "edge_id, edge_key, type, from_node_id, to_node_id, confidence, source_kind, source_ref, first_seen, last_seen, properties_json"
                ") VALUES ("
                ":edge_id, :edge_key, :type, :from_node_id, :to_node_id, :confidence, :source_kind, :source_ref, :first_seen, :last_seen, :properties_json"
                ")"
            ),
            {
                "edge_id": edge_id,
                "edge_key": edge_key,
                "type": edge_kind,
                "from_node_id": from_ref,
                "to_node_id": to_ref,
                "confidence": _safe_float(confidence),
                "source_kind": _normalize_source_kind(source_kind),
                "source_ref": _clean_text(source_ref, limit=320, allow_unknown=True),
                "first_seen": now,
                "last_seen": now,
                "properties_json": _to_json(incoming_props, {}),
            },
        )
        changed = True
    else:
        existing_props = _from_json(result[4], {})
        merged_props = _merge_values(existing_props if isinstance(existing_props, dict) else {}, incoming_props)
        resolved_kind = _choose_source_kind(result[2], source_kind)
        resolved_ref = (
            _clean_text(source_ref, limit=320, allow_unknown=True)
            if _SOURCE_PRIORITY.get(resolved_kind, 0)
            >= _SOURCE_PRIORITY.get(_normalize_source_kind(result[2], "observed"), 0)
            and _clean_text(source_ref, limit=320, allow_unknown=True)
            else _clean_text(result[3], limit=320, allow_unknown=True)
        )
        resolved_conf = max(_safe_float(result[1]), _safe_float(confidence))
        session.execute(
            text(
                "UPDATE graph_edge SET "
                "confidence = :confidence, source_kind = :source_kind, source_ref = :source_ref, "
                "last_seen = :last_seen, properties_json = :properties_json "
                "WHERE edge_key = :edge_key"
            ),
            {
                "confidence": resolved_conf,
                "source_kind": resolved_kind,
                "source_ref": resolved_ref,
                "last_seen": now,
                "properties_json": _to_json(merged_props, {}),
                "edge_key": edge_key,
            },
        )
        changed = True
    _attach_evidence_refs(session, "edge", edge_id, evidence_refs or [])
    return edge_id, changed


def _attach_evidence_refs(session, owner_kind: str, owner_id: str, evidence_refs: List[str]):
    now = _utc_now()
    for token in _dedupe_tokens(evidence_refs, limit=32, token_limit=320):
        existing = session.execute(
            text(
                "SELECT id FROM graph_evidence_ref "
                "WHERE owner_kind = :owner_kind AND owner_id = :owner_id AND evidence_ref = :evidence_ref LIMIT 1"
            ),
            {
                "owner_kind": _clean_text(owner_kind, limit=16, lower=True, allow_unknown=True),
                "owner_id": _clean_text(owner_id, limit=80, allow_unknown=True),
                "evidence_ref": token,
            },
        ).fetchone()
        if existing is not None:
            continue
        session.execute(
            text(
                "INSERT INTO graph_evidence_ref (owner_kind, owner_id, evidence_ref, created_at) "
                "VALUES (:owner_kind, :owner_id, :evidence_ref, :created_at)"
            ),
            {
                "owner_kind": _clean_text(owner_kind, limit=16, lower=True, allow_unknown=True),
                "owner_id": _clean_text(owner_id, limit=80, allow_unknown=True),
                "evidence_ref": token,
                "created_at": now,
            },
        )


def _subnet_for_host(host_ip: str) -> str:
    token = _clean_text(host_ip, limit=128, allow_unknown=True)
    if not token:
        return ""
    try:
        address = ipaddress.ip_address(token)
    except ValueError:
        return ""
    if isinstance(address, ipaddress.IPv4Address):
        return str(ipaddress.ip_network(f"{token}/24", strict=False))
    return str(ipaddress.ip_network(f"{token}/64", strict=False))


def _upsert_annotation(
    session,
    *,
    target_kind: str,
    target_ref: str,
    body: str,
    created_by: str = "system",
    source_ref: str = "",
) -> Tuple[str, bool]:
    target_token = _clean_text(target_ref, limit=80, allow_unknown=True)
    body_token = _clean_text(body, limit=4000, allow_unknown=True)
    if not target_token or not body_token:
        return "", False
    annotation_id = _stable_id(
        "graph-annotation",
        {
            "target_kind": _clean_text(target_kind, limit=32, lower=True, allow_unknown=True),
            "target_ref": target_token,
            "body": body_token,
            "source_ref": _clean_text(source_ref, limit=320, allow_unknown=True),
        },
    )
    now = _utc_now()
    existing = session.execute(
        text("SELECT annotation_id FROM graph_annotation WHERE annotation_id = :annotation_id LIMIT 1"),
        {"annotation_id": annotation_id},
    ).fetchone()
    if existing is None:
        session.execute(
            text(
                "INSERT INTO graph_annotation ("
                "annotation_id, target_kind, target_ref, body, created_by, created_at, updated_at, source_ref"
                ") VALUES ("
                ":annotation_id, :target_kind, :target_ref, :body, :created_by, :created_at, :updated_at, :source_ref"
                ")"
            ),
            {
                "annotation_id": annotation_id,
                "target_kind": _clean_text(target_kind, limit=32, lower=True, allow_unknown=True),
                "target_ref": target_token,
                "body": body_token,
                "created_by": _clean_text(created_by, limit=80, allow_unknown=True),
                "created_at": now,
                "updated_at": now,
                "source_ref": _clean_text(source_ref, limit=320, allow_unknown=True),
            },
        )
        return annotation_id, True
    session.execute(
        text(
            "UPDATE graph_annotation SET body = :body, updated_at = :updated_at, source_ref = :source_ref "
            "WHERE annotation_id = :annotation_id"
        ),
        {
            "body": body_token,
            "updated_at": now,
            "source_ref": _clean_text(source_ref, limit=320, allow_unknown=True),
            "annotation_id": annotation_id,
        },
    )
    return annotation_id, True


def ensure_scheduler_graph_tables(database):
    session = database.session()
    try:
        _ensure_tables(session)
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
