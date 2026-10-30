import logging
import json
import threading
from typing import Any, Dict, List, Optional, Set

from app.scheduler.family import build_command_family_id
from app.scheduler.models import PlanStep
from app.scheduler.policy_engine import evaluate_policy_for_risk_tags
from app.scheduler.policy import EngagementPolicy, normalize_engagement_policy
from app.scheduler.providers import (
    ProviderError,
    get_last_provider_payload,
    rank_actions_with_provider,
    select_web_followup_with_provider,
)
from app.scheduler.registry import ActionRegistry
from app.scheduler.strategy_packs import evaluate_action_strategy
from app.scheduler.tool_prompt_registry import tool_ids_for_prompt_group

logger = logging.getLogger(__name__)

ScheduledAction = PlanStep


from app.scheduler.planning.scoring import Scoring
from app.scheduler.planning.candidate_filtering import CandidateFiltering
from app.scheduler.planning.target_context import TargetContext
from app.scheduler.planning.web_followup import WebFollowup
from app.scheduler.planning.strategy import Strategy


class SchedulerPlanner(Scoring, CandidateFiltering, TargetContext, WebFollowup, Strategy):
    WEB_SERVICE_IDS = {"http", "https", "ssl", "soap", "http-proxy", "http-alt", "https-alt"}
    HOST_SCOPED_TOOL_IDS = {"subfinder", "chaos", "grayhatwarfare", "shodan-enrichment", "responder", "ntlmrelayx"}
    WEB_AI_BASELINE_TOOL_IDS = tuple(tool_ids_for_prompt_group("web_baseline"))
    WEB_AI_DEEP_WEB_TOOL_IDS = tuple(tool_ids_for_prompt_group("web_deep"))
    WEB_AI_TARGETED_NUCLEI_TOOL_IDS = tuple(tool_ids_for_prompt_group("web_targeted_nuclei"))
    WEB_AI_GENERIC_HTTP_FOLLOWUP_TOOL_IDS = tuple(tool_ids_for_prompt_group("web_http_followup"))
    WEB_AI_SPECIALIST_FOLLOWUP_TOOL_IDS = tuple(tool_ids_for_prompt_group("web_specialist_followup"))
    WEB_AI_SPECIALIST_FOLLOWUP_BONUS = 18.0
    STRICT_COVERAGE_GAP_IDS = {
        "missing_discovery",
        "missing_banner",
        "missing_screenshot",
        "missing_remote_screenshot",
        "missing_nmap_vuln",
        "missing_nuclei_auto",
        "missing_whatweb",
        "missing_nikto",
        "missing_web_content_discovery",
        "missing_http_followup",
        "missing_smb_signing_checks",
        "missing_internal_safe_enum",
    }
    GENERIC_WEB_TOOL_TOKENS = {
        "http",
        "https",
        "ssl",
        "tls",
        "web",
        "proxy",
        "alt",
        "scan",
        "scanner",
        "check",
        "checker",
        "test",
        "testing",
        "enum",
        "enumerate",
        "discovery",
        "discover",
        "fingerprint",
        "banner",
        "title",
        "headers",
        "robots",
        "favicon",
        "version",
        "script",
        "scripts",
        "vuln",
        "vulnerability",
        "cve",
        "path",
        "default",
        "nmap",
        "nse",
        "nuclei",
        "nikto",
        "whatweb",
        "httpx",
        "wafw00f",
        "sslscan",
        "testssl",
        "testssl.sh",
        "feroxbuster",
        "gobuster",
        "dirsearch",
        "ffuf",
        "wordlist",
        "content",
        "port",
        "ports",
        "tcp",
        "udp",
        "open",
        "service",
        "status",
        "run",
        "quick",
        "full",
        "safe",
        "basic",
        "manual",
        "usr",
        "bin",
        "sbin",
        "local",
        "share",
        "opt",
        "etc",
        "tmp",
        "var",
        "dev",
        "home",
        "python",
        "bash",
        "shell",
        "command",
        "echo",
        "cat",
        "grep",
        "awk",
        "sed",
        "txt",
        "json",
        "xml",
        "html",
        "log",
        "out",
        "output",
        "report",
        "silent",
        "color",
        "timeout",
        "threads",
        "thread",
        "rate",
        "verbose",
        "dir",
        "dirs",
        "list",
        "lists",
        "wordlists",
        "dirb",
        "common",
        "url",
        "subfinder",
        "subdomain",
        "subdomains",
        "domain",
        "dns",
        "cloud",
    }
    IGNORED_CONTEXT_TOKENS = {
        "unknown",
        "localhost",
        "local",
        "internal",
        "external",
        "customer",
        "host",
        "target",
        "network",
        "service",
        "device",
        "http",
        "https",
        "ssl",
        "tls",
        "tcp",
        "udp",
    }
    SPECIALIZED_WEB_TOOL_RULES = (
        {
            "tokens": ("wpscan", "wordpress", "wp-"),
            "required_signals": ("wordpress_detected",),
        },
        {
            "tokens": ("nuclei-aws-storage", "aws storage", "amazon s3", "s3"),
            "required_signals": ("aws_storage_detected",),
        },
        {
            "tokens": ("nuclei-azure-storage", "azure storage", "azure blob", "blob"),
            "required_signals": ("azure_storage_detected",),
        },
        {
            "tokens": ("nuclei-gcp-storage", "gcp storage", "google cloud storage", "gcs"),
            "required_signals": ("gcp_storage_detected",),
        },
        {
            "tokens": ("nuclei-aws-rds", "amazon rds", "aws rds", "rds.amazonaws.com"),
            "required_signals": ("rds_detected",),
        },
        {
            "tokens": ("nuclei-aws-aurora", "amazon aurora", "aws aurora", "aurora"),
            "required_signals": ("aurora_detected",),
        },
        {
            "tokens": ("nuclei-azure-cosmos", "azure cosmos", "cosmos db", "documents.azure.com", "cosmosdb"),
            "required_signals": ("cosmos_detected",),
        },
        {
            "tokens": ("nuclei-gcp-cloudsql", "cloud sql", "cloudsql", "google cloud sql"),
            "required_signals": ("cloudsql_detected",),
        },
        {
            "tokens": ("mysql-info.nse", "mysql info", "mariadb"),
            "required_signals": ("mysql_detected",),
        },
        {
            "tokens": ("pgsql-info.nse", "pgsql info", "postgresql"),
            "required_signals": ("postgresql_detected",),
        },
        {
            "tokens": ("ms-sql-info.nse", "mssql", "ms-sql", "sql server"),
            "required_signals": ("mssql_detected",),
        },
        {
            "tokens": ("vmware", "vsphere", "vcenter", "esxi"),
            "required_signals": ("vmware_detected",),
        },
        {
            "tokens": ("coldfusion", "cfusion"),
            "required_signals": ("coldfusion_detected",),
        },
        {
            "tokens": ("webdav",),
            "required_signals": ("webdav_detected", "iis_detected"),
        },
        {
            "tokens": ("http-iis", "microsoft-iis", "iis-"),
            "required_signals": ("iis_detected",),
        },
        {
            "tokens": ("huawei", "hg5x"),
            "required_signals": ("huawei_detected",),
        },
    )
    RECON_HARD_BLOCK_RISK_TAGS = {
        "credential_bruteforce",
        "password_spray",
        "account_lockout_risk",
        "credential_capture_side_effect",
        "exploit_execution",
        "lateral_movement",
        "destructive_write",
        "persistence_action",
        "data_exfiltration_risk",
    }
    INTERNAL_QUICK_RECON_PRIORITY_TOKENS = (
        "smb",
        "netbios",
        "microsoft-ds",
        "rpc",
        "rpcbind",
        "nfs",
        "showmount",
        "nbtscan",
        "ipp",
        "printer",
        "jetdirect",
        "9100",
        "631",
        "515",
        "banner",
        "screenshooter",
        "whatweb",
        "http-title",
        "curl-headers",
        "admin",
        "login",
        "auth",
        "portal",
    )
    INTERNAL_QUICK_RECON_DEEP_TOOL_TOKENS = (
        "dirsearch",
        "ffuf",
        "katana",
        "web-content-discovery",
        "nikto",
        "nuclei-cves",
        "nuclei-exposures",
        "wpscan",
        "nuclei-wordpress",
    )

    def __init__(self, config_manager):
        self.config_manager = config_manager
        self._thread_state = threading.local()

    def _set_last_provider_payload(self, payload: Optional[Dict[str, Any]] = None):
        try:
            self._thread_state.last_provider_payload = dict(payload or {})
        except Exception:
            self._thread_state.last_provider_payload = {}

    def get_last_provider_payload(self, clear: bool = False) -> Dict[str, Any]:
        payload = getattr(self._thread_state, "last_provider_payload", {}) or {}
        result = dict(payload) if isinstance(payload, dict) else {}
        if clear:
            self._set_last_provider_payload({})
        return result

    def plan_actions(
        self,
        service: str,
        protocol: str,
        settings,
        *,
        context: Optional[Dict[str, Any]] = None,
        excluded_tool_ids: Optional[List[str]] = None,
        excluded_family_ids: Optional[List[str]] = None,
        excluded_command_signatures: Optional[List[str]] = None,
        limit: Optional[int] = None,
        engagement_policy: Optional[Dict[str, Any]] = None,
        mode_override: Optional[str] = None,
    ) -> List[PlanStep]:
        return self.plan_steps(
            service,
            protocol,
            settings,
            context=context,
            excluded_tool_ids=excluded_tool_ids,
            excluded_family_ids=excluded_family_ids,
            excluded_command_signatures=excluded_command_signatures,
            limit=limit,
            engagement_policy=engagement_policy,
            mode_override=mode_override,
        )

    def plan_steps(
        self,
        service: str,
        protocol: str,
        settings,
        *,
        context: Optional[Dict[str, Any]] = None,
        excluded_tool_ids: Optional[List[str]] = None,
        excluded_family_ids: Optional[List[str]] = None,
        excluded_command_signatures: Optional[List[str]] = None,
        limit: Optional[int] = None,
        engagement_policy: Optional[Dict[str, Any]] = None,
        mode_override: Optional[str] = None,
    ) -> List[PlanStep]:
        self._set_last_provider_payload({})
        prefs = self.config_manager.load()
        mode = str(mode_override or prefs.get("mode", "deterministic") or "deterministic").strip().lower()
        if mode not in {"deterministic", "ai"}:
            mode = "deterministic"
        policy = normalize_engagement_policy(
            engagement_policy or prefs.get("engagement_policy", {}),
            fallback_goal_profile=str(
                prefs.get("goal_profile", "internal_asset_discovery") or "internal_asset_discovery"
            ),
        )
        dangerous_categories = self.config_manager.get_dangerous_categories()
        excluded = self._normalize_tool_id_set(excluded_tool_ids)
        excluded.update(self._normalize_tool_id_set(prefs.get("disabled_tool_ids", [])))
        excluded_families = self._normalize_text_token_set(excluded_family_ids)
        excluded_signatures = self._normalize_text_token_set(excluded_command_signatures)
        registry = self.build_action_registry(settings, dangerous_categories)

        if mode == "ai":
            actions = self._plan_ai(
                service,
                protocol,
                registry,
                policy,
                dangerous_categories,
                context=context,
                excluded_tool_ids=excluded,
                excluded_family_ids=excluded_families,
                excluded_command_signatures=excluded_signatures,
                limit=limit,
            )
            if actions:
                return actions
            # deterministic fallback when AI path cannot produce candidates.
            mode = "deterministic"

        return self._plan_deterministic(
            service,
            protocol,
            registry,
            policy,
            dangerous_categories,
            mode=mode,
            context=context,
            excluded_tool_ids=excluded,
            excluded_family_ids=excluded_families,
            excluded_command_signatures=excluded_signatures,
            limit=limit,
        )

    @staticmethod
    def build_action_registry(settings, dangerous_categories: Optional[List[str]] = None) -> ActionRegistry:
        return ActionRegistry.from_settings(settings, dangerous_categories=dangerous_categories)

    @classmethod
    def _blocked_by_internal_quick_recon(
        cls,
        *,
        tool_id: str,
        label: str,
        command_template: str,
        policy: EngagementPolicy,
    ) -> bool:
        if str(policy.preset or "").strip().lower() != "internal_quick_recon":
            return False
        text = " ".join([str(tool_id or ""), str(label or ""), str(command_template or "")]).lower()
        return cls._matches_any_token(text, cls.INTERNAL_QUICK_RECON_DEEP_TOOL_TOKENS)

    def _plan_deterministic(
        self,
        service: str,
        protocol: str,
        registry: ActionRegistry,
        policy: EngagementPolicy,
        dangerous_categories: List[str],
        mode: str = "deterministic",
        context: Optional[Dict[str, Any]] = None,
        excluded_tool_ids: Optional[Set[str]] = None,
        excluded_family_ids: Optional[Set[str]] = None,
        excluded_command_signatures: Optional[Set[str]] = None,
        limit: Optional[int] = None,
    ) -> List[PlanStep]:
        service_name = str(service or "").strip().rstrip("?")
        protocol_name = str(protocol or "tcp").strip().lower()
        decisions = []
        excluded = set(excluded_tool_ids or set())
        excluded_families = set(excluded_family_ids or set())
        excluded_signatures = set(excluded_command_signatures or set())
        policy_snapshot_hash = self._policy_snapshot_hash(policy, dangerous_categories)
        target_ref = self._build_target_ref(service_name, protocol_name, policy=policy, context=context)
        selected_packs = self._select_strategy_packs(
            service_name,
            protocol_name,
            policy,
            context=context,
        )
        ranked_steps = []

        for index, action in enumerate(registry.for_deterministic(service_name, protocol_name)):
            tool_id = str(action.tool_id)
            normalized_tool_id = self._normalized_tool_id(tool_id)
            action_scope = {
                str(item or "").strip().lower()
                for item in list(getattr(action, "service_scope", []) or [])
                if str(item or "").strip()
            }
            if (
                service_name.lower() == "host"
                and "host" not in action_scope
                and normalized_tool_id not in self.HOST_SCOPED_TOOL_IDS
            ):
                continue
            if self._blocked_by_internal_quick_recon(
                tool_id=tool_id,
                label=str(action.label or ""),
                command_template=str(action.command_template or ""),
                policy=policy,
            ):
                continue
            family_id = build_command_family_id(tool_id, protocol_name, action.command_template or tool_id)
            command_signature = self._command_signature(protocol_name, action.command_template or tool_id)
            if (
                normalized_tool_id in excluded
                or self._normalize_text_token(family_id) in excluded_families
                or self._normalize_text_token(command_signature) in excluded_signatures
            ):
                continue
            if self._candidate_blocked_by_tool_audit(
                tool_id=tool_id,
                command_template=str(action.command_template or ""),
                context=context,
            ):
                continue
            strategy_guidance = evaluate_action_strategy(
                action,
                selected_packs,
                policy,
                context=context,
            )
            step = PlanStep.from_action_spec(
                action,
                origin_mode=mode,
                origin_planner="scheduler_deterministic",
                engagement_preset=policy.preset,
                policy_snapshot_hash=policy_snapshot_hash,
                target_ref=target_ref,
                parameters={"protocol": protocol_name},
                rationale=self._build_deterministic_rationale(
                    action,
                    selected_packs,
                    strategy_guidance,
                ),
                success_criteria=["Action completed without execution errors."],
                selection_score=1.0 + float(strategy_guidance.bonus or 0.0),
                family_id=family_id,
                risk_tags=list(action.risk_tags),
                pack_ids=list(strategy_guidance.pack_ids),
                coverage_gap=str(strategy_guidance.coverage_gap or ""),
                coverage_notes=str(strategy_guidance.coverage_notes or ""),
                evidence_expectations=list(strategy_guidance.evidence_expectations),
            )
            self._apply_policy_decision(step, policy)
            ranked_steps.append((index, step))
        if self._context_has_strategy_signals(context):
            ranked_steps.sort(key=lambda item: (-float(item[1].score), int(item[0])))
        decisions = [item[1] for item in ranked_steps]
        if limit is not None:
            try:
                max_items = int(limit)
            except (TypeError, ValueError):
                max_items = 0
            if max_items > 0:
                return decisions[:max_items]
        return decisions

    def _plan_ai(
        self,
        service: str,
        protocol: str,
        registry: ActionRegistry,
        policy: EngagementPolicy,
        dangerous_categories: List[str],
        context: Optional[Dict[str, Any]] = None,
        excluded_tool_ids: Optional[Set[str]] = None,
        excluded_family_ids: Optional[Set[str]] = None,
        excluded_command_signatures: Optional[Set[str]] = None,
        limit: Optional[int] = None,
    ) -> List[PlanStep]:
        service_name = str(service or "").strip().rstrip("?")
        protocol_name = str(protocol or "tcp").strip().lower()
        candidates_by_tool = {}
        excluded = set(excluded_tool_ids or set())
        excluded_families = set(excluded_family_ids or set())
        excluded_signatures = set(excluded_command_signatures or set())
        policy_snapshot_hash = self._policy_snapshot_hash(policy, dangerous_categories)
        target_ref = self._build_target_ref(service_name, protocol_name, policy=policy, context=context)
        selected_packs = self._select_strategy_packs(
            service_name,
            protocol_name,
            policy,
            context=context,
        )

        for action in registry.for_ai_selection(service_name, protocol_name):
            label = str(action.label)
            tool_id = str(action.tool_id)
            normalized_tool_id = self._normalized_tool_id(tool_id)
            action_scope = {
                str(item or "").strip().lower()
                for item in list(getattr(action, "service_scope", []) or [])
                if str(item or "").strip()
            }
            if (
                service_name.lower() == "host"
                and "host" not in action_scope
                and normalized_tool_id not in self.HOST_SCOPED_TOOL_IDS
            ):
                continue
            if self._blocked_by_internal_quick_recon(
                tool_id=tool_id,
                label=label,
                command_template=str(action.command_template or ""),
                policy=policy,
            ):
                continue
            family_id = build_command_family_id(tool_id, protocol_name, action.command_template or tool_id)
            command_signature = self._command_signature(protocol_name, action.command_template or tool_id)
            if (
                normalized_tool_id in excluded
                or self._normalize_text_token(family_id) in excluded_families
                or self._normalize_text_token(command_signature) in excluded_signatures
            ):
                continue

            candidates_by_tool[tool_id] = {
                "action": action,
                "tool_id": tool_id,
                "label": label,
                "command_template": str(action.command_template),
                "service_scope": ",".join(action.service_scope),
                "family_id": family_id,
                "command_signature": command_signature,
            }

        candidates = list(candidates_by_tool.values())
        candidates = self._filter_candidates_with_context(candidates, context)

        if not candidates:
            return []

        config = self.config_manager.load()
        feature_flags = config.get("feature_flags", {}) if isinstance(config, dict) else {}
        provider_name = str(config.get("provider", "none") or "none").strip().lower()
        provider_cfg = (
            config.get("providers", {}).get(provider_name, {}) if isinstance(config.get("providers", {}), dict) else {}
        )
        provider_enabled = bool(provider_cfg.get("enabled", False)) if isinstance(provider_cfg, dict) else False
        if provider_enabled and self._should_abstain_for_unmatched_strict_coverage_gap(candidates, context=context):
            return []

        scores_by_tool = {}
        rationales_by_tool = {}
        web_followup_sidecar_enabled = (
            bool(feature_flags.get("scheduler_web_followup_sidecar", False))
            if isinstance(feature_flags, dict)
            else False
        )
        provider_error = ""
        provider_payload = {}
        specialist_selected_tool_ids = set()
        specialist_reason_by_tool = {}
        try:
            provider_ranked = rank_actions_with_provider(
                config=config,
                goal_profile=policy.legacy_goal_profile,
                engagement_preset=policy.preset,
                service=service_name,
                protocol=protocol_name,
                candidates=candidates,
                context=context or {},
            )
            provider_payload = get_last_provider_payload(clear=True)
            self._set_last_provider_payload(provider_payload)
        except ProviderError as exc:
            provider_error = str(exc)
            logger.warning(
                "AI scheduler provider failed for %s/%s using provider=%s: %s",
                service_name,
                protocol_name,
                provider_name,
                provider_error,
            )
            provider_payload = get_last_provider_payload(clear=True)
            self._set_last_provider_payload(provider_payload)
            provider_ranked = []

        for item in provider_ranked:
            tool_id = str(item.get("tool_id", "")).strip()
            if not tool_id:
                continue
            try:
                score = float(item.get("score", 50))
            except (TypeError, ValueError):
                score = 50.0
            scores_by_tool[tool_id] = score
            rationales_by_tool[tool_id] = str(item.get("rationale", "")).strip()

        if provider_ranked and self._provider_rankings_skip_visible_gap_closers(
            provider_ranked=provider_ranked,
            candidates=candidates,
            context=context,
        ):
            scores_by_tool = {}
            rationales_by_tool = {}

        if (
            provider_enabled
            and not provider_error
            and bool(web_followup_sidecar_enabled)
            and self._should_run_web_followup_sidecar(service_name, context=context)
        ):
            specialist_candidates = self._web_followup_sidecar_candidates(candidates, context=context)
            if specialist_candidates:
                try:
                    sidecar_payload = select_web_followup_with_provider(
                        config=config,
                        goal_profile=policy.legacy_goal_profile,
                        engagement_preset=policy.preset,
                        service=service_name,
                        protocol=protocol_name,
                        candidates=specialist_candidates,
                        context=context or {},
                    )
                    allowed_sidecar_tool_ids = {
                        self._normalized_tool_id(item.get("tool_id", ""))
                        for item in specialist_candidates
                        if str(item.get("tool_id", "")).strip()
                    }
                    normalized_sidecar_tool_ids = [
                        tool_id
                        for tool_id in self._normalize_tool_id_set(sidecar_payload.get("selected_tool_ids", []))
                        if tool_id in allowed_sidecar_tool_ids
                    ]
                    sidecar_payload["selected_tool_ids"] = normalized_sidecar_tool_ids
                    specialist_selected_tool_ids = set(normalized_sidecar_tool_ids)
                    sidecar_reason = str(sidecar_payload.get("reason", "") or "").strip()
                    if sidecar_reason:
                        for tool_id in specialist_selected_tool_ids:
                            specialist_reason_by_tool[tool_id] = sidecar_reason
                    provider_payload = self._merge_specialist_sidecar_payload(provider_payload, sidecar_payload)
                    self._set_last_provider_payload(provider_payload)
                except ProviderError as exc:
                    logger.warning(
                        "AI web follow-up sidecar failed for %s/%s using provider=%s: %s",
                        service_name,
                        protocol_name,
                        provider_name,
                        exc,
                    )

        decisions = []
        for candidate in candidates:
            action = candidate["action"]
            tool_id = candidate["tool_id"]
            label = candidate["label"]
            command_template = candidate["command_template"]
            family_id = str(
                candidate.get("family_id", "") or build_command_family_id(tool_id, protocol_name, command_template)
            )
            command_signature = str(
                candidate.get("command_signature", "") or self._command_signature(protocol_name, command_template)
            )
            unavailable_tools = self._context_unavailable_tool_ids(context)
            tool_unavailable = self._normalized_tool_id(tool_id) in unavailable_tools or bool(
                self._command_tool_tokens(command_template) & unavailable_tools
            )

            score = scores_by_tool.get(tool_id)
            provider_supplied_score = score is not None
            if score is None:
                score = self._score_candidate(tool_id, label, command_template, policy)
            score = self._score_with_context(
                score,
                tool_id=tool_id,
                family_id=family_id,
                command_signature=command_signature,
                label=label,
                command_template=command_template,
                context=context,
            )
            strategy_guidance = evaluate_action_strategy(
                action,
                selected_packs,
                policy,
                context=context,
            )
            if not provider_supplied_score:
                score = float(score) + float(strategy_guidance.bonus or 0.0)
            if self._is_web_service(service_name) and not tool_unavailable:
                if tool_id == "nuclei-web":
                    score = max(score, 96.0)
                elif tool_id == "nmap-vuln.nse":
                    score = max(score, 94.0)
                elif tool_id == "screenshooter":
                    score = max(score, 92.0)
                elif tool_id == "nuclei-cves":
                    score = max(score, 90.0)
                elif tool_id == "nuclei-exposures":
                    score = max(score, 88.0)
                elif tool_id in {"whatweb", "whatweb-http", "whatweb-https"}:
                    score = max(score, 84.0)
                elif tool_id == "nikto":
                    score = max(score, 82.0)
            if self._normalized_tool_id(tool_id) in specialist_selected_tool_ids:
                score = min(100.0, max(float(score) + float(self.WEB_AI_SPECIALIST_FOLLOWUP_BONUS), 86.0))
            rationale = rationales_by_tool.get(tool_id) or self._build_rationale(
                tool_id,
                policy,
                list(action.risk_tags),
                provider_name=provider_name if provider_enabled else "",
                provider_error=provider_error,
                provider_returned_rankings=bool(provider_ranked),
                context_signals=self._active_context_signals(context),
            )
            rationale = self._append_strategy_context(rationale, strategy_guidance)
            rationale = self._append_specialist_sidecar_context(
                rationale,
                tool_id=tool_id,
                specialist_reason=specialist_reason_by_tool.get(self._normalized_tool_id(tool_id), ""),
            )

            step = PlanStep.from_action_spec(
                action,
                origin_mode="ai",
                origin_planner="scheduler_ai",
                engagement_preset=policy.preset,
                policy_snapshot_hash=policy_snapshot_hash,
                target_ref=target_ref,
                parameters={"protocol": protocol_name},
                rationale=rationale,
                success_criteria=["Action completed without execution errors."],
                selection_score=score,
                family_id=family_id,
                risk_tags=list(action.risk_tags),
                pack_ids=list(strategy_guidance.pack_ids),
                coverage_gap=str(strategy_guidance.coverage_gap or ""),
                coverage_notes=str(strategy_guidance.coverage_notes or ""),
                evidence_expectations=list(strategy_guidance.evidence_expectations),
            )
            self._apply_policy_decision(step, policy)
            decisions.append(step)

        decisions.sort(key=lambda item: item.score, reverse=True)
        resolved_limit = self._default_ai_limit(service_name, context=context)
        if limit is not None:
            try:
                max_items = int(limit)
            except (TypeError, ValueError):
                max_items = 0
            if max_items > 0:
                resolved_limit = max_items
        return self._apply_web_ai_baseline(service_name, decisions, context=context, limit=resolved_limit)

    @staticmethod
    def _parse_services(raw: str) -> List[str]:
        cleaned = raw.strip().strip('"')
        if not cleaned:
            return []
        return [item.strip().strip('"') for item in cleaned.split(",") if item.strip()]

    @staticmethod
    def _port_actions_by_id(port_actions: List[List[str]]) -> Dict[str, Dict[str, str]]:
        result = {}
        for action in port_actions:
            action_id = str(action[1])
            result[action_id] = {
                "label": str(action[0]),
                "command": str(action[2]),
                "services": str(action[3] if len(action) > 3 else ""),
            }
        return result

    @staticmethod
    def _policy_snapshot_hash(policy: EngagementPolicy, dangerous_categories: List[str]) -> str:
        payload = {
            "engagement_policy": policy.to_dict(),
            "dangerous_categories": sorted(
                str(item or "") for item in list(dangerous_categories or []) if str(item or "").strip()
            ),
        }
        rendered = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return build_command_family_id("scheduler-policy", "policy", rendered)

    def _apply_policy_decision(self, step: PlanStep, policy: EngagementPolicy) -> PlanStep:
        family_policy_state = self.config_manager.get_family_policy_state(step.family_id)
        decision = evaluate_policy_for_risk_tags(
            step.risk_tags,
            policy,
            family_policy_state=family_policy_state,
        )
        step.approval_state = (
            "blocked"
            if decision.is_blocked
            else ("approval_required" if decision.requires_approval else "not_required")
        )
        step.risk_tags = list(decision.risk_tags)
        step.policy_reason = str(decision.reason or "")
        step.risk_summary = str(decision.risk_summary or "")
        step.safer_alternative = str(decision.safer_alternative or "")
        step.family_policy_state = str(decision.family_policy_state or "")
        return step
