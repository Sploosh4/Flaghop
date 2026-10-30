/** Workspace scan policy. */
import { getChecked, getValue, setChecked, setText, setValue } from "./dom.js";
import { fetchJson } from "./http.js";
import { applyNmapModeTargetDefaults, refreshNmapModeOptions, refreshNmapScanButtonState, setNmapWizardStep, updateNmapCommandPreview } from "./scan.js";
import { defaultEngagementPolicyForPreset, normalizeEngagementPolicyPayload } from "./scheduler_preferences.js";
import { nmapWizardState } from "./state.js";

export function engagementPresetSummaryText(preset, isCustom) {
    if (isCustom) {
        return "Custom lets you override scope and intent manually. Use the standard presets unless you need a non-standard combination.";
    }
    const normalizedPreset = String(preset || "").trim().toLowerCase();
    const descriptions = {
        external_recon: "Low-noise external mapping focused on discovery, fingerprinting, and bounded validation.",
        external_pentest: "Broader external follow-up once recon shows a target is worth deeper assessment.",
        internal_quick_recon: "Fast internal low-hanging-fruit sweep focused on SMB, NetBIOS, NFS, printers, common admin panels, and other obvious exposure points.",
        internal_recon: "Broader internal discovery and validation across exposed services without moving into pentest depth.",
        internal_pentest: "Deeper internal assessment with wider follow-up and higher-noise exploration.",
    };
    return descriptions[normalizedPreset] || "Preset drives scope and intent for most runs. Switch to custom only if you need a manual override.";
}


export function getActiveEngagementPreset() {
    return String(getValue("scheduler-goal-select") || "internal_recon").trim().toLowerCase();
}


export function getSelectedNmapEngagementPreset() {
    const selected = String(getValue("nmap-engagement-preset-select") || "").trim().toLowerCase();
    return selected || getActiveEngagementPreset();
}


export function isInternalQuickReconPreset(preset = "") {
    return String(preset || "").trim().toLowerCase() === "internal_quick_recon";
}


export function isInternalEngagementPresetSelection(preset = "") {
    const policy = buildEngagementPolicyForPresetSelection(preset, {
        fallbackGoalProfile: getValue("scheduler-goal-select") || "internal_recon",
    });
    return String(policy.scope || "").trim().toLowerCase() === "internal";
}


export function getSelectedPassiveCaptureDuration() {
    const raw = parseInt(getValue("passive-capture-duration"), 10);
    const allowed = new Set([5, 15, 30, 45, 60, 75, 90, 105, 120]);
    return allowed.has(raw) ? raw : 15;
}


export function buildEngagementPolicyForPresetSelection(preset, options = {}) {
    const normalizedPreset = String(preset || "internal_recon").trim().toLowerCase();
    if (normalizedPreset !== "custom") {
        return normalizeEngagementPolicyPayload(
            defaultEngagementPolicyForPreset(normalizedPreset),
            normalizedPreset,
        );
    }
    const fallbackGoalProfile = String(options.fallbackGoalProfile || getValue("scheduler-goal-select") || "internal_recon");
    return normalizeEngagementPolicyPayload(
        {
            preset: "custom",
            scope: getValue("engagement-scope-select") || "internal",
            intent: getValue("engagement-intent-select") || "recon",
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
        fallbackGoalProfile,
    );
}


export function syncNmapEngagementPresetControls() {
    const preset = getSelectedNmapEngagementPreset();
    const isCustom = preset === "custom";
    const derivedPolicy = buildEngagementPolicyForPresetSelection(preset, {
        fallbackGoalProfile: getValue("scheduler-goal-select") || "internal_recon",
    });

    setText("nmap-engagement-derived-scope", derivedPolicy.scope || "internal");
    setText("nmap-engagement-derived-intent", derivedPolicy.intent || "recon");

    const summaryNode = document.getElementById("nmap-engagement-preset-summary");
    if (summaryNode) {
        summaryNode.textContent = engagementPresetSummaryText(preset, isCustom);
    }

    const customNote = document.getElementById("nmap-engagement-custom-note");
    if (customNote) {
        customNote.hidden = !isCustom;
    }

    const passiveCard = document.getElementById("nmap-mode-card-passive");
    const passiveAllowed = String(derivedPolicy.scope || "").trim().toLowerCase() === "internal";
    if (passiveCard) {
        passiveCard.hidden = !passiveAllowed;
    }
    if (!passiveAllowed) {
        const selectedPassiveMode = document.querySelector("input[name='nmap-scan-mode'][value='passive_capture']");
        if (selectedPassiveMode && selectedPassiveMode.checked) {
            const fallbackMode = document.querySelector("input[name='nmap-scan-mode'][value='easy']");
            if (fallbackMode) {
                fallbackMode.checked = true;
            }
        }
    }
}


export function setPassiveCaptureInterfaceOptions(inventory = {}) {
    const select = document.getElementById("passive-capture-interface");
    const note = document.getElementById("passive-capture-interface-note");
    if (!select) {
        return;
    }
    const rows = Array.isArray(inventory.interfaces) ? inventory.interfaces : [];
    const defaultInterface = String(inventory.default_interface || "").trim();
    const previousValue = String(select.value || "").trim();
    select.innerHTML = "";
    if (!rows.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No capture-ready interfaces found";
        select.appendChild(option);
        select.value = "";
        if (note) {
            note.textContent = "Passive capture needs an active non-loopback IPv4 interface.";
        }
        updateNmapCommandPreview();
        return;
    }
    rows.forEach((item) => {
        const option = document.createElement("option");
        option.value = String(item.name || "").trim();
        option.textContent = String(item.label || item.name || "").trim();
        option.dataset.networks = Array.isArray(item.ipv4_networks) ? item.ipv4_networks.join(", ") : "";
        select.appendChild(option);
    });
    const preferredValue = previousValue && rows.some((item) => String(item.name || "").trim() === previousValue)
        ? previousValue
        : (defaultInterface && rows.some((item) => String(item.name || "").trim() === defaultInterface)
            ? defaultInterface
            : String(rows[0].name || "").trim());
    select.value = preferredValue;
    if (note) {
        const selectedOption = select.options[select.selectedIndex];
        const networks = String(selectedOption?.dataset?.networks || "").trim();
        note.textContent = networks
            ? `Connected networks: ${networks}`
            : "Passive capture will watch discovery traffic on the selected interface.";
    }
    updateNmapCommandPreview();
}


export async function loadPassiveCaptureInterfaces() {
    const select = document.getElementById("passive-capture-interface");
    if (!select) {
        return;
    }
    try {
        const inventory = await fetchJson("/api/network/interfaces");
        nmapWizardState.captureInterfacesLoaded = true;
        setPassiveCaptureInterfaceOptions(inventory || {});
    } catch (_err) {
        nmapWizardState.captureInterfacesLoaded = false;
        setPassiveCaptureInterfaceOptions({interfaces: [], default_interface: ""});
    }
}


export function resetNmapScanWizardState({scrollIntoView = false, focusPreset = false, focusTargets = false} = {}) {
    const block = document.getElementById("nmap-scan-block");
    if (scrollIntoView && block) {
        block.scrollIntoView({behavior: "smooth", block: "start"});
    }

    nmapWizardState.postSubmitLock = true;
    nmapWizardState.lastMode = "";
    nmapWizardState.lastEngagementPreset = "";
    nmapWizardState.captureInterfacesLoaded = false;
    setValue("nmap-targets", "");
    setChecked("nmap-run-actions", true);
    setValue("passive-capture-duration", "15");
    setPassiveCaptureInterfaceOptions({interfaces: [], default_interface: ""});

    const easyMode = document.querySelector("input[name='nmap-scan-mode'][value='easy']");
    if (easyMode) {
        easyMode.checked = true;
    }

    setValue("nmap-engagement-preset-select", getValue("scheduler-goal-select") || "internal_recon");
    syncNmapEngagementPresetControls();
    applyNmapModeTargetDefaults("easy");
    setNmapWizardStep(1);
    refreshNmapModeOptions();
    refreshNmapScanButtonState();
    loadPassiveCaptureInterfaces().catch(() => {});

    const focusTargetId = focusPreset ? "nmap-engagement-preset-select" : (focusTargets ? "nmap-targets" : "");
    if (focusTargetId) {
        const targetInput = document.getElementById(focusTargetId);
        if (targetInput) {
            window.setTimeout(() => {
                targetInput.focus();
            }, 220);
        }
    }
}
