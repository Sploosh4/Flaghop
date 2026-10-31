import { WorkspaceController } from "./workspace/controller.js";
import { loadApprovals } from "./workspace/approvals.js";
import { bindActionButtons } from "./workspace/events.js";
import { bindGraphWorkspaceEvents } from "./workspace/graph_events.js";
import { connectSnapshotWebSocket, pollSnapshot, renderSnapshot, setLiveChip } from "./workspace/live_updates.js";
import { loadSchedulerPreferences, saveSchedulerPreferences, syncEngagementPresetControls } from "./workspace/scheduler_preferences.js";
import { refreshWorkspace } from "./workspace/workspace_data.js";
/** Application entry point. Domain modules own state, rendering and commands. */

const controller = new WorkspaceController();

window.addEventListener("DOMContentLoaded", () => {
    if (document.body.classList.contains("project-foundation")) return;
    controller.connect();
    const bootstrapNode = document.getElementById("initial-snapshot");
    if (bootstrapNode && bootstrapNode.textContent) {
        try {
            const snapshot = JSON.parse(bootstrapNode.textContent);
            renderSnapshot(snapshot);
        } catch (_err) {
            setLiveChip("Init Error", true);
        }
    }

    if (window.LEGION_WS_ENABLED) {
        connectSnapshotWebSocket();
    } else {
        setLiveChip("Polling/API", false);
        pollSnapshot();
        window.setInterval(pollSnapshot, 2000);
    }

    loadSchedulerPreferences();
    loadApprovals();

    const schedulerForm = document.getElementById("scheduler-form");
    if (schedulerForm) {
        schedulerForm.addEventListener("submit", saveSchedulerPreferences);
    }
    const schedulerProviderSelect = document.getElementById("scheduler-provider-select");
    if (schedulerProviderSelect) {
        schedulerProviderSelect.addEventListener("change", () => {
        });
    }
    const schedulerGoalSelect = document.getElementById("scheduler-goal-select");
    if (schedulerGoalSelect) {
        schedulerGoalSelect.addEventListener("change", syncEngagementPresetControls);
    }
    const engagementScopeSelect = document.getElementById("engagement-scope-select");
    if (engagementScopeSelect) {
        engagementScopeSelect.addEventListener("change", syncEngagementPresetControls);
    }
    const engagementIntentSelect = document.getElementById("engagement-intent-select");
    if (engagementIntentSelect) {
        engagementIntentSelect.addEventListener("change", syncEngagementPresetControls);
    }
    syncEngagementPresetControls();

    bindActionButtons();
    bindGraphWorkspaceEvents();
    refreshWorkspace();
});
