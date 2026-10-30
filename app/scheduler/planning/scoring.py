"""SchedulerPlanner: scoring."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Set
from app.scheduler.models import PlanStep
from app.scheduler.policy import EngagementPolicy

logger = logging.getLogger(__name__)
ScheduledAction = PlanStep


class Scoring:
    @classmethod
    def _score_candidate(cls, tool_id: str, label: str, command_template: str, policy: EngagementPolicy) -> float:
        score = 50.0
        text = " ".join([tool_id.lower(), label.lower(), command_template.lower()])
        has_vuln_signal = any(
            token in text
            for token in [
                "script=vuln",
                "--script vuln",
                "vuln.nse",
                " nmap-vuln",
            ]
        )
        has_nuclei_signal = "nuclei" in text
        has_web_content_discovery = any(token in text for token in ["feroxbuster", "gobuster"])
        has_legacy_dirbuster = any(token in text for token in ["dirbuster", "java -xmx256m -jar"])
        has_subdomain_discovery = any(token in text for token in ["subfinder", "subdomain"])
        has_bucket_exposure_search = "grayhatwarfare" in text or "grayhat warfare" in text
        has_cloud_followup = "nuclei-cloud" in text or (
            "nuclei" in text
            and any(token in text for token in ["cloud", "aws", "azure", "gcp", "gcs", "s3", "blob", "storage"])
        )

        if policy.intent == "recon":
            if any(
                token in text
                for token in ["enum", "discover", "info", "list", "scan", "fingerprint", "title", "headers"]
            ):
                score += 20
            if policy.scope == "internal" and any(
                token in text for token in ["smb", "ldap", "rpc", "snmp", "kerberos", "rdp", "winrm"]
            ):
                score += 12
            if policy.scope == "external" and any(
                token in text for token in ["whatweb", "sslscan", "testssl", "http", "https", "web", "screenshot"]
            ):
                score += 14
            if has_subdomain_discovery and policy.scope == "external":
                score += 18
            if has_bucket_exposure_search and policy.scope == "external":
                score += 16
            if has_cloud_followup and policy.scope == "external":
                score += 12
            if has_vuln_signal:
                score += 14
            if has_nuclei_signal:
                score += 8 if policy.scope == "internal" else 12
            if has_web_content_discovery:
                score += 6 if policy.noise_budget == "low" else 10
        else:
            if any(token in text for token in ["whatweb", "sslscan", "testssl", "nikto", "nmap", "validate", "check"]):
                score += 18
            if policy.scope == "external" and any(token in text for token in ["http", "https", "web"]):
                score += 10
            if has_subdomain_discovery and policy.scope == "external":
                score += 12
            if has_bucket_exposure_search and policy.scope == "external":
                score += 12
            if has_cloud_followup and policy.scope == "external":
                score += 10
            if policy.scope == "internal" and any(
                token in text for token in ["smb", "ldap", "rpc", "kerberos", "rdp", "winrm"]
            ):
                score += 10
            if has_vuln_signal:
                score += 22
            if has_nuclei_signal:
                score += 18 if policy.scope == "internal" else 28
            if has_web_content_discovery:
                score += 10 if policy.scope == "external" else 6

        if any(
            token in text
            for token in ["brute", "spray", "relay", "responder", "persistence", "pivot", "lateral", "exploit"]
        ):
            if not policy.allow_exploitation:
                score -= 30
            if policy.credential_attack_mode == "blocked":
                score -= 18
        if any(token in text for token in ["flood", "dos", "masscan"]):
            score -= 28 if policy.detection_risk_mode == "low" else 16
        if policy.noise_budget == "low" and has_web_content_discovery:
            score -= 6
        if policy.scope != "external" and has_subdomain_discovery:
            score -= 26
        if policy.scope != "external" and has_bucket_exposure_search:
            score -= 24
        if policy.scope != "external" and has_cloud_followup:
            score -= 18

        if has_legacy_dirbuster:
            score -= 35
        if policy.preset == "internal_quick_recon":
            if any(token in text for token in cls.INTERNAL_QUICK_RECON_PRIORITY_TOKENS):
                score += 16
            if any(token in text for token in cls.INTERNAL_QUICK_RECON_DEEP_TOOL_TOKENS):
                score -= 18

        return score

    @classmethod
    def _score_with_context(
        cls,
        score: float,
        *,
        tool_id: str,
        family_id: str = "",
        command_signature: str = "",
        label: str,
        command_template: str,
        context: Optional[Dict[str, Any]],
    ) -> float:
        value = float(score)
        if not isinstance(context, dict):
            return max(0.0, min(value, 100.0))

        tool_norm = cls._normalized_tool_id(tool_id)
        attempted = cls._normalize_tool_id_set(context.get("attempted_tool_ids", []))
        attempted_families = cls._normalize_text_token_set(context.get("attempted_family_ids", []))
        attempted_signatures = cls._normalize_text_token_set(context.get("attempted_command_signatures", []))
        signals = context.get("signals", {}) if isinstance(context.get("signals", {}), dict) else {}
        missing_tools = cls._context_unavailable_tool_ids(context)
        command_tools = cls._command_tool_tokens(command_template)
        coverage = context.get("coverage", {}) if isinstance(context.get("coverage", {}), dict) else {}
        coverage_missing = {
            str(item or "").strip().lower()
            for item in (coverage.get("missing", []) if isinstance(coverage.get("missing", []), list) else [])
            if str(item or "").strip()
        }
        coverage_recommended = cls._normalize_tool_id_set(
            coverage.get("recommended_tool_ids", [])
            if isinstance(coverage.get("recommended_tool_ids", []), list)
            else []
        )
        analysis_mode = (
            str(coverage.get("analysis_mode", "") or context.get("analysis_mode", "") or "standard").strip().lower()
        )
        supports_subdomain_discovery = cls._target_hostname_supports_subdomain_discovery(context)
        supports_root_domain_enrichment = cls._target_hostname_supports_root_domain_enrichment(context)
        supports_shodan_enrichment = cls._target_hostname_supports_shodan_enrichment(context)
        grayhat_enabled = cls._context_grayhatwarfare_enabled(context)
        shodan_enabled = cls._context_shodan_enabled(context)

        text = " ".join([str(tool_id or ""), str(label or ""), str(command_template or "")]).lower()
        if tool_norm in attempted:
            value -= 50.0
        if cls._normalize_text_token(family_id) in attempted_families:
            value -= 42.0
        if cls._normalize_text_token(command_signature) in attempted_signatures:
            value -= 58.0
        if tool_norm in missing_tools or bool(command_tools & missing_tools):
            value -= 90.0
        if tool_norm in coverage_recommended:
            value += 22.0
        if "missing_discovery" in coverage_missing and (tool_norm == "nmap" or tool_norm.startswith("nmap")):
            value += 34.0
        if "missing_banner" in coverage_missing and tool_norm == "banner":
            value += 26.0
        if {"missing_screenshot", "missing_remote_screenshot"} & coverage_missing and tool_norm == "screenshooter":
            value += 34.0
        if "missing_nmap_vuln" in coverage_missing and tool_norm == "nmap-vuln.nse":
            value += 40.0
        if "missing_nuclei_auto" in coverage_missing and tool_norm == "nuclei-web":
            value += 40.0
        if "missing_followup_after_vuln" in coverage_missing and tool_norm in {
            "whatweb",
            "whatweb-http",
            "whatweb-https",
            "nikto",
            "web-content-discovery",
            "dirsearch",
            "ffuf",
            "nuclei-cves",
            "nuclei-exposures",
            "curl-headers",
            "curl-options",
            "curl-robots",
        }:
            value += 24.0
        if "missing_http_followup" in coverage_missing and tool_norm in {
            "curl-headers",
            "curl-options",
            "curl-robots",
        }:
            value += 22.0
        if "missing_cpe_cve_enrichment" in coverage_missing and cls._matches_any_token(
            text,
            ("nmap-vuln", "nuclei", "vuln", "cve"),
        ):
            value += 24.0
        if "missing_whatweb" in coverage_missing and cls._matches_any_token(text, ("whatweb",)):
            value += 24.0
        if "missing_nikto" in coverage_missing and cls._matches_any_token(text, ("nikto",)):
            value += 24.0
        if "missing_web_content_discovery" in coverage_missing and cls._matches_any_token(
            text, ("feroxbuster", "gobuster", "web-content-discovery", "dirsearch", "ffuf")
        ):
            value += 24.0
        if "missing_smb_signing_checks" in coverage_missing and cls._matches_any_token(
            text, ("smb-security-mode", "smb2-security-mode")
        ):
            value += 26.0
        if "missing_internal_safe_enum" in coverage_missing and cls._matches_any_token(
            text, ("enum4linux", "smbmap", "rpcclient", "smb-enum-users", "netexec", "nxc")
        ):
            value += 28.0
        if (
            analysis_mode == "dig_deeper"
            and "missing_followup_after_vuln" in coverage_missing
            and cls._matches_any_token(
                text,
                ("nikto", "whatweb", "web-content-discovery", "dirsearch", "ffuf", "sslscan", "testssl", "wafw00f"),
            )
        ):
            value += 18.0
        if analysis_mode == "dig_deeper" and tool_norm in {
            "nuclei-cves",
            "nuclei-exposures",
            "curl-headers",
            "curl-options",
            "curl-robots",
        }:
            value += 16.0
        if tool_norm == "subfinder":
            if supports_subdomain_discovery:
                value += 34.0
            else:
                value -= 82.0
        if tool_norm == "grayhatwarfare":
            if supports_root_domain_enrichment and grayhat_enabled:
                value += 30.0
            else:
                value -= 84.0
        if tool_norm == "shodan-enrichment":
            if supports_shodan_enrichment and shodan_enabled:
                value += 28.0
            else:
                value -= 84.0
        if tool_norm == "nuclei-cloud" and bool(signals.get("web_service")):
            value += 12.0
            if bool(signals.get("cloud_provider_detected")):
                value += 10.0
            if bool(signals.get("cloud_exposure_candidate")):
                value += 18.0
        if tool_norm == "nuclei-aws-storage":
            if bool(signals.get("aws_storage_detected")):
                value += 18.0
                if bool(signals.get("aws_storage_exposure_candidate")):
                    value += 14.0
            else:
                value -= 42.0
        if tool_norm == "nuclei-azure-storage":
            if bool(signals.get("azure_storage_detected")):
                value += 18.0
                if bool(signals.get("azure_storage_exposure_candidate")):
                    value += 14.0
            else:
                value -= 42.0
        if tool_norm == "nuclei-gcp-storage":
            if bool(signals.get("gcp_storage_detected")):
                value += 18.0
                if bool(signals.get("gcp_storage_exposure_candidate")):
                    value += 14.0
            else:
                value -= 42.0
        if tool_norm == "nuclei-aws-rds":
            if bool(signals.get("rds_detected")):
                value += 18.0
                if bool(signals.get("rds_public_access_candidate")):
                    value += 14.0
            else:
                value -= 42.0
        if tool_norm == "nuclei-aws-aurora":
            if bool(signals.get("aurora_detected")):
                value += 18.0
                if bool(signals.get("aurora_public_access_candidate")):
                    value += 14.0
            else:
                value -= 42.0
        if tool_norm == "nuclei-azure-cosmos":
            if bool(signals.get("cosmos_detected")):
                value += 18.0
                if bool(signals.get("cosmos_exposure_candidate")):
                    value += 14.0
            else:
                value -= 42.0
        if tool_norm == "nuclei-gcp-cloudsql":
            if bool(signals.get("cloudsql_detected")):
                value += 18.0
                if bool(signals.get("cloudsql_public_access_candidate")):
                    value += 14.0
            else:
                value -= 42.0
        if tool_norm == "mysql-info.nse":
            if bool(signals.get("mysql_detected")):
                value += 28.0
            else:
                value -= 44.0
        if tool_norm == "pgsql-info.nse":
            if bool(signals.get("postgresql_detected")):
                value += 28.0
            else:
                value -= 44.0
        if tool_norm == "ms-sql-info.nse":
            if bool(signals.get("mssql_detected")):
                value += 28.0
            else:
                value -= 44.0

        if bool(signals.get("web_service")) and any(
            token in text for token in ["http", "https", "web", "nuclei", "waf"]
        ):
            value += 7.0
        if bool(signals.get("rdp_service")) and "screenshooter" in text:
            value += 14.0
        if bool(signals.get("vnc_service")) and "screenshooter" in text:
            value += 14.0
        if (bool(signals.get("rdp_service")) or bool(signals.get("vnc_service"))) and "banner" in text:
            value += 6.0
        if bool(signals.get("tls_detected")) and any(
            token in text for token in ["https", "ssl", "tls", "testssl", "sslscan", "nuclei"]
        ):
            value += 8.0
        if bool(signals.get("directory_listing")) and any(
            token in text for token in ["feroxbuster", "gobuster", "dirsearch", "ffuf", "web-content"]
        ):
            value += 8.0
        if bool(signals.get("smb_signing_disabled")) and any(
            token in text for token in ["smb", "crackmapexec", "enum", "rpc"]
        ):
            value += 10.0
        if bool(signals.get("waf_detected")) and "waf" in text:
            value += 10.0
        if int(signals.get("vuln_hits", 0) or 0) > 0 and any(
            token in text for token in ["vuln", "cve", "nuclei", "exploit"]
        ):
            value += 6.0
        if int(signals.get("vuln_hits", 0) or 0) > 0 and tool_norm in {
            "nmap-vuln.nse",
            "nuclei-cves",
            "nuclei-exposures",
        }:
            value += 18.0
        if cls._matches_any_token(text, ("ubiquiti", "unifi", "ubnt")) and bool(signals.get("ubiquiti_detected")):
            value += 10.0
        if cls._matches_any_token(text, ("nginx", "apache", "http")) and bool(signals.get("web_service")):
            value += 2.0
        if bool(signals.get("wordpress_detected")) and tool_norm in {"wpscan", "nuclei-wordpress"}:
            value += 22.0
        host_cves = context.get("host_cves", []) if isinstance(context.get("host_cves", []), list) else []
        if host_cves and tool_norm in {
            "nmap-vuln.nse",
            "nuclei-cves",
            "nuclei-exposures",
            "whatweb",
            "whatweb-http",
            "whatweb-https",
            "nikto",
            "web-content-discovery",
            "dirsearch",
            "ffuf",
        }:
            value += 18.0

        specialization_delta = cls._specialized_tool_signal_delta(text, signals)
        value += specialization_delta
        if bool(signals.get("web_service")):
            value += cls._generic_context_signal_delta(
                tool_id=str(tool_id or ""),
                label=str(label or ""),
                command_template=str(command_template or ""),
                context=context,
            )

        return max(0.0, min(value, 100.0))

    @staticmethod
    def _has_any_signal(signals: Dict[str, Any], names) -> bool:
        if not isinstance(signals, dict):
            return False
        return any(bool(signals.get(str(name))) for name in list(names or []))

    @classmethod
    def _specialized_tool_signal_delta(cls, tool_text: str, signals: Dict[str, Any]) -> float:
        if not isinstance(signals, dict):
            return 0.0

        delta = 0.0
        for rule in cls.SPECIALIZED_WEB_TOOL_RULES:
            if not cls._matches_any_token(tool_text, rule.get("tokens", ())):
                continue
            if cls._has_any_signal(signals, rule.get("required_signals", ())):
                delta += 12.0
            else:
                delta -= 40.0
        return delta

    @classmethod
    def _generic_context_signal_delta(
        cls,
        *,
        tool_id: str,
        label: str,
        command_template: str,
        context: Optional[Dict[str, Any]],
    ) -> float:
        if not isinstance(context, dict):
            return 0.0
        observed_tokens = cls._observed_context_tokens(context)
        if not observed_tokens:
            return 0.0
        specific_tokens = cls._candidate_specific_tokens(
            tool_id=tool_id,
            label=label,
            command_template=command_template,
        )
        if not specific_tokens:
            return 0.0
        if specific_tokens & observed_tokens:
            return 12.0
        return -28.0

    @classmethod
    def _candidate_specific_tokens(
        cls,
        *,
        tool_id: str,
        label: str,
        command_template: str,
    ) -> Set[str]:
        if cls._normalized_tool_id(tool_id) in {
            "nuclei-cves",
            "nuclei-exposures",
            "curl-headers",
            "curl-options",
            "curl-robots",
        }:
            return set()
        # Include command template to catch specialized scripts referenced in command text.
        source = " ".join(
            [
                str(tool_id or ""),
                str(label or ""),
                str(command_template or ""),
            ]
        ).lower()
        tokens = cls._tokenize(source)
        specific = set()
        for token in tokens:
            if token in cls.GENERIC_WEB_TOOL_TOKENS:
                continue
            if token in cls.IGNORED_CONTEXT_TOKENS:
                continue
            if token.isdigit():
                continue
            if len(token) < 3:
                continue
            specific.add(token)
        return specific

    @classmethod
    def _observed_context_tokens(cls, context: Optional[Dict[str, Any]]) -> Set[str]:
        if not isinstance(context, dict):
            return set()

        observed: Set[str] = set()
        target = context.get("target", {})
        if isinstance(target, dict):
            target_text = " ".join(
                [
                    str(target.get("hostname", "") or ""),
                    str(target.get("os", "") or ""),
                    str(target.get("service", "") or ""),
                    str(target.get("service_product", "") or ""),
                    str(target.get("service_version", "") or ""),
                    str(target.get("service_extrainfo", "") or ""),
                    " ".join(
                        str(item or "") for item in target.get("host_open_services", []) if str(item or "").strip()
                    ),
                    " ".join(str(item or "") for item in target.get("host_open_ports", []) if str(item or "").strip()),
                    " ".join(str(item or "") for item in target.get("host_banners", []) if str(item or "").strip()),
                ]
            ).lower()
            observed.update(cls._tokenize(target_text))

        host_ports = context.get("host_ports", [])
        if isinstance(host_ports, list):
            for item in host_ports[:72]:
                if not isinstance(item, dict):
                    continue
                port_text = " ".join(
                    [
                        str(item.get("service", "") or ""),
                        str(item.get("service_product", "") or ""),
                        str(item.get("service_version", "") or ""),
                        str(item.get("service_extrainfo", "") or ""),
                        str(item.get("banner", "") or ""),
                    ]
                ).lower()
                observed.update(cls._tokenize(port_text))

        inferred_technologies = context.get("inferred_technologies", [])
        if isinstance(inferred_technologies, list):
            for item in inferred_technologies[:64]:
                if not isinstance(item, dict):
                    continue
                observed.update(
                    cls._tokenize(
                        " ".join(
                            [
                                str(item.get("name", "") or ""),
                                str(item.get("version", "") or ""),
                                str(item.get("cpe", "") or ""),
                                str(item.get("evidence", "") or ""),
                            ]
                        )
                    )
                )

        signals = context.get("signals", {})
        if isinstance(signals, dict):
            observed_tech = signals.get("observed_technologies", [])
            if isinstance(observed_tech, list):
                observed.update(cls._tokenize(" ".join(str(item or "") for item in observed_tech)))

            for key, value in signals.items():
                if isinstance(value, bool) and value and str(key).endswith("_detected"):
                    observed.update(cls._tokenize(str(key)[: -len("_detected")]))
                elif isinstance(value, str) and value.strip() and key in {"server", "vendor", "product"}:
                    observed.update(cls._tokenize(value))

        scripts = context.get("scripts", [])
        if isinstance(scripts, list):
            for item in scripts[:48]:
                if isinstance(item, dict):
                    observed.update(cls._tokenize(str(item.get("excerpt", "") or "")))

        processes = context.get("recent_processes", [])
        if isinstance(processes, list):
            for item in processes[:48]:
                if isinstance(item, dict):
                    observed.update(cls._tokenize(str(item.get("output_excerpt", "") or "")))

        host_ai_state = context.get("host_ai_state", {})
        if isinstance(host_ai_state, dict):
            ai_text_parts = []
            for item in list(host_ai_state.get("technologies", []) or [])[:32]:
                if not isinstance(item, dict):
                    continue
                ai_text_parts.append(
                    " ".join(
                        [
                            str(item.get("name", "") or ""),
                            str(item.get("version", "") or ""),
                            str(item.get("cpe", "") or ""),
                            str(item.get("evidence", "") or ""),
                        ]
                    )
                )
            for item in list(host_ai_state.get("findings", []) or [])[:32]:
                if not isinstance(item, dict):
                    continue
                ai_text_parts.append(
                    " ".join(
                        [
                            str(item.get("title", "") or ""),
                            str(item.get("cve", "") or ""),
                            str(item.get("evidence", "") or ""),
                        ]
                    )
                )
            observed.update(cls._tokenize(" ".join(ai_text_parts)))

            host_updates = host_ai_state.get("host_updates", {})
            if isinstance(host_updates, dict):
                observed.update(
                    cls._tokenize(
                        " ".join(
                            [
                                str(host_updates.get("hostname", "") or ""),
                                str(host_updates.get("os", "") or ""),
                            ]
                        )
                    )
                )

            technologies = host_ai_state.get("technologies", [])
            if isinstance(technologies, list):
                for item in technologies[:48]:
                    if not isinstance(item, dict):
                        continue
                    observed.update(
                        cls._tokenize(
                            " ".join(
                                [
                                    str(item.get("name", "") or ""),
                                    str(item.get("version", "") or ""),
                                    str(item.get("cpe", "") or ""),
                                    str(item.get("evidence", "") or ""),
                                ]
                            )
                        )
                    )

            findings = host_ai_state.get("findings", [])
            if isinstance(findings, list):
                for item in findings[:48]:
                    if not isinstance(item, dict):
                        continue
                    observed.update(
                        cls._tokenize(
                            " ".join(
                                [
                                    str(item.get("title", "") or ""),
                                    str(item.get("severity", "") or ""),
                                    str(item.get("cve", "") or ""),
                                    str(item.get("evidence", "") or ""),
                                ]
                            )
                        )
                    )

            manual_tests = host_ai_state.get("manual_tests", [])
            if isinstance(manual_tests, list):
                for item in manual_tests[:24]:
                    if not isinstance(item, dict):
                        continue
                    observed.update(
                        cls._tokenize(
                            " ".join(
                                [
                                    str(item.get("why", "") or ""),
                                    str(item.get("command", "") or ""),
                                    str(item.get("scope_note", "") or ""),
                                ]
                            )
                        )
                    )

        coverage = context.get("coverage", {})
        if isinstance(coverage, dict):
            observed.update(
                cls._tokenize(
                    " ".join(
                        [
                            str(coverage.get("analysis_mode", "") or ""),
                            str(coverage.get("stage", "") or ""),
                        ]
                    )
                )
            )
            missing = coverage.get("missing", [])
            if isinstance(missing, list):
                observed.update(cls._tokenize(" ".join(str(item or "") for item in missing[:24])))
            recommended = coverage.get("recommended_tool_ids", [])
            if isinstance(recommended, list):
                observed.update(cls._tokenize(" ".join(str(item or "") for item in recommended[:32])))

        cleaned = set()
        for token in observed:
            if token in cls.IGNORED_CONTEXT_TOKENS:
                continue
            if token.isdigit():
                continue
            if len(token) < 3:
                continue
            cleaned.add(token)
        return cleaned
