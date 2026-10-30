import { getGraphCanvasScrollNode, graphPropertyValue } from "./graph_common.js";
import { GRAPH_GROUP_LABEL_MIN_ZOOM, GRAPH_NODE_LABEL_MIN_ZOOM, GRAPH_NODE_SIZE, GRAPH_NODE_TYPE_MIN_ZOOM, GRAPH_WORKSPACE_ZOOM_MAX_PERCENT, GRAPH_WORKSPACE_ZOOM_MIN_PERCENT, graphWorkspaceState, workspaceState } from "./state.js";
/** Workspace graph viewport. */


export function graphFindGroup(groupKey) {
    return (graphWorkspaceState.filtered.groups || []).find((item) => String(item?.key || "") === String(groupKey || "")) || null;
}


export function graphEntityHostId(entity) {
    if (!entity || graphPropertyValue(entity, "summary_kind")) {
        return 0;
    }
    const directHostId = parseInt(graphPropertyValue(entity, "host_id"), 10);
    if (Number.isFinite(directHostId) && directHostId > 0) {
        return directHostId;
    }

    const label = String(entity?.label || "").trim().toLowerCase();
    const hostname = String(graphPropertyValue(entity, "hostname") || "").trim().toLowerCase();
    const ip = String(graphPropertyValue(entity, "ip") || "").trim();
    const matchedHost = (workspaceState.hosts || []).find((host) => {
        return (
            (label && String(host?.hostname || "").trim().toLowerCase() === label)
            || (hostname && String(host?.hostname || "").trim().toLowerCase() === hostname)
            || (ip && String(host?.ip || "").trim() === ip)
        );
    });
    const matchedHostId = parseInt(matchedHost?.id, 10);
    return Number.isFinite(matchedHostId) && matchedHostId > 0 ? matchedHostId : 0;
}


export function graphNodeMatchesSelectedHost(node) {
    const selectedHostId = parseInt(workspaceState.selectedHostId, 10);
    if (!Number.isFinite(selectedHostId) || selectedHostId <= 0) {
        return false;
    }
    if (String(node?.type || "").trim().toLowerCase() !== "host") {
        return false;
    }
    return graphEntityHostId(node) === selectedHostId;
}


export function graphCurrentZoomPercent() {
    return Math.max(
        GRAPH_WORKSPACE_ZOOM_MIN_PERCENT,
        Math.min(GRAPH_WORKSPACE_ZOOM_MAX_PERCENT, Number(graphWorkspaceState.zoomPercent || 100)),
    );
}


export function graphComputeViewportBase(boundsWidth, boundsHeight, containerWidth, containerHeight) {
    const safeBoundsWidth = Math.max(1, Number(boundsWidth || 1));
    const safeBoundsHeight = Math.max(1, Number(boundsHeight || 1));
    const safeContainerWidth = Math.max(1, Number(containerWidth || 1));
    const safeContainerHeight = Math.max(1, Number(containerHeight || 1));
    const containerAspect = safeContainerWidth / safeContainerHeight;
    const boundsAspect = safeBoundsWidth / safeBoundsHeight;
    if (boundsAspect >= containerAspect) {
        return {
            width: safeBoundsWidth,
            height: safeBoundsWidth / containerAspect,
        };
    }
    return {
        width: safeBoundsHeight * containerAspect,
        height: safeBoundsHeight,
    };
}


export function graphClampViewportCenter(centerX, centerY, boundsWidth, boundsHeight, viewWidth, viewHeight) {
    const safeBoundsWidth = Math.max(1, Number(boundsWidth || 1));
    const safeBoundsHeight = Math.max(1, Number(boundsHeight || 1));
    const safeViewWidth = Math.max(1, Number(viewWidth || 1));
    const safeViewHeight = Math.max(1, Number(viewHeight || 1));

    let nextCenterX = Number(centerX || 0);
    let nextCenterY = Number(centerY || 0);

    if (safeViewWidth >= safeBoundsWidth) {
        nextCenterX = safeBoundsWidth / 2;
    } else {
        nextCenterX = Math.max(safeViewWidth / 2, Math.min(safeBoundsWidth - (safeViewWidth / 2), nextCenterX));
    }

    if (safeViewHeight >= safeBoundsHeight) {
        nextCenterY = safeBoundsHeight / 2;
    } else {
        nextCenterY = Math.max(safeViewHeight / 2, Math.min(safeBoundsHeight - (safeViewHeight / 2), nextCenterY));
    }

    return {x: nextCenterX, y: nextCenterY};
}


export function graphVisibleContentBounds(fallbackWidth, fallbackHeight) {
    const filtered = graphWorkspaceState.filtered;
    const boxes = (filtered.groups || []).map(group => ({x: group.x, y: group.y, width: group.width, height: group.height}));
    Object.values(filtered.positions || {}).forEach(point => boxes.push({
        x: point.x, y: point.y, width: GRAPH_NODE_SIZE.width, height: GRAPH_NODE_SIZE.height,
    }));
    const valid = boxes.filter(box => Object.values(box).every(Number.isFinite));
    if (!valid.length) return {x: 0, y: 0, width: fallbackWidth, height: fallbackHeight};
    const x = Math.min(...valid.map(box => box.x)) - 36;
    const y = Math.min(...valid.map(box => box.y)) - 36;
    return {x, y,
        width: Math.max(...valid.map(box => box.x + box.width)) - x + 36,
        height: Math.max(...valid.map(box => box.y + box.height)) - y + 36,
    };
}


export function graphUpdateViewport(boundsWidth, boundsHeight) {
    const svg = document.getElementById("graph-workspace-canvas");
    const scrollNode = getGraphCanvasScrollNode();
    if (!svg || !scrollNode) {
        graphWorkspaceState.viewport = null;
        return null;
    }
    const containerWidth = Math.max(1, Number(scrollNode.clientWidth || scrollNode.getBoundingClientRect().width || 1));
    const containerHeight = Math.max(1, Number(scrollNode.clientHeight || scrollNode.getBoundingClientRect().height || 1));
    const bounds = graphVisibleContentBounds(boundsWidth, boundsHeight);
    const base = graphComputeViewportBase(bounds.width, bounds.height, containerWidth, containerHeight);
    // Fit the visible geometry, rather than the layout's 1200x760 minimum canvas.
    // Limit enlargement of sparse graphs so a few nodes remain readable cards.
    const minimumScale = Math.max(1, containerWidth / (base.width * 1.25), containerHeight / (base.height * 1.25));
    base.width *= minimumScale; base.height *= minimumScale;
    const zoomScale = graphCurrentZoomPercent() / 100;
    const viewWidth = Math.max(1, base.width / zoomScale);
    const viewHeight = Math.max(1, base.height / zoomScale);
    const current = graphWorkspaceState.viewport || {};
    const defaultCenterX = bounds.x + bounds.width / 2;
    const defaultCenterY = bounds.y + bounds.height / 2;
    const clampedCenter = graphClampViewportCenter(
        (Number.isFinite(Number(current.centerX)) ? Number(current.centerX) : defaultCenterX) - bounds.x,
        (Number.isFinite(Number(current.centerY)) ? Number(current.centerY) : defaultCenterY) - bounds.y,
        bounds.width,
        bounds.height,
        viewWidth,
        viewHeight,
    );
    clampedCenter.x += bounds.x; clampedCenter.y += bounds.y;
    const viewX = clampedCenter.x - (viewWidth / 2);
    const viewY = clampedCenter.y - (viewHeight / 2);
    graphWorkspaceState.viewport = {
        x: viewX,
        y: viewY,
        width: viewWidth,
        height: viewHeight,
        centerX: clampedCenter.x,
        centerY: clampedCenter.y,
        boundsWidth: bounds.width,
        boundsHeight: bounds.height,
        boundsX: bounds.x,
        boundsY: bounds.y,
        containerWidth,
        containerHeight,
    };
    svg.setAttribute("viewBox", `${viewX} ${viewY} ${viewWidth} ${viewHeight}`);
    svg.style.width = "100%";
    svg.style.height = `${Math.max(120, Math.round(containerHeight))}px`;
    return graphWorkspaceState.viewport;
}


export function graphShouldShowGroupLabels() {
    return graphCurrentZoomPercent() >= GRAPH_GROUP_LABEL_MIN_ZOOM;
}


export function graphShouldShowNodeLabel(options = {}) {
    if (options.isSelected || options.isHostSelected || options.isSummaryNode) {
        return true;
    }
    return graphCurrentZoomPercent() >= GRAPH_NODE_LABEL_MIN_ZOOM;
}


export function graphShouldShowNodeTypeLabel(options = {}) {
    if (options.isSelected || options.isHostSelected || options.isSummaryNode) {
        return true;
    }
    return graphCurrentZoomPercent() >= GRAPH_NODE_TYPE_MIN_ZOOM;
}
