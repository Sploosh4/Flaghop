"""SchedulerOrchestrator: targeting."""

from __future__ import annotations

import ipaddress
from typing import Any, Dict, Iterable, Optional, Set
from app.hostsfile import registrable_root_domain
from app.settings import AppSettings
from app.scheduler.orchestration.models import ROOT_DOMAIN_SCOPED_TOOL_IDS, SchedulerTarget


class Targeting:
    @staticmethod
    def _candidate_host_root_token(host_ip: Any, hostname: Any) -> str:
        for value in (hostname, host_ip):
            token = str(value or "").strip()
            if not token:
                continue
            lowered = token.lower()
            if lowered in {"unknown", "localhost"}:
                continue
            try:
                ipaddress.ip_address(token)
                continue
            except ValueError:
                pass
            root_domain = registrable_root_domain(token)
            if root_domain:
                return root_domain
        return ""

    @staticmethod
    def _normalize_host_id_set(host_ids: Optional[Iterable[Any]]) -> Set[int]:
        normalized = set()
        for item in list(host_ids or set()):
            try:
                normalized.add(int(item))
            except (TypeError, ValueError):
                continue
        return normalized

    @classmethod
    def _target_host_root_token(cls, target: SchedulerTarget) -> str:
        metadata = getattr(target, "metadata", {}) or {}
        return cls._normalize_text_token(
            metadata.get("host_root_token")
            or cls._candidate_host_root_token(getattr(target, "host_ip", ""), getattr(target, "hostname", ""))
        )

    @classmethod
    def _target_scope_token(cls, target: SchedulerTarget) -> str:
        return cls._normalize_text_token(getattr(target, "hostname", "") or getattr(target, "host_ip", ""))

    @classmethod
    def _is_canonical_root_domain_target(cls, target: SchedulerTarget) -> bool:
        if cls._normalize_text_token(getattr(target, "service_name", "")) != "host":
            return False
        root_token = cls._target_host_root_token(target)
        if not root_token:
            return False
        return cls._target_scope_token(target) == root_token

    @staticmethod
    def _split_scope_csv(raw: Any) -> Set[str]:
        return {str(item or "").strip().lower() for item in str(raw or "").split(",") if str(item or "").strip()}

    @classmethod
    def _tool_service_scope(cls, settings: Any, tool_id: str) -> Set[str]:
        normalized_tool = str(tool_id or "").strip().lower()
        scopes: Set[str] = set()
        for row in list(getattr(settings, "portActions", []) or []):
            if str(row[1] if len(row) > 1 else "").strip().lower() != normalized_tool:
                continue
            scopes.update(cls._split_scope_csv(row[3] if len(row) > 3 else ""))
        for row in list(getattr(settings, "automatedAttacks", []) or []):
            if str(row[0] if len(row) > 0 else "").strip().lower() != normalized_tool:
                continue
            scopes.update(cls._split_scope_csv(row[1] if len(row) > 1 else ""))
        return scopes

    @classmethod
    def _target_tool_validation_error(
        cls,
        *,
        settings: Any,
        target: SchedulerTarget,
        tool_id: str,
        command_template: str,
    ) -> str:
        normalized_tool = str(tool_id or "").strip().lower()
        normalized_service = str(target.service_name or "").strip().rstrip("?").lower()
        if normalized_tool in ROOT_DOMAIN_SCOPED_TOOL_IDS:
            if normalized_service != "host":
                return f"skipped: {normalized_tool or 'tool'} is only valid for host-root targets"
            if not cls._is_canonical_root_domain_target(target):
                return f"skipped: {normalized_tool or 'tool'} is only valid for canonical root-domain targets"
        if normalized_service == "host":
            return "skipped: no local protocol check for a host without a port"
        input_error = AppSettings._scheduler_target_input_error(
            normalized_tool,
            str(command_template or ""),
            port=str(target.port or ""),
        )
        if not isinstance(input_error, str):
            return ""
        return input_error

    @classmethod
    def _normalize_attempt_summary(cls, payload: Any) -> Dict[str, Set[str]]:
        if isinstance(payload, dict):
            return {
                "tool_ids": {
                    cls._normalize_text_token(item)
                    for item in list(payload.get("tool_ids", []) or [])
                    if cls._normalize_text_token(item)
                },
                "family_ids": {
                    cls._normalize_text_token(item)
                    for item in list(payload.get("family_ids", []) or [])
                    if cls._normalize_text_token(item)
                },
                "command_signatures": {
                    cls._normalize_text_token(item)
                    for item in list(payload.get("command_signatures", []) or [])
                    if cls._normalize_text_token(item)
                },
            }
        normalized = {
            cls._normalize_text_token(item) for item in list(payload or set()) if cls._normalize_text_token(item)
        }
        return {
            "tool_ids": normalized,
            "family_ids": set(),
            "command_signatures": set(),
        }
