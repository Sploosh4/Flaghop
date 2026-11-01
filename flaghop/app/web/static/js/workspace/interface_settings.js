import { closeRibbonMenus, setAppSettingsModalOpen } from "./dialogs.js";
import { getChecked, setChecked, updateBodyModalState } from "./dom.js";
import { fetchJson, postJson } from "./http.js";
import { applySchedulerPreferences, normalizeSchedulerFeatureFlags } from "./scheduler_preferences.js";
import { uiModalState } from "./state.js";
import { applyColorfulAsciiBackgroundEnabled, refreshToolAuditAction, setInterfaceSettingsStatus } from "./tool_settings.js";
/** Workspace interface settings. */

export function setInterfaceSettingsModalOpen(open) {
    const overlay = document.getElementById("interface-settings-modal");
    if (!overlay) {
        return;
    }
    uiModalState.interfaceSettingsOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export async function refreshInterfaceSettingsAction() {
    setInterfaceSettingsStatus("Loading interface settings...");
    try {
        const [prefs, display] = await Promise.all([
            fetchJson("/api/scheduler/preferences"),
            fetchJson("/api/settings/display"),
        ]);
        const featureFlags = normalizeSchedulerFeatureFlags(prefs?.feature_flags);
        const graphEnabled = featureFlags.graph_workspace;
        setChecked("interface-graph-workspace-enabled", graphEnabled);
        setChecked("interface-colorful-ascii-background", Boolean(display?.colorful_ascii_background));
        setInterfaceSettingsStatus("Interface settings loaded");
    } catch (err) {
        setInterfaceSettingsStatus(`Load failed: ${err.message}`, true);
    }
}


export async function saveInterfaceSettingsAction() {
    const graphWorkspace = getChecked("interface-graph-workspace-enabled");
    const colorfulAsciiBackground = getChecked("interface-colorful-ascii-background");
    setInterfaceSettingsStatus("Saving interface settings...");
    try {
        const [prefs, display] = await Promise.all([
            postJson("/api/scheduler/preferences", {
                feature_flags: {
                    graph_workspace: graphWorkspace,
                },
            }),
            postJson("/api/settings/display", {
                colorful_ascii_background: colorfulAsciiBackground,
            }),
        ]);
        applySchedulerPreferences(prefs);
        applyColorfulAsciiBackgroundEnabled(Boolean(display?.colorful_ascii_background));
        setInterfaceSettingsStatus("Interface settings saved");
    } catch (err) {
        setInterfaceSettingsStatus(`Save failed: ${err.message}`, true);
    }
}


export async function openAppSettingsAction() {
    closeRibbonMenus();
    setAppSettingsModalOpen(true);
    await Promise.allSettled([
        refreshToolAuditAction(),
    ]);
}


export function closeAppSettingsAction() {
    setAppSettingsModalOpen(false);
}


export async function openInterfaceSettingsAction() {
    closeRibbonMenus();
    setInterfaceSettingsModalOpen(true);
    await refreshInterfaceSettingsAction();
}


export function closeInterfaceSettingsAction() {
    setInterfaceSettingsModalOpen(false);
}
