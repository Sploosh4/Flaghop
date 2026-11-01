"""Named mutation results; historical server metadata is retained explicitly."""

from typing import Literal
from pydantic import ConfigDict, Field, JsonValue
from app.contracts.base import ActionModel
from app.contracts.actions.scheduler_preferences import SchedulerPreferencesPatch, EngagementPolicyPatch


class GraphRebuildResult(ActionModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["ok"] = "ok"
    host_id: int | None = None


class GraphLayoutRecord(ActionModel):
    model_config = ConfigDict(extra="allow")
    layout_id: str
    view_id: str = ""
    name: str = ""
    layout: dict[str, JsonValue] = Field(default_factory=dict)


class GraphLayoutResult(ActionModel):
    status: Literal["ok"] = "ok"
    layout: GraphLayoutRecord


class GraphAnnotationRecord(ActionModel):
    model_config = ConfigDict(extra="allow")
    annotation_id: str
    target_kind: str = ""
    target_ref: str = ""
    body: str = ""
    created_by: str = ""
    source_ref: str = ""


class GraphAnnotationResult(ActionModel):
    status: Literal["ok"] = "ok"
    annotation: GraphAnnotationRecord


class WorkspaceMutationResult(ActionModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["ok"] = "ok"
    host_id: int | None = None
    port: str = ""
    protocol: str = ""
    service: str = ""
    deleted: JsonValue = None
    removed: bool = False


class SchedulerPreferencesResult(SchedulerPreferencesPatch):
    model_config = ConfigDict(extra="allow")
    # Old snapshots can retain retired flag names as historical metadata.
    feature_flags: dict[str, bool] = Field(default_factory=dict)


class EngagementPolicyResult(EngagementPolicyPatch):
    model_config = ConfigDict(extra="allow")


class FamilyApprovalResult(ActionModel):
    status: Literal["ok"] = "ok"
    family_id: str
