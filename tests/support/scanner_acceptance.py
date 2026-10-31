"""Evidence retention and independent checks for the opt-in live scanner fixture."""

import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
from urllib.parse import parse_qs, urlsplit


def retain_evidence(source, destination):
    """Keep final evidence while atomic metadata writers finish replacing files."""
    source = Path(source)

    def ignore(directory, names):
        if Path(directory) != source:
            return []
        return [name for name in names if name.startswith(".run.json.") and name.endswith(".tmp")]

    shutil.copytree(source, destination, ignore=ignore, symlinks=True)


def worker_group(request_path, timeout=30):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for process in Path("/proc").iterdir():
            if not process.name.isdigit():
                continue
            try:
                args = (process / "cmdline").read_bytes().split(b"\0")
                if b"app.scanning.worker" in args and os.fsencode(request_path) in args:
                    gid = int(
                        next(
                            line.split()[1]
                            for line in (process / "status").read_text().splitlines()
                            if line.startswith("Gid:")
                        )
                    )
                    if gid >= 1_000_000_000:
                        return gid
            except (OSError, StopIteration, ValueError):
                continue
        time.sleep(0.2)
    raise RuntimeError("No running scanner worker with a private guard group was observed.")


PROBE = """
import json,os,socket,sys
allowed,blocked,gid=map(int,sys.argv[1:])
assert os.geteuid()!=0 and os.getgid()==gid
result={'effective_uid':os.geteuid(),'real_gid':os.getgid()}
with socket.create_connection(('127.0.0.2',allowed),timeout=3) as connection:
    connection.sendall(b'GET / HTTP/1.0\\r\\nHost: owned-fixture\\r\\n\\r\\n')
    result['allowed_response']=connection.recv(256).split(b'\\r\\n')[0].decode()
try:
    with socket.create_connection(('127.0.0.2',blocked),timeout=2):
        result['excluded_port']='connected'
except TimeoutError:
    result['excluded_port']='timed_out'
print(json.dumps(result))
"""


def probe_guard(gid, allowed_port, blocked_port):
    """Probe real kernel rules as the scanner UID/GID, without changing a lease."""
    command = [
        shutil.which("sudo"),
        "-n",
        shutil.which("setpriv"),
        f"--reuid={os.getuid()}",
        f"--regid={gid}",
        "--clear-groups",
        "--bounding-set=-all",
        "--inh-caps=-all",
        "--ambient-caps=-all",
        "--no-new-privs",
        sys.executable,
        "-I",
        "-B",
        "-c",
        PROBE,
        str(allowed_port),
        str(blocked_port),
        str(gid),
    ]
    result = subprocess.run(command, capture_output=True, text=True, timeout=10, check=True)
    report = json.loads(result.stdout)
    report["passed"] = report["allowed_response"].endswith("200 OK") and report["excluded_port"] == "timed_out"
    return report


class DOMProof(HTMLParser):
    def __init__(self):
        super().__init__()
        self.markers = []

    def handle_starttag(self, tag, attrs):
        if tag == "html":
            self.markers.append(dict(attrs).get("data-profiler-proof"))


def browser_proof(document, profile_root, requests):
    for finding in document.get("validated_vulnerabilities", []):
        if finding.get("type") != "reflected_xss":
            continue
        task = next(t for t in document["tasks"] if t["id"] == finding["source_task"])
        expected = "ctfproof" + hashlib.sha256((finding["url"] + finding["parameter"]).encode()).hexdigest()[:12]
        dom = DOMProof()
        dom.feed((Path(profile_root) / task["stdout"]).read_text())
        received = any(
            expected in value
            for url in requests
            for values in parse_qs(urlsplit(url).query).values()
            for value in values
        )
        if task.get("exit_code") == 0 and task["status"] == "completed" and expected in dom.markers and received:
            return {"passed": True, "task": task["id"], "token": expected, "fresh_request_observed": True}
    return {"passed": False}
