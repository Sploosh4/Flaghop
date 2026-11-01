"""Owned staging and cross-process reservations against actual filesystem space."""

from contextlib import contextmanager
import copy
import fcntl
import json
import os
from pathlib import Path
import shutil
import stat
import re
import uuid
from app.contracts.actions.storage import TransferLimits, StorageLeaseRecord
from app.services.project_background import atomic_json

ROOT = Path(__file__).resolve().parents[2]
STAGING = ROOT / ".tmp/transfer-staging"


class StorageRejected(ValueError):
    def __init__(self, message, status=413):
        super().__init__(message)
        self.status = status


def process_stamp(pid):
    try:
        fields = Path(f"/proc/{pid}/stat").read_text().rsplit(") ", 1)[1].split()
        return Path("/proc/sys/kernel/random/boot_id").read_text().strip() + ":" + fields[19]
    except FileNotFoundError:
        return None
    except (PermissionError, OSError, IndexError):
        return "unreadable"


def existing_parent(path):
    path = Path(path).resolve()
    while not path.exists():
        path = path.parent
    return path


class StorageAdmission:
    def __init__(self, limits=None):
        if limits is None:
            limits = json.loads((ROOT / ".project-storage.json").read_text()).get("transfer_limits", {})
        self.limits = limits if isinstance(limits, TransferLimits) else TransferLimits.model_validate(limits or {})
        self.folder = STAGING

    @contextmanager
    def ledger(self):
        policy = json.loads((ROOT / ".project-storage.json").read_text())
        if policy.get("require_mount") and not os.path.ismount(ROOT):
            raise StorageRejected("Project storage is not mounted; transfer refused.", 507)
        candidate = ROOT
        for part in self.folder.relative_to(ROOT).parts:
            candidate /= part
            if candidate.is_symlink():
                raise StorageRejected("Transfer staging cannot be linked.", 507)
        self.folder.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd = os.open(self.folder / "reservations.lock", os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600)
        with os.fdopen(fd, "a+b") as handle:
            info = os.fstat(handle.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid():
                raise StorageRejected("Invalid storage reservation lock.", 507)
            fcntl.flock(handle, fcntl.LOCK_EX)
            path = self.folder / "reservations.json"
            if path.is_symlink() or path.exists() and path.stat().st_size > 1024 * 1024:
                raise StorageRejected("Invalid storage reservation ledger.", 507)
            records = json.loads(path.read_text()) if path.exists() else {}
            if (
                not isinstance(records, dict)
                or len(records) > 1000
                or any(not re.fullmatch(r"[a-f0-9]{32}", token) for token in records)
            ):
                raise StorageRejected("Invalid storage reservation records.", 507)
            records = {token: StorageLeaseRecord.model_validate(row).model_dump() for token, row in records.items()}
            before = copy.deepcopy(records)
            for token, row in list(records.items()):
                stamp = process_stamp(row["pid"])
                if stamp is None or stamp != "unreadable" and stamp != row["stamp"]:
                    if row.get("upload"):
                        (self.folder / (token + ".zip")).unlink(missing_ok=True)
                    del records[token]
            try:
                yield records
            finally:
                if records != before:
                    atomic_json(path, records)
                fcntl.flock(handle, fcntl.LOCK_UN)

    def check_space(self, records, destination, amount, excluding=None):
        parent = existing_parent(destination)
        device = parent.stat().st_dev
        others = sum(
            row["remaining"] for token, row in records.items() if token != excluding and row["device"] == device
        )
        if shutil.disk_usage(parent).free < amount + others + self.limits.free_headroom_bytes:
            raise StorageRejected("Insufficient storage headroom; no project changes were made.", 507)
        return device

    def reserve(self, amount, destination=STAGING, *, upload=False):
        token = uuid.uuid4().hex
        with self.ledger() as records:
            if len(records) >= 1000:
                raise StorageRejected("Too many pending storage operations.", 507)
            device = self.check_space(records, destination, amount)
            records[token] = {
                "pid": os.getpid(),
                "stamp": process_stamp(os.getpid()),
                "device": device,
                "remaining": amount,
                "upload": upload,
            }
        return StorageReservation(self, token, destination)

    def stage(self):
        lease = self.reserve(self.limits.upload_bytes, upload=True)
        try:
            return StagedUpload(lease)
        except BaseException:
            lease.close()
            raise

    def release_upload(self, path):
        path = Path(path)
        # Original caller files and evidence are never staging cleanup targets.
        if path.parent != self.folder or path.suffix != ".zip" or len(path.stem) != 32:
            return False
        with self.ledger() as records:
            row = records.get(path.stem)
            if not row or not row.get("upload"):
                return False
            path.unlink(missing_ok=True)
            records.pop(path.stem)
        return True


class StorageReservation:
    """Runtime lease handle; its stored data is owned by StorageAdmission."""

    def __init__(self, admission, token, destination):
        self.admission, self.token, self.destination = admission, token, Path(destination)

    def write(self, target, data):
        with self.admission.ledger() as records:
            row = records[self.token]
            if len(data) > row["remaining"]:
                raise StorageRejected("Transfer exceeds its declared byte budget.")
            self.admission.check_space(records, self.destination, row["remaining"], excluding=self.token)
            target.write(data)
            target.flush()
            row["remaining"] -= len(data)

    def seal(self):
        with self.admission.ledger() as records:
            records[self.token]["remaining"] = 0

    def close(self):
        with self.admission.ledger() as records:
            records.pop(self.token, None)


class StagedUpload:
    def __init__(self, lease):
        self.lease = lease
        self.path = lease.admission.folder / (lease.token + ".zip")
        self.file = self.path.open("xb")
        self.claimed = False

    def write(self, data):
        self.lease.write(self.file, data)

    def seal(self):
        self.file.flush()
        os.fsync(self.file.fileno())
        self.file.close()
        self.lease.seal()

    def handoff(self):
        self.claimed = True

    def close(self):
        error = None
        try:
            if not self.file.closed:
                self.file.close()
        except BaseException as exc:
            error = exc
        finally:
            if not self.claimed:
                try:
                    self.path.unlink(missing_ok=True)
                finally:
                    self.lease.close()
        if error is not None:
            raise StorageRejected("Upload close/cleanup failed; no project was adopted.", 507) from error
