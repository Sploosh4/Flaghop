"""Declarative relationships around existing action definitions."""

from typing import List, Literal, Optional

from pydantic import Field

from app.contracts.base import ActionModel


class IntegrationMetadata(ActionModel):
    id: str = Field(min_length=1, max_length=128)
    description: Optional[str] = None


class ModuleMetadata(ActionModel):
    id: str = Field(min_length=1, max_length=128)
    integration_ids: List[str] = Field(default_factory=list)
    action_ids: List[str] = Field(default_factory=list)
    depends_on: List[str] = Field(default_factory=list)


class CategoryProposal(ActionModel):
    id: str = Field(min_length=1, max_length=128)
    definition: str = Field(min_length=1)
    action_ids: List[str] = Field(default_factory=list)
    module_ids: List[str] = Field(default_factory=list)


class CapabilityManifest(ActionModel):
    version: Literal[1]
    integrations: List[IntegrationMetadata] = Field(default_factory=list)
    modules: List[ModuleMetadata] = Field(default_factory=list)
    categories: List[CategoryProposal] = Field(default_factory=list)
