"""ZIP admission before allocation, and bounded extraction into owned staging."""

from contextlib import contextmanager
from pathlib import Path, PurePosixPath
import os
import stat
import struct
import zipfile
from app.services.storage_admission import StorageAdmission, StorageRejected, STAGING, existing_parent


def inspect_archive(path, admission):
    limits = admission.limits
    path = Path(path)
    if path.stat().st_size > limits.upload_bytes:
        raise StorageRejected("Archive exceeds the upload byte limit.")
    # Check central-directory bounds before ZipFile builds its in-memory index.
    with path.open("rb") as stream:
        stream.seek(0, os.SEEK_END)
        size = stream.tell()
        stream.seek(max(0, size - 65557))
        tail = stream.read(65557)
    marker = tail.rfind(b"PK\x05\x06")
    if marker < 0 or len(tail) - marker < 22:
        raise ValueError("Select a valid workspace ZIP.")
    _, disk, start_disk, local_count, count, directory_bytes, offset, comment = struct.unpack(
        "<4s4H2LH", tail[marker : marker + 22]
    )
    if disk or start_disk or count != local_count or count == 65535 or offset == 0xFFFFFFFF:
        raise StorageRejected("Multi-volume/ZIP64 archives exceed the supported project transfer layout.")
    if (
        count > limits.members
        or directory_bytes > 16 * 1024 * 1024
        or marker + 22 + comment != len(tail)
        or offset + directory_bytes > size
    ):
        raise StorageRejected("Archive exceeds its bounded member/directory budget.")
    total, names = 0, set()
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        if len(entries) != count:
            raise StorageRejected("Archive member counts disagree.")
        files = set()
        for item in entries:
            raw = item.filename
            member = PurePosixPath(raw)
            if (
                not raw
                or raw.startswith("/")
                or "\\" in raw
                or "\x00" in raw
                or ":" in member.parts[0]
                or any(part in {"", "..", "."} for part in raw.rstrip("/").split("/"))
            ):
                raise StorageRejected("Unsafe archive member path.", 400)
            canonical = member.as_posix()
            if canonical in names:
                raise StorageRejected("Duplicate archive member path.", 400)
            names.add(canonical)
            mode = stat.S_IFMT(item.external_attr >> 16)
            if item.flag_bits & 1 or mode not in {0, stat.S_IFREG, stat.S_IFDIR}:
                raise StorageRejected("Encrypted, linked or special archive members are unsupported.", 400)
            if not item.is_dir():
                files.add(canonical)
            if (
                item.file_size > limits.entry_bytes
                or item.file_size > max(1, item.compress_size) * limits.compression_ratio
            ):
                raise StorageRejected("Archive entry exceeds its expansion/compression budget.")
            total += item.file_size
            if total > limits.expanded_bytes:
                raise StorageRejected("Archive exceeds its total expanded byte budget.")
        for name in names:
            if any(parent.as_posix() in files for parent in PurePosixPath(name).parents if parent.as_posix() != "."):
                raise StorageRejected("Archive member/file paths collide.", 400)
    # Reserve prospective file/directory allocation as well as logical content.
    return total + len(entries) * 8192 + 32768


class BoundedArchive:
    """An inspected archive with one shared extraction reservation."""

    def __init__(self, archive, reservation):
        self.archive, self.reservation = archive, reservation

    def __getattr__(self, name):
        return getattr(self.archive, name)

    def copy_member(self, name, destination):
        member = self.archive.getinfo(name)
        remaining = member.file_size
        destination = Path(destination)
        lease = self.reservation
        foreign = (
            existing_parent(destination.parent).stat().st_dev
            != existing_parent(self.reservation.destination).stat().st_dev
        )
        if foreign:
            lease = self.reservation.admission.reserve(member.file_size + 8192, destination.parent)
        try:
            destination.parent.mkdir(parents=True, exist_ok=True)
            with self.archive.open(member) as source, destination.open("xb") as target:
                while chunk := source.read(min(65536, remaining + 1)):
                    if len(chunk) > remaining:
                        raise StorageRejected("Archive member expanded beyond its declared size.")
                    lease.write(target, chunk)
                    remaining -= len(chunk)
                if remaining:
                    raise ValueError("Archive member ended before its declared size.")
        finally:
            if foreign:
                lease.close()


@contextmanager
def open_archive(path, admission=None, *, destination=STAGING):
    admission = admission or StorageAdmission()
    amount = inspect_archive(path, admission)
    reservation = admission.reserve(amount, destination)
    try:
        with zipfile.ZipFile(path) as archive:
            yield BoundedArchive(archive, reservation)
    finally:
        reservation.close()


def restore_directory():
    import tempfile

    STAGING.mkdir(mode=0o700, parents=True, exist_ok=True)
    return tempfile.mkdtemp(prefix="restore-", dir=STAGING)
