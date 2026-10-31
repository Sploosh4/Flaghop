"""Extract observations from retained local protocol checks."""

from typing import Any, Dict
from app.scheduler.observations.common import _merge_results, _dedupe_rows
from app.scheduler.observations.network import (
    _parse_database_info_output,
    _parse_dnsmap_output,
    _parse_nbtscan_output,
    _parse_smb_enum_output,
)
from app.scheduler.observations.vulnerabilities import _parse_vuln_script_output


def extract_tool_observations(tool_id: Any, output_text: Any, **kwargs) -> Dict[str, Any]:
    tool = str(tool_id or "").strip().lower()
    output = str(output_text or "")
    result = {"technologies": [], "findings": [], "urls": [], "discovered_hosts": [], "finding_quality_events": []}
    parser = None
    if tool in {"mysql-info.nse", "pgsql-info.nse", "ms-sql-info.nse"}:
        parser = _parse_database_info_output
    elif tool in {
        "enum4linux-ng",
        "enum4linux",
        "smbenum",
        "samrdump",
        "smbmap",
        "rpcclient-enum",
        "netexec",
    } or tool.startswith("rpcclient"):
        parser = _parse_smb_enum_output
    elif tool == "nbtscan":
        parser = _parse_nbtscan_output
    elif tool == "dnsmap":
        parser = _parse_dnsmap_output
    elif tool.endswith(".nse") or tool.startswith("pipette:"):
        parser = _parse_vuln_script_output
    if parser and output.strip():
        result = _merge_results(result, parser(tool, output))
    result["technologies"] = _dedupe_rows(result["technologies"], ("name", "version", "cpe", "evidence"), limit=64)
    result["findings"] = _dedupe_rows(result["findings"], ("title", "cve", "evidence"), limit=64)
    return result
