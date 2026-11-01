from __future__ import annotations

from typing import Any, Dict

from app.contracts.observations.queries import WorkspaceFindingsQuery
from app.web.workspace_schema import WorkspaceHostsQuery, WorkspaceServicesQuery


class WorkspaceService:
    def __init__(self, runtime):
        self.runtime = runtime

    def _get_workspace_hosts_rows(self, query: WorkspaceHostsQuery):
        if query.limit is None:
            return self.runtime.get_workspace_hosts(
                include_down=query.include_down,
                service=query.service_filter,
                category=query.category_filter,
            )
        return self.runtime.get_workspace_hosts(
            limit=query.limit,
            include_down=query.include_down,
            service=query.service_filter,
            category=query.category_filter,
        )

    def list_workspace_hosts(self, args) -> Dict[str, Any]:
        query = WorkspaceHostsQuery.from_args(args)
        rows = self._get_workspace_hosts_rows(query)
        return {
            "filter": query.host_filter,
            "service": query.service_filter,
            "services": list(query.service_filters),
            "category": query.category_filter,
            "hosts": rows,
        }

    def get_workspace_overview(self) -> Dict[str, Any]:
        return self.runtime.get_workspace_overview()

    def list_workspace_services(self, args) -> Dict[str, Any]:
        query = WorkspaceServicesQuery.from_args(args)
        return {
            "services": self.runtime.get_workspace_services(
                limit=query.limit,
                host_id=query.host_id,
                category=query.category,
            ),
            "host_id": query.host_id,
            "category": query.category,
        }

    def get_host_workspace(self, host_id: int) -> Dict[str, Any]:
        return self.runtime.get_host_workspace(int(host_id))

    def get_host_target_state(self, host_id: int, limit: int = 500) -> Dict[str, Any]:
        return self.runtime.get_target_state_view(host_id=int(host_id), limit=int(limit or 500))

    def list_findings(self, args) -> Dict[str, Any]:
        query = WorkspaceFindingsQuery.from_args(args)
        return self.runtime.get_findings(host_id=query.host_id, limit_findings=query.limit)
