import {publishActivity, requestActivity} from "./activity_bridge.js";

import { setText, setWorkspaceStatus, updateBodyModalState } from "./dom.js";
import { fetchJson } from "./http.js";
import { renderAnsiOutput } from "./output_format.js";
import { processOutputState, scriptOutputState } from "./state.js";
/** Workspace process output. */

export function renderProcesses(rows) { publishActivity("processes", rows || []); }

export function setScriptOutputMeta(text) {
    setText("script-output-meta", text || "");
}


export function setScriptOutputText(text) {
    scriptOutputState.output = String(text || "");
    renderAnsiOutput("script-output-text", scriptOutputState.output);
}


export function setScriptOutputCommand(text) {
    setText("script-output-command", text || "");
}


export function setProcessOutputModalOpen(open) {
    const modal = document.getElementById("process-output-modal");
    if (!modal) {
        return;
    }
    processOutputState.modalOpen = Boolean(open);
    modal.classList.toggle("is-open", Boolean(open));
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setScriptOutputModalOpen(open) {
    const modal = document.getElementById("script-output-modal");
    if (!modal) {
        return;
    }
    scriptOutputState.modalOpen = Boolean(open);
    modal.classList.toggle("is-open", Boolean(open));
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function closeProcessOutputModal() { return requestActivity("closeOutput"); }

export function closeScriptOutputModal(resetSelection = true) {
    setScriptOutputModalOpen(false);
    if (resetSelection) {
        scriptOutputState.scriptDbId = null;
        scriptOutputState.processId = 0;
        scriptOutputState.scriptId = "";
        scriptOutputState.source = "";
        scriptOutputState.output = "";
        scriptOutputState.command = "";
        scriptOutputState.status = "";
        scriptOutputState.downloadName = "";
        setText("script-output-modal-title", "Script Output");
        setScriptOutputMeta("No script selected");
        setScriptOutputCommand("");
        setScriptOutputText("");
    }
}


export function openProcessOutputModal(id) { return requestActivity("openOutput", Number(id)); }

export async function openScriptOutputModal(scriptDbId) {
    const sid = parseInt(scriptDbId, 10);
    if (!sid) {
        return;
    }
    setScriptOutputModalOpen(true);
    setText("script-output-modal-title", "Script Output");
    setScriptOutputMeta(`Script ${sid} | loading...`);
    setScriptOutputCommand("");
    setScriptOutputText("");
    scriptOutputState.scriptDbId = sid;
    scriptOutputState.processId = 0;
    scriptOutputState.scriptId = "";
    scriptOutputState.source = "";
    scriptOutputState.output = "";
    scriptOutputState.command = "";
    scriptOutputState.status = "";
    scriptOutputState.downloadName = "";
    try {
        const payload = await fetchJson(`/api/workspace/scripts/${sid}/output?max_chars=50000`);
        const outputText = String(payload.output || payload.output_chunk || "");
        const sourceLabel = payload.source === "process"
            ? `Process ${payload.process_id || "?"}`
            : "Script row output";
        scriptOutputState.processId = parseInt(payload.process_id, 10) || 0;
        scriptOutputState.scriptId = String(payload.script_id || "");
        scriptOutputState.source = String(payload.source || "");
        scriptOutputState.output = outputText;
        scriptOutputState.command = String(payload.command || "");
        scriptOutputState.status = String(payload.status || "");
        scriptOutputState.downloadName = "";
        setScriptOutputCommand(payload.command || "(no associated process command)");
        setScriptOutputText(outputText);
        setScriptOutputMeta(
            `${payload.script_id || `Script ${sid}`} | ${sourceLabel} | bytes ${payload.output_length || outputText.length}`
        );
    } catch (err) {
        setScriptOutputMeta(`Script ${sid} | load failed`);
        setScriptOutputText(`Failed to load script output: ${err.message || err}`);
    }
}


export function openTextPreviewModal({title = "Artifact Preview", meta = "", command = "", output = "", downloadName = ""} = {}) {
    setScriptOutputModalOpen(true);
    scriptOutputState.scriptDbId = null;
    scriptOutputState.processId = 0;
    scriptOutputState.scriptId = "";
    scriptOutputState.source = "graph";
    scriptOutputState.output = String(output || "");
    scriptOutputState.command = String(command || "");
    scriptOutputState.status = "";
    scriptOutputState.downloadName = String(downloadName || "");
    setText("script-output-modal-title", title || "Artifact Preview");
    setScriptOutputMeta(String(meta || "Artifact preview"));
    setScriptOutputCommand(command || "(no associated command)");
    setScriptOutputText(output || "");
}


export async function copyScriptOutputAction() {
    const text = scriptOutputState.output || "";
    await copyTextToClipboard(text, "Script output copied to clipboard", "No script output to copy");
}


export async function copyScriptCommandAction() {
    const node = document.getElementById("script-output-command");
    const text = node ? String(node.textContent || "") : "";
    await copyTextToClipboard(text, "Command copied to clipboard", "No command to copy");
}


export async function copyTextToClipboard(text, successMessage, emptyMessage) {
    const value = String(text || "");
    if (!value) {
        setWorkspaceStatus(emptyMessage || "Nothing to copy", true);
        return;
    }
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(value);
        } else {
            const temp = document.createElement("textarea");
            temp.value = value;
            temp.setAttribute("readonly", "readonly");
            temp.style.position = "absolute";
            temp.style.left = "-9999px";
            document.body.appendChild(temp);
            temp.select();
            document.execCommand("copy");
            document.body.removeChild(temp);
        }
        setWorkspaceStatus(successMessage || "Copied to clipboard");
    } catch (err) {
        setWorkspaceStatus(`Copy failed: ${err.message}`, true);
    }
}


export function downloadScriptOutputAction() {
    const text = scriptOutputState.output || "";
    if (!text) {
        setWorkspaceStatus("No script output to download", true);
        return;
    }
    if (scriptOutputState.downloadName) {
        const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = scriptOutputState.downloadName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setWorkspaceStatus(`${scriptOutputState.downloadName} downloaded`);
        return;
    }
    const scriptDbId = parseInt(scriptOutputState.scriptDbId, 10) || "unknown";
    const scriptId = String(scriptOutputState.scriptId || "").trim() || `script-${scriptDbId}`;
    const safeName = scriptId.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}-${scriptDbId}-output.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setWorkspaceStatus(`Script ${scriptDbId} output downloaded`);
}


export function renderSummary(summary) {
    setText("stat-hosts", summary.hosts);
    setText("stat-open-ports", summary.open_ports);
    setText("stat-services", summary.services);
    setText("stat-cves", summary.cves);
    setText("stat-running", summary.running_processes);
    setText("stat-finished", summary.finished_processes);
}
