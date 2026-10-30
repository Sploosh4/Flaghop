"""Scans operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from app.web import runtime_scans as web_runtime_scans


class ScansRuntime:
    start_targets_import_job = web_runtime_scans.start_targets_import_job

    start_nmap_xml_import_job = web_runtime_scans.start_nmap_xml_import_job

    start_nmap_scan_job = web_runtime_scans.start_nmap_scan_job

    run_governed_discovery = web_runtime_scans.run_governed_discovery

    start_host_rescan_job = web_runtime_scans.start_host_rescan_job

    start_subnet_rescan_job = web_runtime_scans.start_subnet_rescan_job

    @classmethod
    def _apply_engagement_scan_profile(
        cls,
        scan_options: Dict[str, Any],
        *,
        engagement_policy: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return web_runtime_scans.apply_engagement_scan_profile(
            cls,
            scan_options,
            engagement_policy=engagement_policy,
        )

    _preferred_capture_interface_sort_key = staticmethod(web_runtime_scans.preferred_capture_interface_sort_key)

    list_capture_interfaces = web_runtime_scans.list_capture_interfaces

    get_capture_interface_inventory = web_runtime_scans.get_capture_interface_inventory

    start_passive_capture_scan_job = web_runtime_scans.start_passive_capture_scan_job

    _import_targets_from_file = web_runtime_scans.import_targets_from_file

    _import_discovered_hosts_into_project = web_runtime_scans.import_discovered_hosts_into_project

    _queue_discovered_host_followup_scan = web_runtime_scans.queue_discovered_host_followup_scan

    _resolve_host_by_token = web_runtime_scans.resolve_host_by_token

    _mark_discovered_host_origin = web_runtime_scans.mark_discovered_host_origin

    start_httpx_bootstrap_job = web_runtime_scans.start_httpx_bootstrap_job

    _httpx_bootstrap_command = staticmethod(web_runtime_scans.httpx_bootstrap_command)

    _materialize_httpx_urls_as_web_targets = web_runtime_scans.materialize_httpx_urls_as_web_targets

    _run_httpx_bootstrap = web_runtime_scans.run_httpx_bootstrap

    _ingest_discovered_hosts = web_runtime_scans.ingest_discovered_hosts

    _import_nmap_xml = web_runtime_scans.import_nmap_xml

    _run_nmap_scan_and_import = web_runtime_scans.run_nmap_scan_and_import

    _run_rfc1918_chunked_scan_and_import = web_runtime_scans.run_rfc1918_chunked_scan_and_import

    _connected_ipv4_networks_for_interface = web_runtime_scans.connected_ipv4_networks_for_interface

    _passive_capture_filter = staticmethod(web_runtime_scans.passive_capture_filter)

    _parse_tshark_field_blob = staticmethod(web_runtime_scans.parse_tshark_field_blob)

    _classify_passive_protocols = staticmethod(web_runtime_scans.classify_passive_protocols)

    _analyze_passive_capture = web_runtime_scans.analyze_passive_capture

    _run_passive_capture_scan = web_runtime_scans.run_passive_capture_scan

    _build_nmap_scan_plan = web_runtime_scans.build_nmap_scan_plan

    _build_single_scan_plan = web_runtime_scans.build_single_scan_plan

    _normalize_scan_options = staticmethod(web_runtime_scans.normalize_scan_options)

    _normalize_timing = staticmethod(web_runtime_scans.normalize_timing)

    _normalize_top_ports = staticmethod(web_runtime_scans.normalize_top_ports)

    _normalize_explicit_ports = staticmethod(web_runtime_scans.normalize_explicit_ports)

    _contains_nmap_stats_every = staticmethod(web_runtime_scans.contains_nmap_stats_every)

    _contains_nmap_verbose = staticmethod(web_runtime_scans.contains_nmap_verbose)

    _append_nmap_stats_every = staticmethod(web_runtime_scans.append_nmap_stats_every)

    _nmap_output_prefix_for_command = staticmethod(web_runtime_scans.nmap_output_prefix_for_command)

    _join_shell_tokens = staticmethod(web_runtime_scans.join_shell_tokens)

    _compact_targets = staticmethod(web_runtime_scans.compact_targets)

    _summarize_scan_scope = staticmethod(web_runtime_scans.summarize_scan_scope)

    _record_scan_submission = web_runtime_scans.record_scan_submission

    _update_scan_submission_status = web_runtime_scans.update_scan_submission_status

    _record_bool = staticmethod(web_runtime_scans.record_bool)

    _normalize_subnet_target = staticmethod(web_runtime_scans.normalize_subnet_target)

    @classmethod
    def _count_rfc1918_scan_batches(cls, targets: List[str]) -> int:
        return web_runtime_scans.count_rfc1918_scan_batches(cls, targets)

    @classmethod
    def _normalize_rfc_chunk_concurrency(cls, raw: Any) -> int:
        return web_runtime_scans.normalize_rfc_chunk_concurrency(cls, raw)

    _scan_history_targets = staticmethod(web_runtime_scans.scan_history_targets)

    _scan_target_match_score_for_subnet = staticmethod(web_runtime_scans.scan_target_match_score_for_subnet)

    @classmethod
    def _best_scan_submission_for_subnet(cls, subnet: str, records: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return web_runtime_scans.best_scan_submission_for_subnet(cls, subnet, records)

    _normalize_targets = staticmethod(web_runtime_scans.normalize_targets)
