"""Finding query data, independent of HTTP."""

from typing import Any
from app.contracts.base import ObservationModel
from app.core.contract_values import clamp_int


class WorkspaceFindingsQuery(ObservationModel):
    host_id: int
    limit: int

    @classmethod
    def from_args(cls, args: Any) -> "WorkspaceFindingsQuery":
        return cls(
            host_id=clamp_int(args.get("host_id", 0), 0, 0, 10**9),
            limit=clamp_int(args.get("limit", 1000), 1000, 1, 10000),
        )
