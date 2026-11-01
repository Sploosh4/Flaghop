"""Historical action attempts and manual suggestions, without execution behaviour."""

from app.contracts.base import ActionModel, ProvenanceModel
from app.contracts.artifacts.references import ArtifactLocator


class ManualTestSuggestion(ActionModel, ProvenanceModel):
    why: str
    command: str
    scope_note: str


class AttemptedAction(ActionModel, ProvenanceModel):
    tool_id: str
    label: str
    action_id: str
    family_id: str
    command_signature: str
    status: str
    attempted_at: str
    port: str
    protocol: str
    service: str
    origin_mode: str
    approval_state: str
    reason: str
    coverage_gap: str
    pack_ids: list[str]
    artifact_refs: list[ArtifactLocator]
