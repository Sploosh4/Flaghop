from app.contracts.actions.policy import (
    EngagementPolicy,
    VALID_SCOPE,
    VALID_INTENT,
    VALID_RISK_MODE,
    VALID_DETECTION_RISK_MODE,
    VALID_APPROVAL_MODE,
    VALID_RUNNER_PREFERENCE,
    VALID_NOISE_BUDGET,
    ENGAGEMENT_PRESET_LABELS,
    ENGAGEMENT_PRESET_DESCRIPTIONS,
    LEGACY_GOAL_TO_PRESET,
    PRESET_DEFAULTS,
)
from app.core.action_values import VALID_ENGAGEMENT_PRESETS, legacy_goal_profile_from_policy
import json
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, Optional

from sqlalchemy import text


def _normalize_text(value: Any, *, default: str = "") -> str:
    text_value = str(value or "").strip().lower()
    return text_value or str(default or "").strip().lower()


def _normalize_bool(value: Any, *, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return bool(default)
    text_value = str(value).strip().lower()
    if text_value in {"1", "true", "yes", "on"}:
        return True
    if text_value in {"0", "false", "no", "off"}:
        return False
    return bool(default)


def _normalize_choice(value: Any, valid_values: set, *, default: str) -> str:
    normalized = _normalize_text(value, default=default)
    if normalized not in valid_values:
        return str(default)
    return normalized


def _normalize_custom_overrides(value: Any) -> Dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    return {str(key): item for key, item in value.items() if str(key).strip()}


def preset_from_legacy_goal_profile(goal_profile: str) -> str:
    normalized = _normalize_text(goal_profile, default="internal_asset_discovery")
    return LEGACY_GOAL_TO_PRESET.get(normalized, "internal_recon")


def list_engagement_presets() -> list:
    return [
        {
            "id": preset_id,
            "name": ENGAGEMENT_PRESET_LABELS.get(preset_id, preset_id.replace("_", " ").title()),
            "description": ENGAGEMENT_PRESET_DESCRIPTIONS.get(preset_id, ""),
        }
        for preset_id in (
            "external_recon",
            "external_pentest",
            "internal_quick_recon",
            "internal_recon",
            "internal_pentest",
            "custom",
        )
    ]


def normalize_engagement_policy(
    raw: Optional[Dict[str, Any]] = None,
    *,
    fallback_goal_profile: str = "internal_asset_discovery",
) -> EngagementPolicy:
    source = dict(raw or {}) if isinstance(raw, dict) else {}
    fallback_preset = preset_from_legacy_goal_profile(fallback_goal_profile)
    requested_preset = _normalize_text(source.get("preset"), default="")
    if requested_preset not in VALID_ENGAGEMENT_PRESETS:
        requested_preset = preset_from_legacy_goal_profile(str(source.get("goal_profile", "") or fallback_goal_profile))
    base_preset = fallback_preset if requested_preset == "custom" else requested_preset
    base = dict(PRESET_DEFAULTS.get(base_preset, PRESET_DEFAULTS["internal_recon"]))

    scope = _normalize_choice(source.get("scope", base.get("scope")), VALID_SCOPE, default=base["scope"])
    intent = _normalize_choice(source.get("intent", base.get("intent")), VALID_INTENT, default=base["intent"])

    return EngagementPolicy(
        preset=_normalize_choice(requested_preset, VALID_ENGAGEMENT_PRESETS, default=fallback_preset),
        scope=scope,
        intent=intent,
        allow_exploitation=_normalize_bool(
            source.get("allow_exploitation", base.get("allow_exploitation")),
            default=bool(base.get("allow_exploitation", False)),
        ),
        allow_lateral_movement=_normalize_bool(
            source.get("allow_lateral_movement", base.get("allow_lateral_movement")),
            default=bool(base.get("allow_lateral_movement", False)),
        ),
        credential_attack_mode=_normalize_choice(
            source.get("credential_attack_mode", base.get("credential_attack_mode")),
            VALID_RISK_MODE,
            default=base["credential_attack_mode"],
        ),
        lockout_risk_mode=_normalize_choice(
            source.get("lockout_risk_mode", base.get("lockout_risk_mode")),
            VALID_RISK_MODE,
            default=base["lockout_risk_mode"],
        ),
        stability_risk_mode=_normalize_choice(
            source.get("stability_risk_mode", base.get("stability_risk_mode")),
            VALID_RISK_MODE,
            default=base["stability_risk_mode"],
        ),
        detection_risk_mode=_normalize_choice(
            source.get("detection_risk_mode", base.get("detection_risk_mode")),
            VALID_DETECTION_RISK_MODE,
            default=base["detection_risk_mode"],
        ),
        approval_mode=_normalize_choice(
            source.get("approval_mode", base.get("approval_mode")),
            VALID_APPROVAL_MODE,
            default=base["approval_mode"],
        ),
        runner_preference=_normalize_choice(
            source.get("runner_preference", base.get("runner_preference")),
            VALID_RUNNER_PREFERENCE,
            default=base["runner_preference"],
        ),
        noise_budget=_normalize_choice(
            source.get("noise_budget", base.get("noise_budget")),
            VALID_NOISE_BUDGET,
            default=base["noise_budget"],
        ),
        custom_overrides=_normalize_custom_overrides(source.get("custom_overrides")),
    )


from db.schema import ensure_column as _ensure_column


def _ensure_table(session):
    session.execute(
        text(
            "CREATE TABLE IF NOT EXISTS scheduler_engagement_policy ("
            "policy_id INTEGER PRIMARY KEY,"
            "preset TEXT,"
            "scope TEXT,"
            "intent TEXT,"
            "allow_exploitation TEXT,"
            "allow_lateral_movement TEXT,"
            "credential_attack_mode TEXT,"
            "lockout_risk_mode TEXT,"
            "stability_risk_mode TEXT,"
            "detection_risk_mode TEXT,"
            "approval_mode TEXT,"
            "runner_preference TEXT,"
            "noise_budget TEXT,"
            "custom_overrides_json TEXT,"
            "updated_at TEXT,"
            "derived_from_goal_profile TEXT"
            ")"
        )
    )
    for column_name, column_type in (
        ("preset", "TEXT"),
        ("scope", "TEXT"),
        ("intent", "TEXT"),
        ("allow_exploitation", "TEXT"),
        ("allow_lateral_movement", "TEXT"),
        ("credential_attack_mode", "TEXT"),
        ("lockout_risk_mode", "TEXT"),
        ("stability_risk_mode", "TEXT"),
        ("detection_risk_mode", "TEXT"),
        ("approval_mode", "TEXT"),
        ("runner_preference", "TEXT"),
        ("noise_budget", "TEXT"),
        ("custom_overrides_json", "TEXT"),
        ("updated_at", "TEXT"),
        ("derived_from_goal_profile", "TEXT"),
    ):
        _ensure_column(session, "scheduler_engagement_policy", column_name, column_type)


def ensure_scheduler_engagement_policy_table(database):
    session = database.session()
    try:
        _ensure_table(session)
        session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()


def get_project_engagement_policy(database) -> Optional[Dict[str, Any]]:
    session = database.session()
    try:
        _ensure_table(session)
        result = session.execute(
            text(
                "SELECT preset, scope, intent, allow_exploitation, allow_lateral_movement, "
                "credential_attack_mode, lockout_risk_mode, stability_risk_mode, detection_risk_mode, "
                "approval_mode, runner_preference, noise_budget, custom_overrides_json, updated_at, "
                "derived_from_goal_profile "
                "FROM scheduler_engagement_policy WHERE policy_id = 1 LIMIT 1"
            )
        )
        row = result.fetchone()
        if row is None:
            return None
        keys = list(result.keys())
        payload = dict(zip(keys, row))
        try:
            payload["custom_overrides"] = json.loads(str(payload.get("custom_overrides_json", "") or "{}"))
        except Exception:
            payload["custom_overrides"] = {}
        return payload
    finally:
        session.close()


def upsert_project_engagement_policy(
    database,
    policy: Any,
    *,
    updated_at: str = "",
) -> Dict[str, Any]:
    normalized = policy if isinstance(policy, EngagementPolicy) else normalize_engagement_policy(policy or {})
    payload = normalized.to_dict()
    row = {
        "policy_id": 1,
        "preset": payload["preset"],
        "scope": payload["scope"],
        "intent": payload["intent"],
        "allow_exploitation": "True" if payload["allow_exploitation"] else "False",
        "allow_lateral_movement": "True" if payload["allow_lateral_movement"] else "False",
        "credential_attack_mode": payload["credential_attack_mode"],
        "lockout_risk_mode": payload["lockout_risk_mode"],
        "stability_risk_mode": payload["stability_risk_mode"],
        "detection_risk_mode": payload["detection_risk_mode"],
        "approval_mode": payload["approval_mode"],
        "runner_preference": payload["runner_preference"],
        "noise_budget": payload["noise_budget"],
        "custom_overrides_json": json.dumps(payload.get("custom_overrides", {}), sort_keys=True),
        "updated_at": str(updated_at or ""),
        "derived_from_goal_profile": payload["legacy_goal_profile"],
    }
    session = database.session()
    try:
        _ensure_table(session)
        existing = session.execute(
            text("SELECT policy_id FROM scheduler_engagement_policy WHERE policy_id = 1 LIMIT 1")
        ).fetchone()
        if existing is None:
            session.execute(
                text(
                    "INSERT INTO scheduler_engagement_policy ("
                    "policy_id, preset, scope, intent, allow_exploitation, allow_lateral_movement, "
                    "credential_attack_mode, lockout_risk_mode, stability_risk_mode, detection_risk_mode, "
                    "approval_mode, runner_preference, noise_budget, custom_overrides_json, updated_at, "
                    "derived_from_goal_profile"
                    ") VALUES ("
                    ":policy_id, :preset, :scope, :intent, :allow_exploitation, :allow_lateral_movement, "
                    ":credential_attack_mode, :lockout_risk_mode, :stability_risk_mode, :detection_risk_mode, "
                    ":approval_mode, :runner_preference, :noise_budget, :custom_overrides_json, :updated_at, "
                    ":derived_from_goal_profile"
                    ")"
                ),
                row,
            )
        else:
            session.execute(
                text(
                    "UPDATE scheduler_engagement_policy SET "
                    "preset = :preset, "
                    "scope = :scope, "
                    "intent = :intent, "
                    "allow_exploitation = :allow_exploitation, "
                    "allow_lateral_movement = :allow_lateral_movement, "
                    "credential_attack_mode = :credential_attack_mode, "
                    "lockout_risk_mode = :lockout_risk_mode, "
                    "stability_risk_mode = :stability_risk_mode, "
                    "detection_risk_mode = :detection_risk_mode, "
                    "approval_mode = :approval_mode, "
                    "runner_preference = :runner_preference, "
                    "noise_budget = :noise_budget, "
                    "custom_overrides_json = :custom_overrides_json, "
                    "updated_at = :updated_at, "
                    "derived_from_goal_profile = :derived_from_goal_profile "
                    "WHERE policy_id = :policy_id"
                ),
                row,
            )
        session.commit()
        return payload
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
