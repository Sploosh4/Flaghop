
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let pollSnapshot;
export function connectHostActions(callbacks) {
    for (const name of ["pollSnapshot"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing host_actions callback: ${name}`);
    }
    ({ pollSnapshot } = callbacks);
}

import { loadApprovals } from "./approvals.js";
import { closeHostRemoveModalAction, requestHostRemoveAction } from "./dialogs.js";
import { setWorkspaceStatus } from "./dom.js";
import { graphPropertyValue } from "./graph_common.js";
import { graphEntityHostId } from "./graph_viewport.js";
import { renderHostDetail } from "./host_detail.js";
import { fetchJson, postJson } from "./http.js";
import { graphWorkspaceState, hostRemoveState, workspaceState } from "./state.js";
import { loadHostDetail, refreshWorkspace, waitForJobCompletion } from "./workspace_data.js";
/** Workspace host actions. */

export function buildLaunchToolButton(title = "Run supported tool") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.innerHTML = '<i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i>';
    return button;
}


export function buildHostActionButton(action, hostId) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.dataset.hostAction = String(action || "");
    button.dataset.hostId = String(hostId || "");

    if (action === "rescan") {
        button.title = "Rescan";
        button.setAttribute("aria-label", "Rescan");
        button.innerHTML = '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i>';
        return button;
    }
    if (action === "refresh-screenshots") {
        button.title = "Refresh screenshots";
        button.setAttribute("aria-label", "Refresh screenshots");
        button.innerHTML = '<i class="fa-solid fa-camera-retro" aria-hidden="true"></i>';
        return button;
    }
    if (action === "dig-deeper") {
        button.title = "Dig Deeper";
        button.setAttribute("aria-label", "Dig Deeper");
        button.innerHTML = '<i class="fa-solid fa-brain" aria-hidden="true"></i>';
        return button;
    }
    if (action === "remove") {
        button.classList.add("icon-btn-danger");
        button.title = "Remove host";
        button.setAttribute("aria-label", "Remove host");
        button.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
        return button;
    }
    return button;
}


export function buildSubnetActionButton(action, subnet) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.dataset.subnetAction = String(action || "");
    button.dataset.subnet = String(subnet || "");

    if (action === "rescan") {
        button.title = "Rescan subnet";
        button.setAttribute("aria-label", "Rescan subnet");
        button.innerHTML = '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i>';
        return button;
    }
    return button;
}


export function buildScreenshotActionButton(action, payload) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.dataset.screenshotAction = String(action || "");
    button.dataset.hostId = String(payload?.hostId || "");
    button.dataset.port = String(payload?.port || "");
    button.dataset.protocol = String(payload?.protocol || "tcp");
    button.dataset.artifactRef = String(payload?.artifactRef || "");
    button.dataset.filename = String(payload?.filename || "");

    if (action === "refresh") {
        button.title = "Re-screenshot";
        button.setAttribute("aria-label", "Re-screenshot");
        button.innerHTML = '<i class="fa-solid fa-camera-retro" aria-hidden="true"></i>';
        return button;
    }
    if (action === "delete") {
        button.classList.add("icon-btn-danger");
        button.title = "Delete screenshot";
        button.setAttribute("aria-label", "Delete screenshot");
        button.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
        return button;
    }
    return button;
}


export function graphHostRowById(hostId) {
    const targetId = parseInt(hostId, 10);
    if (!Number.isFinite(targetId) || targetId <= 0) {
        return null;
    }
    return (workspaceState.hosts || []).find((host) => parseInt(host?.id, 10) === targetId) || null;
}


export function graphConnectedServiceContextForPortNode(entity) {
    const nodeId = String(entity?.node_id || "");
    if (!nodeId) {
        return {serviceName: "", serviceLabel: ""};
    }
    const edges = Array.isArray(graphWorkspaceState.data?.edges) ? graphWorkspaceState.data.edges : [];
    const nodes = Array.isArray(graphWorkspaceState.data?.nodes) ? graphWorkspaceState.data.nodes : [];
    const serviceEdge = edges.find((edge) => {
        return (
            String(edge?.from_node_id || "") === nodeId
            && String(edge?.type || "").trim().toLowerCase() === "exposes"
        );
    });
    if (!serviceEdge) {
        return {serviceName: "", serviceLabel: ""};
    }
    const serviceNode = nodes.find((node) => String(node?.node_id || "") === String(serviceEdge.to_node_id || ""));
    if (!serviceNode || String(serviceNode?.type || "").trim().toLowerCase() !== "service") {
        return {serviceName: "", serviceLabel: ""};
    }
    const serviceName = String(graphPropertyValue(serviceNode, "service") || "").trim().replace(/\?+$/, "").toLowerCase();
    const serviceLabel = String(serviceNode?.label || serviceName || "").trim();
    return {serviceName, serviceLabel};
}


export function graphToolLaunchContextForEntity(entity) {
    if (!entity) {
        return null;
    }
    const entityType = String(entity?.type || "").trim().toLowerCase();
    if (!["port", "service"].includes(entityType)) {
        return null;
    }
    const hostId = graphEntityHostId(entity);
    const hostRow = graphHostRowById(hostId);
    const hostIp = String(hostRow?.ip || graphPropertyValue(entity, "ip") || "").trim();
    const port = String(graphPropertyValue(entity, "port") || "").trim();
    const protocol = String(graphPropertyValue(entity, "protocol") || "tcp").trim().toLowerCase() || "tcp";
    if (!hostId || !hostIp || !port) {
        return null;
    }
    let serviceName = "";
    let serviceLabel = "";
    if (entityType === "service") {
        serviceName = String(graphPropertyValue(entity, "service") || entity.label || "").trim().replace(/\?+$/, "").toLowerCase();
        serviceLabel = String(entity.label || serviceName || "").trim();
    } else {
        const derived = graphConnectedServiceContextForPortNode(entity);
        serviceName = derived.serviceName;
        serviceLabel = derived.serviceLabel;
    }
    return {
        entityType,
        hostId,
        hostIp,
        hostname: String(hostRow?.hostname || "").trim(),
        port,
        protocol,
        serviceName,
        serviceLabel: serviceLabel || serviceName || "",
    };
}


export function closeGraphActionMenus() {
    document.querySelectorAll(".graph-action-menu.is-open").forEach((menu) => {
        menu.classList.remove("is-open");
        const toggle = menu.querySelector(".panel-menu-button");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
        }
    });
}


export async function graphGetApplicableTools(serviceName, {port = "", protocol = "tcp"} = {}) {
    const normalizedService = String(serviceName || "").trim().toLowerCase();
    const normalizedPort = String(port || "").trim();
    const normalizedProtocol = String(protocol || "tcp").trim().toLowerCase() || "tcp";
    const key = [
        normalizedService || "__all__",
        normalizedPort || "__any_port__",
        normalizedProtocol || "tcp",
    ].join("|");
    if (Array.isArray(graphWorkspaceState.toolMenuCache[key])) {
        return graphWorkspaceState.toolMenuCache[key];
    }
    const params = new URLSearchParams();
    params.set("limit", "500");
    if (normalizedService) {
        params.set("service", normalizedService);
    }
    if (normalizedPort) {
        params.set("port", normalizedPort);
    }
    if (normalizedProtocol) {
        params.set("protocol", normalizedProtocol);
    }
    const body = await fetchJson(`/api/workspace/tools?${params.toString()}`);
    const tools = Array.isArray(body?.tools) ? body.tools.filter((item) => Boolean(item?.runnable)) : [];
    graphWorkspaceState.toolMenuCache[key] = tools;
    return tools;
}


export async function runGraphNodeToolAction(context, tool) {
    if (!context || !tool?.tool_id) {
        return;
    }
    try {
        const body = await postJson("/api/workspace/tools/run", {
            host_ip: context.hostIp,
            port: context.port,
            protocol: context.protocol,
            tool_id: String(tool.tool_id || ""),
        });
        setWorkspaceStatus(`${tool.label || tool.tool_id} queued for ${context.hostIp}:${context.port}/${context.protocol} (job ${body?.job?.id || "?"})`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Tool launch failed: ${err.message}`, true);
    }
}


export function buildGraphToolMenu(context) {
    const menu = document.createElement("div");
    menu.className = "panel-menu graph-action-menu";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "panel-menu-button";
    toggle.title = "Launch Action";
    toggle.setAttribute("aria-label", "Launch Action");
    toggle.setAttribute("aria-haspopup", "menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    menu.appendChild(toggle);

    const submenu = document.createElement("div");
    submenu.className = "ribbon-submenu panel-submenu";
    submenu.setAttribute("role", "menu");
    submenu.setAttribute("aria-label", "Applicable actions");
    menu.appendChild(submenu);

    const serviceKey = String(context?.serviceName || "").trim();

    let loaded = false;
    toggle.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !menu.classList.contains("is-open");
        closeGraphActionMenus();
        if (!willOpen) {
            return;
        }
        menu.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        if (loaded) {
            return;
        }
        submenu.innerHTML = "";
        const loading = document.createElement("div");
        loading.className = "graph-action-menu-status";
        loading.textContent = "Loading actions...";
        submenu.appendChild(loading);
        try {
            const tools = await graphGetApplicableTools(serviceKey, {
                port: context?.port || "",
                protocol: context?.protocol || "tcp",
            });
            submenu.innerHTML = "";
            if (!tools.length) {
                const empty = document.createElement("div");
                empty.className = "graph-action-menu-status";
                empty.textContent = "No supported actions.";
                submenu.appendChild(empty);
            } else {
                tools.forEach((tool) => {
                    const item = document.createElement("button");
                    item.type = "button";
                    item.className = "ribbon-submenu-item";
                    item.textContent = String(tool.label || tool.tool_id || "tool");
                    item.title = String(tool.command_template || tool.tool_id || "");
                    item.addEventListener("click", async (clickEvent) => {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                        closeGraphActionMenus();
                        await runGraphNodeToolAction(context, tool);
                    });
                    submenu.appendChild(item);
                });
            }
            loaded = true;
        } catch (err) {
            submenu.innerHTML = "";
            const failed = document.createElement("div");
            failed.className = "graph-action-menu-status";
            failed.textContent = `Failed to load actions: ${err.message}`;
            submenu.appendChild(failed);
        }
    });

    submenu.addEventListener("click", (event) => {
        event.stopPropagation();
    });
    return menu;
}


export async function handleHostActionButtonAction(actionBtn) {
    const hostId = parseInt(actionBtn?.dataset?.hostId, 10);
    const action = String(actionBtn?.dataset?.hostAction || "");
    if (!hostId) {
        return true;
    }
    if (action === "rescan") {
        await rescanHostAction(hostId);
        return true;
    }
    if (action === "refresh-screenshots") {
        await refreshHostScreenshotsAction(hostId);
        return true;
    }
    if (action === "dig-deeper") {
        await digDeeperHostAction(hostId);
        return true;
    }
    if (action === "remove") {
        requestHostRemoveAction(hostId);
        return true;
    }
    return false;
}


export async function handleSubnetActionButtonAction(actionBtn) {
    const subnet = String(actionBtn?.dataset?.subnet || "").trim();
    const action = String(actionBtn?.dataset?.subnetAction || "");
    if (!subnet) {
        return true;
    }
    if (action === "rescan") {
        await rescanSubnetAction(subnet);
        return true;
    }
    return false;
}


export async function handleScreenshotActionButtonAction(actionBtn) {
    const hostId = parseInt(actionBtn?.dataset?.hostId, 10);
    const action = String(actionBtn?.dataset?.screenshotAction || "");
    const port = String(actionBtn?.dataset?.port || "").trim();
    const protocol = String(actionBtn?.dataset?.protocol || "tcp").trim().toLowerCase() || "tcp";
    const artifactRef = String(actionBtn?.dataset?.artifactRef || "").trim();
    const filename = String(actionBtn?.dataset?.filename || "").trim();
    if (!hostId) {
        return true;
    }
    if (action === "refresh") {
        await refreshGraphScreenshotAction({hostId, port, protocol});
        return true;
    }
    if (action === "delete") {
        await deleteGraphScreenshotAction({hostId, port, protocol, artifactRef, filename});
        return true;
    }
    return false;
}


export async function deleteGraphPortAction(context) {
    if (!context?.hostId || !context?.port) {
        return;
    }
    const label = `${context.hostIp}:${context.port}/${context.protocol}`;
    if (!window.confirm(`Delete port ${label}?`)) {
        return;
    }
    try {
        await postJson("/api/workspace/ports/delete", {
            host_id: context.hostId,
            port: context.port,
            protocol: context.protocol,
        });
        setWorkspaceStatus(`Deleted port ${label}`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Delete port failed: ${err.message}`, true);
    }
}


export async function deleteGraphServiceAction(context) {
    if (!context?.hostId || !context?.port) {
        return;
    }
    const label = `${context.serviceLabel || context.serviceName || "service"} on ${context.hostIp}:${context.port}/${context.protocol}`;
    if (!window.confirm(`Delete ${label}?`)) {
        return;
    }
    try {
        await postJson("/api/workspace/services/delete", {
            host_id: context.hostId,
            port: context.port,
            protocol: context.protocol,
            service: context.serviceName,
        });
        setWorkspaceStatus(`Deleted ${label}`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Delete service failed: ${err.message}`, true);
    }
}


export async function rescanHostAction(hostId) {
    const id = parseInt(hostId, 10);
    if (!id) {
        return;
    }
    try {
        const body = await postJson(`/api/workspace/hosts/${id}/rescan`, {});
        setWorkspaceStatus(`Rescan queued (job ${body?.job?.id || "?"})`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Rescan failed: ${err.message}`, true);
    }
}


export async function rescanSubnetAction(subnet) {
    const value = String(subnet || "").trim();
    if (!value) {
        return;
    }
    try {
        const body = await postJson("/api/workspace/subnets/rescan", {subnet: value});
        const jobId = Number(body?.job?.id || 0);
        if (body?.job?.existing) {
            setWorkspaceStatus(`Subnet rescan already queued/running (job ${jobId || "?"})`);
        } else {
            setWorkspaceStatus(`Subnet rescan queued (job ${jobId || "?"})`);
        }
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Subnet rescan failed: ${err.message}`, true);
    }
}


export async function digDeeperHostAction(hostId) {
    const id = parseInt(hostId, 10);
    if (!id) {
        return;
    }
    try {
        const body = await postJson(`/api/workspace/hosts/${id}/dig-deeper`, {});
        if (body?.job?.existing) {
            setWorkspaceStatus(`Dig deeper already queued/running (job ${body?.job?.id || "?"})`);
        } else {
            setWorkspaceStatus(`Dig deeper queued (job ${body?.job?.id || "?"})`);
        }
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Dig deeper failed: ${err.message}`, true);
    }
}


export async function refreshHostScreenshotsAction(hostId) {
    const id = parseInt(hostId, 10);
    if (!id) {
        return;
    }
    try {
        const body = await postJson(`/api/workspace/hosts/${id}/refresh-screenshots`, {});
        const jobId = Number(body?.job?.id || 0);
        if (body?.job?.existing) {
            setWorkspaceStatus(`Screenshot refresh already queued/running (job ${jobId || "?"})`);
            await pollSnapshot();
            return;
        }
        setWorkspaceStatus(`Screenshot refresh queued (job ${jobId || "?"})`);
        await pollSnapshot();
        if (jobId > 0) {
            waitForJobCompletion(jobId, 300000, 1500).then(async (job) => {
                const result = job?.result || {};
                const completed = Number(result.completed || 0);
                const targetCount = Number(result.target_count || 0);
                if (String(workspaceState.selectedHostId || "") === String(id)) {
                    await loadHostDetail(id);
                }
                await pollSnapshot();
                setWorkspaceStatus(
                    targetCount > 0
                        ? `Screenshot refresh completed (${completed}/${targetCount})`
                        : "Screenshot refresh completed",
                );
            }).catch(async (err) => {
                if (String(workspaceState.selectedHostId || "") === String(id)) {
                    await loadHostDetail(id).catch(() => {});
                }
                await pollSnapshot();
                setWorkspaceStatus(`Screenshot refresh failed: ${err.message}`, true);
            });
        }
    } catch (err) {
        setWorkspaceStatus(`Screenshot refresh failed: ${err.message}`, true);
    }
}


export async function refreshGraphScreenshotAction(payload) {
    const hostId = parseInt(payload?.hostId, 10);
    const port = String(payload?.port || "").trim();
    const protocol = String(payload?.protocol || "tcp").trim().toLowerCase() || "tcp";
    if (!hostId || !port) {
        return;
    }
    try {
        const body = await postJson("/api/workspace/screenshots/refresh", {
            host_id: hostId,
            port,
            protocol,
        });
        const jobId = Number(body?.job?.id || 0);
        if (body?.job?.existing) {
            setWorkspaceStatus(`Screenshot refresh already queued/running (job ${jobId || "?"})`);
        } else {
            setWorkspaceStatus(`Screenshot refresh queued (job ${jobId || "?"})`);
        }
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Screenshot refresh failed: ${err.message}`, true);
    }
}


export async function deleteGraphScreenshotAction(payload) {
    const hostId = parseInt(payload?.hostId, 10);
    const port = String(payload?.port || "").trim();
    const protocol = String(payload?.protocol || "tcp").trim().toLowerCase() || "tcp";
    const artifactRef = String(payload?.artifactRef || "").trim();
    const filename = String(payload?.filename || "").trim();
    if (!hostId || (!artifactRef && !filename)) {
        return;
    }
    const targetLabel = filename || artifactRef || "this screenshot";
    if (!window.confirm(`Delete ${targetLabel}?`)) {
        return;
    }
    try {
        await postJson("/api/workspace/screenshots/delete", {
            host_id: hostId,
            port,
            protocol,
            artifact_ref: artifactRef,
            filename,
        });
        setWorkspaceStatus(`Deleted screenshot ${targetLabel}`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Delete screenshot failed: ${err.message}`, true);
    }
}


export async function confirmHostRemoveAction() {
    const hostId = parseInt(hostRemoveState.hostId, 10);
    if (!hostId) {
        closeHostRemoveModalAction(true);
        return;
    }
    try {
        const response = await fetch(`/api/workspace/hosts/${hostId}`, {method: "DELETE"});
        let body = {};
        try {
            body = await response.json();
        } catch (_err) {
        }
        if (!response.ok) {
            const message = body.error || `Request failed (${response.status})`;
            throw new Error(message);
        }
        const removedIp = String(body.host_ip || hostRemoveState.hostIp || "");
        closeHostRemoveModalAction(true);
        if (workspaceState.selectedHostId === hostId) {
            workspaceState.selectedHostId = null;
            workspaceState.hostDetail = null;
            renderHostDetail({host: {}, note: "", ports: [], cves: [], screenshots: []});
        }
        setWorkspaceStatus(`Removed host ${removedIp || hostId}`);
        await Promise.all([refreshWorkspace(), pollSnapshot(), loadApprovals()]);
    } catch (err) {
        setWorkspaceStatus(`Remove host failed: ${err.message}`, true);
    }
}
