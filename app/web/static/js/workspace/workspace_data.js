
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let graphLoadSnapshot, renderHosts, renderServices, renderTools;
export function connectWorkspaceData(callbacks) {
    for (const name of ["graphLoadSnapshot", "renderHosts", "renderServices", "renderTools"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing workspace_data callback: ${name}`);
    }
    ({ graphLoadSnapshot, renderHosts, renderServices, renderTools } = callbacks);
}

import { getChecked, getValue, setWorkspaceStatus } from "./dom.js";
import { renderHostDetail } from "./host_detail.js";
import { currentHostFilterQuery, currentServicesFilterQuery, syncHostFilterControls } from "./host_filters.js";
import { setServicesHostScope } from "./host_scope.js";
import { fetchJson, postJson } from "./http.js";
import { waitForWorkspaceInvalidation } from "./invalidation_waiters.js";
import { workspaceState } from "./state.js";
import { fetchWorkspaceToolsAll } from "./tool_api.js";
/** Workspace workspace data. */

export function sleepMs(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
    });
}


export async function waitForJobCompletion(jobId, timeoutMs = 120000, pollIntervalMs = 1200) {
    const id = Number(jobId);
    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("Invalid job id.");
    }

    const started = Date.now();
    while ((Date.now() - started) < timeoutMs) {
        const job = await fetchJson(`/api/jobs/${id}`);
        const status = String(job.status || "").toLowerCase();
        if (status === "completed") {
            return job;
        }
        if (status === "failed") {
            throw new Error(String(job.error || "Save job failed."));
        }
        if (window.LEGION_WS_ENABLED) {
            const remaining = timeoutMs - (Date.now() - started);
            if (remaining <= 0) {
                break;
            }
            try {
                await waitForWorkspaceInvalidation(["jobs"], Math.min(Math.max(remaining, 1), 30000));
            } catch (_err) {
                await sleepMs(pollIntervalMs);
            }
        } else {
            await sleepMs(pollIntervalMs);
        }
    }

    throw new Error("Timed out waiting for job completion.");
}


export async function loadWorkspaceHosts() {
    const requestQuery = currentHostFilterQuery();
    const servicesQueryBefore = currentServicesFilterQuery();
    const body = await fetchJson(`/api/workspace/hosts?${requestQuery}`);
    if (requestQuery !== currentHostFilterQuery()) {
        return;
    }
    if (body && body.filter) {
        workspaceState.hostFilter = String(body.filter || "hide_down").trim().toLowerCase() === "show_all"
            ? "show_all"
            : "hide_down";
    }
    syncHostFilterControls();
    renderServices(workspaceState.services);
    renderHosts(body.hosts || []);
    const scopedHostId = parseInt(workspaceState.servicesHostFilterId, 10);
    const hosts = Array.isArray(body.hosts) ? body.hosts : [];
    const scopeStillVisible = hosts.some((host) => String(host?.id || "") === String(scopedHostId || ""));
    if (Number.isFinite(scopedHostId) && scopedHostId > 0 && !scopeStillVisible) {
        setServicesHostScope(workspaceState.selectedHostId);
        syncHostFilterControls();
        renderHosts(workspaceState.hosts);
    }
    if (servicesQueryBefore !== currentServicesFilterQuery()) {
        await loadWorkspaceServices();
    }
}


export async function loadWorkspaceServices() {
    const query = currentServicesFilterQuery();
    const body = await fetchJson(`/api/workspace/services${query ? `?${query}` : ""}`);
    if (query !== currentServicesFilterQuery()) {
        return;
    }
    const returnedHostId = parseInt(body?.host_id, 10);
    if (!Number.isFinite(returnedHostId) || returnedHostId <= 0) {
        workspaceState.servicesHostFilterId = 0;
        workspaceState.servicesHostFilterLabel = "";
    }
    workspaceState.servicesCategoryFilter = String(body?.category || "").trim();
    syncHostFilterControls();
    renderServices(body.services || []);
}


export async function loadWorkspaceTools({service = "", force = false} = {}) {
    if (workspaceState.toolsLoading && !force) {
        return;
    }

    workspaceState.toolsLoading = true;
    try {
        const allTools = await fetchWorkspaceToolsAll({service});
        workspaceState.toolsHydrated = true;
        renderTools(allTools);
    } finally {
        workspaceState.toolsLoading = false;
    }
}


export async function loadHostDetail(hostId) {
    if (!hostId) {
        return;
    }
    const payload = await fetchJson(`/api/workspace/hosts/${hostId}`);
    renderHostDetail(payload);
}


export async function refreshWorkspace() {
    setWorkspaceStatus("Refreshing workspace...");
    try {
        await Promise.all([
            loadWorkspaceHosts(),
            loadWorkspaceServices(),
            loadWorkspaceTools(),
        ]);
        if (workspaceState.selectedHostId) {
            await loadHostDetail(workspaceState.selectedHostId);
        }
        try {
            await graphLoadSnapshot({background: true});
        } catch (_err) {
        }
        setWorkspaceStatus("Workspace refreshed");
    } catch (err) {
        setWorkspaceStatus(`Workspace refresh failed: ${err.message}`, true);
    }
}


export function parseCommaSeparatedList(value) {
    return Array.from(new Set(
        String(value || "")
            .split(",")
            .map((item) => String(item || "").trim())
            .filter(Boolean)
    ));
}
