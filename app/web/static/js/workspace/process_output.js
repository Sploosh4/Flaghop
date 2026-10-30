
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let pollSnapshot, setCredentialCaptureConfigModalOpen, setCredentialsModalOpen;
export function connectProcessOutput(callbacks) {
    for (const name of ["pollSnapshot", "setCredentialCaptureConfigModalOpen", "setCredentialsModalOpen"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing process_output callback: ${name}`);
    }
    ({ pollSnapshot, setCredentialCaptureConfigModalOpen, setCredentialsModalOpen } = callbacks);
}

import { makeCell, makeTruncatedCell, setText, setWorkspaceStatus, updateBodyModalState } from "./dom.js";
import { fetchJson, postJson } from "./http.js";
import { formatEtaSeconds, formatTargetLabel, getProcessStatusClass, isProcessRunning, renderAnsiOutput } from "./output_format.js";
import { PROCESS_OUTPUT_REFRESH_MS, processOutputState, screenshotModalState, scriptOutputState } from "./state.js";
/** Workspace process output. */

export function renderProcesses(processes) {
    const body = document.getElementById("processes-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    (processes || []).forEach((process) => {
        const tr = document.createElement("tr");
        tr.dataset.processId = String(process.id || "");
        tr.appendChild(makeCell(process.id));
        tr.appendChild(makeTruncatedCell(process.name, "process-name-cell"));
        const target = formatTargetLabel(process.hostIp, process.port, process.protocol);
        tr.appendChild(makeTruncatedCell(target, "process-target-cell"));
        const statusCell = document.createElement("td");
        statusCell.className = "process-status-cell";
        const statusWrap = document.createElement("span");
        statusWrap.className = "process-status";
        const statusClass = getProcessStatusClass(process.status);
        if (statusClass) {
            statusWrap.classList.add(statusClass);
        }
        if (isProcessRunning(process.status)) {
            const spinner = document.createElement("span");
            spinner.className = "process-spinner";
            spinner.setAttribute("aria-hidden", "true");
            statusWrap.appendChild(spinner);
        }
        const statusText = document.createElement("span");
        statusText.textContent = process.status || "";
        statusWrap.appendChild(statusText);
        statusCell.appendChild(statusWrap);
        tr.appendChild(statusCell);

        let percentDisplay = process.percent || "";
        const numericPercent = Number(String(percentDisplay).replace("%", "").trim());
        if (Number.isFinite(numericPercent)) {
            percentDisplay = `${numericPercent.toFixed(1)}%`;
        }
        const percentCell = makeCell(percentDisplay);
        percentCell.className = "process-percent-cell";
        tr.appendChild(percentCell);
        const etaCell = makeCell(formatEtaSeconds(process.estimatedRemaining));
        etaCell.className = "process-eta-cell";
        tr.appendChild(etaCell);

        const actions = document.createElement("td");
        actions.className = "process-actions";

        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "icon-btn";
        viewBtn.title = "Output";
        viewBtn.setAttribute("aria-label", "Output");
        viewBtn.innerHTML = '<i class="fa-solid fa-terminal" aria-hidden="true"></i>';
        viewBtn.dataset.processAction = "output";
        viewBtn.dataset.processId = String(process.id || "");
        actions.appendChild(viewBtn);

        const retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.className = "icon-btn";
        retryBtn.title = "Retry";
        retryBtn.setAttribute("aria-label", "Retry");
        retryBtn.innerHTML = '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i>';
        retryBtn.dataset.processAction = "retry";
        retryBtn.dataset.processId = String(process.id || "");
        actions.appendChild(retryBtn);

        if (isProcessRunning(process.status)) {
            const killBtn = document.createElement("button");
            killBtn.type = "button";
            killBtn.className = "icon-btn icon-btn-danger";
            killBtn.title = "Kill";
            killBtn.setAttribute("aria-label", "Kill");
            killBtn.innerHTML = '<i class="fa-solid fa-stop" aria-hidden="true"></i>';
            killBtn.dataset.processAction = "kill";
            killBtn.dataset.processId = String(process.id || "");
            actions.appendChild(killBtn);
        }

        const hideBtn = document.createElement("button");
        hideBtn.type = "button";
        hideBtn.className = "icon-btn";
        hideBtn.title = "Hide";
        hideBtn.setAttribute("aria-label", "Hide");
        hideBtn.innerHTML = '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
        hideBtn.dataset.processAction = "close";
        hideBtn.dataset.processId = String(process.id || "");
        actions.appendChild(hideBtn);

        tr.appendChild(actions);
        body.appendChild(tr);
    });
    setText("process-count", (processes || []).length);
}


export function setProcessOutputMeta(text) {
    setText("process-output-meta", text || "");
}


export function setProcessOutputText(text) {
    processOutputState.text = String(text || "");
    renderAnsiOutput("process-output-text", processOutputState.text);
}


export function setProcessOutputCommand(text) {
    setText("process-output-command", text || "");
}


export function setProcessOutputProgress(text) {
    setText("process-output-progress", text || "No structured progress reported");
}


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


export function setScreenshotModalOpen(open) {
    const modal = document.getElementById("screenshot-modal");
    if (!modal) {
        return;
    }
    screenshotModalState.modalOpen = Boolean(open);
    modal.classList.toggle("is-open", Boolean(open));
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function stopProcessOutputAutoRefresh() {
    if (processOutputState.refreshTimer) {
        window.clearInterval(processOutputState.refreshTimer);
        processOutputState.refreshTimer = null;
    }
}


export function startProcessOutputAutoRefresh() {
    stopProcessOutputAutoRefresh();
    processOutputState.refreshTimer = window.setInterval(() => {
        if (!processOutputState.modalOpen) {
            return;
        }
        refreshProcessOutputAction(false, false).catch(() => {});
    }, PROCESS_OUTPUT_REFRESH_MS);
}


export function closeProcessOutputModal(resetSelection = true) {
    stopProcessOutputAutoRefresh();
    processOutputState.refreshInFlight = false;
    setProcessOutputModalOpen(false);
    if (resetSelection) {
        processOutputState.processId = null;
        processOutputState.offset = 0;
        processOutputState.complete = true;
        processOutputState.status = "";
        processOutputState.text = "";
        setProcessOutputMeta("No process selected");
        setProcessOutputCommand("");
        setProcessOutputProgress("");
        setProcessOutputText("");
    }
}


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


export function closeScreenshotModal(resetSelection = true) {
    setScreenshotModalOpen(false);
    if (resetSelection) {
        screenshotModalState.url = "";
        screenshotModalState.filename = "";
        screenshotModalState.port = "";
        const image = document.getElementById("screenshot-modal-image");
        if (image) {
            image.removeAttribute("src");
        }
        setText("screenshot-modal-meta", "No screenshot selected");
    }
}


export function closeCredentialsModalAction() {
    setCredentialsModalOpen(false);
}


export function closeCredentialCaptureConfigModalAction() {
    setCredentialCaptureConfigModalOpen(false);
}


export async function openProcessOutputModal(processId) {
    const pid = parseInt(processId, 10);
    if (!pid) {
        return;
    }
    setProcessOutputModalOpen(true);
    setProcessOutputMeta(`Process ${pid} | loading...`);
    setProcessOutputCommand("");
    setProcessOutputProgress("");
    setProcessOutputText("");
    processOutputState.processId = pid;
    processOutputState.offset = 0;
    processOutputState.complete = false;
    processOutputState.status = "";
    startProcessOutputAutoRefresh();
    try {
        await refreshProcessOutputAction(true, true);
    } catch (err) {
        setProcessOutputMeta(`Process ${pid} | load failed`);
        setProcessOutputProgress("No structured progress reported");
        setProcessOutputText(`Failed to load process output: ${err.message || err}`);
    }
}


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


export function openScreenshotModal(url, filename, port = "") {
    const resolvedUrl = String(url || "").trim();
    if (!resolvedUrl) {
        setWorkspaceStatus("Screenshot URL is missing", true);
        return;
    }
    screenshotModalState.url = resolvedUrl;
    screenshotModalState.filename = String(filename || "").trim() || "screenshot.png";
    screenshotModalState.port = String(port || "").trim();
    const image = document.getElementById("screenshot-modal-image");
    if (image) {
        image.src = `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
        image.alt = screenshotModalState.filename || "Screenshot preview";
    }
    const portSuffix = screenshotModalState.port ? ` (${screenshotModalState.port})` : "";
    setText("screenshot-modal-meta", `${screenshotModalState.filename}${portSuffix}`);
    setScreenshotModalOpen(true);
}


export async function refreshProcessOutputAction(force = false, reset = false) {
    const pid = parseInt(processOutputState.processId, 10);
    if (!pid) {
        return;
    }
    if (!force && processOutputState.complete) {
        return;
    }
    if (processOutputState.refreshInFlight) {
        return;
    }

    processOutputState.refreshInFlight = true;
    try {
        await loadProcessOutput(pid, Boolean(reset));
    } finally {
        processOutputState.refreshInFlight = false;
    }
}


export async function copyProcessOutputAction() {
    const text = processOutputState.text || "";
    await copyTextToClipboard(text, "Process output copied to clipboard", "No process output to copy");
}


export async function copyProcessCommandAction() {
    const node = document.getElementById("process-output-command");
    const text = node ? String(node.textContent || "") : "";
    await copyTextToClipboard(text, "Command copied to clipboard", "No command to copy");
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


export async function copyScreenshotAction() {
    const url = String(screenshotModalState.url || "").trim();
    if (!url) {
        setWorkspaceStatus("No screenshot to copy", true);
        return;
    }
    if (!(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write)) {
        await copyTextToClipboard(url, "Screenshot URL copied to clipboard", "No screenshot to copy");
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const type = blob.type || "image/png";
        const item = new ClipboardItem({[type]: blob});
        await navigator.clipboard.write([item]);
        setWorkspaceStatus("Screenshot copied to clipboard");
    } catch (err) {
        setWorkspaceStatus(`Screenshot copy failed: ${err.message}`, true);
    }
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


export function downloadProcessOutputAction() {
    const text = processOutputState.text || "";
    if (!text) {
        setWorkspaceStatus("No process output to download", true);
        return;
    }
    const processId = parseInt(processOutputState.processId, 10) || "unknown";
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `process-${processId}-output.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setWorkspaceStatus(`Process ${processId} output downloaded`);
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


export async function downloadScreenshotAction() {
    const url = String(screenshotModalState.url || "").trim();
    if (!url) {
        setWorkspaceStatus("No screenshot to download", true);
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const downloadName = String(screenshotModalState.filename || "screenshot.png").replace(/[^a-zA-Z0-9._-]+/g, "-");
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = downloadName || "screenshot.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        setWorkspaceStatus(`Downloaded ${downloadName}`);
    } catch (err) {
        setWorkspaceStatus(`Screenshot download failed: ${err.message}`, true);
    }
}


export async function loadProcessOutput(processId, reset = true) {
    const pid = parseInt(processId, 10);
    if (!pid) {
        return;
    }
    if (reset || processOutputState.processId !== pid) {
        processOutputState.processId = pid;
        processOutputState.offset = 0;
        processOutputState.complete = false;
        processOutputState.status = "";
        setProcessOutputText("");
        setProcessOutputProgress("");
    }

    const query = new URLSearchParams({
        offset: String(processOutputState.offset || 0),
        max_chars: "24000",
    });
    const payload = await fetchJson(`/api/processes/${pid}/output?${query.toString()}`);
    setProcessOutputCommand(payload.command || "");
    const chunk = payload.output_chunk || "";
    const nextOffset = Number(payload.next_offset || 0);
    const current = processOutputState.text || "";
    if (chunk) {
        setProcessOutputText(`${current}${chunk}`);
    } else if (reset && payload.output) {
        setProcessOutputText(payload.output || "");
    }
    processOutputState.offset = nextOffset;
    processOutputState.complete = Boolean(payload.completed);
    processOutputState.status = String(payload.status || "");
    const progress = payload.progress || {};
    const progressLines = [];
    if (progress.summary) {
        progressLines.push(progress.summary);
    }
    if (progress.source || progress.updated_at) {
        const metaBits = [];
        if (progress.source) {
            metaBits.push(String(progress.source));
        }
        if (progress.updated_at) {
            metaBits.push(`updated ${progress.updated_at}`);
        }
        progressLines.push(metaBits.join(" | "));
    }
    setProcessOutputProgress(progressLines.join("\n"));
    setProcessOutputMeta(
        `Process ${payload.id} | ${payload.status || ""} | bytes ${processOutputState.offset}/${payload.output_length || 0}`
    );
}


export async function killProcessAction(processId) {
    try {
        await postJson(`/api/processes/${processId}/kill`, {});
        setWorkspaceStatus(`Process ${processId} kill requested`);
        await pollSnapshot();
        if (processOutputState.modalOpen && parseInt(processOutputState.processId, 10) === parseInt(processId, 10)) {
            await loadProcessOutput(processId, false);
        }
    } catch (err) {
        setWorkspaceStatus(`Kill failed: ${err.message}`, true);
    }
}


export async function retryProcessAction(processId) {
    try {
        const body = await postJson(`/api/processes/${processId}/retry`, {});
        setWorkspaceStatus(`Retry queued for process ${processId} (job ${body?.job?.id || "?"})`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Retry failed: ${err.message}`, true);
    }
}


export async function closeProcessAction(processId) {
    try {
        await postJson(`/api/processes/${processId}/close`, {});
        setWorkspaceStatus(`Process ${processId} hidden`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Hide failed: ${err.message}`, true);
    }
}


export async function clearProcessesAction(resetAll) {
    try {
        await postJson("/api/processes/clear", {reset_all: Boolean(resetAll)});
        setWorkspaceStatus(resetAll ? "Hidden all non-running processes" : "Hidden finished/issues processes");
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Clear failed: ${err.message}`, true);
    }
}


export function renderSummary(summary) {
    setText("stat-hosts", summary.hosts);
    setText("stat-open-ports", summary.open_ports);
    setText("stat-services", summary.services);
    setText("stat-cves", summary.cves);
    setText("stat-running", summary.running_processes);
    setText("stat-finished", summary.finished_processes);
}
