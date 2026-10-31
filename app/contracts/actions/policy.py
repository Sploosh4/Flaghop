"""Action policy decision values; policy evaluation lives in the scheduler."""

from app.core.action_values import legacy_goal_profile_from_policy
from app.contracts.base import ActionData
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List


@dataclass(frozen=True)
class PolicyDecision(ActionData):
    state: str
    risk_tags: List[str] = field(default_factory=list)
    legacy_danger_categories: List[str] = field(default_factory=list)
    reason: str = ""
    risk_summary: str = ""
    safer_alternative: str = ""
    family_policy_state: str = ""

    @property
    def requires_approval(self) -> bool:
        return self.state == "approval_required"

    @property
    def is_blocked(self) -> bool:
        return self.state == "blocked"

    def to_dict(self):
        return {
            "state": self.state,
            "risk_tags": list(self.risk_tags),
            "legacy_danger_categories": list(self.legacy_danger_categories),
            "reason": self.reason,
            "risk_summary": self.risk_summary,
            "safer_alternative": self.safer_alternative,
            "family_policy_state": self.family_policy_state,
        }


VALID_SCOPE = {"internal", "external", "mixed"}


VALID_INTENT = {"recon", "pentest"}


VALID_RISK_MODE = {"blocked", "approval", "allowed"}


VALID_DETECTION_RISK_MODE = {"low", "medium", "high"}


VALID_APPROVAL_MODE = {"never", "risky", "always"}


VALID_RUNNER_PREFERENCE = {"local"}


VALID_NOISE_BUDGET = {"low", "medium", "high"}


ENGAGEMENT_PRESET_LABELS = {
    "external_recon": "External Recon",
    "external_pentest": "External Pentest",
    "internal_quick_recon": "Internal Quick Recon",
    "internal_recon": "Internal Recon",
    "internal_pentest": "Internal Pentest",
    "custom": "Custom",
}


ENGAGEMENT_PRESET_DESCRIPTIONS = {
    "external_recon": "Passive and low-noise external mapping. Focus on discovery, fingerprinting, and bounded validation.",
    "external_pentest": "Broader external assessment with deeper active follow-up once recon confirms a target is worth it.",
    "internal_quick_recon": "Fast internal low-hanging-fruit sweep. Focus on SMB, NetBIOS, NFS, printers, common admin panels, and other obvious exposures instead of broad coverage.",
    "internal_recon": "Broader internal discovery and validation across exposed services with safer follow-up than pentest mode.",
    "internal_pentest": "Deeper internal assessment with wider follow-up, credential-adjacent validation, and higher-noise exploration.",
    "custom": "Manual override for engagements that do not fit the standard presets.",
}


LEGACY_GOAL_TO_PRESET = {
    "internal_asset_discovery": "internal_recon",
    "external_pentest": "external_pentest",
    "internal_quick_recon": "internal_quick_recon",
    "internal_recon": "internal_recon",
    "external_recon": "external_recon",
    "internal_pentest": "internal_pentest",
    "custom": "custom",
}


PRESET_DEFAULTS = {
    "external_recon": {
        "scope": "external",
        "intent": "recon",
        "allow_exploitation": False,
        "allow_lateral_movement": False,
        "credential_attack_mode": "blocked",
        "lockout_risk_mode": "blocked",
        "stability_risk_mode": "approval",
        "detection_risk_mode": "low",
        "approval_mode": "risky",
        "runner_preference": "local",
        "noise_budget": "low",
    },
    "external_pentest": {
        "scope": "external",
        "intent": "pentest",
        "allow_exploitation": True,
        "allow_lateral_movement": False,
        "credential_attack_mode": "approval",
        "lockout_risk_mode": "approval",
        "stability_risk_mode": "approval",
        "detection_risk_mode": "medium",
        "approval_mode": "risky",
        "runner_preference": "local",
        "noise_budget": "medium",
    },
    "internal_quick_recon": {
        "scope": "internal",
        "intent": "recon",
        "allow_exploitation": False,
        "allow_lateral_movement": False,
        "credential_attack_mode": "blocked",
        "lockout_risk_mode": "blocked",
        "stability_risk_mode": "approval",
        "detection_risk_mode": "low",
        "approval_mode": "risky",
        "runner_preference": "local",
        "noise_budget": "low",
    },
    "internal_recon": {
        "scope": "internal",
        "intent": "recon",
        "allow_exploitation": False,
        "allow_lateral_movement": False,
        "credential_attack_mode": "blocked",
        "lockout_risk_mode": "blocked",
        "stability_risk_mode": "approval",
        "detection_risk_mode": "low",
        "approval_mode": "risky",
        "runner_preference": "local",
        "noise_budget": "low",
    },
    "internal_pentest": {
        "scope": "internal",
        "intent": "pentest",
        "allow_exploitation": True,
        "allow_lateral_movement": True,
        "credential_attack_mode": "approval",
        "lockout_risk_mode": "approval",
        "stability_risk_mode": "approval",
        "detection_risk_mode": "medium",
        "approval_mode": "risky",
        "runner_preference": "local",
        "noise_budget": "medium",
    },
}


@dataclass(frozen=True)
class EngagementPolicy(ActionData):
    preset: str
    scope: str
    intent: str
    allow_exploitation: bool
    allow_lateral_movement: bool
    credential_attack_mode: str
    lockout_risk_mode: str
    stability_risk_mode: str
    detection_risk_mode: str
    approval_mode: str
    runner_preference: str
    noise_budget: str
    custom_overrides: Dict[str, Any] = field(default_factory=dict)

    @property
    def preset_label(self) -> str:
        return ENGAGEMENT_PRESET_LABELS.get(self.preset, self.preset.replace("_", " ").title())

    @property
    def preset_description(self) -> str:
        return ENGAGEMENT_PRESET_DESCRIPTIONS.get(self.preset, "")

    @property
    def legacy_goal_profile(self) -> str:
        return legacy_goal_profile_from_policy(
            self.preset,
            scope=self.scope,
            intent=self.intent,
        )

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["preset_label"] = self.preset_label
        payload["preset_description"] = self.preset_description
        payload["legacy_goal_profile"] = self.legacy_goal_profile
        return payload
