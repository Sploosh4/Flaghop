"""Privileged read-only check that a loopback TCP listener belongs to a scan GID."""

from pathlib import Path
import sys


def listener_owned(gid, port, proc=Path("/proc")):
    inodes = set()
    for line in (proc / "net/tcp").read_text().splitlines()[1:]:
        fields = line.split()
        if fields[1] == f"0100007F:{port:04X}" and fields[3] == "0A":
            inodes.add(fields[9])
    if not inodes:
        return False
    for process in proc.iterdir():
        if not process.name.isdigit():
            continue
        try:
            groups = next(
                line.split()[1:] for line in (process / "status").read_text().splitlines() if line.startswith("Gid:")
            )
            if not groups or groups[0] != str(gid):
                continue
            for fd in (process / "fd").iterdir():
                if fd.readlink().as_posix() in {f"socket:[{inode}]" for inode in inodes}:
                    return True
        except (OSError, StopIteration):
            continue
    return False


if __name__ == "__main__":
    gid, port = map(int, sys.argv[1:])
    if gid < 1_000_000_000 or not 1 <= port <= 65535:
        sys.exit(2)
    sys.exit(0 if listener_owned(gid, port) else 1)
