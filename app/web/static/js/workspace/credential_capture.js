import { getChecked, getValue, makeCell, setChecked, setText, setValue, setWorkspaceStatus, updateBodyModalState } from "./dom.js";
import { fetchJson, postJson } from "./http.js";
import { pollSnapshot } from "./live_updates.js";
import { copyTextToClipboard, openProcessOutputModal } from "./process_output.js";
import { credentialCaptureState, uiModalState } from "./state.js";
import { applyCredentialCapturePanelEnabled } from "./tool_settings.js";
/** Workspace credential capture. */

export function setCredentialsModalOpen(open) {
    const modal = document.getElementById("credentials-modal");
    if (!modal) {
        return;
    }
    credentialCaptureState.modalOpen = Boolean(open);
    uiModalState.credentialsOpen = Boolean(open);
    modal.classList.toggle("is-open", Boolean(open));
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setCredentialCaptureConfigModalOpen(open) {
    const modal = document.getElementById("credential-capture-config-modal");
    if (!modal) {
        return;
    }
    credentialCaptureState.configModalOpen = Boolean(open);
    uiModalState.credentialCaptureConfigOpen = Boolean(open);
    modal.classList.toggle("is-open", Boolean(open));
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function renderCredentialCaptureRecentCaptures(captures) {
    const container = document.getElementById("credential-capture-recent-list");
    if (!container) {
        return;
    }
    container.innerHTML = "";
    const rows = Array.isArray(captures) ? captures : [];
    if (!rows.length) {
        const empty = document.createElement("p");
        empty.className = "meta-note credential-capture-empty";
        empty.textContent = "No captured credentials yet.";
        container.appendChild(empty);
        return;
    }
    rows.forEach((capture) => {
        const item = document.createElement("div");
        item.className = "credential-capture-recent-item";

        const title = document.createElement("strong");
        title.textContent = String(capture?.username || "").trim() || "unknown-user";
        item.appendChild(title);

        const source = document.createElement("span");
        source.textContent = String(capture?.source || capture?.tool || "").trim() || "unknown source";
        item.appendChild(source);

        const capturedAt = document.createElement("small");
        capturedAt.textContent = String(capture?.capturedAt || "").trim();
        item.appendChild(capturedAt);
        container.appendChild(item);
    });
}


export function renderCredentialCapturePanel(state) {
    const payload = state && typeof state === "object" ? state : {};
    credentialCaptureState.panelEnabled = payload.panel_enabled !== false;
    credentialCaptureState.responder = payload.responder || {config: {}, session: {}};
    credentialCaptureState.ntlmrelayx = payload.ntlmrelayx || {config: {}, session: {}};
    setText("credential-capture-count", Number(payload.capture_count || 0));
    setText("credential-capture-hash-count", Number(payload.unique_hash_count || 0));
    setText(
        "credential-capture-responder-status",
        String(payload?.responder?.session?.status || "Idle").trim() || "Idle",
    );
    setText(
        "credential-capture-ntlmrelayx-status",
        String(payload?.ntlmrelayx?.session?.status || "Idle").trim() || "Idle",
    );

    const responderMode = String(payload?.responder?.config?.mode || "active").trim().toLowerCase() === "passive"
        ? "passive"
        : "active";
    setValue("credential-capture-responder-mode-quick", responderMode);

    const responderInterface = String(payload?.responder?.config?.interface_name || "").trim();
    const responderSession = payload?.responder?.session || {};
    const responderProgress = responderSession?.progress?.summary || "";
    setText(
        "credential-capture-responder-meta",
        responderProgress
            ? `Interface: ${responderInterface || "not configured"} | ${responderProgress}`
            : `Interface: ${responderInterface || "not configured"}`,
    );

    const relayConfig = payload?.ntlmrelayx?.config || {};
    const relayTarget = String(relayConfig.target || relayConfig.targets_file || "").trim();
    const relaySession = payload?.ntlmrelayx?.session || {};
    const relayProgress = relaySession?.progress?.summary || "";
    setText(
        "credential-capture-ntlmrelayx-meta",
        relayProgress
            ? `Target: ${relayTarget || "not configured"} | ${relayProgress}`
            : `Target: ${relayTarget || "not configured"}`,
    );

    renderCredentialCaptureRecentCaptures(payload.recent_captures || []);
    applyCredentialCapturePanelEnabled(payload.panel_enabled !== false);
}


export function renderCredentialCapturesModal(payload) {
    const state = payload && typeof payload === "object" ? payload : {};
    credentialCaptureState.captures = Array.isArray(state.captures) ? state.captures : [];
    credentialCaptureState.dedupedHashes = Array.isArray(state.deduped_hashes) ? state.deduped_hashes : [];
    setText(
        "credentials-modal-meta",
        `${Number(state.capture_count || credentialCaptureState.captures.length || 0)} captures | ${credentialCaptureState.dedupedHashes.length} unique hashes`,
    );
    const body = document.getElementById("credential-captures-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    if (!credentialCaptureState.captures.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.textContent = "No captured credentials yet.";
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }
    credentialCaptureState.captures.forEach((capture) => {
        const tr = document.createElement("tr");
        tr.appendChild(makeCell(capture.capturedAt || ""));
        tr.appendChild(makeCell(capture.tool || ""));
        tr.appendChild(makeCell(capture.source || ""));
        tr.appendChild(makeCell(capture.username || ""));
        tr.appendChild(makeCell(capture.hash || ""));
        tr.appendChild(makeCell(capture.details || ""));
        body.appendChild(tr);
    });
}


export function fillCredentialCaptureInterfaceOptions(inventory, selectedValue = "") {
    const select = document.getElementById("credential-config-responder-interface");
    if (!select) {
        return;
    }
    const payload = inventory && typeof inventory === "object" ? inventory : {};
    const interfaces = Array.isArray(payload.interfaces) ? payload.interfaces : [];
    const defaultInterface = String(payload.default_interface || "").trim();
    const selected = String(selectedValue || defaultInterface || "").trim();
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = interfaces.length ? "Auto-detect primary interface" : "No interfaces detected";
    select.appendChild(placeholder);
    interfaces.forEach((item) => {
        const option = document.createElement("option");
        option.value = String(item?.name || "").trim();
        option.textContent = String(item?.label || item?.name || "").trim();
        select.appendChild(option);
    });
    setValue("credential-config-responder-interface", selected);
}


export async function loadCredentialCaptureStateAction() {
    const body = await fetchJson("/api/workspace/credential-capture");
    renderCredentialCapturePanel(body || {});
    return body || {};
}


export async function openCredentialCaptureCredentialsAction() {
    try {
        const payload = await fetchJson("/api/workspace/credentials?limit=5000");
        renderCredentialCapturesModal(payload || {});
        setCredentialsModalOpen(true);
    } catch (err) {
        setWorkspaceStatus(`Credential load failed: ${err.message}`, true);
    }
}


export async function copyCredentialCaptureHashesAction() {
    await copyTextToClipboard(
        (credentialCaptureState.dedupedHashes || []).join("\n"),
        "Deduped hashes copied to clipboard",
        "No captured hashes to copy",
    );
}


export function downloadCredentialCaptureHashesAction(format = "txt") {
    const normalized = String(format || "txt").trim().toLowerCase() === "json" ? "json" : "txt";
    window.location.assign(`/api/workspace/credentials/download?format=${normalized}&t=${Date.now()}`);
}


export function populateCredentialCaptureConfigForm(state, inventory) {
    const payload = state && typeof state === "object" ? state : {};
    const responder = payload?.responder?.config || {};
    const relay = payload?.ntlmrelayx?.config || {};
    fillCredentialCaptureInterfaceOptions(inventory, responder.interface_name || "");
    setValue("credential-config-responder-mode", responder.mode || "active");
    setChecked("credential-config-responder-wpad", responder.wpad !== false);
    setChecked("credential-config-responder-force-wpad-auth", responder.force_wpad_auth !== false);
    setChecked("credential-config-responder-proxy-auth", Boolean(responder.proxy_auth));
    setChecked("credential-config-responder-dhcp", Boolean(responder.dhcp));
    setChecked("credential-config-responder-dhcp-dns", Boolean(responder.dhcp_dns));
    setChecked("credential-config-responder-basic-auth", Boolean(responder.basic_auth));
    setValue("credential-config-responder-extra-args", responder.extra_args || "");

    setValue("credential-config-ntlmrelayx-target", relay.target || "");
    setValue("credential-config-ntlmrelayx-targets-file", relay.targets_file || "");
    setValue("credential-config-ntlmrelayx-interface-ip", relay.interface_ip || "");
    setChecked("credential-config-ntlmrelayx-smb2support", relay.smb2support !== false);
    setChecked("credential-config-ntlmrelayx-interactive", Boolean(relay.interactive));
    setChecked("credential-config-ntlmrelayx-socks", Boolean(relay.socks));
    setChecked("credential-config-ntlmrelayx-output-hashes", relay.output_hashes !== false);
    setValue("credential-config-ntlmrelayx-extra-args", relay.extra_args || "");
}


export function collectCredentialCaptureConfigFromForm() {
    return {
        responder: {
            interface_name: getValue("credential-config-responder-interface").trim(),
            mode: getValue("credential-config-responder-mode").trim() || "active",
            wpad: getChecked("credential-config-responder-wpad"),
            force_wpad_auth: getChecked("credential-config-responder-force-wpad-auth"),
            proxy_auth: getChecked("credential-config-responder-proxy-auth"),
            dhcp: getChecked("credential-config-responder-dhcp"),
            dhcp_dns: getChecked("credential-config-responder-dhcp-dns"),
            basic_auth: getChecked("credential-config-responder-basic-auth"),
            extra_args: getValue("credential-config-responder-extra-args").trim(),
        },
        ntlmrelayx: {
            target: getValue("credential-config-ntlmrelayx-target").trim(),
            targets_file: getValue("credential-config-ntlmrelayx-targets-file").trim(),
            interface_ip: getValue("credential-config-ntlmrelayx-interface-ip").trim(),
            smb2support: getChecked("credential-config-ntlmrelayx-smb2support"),
            interactive: getChecked("credential-config-ntlmrelayx-interactive"),
            socks: getChecked("credential-config-ntlmrelayx-socks"),
            output_hashes: getChecked("credential-config-ntlmrelayx-output-hashes"),
            extra_args: getValue("credential-config-ntlmrelayx-extra-args").trim(),
        },
    };
}


export async function openCredentialCaptureConfigAction() {
    setText("credential-capture-config-status", "Loading...");
    try {
        const [state, inventory] = await Promise.all([
            fetchJson("/api/workspace/credential-capture"),
            fetchJson("/api/network/interfaces"),
        ]);
        renderCredentialCapturePanel(state || {});
        populateCredentialCaptureConfigForm(state || {}, inventory || {});
        setText("credential-capture-config-status", "Loaded");
        setCredentialCaptureConfigModalOpen(true);
    } catch (err) {
        setWorkspaceStatus(`Credential capture config load failed: ${err.message}`, true);
    }
}


export async function saveCredentialCaptureConfigAction(event) {
    if (event) {
        event.preventDefault();
    }
    setText("credential-capture-config-status", "Saving...");
    try {
        const body = await postJson("/api/workspace/credential-capture/config", collectCredentialCaptureConfigFromForm());
        renderCredentialCapturePanel(body || {});
        setText("credential-capture-config-status", "Saved");
    } catch (err) {
        setText("credential-capture-config-status", `Save failed: ${err.message}`);
        setWorkspaceStatus(`Credential capture config save failed: ${err.message}`, true);
    }
}


export async function saveCredentialCaptureResponderModeQuickAction() {
    const mode = String(getValue("credential-capture-responder-mode-quick") || "active").trim().toLowerCase() === "passive"
        ? "passive"
        : "active";
    try {
        const body = await postJson("/api/workspace/credential-capture/config", {
            responder: {mode},
        });
        renderCredentialCapturePanel(body || {});
        setWorkspaceStatus(`Responder mode set to ${mode}`);
    } catch (err) {
        setWorkspaceStatus(`Responder mode update failed: ${err.message}`, true);
    }
}


export function credentialCaptureSessionProcessId(toolId) {
    const normalized = String(toolId || "").trim().toLowerCase();
    if (normalized === "responder") {
        return Number(credentialCaptureState?.responder?.session?.process_id || 0);
    }
    if (normalized === "ntlmrelayx") {
        return Number(credentialCaptureState?.ntlmrelayx?.session?.process_id || 0);
    }
    return 0;
}


export async function openCredentialCaptureLogAction(toolId) {
    const processId = credentialCaptureSessionProcessId(toolId);
    if (!processId) {
        setWorkspaceStatus(`No ${toolId} session log available`, true);
        return;
    }
    await openProcessOutputModal(processId);
}


export function downloadCredentialCaptureLogAction(toolId) {
    const normalized = String(toolId || "").trim().toLowerCase();
    if (!normalized) {
        return;
    }
    window.location.assign(`/api/workspace/credential-capture/log?tool=${encodeURIComponent(normalized)}&t=${Date.now()}`);
}


export async function startCredentialCaptureToolAction(toolId) {
    try {
        const body = await postJson("/api/workspace/credential-capture/start", {tool: toolId});
        setWorkspaceStatus(`${toolId} queued (job ${body?.job?.id || "?"})`);
        await pollSnapshot();
        await loadCredentialCaptureStateAction();
    } catch (err) {
        setWorkspaceStatus(`Start ${toolId} failed: ${err.message}`, true);
    }
}


export async function stopCredentialCaptureToolAction(toolId) {
    try {
        const body = await postJson("/api/workspace/credential-capture/stop", {tool: toolId});
        if (body?.stopped) {
            setWorkspaceStatus(`${toolId} stop requested`);
        } else {
            setWorkspaceStatus(`${toolId} is not running`, true);
        }
        await pollSnapshot();
        await loadCredentialCaptureStateAction();
    } catch (err) {
        setWorkspaceStatus(`Stop ${toolId} failed: ${err.message}`, true);
    }
}
