"""Evidence graph storage and synchronization: annotations."""

from __future__ import annotations

from typing import Any, Dict, List
from sqlalchemy import text

from app.scheduler.graph_support.storage import (
    _clean_text,
    _ensure_tables,
    _from_json,
    _stable_id,
    _to_json,
    _utc_now,
)


def upsert_graph_layout_state(
    database,
    *,
    view_id: str,
    name: str,
    layout_state: Dict[str, Any],
    layout_id: str = "",
) -> Dict[str, Any]:
    session = database.session()
    try:
        _ensure_tables(session)
        resolved_layout_id = _clean_text(layout_id, limit=80, allow_unknown=True) or _stable_id(
            "graph-layout",
            {
                "view_id": _clean_text(view_id, limit=80, allow_unknown=True),
                "name": _clean_text(name, limit=160, allow_unknown=True),
            },
        )
        payload = {
            "layout_id": resolved_layout_id,
            "view_id": _clean_text(view_id, limit=80, allow_unknown=True),
            "name": _clean_text(name, limit=160, allow_unknown=True),
            "layout_json": _to_json(layout_state if isinstance(layout_state, dict) else {}, {}),
            "updated_at": _utc_now(),
        }
        existing = session.execute(
            text("SELECT layout_id FROM graph_layout_state WHERE layout_id = :layout_id LIMIT 1"),
            {"layout_id": resolved_layout_id},
        ).fetchone()
        if existing is None:
            session.execute(
                text(
                    "INSERT INTO graph_layout_state (layout_id, view_id, name, layout_json, updated_at) "
                    "VALUES (:layout_id, :view_id, :name, :layout_json, :updated_at)"
                ),
                payload,
            )
        else:
            session.execute(
                text(
                    "UPDATE graph_layout_state SET view_id = :view_id, name = :name, layout_json = :layout_json, "
                    "updated_at = :updated_at WHERE layout_id = :layout_id"
                ),
                payload,
            )
        session.commit()
        return {
            "layout_id": resolved_layout_id,
            "view_id": payload["view_id"],
            "name": payload["name"],
            "layout": layout_state if isinstance(layout_state, dict) else {},
            "updated_at": payload["updated_at"],
        }
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def list_graph_layout_states(database) -> List[Dict[str, Any]]:
    session = database.session()
    try:
        _ensure_tables(session)
        result = session.execute(
            text("SELECT layout_id, view_id, name, layout_json, updated_at FROM graph_layout_state ORDER BY id ASC")
        )
        rows = []
        for row in result.fetchall():
            rows.append(
                {
                    "layout_id": _clean_text(row[0], limit=80, allow_unknown=True),
                    "view_id": _clean_text(row[1], limit=80, allow_unknown=True),
                    "name": _clean_text(row[2], limit=160, allow_unknown=True),
                    "layout": _from_json(row[3], {}),
                    "updated_at": _clean_text(row[4], limit=64, allow_unknown=True),
                }
            )
        return rows
    finally:
        session.close()


def upsert_graph_annotation(
    database,
    *,
    target_kind: str,
    target_ref: str,
    body: str,
    created_by: str = "operator",
    source_ref: str = "",
    annotation_id: str = "",
) -> Dict[str, Any]:
    session = database.session()
    try:
        _ensure_tables(session)
        resolved_annotation_id = _clean_text(annotation_id, limit=80, allow_unknown=True)
        if not resolved_annotation_id:
            resolved_annotation_id = _stable_id(
                "graph-annotation",
                {
                    "target_kind": _clean_text(target_kind, limit=32, lower=True, allow_unknown=True),
                    "target_ref": _clean_text(target_ref, limit=80, allow_unknown=True),
                    "body": _clean_text(body, limit=4000, allow_unknown=True),
                    "source_ref": _clean_text(source_ref, limit=320, allow_unknown=True),
                },
            )
        now = _utc_now()
        payload = {
            "annotation_id": resolved_annotation_id,
            "target_kind": _clean_text(target_kind, limit=32, lower=True, allow_unknown=True),
            "target_ref": _clean_text(target_ref, limit=80, allow_unknown=True),
            "body": _clean_text(body, limit=4000, allow_unknown=True),
            "created_by": _clean_text(created_by, limit=80, allow_unknown=True),
            "created_at": now,
            "updated_at": now,
            "source_ref": _clean_text(source_ref, limit=320, allow_unknown=True),
        }
        existing = session.execute(
            text("SELECT annotation_id, created_at FROM graph_annotation WHERE annotation_id = :annotation_id LIMIT 1"),
            {"annotation_id": resolved_annotation_id},
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
                payload,
            )
        else:
            payload["created_at"] = _clean_text(existing[1], limit=64, allow_unknown=True) or now
            session.execute(
                text(
                    "UPDATE graph_annotation SET target_kind = :target_kind, target_ref = :target_ref, body = :body, "
                    "created_by = :created_by, updated_at = :updated_at, source_ref = :source_ref "
                    "WHERE annotation_id = :annotation_id"
                ),
                payload,
            )
        session.commit()
        return {
            "annotation_id": resolved_annotation_id,
            "target_kind": payload["target_kind"],
            "target_ref": payload["target_ref"],
            "body": payload["body"],
            "created_by": payload["created_by"],
            "created_at": payload["created_at"],
            "updated_at": payload["updated_at"],
            "source_ref": payload["source_ref"],
        }
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def list_graph_annotations(database, *, target_ref: str = "", target_kind: str = "") -> List[Dict[str, Any]]:
    session = database.session()
    try:
        _ensure_tables(session)
        query = (
            "SELECT annotation_id, target_kind, target_ref, body, created_by, created_at, updated_at, source_ref "
            "FROM graph_annotation WHERE 1=1"
        )
        params: Dict[str, Any] = {}
        if _clean_text(target_ref, limit=80, allow_unknown=True):
            query += " AND target_ref = :target_ref"
            params["target_ref"] = _clean_text(target_ref, limit=80, allow_unknown=True)
        if _clean_text(target_kind, limit=32, lower=True, allow_unknown=True):
            query += " AND target_kind = :target_kind"
            params["target_kind"] = _clean_text(target_kind, limit=32, lower=True, allow_unknown=True)
        query += " ORDER BY id ASC"
        result = session.execute(text(query), params)
        rows = []
        for row in result.fetchall():
            rows.append(
                {
                    "annotation_id": _clean_text(row[0], limit=80, allow_unknown=True),
                    "target_kind": _clean_text(row[1], limit=32, lower=True, allow_unknown=True),
                    "target_ref": _clean_text(row[2], limit=80, allow_unknown=True),
                    "body": _clean_text(row[3], limit=4000, allow_unknown=True),
                    "created_by": _clean_text(row[4], limit=80, allow_unknown=True),
                    "created_at": _clean_text(row[5], limit=64, allow_unknown=True),
                    "updated_at": _clean_text(row[6], limit=64, allow_unknown=True),
                    "source_ref": _clean_text(row[7], limit=320, allow_unknown=True),
                }
            )
        return rows
    finally:
        session.close()
