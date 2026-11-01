import { loadApprovals } from "./approvals.js";
import { closeRibbonMenus } from "./dialogs.js";
import { getChecked, getValue, setActionStatus, setChecked, setText, setValue, updateBodyModalState } from "./dom.js";
import { fetchJson, postJson } from "./http.js";
import { pollSnapshot } from "./live_updates.js";
import { renderProject } from "./project_view.js";
import { uiModalState, workspaceSwitchGuardState } from "./state.js";
import { refreshWorkspace, waitForJobCompletion } from "./workspace_data.js";
import { resetWorkspaceDisplayForProjectSwitch } from "./workspace_view.js";
/** Workspace projects. */

export async function openWorkspaceFromRibbonAction() {
    closeRibbonMenus();
    let path = getValue("project-open-path").trim();
    if (!path) {
        const prompted = window.prompt("Enter existing project path (.legion):", "");
        path = String(prompted || "").trim();
        if (!path) {
            return;
        }
        setValue("project-open-path", path);
    }
    await openProject();
}


export async function saveWorkspaceFromRibbonAction(forcePrompt = false) {
    closeRibbonMenus();
    let path = getValue("project-save-path").trim();
    if (forcePrompt || !path) {
        const suggested = String(getValue("project-name") || "").trim();
        const prompted = window.prompt("Enter destination path (.legion):", suggested);
        path = String(prompted || "").trim();
        if (!path) {
            return;
        }
        setValue("project-save-path", path);
    }
    await saveProjectAs();
}


export async function saveWorkspaceAction() {
    closeRibbonMenus();
    const path = getValue("project-save-path").trim();
    if (!path) {
        setActionStatus("Save failed: no destination path is set. Use Save As.", true);
        return;
    }
    await saveProjectAs();
}


export async function saveWorkspaceAsAction() {
    await saveWorkspaceFromRibbonAction(true);
}


export function downloadWorkspaceBundleAction() {
    closeRibbonMenus();
    window.location.assign(`/api/project/download-zip?t=${Date.now()}`);
}


export async function restoreWorkspaceBundleAction() {
    closeRibbonMenus();
    await withWorkspaceSwitchGuard("restoring a workspace bundle", async () => {
        const input = document.getElementById("project-restore-zip-file");
        if (!input) {
            setActionStatus("Restore failed: ZIP input control missing.", true);
            return;
        }
        input.value = "";
        input.click();
    });
}


export async function restoreWorkspaceBundleSelectedAction(event) {
    const input = event?.target;
    const file = input?.files && input.files.length ? input.files[0] : null;
    if (!file) {
        return;
    }

    setActionStatus(`Uploading restore bundle (${file.name})...`);
    try {
        const formData = new FormData();
        formData.append("bundle", file, file.name || "workspace.zip");
        const response = await fetch("/api/project/restore-zip", {
            method: "POST",
            body: formData,
        });
        let body = {};
        try {
            body = await response.json();
        } catch (_err) {
        }
        if (!response.ok) {
            const message = body.error || `Request failed (${response.status})`;
            throw new Error(message);
        }

        const jobId = Number(body?.job?.id || 0);
        if (jobId > 0) {
            setActionStatus(`Restore queued (job ${jobId})...`);
            const completed = await waitForJobCompletion(jobId, 20 * 60 * 1000, 1500);
            const restoredPath = String(completed?.result?.project?.name || "").trim();
            if (restoredPath) {
                setValue("project-save-path", restoredPath);
                setValue("project-open-path", restoredPath);
            }
        }

        setActionStatus("Workspace restored");
        resetWorkspaceDisplayForProjectSwitch({clearProjectPaths: false});
        await refreshWorkspace();
        await Promise.all([pollSnapshot(), loadApprovals()]);
    } catch (err) {
        setActionStatus(`Restore failed: ${err.message}`, true);
    } finally {
        if (input) {
            input.value = "";
        }
    }
}


export async function importNmapXmlFromRibbonAction() {
    closeRibbonMenus();
    let path = getValue("nmap-xml-path").trim();
    if (!path) {
        const prompted = window.prompt("Enter Nmap XML path:", "");
        path = String(prompted || "").trim();
        if (!path) {
            return;
        }
        setValue("nmap-xml-path", path);
    }
    const runActions = window.confirm("Run scripted actions after XML import?");
    setChecked("nmap-xml-run-actions", runActions);
    await importNmapXml();
}


export function setWorkspaceSwitchGuardModalOpen(open) {
    const overlay = document.getElementById("workspace-switch-guard-modal");
    if (!overlay) {
        return;
    }
    workspaceSwitchGuardState.modalOpen = Boolean(open);
    uiModalState.workspaceSwitchGuardOpen = Boolean(open);
    overlay.classList.toggle("is-open", Boolean(open));
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    updateBodyModalState();
}


export function setWorkspaceSwitchGuardStatus(text, isError = false) {
    const node = document.getElementById("workspace-switch-guard-status");
    if (!node) {
        return;
    }
    node.textContent = text || "";
    node.style.color = isError ? "#ff9b9b" : "";
}


export function closeWorkspaceSwitchGuardAction() {
    workspaceSwitchGuardState.busy = false;
    workspaceSwitchGuardState.pendingAction = null;
    workspaceSwitchGuardState.pendingLabel = "";
    workspaceSwitchGuardState.latestSummary = null;
    setWorkspaceSwitchGuardStatus("Stop running jobs and processes before switching workspaces.");
    setText("workspace-switch-guard-summary", "No active work detected.");
    setText("workspace-switch-guard-details", "");
    setWorkspaceSwitchGuardModalOpen(false);
}


export async function fetchActiveWorkspaceWork() {
    const [jobsBody, processesBody] = await Promise.all([
        fetchJson("/api/jobs?limit=500"),
        fetchJson("/api/processes?limit=500"),
    ]);
    const jobs = Array.isArray(jobsBody?.jobs) ? jobsBody.jobs : [];
    const processes = Array.isArray(processesBody?.processes) ? processesBody.processes : [];
    return {
        jobs: jobs.filter((item) => {
            const status = String(item?.status || "").trim().toLowerCase();
            return status === "queued" || status === "running";
        }),
        processes: processes.filter((item) => {
            const status = String(item?.status || "").trim().toLowerCase();
            return status === "running" || status === "waiting";
        }),
    };
}


export function describeActiveWorkspaceWork(summary) {
    const jobs = Array.isArray(summary?.jobs) ? summary.jobs : [];
    const processes = Array.isArray(summary?.processes) ? summary.processes : [];
    const lines = [];
    jobs.slice(0, 6).forEach((job) => {
        lines.push(`Job ${job.id} | ${job.type || "job"} | ${job.status || ""}`);
    });
    processes.slice(0, 8).forEach((proc) => {
        lines.push(`Process ${proc.id} | ${proc.name || "process"} | ${proc.hostIp || ""}${proc.port ? `:${proc.port}/${proc.protocol || "tcp"}` : ""} | ${proc.status || ""}`);
    });
    if (jobs.length > 6 || processes.length > 8) {
        lines.push("...");
    }
    return lines.join("\n");
}


export function showWorkspaceSwitchGuard(summary, actionLabel, actionFn) {
    workspaceSwitchGuardState.pendingAction = actionFn;
    workspaceSwitchGuardState.pendingLabel = String(actionLabel || "switch workspaces");
    workspaceSwitchGuardState.latestSummary = summary;
    const jobCount = Array.isArray(summary?.jobs) ? summary.jobs.length : 0;
    const processCount = Array.isArray(summary?.processes) ? summary.processes.length : 0;
    setWorkspaceSwitchGuardStatus("Active work must be stopped before switching workspaces.");
    setText(
        "workspace-switch-guard-summary",
        `${jobCount} active job${jobCount === 1 ? "" : "s"} and ${processCount} active process${processCount === 1 ? "" : "es"} detected before ${workspaceSwitchGuardState.pendingLabel}.`,
    );
    setText("workspace-switch-guard-details", describeActiveWorkspaceWork(summary));
    setWorkspaceSwitchGuardModalOpen(true);
}


export async function waitForActiveWorkspaceWorkToStop(timeoutMs = 20000) {
    const deadline = Date.now() + Math.max(1000, Number(timeoutMs) || 20000);
    while (Date.now() < deadline) {
        const summary = await fetchActiveWorkspaceWork();
        if (!summary.jobs.length && !summary.processes.length) {
            return summary;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 600));
    }
    throw new Error("Timed out waiting for running jobs and processes to stop.");
}


export async function stopActiveWorkspaceWorkAndContinueAction() {
    if (workspaceSwitchGuardState.busy) {
        return;
    }
    workspaceSwitchGuardState.busy = true;
    setWorkspaceSwitchGuardStatus("Stopping active jobs and processes...");
    try {
        const summary = await fetchActiveWorkspaceWork();
        for (const job of summary.jobs) {
            const jobId = Number(job?.id || 0);
            if (jobId > 0) {
                await postJson(`/api/jobs/${jobId}/stop`, {});
            }
        }
        for (const process of summary.processes) {
            const processId = Number(process?.id || 0);
            if (processId > 0) {
                try {
                    await postJson(`/api/processes/${processId}/kill`, {});
                } catch (_err) {
                }
            }
        }
        await waitForActiveWorkspaceWorkToStop();
        await pollSnapshot();
        const pendingAction = workspaceSwitchGuardState.pendingAction;
        closeWorkspaceSwitchGuardAction();
        if (typeof pendingAction === "function") {
            await pendingAction();
        }
    } catch (err) {
        workspaceSwitchGuardState.busy = false;
        setWorkspaceSwitchGuardStatus(`Stop failed: ${err.message}`, true);
    }
}


export async function withWorkspaceSwitchGuard(actionLabel, actionFn) {
    const summary = await fetchActiveWorkspaceWork();
    if (summary.jobs.length || summary.processes.length) {
        showWorkspaceSwitchGuard(summary, actionLabel, actionFn);
        return;
    }
    await actionFn();
}


export async function createNewTemporaryProjectCore() {
    setActionStatus("Creating temporary project...");
    const body = await postJson("/api/project/new-temp", {});
    setActionStatus("Created temporary project");
    resetWorkspaceDisplayForProjectSwitch({clearProjectPaths: true});
    renderProject(body?.project || {});
    await refreshWorkspace();
    await Promise.all([pollSnapshot(), loadApprovals()]);
}


export async function createNewTemporaryProject() {
    try {
        await withWorkspaceSwitchGuard("creating a new workspace", createNewTemporaryProjectCore);
    } catch (err) {
        if (String(err?.message || "").toLowerCase().includes("jobs/scans are active")) {
            await withWorkspaceSwitchGuard("creating a new workspace", createNewTemporaryProjectCore);
            return;
        }
        setActionStatus(`Create failed: ${err.message}`, true);
    }
}


export async function openProjectCore() {
    const path = getValue("project-open-path").trim();
    if (!path) {
        setActionStatus("Open failed: project path is required", true);
        return;
    }
    setActionStatus("Opening project...");
    const body = await postJson("/api/project/open", {path});
    setActionStatus("Project opened");
    resetWorkspaceDisplayForProjectSwitch({clearProjectPaths: false});
    setValue("project-save-path", "");
    renderProject(body?.project || {});
    await refreshWorkspace();
    await Promise.all([pollSnapshot(), loadApprovals()]);
}


export async function openProject() {
    try {
        await withWorkspaceSwitchGuard("opening a workspace", openProjectCore);
    } catch (err) {
        if (String(err?.message || "").toLowerCase().includes("jobs/scans are active")) {
            await withWorkspaceSwitchGuard("opening a workspace", openProjectCore);
            return;
        }
        setActionStatus(`Open failed: ${err.message}`, true);
    }
}


export async function saveProjectAs() {
    const path = getValue("project-save-path").trim();
    if (!path) {
        setActionStatus("Save failed: destination path is required", true);
        return;
    }
    setActionStatus("Saving project...");
    try {
        const body = await postJson("/api/project/save-as", {
            path,
            replace: getChecked("project-save-replace"),
        });
        const jobId = Number(body?.job?.id || 0);
        if (jobId > 0) {
            setActionStatus(`Save queued (job ${jobId})...`);
            await waitForJobCompletion(jobId, 10 * 60 * 1000, 1500);
        }
        setActionStatus("Project saved");
        await pollSnapshot();
    } catch (err) {
        setActionStatus(`Save failed: ${err.message}`, true);
    }
}


export async function importTargetsFile() {
    const path = getValue("targets-file-path").trim();
    if (!path) {
        setActionStatus("Import failed: targets file path is required", true);
        return;
    }
    setActionStatus("Queueing targets import job...");
    try {
        const body = await postJson("/api/targets/import-file", {path});
        const jobId = body?.job?.id;
        setActionStatus(jobId ? `Targets import queued (job ${jobId})` : "Targets import queued");
        await pollSnapshot();
    } catch (err) {
        setActionStatus(`Import failed: ${err.message}`, true);
    }
}


export async function importNmapXml() {
    const path = getValue("nmap-xml-path").trim();
    if (!path) {
        setActionStatus("Import failed: XML path is required", true);
        return;
    }
    setActionStatus("Queueing Nmap XML import job...");
    try {
        const body = await postJson("/api/nmap/import-xml", {
            path,
            run_actions: getChecked("nmap-xml-run-actions"),
        });
        const jobId = body?.job?.id;
        setActionStatus(jobId ? `Nmap XML import queued (job ${jobId})` : "Nmap XML import queued");
        await pollSnapshot();
    } catch (err) {
        setActionStatus(`Import failed: ${err.message}`, true);
    }
}
