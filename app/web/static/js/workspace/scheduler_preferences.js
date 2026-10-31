import {renderDeviceCategorySettingsModal} from "./device_categories.js";
import {getChecked, getValue, setActionStatus, setChecked, setText, setValue} from "./dom.js";
import {defaultEngagementPolicyForPreset, engagementPresetSummaryText, legacyGoalProfileFromEngagementPolicy, normalizeEngagementPolicyPayload} from "./engagement_policy.js";
import {fetchJson, postJson} from "./http.js";
import {syncNmapPresetDerivedOptions, updateNmapCommandPreview} from "./scan.js";
import {workspaceState} from "./state.js";
import {applyGraphWorkspaceEnabled} from "./tool_settings.js";

export function normalizeSchedulerFeatureFlags(flags = {}) {return {graph_workspace: Boolean(flags.graph_workspace), context_summary_enabled: flags.context_summary_enabled !== false};}

export function applySchedulerPreferences(prefs) {
    if (!prefs) return;
    const policy = normalizeEngagementPolicyPayload(prefs.engagement_policy, prefs.goal_profile);
    workspaceState.deviceCategoryRules = prefs.device_categories || [];
    workspaceState.builtInDeviceCategories = prefs.built_in_device_categories || [];
    setText("scheduler-mode", "deterministic");
    setText("scheduler-goal", policy.preset_label || policy.preset);
    setText("scheduler-families", prefs.preapproved_families_count || 0);
    setValue("scheduler-goal-select", policy.preset);
    setValue("engagement-scope-select", policy.scope);
    setValue("engagement-intent-select", policy.intent);
    for (const [id, key] of Object.entries({"engagement-credential-mode": "credential_attack_mode", "engagement-lockout-mode": "lockout_risk_mode", "engagement-stability-mode": "stability_risk_mode", "engagement-detection-mode": "detection_risk_mode", "engagement-approval-mode": "approval_mode", "engagement-noise-budget": "noise_budget"})) setValue(id, policy[key]);
    setChecked("engagement-allow-exploitation", policy.allow_exploitation);
    setChecked("engagement-allow-lateral", policy.allow_lateral_movement);
    for (const key of ["max_concurrency", "max_host_concurrency", "max_jobs"]) setValue({max_concurrency: "scheduler-concurrency-input", max_host_concurrency: "scheduler-host-concurrency-input", max_jobs: "scheduler-max-jobs-input"}[key], prefs[key]);
    document.querySelectorAll(".danger-group input[value]").forEach(node => {node.checked = (prefs.dangerous_categories || []).includes(node.value);});
    applyGraphWorkspaceEnabled(Boolean(prefs.feature_flags?.graph_workspace));
    syncEngagementPresetControls();
    renderDeviceCategorySettingsModal();
}

export function syncEngagementPresetControls() {
    const preset = String(getValue("scheduler-goal-select") || "internal_recon").trim().toLowerCase();
    const isCustom = preset === "custom";
    const derivedPolicy = isCustom
        ? {
            scope: getValue("engagement-scope-select") || "internal",
            intent: getValue("engagement-intent-select") || "recon",
        }
        : defaultEngagementPolicyForPreset(preset);

    if (!isCustom) {
        setValue("engagement-scope-select", derivedPolicy.scope || "internal");
        setValue("engagement-intent-select", derivedPolicy.intent || "recon");
    }

    setText("engagement-derived-scope", derivedPolicy.scope || "internal");
    setText("engagement-derived-intent", derivedPolicy.intent || "recon");

    const summaryNode = document.getElementById("engagement-preset-summary");
    if (summaryNode) {
        summaryNode.textContent = engagementPresetSummaryText(preset, isCustom);
    }

    const customScopeLabel = document.getElementById("engagement-custom-scope-label");
    const customIntentLabel = document.getElementById("engagement-custom-intent-label");
    const customNote = document.getElementById("engagement-custom-note");
    const scopeSelect = document.getElementById("engagement-scope-select");
    const intentSelect = document.getElementById("engagement-intent-select");

    [customScopeLabel, customIntentLabel, customNote].forEach((node) => {
        if (node) {
            node.hidden = !isCustom;
        }
    });

    if (scopeSelect) {
        scopeSelect.disabled = !isCustom;
    }
    if (intentSelect) {
        intentSelect.disabled = !isCustom;
    }
    syncNmapPresetDerivedOptions();
    if (document.getElementById("nmap-command-preview")) {
        updateNmapCommandPreview();
    }
}





export function collectSchedulerPreferencesFromForm() {
    const policy = normalizeEngagementPolicyPayload({preset: getValue("scheduler-goal-select"), scope: getValue("engagement-scope-select"), intent: getValue("engagement-intent-select"), allow_exploitation: getChecked("engagement-allow-exploitation"), allow_lateral_movement: getChecked("engagement-allow-lateral"), credential_attack_mode: getValue("engagement-credential-mode"), lockout_risk_mode: getValue("engagement-lockout-mode"), stability_risk_mode: getValue("engagement-stability-mode"), detection_risk_mode: getValue("engagement-detection-mode"), approval_mode: getValue("engagement-approval-mode"), noise_budget: getValue("engagement-noise-budget")});
    return {engagement_policy: policy, max_concurrency: Number(getValue("scheduler-concurrency-input") || 1), max_host_concurrency: Number(getValue("scheduler-host-concurrency-input") || 1), max_jobs: Number(getValue("scheduler-max-jobs-input") || 200), dangerous_categories: [...document.querySelectorAll('.danger-group input[value]:checked')].map(node => node.value)};
}
export async function loadSchedulerPreferences() {try {applySchedulerPreferences(await fetchJson("/api/scheduler/preferences"));} catch(error) {setActionStatus(`Settings: ${error.message}`, true);}}
export async function saveSchedulerPreferences(event) {event?.preventDefault(); try {applySchedulerPreferences(await postJson("/api/scheduler/preferences", collectSchedulerPreferencesFromForm())); setText("scheduler-save-status", "Saved");} catch(error) {setText("scheduler-save-status", error.message);}}
