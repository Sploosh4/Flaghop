"""Graph operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_graph as web_runtime_graph


class GraphRuntime:
    get_evidence_graph = web_runtime_graph.get_evidence_graph

    _get_graph_snapshot_locked = web_runtime_graph.get_graph_snapshot_locked

    get_graph_related_content = web_runtime_graph.get_graph_related_content

    get_graph_content = web_runtime_graph.get_graph_content

    rebuild_evidence_graph = web_runtime_graph.rebuild_evidence_graph_for_runtime

    get_evidence_graph_layouts = web_runtime_graph.get_evidence_graph_layouts

    save_evidence_graph_layout = web_runtime_graph.save_evidence_graph_layout

    get_evidence_graph_annotations = web_runtime_graph.get_evidence_graph_annotations

    save_evidence_graph_annotation = web_runtime_graph.save_evidence_graph_annotation
