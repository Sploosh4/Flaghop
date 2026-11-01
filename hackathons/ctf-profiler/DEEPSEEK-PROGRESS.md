# DeepSeek progress — round three blockers

Updated: 2026-10-31 16:00 AWST

## Current gate status

- **v3 behaviour prerequisite: PASS — 13/13**, 0 fail, 0 unmeasured.
  - Report: `validation/round3-v3-prerequisite-004.json`
  - Receipt: `validation/round3-command-v3-behaviour-prereq-003.json`
  - Earlier baselines/failures preserved.
- **v3 all 15: PASS — 15/15**, source unchanged (`validation/round3-v3-all-001.json`).
- **Protected v2: 100/100, 28/28 on final-005, -006 and -007.**
- **Original + supplemental regressions: 45/45 pass**
  (`validation/round3-unit-tests-post-identity.log`).
- **Stable identity:** final tool_versions equal across all three runs;
  per-run version_provenance records distinct TMPDIRs; dependency before/after
  equal. Targeted regression added.
- **Real Chrome gate:** standalone 4/4; each final run launched through
  `browser_preflight.py --then` and passed 4/4.

## B1 — Temporary storage
- **Closed for the prerequisite:** version probes now use the declared work
  root when no Workspace object is supplied; browser profiles/Chrome TMPDIR and
  tool TMPDIR are owned by `Workspace`.
- v3 B1: 4/4 pass, including the 24 MiB transient observer control and actual
  browser profile/TMPDIR containment.
- Control trace: `validation/round3-control-trace.json` — 25,165,824-byte peak,
  17-byte final run, 0 work final.
- Three gated final runs measured: retained 835,351 / 833,534 / 833,572 bytes
  at trace time, 132/131/131 current files, peak 190,469,381 / 190,472,897 /
  190,474,115 bytes; work/shared final 0/0. All three are under the 16 MiB,
  250-file, 256 MiB and 200 MiB targets.

## B2 — Cleanup lifecycle
- **Closed for the prerequisite:** cleanup reports attempted paths, errors,
  leftovers and bytes; permission failure makes the run partial/exit 2;
  neighbouring fixtures survive; diagnostics are bounded.
- v3 B2: 5/5 pass, including real permission-denied and interruption fixtures.
- Supplemental tests: `tests/test_round3_supplemental.py` (6/6 pass, including
  the stable-identity/provenance regression).

## B3 — Dependency identity
- **Closed for the prerequisite:** selected WPScan cache now honors
  `CTF_PROFILER_WPSCAN_CACHE`; database mutation is detected; a changed
  dependency makes the run partial/nonzero; full four-component browser version
  is preserved.
- v3 B3: 4/4 pass.
- Profile records launcher, resolved implementation, ZAP jars/plugins, WPScan
  gemspecs and selected database hashes before/after.
- Three-run release dependency identity: `identity-evidence.json` confirms
  equal `tool_versions`, distinct per-run `version_provenance` TMPDIRs, and
  dependency before/after equality; v3 release check passed.

## B4 — Command evidence
- **Closed.** Fifteen current-source receipts cover help, check-tools, offline,
  dry-run, saved-XML, stage 1-3/1-4/1-5, active-TCP smoke, verify, WordPress,
  negative, regression, v2 and supplemental. Privileged/live-duplicate and
  Metasploit rows are explicitly marked unexecuted/excluded.
- Matrix: `validation/round3-command-matrix.json` / `.md`.

## Final source identity

| File | SHA-256 |
| --- | --- |
| `ctf_profiler.py` | `766911f1d24d1ebc0c529a2b6186047978c7ce7c758bc1c46327126aaf3aa775` |
| `staged_workflow.py` | `a3503172349017c1ab94e91a61fbcc5a91fe39bae30b5c94271d308f1c0bb5c0` |
| `workspace.py` | `82d309705aa0cb2b38cc85bade63c6ad0e300dac4ad2a042e46590009b979f5d` |
| `dependencies.py` | `79c744b9faee80956d07e7852523c1e2a18b5302fe87e6d904e9acec7e2a8d57` |
| `device_classifier.py` | `4686cf0ff7e797df1c14b2cdad3cece0732d4a6699ef9e9bd0ba34bacb552134` |
| `scope_proxy.py` | `fa9e07473462d3b15872cc7c93d6da2579791fc1b4a7f1a8c29697632eb34e4e` |

## Active / preserved evidence

- `validation/round3-final-001/`, `round3-release-001/002/003/004` are
  pre-gate/earlier-source exploratory outputs. They are preserved but **not**
  counted toward final acceptance or the three matching runs.
- No additional backup created; historical evidence untouched.
- No new agents, provider/MCP changes, or scope expansion.

## Final measured result

- Three gated runs `round3-release-005/006/007`: all v2 100/100, all six proofs,
  eight follow-ups, five stages, closed control observation.
- Retained at trace: 835,351 / 833,534 / 833,572 bytes; 132/131/131 files.
- Sampled peak: 190,469,381 / 190,472,897 / 190,474,115 bytes; work/shared final
  0/0.
- Full report: `validation/round3-FINAL-REPORT.md`.
- Manifest: `validation/round3-evidence.json`.
- No source changes after the final-run sequence.

## Real blockers
- None currently. Privileged UDP/OS discovery and Metasploit remain explicitly
  out of scope; no password or sudoers change was requested.
