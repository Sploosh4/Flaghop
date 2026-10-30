/** Workspace live updates. */
import { loadDecisionHistory, loadJobs, loadProcesses, loadScanHistory, loadWorkspaceOverview, renderApprovals, renderDecisionRationaleFeed, renderDecisions, renderJobs, renderScanHistory } from "./activity.js";
import { loadApprovals } from "./approvals.js";
import { renderCredentialCapturePanel } from "./credential_capture.js";
import { setText } from "./dom.js";
import { graphLoadSnapshot, graphScheduleRefresh } from "./graph_data.js";
import { selectedHostServiceFilters, syncHostFilterControls } from "./host_filters.js";
import { renderProcesses, renderSummary } from "./process_output.js";
import { workspaceInvalidateState, workspaceInvalidationWaiters, workspaceState } from "./state.js";
import { loadHostDetail, loadWorkspaceHosts, loadWorkspaceServices, loadWorkspaceTools } from "./workspace_data.js";
import { hostMatchesServiceFilter, renderHosts, renderProject, renderServices, renderTools } from "./workspace_view.js";

export function renderSnapshot(snapshot) {
    if (!snapshot) {
        return;
    }
    if (snapshot.project) {
        renderProject(snapshot.project);
    }
    if (snapshot.summary) {
        renderSummary(snapshot.summary);
    }
    syncHostFilterControls();
    if (Array.isArray(snapshot.hosts)) {
        const hostFilter = String(workspaceState.hostFilter || "hide_down").trim().toLowerCase() === "show_all"
            ? "show_all"
            : "hide_down";
        const serviceFilter = selectedHostServiceFilters();
        if (hostFilter !== "show_all") {
            const filteredHosts = serviceFilter.length
                ? snapshot.hosts.filter((host) => hostMatchesServiceFilter(host, serviceFilter))
                : snapshot.hosts;
            renderHosts(filteredHosts);
        }
    }
    if (Array.isArray(snapshot.services)) {
        if (!(parseInt(workspaceState.servicesHostFilterId, 10) > 0)) {
            renderServices(snapshot.services);
        }
    }
    if (Array.isArray(snapshot.tools) && !workspaceState.toolsHydrated) {
        renderTools(snapshot.tools);
    }
    if (snapshot.tools_meta && typeof snapshot.tools_meta === "object") {
        const totalTools = Number(snapshot.tools_meta.total || 0);
        if (Number.isFinite(totalTools) && totalTools >= 0) {
            setText("tool-count", totalTools);
            if (workspaceState.toolsHydrated && !workspaceState.toolsLoading && totalTools !== workspaceState.tools.length) {
                loadWorkspaceTools().catch(() => {});
            }
        }
    }
    if (Array.isArray(snapshot.processes)) {
        renderProcesses(snapshot.processes);
    }
    if (snapshot.credential_capture && typeof snapshot.credential_capture === "object") {
        renderCredentialCapturePanel(snapshot.credential_capture);
    }
    if (snapshot.scheduler) {
        const schedulerPolicy = snapshot.scheduler.engagement_policy || {};
        setText("scheduler-mode", snapshot.scheduler.mode || "");
        setText("scheduler-goal", schedulerPolicy.preset_label || schedulerPolicy.preset || snapshot.scheduler.goal_profile || "");
        setText("scheduler-families", snapshot.scheduler.preapproved_families_count || 0);
    }
    if (Array.isArray(snapshot.scheduler_rationale_feed)) {
        renderDecisionRationaleFeed(snapshot.scheduler_rationale_feed);
    }
    if (Array.isArray(snapshot.scheduler_decisions)) {
        renderDecisions(snapshot.scheduler_decisions);
    }
    if (Array.isArray(snapshot.scheduler_approvals)) {
        renderApprovals(snapshot.scheduler_approvals);
    }
    if (Array.isArray(snapshot.jobs)) {
        renderJobs(snapshot.jobs);
    }
    if (Array.isArray(snapshot.scan_history)) {
        renderScanHistory(snapshot.scan_history);
    }

    if (workspaceState.selectedHostId && !workspaceState.hostDetail) {
        loadHostDetail(workspaceState.selectedHostId).catch(() => {});
    }
    graphScheduleRefresh();
}


export function wsUrl(path) {
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    return `${scheme}://${window.location.host}${path}`;
}


export function setLiveChip(text, isError) {
    const chip = document.getElementById("live-status");
    if (!chip) {
        return;
    }
    chip.textContent = text;
    chip.style.color = isError ? "#ff9b9b" : "";
}


export function notifyWorkspaceInvalidationWaiters(channels) {
    const normalized = new Set((channels || []).map((item) => String(item || "").trim()).filter(Boolean));
    if (!normalized.size || !workspaceInvalidationWaiters.length) {
        return;
    }
    for (let index = workspaceInvalidationWaiters.length - 1; index >= 0; index -= 1) {
        const waiter = workspaceInvalidationWaiters[index];
        const matches = Array.from(waiter.channels || []).some((channel) => normalized.has(channel));
        if (!matches) {
            continue;
        }
        workspaceInvalidationWaiters.splice(index, 1);
        if (waiter.timeoutId) {
            window.clearTimeout(waiter.timeoutId);
        }
        try {
            waiter.resolve(Array.from(normalized));
        } catch (_err) {
        }
    }
}


export function waitForWorkspaceInvalidation(channels, timeoutMs = 5000) {
    const normalized = new Set((channels || []).map((item) => String(item || "").trim()).filter(Boolean));
    if (!normalized.size) {
        return Promise.resolve([]);
    }
    return new Promise((resolve, reject) => {
        const waiter = {
            channels: normalized,
            resolve,
            timeoutId: 0,
        };
        waiter.timeoutId = window.setTimeout(() => {
            const index = workspaceInvalidationWaiters.indexOf(waiter);
            if (index >= 0) {
                workspaceInvalidationWaiters.splice(index, 1);
            }
            reject(new Error("Timed out waiting for workspace update."));
        }, Math.max(1, Number(timeoutMs) || 1));
        workspaceInvalidationWaiters.push(waiter);
    });
}


export async function handleWorkspaceInvalidation(channels) {
    const requested = new Set((channels || []).map((item) => String(item || "").trim()).filter(Boolean));
    if (!requested.size) {
        return;
    }

    const tasks = [];
    const needsHostRefresh = requested.has("hosts");
    const needsServiceRefresh = requested.has("services");
    const needsHostDetailRefresh = workspaceState.selectedHostId && (needsHostRefresh || needsServiceRefresh || requested.has("graph"));

    if (requested.has("overview")) {
        tasks.push(loadWorkspaceOverview());
    }
    if (needsHostRefresh) {
        tasks.push(loadWorkspaceHosts());
        if (parseInt(workspaceState.servicesHostFilterId, 10) > 0 && !needsServiceRefresh) {
            tasks.push(loadWorkspaceServices());
        }
    } else if (needsServiceRefresh) {
        tasks.push(loadWorkspaceServices());
    }
    if (requested.has("processes")) {
        tasks.push(loadProcesses());
    }
    if (requested.has("jobs")) {
        tasks.push(loadJobs());
    }
    if (requested.has("approvals")) {
        tasks.push(loadApprovals());
    }
    if (requested.has("decisions")) {
        tasks.push(loadDecisionHistory());
    }
    if (requested.has("scan_history")) {
        tasks.push(loadScanHistory());
    }
    if (requested.has("tools") && workspaceState.toolsHydrated) {
        tasks.push(loadWorkspaceTools({force: true}));
    }
    if (requested.has("graph")) {
        tasks.push(graphLoadSnapshot({background: true}));
    }
    if (needsHostDetailRefresh) {
        tasks.push(loadHostDetail(workspaceState.selectedHostId));
    }
    if (!tasks.length) {
        return;
    }
    await Promise.all(tasks.map((task) => Promise.resolve(task).catch(() => {})));
}


export function queueWorkspaceInvalidation(channels) {
    (channels || []).forEach((channel) => {
        const normalized = String(channel || "").trim();
        if (normalized) {
            workspaceInvalidateState.pendingChannels.add(normalized);
        }
    });
    if (workspaceInvalidateState.timer || workspaceInvalidateState.running) {
        return;
    }
    workspaceInvalidateState.timer = window.setTimeout(async () => {
        workspaceInvalidateState.timer = null;
        if (workspaceInvalidateState.running) {
            return;
        }
        workspaceInvalidateState.running = true;
        try {
            while (workspaceInvalidateState.pendingChannels.size) {
                const batch = Array.from(workspaceInvalidateState.pendingChannels);
                workspaceInvalidateState.pendingChannels.clear();
                await handleWorkspaceInvalidation(batch);
            }
        } finally {
            workspaceInvalidateState.running = false;
        }
    }, 60);
}


export function connectSnapshotWebSocket() {
    const socket = new WebSocket(wsUrl("/ws/snapshot"));
    socket.onopen = () => setLiveChip("Live", false);
    socket.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload && payload.type === "invalidate") {
                notifyWorkspaceInvalidationWaiters(payload.channels || []);
                queueWorkspaceInvalidation(payload.channels || []);
                return;
            }
            if (payload && payload.type === "heartbeat") {
                return;
            }
            renderSnapshot(payload);
        } catch (_err) {
            setLiveChip("Decode Error", true);
        }
    };
    socket.onerror = () => setLiveChip("Socket Error", true);
    socket.onclose = () => {
        setLiveChip("Reconnecting", true);
        window.setTimeout(connectSnapshotWebSocket, 1500);
    };
}


export async function pollSnapshot() {
    try {
        const response = await fetch("/api/snapshot", {cache: "no-store"});
        if (!response.ok) {
            setLiveChip("Polling Error", true);
            return;
        }
        const snapshot = await response.json();
        renderSnapshot(snapshot);
    } catch (_err) {
        setLiveChip("Polling Error", true);
    }
}
