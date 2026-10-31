from __future__ import annotations

import sys
import subprocess
from typing import Any, Dict, List

from app.settings import AppSettings, Settings
from app.services.workspace import WorkspaceSession, AutosaveState
from app.services.processes import ProcessRegistry
from app.services.scheduler import SchedulerService
from app.services.events import EventStream
from app.services.compatibility import OwnedState
from app import scan_presets
from app.web import runtime_scans as web_runtime_scans
from app.web.jobs import WebJobManager


from app.web.runtime_domains.jobs import JobsRuntime
from app.web.runtime_domains.workspace import WorkspaceRuntime
from app.web.runtime_domains.status import StatusRuntime
from app.web.runtime_domains.scheduler_preferences import SchedulerPreferencesRuntime
from app.web.runtime_domains.scheduler_execution import SchedulerExecutionRuntime
from app.web.runtime_domains.scheduler_context import SchedulerContextRuntime
from app.web.runtime_domains.projects import ProjectsRuntime
from app.web.runtime_domains.scheduler_evidence import SchedulerEvidenceRuntime
from app.web.runtime_domains.graph import GraphRuntime
from app.web.runtime_domains.artifacts import ArtifactsRuntime
from app.web.runtime_domains.settings import SettingsRuntime
from app.web.runtime_domains.processes import ProcessesRuntime
from app.web.runtime_domains.scans import ScansRuntime
from app.web.runtime_domains.tools import ToolsRuntime
from app.web.runtime_domains.scheduler_state import SchedulerStateRuntime
from app.web.runtime_domains.execution import ExecutionRuntime


class WebRuntime:
    """Compatibility facade; application services own state and new domain behavior."""

    # Jobs compatibility API.
    _emit_ui_invalidation = JobsRuntime._emit_ui_invalidation
    wait_for_ui_event = JobsRuntime.wait_for_ui_event
    _handle_job_change = JobsRuntime._handle_job_change
    _start_job = JobsRuntime._start_job
    _find_active_job = JobsRuntime._find_active_job

    # Workspace compatibility API.
    get_workspace_overview = WorkspaceRuntime.get_workspace_overview
    get_target_state_view = WorkspaceRuntime.get_target_state_view
    get_findings = WorkspaceRuntime.get_findings
    _host_is_down = staticmethod(WorkspaceRuntime._host_is_down)
    _workspace_host_services = staticmethod(WorkspaceRuntime._workspace_host_services)
    _resolve_host_device_categories = WorkspaceRuntime._resolve_host_device_categories
    _build_workspace_host_row = WorkspaceRuntime._build_workspace_host_row
    get_workspace_hosts = WorkspaceRuntime.get_workspace_hosts
    get_workspace_services = WorkspaceRuntime.get_workspace_services
    _strip_nmap_preamble = staticmethod(WorkspaceRuntime._strip_nmap_preamble)
    _host_detail_script_preview = classmethod(WorkspaceRuntime._host_detail_script_preview.__func__)
    get_host_workspace = WorkspaceRuntime.get_host_workspace
    delete_host_workspace = WorkspaceRuntime.delete_host_workspace
    get_script_output = WorkspaceRuntime.get_script_output
    _summary = WorkspaceRuntime._summary
    _hosts = WorkspaceRuntime._hosts
    _ensure_workspace_settings_table = WorkspaceRuntime._ensure_workspace_settings_table
    _get_workspace_setting_locked = WorkspaceRuntime._get_workspace_setting_locked
    _set_workspace_setting_locked = WorkspaceRuntime._set_workspace_setting_locked
    _resolve_host = WorkspaceRuntime._resolve_host
    _load_cves_for_host = WorkspaceRuntime._load_cves_for_host
    _hostname_for_ip = WorkspaceRuntime._hostname_for_ip
    _service_name_for_target = WorkspaceRuntime._service_name_for_target

    # Status compatibility API.
    get_workspace_processes = StatusRuntime.get_workspace_processes
    get_snapshot = StatusRuntime.get_snapshot

    # SchedulerPreferences compatibility API.
    get_scheduler_preferences = SchedulerPreferencesRuntime.get_scheduler_preferences
    _merge_engagement_policy_payload = staticmethod(SchedulerPreferencesRuntime._merge_engagement_policy_payload)
    _load_engagement_policy_locked = SchedulerPreferencesRuntime._load_engagement_policy_locked
    get_engagement_policy = SchedulerPreferencesRuntime.get_engagement_policy
    set_engagement_policy = SchedulerPreferencesRuntime.set_engagement_policy
    apply_scheduler_preferences = SchedulerPreferencesRuntime.apply_scheduler_preferences
    get_scheduler_decisions = SchedulerPreferencesRuntime.get_scheduler_decisions
    get_scheduler_approvals = SchedulerPreferencesRuntime.get_scheduler_approvals
    _scheduler_family_policy_metadata = SchedulerPreferencesRuntime._scheduler_family_policy_metadata
    _apply_family_policy_action = SchedulerPreferencesRuntime._apply_family_policy_action
    get_scan_history = SchedulerPreferencesRuntime.get_scan_history
    _scheduler_tool_audit_snapshot = SchedulerPreferencesRuntime._scheduler_tool_audit_snapshot
    _job_worker_count = staticmethod(SchedulerPreferencesRuntime._job_worker_count)
    _scheduler_max_concurrency = staticmethod(SchedulerPreferencesRuntime._scheduler_max_concurrency)
    _scheduler_max_host_concurrency = staticmethod(SchedulerPreferencesRuntime._scheduler_max_host_concurrency)
    _scheduler_max_jobs = staticmethod(SchedulerPreferencesRuntime._scheduler_max_jobs)
    _is_host_scoped_scheduler_tool = staticmethod(SchedulerPreferencesRuntime._is_host_scoped_scheduler_tool)
    _scheduler_preferences = SchedulerPreferencesRuntime._scheduler_preferences
    _device_category_options = SchedulerPreferencesRuntime._device_category_options
    _built_in_device_category_options = staticmethod(SchedulerPreferencesRuntime._built_in_device_category_options)
    _ensure_scheduler_table = SchedulerPreferencesRuntime._ensure_scheduler_table
    _ensure_scheduler_approval_store = SchedulerPreferencesRuntime._ensure_scheduler_approval_store

    # SchedulerExecution compatibility API.
    get_scheduler_execution_records = SchedulerExecutionRuntime.get_scheduler_execution_records
    _read_text_excerpt = staticmethod(SchedulerExecutionRuntime._read_text_excerpt)
    get_scheduler_execution_traces = SchedulerExecutionRuntime.get_scheduler_execution_traces
    get_scheduler_execution_trace = SchedulerExecutionRuntime.get_scheduler_execution_trace
    _persist_scheduler_execution_record = SchedulerExecutionRuntime._persist_scheduler_execution_record
    approve_scheduler_approval = SchedulerExecutionRuntime.approve_scheduler_approval
    reject_scheduler_approval = SchedulerExecutionRuntime.reject_scheduler_approval
    start_scheduler_run_job = SchedulerExecutionRuntime.start_scheduler_run_job
    _run_scheduler_actions_web = SchedulerExecutionRuntime._run_scheduler_actions_web
    _run_scheduler_targets = SchedulerExecutionRuntime._run_scheduler_targets
    _group_scheduler_targets_by_host = staticmethod(SchedulerExecutionRuntime._group_scheduler_targets_by_host)
    _merge_scheduler_run_summaries = staticmethod(SchedulerExecutionRuntime._merge_scheduler_run_summaries)
    _execute_approved_scheduler_item = SchedulerExecutionRuntime._execute_approved_scheduler_item
    _execute_scheduler_decision = SchedulerExecutionRuntime._execute_scheduler_decision

    # SchedulerContext compatibility API.
    get_scheduler_rationale_feed = SchedulerContextRuntime.get_scheduler_rationale_feed
    _scheduler_rationale_feed_locked = SchedulerContextRuntime._scheduler_rationale_feed_locked
    _build_scheduler_target_context = SchedulerContextRuntime._build_scheduler_target_context
    _build_scheduler_context_summary = staticmethod(SchedulerContextRuntime._build_scheduler_context_summary)
    _build_scheduler_coverage_summary = staticmethod(SchedulerContextRuntime._build_scheduler_coverage_summary)
    _scheduler_banner_from_evidence = staticmethod(SchedulerContextRuntime._scheduler_banner_from_evidence)
    _scheduler_service_banner_fallback = staticmethod(SchedulerContextRuntime._scheduler_service_banner_fallback)
    _truncate_scheduler_text = staticmethod(SchedulerContextRuntime._truncate_scheduler_text)
    _scheduler_output_lines = staticmethod(SchedulerContextRuntime._scheduler_output_lines)
    _scheduler_line_signal_score = staticmethod(SchedulerContextRuntime._scheduler_line_signal_score)
    _build_scheduler_excerpt = classmethod(SchedulerContextRuntime._build_scheduler_excerpt.__func__)
    _build_scheduler_prompt_excerpt = classmethod(SchedulerContextRuntime._build_scheduler_prompt_excerpt.__func__)
    _build_scheduler_analysis_excerpt = classmethod(SchedulerContextRuntime._build_scheduler_analysis_excerpt.__func__)
    _scheduler_tool_alias_tokens = staticmethod(SchedulerContextRuntime._scheduler_tool_alias_tokens)
    _extract_unavailable_tool_tokens = staticmethod(SchedulerContextRuntime._extract_unavailable_tool_tokens)
    _extract_missing_nse_script_tokens = staticmethod(SchedulerContextRuntime._extract_missing_nse_script_tokens)
    _looks_like_local_tool_dependency_failure = staticmethod(
        SchedulerContextRuntime._looks_like_local_tool_dependency_failure
    )

    # Projects compatibility API.
    _project_listing_row = staticmethod(ProjectsRuntime._project_listing_row)
    list_projects = ProjectsRuntime.list_projects
    get_project_details = ProjectsRuntime.get_project_details
    rename_project = ProjectsRuntime.rename_project
    create_new_temporary_project = ProjectsRuntime.create_new_temporary_project
    open_project = ProjectsRuntime.open_project
    start_save_project_as_job = ProjectsRuntime.start_save_project_as_job
    save_project_as = ProjectsRuntime.save_project_as
    build_project_bundle_zip = ProjectsRuntime.build_project_bundle_zip
    start_restore_project_zip_job = ProjectsRuntime.start_restore_project_zip_job
    restore_project_bundle_zip = ProjectsRuntime.restore_project_bundle_zip
    _restore_project_bundle_zip_job = ProjectsRuntime._restore_project_bundle_zip_job
    _restore_project_bundle_zip = ProjectsRuntime._restore_project_bundle_zip
    _save_project_as = ProjectsRuntime._save_project_as
    _count_running_scan_jobs = ProjectsRuntime._count_running_scan_jobs
    _has_running_autosave_job = ProjectsRuntime._has_running_autosave_job
    _get_autosave_interval_seconds = ProjectsRuntime._get_autosave_interval_seconds
    _resolve_autosave_target_path = ProjectsRuntime._resolve_autosave_target_path
    _run_project_autosave = ProjectsRuntime._run_project_autosave
    _maybe_schedule_autosave_locked = ProjectsRuntime._maybe_schedule_autosave_locked
    _project_metadata = ProjectsRuntime._project_metadata
    _normalize_restore_compare_path = staticmethod(ProjectsRuntime._normalize_restore_compare_path)
    _looks_like_absolute_path = staticmethod(ProjectsRuntime._looks_like_absolute_path)
    _path_tail = staticmethod(ProjectsRuntime._path_tail)
    _build_restore_root_mappings = staticmethod(ProjectsRuntime._build_restore_root_mappings)
    _build_restore_text_replacements = staticmethod(ProjectsRuntime._build_restore_text_replacements)
    _replace_restore_roots_in_text = staticmethod(ProjectsRuntime._replace_restore_roots_in_text)
    _build_restore_basename_index = staticmethod(ProjectsRuntime._build_restore_basename_index)
    _match_rebased_candidate = staticmethod(ProjectsRuntime._match_rebased_candidate)
    _rebase_restored_file_reference = staticmethod(ProjectsRuntime._rebase_restored_file_reference)
    _rewrite_restored_json_value = staticmethod(ProjectsRuntime._rewrite_restored_json_value)
    _sqlite_table_columns = staticmethod(ProjectsRuntime._sqlite_table_columns)
    _rewrite_restored_json_text = staticmethod(ProjectsRuntime._rewrite_restored_json_text)
    _rewrite_sqlite_table_rows = staticmethod(ProjectsRuntime._rewrite_sqlite_table_rows)
    _rebase_restored_project_paths = staticmethod(ProjectsRuntime._rebase_restored_project_paths)
    _attach_restored_running_folder_locked = ProjectsRuntime._attach_restored_running_folder_locked
    _count_running_or_waiting_processes = staticmethod(ProjectsRuntime._count_running_or_waiting_processes)
    _zip_add_file_if_exists = staticmethod(ProjectsRuntime._zip_add_file_if_exists)
    _zip_add_dir_if_exists = staticmethod(ProjectsRuntime._zip_add_dir_if_exists)
    _bundle_prefix = staticmethod(ProjectsRuntime._bundle_prefix)
    _safe_bundle_filename = staticmethod(ProjectsRuntime._safe_bundle_filename)
    _safe_bundle_relative_path = staticmethod(ProjectsRuntime._safe_bundle_relative_path)
    _read_bundle_manifest = ProjectsRuntime._read_bundle_manifest
    _locate_bundle_session_member = ProjectsRuntime._locate_bundle_session_member
    _extract_zip_member_to_file = ProjectsRuntime._extract_zip_member_to_file
    _extract_zip_prefix_to_dir = ProjectsRuntime._extract_zip_prefix_to_dir
    _close_active_project = ProjectsRuntime._close_active_project
    _require_active_project = ProjectsRuntime._require_active_project
    _is_temp_project = ProjectsRuntime._is_temp_project
    _normalize_project_path = staticmethod(ProjectsRuntime._normalize_project_path)
    _normalize_existing_file = staticmethod(ProjectsRuntime._normalize_existing_file)

    # SchedulerEvidence compatibility API.
    _serialize_plan_step_preview = SchedulerEvidenceRuntime._serialize_plan_step_preview
    get_scheduler_plan_preview = SchedulerEvidenceRuntime.get_scheduler_plan_preview
    _execute_scheduler_task_batch = SchedulerEvidenceRuntime._execute_scheduler_task_batch
    _execute_scheduler_task = SchedulerEvidenceRuntime._execute_scheduler_task
    _extract_scheduler_signals = SchedulerEvidenceRuntime._extract_scheduler_signals
    _is_placeholder_scheduler_text = staticmethod(SchedulerEvidenceRuntime._is_placeholder_scheduler_text)
    _infer_technologies_from_observations = SchedulerEvidenceRuntime._infer_technologies_from_observations
    _infer_host_technologies = SchedulerEvidenceRuntime._infer_host_technologies
    _normalize_ai_technologies = SchedulerEvidenceRuntime._normalize_ai_technologies
    _merge_technologies = SchedulerEvidenceRuntime._merge_technologies
    _infer_findings_from_observations = SchedulerEvidenceRuntime._infer_findings_from_observations
    _infer_host_findings = SchedulerEvidenceRuntime._infer_host_findings
    _infer_urls_from_observations = SchedulerEvidenceRuntime._infer_urls_from_observations
    _infer_host_urls = SchedulerEvidenceRuntime._infer_host_urls
    _normalize_ai_findings = SchedulerEvidenceRuntime._normalize_ai_findings
    _normalize_ai_manual_tests = SchedulerEvidenceRuntime._normalize_ai_manual_tests
    _merge_ai_items = staticmethod(SchedulerEvidenceRuntime._merge_ai_items)
    _coverage_gaps_from_summary = staticmethod(SchedulerEvidenceRuntime._coverage_gaps_from_summary)
    _persist_shared_target_state = SchedulerEvidenceRuntime._persist_shared_target_state
    _enrich_host_from_observed_results = SchedulerEvidenceRuntime._enrich_host_from_observed_results
    _queue_scheduler_approval = SchedulerEvidenceRuntime._queue_scheduler_approval
    _record_scheduler_decision = SchedulerEvidenceRuntime._record_scheduler_decision
    _load_host_observations = SchedulerEvidenceRuntime._load_host_observations

    # Graph compatibility API.
    get_evidence_graph = GraphRuntime.get_evidence_graph
    _get_graph_snapshot_locked = GraphRuntime._get_graph_snapshot_locked
    get_graph_related_content = GraphRuntime.get_graph_related_content
    get_graph_content = GraphRuntime.get_graph_content
    rebuild_evidence_graph = GraphRuntime.rebuild_evidence_graph
    get_evidence_graph_layouts = GraphRuntime.get_evidence_graph_layouts
    save_evidence_graph_layout = GraphRuntime.save_evidence_graph_layout
    get_evidence_graph_annotations = GraphRuntime.get_evidence_graph_annotations
    save_evidence_graph_annotation = GraphRuntime.save_evidence_graph_annotation

    # Artifacts compatibility API.
    _path_within = staticmethod(ArtifactsRuntime._path_within)
    _is_project_artifact_path = ArtifactsRuntime._is_project_artifact_path
    _collect_command_artifacts = staticmethod(ArtifactsRuntime._collect_command_artifacts)
    _host_target_item_matches_port = staticmethod(ArtifactsRuntime._host_target_item_matches_port)
    _delete_project_artifact_refs = ArtifactsRuntime._delete_project_artifact_refs
    _prune_target_state_for_port = ArtifactsRuntime._prune_target_state_for_port
    delete_workspace_port = ArtifactsRuntime.delete_workspace_port
    delete_workspace_service = ArtifactsRuntime.delete_workspace_service

    # Settings compatibility API.
    get_tool_audit = SettingsRuntime.get_tool_audit
    _tool_audit_availability = staticmethod(SettingsRuntime._tool_audit_availability)
    get_tool_install_plan = SettingsRuntime.get_tool_install_plan
    start_tool_install_job = SettingsRuntime.start_tool_install_job
    _run_tool_install_job = SettingsRuntime._run_tool_install_job

    # Processes compatibility API.
    _register_job_process = ProcessesRuntime._register_job_process
    _unregister_job_process = ProcessesRuntime._unregister_job_process
    _job_active_process_ids = ProcessesRuntime._job_active_process_ids
    start_process_retry_job = ProcessesRuntime.start_process_retry_job
    retry_process = ProcessesRuntime.retry_process
    _build_process_retry_plan = ProcessesRuntime._build_process_retry_plan
    _split_process_retry_targets = staticmethod(ProcessesRuntime._split_process_retry_targets)
    _signal_process_tree = staticmethod(ProcessesRuntime._signal_process_tree)
    kill_process = ProcessesRuntime.kill_process
    clear_processes = ProcessesRuntime.clear_processes
    close_process = ProcessesRuntime.close_process
    get_process_output = ProcessesRuntime.get_process_output
    list_jobs = ProcessesRuntime.list_jobs
    get_job = ProcessesRuntime.get_job
    stop_job = ProcessesRuntime.stop_job
    _tool_execution_profile = ProcessesRuntime._tool_execution_profile
    _resolve_process_timeout_policy = ProcessesRuntime._resolve_process_timeout_policy
    _sample_process_tree_activity = staticmethod(ProcessesRuntime._sample_process_tree_activity)
    _process_tree_activity_changed = staticmethod(ProcessesRuntime._process_tree_activity_changed)
    _coerce_float = staticmethod(ProcessesRuntime._coerce_float)
    _format_duration_label = staticmethod(ProcessesRuntime._format_duration_label)
    _redact_command_secrets = staticmethod(ProcessesRuntime._redact_command_secrets)
    _normalize_progress_source_label = staticmethod(ProcessesRuntime._normalize_progress_source_label)
    _build_process_progress_payload = staticmethod(ProcessesRuntime._build_process_progress_payload)
    _processes = ProcessesRuntime._processes
    _process_history_records = staticmethod(ProcessesRuntime._process_history_records)
    _normalize_process_timestamp_to_utc = staticmethod(ProcessesRuntime._normalize_process_timestamp_to_utc)
    _process_timestamp_utc_candidates = staticmethod(ProcessesRuntime._process_timestamp_utc_candidates)
    _normalize_process_time_range_to_utc = staticmethod(ProcessesRuntime._normalize_process_time_range_to_utc)
    _ensure_process_tables = ProcessesRuntime._ensure_process_tables
    _is_nmap_command = staticmethod(ProcessesRuntime._is_nmap_command)
    _is_nuclei_command = staticmethod(ProcessesRuntime._is_nuclei_command)
    _is_tshark_passive_capture_command = staticmethod(ProcessesRuntime._is_tshark_passive_capture_command)
    _process_progress_adapter_for_command = classmethod(ProcessesRuntime._process_progress_adapter_for_command.__func__)
    _estimate_remaining_from_percent = staticmethod(ProcessesRuntime._estimate_remaining_from_percent)
    _extract_progress_line = staticmethod(ProcessesRuntime._extract_progress_line)
    _extract_nmap_progress_message = classmethod(ProcessesRuntime._extract_nmap_progress_message.__func__)
    _extract_nuclei_progress_from_text = classmethod(ProcessesRuntime._extract_nuclei_progress_from_text.__func__)
    _extract_tshark_passive_progress = classmethod(ProcessesRuntime._extract_tshark_passive_progress.__func__)
    _update_process_progress = ProcessesRuntime._update_process_progress
    _update_nmap_process_progress = ProcessesRuntime._update_nmap_process_progress
    _extract_nmap_progress_from_text = staticmethod(ProcessesRuntime._extract_nmap_progress_from_text)
    _parse_duration_seconds = staticmethod(ProcessesRuntime._parse_duration_seconds)

    # Scans compatibility API.
    start_targets_import_job = ScansRuntime.start_targets_import_job
    start_nmap_xml_import_job = ScansRuntime.start_nmap_xml_import_job
    start_nmap_scan_job = ScansRuntime.start_nmap_scan_job
    run_governed_discovery = ScansRuntime.run_governed_discovery
    start_host_rescan_job = ScansRuntime.start_host_rescan_job
    start_subnet_rescan_job = ScansRuntime.start_subnet_rescan_job
    _apply_engagement_scan_profile = classmethod(ScansRuntime._apply_engagement_scan_profile.__func__)
    _preferred_capture_interface_sort_key = staticmethod(ScansRuntime._preferred_capture_interface_sort_key)
    list_capture_interfaces = ScansRuntime.list_capture_interfaces
    get_capture_interface_inventory = ScansRuntime.get_capture_interface_inventory
    start_passive_capture_scan_job = ScansRuntime.start_passive_capture_scan_job
    _import_targets_from_file = ScansRuntime._import_targets_from_file
    _import_discovered_hosts_into_project = ScansRuntime._import_discovered_hosts_into_project
    _queue_discovered_host_followup_scan = ScansRuntime._queue_discovered_host_followup_scan
    _resolve_host_by_token = ScansRuntime._resolve_host_by_token
    _mark_discovered_host_origin = ScansRuntime._mark_discovered_host_origin
    _ingest_discovered_hosts = ScansRuntime._ingest_discovered_hosts
    _import_nmap_xml = ScansRuntime._import_nmap_xml
    _run_nmap_scan_and_import = ScansRuntime._run_nmap_scan_and_import
    _run_rfc1918_chunked_scan_and_import = ScansRuntime._run_rfc1918_chunked_scan_and_import
    _connected_ipv4_networks_for_interface = ScansRuntime._connected_ipv4_networks_for_interface
    _passive_capture_filter = staticmethod(ScansRuntime._passive_capture_filter)
    _parse_tshark_field_blob = staticmethod(ScansRuntime._parse_tshark_field_blob)
    _classify_passive_protocols = staticmethod(ScansRuntime._classify_passive_protocols)
    _analyze_passive_capture = ScansRuntime._analyze_passive_capture
    _run_passive_capture_scan = ScansRuntime._run_passive_capture_scan
    _build_nmap_scan_plan = ScansRuntime._build_nmap_scan_plan
    _build_single_scan_plan = ScansRuntime._build_single_scan_plan
    _normalize_scan_options = staticmethod(ScansRuntime._normalize_scan_options)
    _normalize_timing = staticmethod(ScansRuntime._normalize_timing)
    _normalize_top_ports = staticmethod(ScansRuntime._normalize_top_ports)
    _normalize_explicit_ports = staticmethod(ScansRuntime._normalize_explicit_ports)
    _contains_nmap_stats_every = staticmethod(ScansRuntime._contains_nmap_stats_every)
    _contains_nmap_verbose = staticmethod(ScansRuntime._contains_nmap_verbose)
    _append_nmap_stats_every = staticmethod(ScansRuntime._append_nmap_stats_every)
    _nmap_output_prefix_for_command = staticmethod(ScansRuntime._nmap_output_prefix_for_command)
    _join_shell_tokens = staticmethod(ScansRuntime._join_shell_tokens)
    _compact_targets = staticmethod(ScansRuntime._compact_targets)
    _summarize_scan_scope = staticmethod(ScansRuntime._summarize_scan_scope)
    _record_scan_submission = ScansRuntime._record_scan_submission
    _update_scan_submission_status = ScansRuntime._update_scan_submission_status
    _record_bool = staticmethod(ScansRuntime._record_bool)
    _normalize_subnet_target = staticmethod(ScansRuntime._normalize_subnet_target)
    _count_rfc1918_scan_batches = classmethod(ScansRuntime._count_rfc1918_scan_batches.__func__)
    _normalize_rfc_chunk_concurrency = classmethod(ScansRuntime._normalize_rfc_chunk_concurrency.__func__)
    _scan_history_targets = staticmethod(ScansRuntime._scan_history_targets)
    _scan_target_match_score_for_subnet = staticmethod(ScansRuntime._scan_target_match_score_for_subnet)
    _best_scan_submission_for_subnet = classmethod(ScansRuntime._best_scan_submission_for_subnet.__func__)
    _normalize_targets = staticmethod(ScansRuntime._normalize_targets)

    @staticmethod
    def _port_sort_key(port):
        try:
            return (0, int(port))
        except (TypeError, ValueError):
            return (1, str(port))

    # Tools compatibility API.
    start_tool_run_job = ToolsRuntime.start_tool_run_job
    _workspace_tools_rows = ToolsRuntime._workspace_tools_rows
    get_workspace_tool_targets = ToolsRuntime.get_workspace_tool_targets
    get_workspace_tools_page = ToolsRuntime.get_workspace_tools_page
    get_workspace_tools = ToolsRuntime.get_workspace_tools
    _run_manual_tool = ToolsRuntime._run_manual_tool
    _tool_run_stats = ToolsRuntime._tool_run_stats
    _get_settings = ToolsRuntime._get_settings
    _find_port_action = staticmethod(ToolsRuntime._find_port_action)
    _find_command_template_for_tool = ToolsRuntime._find_command_template_for_tool
    _runner_type_for_tool = ToolsRuntime._runner_type_for_tool
    _runner_type_for_approval_item = ToolsRuntime._runner_type_for_approval_item
    _build_command = ToolsRuntime._build_command

    # SchedulerState compatibility API.
    _existing_attempt_summary_for_target = SchedulerStateRuntime._existing_attempt_summary_for_target
    _existing_tool_attempts_for_target = SchedulerStateRuntime._existing_tool_attempts_for_target
    _ai_confidence_value = staticmethod(SchedulerStateRuntime._ai_confidence_value)
    _sanitize_ai_hostname = staticmethod(SchedulerStateRuntime._sanitize_ai_hostname)
    _extract_cpe_tokens = staticmethod(SchedulerStateRuntime._extract_cpe_tokens)
    _extract_version_token = staticmethod(SchedulerStateRuntime._extract_version_token)
    _is_ipv4_like = staticmethod(SchedulerStateRuntime._is_ipv4_like)
    _sanitize_technology_version = staticmethod(SchedulerStateRuntime._sanitize_technology_version)
    _sanitize_technology_version_for_tech = staticmethod(SchedulerStateRuntime._sanitize_technology_version_for_tech)
    _technology_hint_source_text = staticmethod(SchedulerStateRuntime._technology_hint_source_text)
    _observation_text_for_analysis = staticmethod(SchedulerStateRuntime._observation_text_for_analysis)
    _cve_evidence_lines = staticmethod(SchedulerStateRuntime._cve_evidence_lines)
    _extract_version_near_tokens = staticmethod(SchedulerStateRuntime._extract_version_near_tokens)
    _normalize_cpe_token = staticmethod(SchedulerStateRuntime._normalize_cpe_token)
    _cpe_base = staticmethod(SchedulerStateRuntime._cpe_base)
    _is_weak_technology_name = staticmethod(SchedulerStateRuntime._is_weak_technology_name)
    _technology_canonical_key = staticmethod(SchedulerStateRuntime._technology_canonical_key)
    _technology_quality_score = staticmethod(SchedulerStateRuntime._technology_quality_score)
    _name_from_cpe = staticmethod(SchedulerStateRuntime._name_from_cpe)
    _version_from_cpe = staticmethod(SchedulerStateRuntime._version_from_cpe)
    _guess_technology_hint = staticmethod(SchedulerStateRuntime._guess_technology_hint)
    _guess_technology_hints = staticmethod(SchedulerStateRuntime._guess_technology_hints)
    _severity_from_text = staticmethod(SchedulerStateRuntime._severity_from_text)
    _finding_sort_key = staticmethod(SchedulerStateRuntime._finding_sort_key)
    _normalize_command_signature_source = staticmethod(SchedulerStateRuntime._normalize_command_signature_source)
    _command_signature_for_target = SchedulerStateRuntime._command_signature_for_target
    _target_attempt_matches = staticmethod(SchedulerStateRuntime._target_attempt_matches)

    # Execution compatibility API.
    _run_command_with_tracking = ExecutionRuntime._run_command_with_tracking
    _write_process_output_partial = ExecutionRuntime._write_process_output_partial
    _save_script_result_if_missing = ExecutionRuntime._save_script_result_if_missing

    INTERNAL_QUICK_RECON_TCP_PORTS = scan_presets.INTERNAL_QUICK_RECON_TCP_PORTS
    RFC1918_COMPREHENSIVE_TCP_PORTS = scan_presets.RFC1918_COMPREHENSIVE_TCP_PORTS
    RFC1918_SWEEP_CHUNK_PREFIX = 24
    RFC1918_SWEEP_BATCH_SIZE = 2
    RFC1918_SWEEP_MAX_CONCURRENCY = 4

    logic = OwnedState("workspace", "logic", WorkspaceSession)
    _lock = OwnedState("workspace", "lock", WorkspaceSession)
    _save_in_progress = OwnedState("workspace", "save_in_progress", WorkspaceSession)
    _autosave_lock = OwnedState("autosave", "lock", AutosaveState)
    _autosave_next_due_monotonic = OwnedState("autosave", "next_due_monotonic", AutosaveState)
    _autosave_last_job_id = OwnedState("autosave", "last_job_id", AutosaveState)
    _autosave_last_saved_at = OwnedState("autosave", "last_saved_at", AutosaveState)
    _autosave_last_path = OwnedState("autosave", "last_path", AutosaveState)
    _autosave_last_error = OwnedState("autosave", "last_error", AutosaveState)
    _process_runtime_lock = OwnedState("process_registry", "lock", ProcessRegistry)
    _active_processes = OwnedState("process_registry", "active", ProcessRegistry)
    _kill_requests = OwnedState("process_registry", "kill_requests", ProcessRegistry)
    _job_process_ids = OwnedState("process_registry", "job_process_ids", ProcessRegistry)
    _process_job_id = OwnedState("process_registry", "process_job_id", ProcessRegistry)
    scheduler_config = OwnedState("scheduler", "config", SchedulerService)
    scheduler_planner = OwnedState("scheduler", "planner", SchedulerService)
    scheduler_orchestrator = OwnedState("scheduler", "orchestrator", SchedulerService)
    _ui_event_condition = OwnedState("events", "condition", EventStream)
    _ui_event_seq = OwnedState("events", "seq", EventStream)
    _ui_events = OwnedState("events", "events", EventStream)
    _ui_last_emit_monotonic = OwnedState("events", "last_emit_monotonic", EventStream)

    def __init__(self, logic):
        self.workspace = WorkspaceSession(logic)
        self.autosave = self.workspace.autosave
        self.process_registry = ProcessRegistry()
        self.scheduler = SchedulerService.create()
        self.events = EventStream()
        self.settings_file = AppSettings()
        self.settings = Settings(self.settings_file)
        preferences = self.scheduler.config.load()
        self.jobs = WebJobManager(
            max_jobs=self._scheduler_max_jobs(preferences),
            worker_count=self._job_worker_count(preferences),
            on_change=self._handle_job_change,
        )

    @classmethod
    def _iter_rfc1918_scan_batches(cls, targets: List[str]):
        yield from web_runtime_scans.iter_rfc1918_scan_batches(cls, targets)

    @staticmethod
    def _split_csv(raw: str) -> List[str]:
        return [item.strip() for item in str(raw or "").split(",") if item.strip()]
