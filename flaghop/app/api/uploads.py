"""Stream raw/multipart ZIP uploads directly into admitted owned storage."""

from contextlib import asynccontextmanager
import anyio
from python_multipart.multipart import MultipartParser, parse_options_header
from starlette.concurrency import run_in_threadpool
from app.services.archive_storage import inspect_archive
from app.services.storage_admission import StorageRejected


class MultipartUpload:
    """Runtime parser state; every callback runs in the disk worker thread."""

    def __init__(self, boundary, stage):
        self.stage, self.parts, self.complete = stage, 0, False
        self.headers, self.field, self.value = {}, bytearray(), bytearray()
        callbacks = {
            name: getattr(self, name)
            for name in (
                "on_part_begin",
                "on_header_field",
                "on_header_value",
                "on_header_end",
                "on_headers_finished",
                "on_part_data",
                "on_end",
            )
        }
        self.parser = MultipartParser(boundary, callbacks, max_header_count=8, max_header_size=8192)

    def on_part_begin(self):
        self.parts += 1
        if self.parts != 1:
            raise ValueError("Only the bundle file field is supported.")

    def on_header_field(self, data, start, end):
        self.field.extend(data[start:end])

    def on_header_value(self, data, start, end):
        self.value.extend(data[start:end])

    def on_header_end(self):
        self.headers[bytes(self.field).lower()] = bytes(self.value)
        self.field.clear()
        self.value.clear()

    def on_headers_finished(self):
        disposition, options = parse_options_header(self.headers.get(b"content-disposition"))
        if disposition != b"form-data" or options.get(b"name") != b"bundle":
            raise ValueError("Field 'bundle' is required.")
        if not options.get(b"filename", b"").strip():
            raise ValueError("Uploaded bundle filename is required.")

    def on_part_data(self, data, start, end):
        self.stage.write(data[start:end])

    def on_end(self):
        self.complete = True

    def write(self, chunk):
        for offset in range(0, len(chunk), 65536):
            self.parser.write(chunk[offset : offset + 65536])

    def finish(self):
        self.parser.finalize()
        if not self.complete or self.parts != 1:
            raise ValueError("Incomplete multipart bundle upload.")


@asynccontextmanager
async def staged_upload(request, *, multipart=False):
    admission = request.app.state.storage_admission
    budget = admission.limits.upload_bytes + (65536 if multipart else 0)
    length = request.headers.get("content-length")
    if length is not None and (not length.isascii() or not length.isdigit()):
        raise ValueError("Invalid upload Content-Length.")
    if length is not None and int(length) > budget:
        raise StorageRejected("Upload exceeds its byte limit.")
    boundary = None
    if multipart:
        kind, options = parse_options_header(request.headers.get("content-type"))
        boundary = options.get(b"boundary")
        if kind != b"multipart/form-data" or not boundary or len(boundary) > 200:
            raise ValueError("A multipart bundle upload is required.")
    stage = await run_in_threadpool(admission.stage)
    try:
        parser = MultipartUpload(boundary, stage) if multipart else None
        count = 0
        async for chunk in request.stream():
            count += len(chunk)
            if count > budget:
                raise StorageRejected("Upload exceeds its byte limit.")
            await run_in_threadpool(parser.write if parser else stage.write, chunk)
        if parser:
            await run_in_threadpool(parser.finish)
        await run_in_threadpool(stage.seal)
        await run_in_threadpool(inspect_archive, stage.path, admission)
        yield stage
    finally:
        with anyio.CancelScope(shield=True):
            await run_in_threadpool(stage.close)
