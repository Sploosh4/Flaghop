/** Composition root: wire feature callbacks before starting the workspace.
 * Models, views and transports never import this coordinator.
 */
import { connectApprovals } from "./approvals.js";
import { renderCredentialCapturePanel, setCredentialCaptureConfigModalOpen, setCredentialsModalOpen } from "./credential_capture.js";
import { connectDeviceCategories } from "./device_categories.js";
import { closeRibbonMenus, connectDialogs } from "./dialogs.js";
import { connectGraphCommon } from "./graph_common.js";
import { graphLoadSnapshot } from "./graph_data.js";
import { connectGraphDetail, graphSyncDetailPresentation } from "./graph_detail.js";
import { graphRenderWorkspace } from "./graph_render.js";
import { connectHostActions } from "./host_actions.js";
import { connectHostFilters } from "./host_filters.js";
import { connectLiveUpdates, pollSnapshot } from "./live_updates.js";
import { connectProcessOutput } from "./process_output.js";
import { applyNmapModeTargetDefaults, connectScan, refreshNmapModeOptions, refreshNmapScanButtonState, setNmapWizardStep, updateNmapCommandPreview } from "./scan.js";
import { connectScanPolicy } from "./scan_policy.js";
import { applySchedulerPreferences } from "./scheduler_preferences.js";
import { connectToolSettings } from "./tool_settings.js";
import { connectTools, openManualToolPicker } from "./tools.js";
import { connectWorkspaceData, loadHostDetail, loadWorkspaceHosts, loadWorkspaceServices } from "./workspace_data.js";
import { renderHosts, renderServices, renderTools } from "./workspace_view.js";

export class WorkspaceController {
    connect() {
        if (this.connected) return;
        connectApprovals({ pollSnapshot });
        connectDeviceCategories({ applySchedulerPreferences });
        connectDialogs({ openManualToolPicker, pollSnapshot });
        connectGraphCommon({ graphRenderWorkspace, graphSyncDetailPresentation });
        connectGraphDetail({ graphRenderWorkspace });
        connectHostActions({ pollSnapshot });
        connectHostFilters({ closeRibbonMenus, graphLoadSnapshot, loadHostDetail, loadWorkspaceHosts, loadWorkspaceServices, renderHosts, renderServices });
        connectLiveUpdates({ renderCredentialCapturePanel });
        connectProcessOutput({ pollSnapshot, setCredentialCaptureConfigModalOpen, setCredentialsModalOpen });
        connectScan({ applySchedulerPreferences });
        connectScanPolicy({ applyNmapModeTargetDefaults, refreshNmapModeOptions, refreshNmapScanButtonState, setNmapWizardStep, updateNmapCommandPreview });
        connectToolSettings({ applySchedulerPreferences });
        connectTools({ pollSnapshot });
        connectWorkspaceData({ graphLoadSnapshot, renderHosts, renderServices, renderTools });
        this.connected = true;
    }
}
