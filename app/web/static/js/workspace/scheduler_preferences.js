/** Workspace scheduler preferences. */
import { renderDeviceCategorySettingsModal } from "./device_categories.js";
import { getChecked, getValue, setActionStatus, setChecked, setText, setValue } from "./dom.js";
import { graphWorkspaceEnabled } from "./graph_common.js";
import { postJson } from "./http.js";
import { syncNmapPresetDerivedOptions, updateNmapCommandPreview } from "./scan.js";
import { engagementPresetSummaryText } from "./scan_policy.js";
import { credentialCaptureState, workspaceState } from "./state.js";
import { applyCredentialCapturePanelEnabled, applyGraphWorkspaceEnabled } from "./tool_settings.js";

export function applySchedulerPreferences(prefs) {
    if (!prefs) {
        return;
    }
    const featureFlags = normalizeSchedulerFeatureFlags(prefs.feature_flags);
    const policy = normalizeEngagementPolicyPayload(
        prefs.engagement_policy,
        prefs.goal_profile || "internal_asset_discovery",
    );
    setText("scheduler-mode", prefs.mode || "");
    setText("scheduler-goal", policy.preset_label || policy.preset || prefs.goal_profile || "");
    setText("scheduler-families", prefs.preapproved_families_count || 0);

    setValue("scheduler-mode-select", prefs.mode || "deterministic");
    setValue("scheduler-goal-select", policy.preset || "internal_recon");
    setValue("engagement-scope-select", policy.scope || "internal");
    setValue("engagement-intent-select", policy.intent || "recon");
    syncEngagementPresetControls();
    setChecked("engagement-allow-exploitation", Boolean(policy.allow_exploitation));
    setChecked("engagement-allow-lateral", Boolean(policy.allow_lateral_movement));
    setValue("engagement-credential-mode", policy.credential_attack_mode || "blocked");
    setValue("engagement-lockout-mode", policy.lockout_risk_mode || "blocked");
    setValue("engagement-stability-mode", policy.stability_risk_mode || "approval");
    setValue("engagement-detection-mode", policy.detection_risk_mode || "low");
    setValue("engagement-approval-mode", policy.approval_mode || "risky");
    applySchedulerRolloutFlags(featureFlags, policy.runner_preference || "local");
    setValue("engagement-noise-budget", policy.noise_budget || "low");
    setValue("scheduler-provider-select", prefs.provider || "none");
    setValue("scheduler-concurrency-input", String(prefs.max_concurrency || 1));
    setValue("scheduler-host-concurrency-input", String(prefs.max_host_concurrency || 1));
    setValue("scheduler-max-jobs-input", String(prefs.max_jobs || 200));

    const providers = prefs.providers || {};
    const integrations = prefs.integrations || {};
    const lmStudio = providers.lm_studio || {};
    const openai = providers.openai || {};
    const claude = providers.claude || {};
    const grayhatwarfare = integrations.grayhatwarfare || {};
    const chaos = integrations.chaos || {};
    const shodan = integrations.shodan || {};
    workspaceState.deviceCategoryRules = Array.isArray(prefs.device_categories) ? prefs.device_categories : [];
    workspaceState.builtInDeviceCategories = Array.isArray(prefs.built_in_device_categories) ? prefs.built_in_device_categories : [];
    const aiFeedback = prefs.ai_feedback || {};
    const projectDelivery = prefs.project_report_delivery || {};
    const projectDeliveryMtls = projectDelivery.mtls || {};

    setValue("provider-lmstudio-baseurl", lmStudio.base_url || "");
    setValue("provider-lmstudio-model", lmStudio.model || "");
    setValue("provider-lmstudio-apikey", "");
    const lmStudioApiKeyInput = document.getElementById("provider-lmstudio-apikey");
    if (lmStudioApiKeyInput) {
        lmStudioApiKeyInput.placeholder = lmStudio.api_key_configured
            ? "Configured. Enter a new LM Studio API key to replace it"
            : "Enter a new LM Studio API key";
    }

    setValue("provider-openai-baseurl", openai.base_url || "");
    setValue("provider-openai-model", openai.model || "");
    setValue("provider-openai-apikey", "");
    const openaiApiKeyInput = document.getElementById("provider-openai-apikey");
    if (openaiApiKeyInput) {
        openaiApiKeyInput.placeholder = openai.api_key_configured
            ? "Configured. Enter a new OpenAI API key to replace it"
            : "Enter a new OpenAI API key";
    }
    setChecked("provider-openai-structured-outputs", Boolean(openai.structured_outputs));

    setValue("provider-claude-baseurl", claude.base_url || "");
    setValue("provider-claude-model", claude.model || "");
    setValue("provider-claude-apikey", "");
    const claudeApiKeyInput = document.getElementById("provider-claude-apikey");
    if (claudeApiKeyInput) {
        claudeApiKeyInput.placeholder = claude.api_key_configured
            ? "Configured. Enter a new Claude API key to replace it"
            : "Enter a new Claude API key";
    }
    setValue("scheduler-integration-grayhatwarfare-apikey", "");
    const grayhatwarfareApiKeyInput = document.getElementById("scheduler-integration-grayhatwarfare-apikey");
    if (grayhatwarfareApiKeyInput) {
        grayhatwarfareApiKeyInput.placeholder = grayhatwarfare.api_key_configured
            ? "Configured. Enter a new Grayhat Warfare API key to replace it"
            : "Enter a new Grayhat Warfare API key";
    }
    setValue("scheduler-integration-chaos-apikey", "");
    const chaosApiKeyInput = document.getElementById("scheduler-integration-chaos-apikey");
    if (chaosApiKeyInput) {
        chaosApiKeyInput.placeholder = chaos.api_key_configured
            ? "Configured. Enter a new Chaos API key to replace it"
            : "Enter a new Chaos API key";
    }
    setValue("scheduler-integration-shodan-apikey", "");
    const shodanApiKeyInput = document.getElementById("scheduler-integration-shodan-apikey");
    if (shodanApiKeyInput) {
        shodanApiKeyInput.placeholder = shodan.api_key_configured
            ? "Configured. Enter a new Shodan API key to replace it"
            : "Enter a new Shodan API key";
    }
    setChecked("scheduler-ai-feedback-enabled", aiFeedback.enabled !== false);
    setValue("scheduler-ai-max-rounds", String(aiFeedback.max_rounds_per_target || 5));
    setValue("scheduler-ai-max-actions", String(aiFeedback.max_actions_per_round || 6));
    setValue("scheduler-ai-recent-output-chars", String(aiFeedback.recent_output_chars || 900));
    setChecked("scheduler-ai-reflection-enabled", aiFeedback.reflection_enabled !== false);
    setValue("scheduler-ai-stall-rounds", String(aiFeedback.stall_rounds_without_progress || 2));
    setValue("scheduler-ai-repeat-threshold", String(aiFeedback.stall_repeat_selection_threshold || 2));
    setValue("scheduler-ai-max-reflections", String(aiFeedback.max_reflections_per_target || 1));
    applyGraphWorkspaceEnabled(featureFlags.graph_workspace !== false);
    applyCredentialCapturePanelEnabled(featureFlags.credential_capture_panel !== false);
    setChecked("interface-graph-workspace-enabled", featureFlags.graph_workspace !== false);
    setChecked("interface-credential-capture-panel-enabled", featureFlags.credential_capture_panel !== false);
    setChecked("feature-context-summary-enabled", featureFlags.context_summary_enabled !== false);
    setChecked("feature-scheduler-prompt-profiles", featureFlags.scheduler_prompt_profiles !== false);
    setChecked("feature-scheduler-web-followup-sidecar", Boolean(featureFlags.scheduler_web_followup_sidecar));

    setValue("project-report-provider-name", projectDelivery.provider_name || "");
    setValue("project-report-endpoint", projectDelivery.endpoint || "");
    setValue("project-report-method", projectDelivery.method || "POST");
    setValue("project-report-format", projectDelivery.format || "json");
    setValue("project-report-timeout", String(projectDelivery.timeout_seconds || 30));
    setChecked("project-report-mtls-enabled", projectDeliveryMtls.enabled);
    setValue("project-report-mtls-cert", projectDeliveryMtls.client_cert_path || "");
    setValue("project-report-mtls-key", projectDeliveryMtls.client_key_path || "");
    setValue("project-report-mtls-ca", projectDeliveryMtls.ca_cert_path || "");
    setValue(
        "project-report-headers",
        JSON.stringify(projectDelivery.headers || {}, null, 2),
    );

    const activeDanger = new Set(prefs.dangerous_categories || []);
    [
        "exploit_execution",
        "credential_bruteforce",
        "network_flooding",
        "destructive_write_actions",
    ].forEach((category) => {
        setChecked(`danger-${category}`, activeDanger.has(category));
    });

    setSchedulerProviderFieldVisibility(prefs.provider || "none");
    renderDeviceCategorySettingsModal();
}


export function normalizeSchedulerFeatureFlags(flags) {
    const provided = flags && typeof flags === "object" ? flags : {};
    return {
        graph_workspace: provided.graph_workspace !== false,
        credential_capture_panel: provided.credential_capture_panel !== false,
        optional_runners: provided.optional_runners !== false,
        context_summary_enabled: provided.context_summary_enabled !== false,
        scheduler_prompt_profiles: provided.scheduler_prompt_profiles !== false,
        scheduler_web_followup_sidecar: Boolean(provided.scheduler_web_followup_sidecar),
    };
}


export function applySchedulerRolloutFlags(featureFlags, requestedRunnerPreference) {
    const flags = normalizeSchedulerFeatureFlags(featureFlags);
    const select = document.getElementById("engagement-runner-preference");
    const disabledRunnerPreferences = new Set(flags.optional_runners ? [] : ["container", "browser"]);
    if (!select) {
        return;
    }
    Array.from(select.options).forEach((option) => {
        const value = String(option?.value || "").trim().toLowerCase();
        option.disabled = disabledRunnerPreferences.has(value);
        if (option.disabled) {
            option.textContent = `${value} (disabled)`;
        } else {
            option.textContent = value;
        }
    });
    const preferred = String(requestedRunnerPreference || "local").trim().toLowerCase();
    if (disabledRunnerPreferences.has(preferred)) {
        setValue("engagement-runner-preference", "local");
        return;
    }
    setValue("engagement-runner-preference", preferred || "local");
}


export function defaultEngagementPolicyForPreset(preset) {
    const normalizedPreset = String(preset || "").trim().toLowerCase();
    const defaults = {
        external_recon: {
            preset: "external_recon",
            preset_label: "External Recon",
            scope: "external",
            intent: "recon",
            allow_exploitation: false,
            allow_lateral_movement: false,
            credential_attack_mode: "blocked",
            lockout_risk_mode: "blocked",
            stability_risk_mode: "approval",
            detection_risk_mode: "low",
            approval_mode: "risky",
            runner_preference: "local",
            noise_budget: "low",
            custom_overrides: {},
            legacy_goal_profile: "external_pentest",
        },
        external_pentest: {
            preset: "external_pentest",
            preset_label: "External Pentest",
            scope: "external",
            intent: "pentest",
            allow_exploitation: true,
            allow_lateral_movement: false,
            credential_attack_mode: "approval",
            lockout_risk_mode: "approval",
            stability_risk_mode: "approval",
            detection_risk_mode: "medium",
            approval_mode: "risky",
            runner_preference: "local",
            noise_budget: "medium",
            custom_overrides: {},
            legacy_goal_profile: "external_pentest",
        },
        internal_quick_recon: {
            preset: "internal_quick_recon",
            preset_label: "Internal Quick Recon",
            scope: "internal",
            intent: "recon",
            allow_exploitation: false,
            allow_lateral_movement: false,
            credential_attack_mode: "blocked",
            lockout_risk_mode: "blocked",
            stability_risk_mode: "approval",
            detection_risk_mode: "low",
            approval_mode: "risky",
            runner_preference: "local",
            noise_budget: "low",
            custom_overrides: {},
            legacy_goal_profile: "internal_asset_discovery",
        },
        internal_recon: {
            preset: "internal_recon",
            preset_label: "Internal Recon",
            scope: "internal",
            intent: "recon",
            allow_exploitation: false,
            allow_lateral_movement: false,
            credential_attack_mode: "blocked",
            lockout_risk_mode: "blocked",
            stability_risk_mode: "approval",
            detection_risk_mode: "low",
            approval_mode: "risky",
            runner_preference: "local",
            noise_budget: "low",
            custom_overrides: {},
            legacy_goal_profile: "internal_asset_discovery",
        },
        internal_pentest: {
            preset: "internal_pentest",
            preset_label: "Internal Pentest",
            scope: "internal",
            intent: "pentest",
            allow_exploitation: true,
            allow_lateral_movement: true,
            credential_attack_mode: "approval",
            lockout_risk_mode: "approval",
            stability_risk_mode: "approval",
            detection_risk_mode: "medium",
            approval_mode: "risky",
            runner_preference: "local",
            noise_budget: "medium",
            custom_overrides: {},
            legacy_goal_profile: "internal_asset_discovery",
        },
    };
    return defaults[normalizedPreset] || {
        ...defaults.internal_recon,
        preset: normalizedPreset || "custom",
        preset_label: normalizedPreset ? normalizedPreset.replace(/_/g, " ") : "Custom",
    };
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


export function presetFromLegacyGoalProfile(goalProfile) {
    const normalized = String(goalProfile || "").trim().toLowerCase();
    if (normalized === "external_pentest") {
        return "external_pentest";
    }
    if (normalized === "internal_pentest") {
        return "internal_pentest";
    }
    if (normalized === "external_recon") {
        return "external_recon";
    }
    return "internal_recon";
}


export function legacyGoalProfileFromEngagementPolicy(policy) {
    const preset = String(policy?.preset || "").trim().toLowerCase();
    if (preset === "external_recon" || preset === "external_pentest") {
        return "external_pentest";
    }
    return "internal_asset_discovery";
}


export function normalizeEngagementPolicyPayload(policy, fallbackGoalProfile) {
    const fallbackPreset = presetFromLegacyGoalProfile(fallbackGoalProfile);
    const provided = policy && typeof policy === "object" ? policy : {};
    const base = defaultEngagementPolicyForPreset(provided.preset || fallbackPreset);
    return {
        ...base,
        ...provided,
        custom_overrides: provided.custom_overrides && typeof provided.custom_overrides === "object"
            ? provided.custom_overrides
            : {},
        legacy_goal_profile: provided.legacy_goal_profile || legacyGoalProfileFromEngagementPolicy({
            ...base,
            ...provided,
        }),
    };
}


export function setSchedulerProviderFieldVisibility(providerName) {
    const selectedProvider = String(providerName || "none").trim().toLowerCase();
    const providerFields = document.querySelectorAll(".scheduler-provider-field[data-scheduler-provider]");
    providerFields.forEach((fieldNode) => {
        const fieldProvider = String(fieldNode.getAttribute("data-scheduler-provider") || "").trim().toLowerCase();
        fieldNode.classList.toggle("is-active", fieldProvider === selectedProvider);
    });
}


export function collectSchedulerPreferencesFromForm() {
    const mode = getValue("scheduler-mode-select");
    const selectedPreset = String(getValue("scheduler-goal-select") || "internal_recon").trim().toLowerCase();
    const presetDefaults = defaultEngagementPolicyForPreset(selectedPreset);
    const selectedProvider = getValue("scheduler-provider-select");
    const rawConcurrency = parseInt(getValue("scheduler-concurrency-input"), 10);
    const maxConcurrency = Number.isFinite(rawConcurrency)
        ? Math.max(1, Math.min(16, rawConcurrency))
        : 1;
    const rawHostConcurrency = parseInt(getValue("scheduler-host-concurrency-input"), 10);
    const maxHostConcurrency = Number.isFinite(rawHostConcurrency)
        ? Math.max(1, Math.min(8, rawHostConcurrency))
        : 1;
    const rawMaxJobs = parseInt(getValue("scheduler-max-jobs-input"), 10);
    const maxJobs = Number.isFinite(rawMaxJobs)
        ? Math.max(20, Math.min(2000, rawMaxJobs))
        : 200;
    const rawAiMaxRounds = parseInt(getValue("scheduler-ai-max-rounds"), 10);
    const aiMaxRounds = Number.isFinite(rawAiMaxRounds)
        ? Math.max(1, Math.min(12, rawAiMaxRounds))
        : 5;
    const rawAiMaxActions = parseInt(getValue("scheduler-ai-max-actions"), 10);
    const aiMaxActions = Number.isFinite(rawAiMaxActions)
        ? Math.max(1, Math.min(8, rawAiMaxActions))
        : 6;
    const rawAiRecentOutputChars = parseInt(getValue("scheduler-ai-recent-output-chars"), 10);
    const aiRecentOutputChars = Number.isFinite(rawAiRecentOutputChars)
        ? Math.max(320, Math.min(4000, rawAiRecentOutputChars))
        : 900;
    const rawAiStallRounds = parseInt(getValue("scheduler-ai-stall-rounds"), 10);
    const aiStallRounds = Number.isFinite(rawAiStallRounds)
        ? Math.max(1, Math.min(6, rawAiStallRounds))
        : 2;
    const rawAiRepeatThreshold = parseInt(getValue("scheduler-ai-repeat-threshold"), 10);
    const aiRepeatThreshold = Number.isFinite(rawAiRepeatThreshold)
        ? Math.max(1, Math.min(8, rawAiRepeatThreshold))
        : 2;
    const rawAiMaxReflections = parseInt(getValue("scheduler-ai-max-reflections"), 10);
    const aiMaxReflections = Number.isFinite(rawAiMaxReflections)
        ? Math.max(0, Math.min(4, rawAiMaxReflections))
        : 1;
    const dangerousCategories = [
        "exploit_execution",
        "credential_bruteforce",
        "network_flooding",
        "destructive_write_actions",
    ].filter((category) => getChecked(`danger-${category}`));

    const providers = {
        lm_studio: {
            enabled: selectedProvider === "lm_studio",
            base_url: getValue("provider-lmstudio-baseurl"),
            model: getValue("provider-lmstudio-model"),
        },
        openai: {
            enabled: selectedProvider === "openai",
            base_url: getValue("provider-openai-baseurl"),
            model: getValue("provider-openai-model"),
            structured_outputs: getChecked("provider-openai-structured-outputs"),
        },
        claude: {
            enabled: selectedProvider === "claude",
            base_url: getValue("provider-claude-baseurl"),
            model: getValue("provider-claude-model"),
        },
    };

    if (selectedProvider === "lm_studio") {
        providers.lm_studio.base_url = providers.lm_studio.base_url || "http://127.0.0.1:1234/v1";
        providers.lm_studio.model = providers.lm_studio.model || "o3-7b";
    } else if (selectedProvider === "openai") {
        providers.openai.base_url = providers.openai.base_url || "https://api.openai.com/v1";
        providers.openai.model = providers.openai.model || "gpt-4.1-mini";
    }

    const lmApiKey = getValue("provider-lmstudio-apikey").trim();
    const openaiApiKey = getValue("provider-openai-apikey").trim();
    const claudeApiKey = getValue("provider-claude-apikey").trim();
    if (lmApiKey) {
        providers.lm_studio.api_key = lmApiKey;
    }
    if (openaiApiKey) {
        providers.openai.api_key = openaiApiKey;
    }
    if (claudeApiKey) {
        providers.claude.api_key = claudeApiKey;
    }
    const integrations = {
        grayhatwarfare: {},
        chaos: {},
        shodan: {},
    };
    const grayhatwarfareApiKey = getValue("scheduler-integration-grayhatwarfare-apikey").trim();
    if (grayhatwarfareApiKey) {
        integrations.grayhatwarfare.api_key = grayhatwarfareApiKey;
    }
    const chaosApiKey = getValue("scheduler-integration-chaos-apikey").trim();
    if (chaosApiKey) {
        integrations.chaos.api_key = chaosApiKey;
    }
    const shodanApiKey = getValue("scheduler-integration-shodan-apikey").trim();
    if (shodanApiKey) {
        integrations.shodan.api_key = shodanApiKey;
    }

    const graphWorkspaceToggle = document.getElementById("interface-graph-workspace-enabled");
    const graphWorkspaceEnabledValue = graphWorkspaceToggle
        ? Boolean(graphWorkspaceToggle.checked)
        : graphWorkspaceEnabled();
    const credentialCapturePanelToggle = document.getElementById("interface-credential-capture-panel-enabled");
    const credentialCapturePanelEnabledValue = credentialCapturePanelToggle
        ? Boolean(credentialCapturePanelToggle.checked)
        : Boolean(credentialCaptureState.panelEnabled);
    const engagementPolicy = normalizeEngagementPolicyPayload(
        {
            preset: selectedPreset,
            scope: selectedPreset === "custom"
                ? getValue("engagement-scope-select")
                : presetDefaults.scope,
            intent: selectedPreset === "custom"
                ? getValue("engagement-intent-select")
                : presetDefaults.intent,
            allow_exploitation: getChecked("engagement-allow-exploitation"),
            allow_lateral_movement: getChecked("engagement-allow-lateral"),
            credential_attack_mode: getValue("engagement-credential-mode"),
            lockout_risk_mode: getValue("engagement-lockout-mode"),
            stability_risk_mode: getValue("engagement-stability-mode"),
            detection_risk_mode: getValue("engagement-detection-mode"),
            approval_mode: getValue("engagement-approval-mode"),
            runner_preference: getValue("engagement-runner-preference"),
            noise_budget: getValue("engagement-noise-budget"),
            custom_overrides: {},
        },
        selectedPreset,
    );

    return {
        mode,
        goal_profile: legacyGoalProfileFromEngagementPolicy(engagementPolicy),
        engagement_policy: engagementPolicy,
        provider: selectedProvider,
        max_concurrency: maxConcurrency,
        max_host_concurrency: maxHostConcurrency,
        max_jobs: maxJobs,
        ai_feedback: {
            enabled: getChecked("scheduler-ai-feedback-enabled"),
            max_rounds_per_target: aiMaxRounds,
            max_actions_per_round: aiMaxActions,
            recent_output_chars: aiRecentOutputChars,
            reflection_enabled: getChecked("scheduler-ai-reflection-enabled"),
            stall_rounds_without_progress: aiStallRounds,
            stall_repeat_selection_threshold: aiRepeatThreshold,
            max_reflections_per_target: aiMaxReflections,
        },
        dangerous_categories: dangerousCategories,
        feature_flags: {
            graph_workspace: graphWorkspaceEnabledValue,
            credential_capture_panel: credentialCapturePanelEnabledValue,
            context_summary_enabled: getChecked("feature-context-summary-enabled"),
            scheduler_prompt_profiles: getChecked("feature-scheduler-prompt-profiles"),
            scheduler_web_followup_sidecar: getChecked("feature-scheduler-web-followup-sidecar"),
        },
        providers,
        integrations,
    };
}


export function collectProjectReportDeliveryFromForm() {
    const projectReportMethod = String(getValue("project-report-method") || "POST").toUpperCase();
    const projectReportFormatRaw = String(getValue("project-report-format") || "json").toLowerCase();
    const projectReportFormat = projectReportFormatRaw === "md" ? "md" : "json";
    const rawProjectReportTimeout = parseInt(getValue("project-report-timeout"), 10);
    const projectReportTimeout = Number.isFinite(rawProjectReportTimeout)
        ? Math.max(5, Math.min(300, rawProjectReportTimeout))
        : 30;
    let projectReportHeaders = {};
    const projectReportHeadersText = String(getValue("project-report-headers") || "").trim();
    if (projectReportHeadersText) {
        let parsedHeaders;
        try {
            parsedHeaders = JSON.parse(projectReportHeadersText);
        } catch (_err) {
            throw new Error("Project report headers must be valid JSON.");
        }
        if (typeof parsedHeaders !== "object" || parsedHeaders === null || Array.isArray(parsedHeaders)) {
            throw new Error("Project report headers must be a JSON object.");
        }
        projectReportHeaders = Object.fromEntries(
            Object.entries(parsedHeaders)
                .map(([key, value]) => [String(key || "").trim(), String(value ?? "")])
                .filter(([key]) => key.length > 0)
        );
    }

    return {
        provider_name: getValue("project-report-provider-name"),
        endpoint: getValue("project-report-endpoint"),
        method: ["POST", "PUT", "PATCH"].includes(projectReportMethod) ? projectReportMethod : "POST",
        format: projectReportFormat,
        headers: projectReportHeaders,
        timeout_seconds: projectReportTimeout,
        mtls: {
            enabled: getChecked("project-report-mtls-enabled"),
            client_cert_path: getValue("project-report-mtls-cert"),
            client_key_path: getValue("project-report-mtls-key"),
            ca_cert_path: getValue("project-report-mtls-ca"),
        },
    };
}


export async function loadSchedulerPreferences() {
    try {
        const response = await fetch("/api/scheduler/preferences");
        if (!response.ok) {
            return;
        }
        const prefs = await response.json();
        applySchedulerPreferences(prefs);
    } catch (_err) {
    }
}


export async function saveSchedulerPreferences(event) {
    event.preventDefault();
    const statusNode = document.getElementById("scheduler-save-status");
    if (statusNode) {
        statusNode.textContent = "Saving...";
    }
    let payload;
    try {
        payload = collectSchedulerPreferencesFromForm();
    } catch (err) {
        if (statusNode) {
            statusNode.textContent = err.message || "Save failed";
        }
        return;
    }
    try {
        const response = await fetch("/api/scheduler/preferences", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            let message = "Save failed";
            try {
                const errorPayload = await response.json();
                if (errorPayload && errorPayload.error) {
                    message = `Save failed: ${errorPayload.error}`;
                }
            } catch (_err) {
            }
            if (statusNode) {
                statusNode.textContent = message;
            }
            return;
        }
        const prefs = await response.json();
        applySchedulerPreferences(prefs);
        if (statusNode) {
            statusNode.textContent = "Saved";
        }
    } catch (_err) {
        if (statusNode) {
            statusNode.textContent = "Save failed";
        }
    }
}


export async function saveProjectReportDeliveryPreferences(event) {
    if (event) {
        event.preventDefault();
    }
    const statusNode = document.getElementById("report-provider-save-status");
    if (statusNode) {
        statusNode.textContent = "Saving...";
    }
    let delivery;
    try {
        delivery = collectProjectReportDeliveryFromForm();
    } catch (err) {
        if (statusNode) {
            statusNode.textContent = err.message || "Save failed";
        }
        return;
    }
    try {
        const response = await fetch("/api/scheduler/preferences", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                project_report_delivery: delivery,
            }),
        });
        if (!response.ok) {
            if (statusNode) {
                statusNode.textContent = "Save failed";
            }
            return;
        }
        const prefs = await response.json();
        applySchedulerPreferences(prefs);
        if (statusNode) {
            statusNode.textContent = "Saved";
        }
        setActionStatus("Report provider settings saved");
    } catch (_err) {
        if (statusNode) {
            statusNode.textContent = "Save failed";
        }
    }
}


export async function testSchedulerProviderAction(event) {
    if (event) {
        event.preventDefault();
    }
    const statusNode = document.getElementById("scheduler-save-status");
    if (statusNode) {
        statusNode.textContent = "Testing provider...";
    }
    let payload;
    try {
        payload = collectSchedulerPreferencesFromForm();
    } catch (err) {
        if (statusNode) {
            statusNode.textContent = err.message || "Provider test failed";
        }
        return;
    }
    try {
        const result = await postJson("/api/scheduler/provider/test", payload);
        if (!result.ok) {
            if (statusNode) {
                statusNode.textContent = `Provider test failed: ${result.error || "unknown error"}`;
            }
            return;
        }

        const summaryParts = [];
        if (result.provider) {
            summaryParts.push(result.provider);
        }
        if (result.model) {
            summaryParts.push(`model=${result.model}`);
        }
        if (result.api_style) {
            summaryParts.push(`api=${result.api_style}`);
        }
        if (result.endpoint) {
            summaryParts.push(result.endpoint);
        }
        if (result.structured_output_used) {
            summaryParts.push("structured");
        } else if (result.structured_output_fallback) {
            summaryParts.push("structured-fallback");
        }
        if (result.auto_selected_model) {
            summaryParts.push("auto-selected");
        }
        if (typeof result.latency_ms === "number") {
            summaryParts.push(`${result.latency_ms}ms`);
        }
        if (statusNode) {
            const suffix = summaryParts.length ? ` (${summaryParts.join(" | ")})` : "";
            statusNode.textContent = `Provider OK${suffix}`;
        }
    } catch (err) {
        if (statusNode) {
            statusNode.textContent = `Provider test failed: ${err.message}`;
        }
    }
}
