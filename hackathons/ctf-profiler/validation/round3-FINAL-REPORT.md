# Round-three final report — B1–B4

**Date:** 31 October 2026  
**Final source hashes:**

| File | SHA-256 |
| --- | --- |
| `ctf_profiler.py` | `766911f1d24d1ebc0c529a2b6186047978c7ce7c758bc1c46327126aaf3aa775` |
| `staged_workflow.py` | `a3503172349017c1ab94e91a61fbcc5a91fe39bae30b5c94271d308f1c0bb5c0` |
| `workspace.py` | `82d309705aa0cb2b38cc85bade63c6ad0e300dac4ad2a042e46590009b979f5d` |
| `dependencies.py` | `79c744b9faee80956d07e7852523c1e2a18b5302fe87e6d904e9acec7e2a8d57` |
| `device_classifier.py` | `4686cf0ff7e797df1c14b2cdad3cece0732d4a6699ef9e9bd0ba34bacb552134` |
| `scope_proxy.py` | `fa9e07473462d3b15872cc7c93d6da2579791fc1b4a7f1a8c29697632eb34e4e` |

## Blocker closure

- **B1 — all temporary storage accounted:** PASS. Browser profiles, Chrome
  TMPDIR, tool TMPDIR and version-probe TMPDIR live under the owned Workspace
  below the declared short `/tmp` work root. The 24 MiB observer control saw
  **25,165,824 bytes** then a **17-byte** final run (`round3-control-trace.json`).
- **B2 — cleanup failures visible:** PASS. Cleanup reports attempted paths,
  errors, leftovers and bytes; real permission-denied deletion leaves a partial
  profile/exit 2; neighbours survive; bounded diagnostics are retained.
- **B3 — dependency identity:** PASS. Launcher, resolved implementation, ZAP
  core/plugin manifests, WPScan gemspecs and the selected DB are identified before
  and after. Database mutation during a run cannot report clean completion.
  Stable `tool_versions` no longer contain per-run `version_tmpdir` or raw
  timestamped excerpts; those are retained separately in `version_provenance`.
- **B4 — command evidence:** PASS. Fifteen current-source receipts cover help,
  check-tools, offline, dry-run, saved XML, stages 1-3/1-4/1-5, active TCP smoke,
  verify, WordPress, negative, regression, v2 acceptance and the supplemental
  group. Privileged runner, live stage duplication and Metasploit are explicitly
  unexecuted/excluded in the matrix.
- **Real Chrome prerequisite:** PASS. Standalone report
  `round3-browser-preflight-agent-002.json` has 4/4 actual HTTP/HTTPS
  positive/negative Chrome cases. Every final run was launched through
  `browser_preflight.py --then`; all three per-run browser reports are 4/4.

## Final acceptance

- Protected v2: **28/28, 100/100 on each of final-005, -006, -007.**
- Protected v3: **15/15 PASS**, 0 fail, 0 unmeasured, source unchanged
  (`validation/round3-v3-all-001.json`).
- v3 behaviour prerequisite: **13/13 PASS** (`round3-v3-prerequisite-004.json`).
- Original + supplemental regressions: **45/45 PASS**
  (`round3-unit-tests-post-identity.log`).
- Command matrix: **15 supported rows verified**, exclusions labelled
  (`round3-command-matrix.json` / `.md`).
- Manifest: `round3-evidence.json`.

## Three fresh gated runs

| Run | v2 | Browser gate | Retained at trace | Files now | Peak | Work final | Shared final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `round3-release-005` | 100 | 4/4 | 835,351 B | 132 | 190,469,381 B | 0 | 0 |
| `round3-release-006` | 100 | 4/4 | 833,534 B | 131 | 190,472,897 B | 0 | 0 |
| `round3-release-007` | 100 | 4/4 | 833,572 B | 131 | 190,474,115 B | 0 | 0 |

All three completed five stages, eight original follow-ups, closed 18444 and all
six HTTP/HTTPS proof combinations. Source, input, configuration and tool-version
identities are equal; provenance TMPDIRs differ as expected. Dependency
before/after identities are equal. Retained output is far below 16 MiB and 250
files; peaks are below 256 MiB; scratch/shared final bytes are zero.

Against the audited 751,037,028-byte / 2,081-file baseline, the largest retained
run is 839,297 bytes with 132 files: approximately **99.888% fewer bytes** and
**93.7% fewer files**. The reported peak is the protected observer's sampled
total across run/work/shared roots, not process-wide kernel accounting.

## Evidence links

- `validation/round3-v3-all-001.json` — all 15 v3 checks
- `validation/round3-v3-prerequisite-004.json` — 13 behaviour checks
- `validation/round3-browser-preflight-agent-002.json` — standalone 4/4 Chrome
- `validation/round3-browser-before-release-005/006/007.json` — per-run gates
- `validation/round3-release-005/006/007/` — final profiles/evidence
- `validation/round3-release-storage-005/006/007.json` — full measured traces
- `validation/round3-acceptance-release-005/006/007.json` — v2 reports
- `validation/round3-command-matrix.json` — current-source command matrix
- `validation/round3-evidence.json` — absolute-path release manifest
- `validation/round3-identity-evidence.json` — stable/provenance identity split
- `validation/round3-unit-tests-post-identity.log` — 45/45 regressions
- `validation/round3-control-trace.json` — 24 MiB control

Older `round3-release-002/003/004` runs and the pre-gate exploratory
`round3-final-001` are preserved but are **not** counted as final candidates.

## Scope and residual limitations

Metasploit, Legion, authenticated investigation and new targets remain excluded.
Final runs used the owned `127.0.0.2` lab with unprivileged TCP discovery. Stage
1-3/1-4/1-5 receipts use saved XML/offline planning; the live stage 1-5 coverage
is the three gated final runs. Active-TCP receipt is a closed-control-port smoke.
No speed or calibrated-classification claim is made. No additional backup was
created; historical evidence is intact.
