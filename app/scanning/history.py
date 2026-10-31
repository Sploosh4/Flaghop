"""Bounded metadata cache for polling; full evidence is read only for details."""

from collections import OrderedDict
import json
import heapq
import os
from pathlib import Path
import re

MAX_RECORD = 4 * 1024 * 1024
MAX_CACHE = 4 * 1024 * 1024
META_FIELDS = (
    "id",
    "project_id",
    "host_id",
    "target_ip",
    "status",
    "job_id",
    "created_at",
    "settlement",
    "import_progress",
    "directory",
    "profile_path",
    "profile_sha256",
    "log_path",
    "reason",
    "recovery",
)


def read_record(path):
    with Path(path).open("rb") as stream:
        raw = stream.read(MAX_RECORD + 1)
    if len(raw) > MAX_RECORD:
        raise ValueError("Saved Deep scan metadata exceeds its 4 MiB limit.")
    return json.loads(raw)


def compact_record(record):
    row = {name: record[name] for name in META_FIELDS if name in record}
    # Long tool errors belong in the detail/log view, not every polling response.
    row["reason"] = str(row.get("reason", ""))[:4096]
    row.update(summary={}, summary_omitted=True, settling=bool(record.get("settling", False)))
    return row


class ScanHistory:
    def __init__(self, max_bytes=MAX_CACHE):
        self.max_bytes = max_bytes
        self.bytes = 0
        self.entries = OrderedDict()

    def metadata(self, path):
        info = path.stat()
        signature = (info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns)
        key = str(path)
        entry = self.entries.get(key)
        if entry and entry[0] == signature:
            self.entries.move_to_end(key)
            return dict(entry[1])
        if entry:
            self.bytes -= self.entries.pop(key)[2]
        row = compact_record(read_record(path))
        size = len(json.dumps(row).encode()) + len(key.encode()) + 128
        while self.entries and self.bytes + size > self.max_bytes:
            self.bytes -= self.entries.popitem(last=False)[1][2]
        if size <= self.max_bytes:
            self.entries[key] = (signature, row, size)
            self.bytes += size
        return dict(row)

    def records(self, owner, folder):
        if not folder.exists():
            self.entries.clear()
            self.bytes = 0
            return []
        # Only keep the best 200 rows and stale cached keys. Neither collection
        # grows with the number of directories on disk.
        unseen = set(self.entries)

        def rows(entries):
            for entry in entries:
                directory = Path(entry.path)
                if (
                    directory.is_symlink()
                    or not directory.is_dir()
                    or not re.fullmatch(r"[a-f0-9]{32}", directory.name)
                ):
                    continue
                path = owner.path(str(directory.relative_to(owner.root) / "run.json"))
                if not path.is_file():
                    continue
                unseen.discard(str(path))
                row = self.metadata(path)
                if row.get("id") != directory.name:
                    raise ValueError("Saved scan identifier differs from its folder.")
                if row.get("project_id") == owner.identifier:
                    yield row

        with os.scandir(folder) as entries:
            result = heapq.nlargest(
                200, rows(entries), key=lambda row: (row["status"] in {"queued", "running"}, row["created_at"])
            )
        for key in unseen:
            entry = self.entries.pop(key, None)
            if entry:
                self.bytes -= entry[2]
        return result
