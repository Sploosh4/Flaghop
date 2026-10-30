import { publishWorkspaceJobs } from "./react_bridge.js";
import { makeCell, setText, setWorkspaceStatus } from "./dom.js";
import { fetchJson } from "./http.js";
import { formatTargetLabel, renderAnsiOutput } from "./output_format.js";
import { copyTextToClipboard, renderProcesses, renderSummary } from "./process_output.js";
import { renderProject } from "./project_view.js";
import { providerLogsState } from "./state.js";
/** Workspace activity. */

export async function loadProviderLogsAction() {
    setText("provider-logs-meta", "Loading logs...");
    try {
        const payload = await fetchJson("/api/scheduler/provider/logs?limit=400");
        providerLogsState.text = String(payload.text || "");
        providerLogsState.count = Array.isArray(payload.logs) ? payload.logs.length : 0;
        const fallbackCount = Array.isArray(payload.logs)
            ? payload.logs.filter((row) => Boolean(row?.prompt_metadata?.structured_output_fallback)).length
            : 0;
        const structuredCount = Array.isArray(payload.logs)
            ? payload.logs.filter((row) => Boolean(row?.prompt_metadata?.structured_output_used)).length
            : 0;
        renderAnsiOutput("provider-logs-text", providerLogsState.text);
        setText(
            "provider-logs-meta",
            `Entries ${providerLogsState.count} | structured ${structuredCount} | fallback ${fallbackCount} | bytes ${providerLogsState.text.length}`
        );
    } catch (err) {
        const message = `Failed to load provider logs: ${err.message}`;
        providerLogsState.text = message;
        renderAnsiOutput("provider-logs-text", message);
        setText("provider-logs-meta", "Load failed");
        setWorkspaceStatus(message, true);
    }
}


export async function copyProviderLogsAction() {
    const text = providerLogsState.text || "";
    await copyTextToClipboard(text, "Provider logs copied to clipboard", "No provider logs to copy");
}


export function downloadProviderLogsAction() {
    const text = providerLogsState.text || "";
    if (!text) {
        setWorkspaceStatus("No provider logs to download", true);
        return;
    }
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `provider-logs-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setWorkspaceStatus("Provider logs downloaded");
}


export function formatFeedTimestamp(value) {
    const text = String(value || "").trim();
    if (!text) {
        return "";
    }
    const parsed = Date.parse(text);
    if (!Number.isFinite(parsed)) {
        return text;
    }
    return new Date(parsed).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}


export function renderDecisionRationaleFeed(entries) {
    const body = document.getElementById("decision-rationale-body");
    if (!body) {
        return;
    }
    const items = Array.isArray(entries) ? entries : [];
    body.innerHTML = "";
    setText("decision-rationale-count", items.length);

    if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "meta-note rationale-empty";
        empty.textContent = "Scheduler rationale will appear here as tools are ranked, suppressed, and executed.";
        body.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((entry) => {
        const article = document.createElement("article");
        article.className = "rationale-entry";

        const top = document.createElement("div");
        top.className = "rationale-entry-top";

        const heading = document.createElement("div");
        heading.className = "rationale-entry-heading";

        const prefix = document.createElement("p");
        prefix.className = "rationale-entry-prefix";
        prefix.textContent = formatTargetLabel(
            entry?.host_ip || "Project-wide",
            entry?.port || "",
            entry?.protocol || "",
        ) || "Project-wide";
        heading.appendChild(prefix);

        const title = document.createElement("strong");
        title.className = "rationale-entry-title";
        title.textContent = String(entry?.headline || entry?.kind || "Decision").trim();
        heading.appendChild(title);

        top.appendChild(heading);

        const time = document.createElement("span");
        time.className = "rationale-entry-time";
        time.textContent = formatFeedTimestamp(entry?.timestamp || "");
        top.appendChild(time);
        article.appendChild(top);

        const tags = Array.isArray(entry?.tags) ? entry.tags.filter((item) => String(item || "").trim()) : [];
        if (tags.length) {
            const tagsNode = document.createElement("div");
            tagsNode.className = "rationale-entry-tags";
            tags.forEach((tag) => {
                const chip = document.createElement("span");
                chip.className = "chip rationale-chip";
                chip.textContent = String(tag || "").trim();
                tagsNode.appendChild(chip);
            });
            article.appendChild(tagsNode);
        }

        const summary = document.createElement("p");
        summary.className = "rationale-entry-summary";
        summary.textContent = String(entry?.summary || "").trim() || "Scheduler decision recorded.";
        article.appendChild(summary);

        const details = Array.isArray(entry?.details) ? entry.details.filter((item) => String(item || "").trim()) : [];
        if (details.length) {
            const detailsNode = document.createElement("div");
            detailsNode.className = "rationale-entry-details";
            details.forEach((detail) => {
                const line = document.createElement("div");
                line.className = "rationale-entry-line";
                line.textContent = String(detail || "").trim();
                detailsNode.appendChild(line);
            });
            article.appendChild(detailsNode);
        }

        fragment.appendChild(article);
    });
    body.appendChild(fragment);
}


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


export function renderDecisions(decisions) {
    const body = document.getElementById("decisions-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    (decisions || []).forEach((decision) => {
        const tr = document.createElement("tr");
        const target = formatTargetLabel(decision.host_ip, decision.port, decision.protocol);
        tr.appendChild(makeCell(decision.timestamp || ""));
        tr.appendChild(makeCell(target));
        tr.appendChild(makeCell(decision.tool_id || decision.label || ""));
        tr.appendChild(makeCell(decision.scheduler_mode || ""));
        tr.appendChild(makeCell(decision.approved || ""));
        tr.appendChild(makeCell(decision.executed || ""));
        tr.appendChild(makeCell(decision.reason || ""));
        tr.appendChild(makeCell(decision.command_family_id || ""));
        body.appendChild(tr);
    });
    setText("decision-count", (decisions || []).length);
}


export function renderApprovals(approvals) {
    const body = document.getElementById("approvals-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    (approvals || []).forEach((item) => {
        const tr = document.createElement("tr");
        tr.dataset.approvalId = String(item.id || "");

        const addDetailLine = (container, label, value) => {
            const text = String(value || "").trim();
            if (!text) {
                return;
            }
            const line = document.createElement("div");
            line.textContent = `${label}: ${text}`;
            container.appendChild(line);
        };

        const actionCell = document.createElement("td");
        addDetailLine(actionCell, "tool", item.label || item.tool_id || "");
        addDetailLine(actionCell, "id", item.tool_id || "");
        addDetailLine(actionCell, "command", item.command_template || "");
        addDetailLine(actionCell, "status", item.status || "");

        const riskCell = document.createElement("td");
        addDetailLine(riskCell, "risk tags", item.risk_tags || item.danger_categories || "");
        addDetailLine(riskCell, "decision", item.policy_decision || "");
        addDetailLine(riskCell, "why risky", item.risk_summary || "");
        addDetailLine(riskCell, "policy", item.policy_reason || "");
        addDetailLine(riskCell, "safer alternative", item.safer_alternative || "");
        addDetailLine(riskCell, "family policy", item.family_policy_state || "");

        const rationaleCell = document.createElement("td");
        addDetailLine(rationaleCell, "planner rationale", item.rationale || "");
        addDetailLine(rationaleCell, "evidence", item.evidence_refs || "");

        const actionsCell = document.createElement("td");
        const approveBtn = document.createElement("button");
        approveBtn.type = "button";
        approveBtn.textContent = "Approve+Run";
        approveBtn.dataset.action = "approve";
        approveBtn.dataset.approvalId = String(item.id || "");

        const rejectBtn = document.createElement("button");
        rejectBtn.type = "button";
        rejectBtn.textContent = "Reject";
        rejectBtn.dataset.action = "reject";
        rejectBtn.dataset.approvalId = String(item.id || "");

        const allowFamilyBtn = document.createElement("button");
        allowFamilyBtn.type = "button";
        allowFamilyBtn.textContent = "Allow Family";
        allowFamilyBtn.dataset.action = "allow-family";
        allowFamilyBtn.dataset.approvalId = String(item.id || "");

        const suppressFamilyBtn = document.createElement("button");
        suppressFamilyBtn.type = "button";
        suppressFamilyBtn.textContent = "Suppress Family";
        suppressFamilyBtn.dataset.action = "suppress-family";
        suppressFamilyBtn.dataset.approvalId = String(item.id || "");

        actionsCell.className = "approval-action-buttons";
        actionsCell.appendChild(approveBtn);
        actionsCell.appendChild(rejectBtn);
        actionsCell.appendChild(allowFamilyBtn);
        actionsCell.appendChild(suppressFamilyBtn);

        const target = formatTargetLabel(item.host_ip, item.port, item.protocol);
        tr.appendChild(makeCell(item.id || ""));
        tr.appendChild(makeCell(target));
        tr.appendChild(actionCell);
        tr.appendChild(riskCell);
        tr.appendChild(rationaleCell);
        tr.appendChild(actionsCell);
        body.appendChild(tr);
    });
    setText("approval-count", (approvals || []).length);
}


export function renderJobs(jobs) {
    publishWorkspaceJobs(jobs || []);
    setText("job-count", (jobs || []).length);
}


export function renderScanHistory(scans) {
    const body = document.getElementById("scan-history-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    (scans || []).forEach((scan) => {
        const tr = document.createElement("tr");
        tr.appendChild(makeCell(scan.id || ""));
        tr.appendChild(makeCell(scan.submission_kind || ""));
        tr.appendChild(makeCell(scan.status || ""));
        tr.appendChild(makeCell(scan.target_summary || ""));
        tr.appendChild(makeCell(scan.scope_summary || ""));
        tr.appendChild(makeCell(scan.scan_mode || ""));
        tr.appendChild(makeCell(scan.created_at || ""));
        tr.appendChild(makeCell(scan.result_summary || ""));
        body.appendChild(tr);
    });
    setText("scan-history-count", (scans || []).length);
}


export async function loadWorkspaceOverview() {
    const body = await fetchJson("/api/workspace/overview");
    applyWorkspaceOverview(body || {});
}


export async function loadProcesses() {
    const body = await fetchJson("/api/processes?limit=100");
    renderProcesses(body.processes || []);
}


export async function loadDecisionHistory() {
    const body = await fetchJson("/api/scheduler/decisions?limit=80");
    renderDecisions(body.decisions || []);
}


export async function loadJobs() {
    const body = await fetchJson("/api/jobs?limit=20");
    renderJobs(body.jobs || []);
}


export async function loadScanHistory() {
    const body = await fetchJson("/api/scans/history?limit=100");
    renderScanHistory(body.scans || []);
}
