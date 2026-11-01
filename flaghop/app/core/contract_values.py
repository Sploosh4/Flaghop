"""Pure input conversions shared by domain contracts and transport adapters."""

import ipaddress
from pathlib import PurePosixPath


def as_bool(value, default: bool = False) -> bool:
    if value is None:
        return bool(default)
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return bool(default)


def clamp_int(value, default: int, minimum: int, maximum: int) -> int:
    try:
        resolved = int(value if value not in (None, "") else default)
    except (TypeError, ValueError):
        resolved = int(default)
    return max(int(minimum), min(int(maximum), resolved))


def literal_ip(value):
    address = ipaddress.ip_address(value)
    if address.is_multicast or address.is_unspecified or "%" in value or value == "255.255.255.255":
        raise ValueError("Use one literal unicast IP without a zone, hostname or range.")
    return str(address)


def raw_reference(value):
    if value:
        project_relative_path(value)
    if value and (
        not value.startswith("raw/") or ".." in PurePosixPath(value).parts or "\\" in value or "\x00" in value
    ):
        raise ValueError("Scanner task references evidence outside its raw output.")
    return value


def project_relative_path(value):
    path = PurePosixPath(value)
    if (
        not value
        or not path.parts
        or path.as_posix() != value
        or path.is_absolute()
        or ".." in path.parts
        or "\\" in value
        or "\x00" in value
        or len(value) >= 2
        and value[0].isalpha()
        and value[1] == ":"
    ):
        raise ValueError("Evidence must use a relative project path without traversal.")
    return value
