/** Workspace tools. */
import { closeRibbonMenus, dismissManualScanModalAction, setManualScanModalOpen } from "./dialogs.js";
import { getValue, setText, setValue, setWorkspaceStatus } from "./dom.js";
import { fetchJson, postJson } from "./http.js";
import { pollSnapshot } from "./live_updates.js";
import { uiModalState, workspaceState } from "./state.js";
import { loadHostDetail } from "./workspace_data.js";

export function prefillManualScanFromSelection() {
    const current = getValue("workspace-tool-host-ip").trim();
    if (current) {
        return;
    }
    const host = workspaceState.hosts.find((item) => String(item.id) === String(workspaceState.selectedHostId));
    if (host?.ip) {
        setValue("workspace-tool-host-ip", host.ip);
    }
}


export function manualToolTargetKey(target) {
    return [
        String(target?.host_id || ""),
        String(target?.host_ip || ""),
        String(target?.port || ""),
        String(target?.protocol || "tcp"),
        String(target?.service || ""),
    ].join("|");
}


export function populateManualToolSelect(tools, preferredToolId = "") {
    const toolSelect = document.getElementById("workspace-tool-select");
    if (!toolSelect) {
        return;
    }
    workspaceState.manualToolOptions = Array.isArray(tools) ? tools : [];
    const current = String(preferredToolId || toolSelect.value || "").trim();
    toolSelect.innerHTML = "";
    workspaceState.manualToolOptions
        .filter((tool) => tool?.runnable !== false)
        .forEach((tool) => {
            const option = document.createElement("option");
            option.value = String(tool.tool_id || "");
            option.textContent = `${tool.label || tool.tool_id} (${tool.tool_id || ""})`;
            toolSelect.appendChild(option);
        });
    if (current && Array.from(toolSelect.options).some((option) => option.value === current)) {
        toolSelect.value = current;
    }
    renderManualToolParameters();
}


export function selectedManualTool() {
    const toolId = getValue("workspace-tool-select").trim();
    if (!toolId) {
        return null;
    }
    return (Array.isArray(workspaceState.manualToolOptions) ? workspaceState.manualToolOptions : [])
        .find((tool) => String(tool?.tool_id || "") === toolId) || null;
}


export function renderManualToolParameters() {
    const wrapper = document.getElementById("workspace-tool-parameters-wrapper");
    const container = document.getElementById("workspace-tool-parameters");
    if (!wrapper || !container) {
        return;
    }
    container.innerHTML = "";
    const tool = selectedManualTool();
    const parameters = Array.isArray(tool?.parameters) ? tool.parameters : [];
    if (!parameters.length) {
        wrapper.hidden = true;
        return;
    }
    parameters.forEach((parameter) => {
        const name = String(parameter?.name || "").trim();
        if (!name) {
            return;
        }
        const label = document.createElement("label");
        label.textContent = String(parameter?.label || name);
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.parameterName = name;
        input.placeholder = String(parameter?.placeholder || "");
        input.required = Boolean(parameter?.required);
        const description = String(parameter?.description || "").trim();
        if (description) {
            input.title = description;
        }
        label.appendChild(input);
        if (description) {
            const note = document.createElement("span");
            note.className = "meta-note";
            note.textContent = description;
            label.appendChild(note);
        }
        container.appendChild(label);
    });
    wrapper.hidden = false;
}


export function collectManualToolParameters() {
    const wrapper = document.getElementById("workspace-tool-parameters-wrapper");
    const container = document.getElementById("workspace-tool-parameters");
    if (!wrapper || wrapper.hidden || !container) {
        return {};
    }
    const values = {};
    container.querySelectorAll("[data-parameter-name]").forEach((input) => {
        const name = String(input.dataset.parameterName || "").trim();
        const value = String(input.value || "").trim();
        if (name && value) {
            values[name] = value;
        }
    });
    return values;
}


export async function fetchWorkspaceToolsPage({service = "", port = "", protocol = "tcp", limit = 500, offset = 0} = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (service) {
        params.set("service", String(service));
    }
    if (port) {
        params.set("port", String(port));
    }
    if (protocol) {
        params.set("protocol", String(protocol));
    }
    return fetchJson(`/api/workspace/tools?${params.toString()}`);
}


export async function fetchWorkspaceToolsAll({service = "", port = "", protocol = "tcp"} = {}) {
    const allTools = [];
    let offset = 0;
    let pageGuard = 0;
    const pageLimit = 500;

    while (pageGuard < 200) {
        const body = await fetchWorkspaceToolsPage({service, port, protocol, limit: pageLimit, offset});
        const tools = Array.isArray(body?.tools) ? body.tools : [];
        allTools.push(...tools);
        if (!body?.has_more) {
            break;
        }
        const nextOffset = Number(body.next_offset);
        if (!Number.isFinite(nextOffset) || nextOffset <= offset) {
            break;
        }
        offset = nextOffset;
        pageGuard += 1;
    }

    return allTools;
}


export async function fetchWorkspaceToolTargets({hostId = 0, service = "", limit = 500} = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (hostId) {
        params.set("host_id", String(hostId));
    }
    if (service) {
        params.set("service", String(service));
    }
    const body = await fetchJson(`/api/workspace/tool-targets?${params.toString()}`);
    return Array.isArray(body?.targets) ? body.targets : [];
}


export async function loadManualToolOptionsForService(service = "", preferredToolId = "", {port = "", protocol = "tcp"} = {}) {
    const tools = await fetchWorkspaceToolsAll({service, port, protocol});
    populateManualToolSelect(tools, preferredToolId);
    return tools;
}


export async function applyManualToolTarget(target, {preferredToolId = ""} = {}) {
    const resolvedTarget = target && typeof target === "object" ? target : {};
    setValue("workspace-tool-host-ip", resolvedTarget.host_ip || "");
    setValue("workspace-tool-port", resolvedTarget.port || "");
    setValue("workspace-tool-protocol", resolvedTarget.protocol || "tcp");
    await loadManualToolOptionsForService(String(resolvedTarget.service || "").trim(), preferredToolId, {
        port: String(resolvedTarget.port || "").trim(),
        protocol: String(resolvedTarget.protocol || "tcp").trim() || "tcp",
    });
}


export async function renderManualToolTargets(targets, {preferredTargetKey = "", preferredToolId = ""} = {}) {
    workspaceState.manualToolTargets = Array.isArray(targets) ? targets : [];
    const wrapper = document.getElementById("workspace-tool-target-wrapper");
    const select = document.getElementById("workspace-tool-target-select");
    if (!wrapper || !select) {
        return;
    }
    select.innerHTML = "";
    if (!workspaceState.manualToolTargets.length) {
        wrapper.hidden = true;
        return;
    }
    workspaceState.manualToolTargets.forEach((target) => {
        const option = document.createElement("option");
        option.value = manualToolTargetKey(target);
        option.textContent = String(target?.label || `${target?.host_ip || ""}:${target?.port || ""}/${target?.protocol || "tcp"}`);
        select.appendChild(option);
    });
    wrapper.hidden = false;
    const selectedKey = preferredTargetKey && Array.from(select.options).some((option) => option.value === preferredTargetKey)
        ? preferredTargetKey
        : String(select.options[0]?.value || "");
    if (selectedKey) {
        select.value = selectedKey;
    }
    const selectedTarget = workspaceState.manualToolTargets.find((target) => manualToolTargetKey(target) === String(select.value || ""));
    await applyManualToolTarget(selectedTarget, {preferredToolId});
}


export async function openManualToolPicker({
    contextLabel = "",
    targets = null,
    hostId = 0,
    service = "",
    preferredToolId = "",
} = {}) {
    closeRibbonMenus();
    setManualScanModalOpen(true);
    setText("workspace-tool-context", contextLabel || "");
    try {
        let resolvedTargets = Array.isArray(targets) ? targets : [];
        if (!resolvedTargets.length && (Number(hostId) > 0 || String(service || "").trim())) {
            resolvedTargets = await fetchWorkspaceToolTargets({
                hostId: Number(hostId) || 0,
                service: String(service || "").trim(),
                limit: 2000,
            });
        }
        if (resolvedTargets.length) {
            await renderManualToolTargets(resolvedTargets, {preferredToolId});
            return;
        }
    } catch (err) {
        setWorkspaceStatus(`Load tool targets failed: ${err.message}`, true);
    }
    workspaceState.manualToolTargets = [];
    const wrapper = document.getElementById("workspace-tool-target-wrapper");
    const select = document.getElementById("workspace-tool-target-select");
    if (wrapper) {
        wrapper.hidden = true;
    }
    if (select) {
        select.innerHTML = "";
    }
    prefillManualScanFromSelection();
    populateManualToolSelect(workspaceState.tools, preferredToolId);
}


export async function handleManualToolTargetChange() {
    const select = document.getElementById("workspace-tool-target-select");
    if (!select) {
        return;
    }
    const selectedTarget = workspaceState.manualToolTargets.find((target) => {
        return manualToolTargetKey(target) === String(select.value || "");
    });
    if (!selectedTarget) {
        return;
    }
    await applyManualToolTarget(selectedTarget);
}


export async function handleManualToolContextChange() {
    if (!uiModalState.manualScanOpen) {
        return;
    }
    const select = document.getElementById("workspace-tool-target-select");
    let service = "";
    if (select && !select.closest("[hidden]")) {
        const selectedTarget = workspaceState.manualToolTargets.find((target) => {
            return manualToolTargetKey(target) === String(select.value || "");
        });
        service = String(selectedTarget?.service || "").trim();
    }
    await loadManualToolOptionsForService(service, getValue("workspace-tool-select").trim(), {
        port: getValue("workspace-tool-port").trim(),
        protocol: getValue("workspace-tool-protocol").trim() || "tcp",
    });
}


export async function runManualTool() {
    const hostIp = getValue("workspace-tool-host-ip").trim();
    const port = getValue("workspace-tool-port").trim();
    const protocol = getValue("workspace-tool-protocol").trim() || "tcp";
    const toolId = getValue("workspace-tool-select").trim();
    if (!hostIp || !port || !toolId) {
        setWorkspaceStatus("host ip, port and tool are required", true);
        return;
    }
    const parameters = collectManualToolParameters();
    dismissManualScanModalAction();
    setWorkspaceStatus("Queueing tool run...");
    try {
        const body = await postJson("/api/workspace/tools/run", {
            host_ip: hostIp,
            port,
            protocol,
            tool_id: toolId,
            parameters,
        });
        setWorkspaceStatus(`Tool run queued (job ${body?.job?.id || "?"})`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Tool run failed: ${err.message}`, true);
    }
}


export async function runSchedulerNow() {
    if (uiModalState.manualScanOpen) {
        dismissManualScanModalAction();
    }
    setWorkspaceStatus("Queueing scheduler run...");
    try {
        const body = await postJson("/api/scheduler/run", {});
        setWorkspaceStatus(`Scheduler run queued (job ${body?.job?.id || "?"})`);
        await pollSnapshot();
    } catch (err) {
        setWorkspaceStatus(`Scheduler run failed: ${err.message}`, true);
    }
}


export async function addScriptEntry() {
    const hostId = workspaceState.selectedHostId;
    const scriptId = getValue("workspace-script-id").trim();
    const output = getValue("workspace-script-output");
    const port = getValue("workspace-script-port").trim() || getValue("workspace-tool-port").trim();
    const protocol = getValue("workspace-script-protocol").trim() || getValue("workspace-tool-protocol").trim() || "tcp";
    if (!hostId || !scriptId || !port) {
        setWorkspaceStatus("select host and provide script id + port", true);
        return;
    }
    try {
        await postJson(`/api/workspace/hosts/${hostId}/scripts`, {
            script_id: scriptId,
            output,
            port,
            protocol,
        });
        setWorkspaceStatus("Script saved");
        await loadHostDetail(hostId);
    } catch (err) {
        setWorkspaceStatus(`Add script failed: ${err.message}`, true);
    }
}


export async function deleteScript(scriptId) {
    try {
        const response = await fetch(`/api/workspace/scripts/${scriptId}`, {method: "DELETE"});
        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }
        setWorkspaceStatus("Script deleted");
        if (workspaceState.selectedHostId) {
            await loadHostDetail(workspaceState.selectedHostId);
        }
    } catch (err) {
        setWorkspaceStatus(`Delete script failed: ${err.message}`, true);
    }
}
