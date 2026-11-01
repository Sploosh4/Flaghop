from __future__ import annotations
from app.web.http_utils import clamp_int
from dataclasses import dataclass


@dataclass(frozen=True)
class ProjectListQuery:
    limit: int

    @classmethod
    def from_args(cls, args) -> "ProjectListQuery":
        return cls(limit=clamp_int(args.get("limit"), 500, 1, 5000))
