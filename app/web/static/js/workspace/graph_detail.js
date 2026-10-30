
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let graphRenderWorkspace;
export function connectGraphDetail(callbacks) {
    for (const name of ["graphRenderWorkspace"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing graph_detail callback: ${name}`);
    }
    ({ graphRenderWorkspace } = callbacks);
}

import { closeGraphNoteModalAction } from "./dialogs.js";
import { getGraphCanvasPanel, getGraphWorkspaceShell, graphFriendlyLabel, graphHasActiveSelection, graphPropertyValue, graphSelectedNodeEntity } from "./graph_common.js";
import { graphFindEntity } from "./graph_selection.js";
import { graphEntityHostId } from "./graph_viewport.js";
import { buildGraphToolMenu, buildHostActionButton, buildLaunchToolButton, buildScreenshotActionButton, buildSubnetActionButton, deleteGraphPortAction, deleteGraphServiceAction, graphToolLaunchContextForEntity, handleHostActionButtonAction, handleScreenshotActionButtonAction, handleSubnetActionButtonAction } from "./host_actions.js";
import { fetchJson } from "./http.js";
import { copyScreenshotAction, copyTextToClipboard, openScreenshotModal, openTextPreviewModal } from "./process_output.js";
import { GRAPH_NODE_SIZE, GRAPH_SOURCE_KIND_LABELS, graphWorkspaceState, screenshotModalState } from "./state.js";
import { openManualToolPicker } from "./tools.js";
/** Workspace graph detail. */

export function graphDismissSelection() {
    closeGraphNoteModalAction(false);
    graphWorkspaceState.selectedKind = "";
    graphWorkspaceState.selectedRef = "";
    graphWorkspaceState.selectedPayload = null;
    graphWorkspaceState.relatedContent = [];
    graphRenderWorkspace();
}


export function graphSetFiltersExpanded(expanded) {
    const next = Boolean(expanded);
    graphWorkspaceState.filtersExpanded = next;
    const panel = document.getElementById("graph-filters-panel");
    const button = document.getElementById("graph-filters-toggle-button");
    if (panel) {
        panel.hidden = !next;
    }
    if (button) {
        const label = next ? "Hide Filters" : "Show Filters";
        button.setAttribute("title", label);
        button.setAttribute("aria-label", label);
        button.setAttribute("aria-expanded", next ? "true" : "false");
        button.classList.toggle("is-active", next);
    }
}


export function graphSelectionAnchorPoint() {
    const canvasPanel = getGraphCanvasPanel();
    const svg = document.getElementById("graph-workspace-canvas");
    if (!canvasPanel || !svg || svg.hidden) {
        return null;
    }
    const viewBox = svg.viewBox?.baseVal;
    if (!viewBox || !Number(viewBox.width) || !Number(viewBox.height)) {
        return null;
    }
    const panelRect = canvasPanel.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const kind = String(graphWorkspaceState.selectedKind || "");
    const ref = String(graphWorkspaceState.selectedRef || "");
    if (!kind || !ref) {
        return null;
    }

    let anchorX = 0;
    let anchorY = 0;
    if (kind === "node") {
        const point = graphWorkspaceState.filtered.positions?.[ref] || graphWorkspaceState.positions?.[ref];
        if (!point) {
            return null;
        }
        anchorX = Number(point.x || 0) + GRAPH_NODE_SIZE.width;
        anchorY = Number(point.y || 0) + (GRAPH_NODE_SIZE.height / 2);
    } else if (kind === "edge") {
        const entity = graphFindEntity("edge", ref);
        if (!entity) {
            return null;
        }
        const sourcePoint = graphWorkspaceState.filtered.positions?.[String(entity.from_node_id || "")];
        const targetPoint = graphWorkspaceState.filtered.positions?.[String(entity.to_node_id || "")];
        if (!sourcePoint || !targetPoint) {
            return null;
        }
        const startX = Number(sourcePoint.x || 0) + GRAPH_NODE_SIZE.width;
        const startY = Number(sourcePoint.y || 0) + (GRAPH_NODE_SIZE.height / 2);
        const endX = Number(targetPoint.x || 0);
        const endY = Number(targetPoint.y || 0) + (GRAPH_NODE_SIZE.height / 2);
        anchorX = (startX + endX) / 2;
        anchorY = (startY + endY) / 2;
    } else {
        return null;
    }

    return {
        x: (svgRect.left - panelRect.left) + (((anchorX - Number(viewBox.x || 0)) / Number(viewBox.width || 1)) * svgRect.width),
        y: (svgRect.top - panelRect.top) + (((anchorY - Number(viewBox.y || 0)) / Number(viewBox.height || 1)) * svgRect.height),
    };
}


export function graphSyncDetailPresentation() {
    const shell = getGraphWorkspaceShell();
    const sidebar = document.getElementById("graph-sidebar");
    const dockSlot = document.getElementById("graph-detail-dock-slot");
    const floatingLayer = document.getElementById("graph-detail-floating-layer");
    const detailPanel = document.getElementById("graph-detail-panel");
    const toggleButton = document.getElementById("graph-detail-dock-toggle-button");
    const closeButton = document.getElementById("graph-detail-close-button");
    if (!shell || !sidebar || !dockSlot || !floatingLayer || !detailPanel || !toggleButton || !closeButton) {
        return;
    }

    const floating = String(graphWorkspaceState.detailMode || "floating") !== "docked";
    const hasSelection = graphHasActiveSelection();

    shell.classList.toggle("graph-workspace-detail-floating", floating);
    shell.classList.toggle("graph-workspace-detail-docked", !floating);
    sidebar.hidden = floating;
    floatingLayer.hidden = !floating || !hasSelection;
    detailPanel.classList.toggle("is-floating", floating);
    toggleButton.setAttribute("title", floating ? "Dock Panel" : "Float Panel");
    toggleButton.setAttribute("aria-label", floating ? "Dock Panel" : "Float Panel");
    closeButton.hidden = !floating;

    if (floating) {
        if (detailPanel.parentElement !== floatingLayer) {
            floatingLayer.appendChild(detailPanel);
        }
    } else if (detailPanel.parentElement !== dockSlot) {
        dockSlot.appendChild(detailPanel);
    }

    detailPanel.hidden = floating ? !hasSelection : false;
    if (!floating || !hasSelection) {
        detailPanel.style.left = "";
        detailPanel.style.top = "";
        return;
    }

    window.requestAnimationFrame(() => {
        const canvasPanel = getGraphCanvasPanel();
        if (!canvasPanel || detailPanel.hidden) {
            return;
        }
        const anchor = graphSelectionAnchorPoint();
        const panelWidth = Math.min(detailPanel.offsetWidth || 430, Math.max(280, canvasPanel.clientWidth - 16));
        const panelHeight = detailPanel.offsetHeight || 420;
        const areaWidth = Math.max(320, canvasPanel.clientWidth);
        const areaHeight = Math.max(240, canvasPanel.clientHeight);
        let left = Math.max(8, areaWidth - panelWidth - 10);
        let top = 12;
        if (anchor) {
            left = anchor.x + 18;
            top = anchor.y + 12;
            if ((left + panelWidth) > (areaWidth - 8)) {
                left = Math.max(8, anchor.x - panelWidth - 18);
            }
            if ((top + panelHeight) > (areaHeight - 8)) {
                top = Math.max(8, areaHeight - panelHeight - 8);
            }
        }
        left = Math.max(8, Math.min(left, areaWidth - panelWidth - 8));
        top = Math.max(8, Math.min(top, areaHeight - Math.min(panelHeight, areaHeight - 8) - 8));
        detailPanel.style.left = `${Math.round(left)}px`;
        detailPanel.style.top = `${Math.round(top)}px`;
    });
}


export function graphSetDetailMode(mode) {
    graphWorkspaceState.detailMode = String(mode || "floating").trim().toLowerCase() === "docked"
        ? "docked"
        : "floating";
    graphSyncDetailPresentation();
}


export function graphToggleDetailModeAction() {
    graphSetDetailMode(graphWorkspaceState.detailMode === "docked" ? "floating" : "docked");
}


export function graphRefreshSelectionActionButtons() {
    const focusButton = document.getElementById("graph-focus-selection-button");
    const clearFocusButton = document.getElementById("graph-clear-focus-button");
    const expandButton = document.getElementById("graph-expand-selection-button");
    const collapseButton = document.getElementById("graph-collapse-expanded-button");
    const selectedNode = graphSelectedNodeEntity();
    const selectedSummaryNode = selectedNode && graphPropertyValue(selectedNode, "summary_kind")
        ? selectedNode
        : null;
    const selectedSummaryId = String(selectedSummaryNode?.node_id || "");
    const selectedSummaryExpanded = Boolean(selectedSummaryId && graphWorkspaceState.expandedSummaryIds[selectedSummaryId]);

    if (focusButton) {
        const canFocus = Boolean(selectedNode);
        focusButton.disabled = !canFocus;
        const focusLabel = canFocus ? "Focus Selected" : "Select a node or summary to focus";
        focusButton.setAttribute("title", focusLabel);
        focusButton.setAttribute("aria-label", focusLabel);
    }

    if (clearFocusButton) {
        const hasFocus = Array.isArray(graphWorkspaceState.focusSeedNodeIds) && graphWorkspaceState.focusSeedNodeIds.length > 0;
        clearFocusButton.disabled = !hasFocus;
        const clearLabel = hasFocus ? "Clear Focus" : "No graph focus is active";
        clearFocusButton.setAttribute("title", clearLabel);
        clearFocusButton.setAttribute("aria-label", clearLabel);
    }

    if (expandButton) {
        const canExpand = Boolean(selectedSummaryNode) && !selectedSummaryExpanded;
        expandButton.hidden = !canExpand;
        expandButton.disabled = !canExpand;
        const expandLabel = canExpand ? "Expand Cluster" : "Select a collapsed summary cluster to expand";
        expandButton.setAttribute("title", expandLabel);
        expandButton.setAttribute("aria-label", expandLabel);
    }

    if (collapseButton) {
        const canCollapse = Boolean(selectedSummaryNode) && selectedSummaryExpanded;
        collapseButton.hidden = !canCollapse;
        collapseButton.disabled = !canCollapse;
        const collapseLabel = canCollapse ? "Collapse Cluster" : "Select an expanded summary cluster to collapse";
        collapseButton.setAttribute("title", collapseLabel);
        collapseButton.setAttribute("aria-label", collapseLabel);
    }
}


export function graphRenderSelectionDetail() {
    const detailCaption = document.getElementById("graph-detail-caption");
    const badgesNode = document.getElementById("graph-selection-badges");
    const fieldsNode = document.getElementById("graph-detail-fields");
    const hostActionsBlock = document.getElementById("graph-host-actions-block");
    const hostActionsNode = document.getElementById("graph-host-actions");
    const portActionsBlock = document.getElementById("graph-port-actions-block");
    const portActionsNode = document.getElementById("graph-port-actions");
    const serviceActionsBlock = document.getElementById("graph-service-actions-block");
    const serviceActionsNode = document.getElementById("graph-service-actions");
    const subnetActionsBlock = document.getElementById("graph-subnet-actions-block");
    const subnetActionsNode = document.getElementById("graph-subnet-actions");
    const screenshotActionsBlock = document.getElementById("graph-screenshot-actions-block");
    const screenshotActionsNode = document.getElementById("graph-screenshot-actions");
    const evidenceNode = document.getElementById("graph-detail-evidence");
    const propertiesNode = document.getElementById("graph-detail-properties");
    const annotationsNode = document.getElementById("graph-annotations-list");
    const focusButton = document.getElementById("graph-focus-selection-button");
    const expandButton = document.getElementById("graph-expand-selection-button");
    const collapseButton = document.getElementById("graph-collapse-expanded-button");
    const pinButton = document.getElementById("graph-pin-toggle-button");
    const noteButton = document.getElementById("graph-note-open-button");
    if (!detailCaption || !badgesNode || !fieldsNode || !hostActionsBlock || !hostActionsNode || !portActionsBlock || !portActionsNode || !serviceActionsBlock || !serviceActionsNode || !subnetActionsBlock || !subnetActionsNode || !screenshotActionsBlock || !screenshotActionsNode || !evidenceNode || !propertiesNode || !annotationsNode || !focusButton || !expandButton || !collapseButton || !pinButton || !noteButton) {
        return;
    }

    const kind = String(graphWorkspaceState.selectedKind || "");
    const ref = String(graphWorkspaceState.selectedRef || "");
    const entity = kind === "node"
        ? graphSelectedNodeEntity()
        : graphFindEntity(kind, ref);
    graphWorkspaceState.selectedPayload = entity;

    badgesNode.innerHTML = "";
    fieldsNode.innerHTML = "";
    hostActionsNode.innerHTML = "";
    portActionsNode.innerHTML = "";
    serviceActionsNode.innerHTML = "";
    subnetActionsNode.innerHTML = "";
    screenshotActionsNode.innerHTML = "";
    hostActionsBlock.hidden = true;
    portActionsBlock.hidden = true;
    serviceActionsBlock.hidden = true;
    subnetActionsBlock.hidden = true;
    screenshotActionsBlock.hidden = true;
    evidenceNode.innerHTML = "";
    annotationsNode.innerHTML = "";

    if (!entity) {
        detailCaption.textContent = "Select a node or edge";
        propertiesNode.textContent = "No graph selection";
        focusButton.disabled = true;
        focusButton.setAttribute("title", "Select a node or summary to focus");
        focusButton.setAttribute("aria-label", "Select a node or summary to focus");
        noteButton.disabled = true;
        noteButton.setAttribute("title", "Select a node or edge to add a note");
        noteButton.setAttribute("aria-label", "Select a node or edge to add a note");
        pinButton.disabled = true;
        pinButton.classList.remove("is-active");
        pinButton.setAttribute("title", "Select a node to pin");
        pinButton.setAttribute("aria-label", "Select a node to pin");
        graphRenderRelatedContent("No related artifacts or screenshots.");
        graphRefreshSelectionActionButtons();
        graphSyncDetailPresentation();
        return;
    }

    const isSummaryNode = kind === "node" && Boolean(graphPropertyValue(entity, "summary_kind"));
    const isAggregateEdge = kind === "edge" && Boolean(graphPropertyValue(entity, "aggregate_kind"));
    const relatedHostId = kind === "node" ? graphEntityHostId(entity) : 0;
    const entityType = kind === "node" ? String(entity.type || "").trim().toLowerCase() : "";
    const fields = [];
    if (kind === "node") {
        detailCaption.textContent = `${graphFriendlyLabel(entity.type)}: ${entity.label || entity.node_id || ""}`;
        fields.push(["Node ID", entity.node_id || ""]);
        fields.push(["Type", graphFriendlyLabel(entity.type || "")]);
        if (isSummaryNode) {
            fields.push(["Summary", "collapsed cluster"]);
            fields.push(["Members", graphPropertyValue(entity, "member_count") || ""]);
            fields.push(["Examples", (graphPropertyValue(entity, "sample_labels") || []).join(", ")]);
            fields.push(["Expanded", graphWorkspaceState.expandedSummaryIds[String(entity.node_id || "")] ? "yes" : "no"]);
        }
    } else {
        const fromNode = graphFindEntity("node", entity.from_node_id);
        const toNode = graphFindEntity("node", entity.to_node_id);
        detailCaption.textContent = `${graphFriendlyLabel(entity.type)}: ${(fromNode?.label || entity.from_node_id || "")} -> ${(toNode?.label || entity.to_node_id || "")}`;
        fields.push(["Edge ID", entity.edge_id || ""]);
        fields.push(["Type", graphFriendlyLabel(entity.type || "")]);
        fields.push(["From", fromNode?.label || entity.from_node_id || ""]);
        fields.push(["To", toNode?.label || entity.to_node_id || ""]);
        if (isAggregateEdge) {
            fields.push(["Aggregate Count", graphPropertyValue(entity, "aggregate_count") || ""]);
            fields.push(["Edge Types", (graphPropertyValue(entity, "edge_types") || []).join(", ")]);
        }
    }
    fields.push(["Confidence", entity.confidence ?? ""]);
    fields.push(["Provenance", GRAPH_SOURCE_KIND_LABELS[String(entity.source_kind || "").trim().toLowerCase()] || graphFriendlyLabel(entity.source_kind || "")]);
    fields.push(["First Seen", entity.first_seen || ""]);
    fields.push(["Last Seen", entity.last_seen || ""]);
    fields.push(["Source Ref", entity.source_ref || ""]);

    fields.forEach(([label, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = String(value);
        fieldsNode.appendChild(dt);
        fieldsNode.appendChild(dd);
    });

    [
        kind === "node" ? graphFriendlyLabel(entity.type || "") : graphFriendlyLabel(entity.type || ""),
        GRAPH_SOURCE_KIND_LABELS[String(entity.source_kind || "").trim().toLowerCase()] || graphFriendlyLabel(entity.source_kind || ""),
        `${Math.round(Number(entity.confidence || 0))}% confidence`,
    ].forEach((text) => {
        const badge = document.createElement("span");
        badge.className = "graph-badge";
        badge.textContent = text;
        badgesNode.appendChild(badge);
    });
    if (kind === "node" && graphWorkspaceState.pinnedNodeIds[String(entity.node_id || "")]) {
        const badge = document.createElement("span");
        badge.className = "graph-badge graph-badge-pinned";
        badge.textContent = "pinned";
        badgesNode.appendChild(badge);
    }
    if (isSummaryNode) {
        const badge = document.createElement("span");
        badge.className = "graph-badge";
        badge.textContent = "summary";
        badgesNode.appendChild(badge);
    }
    if (isAggregateEdge) {
        const badge = document.createElement("span");
        badge.className = "graph-badge";
        badge.textContent = `${graphPropertyValue(entity, "aggregate_count") || 0} merged edges`;
        badgesNode.appendChild(badge);
    }

    const evidence = [];
    const seenEvidence = new Set();
    const appendEvidence = (value) => {
        const cleaned = String(value || "").trim();
        if (!cleaned) {
            return;
        }
        const key = cleaned.toLowerCase();
        if (seenEvidence.has(key)) {
            return;
        }
        seenEvidence.add(key);
        evidence.push(cleaned);
    };
    appendEvidence(entity?.properties?.evidence || "");
    (Array.isArray(entity?.evidence_refs) ? entity.evidence_refs : []).forEach(appendEvidence);
    (Array.isArray(entity?.properties?.evidence_items) ? entity.properties.evidence_items : []).forEach(appendEvidence);
    if (!evidence.length) {
        const li = document.createElement("li");
        li.textContent = "No explicit evidence refs";
        evidenceNode.appendChild(li);
    } else {
        evidence.forEach((value) => {
            const li = document.createElement("li");
            li.textContent = String(value || "");
            evidenceNode.appendChild(li);
        });
    }

    const displayProperties = entity.properties && typeof entity.properties === "object"
        ? JSON.parse(JSON.stringify(entity.properties))
        : {};
    if (Array.isArray(displayProperties.member_node_ids) && displayProperties.member_node_ids.length > 24) {
        displayProperties.member_node_ids = [`${displayProperties.member_node_ids.length} members hidden from inline view`];
    }
    propertiesNode.textContent = JSON.stringify(displayProperties, null, 2);

    const annotations = (graphWorkspaceState.annotations || []).filter((item) => {
        return String(item?.target_kind || "") === kind && String(item?.target_ref || "") === ref;
    });
    if (!annotations.length) {
        const empty = document.createElement("p");
        empty.className = "text-muted";
        empty.textContent = "No notes yet.";
        annotationsNode.appendChild(empty);
    } else {
        annotations.forEach((item) => {
            const card = document.createElement("article");
            card.className = "graph-annotation-card";
            const heading = document.createElement("div");
            heading.className = "graph-annotation-meta";
            heading.textContent = `${item.created_by || "operator"} | ${item.updated_at || item.created_at || ""}`;
            const body = document.createElement("div");
            body.className = "graph-annotation-body";
            body.textContent = item.body || "";
            card.appendChild(heading);
            card.appendChild(body);
            annotationsNode.appendChild(card);
        });
    }

    if (kind === "node" && entityType === "host" && relatedHostId > 0) {
        hostActionsBlock.hidden = false;
        const hostToolButton = buildLaunchToolButton("Run supported tool");
        hostToolButton.addEventListener("click", async () => {
            await openManualToolPicker({
                hostId: Number(relatedHostId) || 0,
                contextLabel: `Supported tools for ${String(entity.label || "host").trim()}`,
            });
        });
        hostActionsNode.appendChild(hostToolButton);
        ["rescan", "refresh-screenshots", "dig-deeper", "remove"].forEach((action) => {
            const button = buildHostActionButton(action, relatedHostId);
            button.addEventListener("click", async () => {
                await handleHostActionButtonAction(button);
            });
            hostActionsNode.appendChild(button);
        });
    }

    if (kind === "node" && entityType === "port") {
        const context = graphToolLaunchContextForEntity(entity);
        if (context) {
            portActionsBlock.hidden = false;
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "icon-btn icon-btn-danger";
            deleteButton.title = "Delete Port";
            deleteButton.setAttribute("aria-label", "Delete Port");
            deleteButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
            deleteButton.addEventListener("click", async () => {
                await deleteGraphPortAction(context);
            });
            portActionsNode.appendChild(deleteButton);
            portActionsNode.appendChild(buildGraphToolMenu(context));
        }
    }

    if (kind === "node" && entityType === "service") {
        const context = graphToolLaunchContextForEntity(entity);
        if (context) {
            serviceActionsBlock.hidden = false;
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "icon-btn icon-btn-danger";
            deleteButton.title = "Delete Service";
            deleteButton.setAttribute("aria-label", "Delete Service");
            deleteButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
            deleteButton.addEventListener("click", async () => {
                await deleteGraphServiceAction(context);
            });
            serviceActionsNode.appendChild(deleteButton);
            serviceActionsNode.appendChild(buildGraphToolMenu(context));
        }
    }

    if (kind === "node" && entityType === "subnet") {
        const subnetValue = String(graphPropertyValue(entity, "cidr") || entity.label || "").trim();
        if (subnetValue) {
            subnetActionsBlock.hidden = false;
            const button = buildSubnetActionButton("rescan", subnetValue);
            button.addEventListener("click", async () => {
                await handleSubnetActionButtonAction(button);
            });
            subnetActionsNode.appendChild(button);
        }
    }

    if (kind === "node" && entityType === "screenshot") {
        const screenshotPayload = {
            hostId: relatedHostId,
            port: String(graphPropertyValue(entity, "port") || "").trim(),
            protocol: String(graphPropertyValue(entity, "protocol") || "tcp").trim().toLowerCase() || "tcp",
            artifactRef: String(graphPropertyValue(entity, "artifact_ref") || "").trim(),
            filename: String(graphPropertyValue(entity, "filename") || entity.label || "").trim(),
        };
        if (screenshotPayload.hostId > 0) {
            screenshotActionsBlock.hidden = false;
            ["refresh", "delete"].forEach((action) => {
                const button = buildScreenshotActionButton(action, screenshotPayload);
                button.addEventListener("click", async () => {
                    await handleScreenshotActionButtonAction(button);
                });
                screenshotActionsNode.appendChild(button);
            });
        }
    }

    noteButton.disabled = false;
    noteButton.setAttribute("title", "Add Note");
    noteButton.setAttribute("aria-label", "Add Note");
    pinButton.disabled = kind !== "node" || isSummaryNode;
    const nodePinned = kind === "node" && Boolean(graphWorkspaceState.pinnedNodeIds[String(entity.node_id || "")]);
    pinButton.classList.toggle("is-active", nodePinned);
    if (kind !== "node") {
        pinButton.setAttribute("title", "Pinning is available for nodes only");
        pinButton.setAttribute("aria-label", "Pinning is available for nodes only");
    } else if (isSummaryNode) {
        pinButton.setAttribute("title", "Summary nodes cannot be pinned");
        pinButton.setAttribute("aria-label", "Summary nodes cannot be pinned");
    } else {
        pinButton.setAttribute("title", nodePinned ? "Unpin Node" : "Pin Node");
        pinButton.setAttribute("aria-label", nodePinned ? "Unpin Node" : "Pin Node");
    }
    if (isSummaryNode) {
        graphRenderRelatedContent("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.");
    } else {
        graphRenderRelatedContent();
    }
    graphRefreshSelectionActionButtons();
    graphSyncDetailPresentation();
}


export function graphRenderRelatedContent(statusMessage = "") {
    const listNode = document.getElementById("graph-detail-content-list");
    const statusNode = document.getElementById("graph-detail-content-status");
    if (!listNode || !statusNode) {
        return;
    }
    listNode.innerHTML = "";
    const entries = Array.isArray(graphWorkspaceState.relatedContent) ? graphWorkspaceState.relatedContent : [];
    const fallback = statusMessage || "No related artifacts or screenshots.";
    if (!entries.length) {
        statusNode.textContent = fallback;
        graphSyncDetailPresentation();
        return;
    }
    statusNode.textContent = `${entries.length} related item${entries.length === 1 ? "" : "s"}`;
    entries.forEach((entry) => {
        const card = document.createElement("article");
        card.className = "graph-content-card";

        const header = document.createElement("div");
        header.className = "graph-content-header";
        const title = document.createElement("strong");
        title.textContent = entry.label || entry.filename || entry.node_id || "artifact";
        header.appendChild(title);
        const kind = document.createElement("span");
        kind.className = "graph-content-kind";
        kind.textContent = graphFriendlyLabel(entry.kind || entry.node_type || "artifact");
        header.appendChild(kind);
        card.appendChild(header);

        const meta = document.createElement("div");
        meta.className = "graph-content-meta";
        meta.textContent = entry.ref || entry.filename || "";
        card.appendChild(meta);

        if (entry.kind === "image" && entry.preview_url) {
            const image = document.createElement("img");
            image.className = "graph-content-image";
            image.src = `${entry.preview_url}${entry.preview_url.includes("?") ? "&" : "?"}t=${Date.now()}`;
            image.alt = entry.filename || entry.label || "Graph artifact preview";
            image.addEventListener("click", () => {
                openScreenshotModal(entry.preview_url, entry.filename || entry.label || "screenshot.png", "");
            });
            card.appendChild(image);
        } else if (entry.kind === "text") {
            const preview = document.createElement("pre");
            preview.className = "graph-content-text";
            preview.textContent = String(entry.preview_text || entry.message || "").trim() || "No text preview available.";
            card.appendChild(preview);
        } else {
            const message = document.createElement("p");
            message.className = "text-muted";
            message.textContent = entry.message || "Preview unavailable.";
            card.appendChild(message);
        }

        const actions = document.createElement("div");
        actions.className = "graph-content-actions host-actions";
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "icon-btn";
        copyButton.title = "Copy";
        copyButton.setAttribute("aria-label", "Copy");
        copyButton.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i>';
        copyButton.addEventListener("click", async () => {
            if (entry.kind === "image" && entry.preview_url) {
                screenshotModalState.url = String(entry.preview_url || "");
                screenshotModalState.filename = String(entry.filename || "screenshot.png");
                screenshotModalState.port = "";
                await copyScreenshotAction();
                return;
            }
            await copyTextToClipboard(
                String(entry.preview_text || entry.ref || ""),
                `${entry.filename || entry.label || "Artifact"} copied to clipboard`,
                "Nothing to copy",
            );
        });
        actions.appendChild(copyButton);

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "icon-btn";
        downloadButton.title = "Download";
        downloadButton.setAttribute("aria-label", "Download");
        downloadButton.innerHTML = '<i class="fa-solid fa-download" aria-hidden="true"></i>';
        downloadButton.addEventListener("click", () => {
            if (entry.download_url) {
                window.location.assign(`${entry.download_url}${entry.download_url.includes("?") ? "&" : "?"}t=${Date.now()}`);
            }
        });
        actions.appendChild(downloadButton);

        if (entry.kind === "image" && entry.preview_url) {
            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className = "icon-btn";
            openButton.title = "Open";
            openButton.setAttribute("aria-label", "Open");
            openButton.innerHTML = '<i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>';
            openButton.addEventListener("click", () => {
                openScreenshotModal(entry.preview_url, entry.filename || entry.label || "screenshot.png", "");
            });
            actions.appendChild(openButton);
        } else if (entry.kind === "text") {
            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className = "icon-btn";
            openButton.title = "Open";
            openButton.setAttribute("aria-label", "Open");
            openButton.innerHTML = '<i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>';
            openButton.addEventListener("click", () => {
                openTextPreviewModal({
                    title: "Artifact Preview",
                    meta: entry.filename || entry.ref || "Artifact preview",
                    command: entry.ref || "",
                    output: entry.preview_text || "",
                    downloadName: entry.filename || "artifact.txt",
                });
            });
            actions.appendChild(openButton);
        }

        card.appendChild(actions);
        listNode.appendChild(card);
    });
    graphSyncDetailPresentation();
}


export async function graphFetchRelatedContent() {
    const kind = String(graphWorkspaceState.selectedKind || "");
    const ref = String(graphWorkspaceState.selectedRef || "");
    const entity = kind === "node" ? graphSelectedNodeEntity() : null;
    if (!kind || !ref || kind !== "node") {
        graphWorkspaceState.relatedContent = [];
        graphRenderRelatedContent("No related artifacts or screenshots.");
        return;
    }
    if (!entity) {
        graphWorkspaceState.relatedContent = [];
        graphRenderRelatedContent("No related artifacts or screenshots.");
        return;
    }
    if (graphPropertyValue(entity, "summary_kind")) {
        graphWorkspaceState.relatedContent = [];
        graphRenderRelatedContent("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.");
        return;
    }
    const requestId = Number(graphWorkspaceState.contentRequestId || 0) + 1;
    graphWorkspaceState.contentRequestId = requestId;
    graphWorkspaceState.relatedContent = [];
    graphRenderRelatedContent("Loading related content...");
    try {
        const payload = await fetchJson(`/api/graph/nodes/${encodeURIComponent(ref)}/content?max_chars=20000`);
        if (requestId !== graphWorkspaceState.contentRequestId) {
            return;
        }
        graphWorkspaceState.relatedContent = Array.isArray(payload?.entries) ? payload.entries : [];
        graphRenderRelatedContent();
    } catch (err) {
        if (requestId !== graphWorkspaceState.contentRequestId) {
            return;
        }
        graphWorkspaceState.relatedContent = [];
        graphRenderRelatedContent(`Related content load failed: ${err.message}`);
    }
}
