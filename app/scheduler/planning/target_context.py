"""SchedulerPlanner: target context."""

from __future__ import annotations

import logging
import ipaddress
import re
import shlex
from typing import Any, Dict, List, Optional, Set
from app.hostsfile import normalize_hostname_alias, registrable_root_domain
from app.scheduler.family import build_command_family_id
from app.scheduler.models import PlanStep

logger = logging.getLogger(__name__)
ScheduledAction = PlanStep


class TargetContext:
    @staticmethod
    def _matches_any_token(text: str, tokens) -> bool:
        lowered = str(text or "").lower()
        return any(str(token or "").strip().lower() in lowered for token in list(tokens or []))

    @staticmethod
    def _is_ip_literal(value: str) -> bool:
        try:
            ipaddress.ip_address(str(value or "").strip())
            return True
        except ValueError:
            return False

    @classmethod
    def _target_hostname_supports_subdomain_discovery(cls, context: Optional[Dict[str, Any]]) -> bool:
        if not isinstance(context, dict):
            return False
        target = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        hostname = normalize_hostname_alias(str(target.get("hostname", "") or ""))
        if not hostname or cls._is_ip_literal(hostname):
            return False
        lowered = hostname.lower()
        if "." not in lowered:
            return False
        if lowered in {"localhost", "unknown"}:
            return False
        if lowered.endswith(".local") or lowered.endswith(".internal") or lowered.endswith(".lan"):
            return False
        return True

    @classmethod
    def _target_hostname_supports_root_domain_enrichment(cls, context: Optional[Dict[str, Any]]) -> bool:
        if not isinstance(context, dict):
            return False
        target = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        root_domain = str(target.get("root_domain", "") or "").strip().lower()
        if root_domain:
            return True
        hostname = normalize_hostname_alias(str(target.get("hostname", "") or ""))
        if registrable_root_domain(hostname):
            return True
        host_ip = str(target.get("host_ip", "") or "").strip()
        return bool(registrable_root_domain(host_ip))

    @classmethod
    def _target_hostname_supports_shodan_enrichment(cls, context: Optional[Dict[str, Any]]) -> bool:
        if not isinstance(context, dict):
            return False
        target = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        for candidate in (
            str(target.get("hostname", "") or "").strip(),
            str(target.get("host_ip", "") or "").strip(),
        ):
            hostname = normalize_hostname_alias(candidate)
            if not hostname:
                continue
            if "." not in hostname:
                continue
            if registrable_root_domain(hostname):
                return True
        return False

    @classmethod
    def _context_grayhatwarfare_enabled(cls, context: Optional[Dict[str, Any]]) -> bool:
        if not isinstance(context, dict):
            return False
        target = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        return bool(target.get("grayhatwarfare_enabled", False))

    @classmethod
    def _context_shodan_enabled(cls, context: Optional[Dict[str, Any]]) -> bool:
        if not isinstance(context, dict):
            return False
        target = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        return bool(target.get("shodan_enabled", False))

    @classmethod
    def _context_is_external_scope(cls, context: Optional[Dict[str, Any]]) -> bool:
        if not isinstance(context, dict):
            return False
        target = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        engagement_preset = str(target.get("engagement_preset", "") or "").strip().lower()
        if engagement_preset.startswith("external"):
            return True
        host_ai_state = context.get("host_ai_state", {}) if isinstance(context.get("host_ai_state", {}), dict) else {}
        state_preset = str(host_ai_state.get("engagement_preset", "") or "").strip().lower()
        if state_preset.startswith("external"):
            return True
        summary = context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        focus = summary.get("focus", {}) if isinstance(summary.get("focus", {}), dict) else {}
        summary_preset = str(focus.get("engagement_preset", "") or "").strip().lower()
        if summary_preset.startswith("external"):
            return True
        goal_profile = str(target.get("goal_profile", "") or "").strip().lower()
        if goal_profile.startswith("external"):
            return True
        return False

    @classmethod
    def _context_engagement_preset(cls, context: Optional[Dict[str, Any]]) -> str:
        if not isinstance(context, dict):
            return ""
        target = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        preset = str(target.get("engagement_preset", "") or "").strip().lower()
        if preset:
            return preset
        host_ai_state = context.get("host_ai_state", {}) if isinstance(context.get("host_ai_state", {}), dict) else {}
        preset = str(host_ai_state.get("engagement_preset", "") or "").strip().lower()
        if preset:
            return preset
        summary = context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        focus = summary.get("focus", {}) if isinstance(summary.get("focus", {}), dict) else {}
        return str(focus.get("engagement_preset", "") or "").strip().lower()

    @staticmethod
    def _context_current_phase(context: Optional[Dict[str, Any]]) -> str:
        if not isinstance(context, dict):
            return ""
        summary = context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        focus = summary.get("focus", {}) if isinstance(summary.get("focus", {}), dict) else {}
        current_phase = str(focus.get("current_phase", "") or "").strip().lower()
        if current_phase:
            return current_phase
        ai_state = context.get("host_ai_state", {}) if isinstance(context.get("host_ai_state", {}), dict) else {}
        return str(ai_state.get("next_phase", "") or "").strip().lower()

    @classmethod
    def _expand_tool_id_aliases(cls, values: Set[str]) -> Set[str]:
        expanded = set()
        for item in set(values or set()):
            token = cls._normalized_tool_id(item)
            if not token:
                continue
            expanded.add(token)
            if token in {"whatweb", "whatweb-http", "whatweb-https"}:
                expanded.update({"whatweb", "whatweb-http", "whatweb-https"})
            if token.endswith(".nse"):
                expanded.add("nmap")
        return expanded

    @classmethod
    def _context_audited_tool_availability(cls, context: Optional[Dict[str, Any]]) -> Dict[str, Set[str]]:
        if not isinstance(context, dict):
            return {
                "known": set(),
                "available": set(),
                "unavailable": set(),
            }

        tool_audit = context.get("tool_audit", {}) if isinstance(context.get("tool_audit", {}), dict) else {}
        available = cls._expand_tool_id_aliases(cls._normalize_tool_id_set(tool_audit.get("available_tool_ids", [])))
        unavailable = cls._expand_tool_id_aliases(
            cls._normalize_tool_id_set(tool_audit.get("unavailable_tool_ids", []))
        )
        unavailable.difference_update(available)
        return {
            "known": set(available) | set(unavailable),
            "available": set(available),
            "unavailable": set(unavailable),
        }

    @classmethod
    def _candidate_blocked_by_tool_audit(
        cls,
        *,
        tool_id: str,
        command_template: str,
        context: Optional[Dict[str, Any]],
    ) -> bool:
        availability = cls._context_audited_tool_availability(context)
        known = availability.get("known", set())
        if not known:
            return False

        matched = set()
        tool_norm = cls._normalized_tool_id(tool_id)
        if tool_norm in known:
            matched.add(tool_norm)
        matched.update(cls._command_tool_tokens(command_template) & known)
        if not matched:
            return False

        available = availability.get("available", set())
        return not bool(matched & available)

    @classmethod
    def _context_unavailable_tool_ids(cls, context: Optional[Dict[str, Any]]) -> Set[str]:
        if not isinstance(context, dict):
            return set()
        signals = context.get("signals", {}) if isinstance(context.get("signals", {}), dict) else {}
        raw_missing = cls._normalize_tool_id_set(signals.get("missing_tools", []))
        raw_missing.update(cls._normalize_tool_id_set(signals.get("audited_missing_tools", [])))
        tool_audit = context.get("tool_audit", {}) if isinstance(context.get("tool_audit", {}), dict) else {}
        raw_missing.update(cls._normalize_tool_id_set(tool_audit.get("unavailable_tool_ids", [])))
        return cls._expand_tool_id_aliases(raw_missing)

    @classmethod
    def _context_suppressed_tool_ids(cls, context: Optional[Dict[str, Any]]) -> Set[str]:
        if not isinstance(context, dict):
            return set()
        summary = context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        reflection = (
            summary.get("reflection_posture", {}) if isinstance(summary.get("reflection_posture", {}), dict) else {}
        )
        raw_suppressed = cls._normalize_tool_id_set(reflection.get("suppress_tool_ids", []))
        host_ai_state = context.get("host_ai_state", {}) if isinstance(context.get("host_ai_state", {}), dict) else {}
        host_reflection = (
            host_ai_state.get("reflection", {}) if isinstance(host_ai_state.get("reflection", {}), dict) else {}
        )
        raw_suppressed.update(cls._normalize_tool_id_set(host_reflection.get("suppress_tool_ids", [])))
        return cls._expand_tool_id_aliases(raw_suppressed)

    @staticmethod
    def _command_tool_tokens(command: str) -> Set[str]:
        text = str(command or "").strip()
        if not text:
            return set()
        try:
            tokens = shlex.split(text, posix=True)
        except ValueError:
            tokens = re.findall(r"[A-Za-z0-9_./+-]+", text)

        wrappers = {"sudo", "env", "timeout", "nohup", "stdbuf", "nice"}
        shell_tokens = {"bash", "sh", "zsh", "fish"}
        control_tokens = {"&&", "||", ";", "|", "(", ")", "{", "}"}
        results: Set[str] = set()
        for token in tokens:
            current = str(token or "").strip()
            if not current or current in control_tokens:
                continue
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", current):
                continue
            base = current.rsplit("/", 1)[-1].strip().lower()
            if not base or base in wrappers or base in shell_tokens:
                continue
            if re.fullmatch(r"[a-z0-9][a-z0-9._+-]*", base):
                results.add(base)
        return results

    @staticmethod
    def _tokenize(text: str) -> Set[str]:
        return {match for match in re.findall(r"[a-z0-9]+", str(text or "").lower()) if match}

    @classmethod
    def _is_web_service(cls, service_name: str) -> bool:
        return str(service_name or "").strip().lower() in cls.WEB_SERVICE_IDS

    @staticmethod
    def _normalized_tool_id(tool_id: str) -> str:
        return str(tool_id or "").strip().lower()

    @staticmethod
    def _normalize_text_token(value: Any) -> str:
        return str(value or "").strip().lower()

    @classmethod
    def _normalize_tool_id_set(cls, values) -> Set[str]:
        if values is None:
            return set()
        if isinstance(values, str):
            values = [values]
        normalized = set()
        for item in values:
            token = cls._normalized_tool_id(str(item or ""))
            if token:
                normalized.add(token)
        return normalized

    @classmethod
    def _normalize_text_token_set(cls, values) -> Set[str]:
        if values is None:
            return set()
        if isinstance(values, str):
            values = [values]
        normalized = set()
        for item in values:
            token = cls._normalize_text_token(item)
            if token:
                normalized.add(token)
        return normalized

    @staticmethod
    def _command_signature(protocol_name: str, command_template: str) -> str:
        rendered = str(command_template or "").strip().lower()
        if not rendered:
            rendered = "unknown"
        return build_command_family_id("scheduler-command", str(protocol_name or "tcp"), rendered)

    @classmethod
    def _active_context_signals(cls, context: Optional[Dict[str, Any]]) -> List[str]:
        if not isinstance(context, dict):
            return []
        signals = context.get("signals", {})
        if not isinstance(signals, dict):
            return []
        active = []
        for key, value in signals.items():
            if isinstance(value, bool) and value:
                active.append(str(key))
            elif isinstance(value, (int, float)) and value > 0:
                active.append(f"{key}={value}")
            elif isinstance(value, str) and value.strip():
                active.append(f"{key}={value.strip()}")
            elif isinstance(value, list) and value:
                active.append(f"{key}={len(value)}")
        return active
