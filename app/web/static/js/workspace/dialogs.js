
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let openManualToolPicker, pollSnapshot;
export function connectDialogs(callbacks) {
    for (const name of ["openManualToolPicker", "pollSnapshot"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing dialogs callback: ${name}`);
    }
    ({ openManualToolPicker, pollSnapshot } = callbacks);
}

import { loadProviderLogsAction } from "./activity.js";
import { renderDeviceCategorySettingsModal, setDeviceCategorySettingsStatus } from "./device_categories.js";
import { setText, setValue, updateBodyModalState } from "./dom.js";
import { setHostServiceFilterPopoverOpen } from "./host_filters.js";
import { resetNmapScanWizardState } from "./scan_policy.js";
import { hostRemoveState, ribbonMenuState, uiModalState, workspaceState } from "./state.js";
/** Workspace dialogs. */

export function setNmapScanModalOpen(open) {
    const overlay = document.getElementById("nmap-scan-modal");
    if (!overlay) {
        return;
    }
    uiModalState.nmapScanOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setManualScanModalOpen(open) {
    const overlay = document.getElementById("manual-scan-modal");
    if (!overlay) {
        return;
    }
    uiModalState.manualScanOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setHostSelectionModalOpen(open) {
    const overlay = document.getElementById("host-selection-modal");
    if (!overlay) {
        return;
    }
    uiModalState.hostSelectionOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setScriptCveModalOpen(open) {
    const overlay = document.getElementById("script-cve-modal");
    if (!overlay) {
        return;
    }
    uiModalState.scriptCveOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setProviderLogsModalOpen(open) {
    const overlay = document.getElementById("provider-logs-modal");
    if (!overlay) {
        return;
    }
    uiModalState.providerLogsOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setJobsModalOpen(open) {
    const overlay = document.getElementById("jobs-modal");
    if (!overlay) {
        return;
    }
    uiModalState.jobsOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setSubmittedScansModalOpen(open) {
    const overlay = document.getElementById("submitted-scans-modal");
    if (!overlay) {
        return;
    }
    uiModalState.submittedScansOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setSchedulerDecisionsModalOpen(open) {
    const overlay = document.getElementById("scheduler-decisions-modal");
    if (!overlay) {
        return;
    }
    uiModalState.schedulerDecisionsOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setHostRemoveModalOpen(open) {
    const overlay = document.getElementById("host-remove-modal");
    if (!overlay) {
        return;
    }
    uiModalState.hostRemoveOpen = Boolean(open);
    hostRemoveState.modalOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setGraphNoteModalOpen(open) {
    const overlay = document.getElementById("graph-note-modal");
    if (!overlay) {
        return;
    }
    uiModalState.graphNoteOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
    if (open) {
        window.requestAnimationFrame(() => {
            const input = document.getElementById("graph-note-input");
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    }
}


export function closeNmapScanModalAction() {
    setNmapScanModalOpen(false);
}


export function closeManualScanModalAction() {
    workspaceState.manualToolTargets = [];
    const targetWrapper = document.getElementById("workspace-tool-target-wrapper");
    const targetSelect = document.getElementById("workspace-tool-target-select");
    if (targetWrapper) {
        targetWrapper.hidden = true;
    }
    if (targetSelect) {
        targetSelect.innerHTML = "";
    }
    setText("workspace-tool-context", "");
    setManualScanModalOpen(false);
}


export function dismissManualScanModalAction() {
    setManualScanModalOpen(false);
}


export function closeHostSelectionModalAction() {
    setHostSelectionModalOpen(false);
}


export function closeScriptCveModalAction() {
    setScriptCveModalOpen(false);
}


export function closeProviderLogsModalAction() {
    setProviderLogsModalOpen(false);
}


export function closeJobsModalAction() {
    setJobsModalOpen(false);
}


export function closeSubmittedScansModalAction() {
    setSubmittedScansModalOpen(false);
}


export function closeSchedulerDecisionsModalAction() {
    setSchedulerDecisionsModalOpen(false);
}


export function closeHostRemoveModalAction(clearSelection = true) {
    setHostRemoveModalOpen(false);
    if (clearSelection) {
        hostRemoveState.hostId = null;
        hostRemoveState.hostIp = "";
        hostRemoveState.hostName = "";
        setText("host-remove-modal-target", "");
    }
}


export function closeGraphNoteModalAction(clearInput = false) {
    setGraphNoteModalOpen(false);
    if (clearInput) {
        setValue("graph-note-input", "");
    }
}


export function openAddScanAction() {
    closeRibbonMenus();
    setNmapScanModalOpen(true);
    resetNmapScanWizardState({scrollIntoView: false, focusPreset: true});
}


export function openManualScanAction() {
    openManualToolPicker({});
}


export function openHostSelectionAction() {
    closeRibbonMenus();
    setHostSelectionModalOpen(true);
}


export function openScriptCveAction() {
    closeRibbonMenus();
    setScriptCveModalOpen(true);
}


export async function openProviderLogsAction() {
    closeRibbonMenus();
    setProviderLogsModalOpen(true);
    await loadProviderLogsAction();
}


export async function openJobsAction() {
    closeRibbonMenus();
    setJobsModalOpen(true);
    await pollSnapshot();
}


export async function openSubmittedScansAction() {
    closeRibbonMenus();
    setSubmittedScansModalOpen(true);
    await pollSnapshot();
}


export async function openSchedulerDecisionsAction() {
    closeRibbonMenus();
    setSchedulerDecisionsModalOpen(true);
    await pollSnapshot();
}


export function requestHostRemoveAction(hostId) {
    const id = parseInt(hostId, 10);
    if (!id) {
        return;
    }
    const host = workspaceState.hosts.find((item) => parseInt(item.id, 10) === id);
    hostRemoveState.hostId = id;
    hostRemoveState.hostIp = String(host?.ip || "");
    hostRemoveState.hostName = String(host?.hostname || "");
    const hostLabel = hostRemoveState.hostName
        ? `${hostRemoveState.hostIp} (${hostRemoveState.hostName})`
        : hostRemoveState.hostIp;
    setText("host-remove-modal-target", hostLabel || `Host ID ${id}`);
    setHostRemoveModalOpen(true);
}


export function setSchedulerModalOpen(open) {
    const overlay = document.getElementById("scheduler-settings-modal");
    if (!overlay) {
        return;
    }
    uiModalState.schedulerOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setDeviceCategorySettingsModalOpen(open) {
    const overlay = document.getElementById("device-category-settings-modal");
    if (!overlay) {
        return;
    }
    uiModalState.deviceCategorySettingsOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setReportProviderModalOpen(open) {
    const overlay = document.getElementById("report-provider-modal");
    if (!overlay) {
        return;
    }
    uiModalState.reportProviderOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setAppSettingsModalOpen(open) {
    const overlay = document.getElementById("app-settings-modal");
    if (!overlay) {
        return;
    }
    uiModalState.settingsOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setRibbonMenuOpen(menuId, open) {
    const nextOpen = Boolean(open) ? String(menuId || "").trim() : "";
    ribbonMenuState.openMenuId = nextOpen || null;
    const menus = document.querySelectorAll(".ribbon-menu[data-ribbon-menu]");
    menus.forEach((menu) => {
        const currentId = String(menu.dataset.ribbonMenu || "");
        const isOpen = nextOpen && currentId === nextOpen;
        menu.classList.toggle("is-open", Boolean(isOpen));
        const trigger = menu.querySelector("[data-ribbon-menu-toggle]");
        if (trigger) {
            trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }
    });
}


export function closeRibbonMenus() {
    setRibbonMenuOpen("", false);
    setHostServiceFilterPopoverOpen(false);
}


export function toggleRibbonMenu(menuId) {
    const nextId = String(menuId || "").trim();
    if (!nextId) {
        closeRibbonMenus();
        return;
    }
    const isOpen = ribbonMenuState.openMenuId === nextId;
    setRibbonMenuOpen(nextId, !isOpen);
}


export function openSchedulerSettingsAction() {
    closeRibbonMenus();
    setSchedulerModalOpen(true);
}


export function closeSchedulerSettingsAction() {
    setSchedulerModalOpen(false);
}


export function openDeviceCategorySettingsAction() {
    closeRibbonMenus();
    setDeviceCategorySettingsStatus("Idle");
    renderDeviceCategorySettingsModal();
    setDeviceCategorySettingsModalOpen(true);
}


export function closeDeviceCategorySettingsAction() {
    setDeviceCategorySettingsModalOpen(false);
}


export function openReportProviderAction() {
    closeRibbonMenus();
    setReportProviderModalOpen(true);
}


export function closeReportProviderModalAction() {
    setReportProviderModalOpen(false);
}
