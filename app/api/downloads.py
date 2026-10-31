"""Delete only disposable exports, including interrupted ASGI transfers."""

from pathlib import Path
import anyio
from starlette.concurrency import run_in_threadpool
from starlette.responses import FileResponse


class TemporaryFileResponse(FileResponse):
    async def __call__(self, scope, receive, send):
        try:
            await super().__call__(scope, receive, send)
        finally:
            # FileResponse background tasks run only after a successful send.
            # Shield cleanup from request cancellation, keeping file I/O off
            # the event loop. Ordinary evidence downloads never use this class.
            with anyio.CancelScope(shield=True):
                await run_in_threadpool(Path(self.path).unlink, missing_ok=True)
