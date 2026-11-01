#!/usr/bin/env python3
"""Compare network observations with independent local-lab ground truth."""
import base64
import hashlib
import json
from pathlib import Path
import sys
from datetime import datetime, timezone

PROJECT = Path(__file__).resolve().parents[1]
RUN = PROJECT / "validation/live-lab"
PROFILE_DIR = RUN / "profile"
profile = json.loads((PROFILE_DIR / "device-profile.json").read_text())
truth = json.loads((PROJECT / "lab/ground-truth.json").read_text())
checks = {}
checks["single_correct_target"] = profile["target"]["ip"] == truth["target_ip"]
checks["active_run_completed"] = profile["run"]["status"] == "completed" and profile["run"]["mode"] == "active"
services = profile["nmap"]["services"]
checks["five_open_tcp_ports"] = sorted(s["port"] for s in services if s["state"] == "open") == [53, 445, 12222, 18080, 18443]
checks["closed_control_seen"] = any(s["port"] == 18444 and s["state"] == "closed" for s in services)
checks["closed_port_never_probed_by_followups"] = not any(t.get("port") == 18444 for t in profile["tasks"])
expected_tasks = {"discovery", "smb", "ssh-12222", "http-18080", "whatweb-18080", "http-18443", "whatweb-18443", "tls-18443", "dns"}
checks["every_implemented_branch_exercised"] = {t["id"] for t in profile["tasks"]} == expected_tasks
checks["eight_followups_completed"] = sum(t["status"] == "completed" for t in profile["tasks"]) == 8
obs = {o["task_id"]: o for o in profile["observations"]}
checks["both_http_titles_collected"] = all(obs[f"http-{p}"]["title"] == "Local CTF Profiling Lab" for p in (18080, 18443))
checks["both_whatweb_reports_collected"] = all(obs[f"whatweb-{p}"]["data"][0]["http_status"] == 200 for p in (18080, 18443))
checks["dns_ptr_collected"] = obs["dns"]["ptr_records"] == ["profiler-lab.ctf.invalid."]
checks["guest_share_collected"] = "PUBLIC" in obs["smb"]["data"]["shares"]
tls = obs["tls-18443"]["data"]["scanResult"][0]
protocols = {x["id"]: x["finding"] for x in tls["protocols"]}
checks["tls12_tls13_collected"] = protocols.get("TLS1_2") == "offered" and "offered" in protocols.get("TLS1_3", "")
checks["self_signed_certificate_recorded"] = any(x["id"] == "cert_chain_of_trust" and "self signed" in x["finding"] for x in tls["serverDefaults"])
checks["ssh_key_matches_actual_lab"] = False
# Derive the public key from the locally owned key for independent comparison.
# This file is never read by the profiler itself.
import subprocess
key = subprocess.run(["ssh-keygen", "-y", "-f", str(PROJECT / "lab/runtime/ssh.key")], capture_output=True, text=True, check=True).stdout.split()[1]
fingerprint = "SHA256:" + base64.b64encode(hashlib.sha256(base64.b64decode(key)).digest()).decode().rstrip("=")
checks["ssh_key_matches_actual_lab"] = any(k["sha256"] == fingerprint for k in obs["ssh-12222"]["keys"])
checks["all_raw_hashes_match"] = all(hashlib.sha256((PROFILE_DIR / a["path"]).read_bytes()).hexdigest() == a["sha256"] for a in profile["artifacts"])
checks["no_target_credentials_or_installation"] = not profile["policy"]["supplied_target_credentials"] and not profile["policy"]["target_installation"]
report = {"checked_at": datetime.now(timezone.utc).isoformat(), "checks": checks,
          "passed": all(checks.values()), "os_limit": truth["os_detection_limit"]}
(RUN / "profile-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
sys.exit(0 if report["passed"] else 1)
