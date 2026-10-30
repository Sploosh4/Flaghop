/** Workspace graph render. */
import { setText } from "./dom.js";
import { getGraphCanvasScrollNode, graphCreateSvgNode, graphEdgeStrokeColor, graphFriendlyLabel, graphNodeColor, graphNodeFillColor, graphPropertyValue, graphSelectedNodeEntity, graphSourceStyle, graphSplitLabel, opaqueUiEnabled } from "./graph_common.js";
import { graphRenderSelectionDetail, graphSyncDetailPresentation } from "./graph_detail.js";
import { graphApplyLocalFilters } from "./graph_filters.js";
import { graphFindEntity, graphNodeMatchesSelectedHost, graphShouldShowGroupLabels, graphShouldShowNodeLabel, graphShouldShowNodeTypeLabel, graphUpdateViewport } from "./graph_viewport.js";
import { GRAPH_EDGE_HIGHLIGHT_COLOR, GRAPH_NODE_SIZE, GRAPH_WORKSPACE_DEFAULT_HEIGHT, graphWorkspaceState } from "./state.js";

export function graphRenderMatrixView(filtered) {
    const container = document.getElementById("graph-matrix-view");
    if (!container) {
        return;
    }
    const matrix = filtered?.matrix || {};
    const groups = Array.isArray(matrix.groups) ? matrix.groups : [];
    const values = Array.isArray(matrix.values) ? matrix.values : [];
    const maxValue = Math.max(1, Number(matrix.maxValue || 0));
    container.innerHTML = "";
    if (!groups.length || !values.length) {
        const empty = document.createElement("p");
        empty.className = "text-muted";
        empty.textContent = "No dense matrix data is available for the current filters.";
        container.appendChild(empty);
        return;
    }

    const note = document.createElement("p");
    note.className = "graph-matrix-note";
    note.textContent = "Dense matrix fallback: group-to-group relationship intensity";
    container.appendChild(note);

    const table = document.createElement("table");
    table.className = "graph-matrix-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.textContent = "Source";
    headRow.appendChild(corner);
    groups.forEach((group) => {
        const th = document.createElement("th");
        th.textContent = group.label || group.key || "";
        th.title = `${group.label || group.key || ""} (${group.nodeCount || 0} nodes)`;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    groups.forEach((rowGroup, rowIndex) => {
        const row = document.createElement("tr");
        const rowLabel = document.createElement("th");
        rowLabel.textContent = rowGroup.label || rowGroup.key || "";
        rowLabel.title = `${rowGroup.label || rowGroup.key || ""} (${rowGroup.nodeCount || 0} nodes)`;
        row.appendChild(rowLabel);
        groups.forEach((columnGroup, columnIndex) => {
            const count = Number(values?.[rowIndex]?.[columnIndex] || 0);
            const intensity = count > 0 ? Math.max(0.08, Math.min(1, count / maxValue)) : 0;
            const cell = document.createElement("td");
            cell.className = "graph-matrix-cell";
            cell.title = `${rowGroup.label || rowGroup.key || ""} -> ${columnGroup.label || columnGroup.key || ""}: ${count}`;
            cell.style.background = count > 0
                ? `rgba(126, 227, 203, ${Math.max(0.12, intensity * 0.88)})`
                : "rgba(255, 255, 255, 0.03)";
            cell.textContent = count > 0 ? String(count) : "";
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}


export function graphRenderWorkspace({preserveDetail = false} = {}) {
    const svg = document.getElementById("graph-workspace-canvas");
    const emptyNode = document.getElementById("graph-workspace-empty");
    const matrixNode = document.getElementById("graph-matrix-view");
    if (!svg || !emptyNode || !matrixNode) {
        return;
    }
    const filtered = graphApplyLocalFilters(graphWorkspaceState.data);
    graphWorkspaceState.filtered = filtered;
    const nodes = filtered.nodes || [];
    const edges = filtered.edges || [];
    const positions = filtered.positions || {};

    let selectionCleared = false;
    const selectedEntity = graphWorkspaceState.selectedKind === "node"
        ? graphSelectedNodeEntity()
        : graphFindEntity(graphWorkspaceState.selectedKind, graphWorkspaceState.selectedRef);
    if (graphWorkspaceState.selectedKind && !selectedEntity) {
        graphWorkspaceState.selectedKind = "";
        graphWorkspaceState.selectedRef = "";
        graphWorkspaceState.selectedPayload = null;
        graphWorkspaceState.relatedContent = [];
        selectionCleared = true;
    }

    setText(
        "graph-workspace-summary",
        `${nodes.length} visible nodes | ${edges.length} visible edges | ${Number(filtered?.meta?.baseNodeCount || graphWorkspaceState.data?.meta?.total_nodes || nodes.length)} filtered nodes`
        + `${filtered?.meta?.summaryUsed ? " | summary mode" : ""}`
        + `${filtered?.renderKind === "matrix" ? " | matrix fallback" : ""}`
        + `${filtered?.meta?.focusActive ? ` | focus ${filtered.meta.focusDepth} hop` : ""}`,
    );

    if (!nodes.length) {
        matrixNode.hidden = true;
        svg.innerHTML = "";
        svg.setAttribute("viewBox", "0 0 1600 900");
        svg.style.width = "100%";
        svg.style.height = `${Math.max(520, Number(getGraphCanvasScrollNode()?.clientHeight || GRAPH_WORKSPACE_DEFAULT_HEIGHT))}px`;
        graphWorkspaceState.viewport = null;
        svg.hidden = false;
        emptyNode.hidden = false;
        graphRenderSelectionDetail();
        graphSyncDetailPresentation();
        return;
    }

    emptyNode.hidden = true;
    if (filtered.renderKind === "matrix") {
        svg.hidden = true;
        matrixNode.hidden = false;
        graphRenderMatrixView(filtered);
        if (!preserveDetail || selectionCleared || !graphWorkspaceState.selectedKind) {
            graphRenderSelectionDetail();
        }
        graphSyncDetailPresentation();
        return;
    }

    matrixNode.hidden = true;
    matrixNode.innerHTML = "";
    svg.hidden = false;
    svg.innerHTML = "";
    const showGroupLabels = graphShouldShowGroupLabels();

    const defs = graphCreateSvgNode("defs");
    defs.appendChild(graphCreateSvgNode("marker", {
        id: "graph-arrow",
        markerWidth: 8,
        markerHeight: 8,
        refX: 7,
        refY: 4,
        orient: "auto",
        markerUnits: "strokeWidth",
    }));
    const arrow = graphCreateSvgNode("path", {
        d: "M0,0 L8,4 L0,8 z",
        fill: "rgba(121, 133, 158, 0.65)",
    });
    defs.firstChild.appendChild(arrow);
    defs.appendChild(graphCreateSvgNode("marker", {
        id: "graph-arrow-highlight",
        markerWidth: 9,
        markerHeight: 9,
        refX: 8,
        refY: 4.5,
        orient: "auto",
        markerUnits: "strokeWidth",
    }));
    const highlightArrow = graphCreateSvgNode("path", {
        d: "M0,0 L9,4.5 L0,9 z",
        fill: GRAPH_EDGE_HIGHLIGHT_COLOR,
    });
    defs.lastChild.appendChild(highlightArrow);
    svg.appendChild(defs);

    (filtered.groups || []).forEach((group) => {
        const groupNode = graphCreateSvgNode("g", {
            "class": "graph-group",
            "data-graph-group-key": group.key || "",
        });
        groupNode.appendChild(graphCreateSvgNode("rect", {
            x: group.x,
            y: group.y,
            width: group.width,
            height: group.height,
            rx: 18,
            fill: opaqueUiEnabled() ? "#131313" : "rgba(19, 19, 19, 0.75)",
            stroke: "rgba(160, 160, 160, 0.16)",
            "data-graph-group-key": group.key || "",
        }));
        if (showGroupLabels) {
            groupNode.appendChild(graphCreateSvgNode("text", {
                x: group.x + 16,
                y: group.y + 28,
                "class": "graph-group-label",
                "data-graph-group-key": group.key || "",
            }, group.label));
        }
        svg.appendChild(groupNode);
    });

    const selectedNodeId = graphWorkspaceState.selectedKind === "node"
        ? String(graphWorkspaceState.selectedRef || "")
        : "";
    const selectedEdgeId = graphWorkspaceState.selectedKind === "edge"
        ? String(graphWorkspaceState.selectedRef || "")
        : "";
    const orderedEdges = [...edges].sort((left, right) => {
        const leftId = String(left?.edge_id || "");
        const rightId = String(right?.edge_id || "");
        const leftPriority = selectedEdgeId && leftId === selectedEdgeId
            ? 2
            : (selectedNodeId && (String(left?.from_node_id || "") === selectedNodeId || String(left?.to_node_id || "") === selectedNodeId) ? 1 : 0);
        const rightPriority = selectedEdgeId && rightId === selectedEdgeId
            ? 2
            : (selectedNodeId && (String(right?.from_node_id || "") === selectedNodeId || String(right?.to_node_id || "") === selectedNodeId) ? 1 : 0);
        return leftPriority - rightPriority;
    });

    orderedEdges.forEach((edge) => {
        const sourcePosition = positions[String(edge?.from_node_id || "")];
        const targetPosition = positions[String(edge?.to_node_id || "")];
        if (!sourcePosition || !targetPosition) {
            return;
        }
        const startX = sourcePosition.x + GRAPH_NODE_SIZE.width;
        const startY = sourcePosition.y + (GRAPH_NODE_SIZE.height / 2);
        const endX = targetPosition.x;
        const endY = targetPosition.y + (GRAPH_NODE_SIZE.height / 2);
        const controlOffset = Math.max(36, Math.min(140, Math.abs(endX - startX) / 2));
        const curveDirection = endX >= startX ? 1 : -1;
        const pathData = [
            `M ${startX} ${startY}`,
            `C ${startX + (controlOffset * curveDirection)} ${startY}`,
            `${endX - (controlOffset * curveDirection)} ${endY}`,
            `${endX} ${endY}`,
        ].join(" ");
        const edgeId = String(edge?.edge_id || "");
        const isSelected = selectedEdgeId && selectedEdgeId === edgeId;
        const isConnectedToSelectedNode = Boolean(
            selectedNodeId
            && (String(edge?.from_node_id || "") === selectedNodeId || String(edge?.to_node_id || "") === selectedNodeId)
        );
        const style = graphSourceStyle(edge);
        const aggregateCount = Math.max(1, Number(graphPropertyValue(edge, "aggregate_count") || 1));
        const strokeWidth = isSelected
            ? 4.2
            : (isConnectedToSelectedNode ? Math.min(6.8, 2.5 + Math.log2(aggregateCount + 1)) : Math.min(4.2, 1.05 + (Math.log2(aggregateCount + 1) * 0.7)));
        const opacity = isSelected
            ? 1
            : (isConnectedToSelectedNode ? 0.98 : Math.max(0.18, Math.min(0.34, 0.16 + (Math.log2(aggregateCount + 1) * 0.045))));
        const stroke = isSelected
            ? "#eef1ff"
            : (isConnectedToSelectedNode ? GRAPH_EDGE_HIGHLIGHT_COLOR : graphEdgeStrokeColor(edge));
        const markerEnd = isSelected || isConnectedToSelectedNode
            ? "url(#graph-arrow-highlight)"
            : "url(#graph-arrow)";
        svg.appendChild(graphCreateSvgNode("path", {
            d: pathData,
            stroke: "transparent",
            fill: "none",
            "stroke-width": 12,
            "data-graph-edge-id": edge.edge_id || "",
            "class": "graph-edge-hitbox",
        }));
        svg.appendChild(graphCreateSvgNode("path", {
            d: pathData,
            stroke,
            fill: "none",
            "stroke-width": strokeWidth,
            "stroke-dasharray": style.dash,
            "marker-end": markerEnd,
            opacity,
            "data-graph-edge-id": edge.edge_id || "",
            "class": `graph-edge${isSelected ? " is-selected" : ""}${isConnectedToSelectedNode ? " is-connected-selected" : ""}`,
        }));
    });

    nodes.forEach((node) => {
        const nodeId = String(node?.node_id || "");
        const point = positions[nodeId];
        if (!point) {
            return;
        }
        const style = graphSourceStyle(node);
        const color = graphNodeColor(node);
        const isSelected = graphWorkspaceState.selectedKind === "node" && String(graphWorkspaceState.selectedRef || "") === nodeId;
        const isHostSelected = graphNodeMatchesSelectedHost(node);
        const isSummaryNode = Boolean(graphPropertyValue(node, "summary_kind"));
        const showNodeTypeLabel = graphShouldShowNodeTypeLabel({isSelected, isHostSelected, isSummaryNode});
        const showNodeLabel = graphShouldShowNodeLabel({isSelected, isHostSelected, isSummaryNode});
        const groupNode = graphCreateSvgNode("g", {
            transform: `translate(${point.x}, ${point.y})`,
            "data-graph-node-id": nodeId,
            "class": `graph-node${isSelected ? " is-selected" : ""}${isHostSelected ? " is-host-selected" : ""}${isSummaryNode ? " is-summary" : ""}`,
        });
        groupNode.appendChild(graphCreateSvgNode("rect", {
            width: GRAPH_NODE_SIZE.width,
            height: GRAPH_NODE_SIZE.height,
            rx: 14,
            fill: graphNodeFillColor(node),
            stroke: isSelected ? "#eef1ff" : color,
            "stroke-width": isSelected ? 2.8 : 1.8,
            "data-graph-node-id": nodeId,
        }));
        groupNode.appendChild(graphCreateSvgNode("rect", {
            x: 10,
            y: 9,
            width: 8,
            height: GRAPH_NODE_SIZE.height - 18,
            rx: 4,
            fill: color,
            opacity: 0.9,
            "data-graph-node-id": nodeId,
        }));
        if (showNodeTypeLabel) {
            groupNode.appendChild(graphCreateSvgNode("text", {
                x: 28,
                y: 18,
                "class": "graph-node-type",
                "data-graph-node-id": nodeId,
            }, graphFriendlyLabel(node.type || "")));
        }
        if (showNodeLabel) {
            const labelNode = graphCreateSvgNode("text", {
                x: 28,
                y: showNodeTypeLabel ? 34 : 30,
                "class": "graph-node-label",
                "data-graph-node-id": nodeId,
            });
            graphSplitLabel(node.label || nodeId).forEach((line, index) => {
                const tspan = graphCreateSvgNode("tspan", {
                    x: 28,
                    dy: index === 0 ? 0 : 14,
                    "data-graph-node-id": nodeId,
                }, line);
                labelNode.appendChild(tspan);
            });
            groupNode.appendChild(labelNode);
        }
        if (graphWorkspaceState.pinnedNodeIds[nodeId]) {
            groupNode.appendChild(graphCreateSvgNode("circle", {
                cx: GRAPH_NODE_SIZE.width - 16,
                cy: 14,
                r: 5,
                fill: "#eef1ff",
                opacity: 0.9,
                "data-graph-node-id": nodeId,
            }));
        }
        if (isSummaryNode) {
            groupNode.appendChild(graphCreateSvgNode("circle", {
                cx: GRAPH_NODE_SIZE.width - 16,
                cy: GRAPH_NODE_SIZE.height - 14,
                r: 7,
                fill: color,
                opacity: 0.95,
                "data-graph-node-id": nodeId,
            }));
        }
        svg.appendChild(groupNode);
    });

    graphUpdateViewport(filtered.width, filtered.height);

    if (!preserveDetail || selectionCleared || !graphWorkspaceState.selectedKind) {
        graphRenderSelectionDetail();
    }
    graphSyncDetailPresentation();
}
