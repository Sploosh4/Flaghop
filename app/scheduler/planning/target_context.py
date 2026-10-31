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
