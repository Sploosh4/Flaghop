"""Owned crash-recovery authority lives outside copied/exported workspaces."""

import json
import os
from pathlib import Path
import secrets
import select
import stat
import sys
import threading
import uuid
from app.contracts.actions.execution_journal import ExecutionJournalRecord
from app.services.project_background import atomic_json
from app.services.storage_admission import process_stamp

ROOT = Path(__file__).resolve().parents[2]


class ExecutionJournal:
    def __init__(self, root=None):
        self.root = Path(root or ROOT / ".state/executions")
        self.lock = threading.RLock()

    def _path(self, identifier):
        import re

        if not re.fullmatch("[a-f0-9]{32}", identifier):
            raise ValueError("Invalid protected execution identifier.")
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        if any(path.is_symlink() for path in [self.root, *self.root.parents]):
            raise ValueError("Linked execution journal directory is not trusted.")
        info = self.root.stat()
        if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077:
            raise ValueError("Execution journal must be private and owned by this user.")
        return self.root / (identifier + ".json")

    def get(self, identifier):
        path = self._path(identifier)
        descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(descriptor, "rb") as stream:
            info = os.fstat(stream.fileno())
            if (
                not stat.S_ISREG(info.st_mode)
                or info.st_uid != os.getuid()
                or info.st_nlink != 1
                or info.st_mode & 0o077
            ):
                raise ValueError("Execution journal file is not privately owned.")
            raw = stream.read(65537)
        if len(raw) > 65536:
            raise ValueError("Execution journal exceeds its bound.")
        row = ExecutionJournalRecord.model_validate_json(raw)
        if row.id != identifier or row.uid != os.getuid():
            raise ValueError("Execution journal identity differs from its owner.")
        return row

    def update(self, identifier, **fields):
        with self.lock:
            row = self.get(identifier).model_copy(update=fields)
            row = ExecutionJournalRecord.model_validate(row.model_dump())
            atomic_json(self._path(identifier), row.model_dump())
            self._sync(identifier)
            return row

    def _sync(self, identifier):
        # Both file contents and the rename must survive a process/machine crash.
        with self._path(identifier).open("rb") as stream:
            os.fsync(stream.fileno())
        descriptor = os.open(self.root, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)

    def create(self, project_path, **context):
        row = ExecutionJournalRecord(
            id=uuid.uuid4().hex,
            token=secrets.token_hex(32),
            uid=os.getuid(),
            owner_pid=os.getpid(),
            owner_stamp=process_stamp(os.getpid()),
            project_path=str(project_path),
            **context,
        )
        atomic_json(self._path(row.id), row.model_dump())
        self._sync(row.id)
        return row

    def launched(self, identifier, process):
        return self.update(
            identifier,
            pid=process.pid,
            pid_stamp=process_stamp(process.pid) or "",
            pgid=os.getpgid(process.pid),
            phase="running",
        )

    def cleanup(self, identifier):
        from app.services.network_probe import command

        row = self.get(identifier)
        try:
            # The helper revalidates identities using pidfds before signalling.
            # sudo remains noninteractive; missing permission is a visible hold.
            command(
                [sys.executable, "-I", str(ROOT / "app/processes/reap_owned.py")],
                admin=bool(row.gid),
                input=row.model_dump_json(),
            )
        except Exception as exc:
            self.update(identifier, phase="cleanup_required", reason=str(exc))
            raise RuntimeError("Owned process/lease cleanup needs attention: " + str(exc)) from exc
        return self.update(identifier, phase="cleaned", reason="", table="", hosts_folder="", scratch="")

    def finish(self, identifier):
        row = self.get(identifier)
        if row.phase not in {"cleaned", "settled"}:
            raise RuntimeError("Execution cannot settle before owned cleanup succeeds.")
        self.update(identifier, phase="settled")
        self._path(identifier).unlink()

    def orphans(self):
        if not self.root.exists():
            return []
        rows = []
        for path in self.root.glob("*.json"):
            row = self.get(path.stem)
            stamp = process_stamp(row.owner_pid)
            exited = False
            if stamp == row.owner_stamp:
                try:
                    descriptor = os.pidfd_open(row.owner_pid)
                    try:
                        poll = select.poll()
                        poll.register(descriptor, select.POLLIN)
                        exited = bool(poll.poll(0))
                    finally:
                        os.close(descriptor)
                except ProcessLookupError:
                    exited = True
                except PermissionError:
                    continue
            if stamp != "unreadable" and (stamp != row.owner_stamp or exited):
                rows.append(row)
        return rows

    def pending(self, project_path):
        if not self.root.exists():
            return []
        return [
            row
            for path in self.root.glob("*.json")
            if (row := self.get(path.stem)).project_path == str(project_path) and row.phase != "settled"
        ]


def require_settled(runtime, project_path):
    journal = getattr(runtime, "execution_journal", None)
    if journal is not None and journal.pending(project_path):
        raise RuntimeError("Finish owned execution cleanup/recovery before saving, copying or moving this workspace.")


def require_network_ready(runtime, project_path, *, exclude=""):
    journal = getattr(runtime, "execution_journal", None)
    if journal is None:
        return
    active = {
        job.get("payload", {}).get("scan_id")
        for job in runtime.jobs.list_jobs()
        if job["status"] in {"queued", "running"}
    }
    current_stamp = process_stamp(os.getpid())
    for entry in journal.pending(project_path):
        if entry.id == exclude:
            continue
        if entry.phase == "cleaned":
            continue
        if (
            entry.phase == "cleanup_required"
            or entry.owner_pid != os.getpid()
            or entry.owner_stamp != current_stamp
            or entry.run_id
            and entry.run_id not in active
        ):
            from app.services.project_networks import NetworkHeld

            raise NetworkHeld("A previous owned execution needs cleanup/recovery before another network run.")


def for_runtime(runtime):
    with runtime._lock:
        if getattr(runtime, "execution_journal", None) is None:
            runtime.execution_journal = ExecutionJournal()
        return runtime.execution_journal
