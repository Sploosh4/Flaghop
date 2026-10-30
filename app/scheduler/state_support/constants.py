"""Shared target state: constants."""

from __future__ import annotations

import datetime
import re

WEB_SERVICE_IDS = {"http", "https", "ssl", "soap", "http-proxy", "http-alt", "https-alt"}

TARGET_SOURCE_KINDS = {"observed", "inferred", "ai_suggested", "user_entered"}

_REFERENCE_ONLY_FINDING_RE = re.compile(
    r"^(?:https?://|//|bid:\d+\s+cve:cve-\d{4}-\d+|cve:cve-\d{4}-\d+)",
    flags=re.IGNORECASE,
)

_LOW_SIGNAL_FINDING_EVIDENCE = {
    "previous scan result",
    "previous tls scan result",
}

_FINDING_QUALITY_ACTIONS = {"suppressed", "downgraded"}


def _utc_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
