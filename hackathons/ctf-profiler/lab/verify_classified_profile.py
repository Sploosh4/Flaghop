#!/usr/bin/env python3
"""Validate a fresh classified profile against the owned local services."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("run", type=Path)
args = parser.parse_args()
root = args.run.resolve()
profile_dir = root / "profile"
p = json.loads((profile_dir / "device-profile.json").read_text())
c = p["classification"]
checks = {
    "target_is_owned_lab": p["target"]["ip"] == "127.0.0.2",
    "run_completed": p["run"]["status"] == "completed",
    "normal_user_followups": p["run"]["local_effective_uid"] == os.geteuid() != 0,
    "privileged_discovery_flags": all(x in p["nmap"]["recorded_arguments"] for x in ("-sS", "-O")),
    "five_open_services": sorted(s["port"] for s in p["nmap"]["services"] if s["state"] == "open") == [53,445,12222,18080,18443],
    "eight_successful_followups": p["task_summary"] == {"supplied": 1, "completed": 8},
    "service_host_classification": c["primary"]["device_type"] == "general_purpose_service_host",
    "confidence_medium": c["primary"]["confidence"] == "medium",
    "four_evidence_channels": c["primary"]["evidence_channels"] == ["dns", "smb", "ssh", "web"],
    "score_is_not_probability": "not a calibrated probability" in c["score_semantics"],
    "ngfw_remains_unknown": p["ngfw_capability"] == p["ngfw_features_active"] == "unknown",
    "physical_model_unknown": p["identity_hypotheses"]["model"]["value"] is None,
    "firmware_unknown": p["identity_hypotheses"]["firmware"]["value"] is None,
    "evidence_links_recorded": all(e.get("path") and e.get("source") for e in c["primary"]["evidence"]),
    "raw_hashes_match": all(hashlib.sha256((profile_dir / a["path"]).read_bytes()).hexdigest() == a["sha256"] for a in p["artifacts"]),
}
os_family = c["os_assessment"]["likely_family"]
if os_family == "Linux":
    checks["linux_windows_conflict_detected"] = any(x["id"] == "os_sources_disagree" for x in c["conflicts"])
    checks["conflict_reduces_role_score"] = c["primary"]["score"] == 60
report = {"checked_at": datetime.now(timezone.utc).isoformat(), "checks": checks,
          "passed": all(checks.values()), "classification": c["primary"], "os_assessment": c["os_assessment"]}
(root / "profile-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print("Classified live profile verification:", "PASS" if report["passed"] else "FAIL")
print(c["primary"]["label"], c["primary"]["confidence"], c["primary"]["score"])
sys.exit(0 if report["passed"] else 1)
