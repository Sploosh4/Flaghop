/** Workspace device categories. */
import { renderCategoryChipList } from "./host_filters.js";
import { postJson } from "./http.js";
import { applySchedulerPreferences } from "./scheduler_preferences.js";
import { workspaceState } from "./state.js";
import { parseCommaSeparatedList } from "./workspace_data.js";

export function setDeviceCategorySettingsStatus(text, isError = false) {
    const node = document.getElementById("device-category-save-status");
    if (!node) {
        return;
    }
    node.textContent = text || "";
    node.style.color = isError ? "#ff9b9b" : "";
}


export function buildDeviceCategoryRuleRow(rule = {}) {
    const tr = document.createElement("tr");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = String(rule?.name || "");
    nameInput.dataset.deviceCategoryField = "name";
    nameInput.placeholder = "Category name";

    const portsInput = document.createElement("input");
    portsInput.type = "text";
    portsInput.value = Array.isArray(rule?.ports) ? rule.ports.join(", ") : "";
    portsInput.dataset.deviceCategoryField = "ports";
    portsInput.placeholder = "445, 3389";

    const fingerprintInput = document.createElement("input");
    fingerprintInput.type = "text";
    fingerprintInput.value = Array.isArray(rule?.fingerprint_fragments) ? rule.fingerprint_fragments.join(", ") : "";
    fingerprintInput.dataset.deviceCategoryField = "fingerprint_fragments";
    fingerprintInput.placeholder = "iis, microsoft windows rpc";

    const cpeInput = document.createElement("input");
    cpeInput.type = "text";
    cpeInput.value = Array.isArray(rule?.cpe) ? rule.cpe.join(", ") : "";
    cpeInput.dataset.deviceCategoryField = "cpe";
    cpeInput.placeholder = "cpe:/o:microsoft:windows";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "icon-btn icon-btn-danger";
    removeButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    removeButton.title = "Remove category";
    removeButton.setAttribute("aria-label", "Remove category");
    removeButton.addEventListener("click", () => {
        tr.remove();
        if (!document.querySelector("#device-category-rules-body tr")) {
            const body = document.getElementById("device-category-rules-body");
            if (body) {
                body.appendChild(buildDeviceCategoryRuleRow({}));
            }
        }
    });

    [nameInput, portsInput, fingerprintInput, cpeInput].forEach((input) => {
        const td = document.createElement("td");
        td.appendChild(input);
        tr.appendChild(td);
    });
    const actionsTd = document.createElement("td");
    actionsTd.appendChild(removeButton);
    tr.appendChild(actionsTd);
    return tr;
}


export function renderDeviceCategorySettingsModal() {
    renderCategoryChipList(
        "device-category-builtins-list",
        (workspaceState.builtInDeviceCategories || []).map((item) => item?.name || ""),
        "No built-in categories",
    );
    const body = document.getElementById("device-category-rules-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    const rules = Array.isArray(workspaceState.deviceCategoryRules) ? workspaceState.deviceCategoryRules : [];
    if (!rules.length) {
        body.appendChild(buildDeviceCategoryRuleRow({}));
        return;
    }
    rules.forEach((rule) => {
        body.appendChild(buildDeviceCategoryRuleRow(rule));
    });
}


export function collectDeviceCategoryRulesFromModal() {
    const rows = Array.from(document.querySelectorAll("#device-category-rules-body tr"));
    return rows.map((row) => {
        const getFieldValue = (field) => {
            const input = row.querySelector(`[data-device-category-field="${field}"]`);
            return input ? String(input.value || "").trim() : "";
        };
        return {
            name: getFieldValue("name"),
            ports: parseCommaSeparatedList(getFieldValue("ports")),
            fingerprint_fragments: parseCommaSeparatedList(getFieldValue("fingerprint_fragments")),
            cpe: parseCommaSeparatedList(getFieldValue("cpe")),
        };
    }).filter((rule) => rule.name);
}


export async function saveDeviceCategorySettingsAction() {
    setDeviceCategorySettingsStatus("Saving...");
    try {
        const prefs = await postJson("/api/scheduler/preferences", {
            device_categories: collectDeviceCategoryRulesFromModal(),
        });
        applySchedulerPreferences(prefs);
        setDeviceCategorySettingsStatus("Saved");
    } catch (err) {
        setDeviceCategorySettingsStatus(`Save failed: ${err.message}`, true);
    }
}
