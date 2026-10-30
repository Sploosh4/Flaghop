/** Workspace host detail. */
import { makeCell, setChecked, setText, setValue } from "./dom.js";
import { normalizeCategoryList, renderCategoryChipList } from "./host_filters.js";
import { extractBannerForPort } from "./output_format.js";
import { workspaceState } from "./state.js";

export function renderHostDetail(payload) {
    workspaceState.hostDetail = payload || null;
    const host = payload?.host || {};
    const ports = payload?.ports || [];
    const screenshots = payload?.screenshots || [];
    const aiAnalysis = payload?.ai_analysis || {};
    const targetState = payload?.target_state || {};
    const aiTechnologies = Array.isArray(aiAnalysis?.technologies) ? aiAnalysis.technologies : [];
    const aiManualTests = Array.isArray(aiAnalysis?.manual_tests) ? aiAnalysis.manual_tests : [];
    const aiHostUpdates = aiAnalysis?.host_updates || {};
    const stateAttemptedActions = Array.isArray(targetState?.attempted_actions) ? targetState.attempted_actions : [];
    const stateCoverageGaps = Array.isArray(targetState?.coverage_gaps) ? targetState.coverage_gaps : [];
    const stateUrls = Array.isArray(targetState?.urls) ? targetState.urls : [];
    const stateCredentials = Array.isArray(targetState?.credentials) ? targetState.credentials : [];
    const stateSessions = Array.isArray(targetState?.sessions) ? targetState.sessions : [];
    const stateDeviceCategories = Array.isArray(targetState?.device_categories) ? targetState.device_categories : [];
    const stateManualDeviceCategories = Array.isArray(targetState?.manual_device_categories) ? targetState.manual_device_categories : [];
    const stateDeviceCategoryOverride = Boolean(targetState?.device_category_override);

    setText("host-detail-name", host.ip ? `${host.ip} (${host.hostname || "no-hostname"})` : "");
    setValue("workspace-note", payload?.note || "");
    setValue("workspace-tool-host-ip", host.ip || "");
    setValue("workspace-host-categories", normalizeCategoryList(stateManualDeviceCategories).join(", "));
    setChecked("workspace-host-categories-override", stateDeviceCategoryOverride);

    const portsBody = document.getElementById("host-detail-ports");
    if (portsBody) {
        portsBody.innerHTML = "";
        const screenshotsByPort = new Map();
        screenshots.forEach((shot) => {
            const key = String(shot?.port || "");
            if (!key) {
                return;
            }
            if (!screenshotsByPort.has(key)) {
                screenshotsByPort.set(key, []);
            }
            screenshotsByPort.get(key).push(shot);
        });
        ports.forEach((row) => {
            const tr = document.createElement("tr");
            tr.appendChild(makeCell(row.port || ""));
            tr.appendChild(makeCell(row.protocol || ""));
            tr.appendChild(makeCell(row.state || ""));
            tr.appendChild(makeCell(row.service?.name || ""));
            tr.appendChild(makeCell(`${row.service?.product || ""} ${row.service?.version || ""}`.trim()));
            tr.appendChild(makeCell(extractBannerForPort(row)));
            const screenshotCell = document.createElement("td");
            const byPort = screenshotsByPort.get(String(row.port || "")) || [];
            if (byPort.length > 0) {
                const first = byPort[0];
                const shotButton = document.createElement("button");
                shotButton.type = "button";
                shotButton.className = "host-screenshot-trigger";
                shotButton.textContent = String(first.filename || "screenshot.png");
                shotButton.dataset.screenshotUrl = String(first.url || "");
                shotButton.dataset.screenshotName = String(first.filename || "");
                shotButton.dataset.screenshotPort = String(first.port || row.port || "");
                screenshotCell.appendChild(shotButton);
                if (byPort.length > 1) {
                    const extra = document.createElement("span");
                    extra.className = "text-muted";
                    extra.textContent = ` (+${byPort.length - 1})`;
                    screenshotCell.appendChild(extra);
                }
            }
            tr.appendChild(screenshotCell);
            portsBody.appendChild(tr);
        });
    }

    const scriptsBody = document.getElementById("host-detail-scripts");
    if (scriptsBody) {
        scriptsBody.innerHTML = "";
        ports.forEach((portRow) => {
            (portRow.scripts || []).forEach((scriptRow) => {
                const tr = document.createElement("tr");
                tr.appendChild(makeCell(scriptRow.id || ""));
                tr.appendChild(makeCell(scriptRow.script_id || ""));
                tr.appendChild(makeCell(scriptRow.display_output || (scriptRow.output || "").slice(0, 140)));
                const actions = document.createElement("td");
                const view = document.createElement("button");
                view.type = "button";
                view.textContent = "View";
                view.dataset.scriptViewId = String(scriptRow.id || "");
                actions.appendChild(view);
                const del = document.createElement("button");
                del.type = "button";
                del.textContent = "Delete";
                del.dataset.scriptDeleteId = String(scriptRow.id || "");
                actions.appendChild(del);
                tr.appendChild(actions);
                scriptsBody.appendChild(tr);
            });
        });
    }


    const aiTechBody = document.getElementById("host-detail-ai-technologies");
    if (aiTechBody) {
        aiTechBody.innerHTML = "";
        aiTechnologies.forEach((item) => {
            const tr = document.createElement("tr");
            tr.appendChild(makeCell(item.name || ""));
            tr.appendChild(makeCell(item.version || ""));
            tr.appendChild(makeCell(item.cpe || ""));
            tr.appendChild(makeCell(item.evidence || ""));
            aiTechBody.appendChild(tr);
        });
    }

    const aiManualBody = document.getElementById("host-detail-ai-manual-tests");
    if (aiManualBody) {
        aiManualBody.innerHTML = "";
        aiManualTests.forEach((item) => {
            const tr = document.createElement("tr");
            tr.appendChild(makeCell(item.why || ""));
            tr.appendChild(makeCell(item.command || ""));
            tr.appendChild(makeCell(item.scope_note || ""));
            aiManualBody.appendChild(tr);
        });
    }

    const statusBits = [];
    if (aiAnalysis?.provider) {
        statusBits.push(`provider: ${aiAnalysis.provider}`);
    }
    if (aiAnalysis?.updated_at) {
        statusBits.push(`updated: ${aiAnalysis.updated_at}`);
    }
    if (aiAnalysis?.next_phase) {
        statusBits.push(`next phase: ${aiAnalysis.next_phase}`);
    }
    if (aiHostUpdates?.hostname) {
        statusBits.push(`hostname: ${aiHostUpdates.hostname}`);
    }
    if (aiHostUpdates?.os) {
        statusBits.push(`os: ${aiHostUpdates.os}`);
    }
    if (stateAttemptedActions.length > 0) {
        statusBits.push(`attempted: ${stateAttemptedActions.length}`);
    }
    if (stateCoverageGaps.length > 0) {
        statusBits.push(`coverage gaps: ${stateCoverageGaps.length}`);
    }
    if (stateUrls.length > 0) {
        statusBits.push(`urls: ${stateUrls.length}`);
    }
    if (stateCredentials.length > 0) {
        statusBits.push(`credentials: ${stateCredentials.length}`);
    }
    if (stateSessions.length > 0) {
        statusBits.push(`sessions: ${stateSessions.length}`);
    }
    setText("host-ai-analysis-status", statusBits.join(" | "));
    setText("host-ai-tech-count", aiTechnologies.length);
    setText("host-ai-manual-count", aiManualTests.length);
    renderCategoryChipList("host-detail-categories", stateDeviceCategories, "Uncategorized");
    setText("host-device-category-count", normalizeCategoryList(stateDeviceCategories).length);
    if (stateDeviceCategoryOverride) {
        setText("host-detail-category-note", "Manual categories replace automatic classification for this host.");
    } else if (normalizeCategoryList(stateManualDeviceCategories).length > 0) {
        setText("host-detail-category-note", "Manual categories are additive for this host.");
    } else {
        setText("host-detail-category-note", "");
    }

    const shotsNode = document.getElementById("host-detail-screenshots");
    if (shotsNode) {
        shotsNode.innerHTML = "";
        screenshots.forEach((shot) => {
            const a = document.createElement("a");
            a.href = shot.url || "#";
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = `${shot.filename || "screenshot"} ${shot.port ? `(${shot.port})` : ""}`;
            shotsNode.appendChild(a);
        });
    }
    setText("host-screenshot-count", screenshots.length);
}
