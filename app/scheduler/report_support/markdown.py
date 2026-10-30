"""Evidence-backed reports: markdown."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Sequence


def _markdown_item_lines(items: Sequence[Dict[str, Any]], *, empty_text: str = "- none") -> List[str]:
    lines: List[str] = []
    for item in list(items or []):
        if not isinstance(item, dict):
            continue
        label = str(item.get("label", "") or item.get("title", "") or item.get("ref", "") or "").strip()
        summary = str(
            item.get("summary", "") or item.get("evidence", "") or item.get("policy_reason", "") or ""
        ).strip()
        if label and summary:
            lines.append(f"- {label}: {summary}")
        elif label:
            lines.append(f"- {label}")
        elif summary:
            lines.append(f"- {summary}")
    return lines or [empty_text]


def render_host_report_markdown(report: Dict[str, Any]) -> str:
    payload = report if isinstance(report, dict) else {}
    host = payload.get("host", {}) if isinstance(payload.get("host", {}), dict) else {}
    policy = (
        payload.get("scope_and_policy", {}).get("engagement_policy", {})
        if isinstance(payload.get("scope_and_policy", {}), dict)
        else {}
    )
    summary_assets = (
        payload.get("summary_of_discovered_assets", {})
        if isinstance(payload.get("summary_of_discovered_assets", {}), dict)
        else {}
    )
    findings = payload.get("validated_findings", {}) if isinstance(payload.get("validated_findings", {}), dict) else {}
    credentials = (
        payload.get("credentials_and_sessions", {})
        if isinstance(payload.get("credentials_and_sessions", {}), dict)
        else {}
    )
    next_steps = (
        payload.get("recommended_next_steps", {}) if isinstance(payload.get("recommended_next_steps", {}), dict) else {}
    )
    methodology = (
        payload.get("methodology_coverage", {}) if isinstance(payload.get("methodology_coverage", {}), dict) else {}
    )

    lines = [
        "# Legion Host Report",
        "",
        f"- Generated: {payload.get('generated_at', '')}",
        f"- Host ID: {host.get('id', '')}",
        f"- Host IP: {host.get('ip', '')}",
        f"- Hostname: {host.get('hostname', '')}",
        f"- Status: {host.get('status', '')}",
        f"- OS: {host.get('os', '')}",
        "",
        "## Scope and Policy",
        "",
        f"- Engagement Preset: {policy.get('preset', '')}",
        f"- Scope: {policy.get('scope', '')}",
        f"- Intent: {policy.get('intent', '')}",
        f"- Approval Mode: {policy.get('approval_mode', '')}",
        f"- Exploitation Allowed: {bool(policy.get('allow_exploitation', False))}",
        f"- Lateral Movement Allowed: {bool(policy.get('allow_lateral_movement', False))}",
        "",
        "## Summary of Discovered Assets",
        "",
        f"- Services: {summary_assets.get('service_count', 0)}",
        f"- URLs: {summary_assets.get('url_count', 0)}",
        f"- Technologies: {summary_assets.get('technology_count', 0)}",
        f"- Findings: {summary_assets.get('finding_count', 0)}",
        f"- Credentials: {summary_assets.get('credential_count', 0)}",
        f"- Sessions: {summary_assets.get('session_count', 0)}",
        "",
        "## Validated Findings",
        "",
    ]
    lines.extend(_markdown_item_lines(findings.get("items", [])))
    lines.extend(
        [
            "",
            "## Attack Paths / Exploitation Chain",
            "",
        ]
    )
    lines.extend(_markdown_item_lines(payload.get("attack_paths", [])))
    lines.extend(
        [
            "",
            "## Credentials / Identities / Sessions",
            "",
            f"- Credentials: {len(credentials.get('credentials', []))}",
            f"- Identities: {len(credentials.get('identities', []))}",
            f"- Sessions: {len(credentials.get('sessions', []))}",
            "",
            "## Evidence References",
            "",
        ]
    )
    lines.extend(_markdown_item_lines(payload.get("evidence_references", [])))
    lines.extend(
        [
            "",
            "## Recommended Next Steps",
            "",
            f"- Next Phase: {next_steps.get('next_phase', '')}",
        ]
    )
    lines.extend(_markdown_item_lines(next_steps.get("coverage_gaps", []), empty_text="- no recorded coverage gaps"))
    lines.extend(_markdown_item_lines(next_steps.get("manual_tests", []), empty_text="- no manual tests queued"))
    lines.extend(
        [
            "",
            "## Skipped or Blocked Actions Due to Policy",
            "",
        ]
    )
    lines.extend(_markdown_item_lines(payload.get("skipped_or_blocked_actions", []), empty_text="- none recorded"))
    lines.extend(
        [
            "",
            "## Methodology Coverage",
            "",
            f"- Last Mode: {methodology.get('last_mode', '')}",
            f"- Next Phase: {methodology.get('next_phase', '')}",
            f"- Attempted Actions: {methodology.get('attempted_action_count', 0)}",
            f"- Strategy Packs Seen: {', '.join(methodology.get('strategy_packs_seen', [])) or 'none'}",
            "",
            "## Provenance Separation",
            "",
            f"- Observed Facts: {len(payload.get('observed_facts', []))}",
            f"- Inferred Relationships: {len(payload.get('inferred_relationships', []))}",
            f"- AI Suggestions: {len(payload.get('ai_suggestions', []))}",
            f"- Operator Conclusions: {len(payload.get('operator_conclusions', []))}",
            "",
        ]
    )
    return "\n".join(lines).strip() + "\n"


def render_project_report_markdown(report: Dict[str, Any]) -> str:
    payload = report if isinstance(report, dict) else {}
    project = payload.get("project", {}) if isinstance(payload.get("project", {}), dict) else {}
    policy = (
        payload.get("scope_and_policy", {}).get("engagement_policy", {})
        if isinstance(payload.get("scope_and_policy", {}), dict)
        else {}
    )
    summary_assets = (
        payload.get("summary_of_discovered_assets", {})
        if isinstance(payload.get("summary_of_discovered_assets", {}), dict)
        else {}
    )
    next_steps = (
        payload.get("recommended_next_steps", {}) if isinstance(payload.get("recommended_next_steps", {}), dict) else {}
    )
    methodology = (
        payload.get("methodology_coverage", {}) if isinstance(payload.get("methodology_coverage", {}), dict) else {}
    )

    lines = [
        "# Legion Project Report",
        "",
        f"- Generated: {payload.get('generated_at', '')}",
        f"- Project: {project.get('name', '')}",
        f"- Temporary: {bool(project.get('is_temporary', False))}",
        f"- Output Folder: {project.get('output_folder', '')}",
        f"- Running Folder: {project.get('running_folder', '')}",
        "",
        "## Scope and Policy",
        "",
        f"- Engagement Preset: {policy.get('preset', '')}",
        f"- Scope: {policy.get('scope', '')}",
        f"- Intent: {policy.get('intent', '')}",
        f"- Approval Mode: {policy.get('approval_mode', '')}",
        f"- Exploitation Allowed: {bool(policy.get('allow_exploitation', False))}",
        f"- Lateral Movement Allowed: {bool(policy.get('allow_lateral_movement', False))}",
        "",
        "## Summary of Discovered Assets",
        "",
        f"- Hosts: {summary_assets.get('host_count', 0)}",
        f"- Services: {summary_assets.get('service_count', 0)}",
        f"- URLs: {summary_assets.get('url_count', 0)}",
        f"- Technologies: {summary_assets.get('technology_count', 0)}",
        f"- Findings: {summary_assets.get('finding_count', 0)}",
        f"- Credentials: {summary_assets.get('credential_count', 0)}",
        f"- Sessions: {summary_assets.get('session_count', 0)}",
        "",
        "## Validated Findings",
        "",
    ]
    lines.extend(_markdown_item_lines(payload.get("validated_findings", {}).get("items", [])))
    lines.extend(
        [
            "",
            "## Attack Paths / Exploitation Chain",
            "",
        ]
    )
    lines.extend(_markdown_item_lines(payload.get("attack_paths", [])))
    lines.extend(
        [
            "",
            "## Credentials / Identities / Sessions",
            "",
            f"- Credentials: {len(payload.get('credentials_and_sessions', {}).get('credentials', []))}",
            f"- Identities: {len(payload.get('credentials_and_sessions', {}).get('identities', []))}",
            f"- Sessions: {len(payload.get('credentials_and_sessions', {}).get('sessions', []))}",
            "",
            "## Evidence References",
            "",
        ]
    )
    lines.extend(_markdown_item_lines(payload.get("evidence_references", [])))
    lines.extend(
        [
            "",
            "## Recommended Next Steps",
            "",
            f"- Next Phases: {', '.join(next_steps.get('next_phases', [])) or 'none'}",
        ]
    )
    lines.extend(_markdown_item_lines(next_steps.get("coverage_gaps", []), empty_text="- no recorded coverage gaps"))
    lines.extend(_markdown_item_lines(next_steps.get("manual_tests", []), empty_text="- no manual tests queued"))
    lines.extend(_markdown_item_lines(next_steps.get("pending_approvals", []), empty_text="- no pending approvals"))
    lines.extend(
        [
            "",
            "## Skipped or Blocked Actions Due to Policy",
            "",
        ]
    )
    lines.extend(_markdown_item_lines(payload.get("skipped_or_blocked_actions", []), empty_text="- none recorded"))
    lines.extend(
        [
            "",
            "## Methodology Coverage",
            "",
            f"- Attempted Actions: {methodology.get('attempted_action_count', 0)}",
            f"- Strategy Packs Seen: {', '.join(methodology.get('strategy_packs_seen', [])) or 'none'}",
            f"- Runner Usage: {json.dumps(methodology.get('runner_usage', {}), sort_keys=True)}",
            "",
            "## Provenance Separation",
            "",
            f"- Observed Facts: {len(payload.get('observed_facts', []))}",
            f"- Inferred Relationships: {len(payload.get('inferred_relationships', []))}",
            f"- AI Suggestions: {len(payload.get('ai_suggestions', []))}",
            f"- Operator Conclusions: {len(payload.get('operator_conclusions', []))}",
            "",
        ]
    )
    return "\n".join(lines).strip() + "\n"
