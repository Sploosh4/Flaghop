# Round-three command matrix

Source hashes: `{"ctf_profiler.py": "766911f1d24d1ebc0c529a2b6186047978c7ce7c758bc1c46327126aaf3aa775", "dependencies.py": "79c744b9faee80956d07e7852523c1e2a18b5302fe87e6d904e9acec7e2a8d57", "device_classifier.py": "4686cf0ff7e797df1c14b2cdad3cece0732d4a6699ef9e9bd0ba34bacb552134", "scope_proxy.py": "fa9e07473462d3b15872cc7c93d6da2579791fc1b4a7f1a8c29697632eb34e4e", "staged_workflow.py": "a3503172349017c1ab94e91a61fbcc5a91fe39bae30b5c94271d308f1c0bb5c0", "workspace.py": "82d309705aa0cb2b38cc85bade63c6ad0e300dac4ad2a042e46590009b979f5d"}`

| Category | Fixture | Expected / actual exit | Verified | Evidence |
| --- | --- | ---: | --- | --- |
| `help` | CLI help; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-help.json` |
| `check-tools` | Local dependency inventory; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-check-tools.json` |
| `offline` | Synthetic XML, offline mode; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-offline.json` |
| `dry-run` | Synthetic XML, dry-run plan; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-dry-run.json` |
| `saved-xml` | Synthetic saved XML, offline stages 1-5; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-saved-xml.json` |
| `stage-1-3` | Saved XML, offline stage range 1-3; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-stage-1-3.json` |
| `stage-1-4` | Saved XML, offline stage range 1-4; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-stage-1-4.json` |
| `stage-1-5` | Saved XML, offline stage range 1-5; no target traffic | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-stage-1-5.json` |
| `active-tcp` | Owned 127.0.0.2 closed-control TCP smoke only; full active coverage is in gated final runs | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-active-tcp.json` |
| `verify` | Saved final-005 profile; verifier writes only inside evidence run | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-verify.json` |
| `wordpress` | Owned static WordPress fixture and final-005 lab skip evidence | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-wordpress.json` |
| `negative` | Owned loopback corrected negative fixture | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-negative.json` |
| `regression` | Original 39 plus round-three supplemental 6 tests; local fixtures only | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-regression.json` |
| `acceptance-v2` | Protected v2 all-group on final-005 with measured trace | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-acceptance-v2.json` |
| `supplemental` | Protected v3 behaviour group after stable identity/provenance split; owned temp fixtures | 0 / 0 | yes | `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/round3-command-v3-behaviour-prereq-003.json` |

## Explicitly not verified

- **privileged-runner**: not executed/claimed. Unavailable in this non-interactive agent session; final runs used the authorised unprivileged active TCP configuration.
- **metasploit-import**: not executed/claimed. Metasploit remains excluded.
- **full-stage-live-variants**: not executed/claimed. No need to duplicate full live scans outside the gated final series; stage receipts are explicitly labelled offline.
