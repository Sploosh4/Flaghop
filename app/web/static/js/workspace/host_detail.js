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
    setText("host-device-category-count", normalizeCategoryList(stateDeviceCategories).length);
}
