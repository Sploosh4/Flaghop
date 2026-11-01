"""Display preference mutation input and response."""

from typing import Literal
from app.contracts.base import ActionModel, ActionRequest
from app.contracts.actions.inputs import LegacyBool


class DisplaySettingsRequest(ActionRequest):
    colorful_ascii_background: LegacyBool = False


class DisplaySettingsResponse(ActionModel):
    status: Literal["ok"] = "ok"
    colorful_ascii_background: bool
