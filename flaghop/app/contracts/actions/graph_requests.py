"""Evidence graph mutation inputs, distinct from graph/query compositions."""

from app.contracts.actions.inputs import LegacyInt
from app.contracts.base import ActionRequest
from pydantic import Field, JsonValue
from typing import Literal


class GraphRebuildRequest(ActionRequest):
    host_id: LegacyInt = Field(default=0, ge=0)


class GraphLayoutSaveRequest(ActionRequest):
    view_id: str = Field(min_length=1, max_length=512)
    name: str = Field(default="", max_length=256)
    layout_state: dict[str, JsonValue] = Field(default_factory=dict, alias="layout")
    layout_id: str = Field(default="", max_length=512)


class GraphAnnotationSaveRequest(ActionRequest):
    target_kind: Literal["node", "edge"]
    target_ref: str = Field(min_length=1, max_length=4096)
    body: str = Field(min_length=1, max_length=100000)
    created_by: str = Field(default="operator", max_length=256)
    source_ref: str = Field(default="", max_length=4096)
    annotation_id: str = Field(default="", max_length=512)
