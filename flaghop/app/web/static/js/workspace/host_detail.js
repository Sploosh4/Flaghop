import { makeCell, setChecked, setText, setValue } from "./dom.js";
import { normalizeCategoryList, renderCategoryChipList } from "./host_filters.js";
import { extractBannerForPort } from "./output_format.js";
import { workspaceState } from "./state.js";
/** Workspace host detail. */

export function renderHostDetail(payload) {
    workspaceState.hostDetail = payload || null;
    const host = payload?.host || {};
    const ports = payload?.ports || [];
    const observations = payload?.observations || {};
    const targetState = payload?.target_state || {};
    const aiTechnologies = Array.isArray(observations?.technologies) ? observations.technologies : [];
    const stateDeviceCategories = Array.isArray(targetState?.device_categories) ? targetState.device_categories : [];

    setText("host-detail-name", host.ip ? `${host.ip} (${host.hostname || "no-hostname"})` : "");
    setValue("workspace-tool-host-ip", host.ip || "");

    const portsBody = document.getElementById("host-detail-ports");
    if (portsBody) {
        portsBody.innerHTML = "";
        ports.forEach((row) => {
            const tr = document.createElement("tr");
            tr.appendChild(makeCell(row.port || ""));
            tr.appendChild(makeCell(row.protocol || ""));
            tr.appendChild(makeCell(row.state || ""));
            tr.appendChild(makeCell(row.service?.name || ""));
            tr.appendChild(makeCell(`${row.service?.product || ""} ${row.service?.version || ""}`.trim()));
            tr.appendChild(makeCell(extractBannerForPort(row)));
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

    setText("host-ai-tech-count", aiTechnologies.length);
    renderCategoryChipList("host-detail-categories", stateDeviceCategories, "Uncategorized");
    const scanPanel = document.getElementById('host-detail-deep-scans'), scanResults = document.getElementById('host-detail-scan-results');
    if (scanPanel && scanResults) {
        const scans = Array.isArray(payload?.deep_scans) ? payload.deep_scans : [];
        scanPanel.hidden = scans.length === 0;
        scanResults.replaceChildren();
        for (const scan of scans) {
            const details = document.createElement('details'), title = document.createElement('summary'), body = document.createElement('pre');
            title.textContent = `${scan.profile_status || ''} · ${scan.profile_sha256 || ''}`;
            body.textContent = JSON.stringify({role_hypotheses: scan.classification || {}, candidates: scan.candidates || [], reproduced: scan.reproduced || [], task_problems: scan.problems || [], dependency_audit: scan.dependency_audit || ''}, null, 2);
            details.append(title, body); scanResults.append(details);
        }
    }
    setText("host-device-category-count", normalizeCategoryList(stateDeviceCategories).length);
}
