"""Pipette action definitions and pure parameter/command formatting."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import re
import shlex
from app.contracts.base import ActionData

_DEFAULT_PARAMETER_VALUE_RE = r"^[A-Za-z0-9._:@/-]{1,256}$"


@dataclass(frozen=True)
class PipetteSpec(ActionData):
    pipette_id: str
    label: str
    description: str
    entrypoint: str
    service_scope: List[str] = field(default_factory=list)
    protocol_scope: List[str] = field(default_factory=lambda: ["tcp"])
    target_ports: List[str] = field(default_factory=list)
    required_tools: List[str] = field(default_factory=list)
    optional_tools: List[str] = field(default_factory=list)
    risk_tags: List[str] = field(default_factory=list)
    impact_level: str = "low"
    noise_level: str = "low"
    mode: str = "check"
    default_timeout: int = 300
    parameters: List[Dict[str, Any]] = field(default_factory=list)
    source_dir: str = ""

    @property
    def tool_id(self) -> str:
        return self.pipette_id

    @property
    def command_template(self) -> str:
        return f"bash {shlex.quote(self.entrypoint)} " "--target '[IP]' --port '[PORT]' --output '[OUTPUT].txt'"

    def validate_parameter_values(self, values: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        source = values if isinstance(values, dict) else {}
        resolved: Dict[str, str] = {}
        for parameter in self.parameters:
            name = str(parameter.get("name", "") or "").strip()
            if not name:
                continue
            raw_value = str(source.get(name, "") or "").strip()
            if not raw_value:
                if bool(parameter.get("required", False)):
                    raise ValueError(f"{name} is required for {self.tool_id}.")
                continue
            pattern = str(parameter.get("value_pattern", "") or "") or _DEFAULT_PARAMETER_VALUE_RE
            if not re.fullmatch(pattern, raw_value):
                raise ValueError(f"{name} has an invalid value.")
            resolved[name] = raw_value
        return resolved

    def command_template_for_values(self, values: Optional[Dict[str, Any]] = None) -> str:
        command = self.command_template
        resolved = self.validate_parameter_values(values)
        for parameter in self.parameters:
            name = str(parameter.get("name", "") or "").strip()
            if name not in resolved:
                continue
            command = f"{command} {str(parameter.get('flag'))} {shlex.quote(resolved[name])}"
        return command

    def as_port_action(self) -> List[str]:
        return [
            self.label,
            self.tool_id,
            self.command_template,
            ",".join(self.service_scope),
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pipette_id": self.pipette_id,
            "tool_id": self.tool_id,
            "label": self.label,
            "description": self.description,
            "entrypoint": self.entrypoint,
            "service_scope": list(self.service_scope),
            "protocol_scope": list(self.protocol_scope),
            "target_ports": list(self.target_ports),
            "required_tools": list(self.required_tools),
            "optional_tools": list(self.optional_tools),
            "risk_tags": list(self.risk_tags),
            "impact_level": self.impact_level,
            "noise_level": self.noise_level,
            "mode": self.mode,
            "default_timeout": int(self.default_timeout),
            "parameters": [dict(item) for item in self.parameters],
            "source_dir": self.source_dir,
        }
