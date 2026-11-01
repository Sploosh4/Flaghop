"""Configurable transfer admission budgets; 16 MiB scan retention is separate."""

from pydantic import Field
from app.contracts.base import ActionRequest


class TransferLimits(ActionRequest):
    upload_bytes: int = Field(default=64 * 1024 * 1024, ge=1, le=1024 * 1024 * 1024)
    expanded_bytes: int = Field(default=256 * 1024 * 1024, ge=1, le=1024 * 1024 * 1024)
    entry_bytes: int = Field(default=128 * 1024 * 1024, ge=1, le=1024 * 1024 * 1024)
    members: int = Field(default=10000, ge=1, le=100000)
    compression_ratio: int = Field(default=1000, ge=1, le=10000)
    free_headroom_bytes: int = Field(default=16 * 1024 * 1024, ge=0, le=256 * 1024 * 1024)


class StorageLeaseRecord(ActionRequest):
    pid: int = Field(ge=1)
    stamp: str = Field(min_length=1, max_length=100)
    device: int = Field(ge=0)
    remaining: int = Field(ge=0, le=2_000_000_000)
    upload: bool
