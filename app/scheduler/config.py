"""Local execution limits, engagement policy and device category preferences."""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.device_categories import normalize_custom_device_category_rules
from app.paths import ensure_legion_home, get_scheduler_config_path
from app.scheduler.policy_engine import VALID_FAMILY_POLICY_STATES
from app.scheduler.policy import (
    legacy_goal_profile_from_policy,
    normalize_engagement_policy,
    preset_from_legacy_goal_profile,
)

DEFAULT_FEATURE_FLAGS = {"graph_workspace": False, "context_summary_enabled": True}
DEFAULT_DISABLED_TOOL_IDS = []
DEFAULT_TOOL_EXECUTION_PROFILES = {
    "tshark-passive-capture": {
        "quiet_long_running": True,
        "activity_timeout_seconds": 9000,
        "hard_timeout_seconds": 7800,
    }
}
DEFAULT_DEVICE_CATEGORIES = []
VALID_MODES = {"deterministic"}
VALID_GOAL_PROFILES = {"internal_asset_discovery", "external_pentest"}


def normalize_feature_flags(raw: Any) -> Dict[str, bool]:
    source = raw if isinstance(raw, dict) else {}
    flags = dict(DEFAULT_FEATURE_FLAGS)
    for key in tuple(flags.keys()):
        if key in source:
            flags[key] = bool(source.get(key))
    return flags


def normalize_disabled_tool_ids(raw: Any) -> List[str]:
    values = raw if isinstance(raw, list) else DEFAULT_DISABLED_TOOL_IDS
    normalized = []
    seen = set()
    for item in list(values or []):
        token = str(item or "").strip().lower()
        if not token or token in seen:
            continue
        seen.add(token)
        normalized.append(token)
    return normalized


def normalize_tool_execution_profiles(raw: Any) -> Dict[str, Dict[str, Any]]:
    source = raw if isinstance(raw, dict) else {}
    merged: Dict[str, Dict[str, Any]] = {
        str(tool_id): dict(profile)
        for tool_id, profile in DEFAULT_TOOL_EXECUTION_PROFILES.items()
        if isinstance(profile, dict)
    }
    for tool_id, profile in source.items():
        if not isinstance(profile, dict):
            continue
        token = str(tool_id or "").strip().lower()
        if not token:
            continue
        current = dict(merged.get(token, {}))
        current.update(profile)
        merged[token] = current

    normalized: Dict[str, Dict[str, Any]] = {}
    for tool_id, profile in merged.items():
        token = str(tool_id or "").strip().lower()
        if not token:
            continue
        quiet_long_running = bool(profile.get("quiet_long_running", False))
        try:
            activity_timeout = int(profile.get("activity_timeout_seconds", 0) or 0)
        except (TypeError, ValueError):
            activity_timeout = 0
        try:
            hard_timeout = int(profile.get("hard_timeout_seconds", 0) or 0)
        except (TypeError, ValueError):
            hard_timeout = 0

        if quiet_long_running:
            activity_timeout = max(30, min(activity_timeout or 1800, 86400))
        else:
            activity_timeout = 0
        hard_timeout = max(0, min(hard_timeout, 172800))

        normalized[token] = {
            "quiet_long_running": quiet_long_running,
            "activity_timeout_seconds": int(activity_timeout),
            "hard_timeout_seconds": int(hard_timeout),
        }
    return normalized


def normalize_device_categories(raw: Any) -> List[Dict[str, Any]]:
    return normalize_custom_device_category_rules(raw)


DEFAULT_SCHEDULER_CONFIG = {
    "mode": "deterministic",
    "goal_profile": "internal_asset_discovery",
    "engagement_policy": normalize_engagement_policy({"preset": "internal_recon"}).to_dict(),
    "max_concurrency": 1,
    "max_host_concurrency": 1,
    "max_jobs": 200,
    "device_categories": [],
    "feature_flags": normalize_feature_flags({}),
    "disabled_tool_ids": [],
    "tool_execution_profiles": normalize_tool_execution_profiles({}),
    "dangerous_categories": [
        "exploit_execution",
        "credential_bruteforce",
        "network_flooding",
        "destructive_write_actions",
    ],
    "preapproved_command_families": [],
}


def get_default_scheduler_config_path():
    ensure_legion_home()
    return get_scheduler_config_path("scheduler.json")


class SchedulerConfigManager:
    def __init__(self, config_path=None):
        self.config_path = config_path or get_default_scheduler_config_path()
        self._cache = None

    def load(self):
        if self._cache is None:
            try:
                with open(self.config_path, encoding="utf-8") as handle:
                    raw = json.load(handle)
            except (OSError, ValueError):
                raw = {}
            self._cache = self._normalize_config(raw if isinstance(raw, dict) else {})
        return self._cache

    def save(self, config):
        normalized = self._normalize_config(config)
        os.makedirs(os.path.dirname(os.path.abspath(self.config_path)), exist_ok=True)
        with open(self.config_path, "w", encoding="utf-8") as handle:
            json.dump(normalized, handle, indent=2, sort_keys=True)
        self._cache = normalized

    def merge_preferences(self, updates):
        merged = dict(self.load())
        for key, value in updates.items():
            if key not in DEFAULT_SCHEDULER_CONFIG:
                continue
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key] = {**merged[key], **value}
            else:
                merged[key] = value
        if "goal_profile" in updates and "engagement_policy" not in updates:
            merged["engagement_policy"] = {"preset": preset_from_legacy_goal_profile(str(updates["goal_profile"]))}
        return self._normalize_config(merged)

    def update_preferences(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        normalized = self.merge_preferences(updates)
        self.save(normalized)
        return self.load()

    def get_mode(self) -> str:
        return self.load().get("mode", "deterministic")

    def get_goal_profile(self) -> str:
        return self.load().get("goal_profile", "internal_asset_discovery")

    def get_engagement_policy(self) -> Dict[str, Any]:
        return dict(self.load().get("engagement_policy", {}))

    def get_feature_flags(self) -> Dict[str, bool]:
        return dict(self.load().get("feature_flags", {}))

    def get_device_categories(self) -> List[Dict[str, Any]]:
        return normalize_device_categories(self.load().get("device_categories", []))

    def is_feature_enabled(self, feature_name: str, default: bool = True) -> bool:
        feature_key = str(feature_name or "").strip()
        if not feature_key:
            return bool(default)
        flags = self.get_feature_flags()
        if feature_key not in DEFAULT_FEATURE_FLAGS:
            return bool(default)
        return bool(flags.get(feature_key, DEFAULT_FEATURE_FLAGS[feature_key]))

    def get_dangerous_categories(self) -> List[str]:
        values = self.load().get("dangerous_categories", [])
        return [str(item) for item in values if item]

    def get_disabled_tool_ids(self) -> List[str]:
        return normalize_disabled_tool_ids(self.load().get("disabled_tool_ids", []))

    def list_preapproved_families(self) -> List[Dict[str, Any]]:
        return [
            dict(item)
            for item in self.list_family_policies()
            if str(item.get("policy_state", "allowed")).strip().lower() == "allowed"
        ]

    def list_family_policies(self) -> List[Dict[str, Any]]:
        families = self.load().get("preapproved_command_families", [])
        return [dict(item) for item in families if isinstance(item, dict)]

    def is_family_preapproved(self, family_id: str) -> bool:
        return self.get_family_policy_state(family_id) == "allowed"

    def get_family_policy(self, family_id: str) -> Dict[str, Any]:
        family_key = str(family_id or "").strip()
        if not family_key:
            return {}
        for item in self.list_family_policies():
            if item.get("family_id") == family_key:
                return dict(item)
        return {}

    def get_family_policy_state(self, family_id: str) -> str:
        policy = self.get_family_policy(family_id)
        state = str(policy.get("policy_state", "") or "").strip().lower()
        if state not in VALID_FAMILY_POLICY_STATES:
            return ""
        return state

    def set_family_policy(
        self,
        family_id: str,
        metadata: Dict[str, Any],
        policy_state: str,
        *,
        reason: str = "",
    ) -> Dict[str, Any]:
        family_key = str(family_id or "").strip()
        normalized_state = str(policy_state or "").strip().lower()
        if not family_key or normalized_state not in VALID_FAMILY_POLICY_STATES:
            return self.load()

        config = self.load()
        families = self.list_family_policies()
        entry = {
            "family_id": family_key,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "tool_id": str(metadata.get("tool_id", "")),
            "label": str(metadata.get("label", "")),
            "danger_categories": metadata.get("danger_categories", []),
            "approval_scope": str(metadata.get("approval_scope", "family")),
            "policy_state": normalized_state,
            "risk_tags": metadata.get("risk_tags", []),
            "reason": str(reason or metadata.get("reason", "")),
        }

        replaced = False
        for index, item in enumerate(families):
            if item.get("family_id") != family_key:
                continue
            merged = dict(item)
            merged.update(entry)
            families[index] = merged
            replaced = True
            break
        if not replaced:
            families.append(entry)

        config["preapproved_command_families"] = families
        self.save(config)
        return self.load()

    def approve_family(self, family_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        return self.set_family_policy(family_id, metadata, "allowed")

    def require_family_approval(self, family_id: str, metadata: Dict[str, Any], *, reason: str = "") -> Dict[str, Any]:
        return self.set_family_policy(family_id, metadata, "approval_required", reason=reason)

    def suppress_family(self, family_id: str, metadata: Dict[str, Any], *, reason: str = "") -> Dict[str, Any]:
        return self.set_family_policy(family_id, metadata, "suppressed", reason=reason)

    def block_family(self, family_id: str, metadata: Dict[str, Any], *, reason: str = "") -> Dict[str, Any]:
        return self.set_family_policy(family_id, metadata, "blocked", reason=reason)

    @staticmethod
    def _normalize_config(raw: Dict[str, Any]) -> Dict[str, Any]:
        config = dict(DEFAULT_SCHEDULER_CONFIG)
        config.update({k: v for k, v in raw.items() if k in config})

        mode = str(config.get("mode", "deterministic")).strip().lower()
        if mode not in VALID_MODES:
            mode = "deterministic"
        config["mode"] = mode

        goal_profile = (
            str(raw.get("goal_profile", config.get("goal_profile", "internal_asset_discovery"))).strip().lower()
        )
        if goal_profile not in VALID_GOAL_PROFILES:
            goal_profile = "internal_asset_discovery"

        policy_input = raw.get("engagement_policy", config.get("engagement_policy", {}))
        normalized_policy = normalize_engagement_policy(
            policy_input,
            fallback_goal_profile=goal_profile,
        )
        config["engagement_policy"] = normalized_policy.to_dict()
        config["goal_profile"] = legacy_goal_profile_from_policy(
            normalized_policy.preset,
            scope=normalized_policy.scope,
            intent=normalized_policy.intent,
        )

        try:
            max_concurrency = int(raw.get("max_concurrency", config.get("max_concurrency", 1)))
        except (TypeError, ValueError):
            max_concurrency = 1
        config["max_concurrency"] = max(1, min(max_concurrency, 16))

        try:
            max_host_concurrency = int(raw.get("max_host_concurrency", config.get("max_host_concurrency", 1)))
        except (TypeError, ValueError):
            max_host_concurrency = 1
        config["max_host_concurrency"] = max(1, min(max_host_concurrency, 8))

        try:
            max_jobs = int(raw.get("max_jobs", config.get("max_jobs", 200)))
        except (TypeError, ValueError):
            max_jobs = 200
        config["max_jobs"] = max(20, min(max_jobs, 2000))

        config["device_categories"] = normalize_device_categories(
            raw.get("device_categories", config.get("device_categories", []))
        )
        config["feature_flags"] = normalize_feature_flags(raw.get("feature_flags", config.get("feature_flags", {})))
        config["disabled_tool_ids"] = normalize_disabled_tool_ids(
            raw.get("disabled_tool_ids", config.get("disabled_tool_ids", DEFAULT_DISABLED_TOOL_IDS))
        )
        config["tool_execution_profiles"] = normalize_tool_execution_profiles(
            raw.get("tool_execution_profiles", config.get("tool_execution_profiles", DEFAULT_TOOL_EXECUTION_PROFILES))
        )

        dangerous_categories = raw.get("dangerous_categories", config["dangerous_categories"])
        if not isinstance(dangerous_categories, list):
            dangerous_categories = list(DEFAULT_SCHEDULER_CONFIG["dangerous_categories"])
        config["dangerous_categories"] = [str(item) for item in dangerous_categories if item]

        families = raw.get("preapproved_command_families", [])
        if not isinstance(families, list):
            families = []
        normalized_families = []
        for item in families:
            if not isinstance(item, dict):
                continue
            family_id = str(item.get("family_id", "")).strip()
            if not family_id:
                continue
            normalized_families.append(
                {
                    "family_id": family_id,
                    "approved_at": str(item.get("approved_at", "")),
                    "tool_id": str(item.get("tool_id", "")),
                    "label": str(item.get("label", "")),
                    "danger_categories": item.get("danger_categories", []),
                    "approval_scope": str(item.get("approval_scope", "family")),
                    "policy_state": (
                        str(item.get("policy_state", "allowed")).strip().lower()
                        if str(item.get("policy_state", "allowed")).strip().lower() in VALID_FAMILY_POLICY_STATES
                        else "allowed"
                    ),
                    "risk_tags": item.get("risk_tags", []),
                    "reason": str(item.get("reason", "")),
                }
            )
        config["preapproved_command_families"] = normalized_families

        return config
