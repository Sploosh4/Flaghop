import {publishActivity, requestActivity} from "./activity_bridge.js";
import {publishWorkspaceJobs} from "./react_bridge.js";
import {setText} from "./dom.js";
import {fetchJson} from "./http.js";
import {renderSummary} from "./process_output.js";
import {renderProject} from "./project_view.js";
/** Compatibility adapters for snapshots and unmigrated workspace shells. */

export function applyWorkspaceOverview(overview) {
    if (!overview || typeof overview !== "object") {
        return;
    }
    if (overview.project) {
        renderProject(overview.project);
    }
    if (overview.summary) {
        renderSummary(overview.summary);
    }
    if (overview.scheduler) {
        const schedulerPolicy = overview.scheduler.engagement_policy || {};
        setText("scheduler-mode", overview.scheduler.mode || "");
        setText("scheduler-goal", schedulerPolicy.preset_label || schedulerPolicy.preset || overview.scheduler.goal_profile || "");
        setText("scheduler-families", overview.scheduler.preapproved_families_count || 0);
    }
    if (Array.isArray(overview.scheduler_rationale_feed)) {
        renderDecisionRationaleFeed(overview.scheduler_rationale_feed);
    }
}


export function renderDecisionRationaleFeed(rows) { publishActivity("rationale", rows || []); }
export function renderDecisions(rows) { publishActivity("decisions", rows || []); }
export function renderApprovals(rows) { publishActivity("approvals", rows || []); }
export function renderScanHistory(rows) { publishActivity("scans", rows || []); }
export function renderJobs(jobs) {
    publishWorkspaceJobs(jobs || []);
    setText("job-count", (jobs || []).length);
}
export function loadWorkspaceOverview() { return requestActivity("loadOverview"); }
export function loadProcesses() { return requestActivity("loadProcesses"); }
export function loadDecisionHistory() { return requestActivity("loadDecisions"); }
export function loadScanHistory() { return requestActivity("loadScans"); }
export function loadProviderLogsAction() { return requestActivity("loadProviderLogs"); }
export async function loadJobs() {
    const body = await fetchJson("/api/jobs?limit=20");
    renderJobs(body.jobs || []);
}
