"""Shared native API runtime dependency and response conventions."""

from typing import Annotated
from fastapi import Depends, Request, Response
from app.api.protocol import ProtocolRouter
from app.api.contracts import ApiError


def mark_native(response: Response):
    response.headers["X-Legion-API"] = "fastapi"


def get_runtime(request: Request):
    runtime = request.app.state.runtime
    if runtime is None:
        raise RuntimeError("No workspace runtime is available.")
    return runtime


Runtime = Annotated[object, Depends(get_runtime)]


def native_router():
    return ProtocolRouter(
        dependencies=[Depends(mark_native)],
        responses={
            400: {"model": ApiError},
            404: {"model": ApiError},
            409: {"model": ApiError},
            422: {"model": ApiError},
        },
    )
