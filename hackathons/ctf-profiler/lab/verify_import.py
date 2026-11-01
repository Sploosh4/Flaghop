#!/usr/bin/env python3
"""Import one saved live-lab profile twice and assert actual database contents."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("run", type=Path)
parser.add_argument("--workspace", default="ctf-profiler-classified-lab")
args = parser.parse_args()
if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}", args.workspace):
    parser.error("Invalid workspace")
root = args.run.resolve()
profile_path = root / "profile/device-profile.json"
profile = json.loads(profile_path.read_text())
if profile.get("target", {}).get("ip") != "127.0.0.2":
    parser.error("This verification is scoped to the owned local target")
report_path = root / "metasploit-verification.json"
if report_path.exists():
    parser.error("Verification report already exists; use a new run directory")
# Import contents directly to support spaces in paths without console quoting.
imports = (root / "profile/metasploit-import.rc").read_text()
verify = '''
<ruby>
require 'json'
require 'time'
expected = JSON.parse(File.read(__PROFILE__))
workspace = framework.db.find_workspace(__WORKSPACE__)
report = {'checked_at' => Time.now.utc.iso8601, 'workspace' => __WORKSPACE__, 'checks' => {}}
checks = report['checks']
checks['database_connected'] = !!framework.db.active
checks['workspace_exists'] = !workspace.nil?
if workspace
  checks['one_target_host'] = workspace.hosts.map(&:address) == ['127.0.0.2']
  checks['five_open_services'] = workspace.services.where(state: 'open').map(&:port).sort == [53,445,12222,18080,18443]
  notes = workspace.notes.where(ntype: 'ctf.device_profile').to_a
  classifications = workspace.notes.where(ntype: 'ctf.device_classification').to_a
  checks['one_profile_after_two_imports'] = notes.length == 1
  checks['full_profile_preserved'] = notes.length == 1 && notes.first.data == expected
  checks['one_classification_after_two_imports'] = classifications.length == 1
  checks['classification_preserved'] = classifications.length == 1 && classifications.first.data == expected['classification']
  checks['no_invented_vulnerabilities'] = workspace.vulns.count == 0
  report['classification'] = classifications.first&.data&.fetch('primary')
end
report['passed'] = checks.values.all?
File.write(__REPORT__, JSON.pretty_generate(report) + "\\n")
print_line(JSON.pretty_generate(report))
</ruby>
hosts
services
exit -y
'''
# JSON string escaping is valid Ruby for these path/workspace strings, with
# interpolation escaped explicitly rather than inserting executable text.
def ruby_string(value):
    return json.dumps(str(value)).replace("#{", r"\#{")

verify = verify.replace("__PROFILE__", ruby_string(profile_path))
verify = verify.replace("__WORKSPACE__", ruby_string(args.workspace))
verify = verify.replace("__REPORT__", ruby_string(report_path))
resource = root / "verify-import.rc"
resource.write_text(imports + imports + verify)
with (root / "metasploit.log").open("w") as log:
    result = subprocess.run(["msfconsole", "-q", "-r", str(resource)], stdout=log, stderr=subprocess.STDOUT, timeout=240)
if result.returncode or not report_path.exists():
    raise SystemExit("Metasploit verification did not complete; inspect metasploit.log")
report = json.loads(report_path.read_text())
print("Metasploit import verification:", "PASS" if report["passed"] else "FAIL")
sys.exit(0 if report["passed"] else 1)
