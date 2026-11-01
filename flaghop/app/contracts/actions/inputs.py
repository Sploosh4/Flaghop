"""Explicit legacy scalar representations accepted at action input boundaries."""

from typing import Annotated, Literal
from pydantic import BeforeValidator, Field
from app.contracts.base import ActionRequest


def legacy_boolean(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        values = {
            "true": True,
            "1": True,
            "yes": True,
            "on": True,
            "false": False,
            "0": False,
            "no": False,
            "off": False,
        }
        if value in values:
            return values[value]
    raise ValueError("Use a boolean or an explicitly supported boolean text value.")


def legacy_integer(value):
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    if isinstance(value, str) and value.isascii() and value.isdigit():
        return int(value)
    raise ValueError("Use an integer or decimal integer text.")


def legacy_port(value):
    number = legacy_integer(value)
    if not 1 <= number <= 65535:
        raise ValueError("Port must be within 1..65535.")
    return str(number)


DecimalText = Annotated[str, Field(pattern=r"^[0-9]+$")]
LegacyInt = Annotated[int, BeforeValidator(legacy_integer, json_schema_input_type=int | DecimalText)]
LegacyBool = Annotated[
    bool,
    BeforeValidator(
        legacy_boolean, json_schema_input_type=bool | Literal["true", "false", "1", "0", "yes", "no", "on", "off"]
    ),
]
PortText = Annotated[str, BeforeValidator(legacy_port, json_schema_input_type=int | DecimalText)]


def target_tokens(value):
    if isinstance(value, str):
        return value.replace(",", " ").split()
    if isinstance(value, list):
        return value
    raise ValueError("Targets must be an array of text targets or explicit legacy target text.")


NmapTargets = Annotated[
    list[Annotated[str, Field(min_length=1, max_length=65536)]],
    BeforeValidator(target_tokens, json_schema_input_type=list[str] | str),
]


class EmptyAction(ActionRequest):
    """An action with no user-supplied options rejects unexpected input."""
