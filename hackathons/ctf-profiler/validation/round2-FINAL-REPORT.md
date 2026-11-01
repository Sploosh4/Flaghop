# Round-two acceptance and release report

**Date:** 31 October 2026  
**Suite:** `scanning-acceptance-v2` (28 methods, 12 weighted hills)  
**Harness hashes:** `acceptance.py` `f54639936febee049b8c4be0a42f6b6fa984987f4de1ba070a1d6fd59e5dc633`;
`measure_storage.py` `727a82727c7f721c1abdc3829e6794346d4c7e3bf6011a4accc8552fa5b2feb2`;
evaluator thresholds, fixtures, and protected files were not edited.

## Score

- **Audited baseline: 20.1111/100** — 6 pass, 21 fail, 1 unmeasured.
- **Final: 100.0/100** — **28/28 methods pass**, 0 fail, 0 unmeasured.
- All 12 hills complete: H01 10, H02 10, H03 20, H04 10, H05 10, H06 8,
  H07 6, H08 12, H09 5, H10 5, H11 2, H12 2.
- This score is not the earlier self-assessed 100-point checklist.

## Three fresh final runs

All three used the same production source
(`ctf_profiler.py e6be0a2f…ff915d`, `staged_workflow.py 077050cd…bc7070`,
`device_classifier.py 4686cf0f…b552134`, `scope_proxy.py fa9e0747…eb34e4e`),
the same unprivileged active TCP discovery flags, timeouts, input hashes, and
numeric tool versions.

| Run | Acceptance | Retained logical / allocated | Files | Peak logical / allocated | Work final | Shared final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `round2-final-001` | 100, 28/28 | 605,259 / 876,544 | 127 | 187,704,755 / 188,497,920 | 0 | 0 |
| `round2-final-002` | 100, 28/28 | 591,448 / 868,352 | 127 | 187,709,340 / 188,510,208 | 0 | 0 |
| `round2-final-003` | 100, 28/28 | 602,424 / 872,448 | 127 | 187,705,379 / 188,502,016 | 0 | 0 |

Each run has five completed stages, the five expected open TCP services plus
closed 18444, eight original follow-ups, and all six HTTP/HTTPS proof
combinations. No run executed Metasploit.

Storage against the audited 751,037,028-byte / 2,081-file baseline:
**605,259 bytes** retained for run-001, saving **750,431,769 bytes (99.919%)**;
**127 files**, 93.9% fewer. Peak workspace is under 256 MiB. Shared cache and
scratch final bytes are zero; retained and traced symlinks are empty.

## Repro fixes

- **WPScan:** production Runner points WPScan at the installed shared database
  while keeping `HOME`/config isolated and a run-local cookie jar. H01 passed
  twice through the real conditional branch, Runner, proxy and parser.
- **Deadlines:** the runner monitors process lifetime independently of pipe
  lifetime; closed-pipe children now time out correctly.
- **Verifier:** explicit closed-port observation, both HTTP/HTTPS origins,
  failed-task/stage consistency, excluded-execution rejection, proof-to-task
  lineage, and reproduced-status enforcement. Positive control still passes.
- **Negative fixtures:** corrected Git URL join; tests assert real completed
  Git/SQL/browser validator tasks; missing browser fails instead of counting as
  a negative; server cleanup uses shutdown/join under two seconds.
- **Parsers/outcomes:** strict Dalfox nested schema validation and local
  TypeError containment; partial stages/missing tools cannot leave a completed
  run; API-only ZAP alerts retain `zap-api-*` provenance.
- **Storage:** ZAP homes, browser state, tool state, and scratch are removed
  after reports/proofs are harvested, before the artifact manifest is written.
- **Metadata:** required effective configuration fields, 10 real numeric tool
  versions, and template/wordlist SHA-256 identities are recorded.
- **Documentation:** stale runner/Metasploit-import claims removed.

## Release gates

`validation/round2-release-gates.json` records all gates true:

- 28/28 acceptance methods pass in all three final runs.
- Same source hashes, configuration, input identities, numeric versions, and
  discovery coverage across the three runs.
- All stages/follow-ups/closed observation/six proofs preserved.
- Metasploit excluded; retained <=16 MiB and 250 files; peak <=256 MiB;
  shared <=200 MiB; scratch zero; no unaccounted links.
- Original regression suite **39/39 passing**
  (`validation/round2-unit-tests-final.log`).
- Negative fixtures really exercised; corrected cases reproduce zero findings.
- Classification uncertainty and target restrictions remain intact.

## Extra writable locations

The measured run/work/shared roots are the three final directories and their
`round2-final-work-*` / `round2-final-shared-*` siblings. Browser profile
scratch and version-probe scratch use short-lived `/tmp` directories because
Chrome's Unix socket path limit is shorter than the project path; these are
removed before process completion and no `/tmp/ctf-profiler-*` leftovers
remain. The installed WPScan database is reused read-only from the pre-existing
user cache; no new persistent shared cache was created. Evaluation command logs
and acceptance/storage reports are retained outside the measured run roots as
review evidence (`validation/round2-final-*.log`, `round2-acceptance-final-*`,
`round2-final-storage-*`); they are not hidden runtime state.

## Evidence

- Acceptance: `validation/round2-acceptance-final-001.json` … `-003.json`
- Logs: matching `validation/round2-acceptance-final-*.log`
- Storage: `validation/round2-final-storage-001.json` … `-003.json`
- Release gates: `validation/round2-release-gates.json`
- Original tests: `validation/round2-unit-tests-final.log`
- Intermediate full-suite run: `validation/round2-acceptance-003.json`
- Progress: `DEEPSEEK-PROGRESS.md`

## Limitations

- Final runs used unprivileged active TCP discovery, not privileged OS/UDP
  discovery; this is the fixed configuration evaluated for repeatability.
- The WordPress positive branch is exercised by H01 on the owned static fixture,
  not by the non-WordPress lab run.
- Classification remains heuristic and uncalibrated; no new device dataset was
  introduced. Metasploit, Legion, authenticated investigation, and new target
  scope remain excluded.
- No speed claim is made. No new backup was created; the single existing backup
  and historical runs are intact.
