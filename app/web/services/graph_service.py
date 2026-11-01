from __future__ import annotations
from app.contracts.actions.graph_requests import GraphRebuildRequest, GraphLayoutSaveRequest, GraphAnnotationSaveRequest
from app.web.graph_schema import GraphAnnotationQuery, GraphContentQuery, GraphQuery
from typing import Any, Dict


class GraphService:
    def __init__(self, runtime):
        self.runtime = runtime

    def get_graph(self, args) -> Dict[str, Any]:
        query = GraphQuery.from_args(args)
        return self.runtime.get_evidence_graph(filters=query.filters())

    def rebuild(self, payload: Any) -> Dict[str, Any]:
        request = GraphRebuildRequest.from_payload(payload)
        result = self.runtime.rebuild_evidence_graph(host_id=request.host_id or None)
        return {"status": "ok", **result}

    def get_node_content(self, node_id: str, args) -> Dict[str, Any]:
        query = GraphContentQuery.from_args(args)
        return self.runtime.get_graph_related_content(node_id, max_chars=query.max_chars)

    def get_content(self, node_id: str, args) -> Dict[str, Any]:
        query = GraphContentQuery.from_args(args)
        return self.runtime.get_graph_content(node_id, download=query.download, max_chars=query.max_chars)

    def list_layouts(self) -> Dict[str, Any]:
        return {"layouts": self.runtime.get_evidence_graph_layouts()}

    def save_layout(self, payload: Any) -> Dict[str, Any]:
        request = GraphLayoutSaveRequest.from_payload(payload)
        layout = self.runtime.save_evidence_graph_layout(
            view_id=request.view_id,
            name=request.name or "default",
            layout_state=request.layout_state,
            layout_id=request.layout_id,
        )
        return {"status": "ok", "layout": layout}

    def list_annotations(self, args) -> Dict[str, Any]:
        query = GraphAnnotationQuery.from_args(args)
        annotations = self.runtime.get_evidence_graph_annotations(
            target_ref=query.target_ref,
            target_kind=query.target_kind,
        )
        return {"annotations": annotations}

    def save_annotation(self, payload: Any) -> Dict[str, Any]:
        request = GraphAnnotationSaveRequest.from_payload(payload)
        annotation = self.runtime.save_evidence_graph_annotation(
            target_kind=request.target_kind,
            target_ref=request.target_ref,
            body=request.body,
            created_by=request.created_by,
            source_ref=request.source_ref,
            annotation_id=request.annotation_id,
        )
        return {"status": "ok", "annotation": annotation}
