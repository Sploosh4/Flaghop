#!/usr/bin/env python3
"""Run WPScan against the owned non-lab WordPress fixture and validate its JSON.

The fixture deliberately contains no vulnerability finding and needs no API token.
This proves positive enumeration plus the staged lab's non-WordPress skip branch.
"""
import argparse
from datetime import datetime, timezone
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import threading

PROJECT = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "wordpress"

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--out", type=Path, help="New evidence directory")
parser.add_argument("--lab-profile", type=Path, help="Optional staged lab profile to check skip branch")
args = parser.parse_args()
out = (args.out or PROJECT / "validation" / "deepseek-evaluation" /
       ("wordpress-fixture-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))).resolve()
out.mkdir(parents=True, exist_ok=False)
raw = out / "raw"
raw.mkdir()

handler = lambda *a, **kw: http.server.SimpleHTTPRequestHandler(*a, directory=str(FIXTURE), **kw)
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
port = server.server_port
target = f"http://127.0.0.1:{port}/"
artifact = raw / "wpscan.json"
wpscan = str(PROJECT / ".tools/bin/wpscan") if (PROJECT / ".tools/bin/wpscan").is_file() else "wpscan"
command = [wpscan, "--url", target, "--no-update", "--format", "json",
           "--output", str(artifact), "--detection-mode", "passive",
           "--plugins-detection", "passive", "--disable-tls-checks", "--max-threads", "2"]
try:
    completed = subprocess.run(command, stdin=subprocess.DEVNULL, capture_output=True,
                               text=True, timeout=180, cwd=PROJECT, env=os.environ.copy())
    (raw / "wpscan.stdout").write_text(completed.stdout)
    (raw / "wpscan.stderr").write_text(completed.stderr)
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=3)

data = json.loads(artifact.read_text()) if artifact.is_file() else {}
checks = {
    "process_completed": completed.returncode == 0,
    "structured_json": isinstance(data, dict),
    "scanner_banner": isinstance(data.get("banner"), dict) and data["banner"].get("version"),
    "target_is_owned_loopback_fixture": data.get("target_url") == target,
    "wordpress_version_enumerated": (data.get("version") or {}).get("number") == "6.4.3",
    "passive_theme_identified": (data.get("main_theme") or {}).get("slug") == "fixture",
    "scan_not_aborted": not data.get("scan_aborted"),
    "no_api_token_used": "--api-token" not in command,
}
lab_skip = None
if args.lab_profile:
    profile = json.loads((args.lab_profile / "device-profile.json").read_text())
    lab_skip = any(t.get("tool") == "wpscan" and t.get("status") == "skipped"
                   and "WordPress" in t.get("reason", "") for t in profile.get("tasks", []))
    checks["non_wordpress_lab_skipped"] = bool(lab_skip)
report = {
    "checked_at": datetime.now(timezone.utc).isoformat(),
    "passed": all(checks.values()), "checks": checks,
    "target": target, "command": command, "wpscan_exit_code": completed.returncode,
    "artifact": str(artifact), "lab_profile": str(args.lab_profile) if args.lab_profile else None,
}
(out / "wordpress-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print("WordPress fixture verification:", "PASS" if report["passed"] else "FAIL")
for name, passed in checks.items():
    if not passed:
        print("FAILED:", name)
sys.exit(0 if report["passed"] else 1)
