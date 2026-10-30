import { getValue, setWorkspaceStatus } from "./dom.js";
import { graphPopulateDynamicFilters, graphRenderLayoutOptions, graphWorkspaceEnabled, setGraphStatus } from "./graph_common.js";
import { graphFetchRelatedContent } from "./graph_detail.js";
import { graphCollectServerQuery } from "./graph_filters.js";
import { graphRenderWorkspace } from "./graph_render.js";
import { graphFindEntity } from "./graph_selection.js";
import { graphEntityHostId } from "./graph_viewport.js";
import { fetchJson, postJson } from "./http.js";
import { graphWorkspaceState, workspaceState } from "./state.js";
import { loadHostDetail } from "./workspace_data.js";
import { renderHostSelectionState } from "./workspace_view.js";
/** Workspace graph data. */

export function graphSelectEntity(kind, ref) {
    const entity = kind === "node" ? graphFindEntity("node", ref) : graphFindEntity("edge", ref);
    const relatedHostId = kind === "node" ? graphEntityHostId(entity) : 0;
    if (relatedHostId > 0) {
        const hostChanged = String(workspaceState.selectedHostId || "") !== String(relatedHostId);
        workspaceState.selectedHostId = relatedHostId;
        renderHostSelectionState({syncGraph: false});
        if (hostChanged || !workspaceState.hostDetail) {
            workspaceState.hostDetail = null;
            loadHostDetail(relatedHostId).catch((err) => {
                setWorkspaceStatus(`Load host detail failed: ${err.message}`, true);
            });
        }
    }
    graphWorkspaceState.selectedKind = String(kind || "");
    graphWorkspaceState.selectedRef = String(ref || "");
    graphWorkspaceState.selectedPayload = null;
    graphWorkspaceState.relatedContent = [];
    graphRenderWorkspace();
    graphFetchRelatedContent().catch(() => {});
}


export async function graphLoadMetadata({force = false} = {}) {
    if (!graphWorkspaceEnabled()) {
        return;
    }
    if (graphWorkspaceState.metadataLoaded && !force) {
        graphRenderLayoutOptions();
        return;
    }
    const [layoutsBody, annotationsBody] = await Promise.all([
        fetchJson("/api/graph/layouts"),
        fetchJson("/api/graph/annotations"),
    ]);
    graphWorkspaceState.layouts = Array.isArray(layoutsBody?.layouts) ? layoutsBody.layouts : [];
    graphWorkspaceState.annotations = Array.isArray(annotationsBody?.annotations) ? annotationsBody.annotations : [];
    graphWorkspaceState.metadataLoaded = true;
    const currentViewId = String(getValue("graph-view-select") || graphWorkspaceState.viewId || "attack_surface").trim();
    if (!graphWorkspaceState.activeLayoutId) {
        const defaultLayout = graphWorkspaceState.layouts.find((item) => {
            return String(item?.view_id || "") === currentViewId && String(item?.name || "").trim().toLowerCase() === "default";
        }) || graphWorkspaceState.layouts.find((item) => String(item?.view_id || "") === currentViewId);
        graphWorkspaceState.activeLayoutId = String(defaultLayout?.layout_id || "");
        if (defaultLayout?.layout?.positions && typeof defaultLayout.layout.positions === "object") {
            graphWorkspaceState.positions = {...defaultLayout.layout.positions};
        }
        if (defaultLayout?.layout?.pinned_node_ids && typeof defaultLayout.layout.pinned_node_ids === "object") {
            graphWorkspaceState.pinnedNodeIds = {...defaultLayout.layout.pinned_node_ids};
        }
    }
    graphRenderLayoutOptions();
}


export async function graphLoadSnapshot({background = false, forceMetadata = false} = {}) {
    if (!graphWorkspaceEnabled()) {
        return;
    }
    if (graphWorkspaceState.loading) {
        graphWorkspaceState.needsRefresh = true;
        return;
    }
    graphWorkspaceState.loading = true;
    if (!background) {
        setGraphStatus("Loading graph...");
    }
    try {
        if (!graphWorkspaceState.metadataLoaded || forceMetadata) {
            await graphLoadMetadata({force: forceMetadata});
        }
        const filters = graphCollectServerQuery();
        const params = new URLSearchParams();
        params.set("filter", String(filters.hostFilter || "hide_down"));
        (Array.isArray(filters.serviceFilters) ? filters.serviceFilters : []).forEach((service) => {
            params.append("service", service);
        });
        if (filters.category) {
            params.set("category", filters.category);
        }
        if (filters.hostId > 0) {
            params.set("host_id", String(filters.hostId));
        }
        if (filters.nodeType) {
            params.set("node_type", filters.nodeType);
        }
        if (filters.edgeType) {
            params.set("edge_type", filters.edgeType);
        }
        if (filters.sourceKind) {
            params.set("source_kind", filters.sourceKind);
        }
        if (filters.search) {
            params.set("q", filters.search);
        }
        if (filters.minConfidence > 0) {
            params.set("min_confidence", String(filters.minConfidence));
        }
        if (filters.hideAiSuggested) {
            params.set("hide_ai_suggested", "true");
        }
        if (filters.hideNmapXmlArtifacts) {
            params.set("hide_nmap_xml_artifacts", "true");
        }
        params.set("limit_nodes", "8000");
        params.set("limit_edges", "24000");
        const body = await fetchJson(`/api/graph?${params.toString()}`);
        graphWorkspaceState.data = {
            nodes: Array.isArray(body?.nodes) ? body.nodes : [],
            edges: Array.isArray(body?.edges) ? body.edges : [],
            meta: body?.meta || {},
        };
        graphPopulateDynamicFilters();
        graphRenderLayoutOptions();
        graphRenderWorkspace({preserveDetail: background && Boolean(graphWorkspaceState.selectedKind)});
        if (
            graphWorkspaceState.selectedKind === "node"
            && graphWorkspaceState.selectedRef
            && (!background || !Array.isArray(graphWorkspaceState.relatedContent) || !graphWorkspaceState.relatedContent.length)
        ) {
            graphFetchRelatedContent().catch(() => {});
        }
        if (!background) {
            setGraphStatus(`Graph loaded: ${graphWorkspaceState.filtered.nodes.length} nodes, ${graphWorkspaceState.filtered.edges.length} edges`);
        }
    } catch (err) {
        setGraphStatus(`Graph load failed: ${err.message}`, true);
    } finally {
        graphWorkspaceState.loading = false;
        if (graphWorkspaceState.needsRefresh) {
            graphWorkspaceState.needsRefresh = false;
            graphLoadSnapshot({background: true}).catch(() => {});
        }
    }
}


export function graphScheduleRefresh(delayMs = 900) {
    if (!graphWorkspaceEnabled()) {
        return;
    }
    if (graphWorkspaceState.refreshTimer) {
        window.clearTimeout(graphWorkspaceState.refreshTimer);
    }
    graphWorkspaceState.refreshTimer = window.setTimeout(() => {
        graphWorkspaceState.refreshTimer = null;
        graphLoadSnapshot({background: true}).catch(() => {});
    }, Math.max(100, Number(delayMs) || 900));
}


export async function graphRefreshAction() {
    await graphLoadSnapshot({background: false});
}


export async function graphRebuildAction() {
    const hostId = parseInt(getValue("graph-host-filter"), 10);
    setGraphStatus("Rebuilding graph...");
    try {
        const body = await postJson("/api/graph/rebuild", {
            host_id: Number.isFinite(hostId) && hostId > 0 ? hostId : 0,
        });
        setGraphStatus(`Graph rebuilt: ${Number(body?.mutation_count || 0)} mutations`);
        await graphLoadSnapshot({background: false, forceMetadata: true});
    } catch (err) {
        setGraphStatus(`Graph rebuild failed: ${err.message}`, true);
    }
}
