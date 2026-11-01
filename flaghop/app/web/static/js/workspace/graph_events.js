import { setValue } from "./dom.js";
import { graphApplyLayoutById, graphResetLayoutAction, graphToggleExpandSelectionAction } from "./graph_actions.js";
import { graphHasActiveSelection, graphPropertyValue, graphRenderLayoutOptions, graphSvgPoint, graphUpdateConfidenceLabel, graphUpdateHostFilterOptions, graphUpdateZoomLabel, graphWorkspaceEnabled, setGraphStatus } from "./graph_common.js";
import { graphLoadSnapshot, graphSelectEntity } from "./graph_data.js";
import { graphDismissSelection, graphSyncDetailPresentation } from "./graph_detail.js";
import { graphRenderWorkspace } from "./graph_render.js";
import { graphFindEntity } from "./graph_selection.js";
import { graphClampViewportCenter, graphFindGroup, graphUpdateViewport } from "./graph_viewport.js";
import { GRAPH_VIEW_PRESETS, graphWorkspaceState } from "./state.js";
/** Workspace graph events. */

export function graphHandlePointerMove(event) {
    if (!graphWorkspaceState.drag) {
        return;
    }
    event.preventDefault();
    const deltaX = Number(event.clientX || 0) - Number(graphWorkspaceState.drag.startClientX || 0);
    const deltaY = Number(event.clientY || 0) - Number(graphWorkspaceState.drag.startClientY || 0);
    if (!graphWorkspaceState.drag.active && Math.hypot(deltaX, deltaY) < 4) {
        return;
    }
    graphWorkspaceState.drag.active = true;
    if (graphWorkspaceState.drag.kind === "pan") {
        const svg = document.getElementById("graph-workspace-canvas");
        const viewport = graphWorkspaceState.drag.viewport || graphWorkspaceState.viewport;
        if (!svg || !viewport) {
            return;
        }
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return;
        }
        const unitsPerPixelX = Number(viewport.width || 1) / Math.max(1, rect.width);
        const unitsPerPixelY = Number(viewport.height || 1) / Math.max(1, rect.height);
        const nextCenter = graphClampViewportCenter(
            Number(graphWorkspaceState.drag.startCenterX || viewport.centerX || 0) - (deltaX * unitsPerPixelX) - (viewport.boundsX || 0),
            Number(graphWorkspaceState.drag.startCenterY || viewport.centerY || 0) - (deltaY * unitsPerPixelY) - (viewport.boundsY || 0),
            viewport.boundsWidth,
            viewport.boundsHeight,
            viewport.width,
            viewport.height,
        );
        nextCenter.x += viewport.boundsX || 0; nextCenter.y += viewport.boundsY || 0;
        const viewX = nextCenter.x - (Number(viewport.width || 1) / 2);
        const viewY = nextCenter.y - (Number(viewport.height || 1) / 2);
        graphWorkspaceState.viewport = {
            ...viewport,
            x: viewX,
            y: viewY,
            centerX: nextCenter.x,
            centerY: nextCenter.y,
        };
        document.body.classList.add("graph-workspace-panning");
        svg.setAttribute("viewBox", `${viewX} ${viewY} ${viewport.width} ${viewport.height}`);
        if (graphWorkspaceState.detailMode === "floating" && graphHasActiveSelection()) {
            graphSyncDetailPresentation();
        }
        return;
    }
    const svg = document.getElementById("graph-workspace-canvas");
    if (!svg) {
        return;
    }
    const point = graphSvgPoint(svg, event);
    const offsetX = Number(point.x || 0) - Number(graphWorkspaceState.drag.startPointX || 0);
    const offsetY = Number(point.y || 0) - Number(graphWorkspaceState.drag.startPointY || 0);
    Object.entries(graphWorkspaceState.drag.initialPositions || {}).forEach(([nodeId, origin]) => {
        graphWorkspaceState.positions[nodeId] = {
            x: Math.max(20, Math.round((Number(origin?.x) || 0) + offsetX)),
            y: Math.max(28, Math.round((Number(origin?.y) || 0) + offsetY)),
        };
    });
    graphRenderWorkspace({preserveDetail: true});
}


export function graphHandlePointerUp() {
    if (!graphWorkspaceState.drag) {
        return;
    }
    const wasActive = Boolean(graphWorkspaceState.drag.active);
    document.body.classList.remove("graph-workspace-panning");
    window.removeEventListener("pointermove", graphHandlePointerMove);
    window.removeEventListener("pointerup", graphHandlePointerUp);
    graphWorkspaceState.drag = null;
    if (wasActive) {
        graphWorkspaceState.suppressClickUntil = Date.now() + 180;
    }
}


export function bindGraphWorkspaceEvents() {
    if (!graphWorkspaceEnabled()) {
        return;
    }
    const refreshIds = [
        "graph-view-select",
        "graph-group-select",
        "graph-render-mode-select",
        "graph-host-filter",
        "graph-node-type-filter",
        "graph-edge-type-filter",
        "graph-source-kind-filter",
        "graph-severity-filter",
        "graph-pack-filter",
        "graph-time-window-filter",
    ];
    refreshIds.forEach((id) => {
        const node = document.getElementById(id);
        if (!node) {
            return;
        }
        node.addEventListener("change", async (event) => {
            if (id === "graph-view-select") {
                const viewId = String(event.target.value || "attack_surface").trim();
                const viewConfig = GRAPH_VIEW_PRESETS[viewId] || GRAPH_VIEW_PRESETS.attack_surface;
                setValue("graph-group-select", viewConfig.defaultGroup || "finding");
                graphWorkspaceState.activeLayoutId = "";
                graphWorkspaceState.positions = {};
                graphWorkspaceState.pinnedNodeIds = {};
                graphRenderLayoutOptions();
            }
            if (["graph-group-select", "graph-render-mode-select", "graph-severity-filter", "graph-pack-filter", "graph-time-window-filter"].includes(id)) {
                graphRenderWorkspace();
                return;
            }
            await graphLoadSnapshot({background: false});
        });
    });

    const searchNode = document.getElementById("graph-search-input");
    if (searchNode) {
        let searchTimer = null;
        searchNode.addEventListener("input", () => {
            if (searchTimer) {
                window.clearTimeout(searchTimer);
            }
            searchTimer = window.setTimeout(() => {
                graphLoadSnapshot({background: false}).catch(() => {});
            }, 350);
        });
    }

    const confidenceNode = document.getElementById("graph-min-confidence");
    if (confidenceNode) {
        confidenceNode.addEventListener("input", () => {
            graphUpdateConfidenceLabel();
            graphLoadSnapshot({background: false}).catch(() => {});
        });
    }

    const zoomNode = document.getElementById("graph-zoom-slider");
    if (zoomNode) {
        zoomNode.addEventListener("input", () => {
            graphUpdateZoomLabel();
            graphRenderWorkspace();
        });
    }

    const focusDepthNode = document.getElementById("graph-focus-depth-select");
    if (focusDepthNode) {
        focusDepthNode.addEventListener("change", () => {
            graphWorkspaceState.focusDepth = Math.max(1, Math.min(3, parseInt(focusDepthNode.value, 10) || 1));
            if (graphWorkspaceState.focusSeedNodeIds.length) {
                graphRenderWorkspace();
            }
        });
    }

    ["graph-hide-ai-suggested", "graph-hide-nmap-xml-artifacts"].forEach((id) => {
        const node = document.getElementById(id);
        if (!node) {
            return;
        }
        node.addEventListener("change", () => {
            graphLoadSnapshot({background: false}).catch(() => {});
        });
    });

    const layoutSelect = document.getElementById("graph-layout-select");
    if (layoutSelect) {
        layoutSelect.addEventListener("change", () => {
            const layoutId = String(layoutSelect.value || "");
            if (!layoutId) {
                graphResetLayoutAction();
                return;
            }
            graphApplyLayoutById(layoutId);
            setGraphStatus("Layout loaded");
        });
    }

    const svg = document.getElementById("graph-workspace-canvas");
    if (svg) {
        svg.addEventListener("click", (event) => {
            if (Number(graphWorkspaceState.suppressClickUntil || 0) > Date.now()) {
                return;
            }
            const nodeTarget = event.target.closest("[data-graph-node-id]");
            if (nodeTarget) {
                graphSelectEntity("node", nodeTarget.getAttribute("data-graph-node-id"));
                return;
            }
            const edgeTarget = event.target.closest("[data-graph-edge-id]");
            if (edgeTarget) {
                graphSelectEntity("edge", edgeTarget.getAttribute("data-graph-edge-id"));
                return;
            }
            const groupTarget = event.target.closest("[data-graph-group-key]");
            if (groupTarget) {
                return;
            }
            graphDismissSelection();
        });
        svg.addEventListener("dblclick", (event) => {
            const nodeTarget = event.target.closest("[data-graph-node-id]");
            if (!nodeTarget) {
                return;
            }
            const nodeId = String(nodeTarget.getAttribute("data-graph-node-id") || "");
            graphWorkspaceState.selectedKind = "node";
            graphWorkspaceState.selectedRef = nodeId;
            const entity = graphFindEntity("node", nodeId);
            if (graphPropertyValue(entity, "summary_kind")) {
                graphToggleExpandSelectionAction();
            }
        });
        svg.addEventListener("pointerdown", (event) => {
            const nodeTarget = event.target.closest("[data-graph-node-id]");
            if (!nodeTarget) {
                return;
            }
            const nodeId = String(nodeTarget.getAttribute("data-graph-node-id") || "");
            const point = graphSvgPoint(svg, event);
            const current = graphWorkspaceState.filtered.positions?.[nodeId] || graphWorkspaceState.positions?.[nodeId];
            if (!current) {
                return;
            }
            graphWorkspaceState.drag = {
                kind: "node",
                nodeIds: [nodeId],
                initialPositions: {
                    [nodeId]: {
                        x: Number(current.x) || 0,
                        y: Number(current.y) || 0,
                    },
                },
                startPointX: Number(point.x || 0),
                startPointY: Number(point.y || 0),
                startClientX: Number(event.clientX || 0),
                startClientY: Number(event.clientY || 0),
                active: false,
            };
            window.addEventListener("pointermove", graphHandlePointerMove);
            window.addEventListener("pointerup", graphHandlePointerUp);
            event.preventDefault();
        });
        svg.addEventListener("pointerdown", (event) => {
            const groupTarget = event.target.closest("[data-graph-group-key]");
            if (!groupTarget || event.target.closest("[data-graph-node-id]")) {
                return;
            }
            const groupKey = String(groupTarget.getAttribute("data-graph-group-key") || "");
            const group = graphFindGroup(groupKey);
            const nodeIds = Array.isArray(group?.nodeIds) ? group.nodeIds.filter(Boolean) : [];
            if (!nodeIds.length) {
                return;
            }
            const point = graphSvgPoint(svg, event);
            const initialPositions = {};
            nodeIds.forEach((nodeId) => {
                const current = graphWorkspaceState.filtered.positions?.[nodeId] || graphWorkspaceState.positions?.[nodeId];
                if (!current) {
                    return;
                }
                initialPositions[nodeId] = {
                    x: Number(current.x) || 0,
                    y: Number(current.y) || 0,
                };
            });
            if (!Object.keys(initialPositions).length) {
                return;
            }
            graphWorkspaceState.drag = {
                kind: "group",
                groupKey,
                nodeIds: Object.keys(initialPositions),
                initialPositions,
                startPointX: Number(point.x || 0),
                startPointY: Number(point.y || 0),
                startClientX: Number(event.clientX || 0),
                startClientY: Number(event.clientY || 0),
                active: false,
            };
            window.addEventListener("pointermove", graphHandlePointerMove);
            window.addEventListener("pointerup", graphHandlePointerUp);
            event.preventDefault();
        });
        svg.addEventListener("pointerdown", (event) => {
            const hitTarget = event.target.closest("[data-graph-node-id], [data-graph-edge-id], [data-graph-group-key]");
            if (hitTarget) {
                return;
            }
            const viewport = graphWorkspaceState.viewport || graphUpdateViewport(
                graphWorkspaceState.filtered.width || 1600,
                graphWorkspaceState.filtered.height || 900,
            );
            if (!viewport) {
                return;
            }
            graphWorkspaceState.drag = {
                kind: "pan",
                startClientX: Number(event.clientX || 0),
                startClientY: Number(event.clientY || 0),
                startCenterX: Number(viewport.centerX || 0),
                startCenterY: Number(viewport.centerY || 0),
                viewport: {...viewport},
                active: false,
            };
            window.addEventListener("pointermove", graphHandlePointerMove);
            window.addEventListener("pointerup", graphHandlePointerUp);
            event.preventDefault();
        });
    }

    graphUpdateConfidenceLabel();
    graphUpdateZoomLabel();
    graphUpdateHostFilterOptions();
    graphRenderLayoutOptions();
}
