"""
Helpers for locating optional security tooling in local-first installs.
"""

from __future__ import annotations

from app.tooling_catalog import ToolSpec, ToolAuditEntry, _tool_specs

import os
import re
import shlex
import shutil
import subprocess
import time
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple

SUPPORTED_TOOL_INSTALL_PLATFORMS = ("kali", "ubuntu")


def _candidate_go_bin_paths(env: Optional[Dict[str, str]] = None) -> List[str]:
    source = env if isinstance(env, dict) else os.environ
    candidates: List[str] = []

    gobin = str(source.get("GOBIN", "") or "").strip()
    if gobin:
        candidates.append(os.path.abspath(os.path.expanduser(gobin)))

    gopath = str(source.get("GOPATH", "") or "").strip()
    if gopath:
        for entry in gopath.split(os.pathsep):
            entry = str(entry or "").strip()
            if entry:
                candidates.append(os.path.abspath(os.path.expanduser(os.path.join(entry, "bin"))))

    home = str(source.get("HOME", "") or "").strip()
    if home:
        candidates.append(os.path.abspath(os.path.expanduser(os.path.join(home, "go", "bin"))))

    default_go_bin = os.path.abspath(os.path.expanduser("~/go/bin"))
    candidates.append(default_go_bin)

    seen = set()
    normalized: List[str] = []
    for candidate in candidates:
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        normalized.append(candidate)
    return normalized


def _candidate_user_bin_paths(env: Optional[Dict[str, str]] = None) -> List[str]:
    source = env if isinstance(env, dict) else os.environ
    candidates: List[str] = []

    home = str(source.get("HOME", "") or "").strip()
    if home:
        candidates.append(os.path.abspath(os.path.expanduser(os.path.join(home, ".local", "bin"))))

    cargo_home = str(source.get("CARGO_HOME", "") or "").strip()
    if cargo_home:
        candidates.append(os.path.abspath(os.path.expanduser(os.path.join(cargo_home, "bin"))))
    elif home:
        candidates.append(os.path.abspath(os.path.expanduser(os.path.join(home, ".cargo", "bin"))))

    pipx_bin_dir = str(source.get("PIPX_BIN_DIR", "") or "").strip()
    if pipx_bin_dir:
        candidates.append(os.path.abspath(os.path.expanduser(pipx_bin_dir)))

    seen = set()
    normalized: List[str] = []
    for candidate in candidates:
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        normalized.append(candidate)
    return normalized


def augment_path_for_legion_tools(path_value: str = "", *, env: Optional[Dict[str, str]] = None) -> str:
    existing_parts = [part for part in str(path_value or "").split(os.pathsep) if str(part or "").strip()]
    seen = set()
    ordered: List[str] = []

    for part in list(_candidate_go_bin_paths(env)) + list(_candidate_user_bin_paths(env)) + existing_parts:
        normalized = os.path.abspath(os.path.expanduser(str(part or "").strip()))
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(normalized)

    return os.pathsep.join(ordered)


def build_tool_execution_env(base_env: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    env = dict(base_env or os.environ)
    env["PATH"] = augment_path_for_legion_tools(env.get("PATH", ""), env=env)
    return env


def normalize_tool_install_platform(platform: str = "") -> str:
    token = str(platform or "").strip().lower()
    if token in SUPPORTED_TOOL_INSTALL_PLATFORMS:
        return token
    return "kali"


def detect_supported_tool_install_platform(
    *,
    os_release_path: str = "/etc/os-release",
    base_env: Optional[Dict[str, str]] = None,
) -> str:
    env = dict(base_env if base_env is not None else os.environ)
    candidates = [
        str(env.get("LEGION_TOOL_AUDIT_PLATFORM", "") or "").strip().lower(),
        str(env.get("ID", "") or "").strip().lower(),
        str(env.get("DISTRO_ID", "") or "").strip().lower(),
    ]
    for candidate in candidates:
        if candidate in SUPPORTED_TOOL_INSTALL_PLATFORMS:
            return candidate

    try:
        with open(os_release_path, "r", encoding="utf-8") as handle:
            content = handle.read()
    except Exception:
        return ""

    id_match = re.search(r"(?im)^ID=(.+)$", content)
    like_match = re.search(r"(?im)^ID_LIKE=(.+)$", content)
    tokens: List[str] = []
    for match in (id_match, like_match):
        if not match:
            continue
        raw = str(match.group(1) or "").strip().strip("\"'")
        tokens.extend(part.strip().lower() for part in raw.split() if part.strip())

    if "kali" in tokens:
        return "kali"
    if "ubuntu" in tokens:
        return "ubuntu"
    return ""


def resolve_tool_install_platform(value: str = "") -> str:
    platform = str(value or "").strip().lower() or detect_supported_tool_install_platform()
    if platform not in SUPPORTED_TOOL_INSTALL_PLATFORMS:
        raise ValueError("Automatic installation supports Kali and Ubuntu only.")
    return platform


def tool_install_hint_for_platform(entry: ToolAuditEntry, platform: str) -> str:
    normalized = normalize_tool_install_platform(platform)
    if normalized == "ubuntu":
        return str(entry.ubuntu_install or "").strip()
    return str(entry.kali_install or "").strip()


def _normalize_install_command(command: str) -> str:
    text = str(command or "").strip()
    if not text:
        return ""
    lowered = text.lower()
    if (
        lowered.startswith("install ")
        or lowered.startswith("use ")
        or lowered.startswith("projectdiscovery ")
        or lowered.startswith("not yet ")
    ):
        return ""

    def _rewrite_apt(match: re.Match) -> str:
        package_expr = str(match.group(1) or "").strip()
        return f"sudo -n apt-get install -y {package_expr}"

    rewritten = re.sub(r"(?i)\bsudo\s+apt\s+install\s+(.+?)(?=(?:\s*\|\||\s*&&|$))", _rewrite_apt, text)
    if rewritten != text:
        return rewritten
    return text


def build_tool_install_plan(
    entries: Sequence[ToolAuditEntry],
    *,
    platform: str = "kali",
    scope: str = "missing",
    tool_keys: Optional[Sequence[str]] = None,
    base_env: Optional[Dict[str, str]] = None,
) -> Dict[str, object]:
    normalized_platform = normalize_tool_install_platform(platform)
    normalized_scope = str(scope or "missing").strip().lower() or "missing"
    selected_keys = {str(item or "").strip().lower() for item in list(tool_keys or []) if str(item or "").strip()}

    rows = list(entries or [])
    if selected_keys:
        rows = [entry for entry in rows if str(entry.key or "").strip().lower() in selected_keys]

    if normalized_scope == "all":
        candidate_rows = [entry for entry in rows if entry.status != "installed"]
    elif normalized_scope == "configured_missing":
        candidate_rows = [entry for entry in rows if entry.status == "configured-missing"]
    else:
        candidate_rows = [entry for entry in rows if entry.status in {"missing", "configured-missing"}]

    commands: List[Dict[str, str]] = []
    manual: List[Dict[str, str]] = []
    seen_commands = set()
    needs_go_bootstrap = False
    needs_cargo_bootstrap = False
    needs_pipx_bootstrap = False
    needs_git_bootstrap = False
    execution_env = build_tool_execution_env(base_env)
    go_path = shutil.which("go", path=execution_env.get("PATH", ""))
    cargo_path = shutil.which("cargo", path=execution_env.get("PATH", ""))
    pipx_path = shutil.which("pipx", path=execution_env.get("PATH", ""))
    git_path = shutil.which("git", path=execution_env.get("PATH", ""))

    for entry in candidate_rows:
        hint = tool_install_hint_for_platform(entry, normalized_platform)
        normalized_command = _normalize_install_command(hint)
        if normalized_command:
            if normalized_command.startswith("go install ") and not go_path:
                needs_go_bootstrap = True
            if re.search(r"(^|\s)cargo\s+install\s+", normalized_command) and not cargo_path:
                needs_cargo_bootstrap = True
            if re.search(r"(^|\s)(?:python3\s+-m\s+pipx|pipx)\s+install\s+", normalized_command) and not pipx_path:
                needs_pipx_bootstrap = True
            if re.search(r"(^|\s)git\s+clone\s+", normalized_command) and not git_path:
                needs_git_bootstrap = True
            if normalized_command in seen_commands:
                continue
            seen_commands.add(normalized_command)
            commands.append(
                {
                    "tool_key": str(entry.key or ""),
                    "label": str(entry.label or entry.key or "tool"),
                    "command": normalized_command,
                    "hint": hint,
                }
            )
            continue
        manual.append(
            {
                "tool_key": str(entry.key or ""),
                "label": str(entry.label or entry.key or "tool"),
                "hint": hint or str(entry.notes or "").strip() or "No curated install hint is available for this tool.",
            }
        )

    bootstrap_commands: List[Dict[str, str]] = []
    if needs_git_bootstrap:
        bootstrap_command = "sudo -n apt-get install -y git"
        if bootstrap_command not in seen_commands:
            seen_commands.add(bootstrap_command)
            bootstrap_commands.append(
                {
                    "tool_key": "git",
                    "label": "Git",
                    "command": bootstrap_command,
                    "hint": "sudo apt install git",
                }
            )
    if needs_go_bootstrap:
        bootstrap_command = "sudo -n apt-get install -y golang-go"
        if bootstrap_command not in seen_commands:
            seen_commands.add(bootstrap_command)
            bootstrap_commands.append(
                {
                    "tool_key": "golang-go",
                    "label": "Go toolchain",
                    "command": bootstrap_command,
                    "hint": "sudo apt install golang-go",
                }
            )
    if needs_cargo_bootstrap:
        bootstrap_command = "sudo -n apt-get install -y cargo"
        if bootstrap_command not in seen_commands:
            seen_commands.add(bootstrap_command)
            bootstrap_commands.append(
                {
                    "tool_key": "cargo",
                    "label": "Rust / Cargo",
                    "command": bootstrap_command,
                    "hint": "sudo apt install cargo",
                }
            )
    if needs_pipx_bootstrap:
        bootstrap_command = "sudo -n apt-get install -y pipx python3-venv"
        if bootstrap_command not in seen_commands:
            seen_commands.add(bootstrap_command)
            bootstrap_commands.append(
                {
                    "tool_key": "pipx",
                    "label": "pipx",
                    "command": bootstrap_command,
                    "hint": "sudo apt install pipx python3-venv",
                }
            )

    if bootstrap_commands:
        commands = bootstrap_commands + commands

    script_lines = [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "",
        "# Generated by Legion Tool Audit",
        f"# Platform: {normalized_platform}",
        f"# Scope: {normalized_scope}",
        "",
    ]
    script_lines.extend(item["command"] for item in commands)
    if manual:
        script_lines.extend(
            [
                "",
                "# Manual follow-up required for:",
            ]
        )
        script_lines.extend(f"# - {item['label']}: {item['hint']}" for item in manual)

    return {
        "platform": normalized_platform,
        "scope": normalized_scope,
        "supported_platforms": list(SUPPORTED_TOOL_INSTALL_PLATFORMS),
        "selected_tool_count": len(candidate_rows),
        "command_count": len(commands),
        "manual_count": len(manual),
        "commands": commands,
        "manual": manual,
        "script": "\n".join(script_lines).strip() + "\n",
    }


def execute_tool_install_plan(
    plan: Dict[str, Any],
    *,
    base_env: Optional[Dict[str, str]] = None,
    is_cancel_requested: Optional[Callable[[], bool]] = None,
) -> Dict[str, Any]:
    resolved_plan = dict(plan or {})
    commands = list(resolved_plan.get("commands", []) or [])
    manual = list(resolved_plan.get("manual", []) or [])
    platform = str(resolved_plan.get("platform", "kali") or "kali")
    scope = str(resolved_plan.get("scope", "missing") or "missing")
    script = str(resolved_plan.get("script", "") or "")
    if not commands:
        return {
            "platform": platform,
            "scope": scope,
            "command_count": 0,
            "manual_count": len(manual),
            "completed_commands": [],
            "manual": manual,
            "script": script,
            "message": "No installable missing tools matched the selected scope.",
        }

    env = build_tool_execution_env(base_env)
    completed_commands: List[Dict[str, Any]] = []
    cancel_check = is_cancel_requested if callable(is_cancel_requested) else None

    for index, item in enumerate(commands, start=1):
        if cancel_check and cancel_check():
            return {
                "platform": platform,
                "scope": scope,
                "command_count": len(commands),
                "manual_count": len(manual),
                "completed_commands": completed_commands,
                "manual": manual,
                "script": script,
                "cancelled": True,
                "message": "Tool installation cancelled before all commands completed.",
            }

        label = str(item.get("label", item.get("tool_key", f"tool-{index}")) or f"tool-{index}")
        command = str(item.get("command", "") or "").strip()
        if not command:
            continue

        process = subprocess.Popen(
            ["bash", "-lc", command],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
        )
        while process.poll() is None:
            if cancel_check and cancel_check():
                try:
                    process.terminate()
                    process.wait(timeout=5)
                except Exception:
                    try:
                        process.kill()
                    except Exception:
                        pass
                return {
                    "platform": platform,
                    "scope": scope,
                    "command_count": len(commands),
                    "manual_count": len(manual),
                    "completed_commands": completed_commands,
                    "manual": manual,
                    "script": script,
                    "cancelled": True,
                    "message": f"Tool installation cancelled while running '{label}'.",
                }
            time.sleep(0.25)

        stdout_text, stderr_text = process.communicate()
        exit_code = int(process.returncode or 0)
        completed_commands.append(
            {
                "index": int(index),
                "label": label,
                "command": command,
                "exit_code": exit_code,
                "stdout_tail": str(stdout_text or "")[-6000:],
                "stderr_tail": str(stderr_text or "")[-6000:],
            }
        )
        if exit_code != 0:
            failure_output = str(stderr_text or stdout_text or "").strip()
            if len(failure_output) > 400:
                failure_output = failure_output[-400:]
            raise RuntimeError(
                f"Tool install failed while running '{label}' (exit {exit_code}). " f"{failure_output or command}"
            )

    return {
        "platform": platform,
        "scope": scope,
        "command_count": len(commands),
        "manual_count": len(manual),
        "completed_commands": completed_commands,
        "manual": manual,
        "script": script,
        "message": (
            f"Completed {len(completed_commands)} install command"
            f"{'' if len(completed_commands) == 1 else 's'}"
            + (
                f"; {len(manual)} tool{'s' if len(manual) != 1 else ''} still require manual follow-up."
                if manual
                else "."
            )
        ),
    }


_SHELL_BUILTINS = {
    "echo",
    "command",
    "bash",
    "sh",
    "python",
    "python3",
    "perl",
    "sudo",
    "env",
    "if",
    "then",
    "else",
    "elif",
    "fi",
    "do",
    "done",
    "[",
    "test",
    "true",
    "false",
}


def _extract_command_v_tools(command_text: str) -> List[str]:
    return list(dict.fromkeys(re.findall(r"(?i)\bcommand\s+-v\s+([A-Za-z0-9_.+-]+)\b", str(command_text or ""))))


def _extract_direct_command_tools(command_text: str) -> List[str]:
    text = str(command_text or "").strip()
    if not text:
        return []
    try:
        tokens = shlex.split(text, posix=True)
    except Exception:
        tokens = text.split()

    boundary_tokens = {"||", "&&", ";", "|"}
    wrapper_tokens = {"sudo", "env"}
    interpreter_tokens = {"bash", "sh", "python", "python3", "perl"}
    results: List[str] = []
    seen = set()
    expecting_command = True

    for raw in tokens:
        token = str(raw or "").strip()
        normalized = token.strip().strip("()")
        lowered = normalized.lower()
        if not normalized:
            continue
        if normalized in boundary_tokens or lowered in {"then", "else", "elif", "do", "fi", "done"}:
            expecting_command = True
            continue
        if not expecting_command:
            continue
        if normalized == "[term]":
            continue
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", normalized):
            continue
        if normalized.startswith("-"):
            continue
        if lowered in wrapper_tokens:
            continue
        if lowered in interpreter_tokens:
            expecting_command = False
            continue
        if lowered in _SHELL_BUILTINS:
            expecting_command = False
            continue
        if normalized.startswith("./") or normalized.startswith("/") or normalized.startswith("["):
            expecting_command = False
            continue
        if lowered not in seen:
            seen.add(lowered)
            results.append(normalized)
        expecting_command = False

    return results


def _iter_configured_command_texts(settings: object) -> Iterable[str]:
    for attr_name, command_index in (
        ("hostActions", 2),
        ("portActions", 2),
        ("portTerminalActions", 2),
    ):
        for row in list(getattr(settings, attr_name, []) or []):
            if isinstance(row, (list, tuple)) and len(row) > command_index:
                value = str(row[command_index] or "").strip()
                if value:
                    yield value


def _build_tool_spec_index() -> Dict[str, ToolSpec]:
    specs = _tool_specs()
    alias_map: Dict[str, ToolSpec] = {}
    for spec in specs:
        alias_map[spec.key] = spec
        for command_name in spec.commands:
            alias_map[str(command_name).strip().lower()] = spec
    return alias_map


def _dynamic_specs_from_settings(settings: Optional[object]) -> List[ToolSpec]:
    if settings is None:
        return []
    index = _build_tool_spec_index()
    dynamic: List[ToolSpec] = []
    seen = set()
    for command_text in _iter_configured_command_texts(settings):
        discovered = list(_extract_command_v_tools(command_text)) + list(_extract_direct_command_tools(command_text))
        for tool_name in discovered:
            key = str(tool_name or "").strip().lower()
            if not key or key in index or key in seen or key in _SHELL_BUILTINS:
                continue
            seen.add(key)
            dynamic.append(
                ToolSpec(
                    key=key,
                    label=tool_name,
                    commands=(tool_name,),
                    category="custom",
                    purpose="Discovered from configured Legion command templates.",
                    notes="No distro-specific install hint has been curated for this tool yet.",
                )
            )
    return dynamic


def list_legion_tool_specs(settings: Optional[object] = None) -> List[ToolSpec]:
    ordered: List[ToolSpec] = []
    seen = set()
    for spec in list(_tool_specs()) + _dynamic_specs_from_settings(settings):
        if spec.key in seen:
            continue
        seen.add(spec.key)
        ordered.append(spec)
    return ordered


def _resolve_configured_path(spec: ToolSpec, settings: Optional[object], env: Dict[str, str]) -> Tuple[str, str]:
    if settings is None or not spec.configured_setting:
        return "", ""
    configured_value = str(getattr(settings, spec.configured_setting, "") or "").strip()
    if not configured_value:
        return "", ""
    expanded = os.path.abspath(os.path.expanduser(configured_value))
    if os.path.isabs(configured_value) or "/" in configured_value:
        if os.path.isfile(expanded):
            return configured_value, expanded
    resolved = shutil.which(configured_value, path=env.get("PATH", ""))
    if resolved:
        return configured_value, os.path.abspath(resolved)
    return configured_value, ""


def _resolve_tool_command(spec: ToolSpec, env: Dict[str, str]) -> Tuple[str, str]:
    for command_name in spec.commands:
        resolved = shutil.which(command_name, path=env.get("PATH", ""))
        if resolved:
            return command_name, os.path.abspath(resolved)
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    for candidate in list(spec.file_candidates or ()):
        raw = str(candidate or "").strip()
        if not raw:
            continue
        resolved = raw
        if not os.path.isabs(resolved):
            resolved = os.path.join(repo_root, resolved)
        resolved = os.path.abspath(os.path.expanduser(resolved))
        if os.path.isfile(resolved):
            return os.path.basename(resolved), resolved
    return "", ""


def audit_legion_tools(
    settings: Optional[object] = None,
    *,
    base_env: Optional[Dict[str, str]] = None,
) -> List[ToolAuditEntry]:
    env = build_tool_execution_env(base_env)
    entries: List[ToolAuditEntry] = []
    for spec in list_legion_tool_specs(settings):
        configured_value, configured_resolved = _resolve_configured_path(spec, settings, env)
        resolved_command = ""
        resolved_path = configured_resolved
        if configured_resolved:
            resolved_command = os.path.basename(configured_resolved)
        else:
            resolved_command, resolved_path = _resolve_tool_command(spec, env)

        status = "installed" if resolved_path else "missing"
        notes = spec.notes
        if configured_value and not configured_resolved:
            status = "configured-missing"
            notes = f"Configured path '{configured_value}' did not resolve." + (f" {notes}" if notes else "")

        entries.append(
            ToolAuditEntry(
                key=spec.key,
                label=spec.label,
                category=spec.category,
                purpose=spec.purpose,
                status=status,
                resolved_path=resolved_path,
                resolved_command=resolved_command,
                configured_value=configured_value,
                kali_install=spec.kali_install,
                ubuntu_install=spec.ubuntu_install,
                notes=notes,
                optional=spec.optional,
            )
        )

    category_order = {
        "core": 0,
        "web": 1,
        "internal": 2,
        "screenshot": 3,
        "relay": 4,
        "credentials": 5,
        "passive": 6,
        "desktop": 7,
        "legacy": 8,
        "planned": 9,
        "custom": 10,
    }
    return sorted(entries, key=lambda row: (category_order.get(row.category, 99), row.label.lower()))


def tool_audit_summary(entries: Sequence[ToolAuditEntry]) -> Dict[str, int]:
    installed = sum(1 for entry in entries if entry.status == "installed")
    configured_missing = sum(1 for entry in entries if entry.status == "configured-missing")
    missing = sum(1 for entry in entries if entry.status == "missing")
    required_missing = sum(1 for entry in entries if not entry.optional and entry.status != "installed")
    return {
        "total": len(entries),
        "installed": installed,
        "configured_missing": configured_missing,
        "missing": missing,
        "required_missing": required_missing,
    }


def format_tool_audit_report(entries: Sequence[ToolAuditEntry]) -> str:
    summary = tool_audit_summary(entries)
    lines = [
        "LEGION tool audit",
        (
            f"Installed: {summary['installed']}/{summary['total']} | "
            f"Missing: {summary['missing']} | "
            f"Configured missing: {summary['configured_missing']} | "
            f"Required missing: {summary['required_missing']}"
        ),
        "",
    ]
    current_category = None
    for entry in entries:
        if entry.category != current_category:
            current_category = entry.category
            lines.append(f"[{current_category}]")
        status = entry.status.upper()
        resolved = entry.resolved_path or entry.configured_value or "-"
        lines.append(f"- {entry.label}: {status} ({resolved})")
        lines.append(f"  Purpose: {entry.purpose}")
        if entry.kali_install:
            lines.append(f"  Kali: {entry.kali_install}")
        if entry.ubuntu_install:
            lines.append(f"  Ubuntu: {entry.ubuntu_install}")
        if entry.notes:
            lines.append(f"  Notes: {entry.notes}")
    return "\n".join(lines).strip() + "\n"
