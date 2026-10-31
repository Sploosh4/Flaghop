from __future__ import annotations

from typing import Any, Dict

from app.contracts.actions.host_action_requests import (
    HostCategoriesRequest,
    HostNoteRequest,
    ScriptCreateRequest,
    ScriptOutputQuery,
    WorkspacePortMutationRequest,
)


class HostActionService:
    def __init__(self, runtime):
        self.runtime = runtime

    def delete_workspace_port(self, payload: Any) -> Dict[str, Any]:
        request = WorkspacePortMutationRequest.from_payload(payload)
        return self.runtime.delete_workspace_port(
            host_id=request.host_id,
            port=request.port,
            protocol=request.protocol,
        )

    def delete_workspace_service(self, payload: Any) -> Dict[str, Any]:
        request = WorkspacePortMutationRequest.from_payload(payload)
        return self.runtime.delete_workspace_service(
            host_id=request.host_id,
            port=request.port,
            protocol=request.protocol,
            service=request.service,
        )

    def get_script_output(self, script_id: int, args) -> Dict[str, Any]:
        query = ScriptOutputQuery.from_args(args)
        return self.runtime.get_script_output(script_id, offset=query.offset, max_chars=query.max_chars)

    def delete_host_workspace(self, host_id: int) -> Dict[str, Any]:
        return self.runtime.delete_host_workspace(int(host_id))
