"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from app.api.dependencies import Runtime, native_router
from app.contracts.actions.graph_requests import GraphAnnotationSaveRequest, GraphLayoutSaveRequest, GraphRebuildRequest
from app.contracts.actions.mutation_results import GraphAnnotationResult, GraphLayoutResult, GraphRebuildResult
from app.web.http_utils import json_error
from app.web.services.graph_service import GraphService
from fastapi import Request
from fastapi.responses import FileResponse, Response
from urllib.parse import quote

router = native_router()


@router.get("/api/graph/content/{node_id:path}", operation_id="evidence_graph_content")
def evidence_graph_content(node_id: str, request: Request, runtime: Runtime):
    try:
        payload = GraphService(runtime).get_content(node_id, request.query_params)
        mimetype = payload.get("mimetype") or "application/octet-stream"
        filename = payload.get("filename") or "graph-content.txt"
        if payload.get("path"):
            return FileResponse(
                payload["path"], media_type=mimetype, filename=filename if payload.get("download") else None
            )
        headers = {}
        if payload.get("download"):
            encoded = quote(filename)
            headers["Content-Disposition"] = (
                f"attachment; filename*=utf-8''{encoded}"
                if encoded != filename
                else f'attachment; filename="{filename}"'
            )
        return Response(payload.get("text") or "", media_type=mimetype, headers=headers)
    except (KeyError, FileNotFoundError) as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/graph", operation_id="evidence_graph")
def evidence_graph(request: Request, runtime: Runtime):
    service = GraphService(runtime)
    try:
        return service.get_graph(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/graph/rebuild",
    operation_id="evidence_graph_rebuild",
    response_model=GraphRebuildResult,
    response_model_exclude_unset=True,
)
def evidence_graph_rebuild(request: Request, runtime: Runtime, payload: GraphRebuildRequest):
    service = GraphService(runtime)
    try:
        return service.rebuild(payload)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/graph/nodes/{node_id:path}/content", operation_id="evidence_graph_node_content")
def evidence_graph_node_content(node_id: str, request: Request, runtime: Runtime):
    service = GraphService(runtime)
    try:
        return service.get_node_content(node_id, request.query_params)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/graph/layouts", operation_id="evidence_graph_layouts")
def evidence_graph_layouts(request: Request, runtime: Runtime):
    service = GraphService(runtime)
    try:
        return service.list_layouts()
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/graph/layouts",
    operation_id="evidence_graph_save_layout",
    response_model=GraphLayoutResult,
    response_model_exclude_unset=True,
)
def evidence_graph_save_layout(request: Request, runtime: Runtime, payload: GraphLayoutSaveRequest):
    service = GraphService(runtime)
    try:
        return service.save_layout(payload)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/graph/annotations", operation_id="evidence_graph_annotations")
def evidence_graph_annotations(request: Request, runtime: Runtime):
    service = GraphService(runtime)
    try:
        return service.list_annotations(request.query_params)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/graph/annotations",
    operation_id="evidence_graph_save_annotation",
    response_model=GraphAnnotationResult,
    response_model_exclude_unset=True,
)
def evidence_graph_save_annotation(request: Request, runtime: Runtime, payload: GraphAnnotationSaveRequest):
    service = GraphService(runtime)
    try:
        return service.save_annotation(payload)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
