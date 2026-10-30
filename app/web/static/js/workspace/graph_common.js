/** Workspace graph common. */
import { getValue, setText } from "./dom.js";
import { graphSyncDetailPresentation } from "./graph_detail.js";
import { graphRenderWorkspace } from "./graph_render.js";
import { graphFindEntity } from "./graph_viewport.js";
import { GRAPH_NODE_COLORS, GRAPH_SOURCE_KIND_STYLES, GRAPH_VIEW_PRESETS, GRAPH_WORKSPACE_DEFAULT_HEIGHT, GRAPH_WORKSPACE_HEIGHT_STORAGE_KEY, GRAPH_WORKSPACE_MAX_HEIGHT, GRAPH_WORKSPACE_MIN_HEIGHT, GRAPH_WORKSPACE_ZOOM_MAX_PERCENT, GRAPH_WORKSPACE_ZOOM_MIN_PERCENT, graphWorkspaceState, workspaceState } from "./state.js";

export function graphWorkspaceEnabled() {
    const panel = document.getElementById("graph-workspace-panel");
    return String(panel?.dataset?.graphEnabled || "").toLowerCase() === "true";
}


export function getGraphWorkspacePanel() {
    const canvas = document.getElementById("graph-workspace-canvas");
    return canvas ? canvas.closest(".graph-panel") : null;
}


export function getGraphWorkspaceShell() {
    return document.getElementById("graph-workspace-shell");
}


export function getGraphWorkspaceSection() {
    const shell = getGraphWorkspaceShell();
    return shell ? shell.closest(".graph-panel") : null;
}


export function getGraphCanvasPanel() {
    return document.querySelector(".graph-canvas-panel");
}


export function getGraphCanvasScrollNode() {
    return document.querySelector(".graph-canvas-scroll");
}


export function graphHasActiveSelection() {
    return Boolean(graphWorkspaceState.selectedKind && graphWorkspaceState.selectedRef);
}


export function graphSelectedNodeEntity({allowRetainedSummary = true} = {}) {
    if (graphWorkspaceState.selectedKind !== "node" || !graphWorkspaceState.selectedRef) {
        return null;
    }
    const liveEntity = graphFindEntity("node", graphWorkspaceState.selectedRef);
    if (liveEntity) {
        return liveEntity;
    }
    if (!allowRetainedSummary) {
        return null;
    }
    const retained = graphWorkspaceState.selectedPayload;
    const selectedRef = String(graphWorkspaceState.selectedRef || "");
    const retainedId = String(retained?.node_id || "");
    if (!retained || retainedId !== selectedRef) {
        return null;
    }
    if (!graphPropertyValue(retained, "summary_kind")) {
        return null;
    }
    if (!graphWorkspaceState.expandedSummaryIds[retainedId]) {
        return null;
    }
    return retained;
}


export function normalizeGraphWorkspaceHeight(value) {
    const parsed = Number.parseInt(String(value || ""), 10);
    if (!Number.isFinite(parsed)) {
        return GRAPH_WORKSPACE_DEFAULT_HEIGHT;
    }
    return Math.max(GRAPH_WORKSPACE_MIN_HEIGHT, Math.min(GRAPH_WORKSPACE_MAX_HEIGHT, parsed));
}


export function applyGraphWorkspaceHeight(height, {persist = true} = {}) {
    const panel = getGraphWorkspacePanel();
    if (!panel) {
        return;
    }
    const normalized = normalizeGraphWorkspaceHeight(height);
    panel.style.setProperty("--graph-workspace-height", `${normalized}px`);
    if (persist) {
        try {
            window.localStorage.setItem(GRAPH_WORKSPACE_HEIGHT_STORAGE_KEY, String(normalized));
        } catch (_err) {
            // ignore storage failures
        }
    }
    graphSyncDetailPresentation();
}


export function restoreGraphWorkspaceHeight() {
    try {
        const stored = window.localStorage.getItem(GRAPH_WORKSPACE_HEIGHT_STORAGE_KEY);
        if (stored) {
            applyGraphWorkspaceHeight(stored, {persist: false});
            return;
        }
    } catch (_err) {
        // ignore storage failures
    }
    applyGraphWorkspaceHeight(GRAPH_WORKSPACE_DEFAULT_HEIGHT, {persist: false});
}


export function stopGraphWorkspaceResize() {
    if (!graphWorkspaceState.resize) {
        return;
    }
    const handle = graphWorkspaceState.resize.handle;
    const pointerId = graphWorkspaceState.resize.pointerId;
    document.body.classList.remove("graph-workspace-resizing");
    window.removeEventListener("pointermove", handleGraphWorkspaceResizeMove);
    window.removeEventListener("pointerup", stopGraphWorkspaceResize);
    window.removeEventListener("pointercancel", stopGraphWorkspaceResize);
    window.removeEventListener("blur", stopGraphWorkspaceResize);
    if (handle && typeof handle.releasePointerCapture === "function" && pointerId !== null && pointerId !== undefined) {
        try {
            if (handle.hasPointerCapture && handle.hasPointerCapture(pointerId)) {
                handle.releasePointerCapture(pointerId);
            }
        } catch (_err) {
            // ignore release failures
        }
    }
    applyGraphWorkspaceHeight(graphWorkspaceState.resize.currentHeight || graphWorkspaceState.resize.startHeight);
    graphWorkspaceState.resize = null;
}


export function handleGraphWorkspaceResizeMove(event) {
    if (!graphWorkspaceState.resize) {
        return;
    }
    const delta = Number(event.clientY || 0) - graphWorkspaceState.resize.startY;
    const nextHeight = graphWorkspaceState.resize.startHeight + delta;
    graphWorkspaceState.resize.currentHeight = normalizeGraphWorkspaceHeight(nextHeight);
    applyGraphWorkspaceHeight(graphWorkspaceState.resize.currentHeight, {persist: false});
    graphRenderWorkspace({preserveDetail: true});
}


export function startGraphWorkspaceResize(event) {
    if (!graphWorkspaceEnabled()) {
        return;
    }
    const scrollNode = document.querySelector(".graph-canvas-scroll");
    if (!scrollNode) {
        return;
    }
    event.preventDefault();
    const handle = event.currentTarget || document.getElementById("graph-resize-handle");
    const pointerId = event.pointerId;
    graphWorkspaceState.resize = {
        startY: Number(event.clientY || 0),
        startHeight: Math.max(
            GRAPH_WORKSPACE_MIN_HEIGHT,
            Math.round(scrollNode.getBoundingClientRect().height || GRAPH_WORKSPACE_DEFAULT_HEIGHT),
        ),
        currentHeight: 0,
        handle,
        pointerId,
    };
    if (handle && typeof handle.setPointerCapture === "function" && pointerId !== null && pointerId !== undefined) {
        try {
            handle.setPointerCapture(pointerId);
        } catch (_err) {
            // ignore capture failures
        }
    }
    document.body.classList.add("graph-workspace-resizing");
    window.addEventListener("pointermove", handleGraphWorkspaceResizeMove);
    window.addEventListener("pointerup", stopGraphWorkspaceResize);
    window.addEventListener("pointercancel", stopGraphWorkspaceResize);
    window.addEventListener("blur", stopGraphWorkspaceResize);
}


export function resetGraphWorkspaceHeight() {
    applyGraphWorkspaceHeight(GRAPH_WORKSPACE_DEFAULT_HEIGHT);
}


export function setGraphStatus(text, isError = false) {
    const node = document.getElementById("graph-workspace-status");
    if (!node) {
        return;
    }
    node.textContent = text || "";
    node.style.color = isError ? "#ff9b9b" : "";
}


export function graphFriendlyLabel(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


export function graphSubnetForIp(ip) {
    const token = String(ip || "").trim();
    const match = token.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
    if (!match) {
        return token || "other";
    }
    return `${match[1]}.${match[2]}.${match[3]}.0/24`;
}


export function graphHashToken(value) {
    const input = String(value || "");
    let hash = 5381;
    for (let index = 0; index < input.length; index += 1) {
        hash = ((hash << 5) + hash) + input.charCodeAt(index);
        hash &= 0x7fffffff;
    }
    return Math.abs(hash).toString(36);
}


export function graphHostnameSuffix(hostname) {
    const parts = String(hostname || "").trim().toLowerCase().split(".").filter(Boolean);
    if (parts.length <= 2) {
        return parts.join(".") || "";
    }
    const tld = parts.slice(-2).join(".");
    if (["co.uk", "com.au", "co.jp"].includes(tld) && parts.length >= 3) {
        return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
}


export function graphUrlHost(value) {
    const raw = String(value || "").trim();
    if (!raw) {
        return "";
    }
    try {
        return new URL(raw).host || "";
    } catch (err) {
        const match = raw.match(/^[a-z]+:\/\/([^/?#]+)/i);
        return match ? String(match[1] || "").trim() : "";
    }
}


export function graphPropertyValue(entity, key) {
    if (!entity || typeof entity !== "object") {
        return "";
    }
    const props = entity.properties && typeof entity.properties === "object" ? entity.properties : {};
    return props[key];
}


export function graphPackValues(entity) {
    const props = entity?.properties && typeof entity.properties === "object" ? entity.properties : {};
    const packs = [];
    ["pack_id", "pack", "strategy_pack"].forEach((key) => {
        const token = String(props[key] || "").trim();
        if (token) {
            packs.push(token);
        }
    });
    const tagValues = Array.isArray(props.pack_tags) ? props.pack_tags : [];
    tagValues.forEach((tag) => {
        const token = String(tag || "").trim();
        if (token) {
            packs.push(token);
        }
    });
    return Array.from(new Set(packs));
}


export function graphTimestampValue(entity) {
    const lastSeen = String(entity?.last_seen || "").trim();
    const firstSeen = String(entity?.first_seen || "").trim();
    return lastSeen || firstSeen || "";
}


export function graphTimeWindowCutoff(windowId) {
    const normalized = String(windowId || "all").trim().toLowerCase();
    const hoursByWindow = {
        "24h": 24,
        "7d": 24 * 7,
        "30d": 24 * 30,
        "90d": 24 * 90,
    };
    const hours = hoursByWindow[normalized];
    if (!hours) {
        return 0;
    }
    return Date.now() - (hours * 60 * 60 * 1000);
}


export function graphEntityMatchesTimeWindow(entity, cutoffMs) {
    if (!cutoffMs) {
        return true;
    }
    const timestamp = Date.parse(graphTimestampValue(entity));
    if (!Number.isFinite(timestamp)) {
        return true;
    }
    return timestamp >= cutoffMs;
}


export function graphEntityMatchesSeverity(entity, severity) {
    const normalized = String(severity || "").trim().toLowerCase();
    if (!normalized) {
        return true;
    }
    return String(graphPropertyValue(entity, "severity") || "").trim().toLowerCase() === normalized;
}


export function graphEntityMatchesPack(entity, pack) {
    const normalized = String(pack || "").trim().toLowerCase();
    if (!normalized) {
        return true;
    }
    return graphPackValues(entity).some((value) => String(value || "").trim().toLowerCase() === normalized);
}


export function graphUpdateConfidenceLabel() {
    const value = getValue("graph-min-confidence") || "0";
    setText("graph-min-confidence-value", value);
}


export function graphUpdateZoomLabel() {
    const value = Math.max(
        GRAPH_WORKSPACE_ZOOM_MIN_PERCENT,
        Math.min(
            GRAPH_WORKSPACE_ZOOM_MAX_PERCENT,
            parseInt(getValue("graph-zoom-slider"), 10) || graphWorkspaceState.zoomPercent || 100,
        ),
    );
    graphWorkspaceState.zoomPercent = value;
    setText("graph-zoom-value", `${value}%`);
}


export function graphCurrentViewConfig() {
    const viewId = String(getValue("graph-view-select") || graphWorkspaceState.viewId || "attack_surface").trim();
    return GRAPH_VIEW_PRESETS[viewId] || GRAPH_VIEW_PRESETS.attack_surface;
}


export function graphUpdateSelectOptions(selectOrId, values, defaultLabel) {
    const node = typeof selectOrId === "string" ? document.getElementById(selectOrId) : selectOrId;
    if (!node) {
        return;
    }
    const previous = String(node.value || "");
    const optionValues = Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))).sort();
    node.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    node.appendChild(defaultOption);
    optionValues.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = graphFriendlyLabel(value);
        node.appendChild(option);
    });
    if (optionValues.includes(previous)) {
        node.value = previous;
    }
}


export function graphRenderLayoutOptions() {
    const select = document.getElementById("graph-layout-select");
    if (!select) {
        return;
    }
    const currentViewId = String(getValue("graph-view-select") || graphWorkspaceState.viewId || "attack_surface").trim();
    const currentValue = String(graphWorkspaceState.activeLayoutId || select.value || "");
    const layouts = (graphWorkspaceState.layouts || []).filter((item) => String(item?.view_id || "").trim() === currentViewId);
    select.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "auto layout";
    select.appendChild(defaultOption);
    layouts.forEach((layout) => {
        const option = document.createElement("option");
        option.value = String(layout.layout_id || "");
        option.textContent = `${layout.name || "layout"}${layout.updated_at ? ` (${layout.updated_at})` : ""}`;
        select.appendChild(option);
    });
    if (layouts.some((layout) => String(layout.layout_id || "") === currentValue)) {
        select.value = currentValue;
    } else {
        select.value = "";
    }
}


export function graphUpdateHostFilterOptions() {
    const select = document.getElementById("graph-host-filter");
    if (!select) {
        return;
    }
    const previous = String(select.value || "");
    select.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "all hosts";
    select.appendChild(defaultOption);
    (workspaceState.hosts || []).forEach((host) => {
        const option = document.createElement("option");
        option.value = String(host.id || "");
        option.textContent = `${host.ip || ""}${host.hostname ? ` (${host.hostname})` : ""}`;
        select.appendChild(option);
    });
    if ((workspaceState.hosts || []).some((host) => String(host.id || "") === previous)) {
        select.value = previous;
    }
}


export function graphPopulateDynamicFilters() {
    const snapshot = graphWorkspaceState.data || {};
    const nodes = Array.isArray(snapshot.nodes) ? snapshot.nodes : [];
    const edges = Array.isArray(snapshot.edges) ? snapshot.edges : [];
    graphUpdateSelectOptions(
        "graph-node-type-filter",
        nodes.map((item) => String(item?.type || "").trim().toLowerCase()),
        "all node types",
    );
    graphUpdateSelectOptions(
        "graph-edge-type-filter",
        edges.map((item) => String(item?.type || "").trim().toLowerCase()),
        "all edge types",
    );
    graphUpdateSelectOptions(
        "graph-source-kind-filter",
        nodes.concat(edges).map((item) => String(item?.source_kind || "").trim().toLowerCase()),
        "all provenance",
    );
    graphUpdateSelectOptions(
        "graph-severity-filter",
        nodes.concat(edges).map((item) => String(graphPropertyValue(item, "severity") || "").trim().toLowerCase()),
        "all severities",
    );
    graphUpdateSelectOptions(
        "graph-pack-filter",
        nodes.concat(edges).flatMap((item) => graphPackValues(item).map((value) => String(value || "").trim().toLowerCase())),
        "all packs",
    );
}


export function graphNodeColor(node) {
    const token = String(node?.type || "").trim().toLowerCase();
    return GRAPH_NODE_COLORS[token] || "#b4bbdd";
}


export function graphSourceStyle(entity) {
    const key = String(entity?.source_kind || "observed").trim().toLowerCase();
    return GRAPH_SOURCE_KIND_STYLES[key] || GRAPH_SOURCE_KIND_STYLES.observed;
}


export function opaqueUiEnabled() {
    return Boolean(window.LEGION_OPAQUE_UI_ENABLED) || Boolean(document.body?.classList.contains("opaque-ui"));
}


export function graphEdgeStrokeColor(entity) {
    const style = graphSourceStyle(entity);
    return String(style?.edgeStroke || style?.stroke || "#687691");
}


export function graphNodeFillColor(entity) {
    const style = graphSourceStyle(entity);
    return opaqueUiEnabled() ? String(style?.fillOpaque || "#18182a") : String(style?.fill || "#18182a");
}


export function graphSplitLabel(label) {
    const words = String(label || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
        return ["unknown"];
    }
    const lines = [];
    let current = "";
    words.forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= 18 || !current) {
            current = next;
            return;
        }
        lines.push(current);
        current = word;
    });
    if (current) {
        lines.push(current);
    }
    return lines.slice(0, 2);
}


export function graphCreateSvgNode(tagName, attributes = {}, text = "") {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        node.setAttribute(key, String(value));
    });
    if (text) {
        node.textContent = text;
    }
    return node;
}


export function graphSvgPoint(svg, event) {
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const scaleX = rect.width > 0 ? viewBox.width / rect.width : 1;
    const scaleY = rect.height > 0 ? viewBox.height / rect.height : 1;
    return {
        x: viewBox.x + ((event.clientX - rect.left) * scaleX),
        y: viewBox.y + ((event.clientY - rect.top) * scaleY),
    };
}
