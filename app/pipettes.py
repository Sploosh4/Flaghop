from __future__ import annotations

from app.contracts.actions.pipettes import PipetteSpec, _DEFAULT_PARAMETER_VALUE_RE

import json
import os
import re
import shlex
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Sequence

DEFAULT_PIPETTES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, "pipettes"))
_PARAMETER_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{0,63}$")
_PARAMETER_FLAG_RE = re.compile(r"^--[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")


def _normalize_list(values: Any) -> List[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [item.strip() for item in values.split(",")]
    rows: List[str] = []
    seen = set()
    for value in list(values or []):
        token = str(value or "").strip()
        key = token.lower()
        if not token or key in seen:
            continue
        seen.add(key)
        rows.append(token)
    return rows


def _safe_int(value: Any, default: int = 300, minimum: int = 1, maximum: int = 3600) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = int(default)
    return max(int(minimum), min(int(parsed), int(maximum)))


def _normalize_parameters(values: Any) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    seen = set()
    for value in list(values or []):
        if not isinstance(value, dict):
            continue
        name = str(value.get("name", "") or "").strip()
        flag = str(value.get("flag", "") or "").strip()
        if not _PARAMETER_NAME_RE.match(name) or not _PARAMETER_FLAG_RE.match(flag):
            continue
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        pattern = str(value.get("value_pattern", "") or "").strip() or _DEFAULT_PARAMETER_VALUE_RE
        try:
            re.compile(pattern)
        except re.error:
            pattern = _DEFAULT_PARAMETER_VALUE_RE
        rows.append(
            {
                "name": name,
                "label": str(value.get("label", name) or name).strip() or name,
                "description": str(value.get("description", "") or "").strip(),
                "placeholder": str(value.get("placeholder", "") or "").strip(),
                "flag": flag,
                "required": bool(value.get("required", False)),
                "value_pattern": pattern,
            }
        )
    return rows


def _candidate_pipette_roots(extra_roots: Optional[Sequence[Any]] = None) -> List[str]:
    candidates = [DEFAULT_PIPETTES_DIR]
    env_value = str(os.environ.get("LEGION_PIPETTES_PATH", "") or "").strip()
    if env_value:
        candidates.extend(part for part in env_value.split(os.pathsep) if str(part or "").strip())
    candidates.extend(str(item or "") for item in list(extra_roots or []) if str(item or "").strip())

    roots: List[str] = []
    seen = set()
    for candidate in candidates:
        root = os.path.abspath(os.path.expanduser(str(candidate or "").strip()))
        if not root or root in seen or not os.path.isdir(root):
            continue
        seen.add(root)
        roots.append(root)
    return roots


def _load_pipette_manifest(manifest_path: str) -> Optional[PipetteSpec]:
    try:
        with open(manifest_path, "r", encoding="utf-8") as handle:
            manifest = json.load(handle)
    except Exception:
        return None
    if not isinstance(manifest, dict):
        return None

    pipette_id = str(manifest.get("id", "") or "").strip()
    label = str(manifest.get("label", "") or "").strip()
    entrypoint_name = str(manifest.get("entrypoint", "") or "").strip()
    if not pipette_id or not label or not entrypoint_name:
        return None
    entrypoint_parts = entrypoint_name.replace("\\", "/").split("/")
    if os.path.isabs(entrypoint_name) or ".." in entrypoint_parts:
        return None

    source_dir = os.path.abspath(os.path.dirname(manifest_path))
    entrypoint = os.path.abspath(os.path.join(source_dir, entrypoint_name))
    if os.path.commonpath([source_dir, entrypoint]) != source_dir:
        return None
    if not os.path.isfile(entrypoint):
        return None

    return PipetteSpec(
        pipette_id=pipette_id,
        label=label,
        description=str(manifest.get("description", "") or "").strip(),
        entrypoint=entrypoint,
        service_scope=_normalize_list(manifest.get("service_scope", [])),
        protocol_scope=_normalize_list(manifest.get("protocol_scope", ["tcp"])) or ["tcp"],
        target_ports=_normalize_list(manifest.get("target_ports", [])),
        required_tools=_normalize_list(manifest.get("required_tools", [])),
        optional_tools=_normalize_list(manifest.get("optional_tools", [])),
        risk_tags=_normalize_list(manifest.get("risk_tags", [])),
        impact_level=str(manifest.get("impact_level", "low") or "low").strip().lower() or "low",
        noise_level=str(manifest.get("noise_level", "low") or "low").strip().lower() or "low",
        mode=str(manifest.get("mode", "check") or "check").strip().lower() or "check",
        default_timeout=_safe_int(manifest.get("default_timeout", 300), default=300, minimum=1, maximum=7200),
        parameters=_normalize_parameters(manifest.get("parameters", [])),
        source_dir=source_dir,
    )


def list_pipettes(extra_roots: Optional[Sequence[Any]] = None) -> List[PipetteSpec]:
    specs: List[PipetteSpec] = []
    seen = set()
    for root in _candidate_pipette_roots(extra_roots):
        for dirpath, _dirnames, filenames in os.walk(root):
            if "manifest.json" not in filenames:
                continue
            spec = _load_pipette_manifest(os.path.join(dirpath, "manifest.json"))
            if spec is None or spec.tool_id in seen:
                continue
            seen.add(spec.tool_id)
            specs.append(spec)
    return sorted(specs, key=lambda item: item.label.lower())


def find_pipette(tool_id: str, extra_roots: Optional[Sequence[Any]] = None) -> Optional[PipetteSpec]:
    normalized = str(tool_id or "").strip().lower()
    if not normalized:
        return None
    for spec in list_pipettes(extra_roots):
        if spec.tool_id.lower() == normalized:
            return spec
    return None


def is_pipette_tool_id(tool_id: str) -> bool:
    return find_pipette(tool_id) is not None


def pipette_port_actions(extra_roots: Optional[Sequence[Any]] = None) -> List[List[str]]:
    return [spec.as_port_action() for spec in list_pipettes(extra_roots)]
