"""Isolated Linux cleanup helper. No shell, replayed command or saved PID kill.

The caller supplies a protected journal record. Every signal uses a pidfd after
checking boot/start identity or the private inherited execution token. An old
PID, process group or GID alone can never authorize killing an unrelated task.
"""

import json
import os
from pathlib import Path
import re
import select
import shutil
import signal
import subprocess
import sys
import time


def identity(pid):
    try:
        path = Path("/proc") / str(pid)
        fields = (path / "stat").read_text().rsplit(") ", 1)[1].split()
        status = (path / "status").read_text().splitlines()
        gid = next(int(line.split()[1]) for line in status if line.startswith("Gid:"))
        uid = next(int(line.split()[1]) for line in status if line.startswith("Uid:"))
        return {
            "pid": pid,
            "parent": int(fields[1]),
            "group": int(fields[2]),
            "gid": gid,
            "uid": uid,
            "stamp": Path("/proc/sys/kernel/random/boot_id").read_text().strip() + ":" + fields[19],
            "state": fields[0],
        }
    except (FileNotFoundError, ProcessLookupError):
        return None


def tagged(pid, token):
    try:
        with Path("/proc", str(pid), "environ").open("rb") as stream:
            return ("FLAGHOP_EXECUTION_TOKEN=" + token).encode() in stream.read(1024 * 1024).split(b"\0")
    except (FileNotFoundError, PermissionError, ProcessLookupError):
        return False


def owned_processes(row):
    rows = [
        value
        for path in Path("/proc").iterdir()
        if path.name.isdigit()
        if (value := identity(int(path.name))) is not None and value["state"] != "Z"
    ]
    leader = next(
        (
            value
            for value in rows
            if value["pid"] == row["pid"]
            and value["stamp"] == row["pid_stamp"]
            and value["group"] == row["pgid"]
            and value["pid"] == value["group"]
        ),
        None,
    )
    owned = {value["pid"]: value for value in rows if value["uid"] == row["uid"] and tagged(value["pid"], row["token"])}
    if leader is not None:
        owned[leader["pid"]] = leader
        changed = True
        while changed:
            changed = False
            for value in rows:
                if value["parent"] in owned and value["pid"] not in owned:
                    owned[value["pid"]] = value
                    changed = True
    if row["gid"]:
        for value in rows:
            if value["gid"] == row["gid"] and value["pid"] not in owned:
                # Detached children need the private token too. Preserve the
                # restriction and report a hold if ownership cannot be proved.
                if tagged(value["pid"], row["token"]):
                    owned[value["pid"]] = value
                else:
                    raise RuntimeError(
                        "A private-group process has unverified ownership; no group-wide kill attempted."
                    )
    return list(owned.values())


def clean(row):
    if not re.fullmatch("[a-f0-9]{64}", row["token"]) or row["gid"] and not 1_000_000_000 <= row["gid"] < 2_000_000_000:
        raise ValueError("Invalid owned cleanup identity.")
    if row["table"] and row["table"] != "flaghop_" + str(row["gid"]):
        raise ValueError("Invalid private network table identity.")
    deadline = time.monotonic() + 2
    while True:
        members = owned_processes(row)
        if not members:
            break
        for member in members:
            try:
                descriptor = os.pidfd_open(member["pid"])
            except ProcessLookupError:
                continue
            try:
                # PID reuse between enumeration and pidfd_open is harmless.
                current = identity(member["pid"])
                if current and current["stamp"] == member["stamp"]:
                    signal.pidfd_send_signal(descriptor, signal.SIGKILL)
                poll = select.poll()
                poll.register(descriptor, select.POLLIN)
                poll.poll(100)
            finally:
                os.close(descriptor)
        if time.monotonic() > deadline:
            raise RuntimeError("Owned children did not exit; egress restriction retained.")
    if row["table"]:
        nft = shutil.which("nft", path="/usr/sbin:/usr/bin:/sbin:/bin")
        if not nft:
            raise RuntimeError("nft is needed to verify and remove the owned restriction.")
        tables = subprocess.run([nft, "-j", "list", "tables"], capture_output=True, text=True, timeout=1, check=True)
        matching = [
            entry["table"]
            for entry in json.loads(tables.stdout)["nftables"]
            if "table" in entry
            and entry["table"].get("family") == "inet"
            and entry["table"].get("name") == row["table"]
        ]
        if matching:
            detail = subprocess.run(
                [nft, "-j", "list", "table", "inet", row["table"]],
                capture_output=True,
                text=True,
                timeout=1,
                check=True,
            )
            definitions = [entry["table"] for entry in json.loads(detail.stdout)["nftables"] if "table" in entry]
            if len(definitions) != 1 or definitions[0].get("comment") != "flaghop:" + row["token"]:
                raise RuntimeError("Network table ownership differs; restriction was not deleted.")
            subprocess.run(
                [nft, "delete", "table", "inet", row["table"]], capture_output=True, text=True, timeout=1, check=True
            )
    if row["hosts_folder"]:
        path = Path(row["hosts_folder"])
        expected = Path(__file__).resolve().parents[2] / ".tmp"
        if path.parent != expected or not path.name.startswith("network-hosts-") or path.is_symlink():
            raise ValueError("Network temporary path is not an owned directory.")
        if path.exists():
            shutil.rmtree(path)
    if row.get("scratch"):
        path = Path(row["scratch"])
        expected = Path(__file__).resolve().parents[2] / ".tmp"
        if path.parent != expected or not path.name.startswith("s-") or path.is_symlink():
            raise ValueError("Scanner temporary path is not an owned directory.")
        if path.exists():
            shutil.rmtree(path)


if __name__ == "__main__":
    try:
        raw = sys.stdin.buffer.read(65537)
        if len(raw) > 65536:
            raise ValueError("Cleanup record exceeds its bound.")
        clean(json.loads(raw))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
