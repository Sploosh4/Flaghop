"""Projects operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

import zipfile
from typing import Any, Dict, Tuple
from app.web import runtime_projects as web_runtime_projects


class ProjectsRuntime:
    _project_listing_row = staticmethod(web_runtime_projects.project_listing_row)

    list_projects = web_runtime_projects.list_projects

    get_project_details = web_runtime_projects.get_project_details

    rename_project = web_runtime_projects.rename_project

    create_new_temporary_project = web_runtime_projects.create_new_temporary_project

    open_project = web_runtime_projects.open_project

    start_save_project_as_job = web_runtime_projects.start_save_project_as_job

    save_project_as = web_runtime_projects.save_project_as

    build_project_bundle_zip = web_runtime_projects.build_project_bundle_zip

    start_restore_project_zip_job = web_runtime_projects.start_restore_project_zip_job

    restore_project_bundle_zip = web_runtime_projects.restore_project_bundle_zip

    _restore_project_bundle_zip_job = web_runtime_projects.restore_project_bundle_zip_job

    _restore_project_bundle_zip = web_runtime_projects.restore_project_bundle_zip_impl

    _save_project_as = web_runtime_projects.save_project_as_impl

    _count_running_scan_jobs = web_runtime_projects.count_running_scan_jobs

    _has_running_autosave_job = web_runtime_projects.has_running_autosave_job

    _get_autosave_interval_seconds = web_runtime_projects.get_autosave_interval_seconds

    def _resolve_autosave_target_path(self, project) -> str:
        return web_runtime_projects.resolve_autosave_target_path(project)

    _run_project_autosave = web_runtime_projects.run_project_autosave

    _maybe_schedule_autosave_locked = web_runtime_projects.maybe_schedule_autosave_locked

    _project_metadata = web_runtime_projects.project_metadata

    _normalize_restore_compare_path = staticmethod(web_runtime_projects.normalize_restore_compare_path)

    _looks_like_absolute_path = staticmethod(web_runtime_projects.looks_like_absolute_path)

    _path_tail = staticmethod(web_runtime_projects.path_tail)

    _build_restore_root_mappings = staticmethod(web_runtime_projects.build_restore_root_mappings)

    _build_restore_text_replacements = staticmethod(web_runtime_projects.build_restore_text_replacements)

    _replace_restore_roots_in_text = staticmethod(web_runtime_projects.replace_restore_roots_in_text)

    _build_restore_basename_index = staticmethod(web_runtime_projects.build_restore_basename_index)

    _match_rebased_candidate = staticmethod(web_runtime_projects.match_rebased_candidate)

    _rebase_restored_file_reference = staticmethod(web_runtime_projects.rebase_restored_file_reference)

    _rewrite_restored_json_value = staticmethod(web_runtime_projects.rewrite_restored_json_value)

    _sqlite_table_columns = staticmethod(web_runtime_projects.sqlite_table_columns)

    _rewrite_restored_json_text = staticmethod(web_runtime_projects.rewrite_restored_json_text)

    _rewrite_sqlite_table_rows = staticmethod(web_runtime_projects.rewrite_sqlite_table_rows)

    _rebase_restored_project_paths = staticmethod(web_runtime_projects.rebase_restored_project_paths)

    _attach_restored_running_folder_locked = web_runtime_projects.attach_restored_running_folder_locked

    _count_running_or_waiting_processes = staticmethod(web_runtime_projects.count_running_or_waiting_processes)

    _zip_add_file_if_exists = staticmethod(web_runtime_projects.zip_add_file_if_exists)

    _zip_add_dir_if_exists = staticmethod(web_runtime_projects.zip_add_dir_if_exists)

    _bundle_prefix = staticmethod(web_runtime_projects.bundle_prefix)

    _safe_bundle_filename = staticmethod(web_runtime_projects.safe_bundle_filename)

    _safe_bundle_relative_path = staticmethod(web_runtime_projects.safe_bundle_relative_path)

    def _read_bundle_manifest(self, archive: zipfile.ZipFile) -> Tuple[str, str, Dict[str, Any]]:
        return web_runtime_projects.read_bundle_manifest(archive)

    def _locate_bundle_session_member(
        self, archive: zipfile.ZipFile, root_prefix: str, manifest: Dict[str, Any]
    ) -> str:
        _ = self
        return web_runtime_projects.locate_bundle_session_member(
            archive,
            root_prefix,
            manifest,
        )

    def _extract_zip_member_to_file(self, archive: zipfile.ZipFile, member_name: str, destination_path: str):
        return web_runtime_projects.extract_zip_member_to_file(archive, member_name, destination_path)

    def _extract_zip_prefix_to_dir(self, archive: zipfile.ZipFile, prefix: str, destination_dir: str):
        _ = self
        return web_runtime_projects.extract_zip_prefix_to_dir(archive, prefix, destination_dir)

    _close_active_project = web_runtime_projects.close_active_project

    _require_active_project = web_runtime_projects.require_active_project

    _is_temp_project = web_runtime_projects.is_temp_project

    _normalize_project_path = staticmethod(web_runtime_projects.normalize_project_path)

    _normalize_existing_file = staticmethod(web_runtime_projects.normalize_existing_file)
