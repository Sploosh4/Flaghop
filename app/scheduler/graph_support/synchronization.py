"""Evidence graph storage and synchronization: synchronization."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy import text

from app.scheduler.graph_support.storage import (
    ensure_scheduler_graph_tables,
)
from app.scheduler.graph_support.storage import (
    _clean_text,
    _dedupe_tokens,
    _ensure_tables,
    _from_json,
    _remember_mutation,
    _upsert_edge,
    _upsert_node,
)
from app.scheduler.graph_support.sync_actions import (
    _sync_graph_actions,
)
from app.scheduler.graph_support.sync_artifacts import (
    _sync_graph_artifacts,
)
from app.scheduler.graph_support.sync_credentials import (
    _sync_graph_credentials,
)
from app.scheduler.graph_support.sync_findings import (
    _sync_graph_findings,
)
from app.scheduler.graph_support.sync_identity import (
    _sync_graph_identity,
)
from app.scheduler.graph_support.sync_services import (
    _sync_graph_services,
)
from app.scheduler.graph_support.sync_technologies import (
    _sync_graph_technologies,
)
from app.scheduler.graph_support.sync_urls import (
    _sync_graph_urls,
)


def _load_host_context(database, host_id: int) -> Dict[str, Any]:
    from app.scheduler.state import build_target_urls, get_target_state, load_observed_service_inventory

    session = database.session()
    try:
        host_row = session.execute(
            text(
                "SELECT id, COALESCE(ip, '') AS ip, COALESCE(hostname, '') AS hostname, COALESCE(osMatch, '') AS os_match "
                "FROM hostObj WHERE id = :host_id LIMIT 1"
            ),
            {"host_id": int(host_id or 0)},
        ).fetchone()
        base = {
            "host_id": int(host_id or 0),
            "host_ip": "",
            "hostname": "",
            "os_match": "",
            "service_inventory": [],
            "urls": [],
            "technologies": [],
            "findings": [],
            "manual_tests": [],
            "coverage_gaps": [],
            "attempted_actions": [],
            "credentials": [],
            "sessions": [],
            "screenshots": [],
            "artifacts": [],
            "raw": {},
        }
        if host_row is not None:
            base.update(
                {
                    "host_ip": _clean_text(host_row[1], limit=160),
                    "hostname": _clean_text(host_row[2], limit=200),
                    "os_match": _clean_text(host_row[3], limit=120),
                }
            )
        target_state = get_target_state(database, int(host_id or 0))
        if isinstance(target_state, dict) and target_state:
            base.update({key: value for key, value in target_state.items() if value not in [None, ""]})
        service_inventory = load_observed_service_inventory(database, int(host_id or 0))
        if service_inventory:
            base["service_inventory"] = service_inventory
        if not isinstance(base.get("urls", []), list) or not base.get("urls"):
            base["urls"] = build_target_urls(
                str(base.get("host_ip", "") or ""),
                str(base.get("hostname", "") or ""),
                base.get("service_inventory", []) if isinstance(base.get("service_inventory", []), list) else [],
            )
        cve_rows = session.execute(
            text(
                "SELECT id, COALESCE(name, '') AS name, COALESCE(url, '') AS url, COALESCE(product, '') AS product, "
                "COALESCE(severity, '') AS severity, COALESCE(source, '') AS source, COALESCE(version, '') AS version, "
                "COALESCE(exploitId, 0) AS exploit_id, COALESCE(exploit, '') AS exploit, COALESCE(exploitUrl, '') AS exploit_url, "
                "COALESCE(serviceId, '') AS service_id "
                "FROM cve WHERE CAST(hostId AS TEXT) = :host_id ORDER BY id ASC"
            ),
            {"host_id": str(int(host_id or 0))},
        ).fetchall()
        base["cves"] = [
            {
                "id": int(row[0] or 0),
                "name": _clean_text(row[1], limit=120, allow_unknown=True),
                "url": _clean_text(row[2], limit=320, allow_unknown=True),
                "product": _clean_text(row[3], limit=120, allow_unknown=True),
                "severity": _clean_text(row[4], limit=32, lower=True, allow_unknown=True),
                "source": _clean_text(row[5], limit=80, allow_unknown=True),
                "version": _clean_text(row[6], limit=80, allow_unknown=True),
                "exploit_id": int(row[7] or 0),
                "exploit": _clean_text(row[8], limit=220, allow_unknown=True),
                "exploit_url": _clean_text(row[9], limit=320, allow_unknown=True),
                "service_id": _clean_text(row[10], limit=40, allow_unknown=True),
            }
            for row in cve_rows
        ]
        note_rows = session.execute(
            text("SELECT id, COALESCE(text, '') AS text FROM note WHERE hostId = :host_id ORDER BY id ASC"),
            {"host_id": int(host_id or 0)},
        ).fetchall()
        base["notes"] = [
            {"id": int(row[0] or 0), "text": _clean_text(row[1], limit=2000, allow_unknown=True)}
            for row in note_rows
            if _clean_text(row[1], limit=2000, allow_unknown=True)
        ]
        return base
    finally:
        session.close()


def sync_target_state_to_evidence_graph(
    database,
    *,
    host_id: int,
    target_state: Optional[Dict[str, Any]] = None,
) -> List[str]:
    context = _load_host_context(database, int(host_id or 0))
    if isinstance(target_state, dict) and target_state:
        for key, value in target_state.items():
            if value not in [None, ""]:
                context[key] = value
    if int(context.get("host_id", 0) or host_id or 0) <= 0 and not _clean_text(context.get("host_ip", ""), limit=160):
        return []

    mutations: List[str] = []
    session = database.session()
    try:
        host_ip, host_node_id, resolved_host_id = _sync_graph_identity(context, host_id, mutations, session)
        service_nodes = _sync_graph_services(context, host_node_id, mutations, resolved_host_id, session)
        _sync_graph_urls(context, host_node_id, mutations, resolved_host_id, service_nodes, session)
        _sync_graph_technologies(context, host_node_id, mutations, resolved_host_id, session)
        _sync_graph_findings(context, host_node_id, mutations, resolved_host_id, session)
        _sync_graph_credentials(context, host_node_id, mutations, resolved_host_id, session)
        artifact_nodes = _sync_graph_artifacts(context, host_node_id, mutations, resolved_host_id, session)
        _sync_graph_actions(artifact_nodes, context, host_ip, host_node_id, mutations, resolved_host_id, session)

        session.commit()
        return mutations
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def sync_execution_record_to_evidence_graph(
    database,
    *,
    execution_record: Any,
    step: Any = None,
    host_ip: str = "",
    port: str = "",
    protocol: str = "",
    service: str = "",
) -> List[str]:
    if execution_record is None:
        return []
    mutations: List[str] = []
    session = database.session()
    try:
        _ensure_tables(session)
        host_token = _clean_text(host_ip, limit=160, allow_unknown=True)
        if not host_token:
            host_token = _clean_text(
                getattr(step, "target_ref", {}).get("host_ip", "") if hasattr(step, "target_ref") else "",
                limit=160,
                allow_unknown=True,
            )
        if not host_token:
            return []
        host_node_id, changed = _upsert_node(
            session,
            node_key=f"host:{host_token}",
            node_type="host",
            label=host_token,
            confidence=88.0,
            source_kind="observed",
            source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
            properties={"ip": host_token},
        )
        if changed:
            _remember_mutation(mutations, "node", host_node_id)
        tool_id = _clean_text(
            getattr(getattr(step, "action", None), "tool_id", "") or getattr(step, "tool_id", ""),
            limit=96,
            lower=True,
            allow_unknown=True,
        )
        action_label = (
            _clean_text(
                getattr(getattr(step, "action", None), "label", "") or getattr(step, "label", ""),
                limit=140,
                allow_unknown=True,
            )
            or tool_id
        )
        action_node_id, changed = _upsert_node(
            session,
            node_key=f"action:{host_token}:{tool_id}:{_clean_text(port, limit=20, allow_unknown=True)}:{_clean_text(protocol or 'tcp', limit=12, lower=True, allow_unknown=True)}",
            node_type="action",
            label=action_label,
            confidence=98.0,
            source_kind="observed",
            source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
            properties={
                "execution_id": _clean_text(
                    getattr(execution_record, "execution_id", ""), limit=80, allow_unknown=True
                ),
                "step_id": _clean_text(getattr(execution_record, "step_id", ""), limit=80, allow_unknown=True),
                "tool_id": tool_id,
                "port": _clean_text(port, limit=20, allow_unknown=True),
                "protocol": _clean_text(protocol or "tcp", limit=12, lower=True, allow_unknown=True),
                "service": _clean_text(service, limit=64, allow_unknown=True),
                "runner_type": _clean_text(
                    getattr(execution_record, "runner_type", ""), limit=32, lower=True, allow_unknown=True
                ),
                "exit_status": _clean_text(getattr(execution_record, "exit_status", ""), limit=160, allow_unknown=True),
                "approval_id": _clean_text(getattr(execution_record, "approval_id", ""), limit=80, allow_unknown=True),
                "started_at": _clean_text(getattr(execution_record, "started_at", ""), limit=64, allow_unknown=True),
                "finished_at": _clean_text(getattr(execution_record, "finished_at", ""), limit=64, allow_unknown=True),
                "origin_mode": _clean_text(
                    getattr(step, "origin_mode", "") or getattr(step, "mode", ""),
                    limit=24,
                    lower=True,
                    allow_unknown=True,
                ),
            },
            evidence_refs=list(getattr(step, "linked_evidence_refs", []) or []),
        )
        if changed:
            _remember_mutation(mutations, "node", action_node_id)
        edge_id, changed = _upsert_edge(
            session,
            edge_type="contains",
            from_node_id=host_node_id,
            to_node_id=action_node_id,
            confidence=98.0,
            source_kind="observed",
            source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
            evidence_refs=list(getattr(step, "linked_evidence_refs", []) or []),
        )
        if changed:
            _remember_mutation(mutations, "edge", edge_id)
        for artifact_ref in list(getattr(execution_record, "artifact_refs", []) or []):
            artifact_token = _clean_text(artifact_ref, limit=320, allow_unknown=True)
            if not artifact_token:
                continue
            node_type = "screenshot" if artifact_token.lower().endswith(".png") else "artifact"
            artifact_node_id, changed = _upsert_node(
                session,
                node_key=f"{node_type}:{host_token}:{artifact_token}",
                node_type=node_type,
                label=artifact_token.split("/")[-1] or artifact_token,
                confidence=96.0,
                source_kind="observed",
                source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
                properties={
                    "execution_id": _clean_text(
                        getattr(execution_record, "execution_id", ""), limit=80, allow_unknown=True
                    ),
                    "ref": artifact_token,
                    "tool_id": tool_id,
                    "port": _clean_text(port, limit=20, allow_unknown=True),
                    "protocol": _clean_text(protocol or "tcp", limit=12, lower=True, allow_unknown=True),
                },
            )
            if changed:
                _remember_mutation(mutations, "node", artifact_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="produced",
                from_node_id=action_node_id,
                to_node_id=artifact_node_id,
                confidence=96.0,
                source_kind="observed",
                source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
                evidence_refs=[artifact_token],
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
        for ref_name, ref_value in (
            ("stdout", _clean_text(getattr(execution_record, "stdout_ref", ""), limit=320, allow_unknown=True)),
            ("stderr", _clean_text(getattr(execution_record, "stderr_ref", ""), limit=320, allow_unknown=True)),
        ):
            if not ref_value:
                continue
            evidence_node_id, changed = _upsert_node(
                session,
                node_key=f"evidence:execution:{ref_name}:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
                node_type="evidence_record",
                label=ref_value[:120],
                confidence=100.0,
                source_kind="observed",
                source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
                properties={
                    "execution_id": _clean_text(
                        getattr(execution_record, "execution_id", ""), limit=80, allow_unknown=True
                    ),
                    "ref_type": ref_name,
                    "ref": ref_value,
                },
            )
            if changed:
                _remember_mutation(mutations, "node", evidence_node_id)
            edge_id, changed = _upsert_edge(
                session,
                edge_type="produced",
                from_node_id=action_node_id,
                to_node_id=evidence_node_id,
                confidence=100.0,
                source_kind="observed",
                source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
                evidence_refs=[ref_value] + list(getattr(step, "linked_evidence_refs", []) or []),
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
        for finding_id in list(getattr(step, "linked_graph_nodes", []) or []):
            target_finding = _clean_text(finding_id, limit=80, allow_unknown=True)
            if not target_finding:
                continue
            edge_id, changed = _upsert_edge(
                session,
                edge_type="validated_by",
                from_node_id=target_finding,
                to_node_id=action_node_id,
                confidence=92.0,
                source_kind="observed",
                source_ref=f"execution:{_clean_text(getattr(execution_record, 'execution_id', ''), limit=80, allow_unknown=True)}",
            )
            if changed:
                _remember_mutation(mutations, "edge", edge_id)
        session.commit()
        return mutations
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def rebuild_evidence_graph(database, *, host_id: Optional[int] = None) -> List[str]:
    ensure_scheduler_graph_tables(database)
    session = database.session()
    try:
        params: Dict[str, Any] = {}
        query = "SELECT id FROM hostObj"
        if host_id is not None:
            query += " WHERE id = :host_id"
            params["host_id"] = int(host_id or 0)
        query += " ORDER BY id ASC"
        host_rows = session.execute(text(query), params).fetchall()
    finally:
        session.close()

    mutations: List[str] = []
    for row in host_rows:
        for token in sync_target_state_to_evidence_graph(database, host_id=int(row[0] or 0)):
            _remember_mutation(mutations, token.split(":", 1)[0], token.split(":", 1)[1] if ":" in token else token)

    session = database.session()
    try:
        _ensure_tables(session)
        query = (
            "SELECT execution_id, step_id, action_id, tool_id, label, scheduler_mode, goal_profile, host_ip, port, protocol, service, "
            "started_at, finished_at, runner_type, exit_status, stdout_ref, stderr_ref, artifact_refs_json, approval_id, "
            "observations_created_json, graph_mutations_json, operator_notes "
            "FROM scheduler_execution_record ORDER BY id ASC"
        )
        rows = session.execute(text(query)).fetchall()
        keys = [
            "execution_id",
            "step_id",
            "action_id",
            "tool_id",
            "label",
            "scheduler_mode",
            "goal_profile",
            "host_ip",
            "port",
            "protocol",
            "service",
            "started_at",
            "finished_at",
            "runner_type",
            "exit_status",
            "stdout_ref",
            "stderr_ref",
            "artifact_refs_json",
            "approval_id",
            "observations_created_json",
            "graph_mutations_json",
            "operator_notes",
        ]
    except Exception:
        session.close()
        return mutations
    finally:
        try:
            session.close()
        except Exception:
            pass

    for row in rows:
        item = dict(zip(keys, row))
        proxy = type(
            "ExecutionProxy",
            (),
            {
                "execution_id": item.get("execution_id", ""),
                "step_id": item.get("step_id", ""),
                "started_at": item.get("started_at", ""),
                "finished_at": item.get("finished_at", ""),
                "runner_type": item.get("runner_type", ""),
                "exit_status": item.get("exit_status", ""),
                "stdout_ref": item.get("stdout_ref", ""),
                "stderr_ref": item.get("stderr_ref", ""),
                "artifact_refs": _from_json(item.get("artifact_refs_json"), []),
                "approval_id": item.get("approval_id", ""),
                "observations_created": _from_json(item.get("observations_created_json"), []),
                "graph_mutations": _from_json(item.get("graph_mutations_json"), []),
                "operator_notes": item.get("operator_notes", ""),
            },
        )()
        step_proxy = type(
            "StepProxy",
            (),
            {
                "action": type(
                    "ActionProxy",
                    (),
                    {
                        "tool_id": item.get("tool_id", ""),
                        "label": item.get("label", ""),
                    },
                )(),
                "origin_mode": item.get("scheduler_mode", ""),
                "linked_evidence_refs": _dedupe_tokens(
                    _from_json(item.get("observations_created_json"), []), limit=16, token_limit=320
                ),
                "linked_graph_nodes": [],
            },
        )()
        for token in sync_execution_record_to_evidence_graph(
            database,
            execution_record=proxy,
            step=step_proxy,
            host_ip=item.get("host_ip", ""),
            port=item.get("port", ""),
            protocol=item.get("protocol", ""),
            service=item.get("service", ""),
        ):
            _remember_mutation(mutations, token.split(":", 1)[0], token.split(":", 1)[1] if ":" in token else token)
    return mutations
