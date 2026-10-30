"""Scheduler AI providers: constants."""

from __future__ import annotations

import re

MAX_PROVIDER_PROMPT_CHARS = 5200

MAX_PROVIDER_CANDIDATES = 24

MAX_CANDIDATE_TEMPLATE_CHARS = 180

MAX_CANDIDATE_LABEL_CHARS = 96

MAX_CANDIDATE_PURPOSE_CHARS = 72

MAX_CANDIDATE_WHEN_TO_USE_CHARS = 88

MAX_CANDIDATE_ARG_SHAPE_CHARS = 24

MIN_PROVIDER_CANDIDATE_BLOCK_CHARS = 1600

MAX_PROVIDER_RESPONSE_TOKENS = 1000

MAX_PROVIDER_REFLECTION_RESPONSE_TOKENS = 500

MAX_PROVIDER_SPECIALIST_RESPONSE_TOKENS = 420

MAX_PROVIDER_OPENAI_RETRY_ATTEMPTS = 3

MAX_PROVIDER_OPENAI_RETRY_TOKENS = 1600

DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"

MAX_PROVIDER_CONTEXT_CHARS = 10000

MAX_PROVIDER_CONTEXT_ITEMS = 64

MAX_PROVIDER_LOG_ENTRIES = 600

MAX_PROVIDER_LOG_TEXT_CHARS = 20000

SCHEDULER_PROMPT_VERSION = "scheduler-ranking-v2"

SCHEDULER_REFLECTION_PROMPT_VERSION = "scheduler-reflection-v1"

SCHEDULER_WEB_FOLLOWUP_PROMPT_VERSION = "scheduler-web-followup-v1"

_ALWAYS_INCLUDE_BOOL_SIGNALS = {
    "web_service",
    "rdp_service",
    "vnc_service",
    "tls_detected",
    "shodan_enabled",
    "wordpress_detected",
    "iis_detected",
    "webdav_detected",
    "vmware_detected",
    "coldfusion_detected",
    "huawei_detected",
    "ubiquiti_detected",
}

_WEB_SERVICE_IDS = {"http", "https", "ssl", "soap", "http-proxy", "http-alt", "https-alt"}

_SCHEDULER_PHASES = (
    "initial_discovery",
    "service_fingerprint",
    "broad_vuln",
    "protocol_checks",
    "targeted_checks",
    "deep_web",
    "external_enrichment",
    "complete",
)

_PROVIDER_IPV4_LIKE_RE = re.compile(r"^\d{1,3}(?:\.\d{1,3}){3}$")

_STRICT_COVERAGE_GAP_IDS = {
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


class ProviderError(RuntimeError):
    pass
