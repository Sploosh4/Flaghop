import { workspaceState } from "./state.js";
/** host scope: shared behavior independent of action controllers. */
export function workspaceHostLabel(hostId) {
    const normalizedHostId = parseInt(hostId, 10);
    if (!Number.isFinite(normalizedHostId) || normalizedHostId <= 0) {
        return "";
    }
    const host = (workspaceState.hosts || []).find((item) => String(item?.id || "") === String(normalizedHostId));
    if (!host) {
        return "";
    }
    return String(host.hostname || host.ip || `host ${host.id || normalizedHostId}`).trim();
}



export function setServicesHostScope(hostId, hostLabel = "") {
    const normalizedHostId = parseInt(hostId, 10);
    const nextHostId = Number.isFinite(normalizedHostId) && normalizedHostId > 0 ? normalizedHostId : 0;
    const nextLabel = nextHostId ? String(hostLabel || workspaceHostLabel(nextHostId) || `host ${nextHostId}`).trim() : "";
    const previousHostId = parseInt(workspaceState.servicesHostFilterId, 10);
    const previousLabel = String(workspaceState.servicesHostFilterLabel || "").trim();
    workspaceState.servicesHostFilterId = nextHostId;
    workspaceState.servicesHostFilterLabel = nextLabel;
    return String(previousHostId || 0) !== String(nextHostId || 0) || previousLabel !== nextLabel;
}
