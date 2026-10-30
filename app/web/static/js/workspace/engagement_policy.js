/** engagement policy: shared behavior independent of action controllers. */
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
