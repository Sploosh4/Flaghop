"""Scheduler Preferences operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_scheduler as web_runtime_scheduler


class SchedulerPreferencesRuntime:
    get_scheduler_preferences = web_runtime_scheduler.get_scheduler_preferences

    _merge_engagement_policy_payload = staticmethod(web_runtime_scheduler.merge_engagement_policy_payload)

    _load_engagement_policy_locked = web_runtime_scheduler.load_engagement_policy_locked

    get_engagement_policy = web_runtime_scheduler.get_engagement_policy

    set_engagement_policy = web_runtime_scheduler.set_engagement_policy

    apply_scheduler_preferences = web_runtime_scheduler.apply_scheduler_preferences

    test_scheduler_provider = web_runtime_scheduler.test_scheduler_provider

    get_scheduler_provider_logs = web_runtime_scheduler.get_scheduler_provider_logs

    get_scheduler_decisions = web_runtime_scheduler.get_scheduler_decisions

    get_scheduler_approvals = web_runtime_scheduler.get_scheduler_approvals

    _scheduler_family_policy_metadata = web_runtime_scheduler.scheduler_family_policy_metadata

    _apply_family_policy_action = web_runtime_scheduler.apply_family_policy_action

    get_scan_history = web_runtime_scheduler.get_scan_history

    _scheduler_tool_audit_snapshot = web_runtime_scheduler.scheduler_tool_audit_snapshot

    _normalize_project_report_headers = staticmethod(web_runtime_scheduler.normalize_project_report_headers)

    _job_worker_count = staticmethod(web_runtime_scheduler.job_worker_count)

    _scheduler_max_concurrency = staticmethod(web_runtime_scheduler.scheduler_max_concurrency)

    _scheduler_max_host_concurrency = staticmethod(web_runtime_scheduler.scheduler_max_host_concurrency)

    _scheduler_max_jobs = staticmethod(web_runtime_scheduler.scheduler_max_jobs)

    _project_report_delivery_config = staticmethod(web_runtime_scheduler.project_report_delivery_config)

    _scheduler_feedback_config = staticmethod(web_runtime_scheduler.scheduler_feedback_config)

    _is_host_scoped_scheduler_tool = staticmethod(web_runtime_scheduler.is_host_scoped_scheduler_tool)

    _sanitize_provider_config = staticmethod(web_runtime_scheduler.sanitize_provider_config)

    _sanitize_integration_config = staticmethod(web_runtime_scheduler.sanitize_integration_config)

    _scheduler_integration_api_key = staticmethod(web_runtime_scheduler.scheduler_integration_api_key)

    _shodan_integration_enabled = web_runtime_scheduler.shodan_integration_enabled

    _grayhatwarfare_integration_enabled = web_runtime_scheduler.grayhatwarfare_integration_enabled

    _scheduler_command_placeholders = web_runtime_scheduler.scheduler_command_placeholders

    _scheduler_preferences = web_runtime_scheduler.scheduler_preferences

    _device_category_options = web_runtime_scheduler.device_category_options_for_runtime

    _built_in_device_category_options = staticmethod(web_runtime_scheduler.built_in_device_category_options)

    _ensure_scheduler_table = web_runtime_scheduler.ensure_scheduler_table

    _ensure_scheduler_approval_store = web_runtime_scheduler.ensure_scheduler_approval_store
