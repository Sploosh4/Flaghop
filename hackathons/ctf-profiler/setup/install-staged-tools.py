#!/usr/bin/env python3
"""Install pinned upstream binaries into this project's .tools directory."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import shutil
import tarfile
import urllib.request
import zipfile

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT / ".tools"
BIN = ROOT / "bin"
DOWNLOADS = ROOT / "downloads"
for directory in (BIN, DOWNLOADS, ROOT / "share"):
    directory.mkdir(parents=True, exist_ok=True)
entries = json.loads((PROJECT / "setup/staged-tools-lock.json").read_text())


def install(entry):
    archive = DOWNLOADS / entry["asset"]
    if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest() != entry["sha256"]:
        request = urllib.request.Request(entry["url"], headers={"User-Agent": "ctf-profiler-setup"})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=300) as response, archive.open("wb") as output:
                    shutil.copyfileobj(response, output)
                break
            except (OSError, TimeoutError):
                if attempt == 2:
                    raise
    if hashlib.sha256(archive.read_bytes()).hexdigest() != entry["sha256"]:
        raise ValueError("Checksum mismatch: " + entry["asset"])
    name = entry["tool"]
    if name == "zap":
        destination = ROOT / "share" / ("zap-" + entry["version"])
        destination.mkdir(exist_ok=True)
        if not list(destination.glob("*/zap.sh")):
            with tarfile.open(archive) as bundle:
                bundle.extractall(destination, filter="data")
        launcher = next(destination.glob("*/zap.sh"))
        # All caller arguments remain individual arguments; no shell expansion.
        (BIN / "zap.sh").write_text('#!/bin/sh\nexec "' + str(launcher) + '" "$@"\n')
        (BIN / "zap.sh").chmod(0o755)
    elif archive.suffix == ".zip":
        with zipfile.ZipFile(archive) as bundle:
            member = next(m for m in bundle.infolist() if Path(m.filename).name == name)
            (BIN / name).write_bytes(bundle.read(member))
        (BIN / name).chmod(0o755)
    else:
        with tarfile.open(archive) as bundle:
            member = next(m for m in bundle.getmembers() if m.isfile() and Path(m.name).name == name)
            with bundle.extractfile(member) as content, (BIN / name).open("wb") as output:
                shutil.copyfileobj(content, output)
        (BIN / name).chmod(0o755)
    print(name, entry["version"], "installed; SHA-256 verified", flush=True)


with ThreadPoolExecutor(max_workers=3) as pool:
    list(pool.map(install, entries))
