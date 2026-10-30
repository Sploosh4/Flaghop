"""
LEGION (https://shanewilliamscott.com)
Copyright (c) 2025 Shane William Scott

    This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
    License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
    version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
    details.

    You should have received a copy of the GNU General Public License along with this program.
    If not, see <http://www.gnu.org/licenses/>.

Author(s): Shane Scott (sscott@shanewilliamscott.com), Dmitriy Dubson (d.dubson@gmail.com)
"""

import sys
from typing import Iterable, List
from urllib.parse import urlparse

from app.hostsfile import normalize_hostname_alias
from db.entities.host import hostObj


def _normalize_import_target(raw_target: str) -> str:
    candidate = str(raw_target or "").strip()
    if not candidate or candidate.startswith("#"):
        return ""
    if "://" in candidate:
        try:
            parsed = urlparse(candidate)
            candidate = str(parsed.hostname or "").strip()
        except Exception:
            candidate = ""
    normalized = normalize_hostname_alias(candidate)
    return str(normalized or candidate or "").strip().rstrip(".")


def import_targets(session, hostRepository, targets: Iterable[str]) -> List[str]:
    """
    Import targets (hostnames, subnets, IPs, etc.) from an iterable into the database.
    Returns the list of newly-added targets.
    """
    added_targets: List[str] = []
    seen = set()
    for raw_target in list(targets or []):
        target = _normalize_import_target(raw_target)
        if not target or target in seen:
            continue
        seen.add(target)
        try:
            db_host = hostRepository.getHostInformation(target)
        except Exception as repo_exc:
            print(f"Warning: unable to check existing host '{target}': {repo_exc}", file=sys.stderr)
            continue
        if db_host:
            continue
        try:
            existing_hostname = hostRepository.getHostByHostname(target)
        except Exception:
            existing_hostname = None
        if existing_hostname:
            continue
        hid = hostObj(
            ip=target,
            ipv4=target,
            ipv6="",
            macaddr="",
            status="",
            hostname=target,
            vendor="",
            uptime="",
            lastboot="",
            distance="",
            state="",
            count="",
        )
        try:
            session.add(hid)
            session.commit()
            added_targets.append(target)
        except Exception as db_exc:
            session.rollback()
            print(f"Error importing target '{target}': {db_exc}", file=sys.stderr)
    return added_targets


def import_targets_from_textfile(session, hostRepository, filename):
    """
    Import targets (hostnames, subnets, IPs, etc.) from a text file into the database.
    Each line is treated as a target.
    """
    raw_targets = []
    try:
        with open(filename, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                raw_targets.append(line)
    except FileNotFoundError:
        print(f"Error: input file '{filename}' not found.", file=sys.stderr)
        return 0
    except OSError as exc:
        print(f"Error opening input file '{filename}': {exc}", file=sys.stderr)
        return 0
    return len(import_targets(session, hostRepository, raw_targets))


def is_wsl():
    try:
        with open("/proc/version", "r") as f:
            return "Microsoft" in f.read()
    except Exception:
        return False


def to_windows_path(path):
    try:
        import subprocess

        return subprocess.check_output(["wslpath", "-w", path]).decode().strip()
    except Exception:
        # Fallback: naive conversion for /mnt/c/...
        if path.startswith("/mnt/"):
            drive = path[5]
            rest = path[6:]
            rest_win = rest.replace("/", "\\")
            return f"{drive.upper()}:\\{rest_win}"
        return path
