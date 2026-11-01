"""Strict partial scheduler/policy inputs; defaults are omitted from patches."""

from app.contracts.actions.inputs import LegacyBool, LegacyInt
from app.contracts.base import ActionRequest
from pydantic import Field
from typing import Literal, Annotated


class EngagementPolicyFields(ActionRequest):
    scope: Literal["internal", "external", "mixed"] = "internal"
    intent: Literal["recon", "pentest"] = "recon"
    allow_exploitation: LegacyBool = False
    allow_lateral_movement: LegacyBool = False
    credential_attack_mode: Literal["blocked", "approval", "allowed"] = "blocked"
    lockout_risk_mode: Literal["blocked", "approval", "allowed"] = "blocked"
    stability_risk_mode: Literal["blocked", "approval", "allowed"] = "approval"
    detection_risk_mode: Literal["low", "medium", "high"] = "low"
    approval_mode: Literal["never", "risky", "always"] = "risky"
    runner_preference: Literal["local"] = "local"
    noise_budget: Literal["low", "medium", "high"] = "low"


class EngagementPolicyPatch(EngagementPolicyFields):
    preset: Literal[
        "external_recon", "external_pentest", "internal_quick_recon", "internal_recon", "internal_pentest", "custom"
    ] = "internal_recon"
    custom_overrides: EngagementPolicyFields = Field(default_factory=EngagementPolicyFields)
    # Older forms send their rendered policy labels back. They are bounded
    # compatibility metadata, never authoritative inputs to execution policy.
    preset_label: str = Field(default="", max_length=256)
    preset_description: str = Field(default="", max_length=10000)
    legacy_goal_profile: Literal["internal_asset_discovery", "external_pentest"] | None = None

    def to_updates(self):
        return self.model_dump(
            exclude_unset=True, exclude={"preset_label", "preset_description", "legacy_goal_profile"}
        )


class FeatureFlagsPatch(ActionRequest):
    graph_workspace: LegacyBool = False
    context_summary_enabled: LegacyBool = True


class DeviceCategoryRule(ActionRequest):
    id: str = ""
    name: str = Field(min_length=1, max_length=80)
    ports: list[Annotated[LegacyInt, Field(ge=1, le=65535)]] = Field(default_factory=list, max_length=65535)
    fingerprint_fragments: list[str] = Field(default_factory=list, max_length=1000)
    cpe: list[str] = Field(default_factory=list, max_length=1000)
    min_score: LegacyInt = Field(default=2, ge=1, le=100)
    suppresses: list[str] = Field(default_factory=list, max_length=1000)
    built_in: LegacyBool = False


class SchedulerPreferencesPatch(ActionRequest):
    mode: Literal["deterministic"] = "deterministic"
    goal_profile: Literal["internal_asset_discovery", "external_pentest"] = "internal_asset_discovery"
    engagement_policy: EngagementPolicyPatch = Field(default_factory=EngagementPolicyPatch)
    feature_flags: FeatureFlagsPatch = Field(default_factory=FeatureFlagsPatch)
    max_concurrency: LegacyInt = Field(default=1, ge=1, le=16)
    max_host_concurrency: LegacyInt = Field(default=1, ge=1, le=8)
    max_jobs: LegacyInt = Field(default=200, ge=20, le=2000)
    device_categories: list[DeviceCategoryRule | str] = Field(default_factory=list, max_length=1000)
    dangerous_categories: list[str] = Field(default_factory=list, max_length=1000)

    @property
    def updates(self):
        updates = self.model_dump(exclude_unset=True)
        if "engagement_policy" in updates:
            updates["engagement_policy"] = self.engagement_policy.to_updates()
        return updates
