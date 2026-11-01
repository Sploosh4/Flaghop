"""Strict tool-output contracts and bounded web artifact parsing."""
from __future__ import annotations

from html.parser import HTMLParser
import json


def json_rows(path):
    text = path.read_text(errors="replace")
    if not text.strip():
        return []
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else [data]
    except json.JSONDecodeError:
        return [json.loads(line) for line in text.splitlines() if line.strip()]


def normalise_fingerprintx(rows):
    """Validate the installed fingerprintx JSON contract and retain fields used
    by planning.  An open target with no parsed fingerprint is not a success."""
    records = [row for row in rows if isinstance(row, dict)]
    if not records:
        raise ValueError("fingerprintx produced no parseable fingerprint")
    required = ("ip", "port", "protocol", "tls", "transport")
    for row in records:
        missing = [field for field in required if field not in row]
        if missing:
            raise ValueError("fingerprintx row is missing: " + ", ".join(missing))
        if not isinstance(row["port"], int) or not isinstance(row["tls"], bool):
            raise ValueError("fingerprintx row has invalid port/tls field types")
        row.setdefault("service", row["protocol"])
    return records


def normalise_dalfox(result, rows):
    """Validate the Dalfox JSON contract, including nested finding records.

    Dalfox uses exit 1 for findings, not only for process failure.  Incomplete
    reports stay failed/partial; malformed schemas raise locally so the artifact
    parser can preserve a partial profile instead of letting TypeError escape.
    """
    if not isinstance(rows, list) or not rows:
        raise ValueError("Dalfox produced no structured report")
    reports = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Dalfox report row is not an object")
        meta = row.get("meta")
        if not isinstance(meta, dict):
            raise ValueError("Dalfox report meta is missing or not an object")
        incomplete = meta.get("incomplete")
        if not isinstance(incomplete, bool):
            raise ValueError("Dalfox meta.incomplete must be a boolean")
        count = meta.get("findings_count")
        if not isinstance(count, int) or isinstance(count, bool) or count < 0:
            raise ValueError("Dalfox meta.findings_count must be a non-negative integer")
        findings = row.get("findings")
        if not isinstance(findings, list) or not all(isinstance(item, dict) for item in findings):
            raise ValueError("Dalfox findings must be a list of objects")
        if count != len(findings):
            raise ValueError("Dalfox findings_count does not match findings")
        reports.append(row)
    if any(report["meta"]["incomplete"] for report in reports):
        result.update(status="failed", reason="Dalfox reported an incomplete scan")
        return rows
    findings = sum(len(report["findings"]) for report in reports)
    exit_code = result.get("exit_code")
    if exit_code == 1 and findings == 0:
        result.update(status="failed", reason="Dalfox exited 1 without a structured finding")
    elif exit_code not in (0, 1):
        result.update(status="failed", reason=f"Dalfox exited with unexpected status {exit_code}")
    return rows


def parse_result_artifact(result, tool, artifact, output, format):
    """Parse a bounded adapter artifact and expose parser failure explicitly."""
    try:
        if not artifact.exists() or artifact.stat().st_size > 8 * 1024 * 1024:
            raise ValueError("Expected bounded result artifact was not produced")
        rows = json_rows(artifact) if format in ("jsonl", "json") else []
        if tool == "fingerprintx":
            rows = normalise_fingerprintx(rows)
        elif tool == "dalfox":
            rows = normalise_dalfox(result, rows)
        result["parse_status"] = "completed"
        return rows
    except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError) as error:
        result.update(parse_status="failed", parse_error=str(error))
        return []


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        for key in ("href", "src", "action"):
            if attrs.get(key):
                self.links.append(attrs[key])
