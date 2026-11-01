import { closeGraphNoteModalAction, setGraphNoteModalOpen } from "./dialogs.js";
import { getChecked, getValue, setText, setValue } from "./dom.js";
import { graphCurrentViewConfig, graphFriendlyLabel, graphPropertyValue, graphRenderLayoutOptions, graphSelectedNodeEntity, setGraphStatus } from "./graph_common.js";
import { graphRefreshSelectionActionButtons, graphRenderSelectionDetail } from "./graph_detail.js";
import { graphApplyLocalFilters } from "./graph_filters.js";
import { graphBuildHostMaps, graphComputeCompactLayout, graphGroupKeyForNode } from "./graph_layout.js";
import { graphEntityUnderlyingNodeIds } from "./graph_projection.js";
import { graphRenderWorkspace } from "./graph_render.js";
import { graphFindEntity } from "./graph_selection.js";
import { postJson } from "./http.js";
import { graphWorkspaceState } from "./state.js";
/** Workspace graph actions. */

export function graphApplyLayoutById(layoutId) {
    const selected = (graphWorkspaceState.layouts || []).find((item) => String(item?.layout_id || "") === String(layoutId || ""));
    graphWorkspaceState.activeLayoutId = String(selected?.layout_id || "");
    graphWorkspaceState.positions = selected?.layout?.positions && typeof selected.layout.positions === "object"
        ? {...selected.layout.positions}
        : {};
    graphWorkspaceState.pinnedNodeIds = selected?.layout?.pinned_node_ids && typeof selected.layout.pinned_node_ids === "object"
        ? {...selected.layout.pinned_node_ids}
        : {};
    if (selected?.layout?.group_by) {
        setValue("graph-group-select", selected.layout.group_by);
    }
    if (selected?.name) {
        setValue("graph-layout-name", selected.name);
    }
    graphRenderLayoutOptions();
    graphRenderWorkspace();
}


export function graphTidyLayoutAction() {
    const current = graphApplyLocalFilters(graphWorkspaceState.data);
    const groupsMap = new Map();
    (current.nodes || []).forEach((item) => {
        const key = graphGroupKeyForNode(item, graphWorkspaceState.groupBy || graphCurrentViewConfig().defaultGroup || "subnet", graphBuildHostMaps(current.nodes)) || "other";
        if (!groupsMap.has(key)) {
            groupsMap.set(key, []);
        }
        groupsMap.get(key).push(item);
    });
    if (!Array.isArray(current?.nodes) || !current.nodes.length || !groupsMap.size) {
        setGraphStatus("No graph nodes are available to tidy.", true);
        return;
    }
    const tidied = graphComputeCompactLayout(
        current.nodes,
        current.edges,
        groupsMap,
        graphWorkspaceState.groupBy || graphCurrentViewConfig().defaultGroup || "subnet",
        {},
    );
    Object.entries(tidied.positions || {}).forEach(([nodeId, point]) => {
        graphWorkspaceState.positions[nodeId] = {
            x: Number(point?.x) || 0,
            y: Number(point?.y) || 0,
        };
    });
    graphRenderWorkspace({preserveDetail: true});
    setGraphStatus(`Layout tidied for ${current.nodes.length} nodes across ${(tidied.groups || []).length} groups`);
}


export function graphFocusSelectionAction() {
    if (graphWorkspaceState.selectedKind !== "node" || !graphWorkspaceState.selectedRef) {
        setGraphStatus("Select a node or summary before focusing the neighborhood.", true);
        graphRefreshSelectionActionButtons();
        return;
    }
    const entity = graphSelectedNodeEntity();
    const seedNodeIds = graphEntityUnderlyingNodeIds(entity);
    if (!seedNodeIds.length) {
        setGraphStatus("The selected graph node cannot be focused.", true);
        graphRefreshSelectionActionButtons();
        return;
    }
    graphWorkspaceState.focusSeedNodeIds = seedNodeIds;
    graphWorkspaceState.focusSeedLabel = String(entity?.label || entity?.node_id || "selection");
    graphWorkspaceState.focusDepth = Math.max(1, Math.min(3, parseInt(getValue("graph-focus-depth-select"), 10) || graphWorkspaceState.focusDepth || 1));
    if (graphPropertyValue(entity, "summary_kind")) {
        graphWorkspaceState.selectedKind = "node";
        graphWorkspaceState.selectedRef = seedNodeIds[0];
    }
    graphRenderWorkspace();
    graphRefreshSelectionActionButtons();
    setGraphStatus(`Focused ${graphWorkspaceState.focusDepth}-hop neighborhood around ${graphWorkspaceState.focusSeedLabel}`);
}


export function graphClearFocusAction() {
    if (!graphWorkspaceState.focusSeedNodeIds.length) {
        setGraphStatus("No graph focus is active.", true);
        graphRefreshSelectionActionButtons();
        return;
    }
    graphWorkspaceState.focusSeedNodeIds = [];
    graphWorkspaceState.focusSeedLabel = "";
    graphRenderWorkspace();
    graphRefreshSelectionActionButtons();
    setGraphStatus("Graph focus cleared");
}


export function graphToggleExpandSelectionAction() {
    if (graphWorkspaceState.selectedKind !== "node" || !graphWorkspaceState.selectedRef) {
        setGraphStatus("Select a summary node before expanding it.", true);
        graphRefreshSelectionActionButtons();
        return;
    }
    const entity = graphSelectedNodeEntity();
    if (!graphPropertyValue(entity, "summary_kind")) {
        setGraphStatus("Selected node is already expanded.", true);
        graphRefreshSelectionActionButtons();
        return;
    }
    const nodeId = String(entity?.node_id || "");
    if (graphWorkspaceState.expandedSummaryIds[nodeId]) {
        delete graphWorkspaceState.expandedSummaryIds[nodeId];
        graphWorkspaceState.selectedKind = "node";
        graphWorkspaceState.selectedRef = nodeId;
        graphWorkspaceState.selectedPayload = null;
        setGraphStatus(`Collapsed ${entity.label || nodeId}`);
    } else {
        graphWorkspaceState.expandedSummaryIds[nodeId] = true;
        graphWorkspaceState.selectedKind = "node";
        graphWorkspaceState.selectedRef = nodeId;
        graphWorkspaceState.selectedPayload = entity;
        setGraphStatus(`Expanded ${entity.label || nodeId}`);
    }
    graphRenderWorkspace();
    graphRefreshSelectionActionButtons();
}


export function graphCollapseExpandedAction() {
    const entity = graphSelectedNodeEntity();
    const summaryId = String(entity?.node_id || "");
    if (!graphPropertyValue(entity, "summary_kind") || !summaryId || !graphWorkspaceState.expandedSummaryIds[summaryId]) {
        setGraphStatus("Select an expanded summary cluster to collapse.", true);
        graphRefreshSelectionActionButtons();
        return;
    }
    delete graphWorkspaceState.expandedSummaryIds[summaryId];
    graphWorkspaceState.selectedKind = "node";
    graphWorkspaceState.selectedRef = summaryId;
    graphWorkspaceState.selectedPayload = null;
    graphRenderWorkspace();
    graphRefreshSelectionActionButtons();
    setGraphStatus(`Collapsed ${entity.label || summaryId}`);
}


export async function graphSaveLayoutAction() {
    const viewId = String(getValue("graph-view-select") || graphWorkspaceState.viewId || "attack_surface").trim();
    const name = String(getValue("graph-layout-name") || "default").trim() || "default";
    const layoutId = String(graphWorkspaceState.activeLayoutId || "");
    const layout = {
        positions: graphWorkspaceState.filtered?.positions && typeof graphWorkspaceState.filtered.positions === "object"
            ? graphWorkspaceState.filtered.positions
            : graphWorkspaceState.positions,
        pinned_node_ids: graphWorkspaceState.pinnedNodeIds,
        group_by: String(getValue("graph-group-select") || graphWorkspaceState.groupBy || graphCurrentViewConfig().defaultGroup || "subnet").trim(),
        filters: {
            view_id: viewId,
            host_id: getValue("graph-host-filter"),
            node_type: getValue("graph-node-type-filter"),
            edge_type: getValue("graph-edge-type-filter"),
            source_kind: getValue("graph-source-kind-filter"),
            severity: getValue("graph-severity-filter"),
            pack: getValue("graph-pack-filter"),
            time_window: getValue("graph-time-window-filter"),
            hide_ai_suggested: getChecked("graph-hide-ai-suggested"),
            hide_nmap_xml_artifacts: getChecked("graph-hide-nmap-xml-artifacts"),
            min_confidence: getValue("graph-min-confidence"),
        },
    };
    try {
        const body = await postJson("/api/graph/layouts", {
            layout_id: layoutId,
            view_id: viewId,
            name,
            layout,
        });
        const returned = body?.layout || {};
        graphWorkspaceState.layouts = (graphWorkspaceState.layouts || []).filter((item) => {
            return String(item?.layout_id || "") !== String(returned.layout_id || "");
        });
        graphWorkspaceState.layouts.push(returned);
        graphWorkspaceState.activeLayoutId = String(returned.layout_id || "");
        graphRenderLayoutOptions();
        setValue("graph-layout-select", graphWorkspaceState.activeLayoutId);
        setGraphStatus(`Layout saved: ${returned.name || name}`);
    } catch (err) {
        setGraphStatus(`Layout save failed: ${err.message}`, true);
    }
}


export function graphResetLayoutAction() {
    graphWorkspaceState.activeLayoutId = "";
    graphWorkspaceState.positions = {};
    graphWorkspaceState.pinnedNodeIds = {};
    setValue("graph-layout-select", "");
    graphRenderWorkspace();
    setGraphStatus("Layout reset");
}


export async function graphSaveAnnotationAction() {
    const kind = String(graphWorkspaceState.selectedKind || "");
    const ref = String(graphWorkspaceState.selectedRef || "");
    const body = String(getValue("graph-note-input") || "").trim();
    if (!kind || !ref) {
        setGraphStatus("Select a node or edge before saving a note.", true);
        return;
    }
    if (!body) {
        setGraphStatus("Note text is required.", true);
        return;
    }
    try {
        const response = await postJson("/api/graph/annotations", {
            target_kind: kind,
            target_ref: ref,
            body,
            created_by: "web-operator",
            source_ref: `graph-workspace:${graphWorkspaceState.viewId}`,
        });
        const annotation = response?.annotation || {};
        graphWorkspaceState.annotations = (graphWorkspaceState.annotations || []).filter((item) => {
            return String(item?.annotation_id || "") !== String(annotation.annotation_id || "");
        });
        graphWorkspaceState.annotations.push(annotation);
        setValue("graph-note-input", "");
        closeGraphNoteModalAction(false);
        graphRenderSelectionDetail();
        setGraphStatus("Note saved");
    } catch (err) {
        setGraphStatus(`Note save failed: ${err.message}`, true);
    }
}


export function graphOpenNoteModalAction() {
    const kind = String(graphWorkspaceState.selectedKind || "");
    const ref = String(graphWorkspaceState.selectedRef || "");
    if (!kind || !ref) {
        setGraphStatus("Select a node or edge before adding a note.", true);
        return;
    }
    const entity = kind === "node" ? graphFindEntity("node", ref) : graphFindEntity("edge", ref);
    const entityLabel = String(entity?.label || entity?.edge_id || ref || "").trim() || "selected item";
    setText("graph-note-modal-target", `Target: ${graphFriendlyLabel(kind)} | ${entityLabel}`);
    setGraphNoteModalOpen(true);
}


export function graphTogglePinAction() {
    const entity = graphWorkspaceState.selectedKind === "node"
        ? graphFindEntity("node", graphWorkspaceState.selectedRef)
        : null;
    if (!entity) {
        setGraphStatus("Select a node to pin or unpin.", true);
        return;
    }
    const nodeId = String(entity.node_id || "");
    if (graphWorkspaceState.pinnedNodeIds[nodeId]) {
        delete graphWorkspaceState.pinnedNodeIds[nodeId];
        setGraphStatus(`Node unpinned: ${entity.label || nodeId}`);
    } else {
        const current = graphWorkspaceState.filtered.positions?.[nodeId] || graphWorkspaceState.positions?.[nodeId];
        if (current) {
            graphWorkspaceState.positions[nodeId] = {x: current.x, y: current.y};
        }
        graphWorkspaceState.pinnedNodeIds[nodeId] = true;
        setGraphStatus(`Node pinned: ${entity.label || nodeId}`);
    }
    graphRenderWorkspace();
}
