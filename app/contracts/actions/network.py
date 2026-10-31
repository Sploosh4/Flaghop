"""Project network contracts shared by settings, jobs and the command runner."""

import ipaddress
import re
from typing import Annotated, Literal
from app.contracts.base import ActionModel
from app.contracts.observations.network import NetworkReport
from pydantic import ConfigDict, Field, field_validator


def scope_token(value):
    token = str(value).strip().lower().rstrip(".")
    try:
        return str(ipaddress.ip_network(token, strict=False))
    except ValueError:
        if len(token) > 253 or not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", token):
            raise ValueError("Use an IP address, CIDR range or exact hostname.")
        if any(not part or len(part) > 63 or part.startswith("-") or part.endswith("-") for part in token.split(".")):
            raise ValueError("Invalid hostname.")
        return token


class RequiredService(ActionModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    target: str = Field(min_length=1, max_length=253)
    port: int = Field(ge=1, le=65535, strict=True)


class NetworkPreferences(ActionModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(default="", max_length=120)
    scope_source: str = Field(default="", max_length=1000)
    allowed_targets: list[str] = Field(default_factory=list, max_length=64)
    exclusions: list[str] = Field(default_factory=list, max_length=64)
    allowed_ports: list[Annotated[int, Field(strict=True, ge=1, le=65535)]] = Field(
        default_factory=list, max_length=128
    )
    mode: Literal["local", "openvpn", "wireguard"] = "local"
    interface: str = Field(default="", max_length=15, pattern=r"^[a-zA-Z0-9_.:-]*$")
    profile_id: str = Field(default="", max_length=4096)
    execution_environment: Literal["local"] = "local"
    required_services: list[RequiredService] = Field(default_factory=list, max_length=16)

    @field_validator("allowed_targets", "exclusions")
    @classmethod
    def normalize_scope(cls, values):
        return list(dict.fromkeys(scope_token(value) for value in values))

    @field_validator("allowed_ports")
    @classmethod
    def validate_ports(cls, values):
        if any(isinstance(port, bool) or not 1 <= port <= 65535 for port in values):
            raise ValueError("Ports must be between 1 and 65535.")
        return sorted(set(values))


class NetworkUpdate(ActionModel):
    model_config = ConfigDict(extra="forbid")
    expected_revision: int = Field(ge=0, strict=True)
    settings: NetworkPreferences


class NetworkCheckRequest(ActionModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    target: str = Field(min_length=1, max_length=253)
    port: int | None = Field(default=None, ge=1, le=65535, strict=True)


class NetworkContext(ActionModel):
    project_id: str
    config_id: str
    revision: int
    connector: Literal["networkmanager", "openvpn", "wireguard"]
    configured: bool
    settings: NetworkPreferences
    enforcement_available: bool
    enforcement_reason: str
    recent_checks: list[NetworkReport] = Field(default_factory=list)
