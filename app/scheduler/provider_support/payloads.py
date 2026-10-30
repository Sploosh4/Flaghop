"""Scheduler AI providers: payloads."""

from __future__ import annotations

import json
import re
import shlex
from typing import Any, Dict, List, Optional

from app.scheduler.provider_support.constants import (
    MAX_PROVIDER_CANDIDATES,
    ProviderError,
    _PROVIDER_IPV4_LIKE_RE,
    _SCHEDULER_PHASES,
)
from app.scheduler.provider_support.models import (
    _unique_strings,
)


def _expand_unavailable_tool_ids(values: Any) -> List[str]:
    expanded = set()
    for item in list(values or []):
        token = _normalize_tool_token(item)
        if not token:
            continue
        expanded.add(token)
        if token in {"whatweb", "whatweb-http", "whatweb-https"}:
            expanded.update({"whatweb", "whatweb-http", "whatweb-https"})
        if token.endswith(".nse"):
            expanded.add("nmap")
    return sorted(expanded)


def _extract_unavailable_tool_ids_from_texts(values: Any) -> List[str]:
    found = set()
    for item in list(values or []):
        text = str(item or "").replace("\r", "\n").strip().lower()
        if not text:
            continue
        patterns = (
            r"(?:^|\n)\s*(?:/bin/sh|bash|zsh|sh|fish):\s*([a-z][a-z0-9._+-]*):\s*(?:command not found|not found)(?:\s|$)",
            r"(?:^|\n)\s*([a-z][a-z0-9._+-]*):\s*(?:command not found|not found)(?:\s|$)",
            r"(?:^|\n)\s*([a-z][a-z0-9._+-]*)\s+command not found(?:\s|$)",
            r"(?:^|\n)\s*([a-z][a-z0-9._+-]*)\s+not found(?:\s|$)",
        )
        for pattern in patterns:
            for match in re.findall(pattern, text):
                token = _normalize_tool_token(match)
                if token:
                    found.add(token)
    return _expand_unavailable_tool_ids(found)


def _collect_unavailable_tool_ids(context: Optional[Dict[str, Any]]) -> List[str]:
    if not isinstance(context, dict):
        return []
    rows: List[str] = []

    signals = context.get("signals", {}) if isinstance(context.get("signals", {}), dict) else {}
    rows.extend(list(signals.get("missing_tools", []) or []))
    rows.extend(list(signals.get("audited_missing_tools", []) or []))

    tool_audit = context.get("tool_audit", {}) if isinstance(context.get("tool_audit", {}), dict) else {}
    rows.extend(list(tool_audit.get("unavailable_tool_ids", []) or []))
    found = set(_expand_unavailable_tool_ids(rows))

    for item in list(context.get("recent_processes", []) or [])[:48]:
        if not isinstance(item, dict):
            continue
        tool_id = _normalize_tool_token(item.get("tool_id", ""))
        tool_tokens = set(_expand_unavailable_tool_ids([tool_id])) if tool_id else set()
        status = str(item.get("status", "") or "").strip().lower()
        output_excerpt = str(item.get("output_excerpt", "") or "").strip().lower()

        if "missing" in status and tool_tokens:
            found.update(tool_tokens)

        text_tokens = set(_extract_unavailable_tool_ids_from_texts([status, output_excerpt]))
        if not text_tokens:
            continue
        if tool_tokens:
            if text_tokens & tool_tokens:
                found.update(tool_tokens)
            continue
        found.update(text_tokens)

    return sorted(found)


def _shell_primary_command_token(command: Any) -> str:
    text = str(command or "").strip()
    if not text:
        return ""
    try:
        tokens = shlex.split(text, posix=True)
    except ValueError:
        tokens = re.findall(r"[A-Za-z0-9_./+-]+", text)
    wrappers = {"sudo", "env", "timeout", "nohup", "stdbuf", "nice"}
    control_tokens = {"&&", "||", ";", "|", "(", ")", "{", "}"}
    for token in tokens:
        current = str(token or "").strip()
        if not current or current in control_tokens:
            continue
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", current):
            continue
        base = current.rsplit("/", 1)[-1].strip().lower()
        if not base or base in wrappers:
            continue
        if re.fullmatch(r"[a-z0-9][a-z0-9._+-]*", base):
            return base
    return ""


def _provider_is_ipv4_like(value: Any) -> bool:
    token = str(value or "").strip()
    if not token or not _PROVIDER_IPV4_LIKE_RE.match(token):
        return False
    try:
        return all(0 <= int(part) <= 255 for part in token.split("."))
    except Exception:
        return False


def _sanitize_provider_technology_version(value: Any) -> str:
    token = str(value or "").strip().strip("[](){};,")
    if not token:
        return ""
    if len(token) > 80:
        token = token[:80]
    lowered = token.lower()
    if lowered in {"unknown", "generic", "none", "n/a", "na", "-", "*"}:
        return ""
    if re.fullmatch(r"0+", lowered):
        return ""
    if re.fullmatch(r"0+[a-z]{1,2}", lowered):
        return ""
    if _provider_is_ipv4_like(token):
        return ""
    if "/" in token and not re.search(r"\d", token):
        return ""
    if not re.search(r"[0-9]", token):
        return ""
    return token


def _normalize_provider_cpe_token(value: Any) -> str:
    token = str(value or "").strip().lower()[:220]
    if not token:
        return ""
    if token.startswith("cpe:/"):
        parts = token.split(":")
        if len(parts) >= 5:
            version = _sanitize_provider_technology_version(parts[4])
            if version:
                parts[4] = version.lower()
                return ":".join(parts)
            return ":".join(parts[:4])
        return token
    if token.startswith("cpe:2.3:"):
        parts = token.split(":")
        if len(parts) >= 6:
            version = _sanitize_provider_technology_version(parts[5])
            if version:
                parts[5] = version.lower()
            else:
                parts[5] = "*"
            return ":".join(parts)
        return token
    return token


def _provider_cpe_base(value: Any) -> str:
    token = _normalize_provider_cpe_token(value)
    if token.startswith("cpe:/"):
        parts = token.split(":")
        return ":".join(parts[:4]) if len(parts) >= 4 else token
    if token.startswith("cpe:2.3:"):
        parts = token.split(":")
        return ":".join(parts[:5]) if len(parts) >= 5 else token
    return token


def _provider_version_from_cpe(value: Any) -> str:
    token = _normalize_provider_cpe_token(value)
    if token.startswith("cpe:/"):
        parts = token.split(":")
        if len(parts) >= 5:
            return _sanitize_provider_technology_version(parts[4])
        return ""
    if token.startswith("cpe:2.3:"):
        parts = token.split(":")
        if len(parts) >= 6:
            return _sanitize_provider_technology_version(parts[5])
        return ""
    return ""


def _sanitize_provider_technology_version_for_tech(
    *,
    name: Any,
    version: Any,
    cpe: Any = "",
    evidence: Any = "",
) -> str:
    cleaned = _sanitize_provider_technology_version(version)
    if not cleaned:
        return ""
    lowered_name = re.sub(r"[^a-z0-9]+", " ", str(name or "").strip().lower()).strip()
    cpe_base = _provider_cpe_base(cpe)
    evidence_text = str(evidence or "").strip().lower()
    major_match = re.match(r"^(\d+)", cleaned)
    major = int(major_match.group(1)) if major_match else None

    if major is not None:
        if lowered_name in {"apache", "apache http server"} or "cpe:/a:apache:http_server" in cpe_base:
            if major > 3:
                return ""
        if lowered_name == "nginx" or "cpe:/a:nginx:nginx" in cpe_base:
            if major > 2:
                return ""
        if lowered_name == "php" or "cpe:/a:php:php" in cpe_base:
            if major < 3:
                return ""

    if re.fullmatch(r"[78]\.\d{2}", cleaned) and any(
        marker in evidence_text for marker in ("nmap", ".nse", "output fingerprint", "service fingerprint")
    ):
        return ""
    return cleaned


def _normalize_next_phase(value: Any, *, current_phase: str = "") -> str:
    phase = str(value or "").strip().lower()[:80]
    current = str(current_phase or "").strip().lower()[:80]
    if not phase:
        return current
    if phase not in _SCHEDULER_PHASES:
        return current
    if current not in _SCHEDULER_PHASES:
        return phase
    current_index = _SCHEDULER_PHASES.index(current)
    phase_index = _SCHEDULER_PHASES.index(phase)
    if phase_index < current_index:
        return current
    if phase_index > current_index + 1:
        return _SCHEDULER_PHASES[min(current_index + 1, len(_SCHEDULER_PHASES) - 1)]
    return phase


def _normalize_tool_token(value: Any) -> str:
    return str(value or "").strip().lower()


def _parse_reflection_payload(
    content: str,
    *,
    unavailable_tool_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    payload_obj = _extract_json(content)
    state = str(payload_obj.get("state", "continue") or "continue").strip().lower()
    if state not in {"continue", "stalled", "complete"}:
        state = "continue"
    priority_shift = str(payload_obj.get("priority_shift", "") or "").strip().lower()
    if priority_shift not in {"coverage_first", "targeted_followup", "manual_validation", "stop"}:
        priority_shift = ""
    promote_tool_ids = _normalize_tool_id_list(payload_obj.get("promote_tool_ids", []), limit=32)
    suppress_tool_ids = _normalize_tool_id_list(payload_obj.get("suppress_tool_ids", []), limit=32)
    manual_tests = _normalize_manual_tests(
        payload_obj.get("manual_tests", []),
        unavailable_tool_ids=unavailable_tool_ids,
    )
    return {
        "state": state,
        "reason": _normalize_prompt_text(str(payload_obj.get("reason", "") or "").strip(), 320),
        "priority_shift": priority_shift,
        "promote_tool_ids": promote_tool_ids,
        "suppress_tool_ids": suppress_tool_ids,
        "manual_tests": manual_tests,
    }


def _parse_web_followup_payload(
    content: str,
    *,
    allowed_tool_ids: Optional[List[str]] = None,
    unavailable_tool_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    payload_obj = _extract_json(content)
    focus = str(payload_obj.get("focus", "") or "").strip().lower()
    if focus not in {
        "coverage_gap",
        "tech_validation",
        "vuln_followup",
        "content_discovery",
        "manual_review",
    }:
        focus = ""
    return {
        "focus": focus,
        "selected_tool_ids": _normalize_tool_id_list(
            payload_obj.get("selected_tool_ids", []),
            limit=6,
            allowed_tool_ids=allowed_tool_ids,
        ),
        "reason": _normalize_prompt_text(str(payload_obj.get("reason", "") or "").strip(), 320),
        "manual_tests": _normalize_manual_tests(
            payload_obj.get("manual_tests", []),
            unavailable_tool_ids=unavailable_tool_ids,
        ),
    }


def _normalize_tool_id_list(values: Any, *, limit: int, allowed_tool_ids: Optional[List[str]] = None) -> List[str]:
    if not isinstance(values, list):
        return []
    allowed_tool_id_map = _normalized_tool_id_map(allowed_tool_ids)
    rows = []
    seen = set()
    for item in values:
        token = str(item or "").strip().lower()
        if not token or token in seen:
            continue
        if allowed_tool_id_map and token not in allowed_tool_id_map:
            continue
        seen.add(token)
        rows.append(str(allowed_tool_id_map.get(token, token))[:120])
        if len(rows) >= int(limit):
            break
    return rows


def _parse_actions_payload(content: str) -> List[Dict[str, Any]]:
    return _parse_provider_payload(content).get("actions", [])


def _parse_provider_payload(
    content: str,
    *,
    allowed_tool_ids: Optional[List[str]] = None,
    unavailable_tool_ids: Optional[List[str]] = None,
    current_phase: str = "",
) -> Dict[str, Any]:
    payload_obj = _extract_json(content)
    actions = payload_obj.get("actions", [])
    if not isinstance(actions, list):
        actions = []

    allowed_tool_id_map = _normalized_tool_id_map(allowed_tool_ids)
    unavailable_tool_id_map = _normalized_tool_id_map(_expand_unavailable_tool_ids(unavailable_tool_ids or []))
    rejected_tool_ids = []
    parsed = []
    for item in actions:
        if not isinstance(item, dict):
            continue
        tool_id = str(item.get("tool_id", "")).strip()
        if not tool_id:
            continue
        normalized_tool_id = tool_id.lower()
        if allowed_tool_id_map and normalized_tool_id not in allowed_tool_id_map:
            rejected_tool_ids.append(tool_id[:120])
            continue
        if unavailable_tool_id_map and normalized_tool_id in unavailable_tool_id_map:
            rejected_tool_ids.append(tool_id[:120])
            continue
        canonical_tool_id = allowed_tool_id_map.get(normalized_tool_id, tool_id)
        score_value = item.get("score", 50)
        try:
            score = float(score_value)
        except (TypeError, ValueError):
            score = 50.0
        rationale = str(item.get("rationale", "")).strip()
        parsed.append(
            {
                "tool_id": canonical_tool_id,
                "score": score,
                "rationale": rationale,
            }
        )

    host_updates = payload_obj.get("host_updates", {})
    if not isinstance(host_updates, dict):
        host_updates = {}

    technologies = _normalize_technologies(host_updates.get("technologies", []))
    if not technologies:
        technologies = _normalize_technologies(payload_obj.get("technologies", []))

    normalized_host_updates = {}
    hostname = str(host_updates.get("hostname", "")).strip()
    if hostname:
        normalized_host_updates["hostname"] = hostname[:160]
    hostname_conf = _safe_float(host_updates.get("hostname_confidence"), minimum=0.0, maximum=100.0, default=0.0)
    if hostname_conf > 0:
        normalized_host_updates["hostname_confidence"] = hostname_conf

    os_value = str(host_updates.get("os", "")).strip()
    if os_value:
        normalized_host_updates["os"] = os_value[:120]
    os_conf = _safe_float(host_updates.get("os_confidence"), minimum=0.0, maximum=100.0, default=0.0)
    if os_conf > 0:
        normalized_host_updates["os_confidence"] = os_conf
    if technologies:
        normalized_host_updates["technologies"] = technologies

    findings = _normalize_findings(payload_obj.get("findings", []))
    manual_tests = _normalize_manual_tests(
        payload_obj.get("manual_tests", []),
        unavailable_tool_ids=unavailable_tool_ids,
    )
    next_phase = _normalize_next_phase(
        payload_obj.get("next_phase", ""),
        current_phase=current_phase,
    )

    return {
        "actions": parsed,
        "host_updates": normalized_host_updates,
        "technologies": technologies,
        "findings": findings,
        "manual_tests": manual_tests,
        "next_phase": next_phase,
        "rejected_action_tool_ids": _unique_strings(rejected_tool_ids),
    }


def _safe_float(value: Any, *, minimum: float, maximum: float, default: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return float(default)
    if parsed < float(minimum):
        return float(minimum)
    if parsed > float(maximum):
        return float(maximum)
    return parsed


def _normalize_technologies(items: Any) -> List[Dict[str, str]]:
    if not isinstance(items, list):
        return []
    rows: List[Dict[str, str]] = []
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()[:120]
        evidence = _normalize_prompt_text(str(item.get("evidence", "")).strip(), 420)
        cpe = _normalize_provider_cpe_token(item.get("cpe", ""))
        version = _sanitize_provider_technology_version_for_tech(
            name=name,
            version=item.get("version", ""),
            cpe=cpe,
            evidence=evidence,
        )
        if not version and cpe:
            cpe_version = _sanitize_provider_technology_version_for_tech(
                name=name,
                version=_provider_version_from_cpe(cpe),
                cpe=cpe,
                evidence=evidence,
            )
            if cpe_version:
                version = cpe_version
            else:
                cpe = _provider_cpe_base(cpe)
        if not name and not cpe:
            continue
        key = "|".join([name.lower(), version.lower(), cpe.lower()])
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "name": name,
                "version": version,
                "cpe": cpe,
                "evidence": evidence,
            }
        )
        if len(rows) >= 120:
            break
    return rows


def _normalize_findings(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    allowed_severity = {"critical", "high", "medium", "low", "info"}
    rows: List[Dict[str, Any]] = []
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()[:220]
        severity = str(item.get("severity", "info")).strip().lower()
        if severity not in allowed_severity:
            severity = "info"
        cve = str(item.get("cve", "")).strip()[:64]
        cvss = _safe_float(item.get("cvss"), minimum=0.0, maximum=10.0, default=0.0)
        evidence = _normalize_prompt_text(str(item.get("evidence", "")).strip(), 520)
        if not title and not cve:
            continue
        key = "|".join([title.lower(), cve.lower(), severity])
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "title": title,
                "severity": severity,
                "cvss": cvss,
                "cve": cve,
                "evidence": evidence,
            }
        )
        if len(rows) >= 200:
            break
    return rows


def _normalize_manual_tests(
    items: Any,
    *,
    unavailable_tool_ids: Optional[List[str]] = None,
) -> List[Dict[str, str]]:
    if not isinstance(items, list):
        return []
    unavailable = set(_expand_unavailable_tool_ids(unavailable_tool_ids or []))
    rows: List[Dict[str, str]] = []
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        why = _normalize_prompt_text(str(item.get("why", "")).strip(), 280)
        command = _normalize_prompt_text(str(item.get("command", "")).strip(), 420)
        scope_note = _normalize_prompt_text(str(item.get("scope_note", "")).strip(), 260)
        if not command and not why:
            continue
        primary_command = _shell_primary_command_token(command)
        if primary_command and primary_command in unavailable:
            continue
        key = command.lower()
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "why": why,
                "command": command,
                "scope_note": scope_note,
            }
        )
        if len(rows) >= 120:
            break
    return rows


def _extract_json(text: str) -> Dict[str, Any]:
    raw = str(text or "").strip()
    if not raw:
        raise ProviderError("Provider response was empty.")

    candidates = [raw]
    fenced = re.findall(r"```(?:json)?\s*(\{.*?\})\s*```", raw, flags=re.DOTALL | re.IGNORECASE)
    candidates.extend(fenced)

    first_brace = raw.find("{")
    last_brace = raw.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidates.append(raw[first_brace : last_brace + 1])

    for candidate in candidates:
        if not _looks_like_complete_json(candidate):
            continue
        try:
            parsed = json.loads(candidate)
        except Exception:
            continue
        if isinstance(parsed, dict):
            return parsed
    raise ProviderError("Provider returned non-JSON payload.")


def _looks_like_complete_json(candidate: str) -> bool:
    raw = str(candidate or "").strip()
    if not raw or raw[0] != "{" or raw[-1] != "}":
        return False

    depth = 0
    in_string = False
    escaped = False
    for char in raw:
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char in "{[":
            depth += 1
        elif char in "}]":
            depth -= 1
            if depth < 0:
                return False
    return depth == 0 and not in_string and not escaped


def _response_is_complete_for_prompt(text: str, prompt_metadata: Optional[Dict[str, Any]] = None) -> bool:
    try:
        payload = _extract_json(text)
    except ProviderError:
        return False
    if not isinstance(payload, dict):
        return False
    metadata = prompt_metadata if isinstance(prompt_metadata, dict) else {}
    prompt_type = str(metadata.get("prompt_type", "") or "").strip().lower()
    required_by_prompt_type = {
        "ranking": {"actions", "host_updates", "findings", "manual_tests", "next_phase"},
        "healthcheck": {"actions"},
        "reflection": {"state", "reason", "priority_shift", "promote_tool_ids", "suppress_tool_ids", "manual_tests"},
        "web_followup": {"focus", "selected_tool_ids", "reason", "manual_tests"},
    }
    required = required_by_prompt_type.get(prompt_type, set())
    if not required:
        return True
    return required.issubset(set(payload.keys()))


def _normalized_tool_id_map(values: Optional[List[str]]) -> Dict[str, str]:
    if not isinstance(values, list):
        return {}
    normalized = {}
    for item in values:
        token = str(item or "").strip()
        key = token.lower()
        if not token or key in normalized:
            continue
        normalized[key] = token[:120]
    return normalized


def _visible_candidate_tool_ids_from_metadata(metadata: Dict[str, Any]) -> List[str]:
    if not isinstance(metadata, dict):
        return []
    values = metadata.get("visible_candidate_tool_ids", [])
    if not isinstance(values, list):
        return []
    return list(_normalized_tool_id_map(values).values())[:MAX_PROVIDER_CANDIDATES]


def _normalize_prompt_text(value: str, max_chars: int) -> str:
    text = str(value or "").replace("\n", " ").replace("\r", " ")
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "...[truncated]"
