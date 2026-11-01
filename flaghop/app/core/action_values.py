"""Pure action compatibility conversions, independent of scheduler services."""

from typing import Any, Iterable, List, Optional, Set


def _normalize_text(value):
    return str(value or "").strip().lower()


VALID_RISK_TAGS = {
    "exploit_execution",
    "credential_bruteforce",
    "password_spray",
    "account_lockout_risk",
    "service_instability",
    "network_flooding",
    "destructive_write",
    "persistence_action",
    "lateral_movement",
    "high_detection_likelihood",
    "credential_capture_side_effect",
    "browser_state_change",
    "data_exfiltration_risk",
}


LEGACY_CATEGORY_ALIASES = {
    "destructive_write_actions": "destructive_write",
}


LEGACY_CATEGORY_TO_RISK_TAGS = {
    "exploit_execution": {"exploit_execution"},
    "credential_bruteforce": {
        "credential_bruteforce",
        "password_spray",
        "account_lockout_risk",
    },
    "network_flooding": {"network_flooding"},
    "destructive_write_actions": {"destructive_write"},
}


def normalize_risk_tags(values: Optional[Iterable[Any]]) -> List[str]:
    normalized = []
    seen: Set[str] = set()
    for item in list(values or []):
        tag = LEGACY_CATEGORY_ALIASES.get(_normalize_text(item), _normalize_text(item))
        if not tag or tag not in VALID_RISK_TAGS or tag in seen:
            continue
        seen.add(tag)
        normalized.append(tag)
    return normalized


def risk_tags_to_legacy_categories(
    risk_tags: Optional[Iterable[Any]],
    enabled_categories: Optional[Iterable[Any]] = None,
) -> List[str]:
    normalized_tags = set(normalize_risk_tags(risk_tags))
    if enabled_categories is None:
        requested = list(LEGACY_CATEGORY_TO_RISK_TAGS.keys())
    else:
        requested = []
        for item in list(enabled_categories or []):
            category = _normalize_text(item)
            if category in LEGACY_CATEGORY_TO_RISK_TAGS and category not in requested:
                requested.append(category)

    categories = []
    for category in requested:
        if LEGACY_CATEGORY_TO_RISK_TAGS.get(category, set()) & normalized_tags:
            categories.append(category)
    return categories


VALID_ENGAGEMENT_PRESETS = {
    "external_recon",
    "external_pentest",
    "internal_quick_recon",
    "internal_recon",
    "internal_pentest",
    "custom",
}


def legacy_goal_profile_from_policy(preset: str, *, scope: str = "internal", intent: str = "recon") -> str:
    normalized = _normalize_text(preset)
    if normalized not in VALID_ENGAGEMENT_PRESETS:
        normalized = "internal_recon"
    if normalized in {"external_recon", "external_pentest"}:
        return "external_pentest"
    if normalized in {"internal_quick_recon", "internal_recon", "internal_pentest"}:
        return "internal_asset_discovery"
    if str(scope or "internal").strip().lower() == "external":
        return "external_pentest"
    return "internal_asset_discovery"
