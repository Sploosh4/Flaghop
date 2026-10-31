"""Artifacts operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_artifacts as web_runtime_artifacts


class ArtifactsRuntime:
    _path_within = staticmethod(web_runtime_artifacts.path_within)

    _is_project_artifact_path = web_runtime_artifacts.is_project_artifact_path

    _collect_command_artifacts = staticmethod(web_runtime_artifacts.collect_command_artifacts)

    _host_target_item_matches_port = staticmethod(web_runtime_artifacts.host_target_item_matches_port)

    _delete_project_artifact_refs = web_runtime_artifacts.delete_project_artifact_refs

    _prune_target_state_for_port = web_runtime_artifacts.prune_target_state_for_port

    delete_workspace_port = web_runtime_artifacts.delete_workspace_port

    delete_workspace_service = web_runtime_artifacts.delete_workspace_service
