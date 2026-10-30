"""Scheduler AI providers: http."""

from __future__ import annotations

import sys

from app.scheduler.provider_support.constants import (
    ProviderError,
)


def _load_requests_module():
    try:
        import requests as requests_module
    except Exception as exc:  # pragma: no cover - depends on local environment packaging
        raise ProviderError(
            f"requests dependency unavailable under {sys.executable} ({sys.version.split()[0]}): {exc}"
        ) from exc
    return requests_module


class _RequestsProxy:
    def get(self, *args, **kwargs):
        return _load_requests_module().get(*args, **kwargs)

    def post(self, *args, **kwargs):
        return _load_requests_module().post(*args, **kwargs)

    def request(self, *args, **kwargs):
        return _load_requests_module().request(*args, **kwargs)

    def __getattr__(self, item):
        return getattr(_load_requests_module(), str(item))


requests = _RequestsProxy()


def _get_requests_module():
    return requests
