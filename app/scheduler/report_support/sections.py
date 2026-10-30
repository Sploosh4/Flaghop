"""Evidence-backed reports: sections."""

from __future__ import annotations

from typing import Any, Dict, List, Sequence

from app.scheduler.report_support.common import (
    _bucket_append,
    _csv_tokens,
    _dedupe_dicts,
    _dedupe_tokens,
    _normalize_source_kind,
    _safe_float,
    _safe_int,
)


def _host_matches_node(node: Dict[str, Any], host_id: int, host_ip: str) -> bool:
    properties = node.get("properties", {}) if isinstance(node.get("properties", {}), dict) else {}
    if int(host_id or 0) > 0 and _safe_int(properties.get("host_id", 0)) == int(host_id):
        return True
    resolved_host_ip = str(host_ip or "").strip()
    if not resolved_host_ip:
        return False
    if str(properties.get("ip", "") or "").strip() == resolved_host_ip:
        return True
    if (
        str(node.get("type", "") or "").strip().lower() == "host"
        and str(node.get("label", "") or "").strip() == resolved_host_ip
    ):
        return True
    return False


def _filter_graph_snapshot(snapshot: Dict[str, Any], host_id: int = 0, host_ip: str = "") -> Dict[str, Any]:
    if int(host_id or 0) <= 0 and not str(host_ip or "").strip():
        return {
            "nodes": list(snapshot.get("nodes", []) or []),
            "edges": list(snapshot.get("edges", []) or []),
            "annotations": list(snapshot.get("annotations", []) or []),
        }

    nodes = [item for item in list(snapshot.get("nodes", []) or []) if isinstance(item, dict)]
    edges = [item for item in list(snapshot.get("edges", []) or []) if isinstance(item, dict)]
    included = {
        str(item.get("node_id", "") or "")
        for item in nodes
        if _host_matches_node(item, int(host_id or 0), str(host_ip or ""))
    }
    changed = True
    while changed:
        changed = False
        for edge in edges:
            from_id = str(edge.get("from_node_id", "") or "")
            to_id = str(edge.get("to_node_id", "") or "")
            if from_id in included or to_id in included:
                if from_id and from_id not in included:
                    included.add(from_id)
                    changed = True
                if to_id and to_id not in included:
                    included.add(to_id)
                    changed = True
    filtered_nodes = [item for item in nodes if str(item.get("node_id", "") or "") in included]
    filtered_edges = [
        item
        for item in edges
        if str(item.get("from_node_id", "") or "") in included and str(item.get("to_node_id", "") or "") in included
    ]
    filtered_annotations = []
    for item in list(snapshot.get("annotations", []) or []):
        if not isinstance(item, dict):
            continue
        target_ref = str(item.get("target_ref", "") or "")
        source_ref = str(item.get("source_ref", "") or "")
        if target_ref in included or (int(host_id or 0) > 0 and f"host:{int(host_id)}" in source_ref):
            filtered_annotations.append(dict(item))
    return {
        "nodes": filtered_nodes,
        "edges": filtered_edges,
        "annotations": filtered_annotations,
    }


def _build_attack_paths(snapshot: Dict[str, Any], limit: int = 24) -> List[Dict[str, Any]]:
    nodes_by_id = {
        str(item.get("node_id", "") or ""): dict(item)
        for item in list(snapshot.get("nodes", []) or [])
        if isinstance(item, dict) and str(item.get("node_id", "") or "")
    }
    interesting_types = {
        "authenticated_as",
        "pivoted_to",
        "supports_exploit",
        "affected_by",
        "captured",
        "produced",
        "derived_from",
        "validated_by",
    }
    edges = [
        dict(item)
        for item in list(snapshot.get("edges", []) or [])
        if isinstance(item, dict) and str(item.get("type", "") or "").strip().lower() in interesting_types
    ]
    outgoing: Dict[str, List[Dict[str, Any]]] = {}
    incoming_count: Dict[str, int] = {}
    for edge in edges:
        from_id = str(edge.get("from_node_id", "") or "")
        to_id = str(edge.get("to_node_id", "") or "")
        outgoing.setdefault(from_id, []).append(edge)
        incoming_count[to_id] = incoming_count.get(to_id, 0) + 1

    chains: List[Dict[str, Any]] = []
    seen_chains = set()
    for edge in edges:
        from_id = str(edge.get("from_node_id", "") or "")
        if incoming_count.get(from_id, 0) > 0:
            continue
        chain_edges = [edge]
        used_edge_ids = {str(edge.get("edge_id", "") or "")}
        current_node = str(edge.get("to_node_id", "") or "")
        while len(chain_edges) < 4:
            candidates = [
                item
                for item in list(outgoing.get(current_node, []) or [])
                if str(item.get("edge_id", "") or "") not in used_edge_ids
            ]
            if not candidates:
                break
            next_edge = sorted(candidates, key=lambda item: -_safe_float(item.get("confidence", 0.0)))[0]
            chain_edges.append(next_edge)
            used_edge_ids.add(str(next_edge.get("edge_id", "") or ""))
            current_node = str(next_edge.get("to_node_id", "") or "")

        chain_key = tuple(str(item.get("edge_id", "") or "") for item in chain_edges)
        if chain_key in seen_chains:
            continue
        seen_chains.add(chain_key)

        sequence: List[Dict[str, Any]] = []
        evidence_refs: List[str] = []
        source_kind = "observed"
        if chain_edges:
            first_node = nodes_by_id.get(str(chain_edges[0].get("from_node_id", "") or ""), {})
            if first_node:
                sequence.append(
                    {
                        "node_id": first_node.get("node_id", ""),
                        "type": first_node.get("type", ""),
                        "label": first_node.get("label", ""),
                    }
                )
                evidence_refs.extend(list(first_node.get("evidence_refs", []) or []))
                source_kind = _normalize_source_kind(first_node.get("source_kind", source_kind))
        for item in chain_edges:
            to_node = nodes_by_id.get(str(item.get("to_node_id", "") or ""), {})
            edge_source_kind = _normalize_source_kind(item.get("source_kind", source_kind))
            if edge_source_kind != "observed":
                source_kind = edge_source_kind
            evidence_refs.extend(list(item.get("evidence_refs", []) or []))
            if to_node:
                evidence_refs.extend(list(to_node.get("evidence_refs", []) or []))
                if _normalize_source_kind(to_node.get("source_kind", source_kind)) != "observed":
                    source_kind = _normalize_source_kind(to_node.get("source_kind", source_kind))
            sequence.append(
                {
                    "edge_type": str(item.get("type", "") or ""),
                    "to_node_id": str(item.get("to_node_id", "") or ""),
                    "to_type": str(to_node.get("type", "") or ""),
                    "to_label": str(to_node.get("label", "") or ""),
                }
            )
        labels = []
        if sequence:
            labels.append(str(sequence[0].get("label", "") or ""))
            for item in sequence[1:]:
                labels.append(f"--{str(item.get('edge_type', '') or '')}-->")
                labels.append(str(item.get("to_label", "") or ""))
        chains.append(
            {
                "summary": " ".join([token for token in labels if token]).strip(),
                "source_kind": source_kind,
                "confidence": (
                    min([_safe_float(item.get("confidence", 0.0), 0.0) for item in chain_edges] or [0.0])
                    if chain_edges
                    else 0.0
                ),
                "sequence": sequence,
                "evidence_refs": _dedupe_tokens(evidence_refs, limit=32),
                "edge_ids": [str(item.get("edge_id", "") or "") for item in chain_edges],
            }
        )
        if len(chains) >= limit:
            break

    if chains:
        return chains

    # Fall back to relationship summaries when no longer chain exists.
    fallback = []
    for edge in edges[:limit]:
        from_node = nodes_by_id.get(str(edge.get("from_node_id", "") or ""), {})
        to_node = nodes_by_id.get(str(edge.get("to_node_id", "") or ""), {})
        fallback.append(
            {
                "summary": (
                    f"{str(from_node.get('label', '') or edge.get('from_node_id', ''))} "
                    f"--{str(edge.get('type', '') or '')}--> "
                    f"{str(to_node.get('label', '') or edge.get('to_node_id', ''))}"
                ).strip(),
                "source_kind": _normalize_source_kind(edge.get("source_kind", "observed")),
                "confidence": _safe_float(edge.get("confidence", 0.0), 0.0),
                "sequence": [
                    {
                        "node_id": str(from_node.get("node_id", "") or edge.get("from_node_id", "")),
                        "type": str(from_node.get("type", "") or ""),
                        "label": str(from_node.get("label", "") or edge.get("from_node_id", "")),
                    },
                    {
                        "edge_type": str(edge.get("type", "") or ""),
                        "to_node_id": str(to_node.get("node_id", "") or edge.get("to_node_id", "")),
                        "to_type": str(to_node.get("type", "") or ""),
                        "to_label": str(to_node.get("label", "") or edge.get("to_node_id", "")),
                    },
                ],
                "evidence_refs": _dedupe_tokens(
                    list(edge.get("evidence_refs", []) or [])
                    + list(from_node.get("evidence_refs", []) or [])
                    + list(to_node.get("evidence_refs", []) or []),
                    limit=32,
                ),
                "edge_ids": [str(edge.get("edge_id", "") or "")],
            }
        )
    return fallback


def _build_findings_section(
    host_row: Dict[str, Any],
    target_state: Dict[str, Any],
    cves: Sequence[Dict[str, Any]],
    filtered_graph: Dict[str, Any],
) -> Dict[str, Any]:
    host_info = {
        "id": _safe_int(host_row.get("id", 0), 0),
        "ip": str(host_row.get("ip", "") or ""),
        "hostname": str(host_row.get("hostname", "") or ""),
    }
    rows: List[Dict[str, Any]] = []
    for item in list(target_state.get("findings", []) or []):
        if not isinstance(item, dict):
            continue
        rows.append(
            {
                "host": dict(host_info),
                "title": str(item.get("title", "") or ""),
                "severity": str(item.get("severity", "") or ""),
                "cvss": _safe_float(item.get("cvss", 0.0), 0.0),
                "cve": str(item.get("cve", "") or ""),
                "evidence": str(item.get("evidence", "") or ""),
                "confidence": _safe_float(item.get("confidence", 0.0), 0.0),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed")),
            }
        )
    for item in list(cves or []):
        if not isinstance(item, dict):
            continue
        rows.append(
            {
                "host": dict(host_info),
                "title": str(item.get("name", "") or ""),
                "severity": str(item.get("severity", "") or ""),
                "cvss": 0.0,
                "cve": str(item.get("name", "") or ""),
                "evidence": str(item.get("source", "") or ""),
                "confidence": 92.0,
                "source_kind": "observed",
            }
        )
    for node in list(filtered_graph.get("nodes", []) or []):
        if not isinstance(node, dict) or str(node.get("type", "") or "").strip().lower() != "finding":
            continue
        props = node.get("properties", {}) if isinstance(node.get("properties", {}), dict) else {}
        rows.append(
            {
                "host": dict(host_info),
                "title": str(node.get("label", "") or ""),
                "severity": str(props.get("severity", "") or ""),
                "cvss": _safe_float(props.get("cvss", 0.0), 0.0),
                "cve": str(props.get("cve", "") or ""),
                "evidence": ", ".join(_dedupe_tokens(list(node.get("evidence_refs", []) or []), limit=8)),
                "confidence": _safe_float(node.get("confidence", 0.0), 0.0),
                "source_kind": _normalize_source_kind(node.get("source_kind", "observed")),
            }
        )
    deduped = _dedupe_dicts(rows, limit=400)
    grouped = {
        "observed": [item for item in deduped if _normalize_source_kind(item.get("source_kind", "")) == "observed"],
        "inferred": [item for item in deduped if _normalize_source_kind(item.get("source_kind", "")) == "inferred"],
        "ai_suggested": [
            item for item in deduped if _normalize_source_kind(item.get("source_kind", "")) == "ai_suggested"
        ],
        "operator": [
            item
            for item in deduped
            if _normalize_source_kind(item.get("source_kind", "")) in {"operator", "manual", "user_entered"}
        ],
    }
    return {
        "count": len(deduped),
        "items": deduped,
        "observed": grouped["observed"],
        "inferred": grouped["inferred"],
        "ai_suggested": grouped["ai_suggested"],
        "operator": grouped["operator"],
    }


def _build_credentials_section(target_state: Dict[str, Any], filtered_graph: Dict[str, Any]) -> Dict[str, Any]:
    identities = []
    for node in list(filtered_graph.get("nodes", []) or []):
        if not isinstance(node, dict) or str(node.get("type", "") or "").strip().lower() != "identity":
            continue
        identities.append(
            {
                "label": str(node.get("label", "") or ""),
                "confidence": _safe_float(node.get("confidence", 0.0), 0.0),
                "source_kind": _normalize_source_kind(node.get("source_kind", "observed")),
                "properties": dict(node.get("properties", {}) or {}),
            }
        )
    return {
        "credentials": list(target_state.get("credentials", []) or []),
        "identities": _dedupe_dicts(identities, limit=120),
        "sessions": list(target_state.get("sessions", []) or []),
    }


def _build_evidence_references(
    target_state: Dict[str, Any],
    executions: Sequence[Dict[str, Any]],
    filtered_graph: Dict[str, Any],
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for item in list(target_state.get("screenshots", []) or []):
        if not isinstance(item, dict):
            continue
        rows.append(
            {
                "ref": str(item.get("artifact_ref", "") or item.get("filename", "") or ""),
                "kind": "screenshot",
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed")),
            }
        )
    for item in list(target_state.get("artifacts", []) or []):
        if not isinstance(item, dict):
            continue
        rows.append(
            {
                "ref": str(item.get("ref", "") or ""),
                "kind": str(item.get("kind", "") or "artifact"),
                "tool_id": str(item.get("tool_id", "") or ""),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed")),
            }
        )
    for item in list(executions or []):
        if not isinstance(item, dict):
            continue
        for token in list(item.get("artifact_refs", []) or []):
            rows.append(
                {
                    "ref": str(token or ""),
                    "kind": "artifact",
                    "tool_id": str(item.get("tool_id", "") or ""),
                    "source_kind": "observed",
                }
            )
        if str(item.get("stdout_ref", "") or "").strip():
            rows.append(
                {
                    "ref": str(item.get("stdout_ref", "") or ""),
                    "kind": "stdout",
                    "tool_id": str(item.get("tool_id", "") or ""),
                    "source_kind": "observed",
                }
            )
        if str(item.get("stderr_ref", "") or "").strip():
            rows.append(
                {
                    "ref": str(item.get("stderr_ref", "") or ""),
                    "kind": "stderr",
                    "tool_id": str(item.get("tool_id", "") or ""),
                    "source_kind": "observed",
                }
            )
    for node in list(filtered_graph.get("nodes", []) or []):
        if not isinstance(node, dict):
            continue
        for token in list(node.get("evidence_refs", []) or []):
            rows.append(
                {
                    "ref": str(token or ""),
                    "kind": "graph_evidence",
                    "source_kind": _normalize_source_kind(node.get("source_kind", "observed")),
                }
            )
    for edge in list(filtered_graph.get("edges", []) or []):
        if not isinstance(edge, dict):
            continue
        for token in list(edge.get("evidence_refs", []) or []):
            rows.append(
                {
                    "ref": str(token or ""),
                    "kind": "graph_evidence",
                    "source_kind": _normalize_source_kind(edge.get("source_kind", "observed")),
                }
            )
    return _dedupe_dicts([item for item in rows if str(item.get("ref", "") or "").strip()], limit=400)


def _build_next_steps(
    target_state: Dict[str, Any],
    approvals: Sequence[Dict[str, Any]],
) -> Dict[str, Any]:
    pending_approvals = [
        {
            "approval_id": _safe_int(item.get("id", 0), 0),
            "target": f"{str(item.get('host_ip', '') or '')}:{str(item.get('port', '') or '')}/{str(item.get('protocol', '') or '')}",
            "tool_id": str(item.get("tool_id", "") or ""),
            "label": str(item.get("label", "") or ""),
            "risk_tags": _csv_tokens(item.get("risk_tags", "")),
            "policy_reason": str(item.get("policy_reason", "") or ""),
            "rationale": str(item.get("rationale", "") or ""),
        }
        for item in list(approvals or [])
        if isinstance(item, dict)
    ]
    return {
        "next_phase": str(target_state.get("next_phase", "") or ""),
        "manual_tests": list(target_state.get("manual_tests", []) or []),
        "coverage_gaps": list(target_state.get("coverage_gaps", []) or []),
        "pending_approvals": pending_approvals,
    }


def _build_policy_actions(decisions: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows = []
    for item in list(decisions or []):
        if not isinstance(item, dict):
            continue
        policy_decision = str(item.get("policy_decision", "") or "").strip().lower()
        if policy_decision not in {"blocked", "approval_required"}:
            continue
        rows.append(
            {
                "timestamp": str(item.get("timestamp", "") or ""),
                "host_ip": str(item.get("host_ip", "") or ""),
                "port": str(item.get("port", "") or ""),
                "protocol": str(item.get("protocol", "") or ""),
                "tool_id": str(item.get("tool_id", "") or ""),
                "label": str(item.get("label", "") or ""),
                "policy_decision": policy_decision,
                "policy_reason": str(item.get("policy_reason", "") or ""),
                "risk_tags": _csv_tokens(item.get("risk_tags", "")),
                "reason": str(item.get("reason", "") or ""),
                "safer_alternative": str(item.get("safer_alternative", "") or ""),
            }
        )
    return _dedupe_dicts(rows, limit=240)


def _build_methodology_coverage(
    target_state: Dict[str, Any],
    executions: Sequence[Dict[str, Any]],
    decisions: Sequence[Dict[str, Any]],
) -> Dict[str, Any]:
    attempted_actions = list(target_state.get("attempted_actions", []) or [])
    executed_tools = _dedupe_tokens(
        [item.get("tool_id", "") for item in executions if isinstance(item, dict)],
        limit=240,
    )
    packs_seen = _dedupe_tokens(
        [
            token
            for item in attempted_actions
            if isinstance(item, dict)
            for token in list(item.get("pack_ids", []) or [])
        ],
        limit=120,
    )
    runner_usage = {}
    for item in list(executions or []):
        if not isinstance(item, dict):
            continue
        runner_type = str(item.get("runner_type", "") or "local").strip().lower() or "local"
        runner_usage[runner_type] = runner_usage.get(runner_type, 0) + 1
    decision_modes = _dedupe_tokens(
        [item.get("scheduler_mode", "") for item in decisions if isinstance(item, dict)],
        limit=16,
    )
    return {
        "last_mode": str(target_state.get("last_mode", "") or ""),
        "next_phase": str(target_state.get("next_phase", "") or ""),
        "attempted_action_count": len(attempted_actions),
        "executed_tool_ids": executed_tools,
        "strategy_packs_seen": packs_seen,
        "coverage_gaps": list(target_state.get("coverage_gaps", []) or []),
        "runner_usage": runner_usage,
        "decision_modes": decision_modes,
    }


def _build_provenance_buckets(
    host_row: Dict[str, Any],
    target_state: Dict[str, Any],
    filtered_graph: Dict[str, Any],
    notes: Sequence[Dict[str, Any]],
) -> Dict[str, List[Dict[str, Any]]]:
    buckets = {
        "observed_facts": [],
        "inferred_relationships": [],
        "ai_suggestions": [],
        "operator_conclusions": [],
    }
    host_label = str(host_row.get("hostname", "") or host_row.get("ip", "") or "")
    for item in list(target_state.get("technologies", []) or []):
        if not isinstance(item, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": "technology",
                "host": host_label,
                "label": str(item.get("name", "") or ""),
                "summary": str(item.get("evidence", "") or ""),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed")),
                "confidence": _safe_float(item.get("confidence", 0.0), 0.0),
            },
        )
    for item in list(target_state.get("findings", []) or []):
        if not isinstance(item, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": "finding",
                "host": host_label,
                "label": str(item.get("title", "") or ""),
                "summary": str(item.get("evidence", "") or ""),
                "source_kind": _normalize_source_kind(item.get("source_kind", "observed")),
                "confidence": _safe_float(item.get("confidence", 0.0), 0.0),
            },
        )
    for item in list(target_state.get("manual_tests", []) or []):
        if not isinstance(item, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": "manual_test",
                "host": host_label,
                "label": str(item.get("why", "") or item.get("command", "") or ""),
                "summary": str(item.get("command", "") or ""),
                "source_kind": _normalize_source_kind(item.get("source_kind", "ai_suggested")),
                "confidence": _safe_float(item.get("confidence", 0.0), 0.0),
            },
        )
    for item in list(target_state.get("coverage_gaps", []) or []):
        if not isinstance(item, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": "coverage_gap",
                "host": host_label,
                "label": str(item.get("gap_id", "") or ""),
                "summary": str(item.get("description", "") or ""),
                "source_kind": _normalize_source_kind(item.get("source_kind", "inferred")),
                "confidence": _safe_float(item.get("confidence", 0.0), 0.0),
            },
        )
    for node in list(filtered_graph.get("nodes", []) or []):
        if not isinstance(node, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": f"graph_node:{str(node.get('type', '') or '')}",
                "host": host_label,
                "label": str(node.get("label", "") or node.get("node_id", "") or ""),
                "summary": str(node.get("source_ref", "") or ""),
                "source_kind": _normalize_source_kind(node.get("source_kind", "observed")),
                "confidence": _safe_float(node.get("confidence", 0.0), 0.0),
                "evidence_refs": list(node.get("evidence_refs", []) or []),
            },
        )
    for edge in list(filtered_graph.get("edges", []) or []):
        if not isinstance(edge, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": f"graph_edge:{str(edge.get('type', '') or '')}",
                "host": host_label,
                "label": str(edge.get("type", "") or ""),
                "summary": (f"{str(edge.get('from_node_id', '') or '')} -> {str(edge.get('to_node_id', '') or '')}"),
                "source_kind": _normalize_source_kind(edge.get("source_kind", "observed")),
                "confidence": _safe_float(edge.get("confidence", 0.0), 0.0),
                "evidence_refs": list(edge.get("evidence_refs", []) or []),
            },
        )
    for item in list(notes or []):
        if not isinstance(item, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": "operator_note",
                "host": host_label,
                "label": f"Note #{_safe_int(item.get('id', 0), 0)}",
                "summary": str(item.get("text", "") or ""),
                "source_kind": "operator",
                "confidence": 100.0,
            },
        )
    for item in list(filtered_graph.get("annotations", []) or []):
        if not isinstance(item, dict):
            continue
        _bucket_append(
            buckets,
            {
                "kind": "annotation",
                "host": host_label,
                "label": str(item.get("target_ref", "") or ""),
                "summary": str(item.get("body", "") or ""),
                "source_kind": "operator",
                "confidence": 100.0,
            },
        )
    for key in list(buckets.keys()):
        buckets[key] = _dedupe_dicts(buckets[key], limit=200)
    return buckets
