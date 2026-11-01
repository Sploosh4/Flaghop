import { processOutputState, scriptOutputState, uiModalState } from "./state.js";
/** Workspace dom. */

export function updateBodyModalState() {
    const anyModalOpen = processOutputState.modalOpen || scriptOutputState.modalOpen || Object.values(uiModalState).some(Boolean);
    document.body.classList.toggle("modal-open", anyModalOpen);
}


export function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) {
        return;
    }
    node.textContent = value ?? "";
}


export function setValue(id, value) {
    const node = document.getElementById(id);
    if (!node) {
        return;
    }
    node.value = value ?? "";
}


export function setChecked(id, checked) {
    const node = document.getElementById(id);
    if (!node) {
        return;
    }
    node.checked = Boolean(checked);
}


export function getChecked(id) {
    const node = document.getElementById(id);
    return node ? Boolean(node.checked) : false;
}


export function getValue(id) {
    const node = document.getElementById(id);
    return node ? node.value : "";
}


export function makeCell(value) {
    const td = document.createElement("td");
    td.textContent = value ?? "";
    return td;
}


export function makeTruncatedCell(value, className = "") {
    const td = document.createElement("td");
    if (className) {
        td.className = className;
    }
    const text = String(value ?? "");
    const span = document.createElement("span");
    span.className = "cell-truncate";
    span.textContent = text;
    if (text) {
        td.title = text;
    }
    td.appendChild(span);
    return td;
}


export function escapeHtml(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


export function setActionStatus(text, isError = false) {
    const node = document.getElementById("action-status");
    if (!node) {
        return;
    }
    node.textContent = text;
    node.style.color = isError ? "#ff9b9b" : "";
}


export function setWorkspaceStatus(text, isError = false) {
    const node = document.getElementById("workspace-status");
    if (!node) {
        return;
    }
    node.textContent = text;
    node.style.color = isError ? "#ff9b9b" : "";
}
