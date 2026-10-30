"""SchedulerPlanner: candidate filtering."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Set
from app.scheduler.models import PlanStep
from app.scheduler.tool_prompt_registry import phase_tags_for_tool

logger = logging.getLogger(__name__)
ScheduledAction = PlanStep


class CandidateFiltering:
    @classmethod
    def _filter_candidates_with_context(
        cls,
        candidates: List[Dict[str, str]],
        context: Optional[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        if not isinstance(context, dict):
            return candidates

        signals = context.get("signals", {})
        if not isinstance(signals, dict):
            return candidates
        missing_tools = cls._context_unavailable_tool_ids(context)
        suppressed_tools = cls._context_suppressed_tool_ids(context)
        coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        baseline_missing = bool(
            coverage_missing
            & {
                "missing_discovery",
                "missing_screenshot",
                "missing_remote_screenshot",
                "missing_nmap_vuln",
                "missing_nuclei_auto",
                "missing_cpe_cve_enrichment",
            }
        )
        observed_tokens = cls._observed_context_tokens(context)
        web_service = bool(signals.get("web_service"))
        supports_subdomain_discovery = cls._target_hostname_supports_subdomain_discovery(context)
        supports_root_domain_enrichment = cls._target_hostname_supports_root_domain_enrichment(context)
        supports_shodan_enrichment = cls._target_hostname_supports_shodan_enrichment(context)
        grayhat_enabled = cls._context_grayhatwarfare_enabled(context)
        shodan_enabled = cls._context_shodan_enabled(context)
        external_scope = cls._context_is_external_scope(context)
        engagement_preset = cls._context_engagement_preset(context)
        recon_preset = engagement_preset.endswith("_recon")
        quick_internal_recon = engagement_preset == "internal_quick_recon"
        current_phase = cls._context_current_phase(context)
        target_dict = context.get("target", {}) if isinstance(context.get("target", {}), dict) else {}
        context_summary = (
            context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        )
        focus_dict = context_summary.get("focus", {}) if isinstance(context_summary.get("focus", {}), dict) else {}
        target_service = str(target_dict.get("service", "") or focus_dict.get("service", "")).strip().lower()

        filtered: List[Dict[str, str]] = []
        for candidate in candidates:
            tool_id = str(candidate.get("tool_id", "") or "")
            label = str(candidate.get("label", "") or "")
            command_template = str(candidate.get("command_template", "") or "")
            candidate_scope = {
                str(item or "").strip().lower()
                for item in str(candidate.get("service_scope", "") or "").split(",")
                if str(item or "").strip()
            }
            action = candidate.get("action")
            risk_tags = {
                str(item or "").strip().lower()
                for item in list(getattr(action, "risk_tags", []) or [])
                if str(item or "").strip()
            }
            tool_text = " ".join(
                [
                    tool_id,
                    label,
                    command_template,
                ]
            ).lower()
            command_tools = cls._command_tool_tokens(command_template)

            blocked = False
            specialized_rule_matched = False
            if cls._candidate_blocked_by_tool_audit(
                tool_id=tool_id,
                command_template=command_template,
                context=context,
            ):
                blocked = True
            normalized_tool_id = cls._normalized_tool_id(tool_id)
            if (
                target_service == "host"
                and "host" not in candidate_scope
                and normalized_tool_id not in cls.HOST_SCOPED_TOOL_IDS
            ):
                blocked = True
            if normalized_tool_id == "subfinder":
                if not external_scope or not supports_subdomain_discovery:
                    blocked = True
                tool_phases = {
                    str(item or "").strip().lower()
                    for item in phase_tags_for_tool(normalized_tool_id)
                    if str(item or "").strip()
                }
                if current_phase and tool_phases and current_phase not in tool_phases:
                    blocked = True
            if normalized_tool_id == "grayhatwarfare":
                if not external_scope or not supports_root_domain_enrichment or not grayhat_enabled:
                    blocked = True
                tool_phases = {
                    str(item or "").strip().lower()
                    for item in phase_tags_for_tool(normalized_tool_id)
                    if str(item or "").strip()
                }
                if current_phase and tool_phases and current_phase not in tool_phases:
                    blocked = True
            if normalized_tool_id == "shodan-enrichment":
                if not external_scope or not supports_shodan_enrichment or not shodan_enabled:
                    blocked = True
                tool_phases = {
                    str(item or "").strip().lower()
                    for item in phase_tags_for_tool(normalized_tool_id)
                    if str(item or "").strip()
                }
                if current_phase and tool_phases and current_phase not in tool_phases:
                    blocked = True
            if (
                normalized_tool_id in missing_tools
                or bool(command_tools & missing_tools)
                or normalized_tool_id in suppressed_tools
            ):
                blocked = True
            if recon_preset:
                if risk_tags & cls.RECON_HARD_BLOCK_RISK_TAGS:
                    blocked = True
                if cls._matches_any_token(tool_text, ("brute", "spray", "hydra", "medusa", "ncrack", "patator")):
                    blocked = True
                if normalized_tool_id == "wpscan":
                    blocked = True
            if quick_internal_recon and cls._matches_any_token(tool_text, cls.INTERNAL_QUICK_RECON_DEEP_TOOL_TOKENS):
                blocked = True
            if cls._covered_web_followup_tool_already_satisfied(
                tool_id=tool_id,
                context=context,
            ):
                blocked = True
            if baseline_missing:
                if cls._matches_any_token(
                    tool_text, ("coldfusion", "vmware", "webdav", "huawei", "drupal", "wordpress", "qnap", "domino")
                ):
                    if cls._normalized_tool_id(tool_id) not in {
                        "nmap-vuln.nse",
                        "nuclei-web",
                        "screenshooter",
                        "whatweb",
                        "whatweb-http",
                        "whatweb-https",
                        "nikto",
                        "web-content-discovery",
                        "dirsearch",
                        "ffuf",
                        "banner",
                        "nmap",
                    }:
                        blocked = True

            for rule in cls.SPECIALIZED_WEB_TOOL_RULES:
                if not cls._matches_any_token(tool_text, rule.get("tokens", ())):
                    continue
                if not cls._has_any_signal(signals, rule.get("required_signals", ())):
                    blocked = True
                    break
                specialized_rule_matched = True

            if not blocked and web_service and observed_tokens and not specialized_rule_matched:
                specific_tokens = cls._candidate_specific_tokens(
                    tool_id=tool_id,
                    label=label,
                    command_template=command_template,
                )
                if "missing_web_content_discovery" in coverage_missing and cls._matches_any_token(
                    tool_text,
                    ("feroxbuster", "gobuster", "web-content-discovery", "dirsearch", "ffuf"),
                ):
                    specific_tokens = set()
                if "missing_internal_safe_enum" in coverage_missing and cls._matches_any_token(
                    tool_text,
                    ("enum4linux", "smbmap", "rpcclient", "smb-enum-users", "netexec", "nxc"),
                ):
                    specific_tokens = set()
                if specific_tokens and not (specific_tokens & observed_tokens):
                    blocked = True

            if not blocked:
                filtered.append(candidate)

        # Keep original candidates if pruning would remove everything.
        return filtered or candidates

    @classmethod
    def _covered_web_followup_tool_already_satisfied(
        cls,
        *,
        tool_id: str,
        context: Optional[Dict[str, Any]],
    ) -> bool:
        if not isinstance(context, dict):
            return False
        tool_norm = cls._normalized_tool_id(tool_id)
        if not tool_norm:
            return False

        coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
        coverage_has = coverage.get("has", {}) if isinstance(coverage.get("has", {}), dict) else {}
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        analysis_mode = (
            str(coverage.get("analysis_mode", "") or context.get("analysis_mode", "") or "standard").strip().lower()
        )
        if analysis_mode == "dig_deeper":
            return False

        summary = context.get("context_summary", {}) if isinstance(context.get("context_summary", {}), dict) else {}
        reflection = (
            summary.get("reflection_posture", {}) if isinstance(summary.get("reflection_posture", {}), dict) else {}
        )
        reflection_promotes = cls._normalize_tool_id_set(reflection.get("promote_tool_ids", []))
        if tool_norm in reflection_promotes:
            return False

        if tool_norm in {"whatweb", "whatweb-http", "whatweb-https"}:
            return bool(coverage_has.get("whatweb")) and not bool(
                coverage_missing & {"missing_whatweb", "missing_technology_fingerprint"}
            )
        if tool_norm == "nikto":
            return bool(coverage_has.get("nikto")) and not bool(
                coverage_missing & {"missing_nikto", "missing_followup_after_vuln"}
            )
        if tool_norm in {"web-content-discovery", "dirsearch", "ffuf", "feroxbuster", "gobuster"}:
            return bool(coverage_has.get("web_content_discovery")) and not bool(
                coverage_missing & {"missing_web_content_discovery", "missing_followup_after_vuln"}
            )
        return False

    @classmethod
    def _tool_matches_coverage_gap(cls, *, tool_id: str, coverage_missing: Set[str]) -> bool:
        tool_norm = cls._normalized_tool_id(tool_id)
        if not tool_norm or not coverage_missing:
            return False
        if "missing_discovery" in coverage_missing and (tool_norm == "nmap" or tool_norm.startswith("nmap")):
            return True
        if "missing_banner" in coverage_missing and tool_norm == "banner":
            return True
        if {"missing_screenshot", "missing_remote_screenshot"} & coverage_missing and tool_norm in {
            "screenshooter",
            "x11screen",
        }:
            return True
        if "missing_nmap_vuln" in coverage_missing and tool_norm == "nmap-vuln.nse":
            return True
        if "missing_nuclei_auto" in coverage_missing and tool_norm == "nuclei-web":
            return True
        if "missing_cpe_cve_enrichment" in coverage_missing and tool_norm in {
            "nmap-vuln.nse",
            "nuclei-web",
            "nuclei-cves",
            "nuclei-exposures",
        }:
            return True
        if "missing_whatweb" in coverage_missing and tool_norm in {"whatweb", "whatweb-http", "whatweb-https"}:
            return True
        if "missing_nikto" in coverage_missing and tool_norm == "nikto":
            return True
        if "missing_web_content_discovery" in coverage_missing and tool_norm in {
            "web-content-discovery",
            "dirsearch",
            "ffuf",
            "feroxbuster",
            "gobuster",
        }:
            return True
        if "missing_http_followup" in coverage_missing and tool_norm in {"curl-headers", "curl-options", "curl-robots"}:
            return True
        if "missing_followup_after_vuln" in coverage_missing and tool_norm in {
            "whatweb",
            "whatweb-http",
            "whatweb-https",
            "nikto",
            "web-content-discovery",
            "dirsearch",
            "ffuf",
            "feroxbuster",
            "gobuster",
            "nuclei-cves",
            "nuclei-exposures",
            "curl-headers",
            "curl-options",
            "curl-robots",
        }:
            return True
        if "missing_smb_signing_checks" in coverage_missing and tool_norm in {
            "smb-security-mode",
            "smb2-security-mode",
        }:
            return True
        if "missing_internal_safe_enum" in coverage_missing and tool_norm in {
            "enum4linux-ng",
            "smbmap",
            "rpcclient-enum",
            "netexec",
            "smb-enum-users.nse",
        }:
            return True
        return False

    @classmethod
    def _strict_coverage_gaps_without_visible_closer(
        cls,
        candidates: List[Dict[str, Any]],
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        if not isinstance(context, dict):
            return False
        coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        strict_missing = coverage_missing & cls.STRICT_COVERAGE_GAP_IDS
        if not strict_missing or (coverage_missing - strict_missing):
            return False
        for candidate in list(candidates or []):
            if not isinstance(candidate, dict):
                continue
            if cls._tool_matches_coverage_gap(
                tool_id=str(candidate.get("tool_id", "") or ""),
                coverage_missing=strict_missing,
            ):
                return False
        return True

    @classmethod
    def _should_abstain_for_unmatched_strict_coverage_gap(
        cls,
        candidates: List[Dict[str, Any]],
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        return cls._strict_coverage_gaps_without_visible_closer(candidates, context=context)

    @classmethod
    def _provider_rankings_skip_visible_gap_closers(
        cls,
        *,
        provider_ranked: List[Dict[str, Any]],
        candidates: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        if not isinstance(context, dict):
            return False
        coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        if not coverage_missing:
            return False
        has_visible_gap_closer = False
        for candidate in list(candidates or []):
            if not isinstance(candidate, dict):
                continue
            if cls._tool_matches_coverage_gap(
                tool_id=str(candidate.get("tool_id", "") or ""),
                coverage_missing=coverage_missing,
            ):
                has_visible_gap_closer = True
                break
        if not has_visible_gap_closer:
            return False

        for item in list(provider_ranked or []):
            if not isinstance(item, dict):
                continue
            if cls._tool_matches_coverage_gap(
                tool_id=str(item.get("tool_id", "") or ""),
                coverage_missing=coverage_missing,
            ):
                return False
        return True
