
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let pollSnapshot;
export function connectApprovals(callbacks) {
    for (const name of ["pollSnapshot"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing approvals callback: ${name}`);
    }
    ({ pollSnapshot } = callbacks);
}

import { renderApprovals } from "./activity.js";
import { setWorkspaceStatus } from "./dom.js";
import { fetchJson, postJson } from "./http.js";
/** Workspace approvals. */

export async function loadApprovals() {
    try {
        const body = await fetchJson("/api/scheduler/approvals?status=pending&limit=200");
        renderApprovals(body.approvals || []);
    } catch (_err) {
    }
}


export async function approveApproval(approvalId, familyAction = "") {
    const resolvedFamilyAction = String(familyAction || "");
    const approveFamily = resolvedFamilyAction === "allowed";
    try {
        await postJson(`/api/scheduler/approvals/${approvalId}/approve`, {
            approve_family: approveFamily,
            run_now: true,
            family_action: resolvedFamilyAction,
        });
        setWorkspaceStatus(
            resolvedFamilyAction === "allowed"
                ? `Approval ${approvalId} accepted and family allowed`
                : `Approval ${approvalId} accepted`,
        );
        await Promise.all([loadApprovals(), pollSnapshot()]);
    } catch (err) {
        setWorkspaceStatus(`Approve failed: ${err.message}`, true);
    }
}


export async function rejectApproval(approvalId, familyAction = "") {
    const resolvedFamilyAction = String(familyAction || "");
    try {
        await postJson(`/api/scheduler/approvals/${approvalId}/reject`, {
            reason: "rejected in web workspace",
            family_action: resolvedFamilyAction,
        });
        setWorkspaceStatus(
            resolvedFamilyAction === "suppressed"
                ? `Approval ${approvalId} rejected and family suppressed`
                : `Approval ${approvalId} rejected`,
        );
        await Promise.all([loadApprovals(), pollSnapshot()]);
    } catch (err) {
        setWorkspaceStatus(`Reject failed: ${err.message}`, true);
    }
}
