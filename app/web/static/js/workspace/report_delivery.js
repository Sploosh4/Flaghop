import { closeRibbonMenus } from "./dialogs.js";
import { setActionStatus, setText } from "./dom.js";
import { postJson } from "./http.js";
import { collectProjectReportDeliveryFromForm } from "./scheduler_preferences.js";
/** Workspace report delivery. */

export async function pushProjectAiReportAction(event) {
    if (event) {
        event.preventDefault();
    }
    closeRibbonMenus();

    let delivery;
    try {
        delivery = collectProjectReportDeliveryFromForm();
    } catch (err) {
        const message = `Project report settings error: ${err.message}`;
        setActionStatus(message, true);
        setText("report-provider-save-status", message);
        return;
    }

    setActionStatus("Pushing project report...");
    setText("report-provider-save-status", "Pushing project report...");
    try {
        const result = await postJson("/api/workspace/project-ai-report/push", {
            project_report_delivery: delivery,
        });
        const summary = result?.status_code
            ? `Project report pushed (${result.status_code})`
            : "Project report pushed";
        setActionStatus(summary, false);
        setText("report-provider-save-status", summary);
    } catch (err) {
        const message = `Project report push failed: ${err.message}`;
        setActionStatus(message, true);
        setText("report-provider-save-status", message);
    }
}
