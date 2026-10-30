"""Tool observation parsing: screenshots."""

from __future__ import annotations

import json
from typing import Any, Dict, List

from app.scheduler.observations.common import (
    _append_finding,
    _append_url,
    _clean_text,
    _clean_url,
    _dedupe_rows,
)


def _parse_screenshot_output(
    tool_id: str,
    output_text: str,
    *,
    base_url: str = "",
    port: str = "",
    protocol: str = "tcp",
    service: str = "",
) -> Dict[str, Any]:
    findings: List[Dict[str, Any]] = []
    urls: List[Dict[str, Any]] = []
    try:
        payload = json.loads(str(output_text or ""))
    except Exception:
        payload = {}
    if not isinstance(payload, dict):
        return {"technologies": [], "findings": [], "urls": []}

    resolved_service = _clean_text(payload.get("service_name", "") or service, 64)
    resolved_port = str(payload.get("port", "") or port or "").strip()
    resolved_protocol = str(payload.get("protocol", "") or protocol or "tcp").strip().lower() or "tcp"
    filename = _clean_text(payload.get("filename", ""), 160)
    capture_engine = _clean_text(payload.get("capture_engine", ""), 80)
    target_url = _clean_url(payload.get("target_url", "") or base_url)

    evidence_items: List[str] = []
    if filename:
        evidence_items.append(filename)
    if target_url:
        _append_url(
            urls,
            target_url,
            port=resolved_port,
            protocol=resolved_protocol,
            service=resolved_service,
            label=tool_id,
        )
        evidence_items.append(target_url)
        evidence = f"{tool_id}: screenshot captured for {target_url}"
        if capture_engine:
            evidence += f" via {capture_engine}"
        if filename:
            evidence += f" ({filename})"
        _append_finding(
            findings,
            "Visual capture available",
            severity="info",
            evidence=evidence,
            evidence_items=evidence_items,
        )
        return {
            "technologies": [],
            "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
            "urls": _dedupe_rows(urls, ("url",), limit=24),
        }

    target_label = ""
    if resolved_service and resolved_port:
        target_label = f"{resolved_service} on {resolved_port}/{resolved_protocol}"
    elif resolved_port:
        target_label = f"{resolved_port}/{resolved_protocol}"
    elif resolved_service:
        target_label = resolved_service
    else:
        target_label = "target"
    evidence = f"{tool_id}: screenshot captured for {target_label}"
    if capture_engine:
        evidence += f" via {capture_engine}"
    if filename:
        evidence += f" ({filename})"
    _append_finding(
        findings,
        "Visual capture available",
        severity="info",
        evidence=evidence,
        evidence_items=evidence_items,
    )
    return {
        "technologies": [],
        "findings": _dedupe_rows(findings, ("title", "evidence"), limit=24),
        "urls": [],
    }
