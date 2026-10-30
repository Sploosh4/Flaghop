import { getChecked, getValue } from "./dom.js";
import { graphCurrentViewConfig, graphEntityMatchesPack, graphEntityMatchesSeverity, graphEntityMatchesTimeWindow, graphTimeWindowCutoff } from "./graph_common.js";
import { graphBuildHostMaps, graphComputeCompactLayout, graphGroupKeyForNode, graphSortNodes } from "./graph_layout.js";
import { graphBuildLargeGraphProjection, graphComputeFocusedSubgraph, graphComputeMatrixView, graphShouldUseMatrixMode, graphShouldUseSummaryMode } from "./graph_projection.js";
import { selectedHostServiceFilters } from "./host_filters.js";
import { graphWorkspaceState, workspaceState } from "./state.js";
/** Workspace graph filters. */

export function graphCollectServerQuery() {
    graphWorkspaceState.viewId = String(getValue("graph-view-select") || graphWorkspaceState.viewId || "attack_surface").trim();
    graphWorkspaceState.groupBy = String(getValue("graph-group-select") || graphWorkspaceState.groupBy || graphCurrentViewConfig().defaultGroup || "subnet").trim();
    graphWorkspaceState.renderMode = String(getValue("graph-render-mode-select") || graphWorkspaceState.renderMode || "auto").trim().toLowerCase();
    graphWorkspaceState.focusDepth = Math.max(1, Math.min(3, parseInt(getValue("graph-focus-depth-select"), 10) || graphWorkspaceState.focusDepth || 1));
    const hostId = parseInt(getValue("graph-host-filter"), 10);
    const minConfidence = Math.max(0, Math.min(100, parseInt(getValue("graph-min-confidence"), 10) || 0));
    return {
        viewId: graphWorkspaceState.viewId,
        groupBy: graphWorkspaceState.groupBy,
        renderMode: graphWorkspaceState.renderMode,
        focusDepth: graphWorkspaceState.focusDepth,
        hostId: Number.isFinite(hostId) && hostId > 0 ? hostId : 0,
        hostFilter: String(workspaceState.hostFilter || "hide_down").trim().toLowerCase() === "show_all"
            ? "show_all"
            : "hide_down",
        serviceFilters: selectedHostServiceFilters(),
        category: String(workspaceState.hostCategoryFilter || "").trim(),
        nodeType: String(getValue("graph-node-type-filter") || "").trim().toLowerCase(),
        edgeType: String(getValue("graph-edge-type-filter") || "").trim().toLowerCase(),
        sourceKind: String(getValue("graph-source-kind-filter") || "").trim().toLowerCase(),
        severity: String(getValue("graph-severity-filter") || "").trim().toLowerCase(),
        pack: String(getValue("graph-pack-filter") || "").trim().toLowerCase(),
        timeWindow: String(getValue("graph-time-window-filter") || "all").trim().toLowerCase(),
        search: String(getValue("graph-search-input") || "").trim(),
        minConfidence,
        hideAiSuggested: getChecked("graph-hide-ai-suggested"),
        hideNmapXmlArtifacts: getChecked("graph-hide-nmap-xml-artifacts"),
    };
}


export function graphApplyLocalFilters(snapshot) {
    const viewConfig = graphCurrentViewConfig();
    const filters = graphCollectServerQuery();
    const sourceKind = filters.sourceKind;
    const nodeType = filters.nodeType;
    const edgeType = filters.edgeType;
    const severity = filters.severity;
    const pack = filters.pack;
    const cutoff = graphTimeWindowCutoff(filters.timeWindow);

    let nodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes.slice() : [];
    let edges = Array.isArray(snapshot?.edges) ? snapshot.edges.slice() : [];

    if (Array.isArray(viewConfig.nodeTypes) && viewConfig.nodeTypes.length > 0) {
        const allowedNodeTypes = new Set(viewConfig.nodeTypes);
        nodes = nodes.filter((item) => allowedNodeTypes.has(String(item?.type || "").trim().toLowerCase()));
    }
    let nodeIds = new Set(nodes.map((item) => String(item?.node_id || "")));
    if (Array.isArray(viewConfig.edgeTypes) && viewConfig.edgeTypes.length > 0) {
        const allowedEdgeTypes = new Set(viewConfig.edgeTypes);
        edges = edges.filter((item) => allowedEdgeTypes.has(String(item?.type || "").trim().toLowerCase()));
    }
    edges = edges.filter((item) => nodeIds.has(String(item?.from_node_id || "")) && nodeIds.has(String(item?.to_node_id || "")));

    const nodeFocusActive = Boolean(sourceKind || nodeType || severity || pack || cutoff);
    const edgeFocusActive = Boolean(sourceKind || edgeType || severity || pack || cutoff);
    const nodePredicate = (item) => {
        const matchesSource = !sourceKind || String(item?.source_kind || "").trim().toLowerCase() === sourceKind;
        const matchesType = !nodeType || String(item?.type || "").trim().toLowerCase() === nodeType;
        return matchesSource
            && matchesType
            && graphEntityMatchesSeverity(item, severity)
            && graphEntityMatchesPack(item, pack)
            && graphEntityMatchesTimeWindow(item, cutoff);
    };
    const edgePredicate = (item) => {
        const matchesSource = !sourceKind || String(item?.source_kind || "").trim().toLowerCase() === sourceKind;
        const matchesType = !edgeType || String(item?.type || "").trim().toLowerCase() === edgeType;
        return matchesSource
            && matchesType
            && graphEntityMatchesSeverity(item, severity)
            && graphEntityMatchesPack(item, pack)
            && graphEntityMatchesTimeWindow(item, cutoff);
    };

    const keptNodeIds = new Set(
        nodeFocusActive
            ? nodes.filter(nodePredicate).map((item) => String(item?.node_id || ""))
            : nodes.map((item) => String(item?.node_id || ""))
    );
    const keptEdges = edgeFocusActive ? edges.filter(edgePredicate) : edges.slice();
    if (edgeFocusActive) {
        keptEdges.forEach((item) => {
            keptNodeIds.add(String(item?.from_node_id || ""));
            keptNodeIds.add(String(item?.to_node_id || ""));
        });
    }

    nodes = nodes.filter((item) => keptNodeIds.has(String(item?.node_id || "")));
    nodeIds = new Set(nodes.map((item) => String(item?.node_id || "")));
    edges = keptEdges.filter((item) => nodeIds.has(String(item?.from_node_id || "")) && nodeIds.has(String(item?.to_node_id || "")));

    const baseNodeCount = nodes.length;
    const baseEdgeCount = edges.length;
    const focused = graphComputeFocusedSubgraph(nodes, edges, graphWorkspaceState.focusSeedNodeIds, filters.focusDepth);
    nodes = focused.nodes;
    edges = focused.edges;

    const hostMaps = graphBuildHostMaps(nodes);
    let groupsMap = new Map();
    let largeGraphMode = graphShouldUseSummaryMode(nodes.length, edges.length, filters.renderMode);
    let summaryUsed = false;
    let summaryNodeIds = new Set();

    if (largeGraphMode) {
        const projection = graphBuildLargeGraphProjection(
            nodes,
            edges,
            hostMaps,
            filters.groupBy || viewConfig.defaultGroup || "subnet",
        );
        nodes = projection.nodes;
        edges = projection.edges;
        groupsMap = projection.groupsMap;
        summaryUsed = Boolean(projection.usedSummary);
        summaryNodeIds = projection.summaryNodeIds || new Set();
    } else {
        nodes.sort(graphSortNodes).forEach((item) => {
            const key = graphGroupKeyForNode(item, filters.groupBy || viewConfig.defaultGroup || "subnet", hostMaps) || "other";
            if (!groupsMap.has(key)) {
                groupsMap.set(key, []);
            }
            groupsMap.get(key).push(item);
        });
    }

    const layout = graphComputeCompactLayout(
        nodes,
        edges,
        groupsMap,
        filters.groupBy || viewConfig.defaultGroup || "subnet",
        graphWorkspaceState.positions,
    );

    const renderKind = graphShouldUseMatrixMode(nodes.length, edges.length, filters.renderMode) && (layout.groups || []).length > 2
        ? "matrix"
        : "graph";
    const matrix = renderKind === "matrix"
        ? graphComputeMatrixView(nodes, edges, layout.groups || [])
        : null;

    return {
        nodes,
        edges,
        groups: layout.groups,
        positions: layout.positions,
        width: layout.width,
        height: layout.height,
        renderKind,
        matrix,
        meta: {
            largeGraphMode,
            summaryUsed,
            focusActive: focused.active,
            focusDepth: filters.focusDepth,
            baseNodeCount,
            baseEdgeCount,
            summaryNodeCount: summaryNodeIds.size,
        },
    };
}
