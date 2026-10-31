"""Bounded, nonblocking local proxy IPC. Never evaluate shell or caller paths."""

import json
import os
from pathlib import Path
import secrets
import stat
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

MAX_MESSAGE = 2048


class ProxyMessage(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    token: str
    sequence: str = Field(pattern=r"^[a-f0-9]{32}$")
    operation: Literal["open", "close"]
    port: int = Field(ge=1, le=65535)


def read_json(path):
    """Inspect and read the same descriptor; reject links, devices and FIFOs."""
    try:
        fd = os.open(Path(path), os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC)
    except FileNotFoundError:
        return None
    with os.fdopen(fd, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_MESSAGE or info.st_nlink != 1:
            raise ValueError("Proxy IPC must be one bounded ordinary file.")
        data = stream.read(MAX_MESSAGE + 1)
    if len(data) > MAX_MESSAGE:
        raise ValueError("Proxy IPC grew past its size limit.")
    value = json.loads(data)
    if not isinstance(value, dict):
        raise ValueError("Proxy IPC must be a JSON object.")
    return value


def registration(path, token):
    value = read_json(path)
    if value is None:
        return None
    message = ProxyMessage.model_validate(value)
    if not secrets.compare_digest(message.token.encode(), token.encode()):
        raise ValueError("Invalid scan proxy ownership token.")
    return message
