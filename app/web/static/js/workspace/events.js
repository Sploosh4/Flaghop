
import { buildDeviceCategoryRuleRow, saveDeviceCategorySettingsAction } from "./device_categories.js";
import { closeDeviceCategorySettingsAction, closeGraphNoteModalAction, closeHostRemoveModalAction, closeManualScanModalAction, closeNmapScanModalAction, closeRibbonMenus, closeSchedulerSettingsAction, openAddScanAction, openDeviceCategorySettingsAction, openManualScanAction, openSchedulerSettingsAction, toggleRibbonMenu } from "./dialogs.js";
import { graphClearFocusAction, graphCollapseExpandedAction, graphFocusSelectionAction, graphOpenNoteModalAction, graphResetLayoutAction, graphSaveAnnotationAction, graphSaveLayoutAction, graphTidyLayoutAction, graphToggleExpandSelectionAction, graphTogglePinAction } from "./graph_actions.js";
import { getGraphCanvasScrollNode, getGraphWorkspaceSection, graphHasActiveSelection, graphWorkspaceEnabled, resetGraphWorkspaceHeight, restoreGraphWorkspaceHeight, startGraphWorkspaceResize } from "./graph_common.js";
import { graphRebuildAction, graphRefreshAction } from "./graph_data.js";
import { graphDismissSelection, graphSetFiltersExpanded, graphSyncDetailPresentation, graphToggleDetailModeAction } from "./graph_detail.js";
import { graphRenderWorkspace } from "./graph_render.js";
import { confirmHostRemoveAction, handleHostActionButtonAction } from "./host_actions.js";
import { resetHostFiltersAction, setHostCategoryFilterAction, setHostFilterAction, setHostServiceFilterPopoverOpen, setHostServiceFiltersAction, setServicesCategoryFilterAction } from "./host_filters.js";
import { closeAppSettingsAction, closeInterfaceSettingsAction, openAppSettingsAction, openInterfaceSettingsAction, saveInterfaceSettingsAction } from "./interface_settings.js";
import { closeProcessOutputModal, closeScriptOutputModal, copyScriptCommandAction, copyScriptOutputAction, downloadScriptOutputAction, openScriptOutputModal } from "./process_output.js";
import { closeWorkspaceSwitchGuardAction, createNewTemporaryProject, downloadWorkspaceBundleAction, importNmapXmlFromRibbonAction, openWorkspaceFromRibbonAction, restoreWorkspaceBundleAction, restoreWorkspaceBundleSelectedAction, saveWorkspaceAction, saveWorkspaceAsAction, stopActiveWorkspaceWorkAndContinueAction } from "./projects.js";
import { refreshNmapModeOptions, runNmapScan, setNmapWizardStep, updateNmapCommandPreview } from "./scan.js";
import { resetNmapScanWizardState, syncNmapEngagementPresetControls } from "./scan_policy.js";
import { graphWorkspaceState, nmapWizardState, processOutputState, ribbonMenuState, scriptOutputState, uiModalState } from "./state.js";
import { copyToolInstallScriptAction, refreshToolAuditAction, startToolInstallAction } from "./tool_settings.js";
import { handleManualToolContextChange, handleManualToolTargetChange, renderManualToolParameters, runManualTool, runSchedulerNow } from "./tools.js";
import { refreshWorkspace } from "./workspace_data.js";
import { selectHost, setGraphPanelCollapsed, setServicesPanelCollapsed, toggleGraphPanelAction, toggleServicesPanelAction } from "./workspace_view.js";
/** Workspace events. */

export function bindActionButtons() {
    const bind = (id, handler) => {
        const node = document.getElementById(id);
        if (node) {
            node.addEventListener("click", handler);
        }
    };

    bind("nmap-scan-button", runNmapScan);
    bind("ribbon-workspace-new-action-button", createNewTemporaryProject);
    bind("ribbon-workspace-open-action-button", openWorkspaceFromRibbonAction);
    bind("ribbon-workspace-save-action-button", saveWorkspaceAction);
    bind("ribbon-workspace-save-as-action-button", saveWorkspaceAsAction);
    bind("ribbon-workspace-download-action-button", downloadWorkspaceBundleAction);
    bind("ribbon-workspace-restore-action-button", restoreWorkspaceBundleAction);
    bind("ribbon-import-xml-action-button", importNmapXmlFromRibbonAction);
    bind("hosts-reset-filter-button", resetHostFiltersAction);
    bind("hosts-filter-show-all-button", () => setHostFilterAction("show_all"));
    bind("hosts-filter-hide-down-button", () => setHostFilterAction("hide_down"));
    bind("services-panel-toggle-button", toggleServicesPanelAction);
    bind("graph-panel-toggle-button", toggleGraphPanelAction);
    bind("ribbon-scan-add-action-button", openAddScanAction);
    bind("ribbon-scan-manual-action-button", openManualScanAction);
    bind("ribbon-scheduler-settings-button", openSchedulerSettingsAction);
    bind("ribbon-interface-settings-button", openInterfaceSettingsAction);
    bind("ribbon-device-category-settings-button", openDeviceCategorySettingsAction);
    bind("ribbon-app-settings-button", openAppSettingsAction);

    bind("workspace-refresh-button", refreshWorkspace);
    bind("workspace-run-tool-button", runManualTool);
    bind("workspace-run-scheduler-button", runSchedulerNow);
    bind("graph-refresh-button", graphRefreshAction);
    bind("graph-rebuild-button", graphRebuildAction);
    bind("graph-filters-toggle-button", () => graphSetFiltersExpanded(!graphWorkspaceState.filtersExpanded));
    bind("graph-focus-selection-button", graphFocusSelectionAction);
    bind("graph-clear-focus-button", graphClearFocusAction);
    bind("graph-expand-selection-button", graphToggleExpandSelectionAction);
    bind("graph-collapse-expanded-button", graphCollapseExpandedAction);
    bind("graph-layout-save-button", graphSaveLayoutAction);
    bind("graph-layout-reset-button", graphResetLayoutAction);
    bind("graph-note-open-button", graphOpenNoteModalAction);
    bind("graph-note-save-button", graphSaveAnnotationAction);
    bind("graph-note-modal-close", () => closeGraphNoteModalAction(false));
    bind("graph-note-modal-cancel", () => closeGraphNoteModalAction(false));
    bind("graph-pin-toggle-button", graphTogglePinAction);
    bind("graph-detail-dock-toggle-button", graphToggleDetailModeAction);
    bind("graph-detail-close-button", graphDismissSelection);
    graphSetFiltersExpanded(graphWorkspaceState.filtersExpanded);
    setServicesPanelCollapsed(true);
    setGraphPanelCollapsed(false);

    const graphScrollNode = getGraphCanvasScrollNode();
    if (graphScrollNode) {
        graphScrollNode.addEventListener("scroll", () => {
            if (graphWorkspaceState.detailMode === "floating" && graphHasActiveSelection()) {
                graphSyncDetailPresentation();
            }
        });
    }
    window.addEventListener("resize", () => {
        if (graphWorkspaceEnabled()) {
            graphRenderWorkspace({preserveDetail: true});
        }
    });

    const hostSelect = document.getElementById("workspace-host-select");
    if (hostSelect) {
        hostSelect.addEventListener("change", async (event) => {
            await selectHost(event.target.value, {syncGraph: true, preserveGraphDetail: true});
        });
    }
    const hostsCategoryFilter = document.getElementById("hosts-category-filter-select");
    if (hostsCategoryFilter) {
        hostsCategoryFilter.addEventListener("change", async (event) => {
            await setHostCategoryFilterAction(event.target.value);
        });
    }
    const hostsServiceFilterButton = document.getElementById("hosts-service-filter-button");
    if (hostsServiceFilterButton) {
        hostsServiceFilterButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const popover = document.getElementById("hosts-service-filter-popover");
            setHostServiceFilterPopoverOpen(Boolean(popover?.hidden));
        });
    }
    const hostsServiceFilterClearButton = document.getElementById("hosts-service-filter-clear-button");
    if (hostsServiceFilterClearButton) {
        hostsServiceFilterClearButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await setHostServiceFiltersAction([]);
        });
    }
    const hostsServiceFilterPopover = document.getElementById("hosts-service-filter-popover");
    if (hostsServiceFilterPopover) {
        hostsServiceFilterPopover.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    }
    document.addEventListener("click", () => {
        setHostServiceFilterPopoverOpen(false);
    });
    const servicesCategoryFilter = document.getElementById("services-category-filter-select");
    if (servicesCategoryFilter) {
        servicesCategoryFilter.addEventListener("change", async (event) => {
            await setServicesCategoryFilterAction(event.target.value);
        });
    }

    const manualTargetSelect = document.getElementById("workspace-tool-target-select");
    if (manualTargetSelect) {
        manualTargetSelect.addEventListener("change", async () => {
            await handleManualToolTargetChange();
        });
    }
    ["workspace-tool-port", "workspace-tool-protocol"].forEach((elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener("change", async () => {
                await handleManualToolContextChange();
            });
        }
    });
    const manualToolSelect = document.getElementById("workspace-tool-select");
    if (manualToolSelect) {
        manualToolSelect.addEventListener("change", () => {
            renderManualToolParameters();
        });
    }

    const hostsBody = document.getElementById("hosts-body");
    if (hostsBody) {
        hostsBody.addEventListener("click", async (event) => {
            const actionBtn = event.target.closest("button[data-host-action]");
            if (actionBtn) {
                if (await handleHostActionButtonAction(actionBtn)) {
                    return;
                }
            }

            const row = event.target.closest("tr[data-host-id]");
            if (!row) {
                return;
            }
            const hostId = parseInt(row.dataset.hostId, 10);
            if (!hostId) {
                return;
            }
            await selectHost(hostId, {syncGraph: true, preserveGraphDetail: true});
        });
    }

    const scriptsBody = document.getElementById("host-detail-scripts");
    if (scriptsBody) {
        scriptsBody.addEventListener("click", async (event) => {
            const viewBtn = event.target.closest("button[data-script-view-id]");
            if (viewBtn) {
                const viewId = parseInt(viewBtn.dataset.scriptViewId, 10);
                if (!viewId) {
                    return;
                }
                await openScriptOutputModal(viewId);
                return;
            }
            const deleteBtn = event.target.closest("button[data-script-delete-id]");
            if (!deleteBtn) {
                return;
            }
            const id = parseInt(deleteBtn.dataset.scriptDeleteId, 10);
            if (!id) {
                return;
            }
        });
    }


    bind("nmap-wizard-back", () => setNmapWizardStep(nmapWizardState.step - 1));
    bind("nmap-wizard-next", () => setNmapWizardStep(nmapWizardState.step + 1));
    bind("scheduler-modal-close", closeSchedulerSettingsAction);
    bind("interface-settings-modal-close", closeInterfaceSettingsAction);
    bind("interface-settings-save-button", saveInterfaceSettingsAction);
    bind("device-category-modal-close", closeDeviceCategorySettingsAction);
    bind("device-category-add-rule-button", () => {
        const body = document.getElementById("device-category-rules-body");
        if (body) {
            body.appendChild(buildDeviceCategoryRuleRow({}));
        }
    });
    bind("device-category-save-button", saveDeviceCategorySettingsAction);
    bind("settings-modal-close", closeAppSettingsAction);
    bind("settings-tool-audit-refresh-button", refreshToolAuditAction);
    bind("settings-tool-install-copy-button", copyToolInstallScriptAction);
    bind("settings-tool-install-run-button", startToolInstallAction);
    bind("workspace-switch-guard-close", closeWorkspaceSwitchGuardAction);
    bind("workspace-switch-guard-cancel-button", closeWorkspaceSwitchGuardAction);
    bind("workspace-switch-guard-stop-button", stopActiveWorkspaceWorkAndContinueAction);
    bind("nmap-scan-modal-close", closeNmapScanModalAction);
    bind("manual-scan-modal-close", closeManualScanModalAction);
    bind("host-remove-modal-close", () => closeHostRemoveModalAction(true));
    bind("host-remove-modal-cancel", () => closeHostRemoveModalAction(true));
    bind("host-remove-modal-confirm", confirmHostRemoveAction);
    bind("script-output-modal-close", () => closeScriptOutputModal(true));
    bind("script-output-copy-button", copyScriptOutputAction);
    bind("script-output-command-copy", copyScriptCommandAction);
    bind("script-output-download-button", downloadScriptOutputAction);
    bind("graph-layout-tidy-button", graphTidyLayoutAction);

    const restoreZipInput = document.getElementById("project-restore-zip-file");
    if (restoreZipInput) {
        restoreZipInput.addEventListener("change", restoreWorkspaceBundleSelectedAction);
    }

    const ribbonMenuToggles = document.querySelectorAll("[data-ribbon-menu-toggle]");
    ribbonMenuToggles.forEach((toggle) => {
        toggle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleRibbonMenu(toggle.getAttribute("data-ribbon-menu-toggle"));
        });
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".ribbon-menu")) {
            closeRibbonMenus();
        }
    });

    const graphResizeHandle = document.getElementById("graph-resize-handle");
    if (graphResizeHandle) {
        graphResizeHandle.addEventListener("pointerdown", startGraphWorkspaceResize);
        graphResizeHandle.addEventListener("dblclick", (event) => {
            event.preventDefault();
            resetGraphWorkspaceHeight();
        });
    }

    restoreGraphWorkspaceHeight();

    const processOutputModal = document.getElementById("process-output-modal");
    if (processOutputModal) {
        processOutputModal.addEventListener("click", (event) => {
            if (event.target === processOutputModal) {
                closeProcessOutputModal(true);
            }
        });
    }

    const scriptOutputModal = document.getElementById("script-output-modal");
    if (scriptOutputModal) {
        scriptOutputModal.addEventListener("click", (event) => {
            if (event.target === scriptOutputModal) {
                closeScriptOutputModal(true);
            }
        });
    }

    const nmapScanModal = document.getElementById("nmap-scan-modal");
    if (nmapScanModal) {
        nmapScanModal.addEventListener("click", (event) => {
            if (event.target === nmapScanModal) {
                closeNmapScanModalAction();
            }
        });
    }

    const manualScanModal = document.getElementById("manual-scan-modal");
    if (manualScanModal) {
        manualScanModal.addEventListener("click", (event) => {
            if (event.target === manualScanModal) {
                closeManualScanModalAction();
            }
        });
    }

    const interfaceSettingsModal = document.getElementById("interface-settings-modal");
    if (interfaceSettingsModal) {
        interfaceSettingsModal.addEventListener("click", (event) => {
            if (event.target === interfaceSettingsModal) {
                closeInterfaceSettingsAction();
            }
        });
    }

    const workspaceSwitchGuardModal = document.getElementById("workspace-switch-guard-modal");
    if (workspaceSwitchGuardModal) {
        workspaceSwitchGuardModal.addEventListener("click", (event) => {
            if (event.target === workspaceSwitchGuardModal) {
                closeWorkspaceSwitchGuardAction();
            }
        });
    }

    const hostRemoveModal = document.getElementById("host-remove-modal");
    if (hostRemoveModal) {
        hostRemoveModal.addEventListener("click", (event) => {
            if (event.target === hostRemoveModal) {
                closeHostRemoveModalAction(true);
            }
        });
    }

    const graphNoteModal = document.getElementById("graph-note-modal");
    if (graphNoteModal) {
        graphNoteModal.addEventListener("click", (event) => {
            if (event.target === graphNoteModal) {
                closeGraphNoteModalAction(false);
            }
        });
    }

    const schedulerModal = document.getElementById("scheduler-settings-modal");
    if (schedulerModal) {
        schedulerModal.addEventListener("click", (event) => {
            if (event.target === schedulerModal) {
                closeSchedulerSettingsAction();
            }
        });
    }

    const deviceCategoryModal = document.getElementById("device-category-settings-modal");
    if (deviceCategoryModal) {
        deviceCategoryModal.addEventListener("click", (event) => {
            if (event.target === deviceCategoryModal) {
                closeDeviceCategorySettingsAction();
            }
        });
    }

    const appSettingsModal = document.getElementById("app-settings-modal");
    if (appSettingsModal) {
        appSettingsModal.addEventListener("click", (event) => {
            if (event.target === appSettingsModal) {
                closeAppSettingsAction();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }
        if (ribbonMenuState.openMenuId) {
            closeRibbonMenus();
            return;
        }
        if (processOutputState.modalOpen) {
            closeProcessOutputModal(true);
            return;
        }
        if (scriptOutputState.modalOpen) {
            closeScriptOutputModal(true);
            return;
        }
        if (uiModalState.nmapScanOpen) {
            closeNmapScanModalAction();
            return;
        }
        if (uiModalState.manualScanOpen) {
            closeManualScanModalAction();
            return;
        }
        if (uiModalState.submittedScansOpen) {
            return;
        }
        if (uiModalState.schedulerDecisionsOpen) {
            return;
        }
        if (uiModalState.hostRemoveOpen) {
            closeHostRemoveModalAction(true);
            return;
        }
        if (uiModalState.graphNoteOpen) {
            closeGraphNoteModalAction(false);
            return;
        }
        if (uiModalState.settingsOpen) {
            closeAppSettingsAction();
            return;
        }
        if (uiModalState.deviceCategorySettingsOpen) {
            closeDeviceCategorySettingsAction();
            return;
        }
        if (uiModalState.schedulerOpen) {
            closeSchedulerSettingsAction();
            return;
        }
        if (graphWorkspaceState.detailMode === "floating" && graphHasActiveSelection()) {
            graphDismissSelection();
            return;
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (graphWorkspaceState.detailMode !== "floating" || !graphHasActiveSelection()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        if (target.closest("#graph-detail-panel")) {
            return;
        }
        if (target.closest("[data-graph-node-id], [data-graph-edge-id]")) {
            return;
        }
        const graphSection = getGraphWorkspaceSection();
        if (graphSection && graphSection.contains(target)) {
            return;
        }
        graphDismissSelection();
    });

    const wizardGotoButtons = document.querySelectorAll("[data-wizard-goto]");
    wizardGotoButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setNmapWizardStep(button.getAttribute("data-wizard-goto"));
        });
    });

    const nmapWizardRoot = document.getElementById("nmap-wizard");
    if (nmapWizardRoot) {
        const inputs = nmapWizardRoot.querySelectorAll("input, select, textarea");
        inputs.forEach((node) => {
            const eventName = node.tagName === "INPUT" && (node.type === "checkbox" || node.type === "radio")
                ? "change"
                : (node.tagName === "SELECT" ? "change" : "input");
            node.addEventListener(eventName, () => {
                nmapWizardState.postSubmitLock = false;
                if (node.name === "nmap-scan-mode") {
                    setNmapWizardStep(3);
                }
                if (node.id === "nmap-engagement-preset-select") {
                    syncNmapEngagementPresetControls();
                }
                refreshNmapModeOptions();
            });
        });
    }

    ["nmap-args"].forEach((id) => {
        const node = document.getElementById(id);
        if (!node) {
            return;
        }
        node.addEventListener("input", () => {
            nmapWizardState.postSubmitLock = false;
            updateNmapCommandPreview();
        });
    });

    resetNmapScanWizardState({scrollIntoView: false, focusPreset: false, focusTargets: false});
}
