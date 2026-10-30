/** Workspace tool settings. */
import { closeRibbonMenus } from "./dialogs.js";
import { escapeHtml, getValue, setChecked, setValue, setWorkspaceStatus } from "./dom.js";
import { graphLoadSnapshot } from "./graph_data.js";
import { graphDismissSelection } from "./graph_detail.js";
import { fetchJson, postJson } from "./http.js";
import { applySchedulerPreferences } from "./scheduler_preferences.js";
import { credentialCaptureState, graphWorkspaceState, toolAuditState } from "./state.js";

export function setToolAuditStatus(text, isError = false) {
    const node = document.getElementById("settings-tool-audit-status");
    if (!node) {
        return;
    }
    node.textContent = text || "";
    node.style.color = isError ? "#ff9b9b" : "";
}


export function setToolInstallStatus(text, isError = false) {
    const node = document.getElementById("settings-tool-install-status");
    if (!node) {
        return;
    }
    node.textContent = text || "";
    node.style.color = isError ? "#ff9b9b" : "";
}


export function setDisplaySettingsStatus(text, isError = false) {
    const node = document.getElementById("settings-display-status");
    if (!node) {
        return;
    }
    node.textContent = text || "";
    node.style.color = isError ? "#ff9b9b" : "";
}


export function setInterfaceSettingsStatus(text, isError = false) {
    const node = document.getElementById("interface-settings-status");
    if (!node) {
        return;
    }
    node.textContent = text || "";
    node.style.color = isError ? "#ff9b9b" : "";
}


export function ensureLogoWatermark(enabled) {
    const existing = document.querySelector(".logo-watermark");
    if (!enabled) {
        if (existing) {
            existing.remove();
        }
        return;
    }
    const rawArt = String(window.LEGION_CONSOLE_LOGO_ART || "");
    if (!rawArt.trim()) {
        return;
    }
    if (existing) {
        return;
    }
    const shell = document.querySelector(".shell");
    if (!shell || !shell.parentNode) {
        return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "logo-watermark";
    wrapper.setAttribute("aria-hidden", "true");
    const pre = document.createElement("pre");
    pre.textContent = rawArt;
    wrapper.appendChild(pre);
    shell.parentNode.insertBefore(wrapper, shell);
}


export function applyColorfulAsciiBackgroundEnabled(enabled) {
    const next = Boolean(enabled);
    window.LEGION_COLORFUL_ASCII_BACKGROUND_ENABLED = next;
    document.body?.classList.toggle("colorful-background", next);
    setChecked("interface-colorful-ascii-background", next);
    ensureLogoWatermark(next);
}


export function applyGraphWorkspaceEnabled(enabled) {
    const next = Boolean(enabled);
    const panel = document.getElementById("graph-workspace-panel");
    const shell = document.getElementById("graph-workspace-shell");
    const disabledState = document.getElementById("graph-workspace-disabled-state");
    if (panel) {
        panel.dataset.graphEnabled = next ? "true" : "false";
        panel.hidden = !next;
    }
    if (shell) {
        shell.hidden = !next;
    }
    if (disabledState) {
        disabledState.hidden = next;
    }
    setChecked("interface-graph-workspace-enabled", next);
    if (!next) {
        graphWorkspaceState.loading = false;
        graphDismissSelection();
        return;
    }
    graphLoadSnapshot({background: false}).catch(() => {});
}


export function applyCredentialCapturePanelEnabled(enabled) {
    const next = Boolean(enabled);
    credentialCaptureState.panelEnabled = next;
    const panel = document.getElementById("credential-capture-panel");
    const button = document.getElementById("ribbon-credential-capture-toggle-button");
    if (panel) {
        panel.hidden = !next;
    }
    if (button) {
        button.setAttribute("aria-pressed", next ? "true" : "false");
        button.classList.toggle("is-active", next);
        button.title = `${next ? "Hide" : "Show"} Responder / NTLM Relay panel`;
    }
    setChecked("interface-credential-capture-panel-enabled", next);
}


export async function toggleCredentialCapturePanelAction() {
    const next = !Boolean(credentialCaptureState.panelEnabled);
    closeRibbonMenus();
    setWorkspaceStatus(`${next ? "Showing" : "Hiding"} Responder / NTLM Relay panel...`);
    try {
        const prefs = await postJson("/api/scheduler/preferences", {
            feature_flags: {
                credential_capture_panel: next,
            },
        });
        applySchedulerPreferences(prefs);
        setWorkspaceStatus(`Responder / NTLM Relay panel ${next ? "enabled" : "hidden"}`);
    } catch (err) {
        setWorkspaceStatus(`Responder / NTLM Relay toggle failed: ${err.message}`, true);
    }
}


export function currentToolInstallPlatform() {
    const select = document.getElementById("settings-tool-install-platform");
    const value = String(select?.value || toolAuditState.recommendedPlatform || "kali").trim().toLowerCase();
    return value === "ubuntu" ? "ubuntu" : "kali";
}


export function syncToolInstallPlatformSelect(preferredPlatform = "") {
    const select = document.getElementById("settings-tool-install-platform");
    if (!select) {
        return "kali";
    }
    const current = String(select.value || "").trim().toLowerCase();
    const normalizedPreferred = String(preferredPlatform || toolAuditState.recommendedPlatform || "kali").trim().toLowerCase();
    if (select.dataset.userSelected === "true" && (current === "kali" || current === "ubuntu")) {
        return current;
    }
    if (normalizedPreferred === "ubuntu") {
        select.value = "ubuntu";
        return "ubuntu";
    }
    select.value = "kali";
    return "kali";
}


export function renderToolInstallPlan(plan) {
    toolAuditState.plan = plan || null;
    const resolvedPlan = plan || {};
    const script = String(resolvedPlan?.script || "");
    setValue("settings-tool-install-script", script);
    const commandCount = Number(resolvedPlan?.command_count || 0);
    const manualCount = Number(resolvedPlan?.manual_count || 0);
    const platform = String(resolvedPlan?.platform || currentToolInstallPlatform() || "kali");
    if (!commandCount && !manualCount) {
        setToolInstallStatus(`No missing tool installs are queued for ${platform}.`);
        return;
    }
    let text = `${commandCount} install command${commandCount === 1 ? "" : "s"} queued for ${platform}`;
    if (manualCount > 0) {
        text += `; ${manualCount} tool${manualCount === 1 ? "" : "s"} still require manual follow-up`;
    }
    setToolInstallStatus(text);
}


export function renderToolAuditRows(rows) {
    const tbody = document.getElementById("settings-tool-audit-body");
    if (!tbody) {
        return;
    }
    const items = Array.isArray(rows) ? rows : [];
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No tool audit data.</td></tr>';
        return;
    }
    tbody.innerHTML = items.map((row) => {
        const status = String(row?.status || "unknown");
        const resolved = row?.resolved_path || row?.configured_value || "-";
        const statusClass = status === "installed"
            ? "tool-audit-status-ok"
            : (status === "configured-missing" ? "tool-audit-status-warn" : "tool-audit-status-missing");
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(row?.label || row?.key || "tool")}</strong>
                    <div class="meta-note">${escapeHtml(row?.purpose || "")}</div>
                    ${row?.notes ? `<div class="meta-note">${escapeHtml(row.notes)}</div>` : ""}
                </td>
                <td>${escapeHtml(row?.category || "")}</td>
                <td><span class="${statusClass}">${escapeHtml(status)}</span></td>
                <td><code>${escapeHtml(resolved)}</code></td>
                <td><code>${escapeHtml(row?.kali_install || "-")}</code></td>
                <td><code>${escapeHtml(row?.ubuntu_install || "-")}</code></td>
            </tr>
        `;
    }).join("");
}


export async function refreshToolAuditAction() {
    setToolAuditStatus("Checking tools...");
    try {
        const body = await fetchJson("/api/settings/tool-audit");
        renderToolAuditRows(body?.tools || []);
        toolAuditState.recommendedPlatform = String(body?.recommended_platform || "kali").trim().toLowerCase() === "ubuntu"
            ? "ubuntu"
            : "kali";
        toolAuditState.supportedPlatforms = Array.isArray(body?.supported_platforms) && body.supported_platforms.length
            ? body.supported_platforms
            : ["kali", "ubuntu"];
        syncToolInstallPlatformSelect(toolAuditState.recommendedPlatform);
        const summary = body?.summary || {};
        setToolAuditStatus(
            `Installed ${summary.installed || 0}/${summary.total || 0}; missing ${summary.missing || 0}; configured missing ${summary.configured_missing || 0}`
        );
        await refreshToolInstallPlanAction(false);
    } catch (err) {
        renderToolAuditRows([]);
        renderToolInstallPlan(null);
        setToolAuditStatus(`Tool audit failed: ${err.message}`, true);
        setToolInstallStatus(`Install plan unavailable: ${err.message}`, true);
    }
}


export async function refreshToolInstallPlanAction(showBusy = true) {
    if (showBusy) {
        setToolInstallStatus("Building install plan...");
    }
    const platform = currentToolInstallPlatform();
    try {
        const body = await fetchJson(`/api/settings/tool-audit/install-plan?platform=${encodeURIComponent(platform)}&scope=missing`);
        renderToolInstallPlan(body || {});
    } catch (err) {
        renderToolInstallPlan(null);
        setToolInstallStatus(`Install plan failed: ${err.message}`, true);
    }
}


export async function copyToolInstallScriptAction() {
    let script = String(getValue("settings-tool-install-script") || "");
    if (!script.trim()) {
        await refreshToolInstallPlanAction(false);
        script = String(getValue("settings-tool-install-script") || "");
    }
    if (!script.trim()) {
        setToolInstallStatus("No install script is available to copy.", true);
        return;
    }
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(script);
        } else {
            const temp = document.createElement("textarea");
            temp.value = script;
            temp.setAttribute("readonly", "readonly");
            temp.style.position = "absolute";
            temp.style.left = "-9999px";
            document.body.appendChild(temp);
            temp.select();
            document.execCommand("copy");
            document.body.removeChild(temp);
        }
        setToolInstallStatus("Install script copied to clipboard.");
    } catch (err) {
        setToolInstallStatus(`Copy failed: ${err.message}`, true);
    }
}


export async function startToolInstallAction() {
    const platform = currentToolInstallPlatform();
    setToolInstallStatus("Queueing install job...");
    try {
        const body = await postJson("/api/settings/tool-audit/install", {
            platform,
            scope: "missing",
        });
        const jobId = Number(body?.job?.id || 0);
        setToolInstallStatus(
            jobId > 0
                ? `Install queued as job #${jobId}. Use Logging > Jobs to monitor progress.`
                : "Install job queued. Use Logging > Jobs to monitor progress."
        );
    } catch (err) {
        setToolInstallStatus(`Install failed to queue: ${err.message}`, true);
    }
}
