# Scanner refactor and validation — 31 October 2026

The scanner has been split into components with explicit responsibilities while preserving its CLI, saved profile format and existing public Python helper imports. The live workflow remains sequential. Its lower-level components can now be imported without loading either coordinator.

## Size and organisation

The original six root Python modules contained 2,216 physical lines / 111,925 bytes (109.3 KiB). The refactor has 18 modules containing 2,364 lines / 116,270 bytes (113.5 KiB). Imports, task type contracts and module documentation add some total code; the benefit is smaller responsibilities and an acyclic import graph, not a reduction in total bytes.

| Coordinator | Before lines | After lines | Reduction |
| --- | ---: | ---: | ---: |
| ctf_profiler.py | 1,079 | 343 | 68.2% |
| staged_workflow.py | 596 | 225 | 62.2% |

The remaining modules range from 42 to 217 lines. [ARCHITECTURE.md](../../../../../../hackathons/ctf-profiler/ARCHITECTURE.md) contains the full size table, responsibilities and extension guidance. [module-layout.json](../../../../../../hackathons/ctf-profiler/validation/refactor-20261031/module-layout.json) records the import graph and exact source hashes.

Extraction separates process execution, tool environments, Nmap discovery, service planning, output parsing, web assessment, independent reproduction, optional Metasploit preparation, workspace cleanup, identities and evidence storage. The CLI owns profile assembly; staged_workflow owns conditional stage ordering. TaskSpec/TaskResult document dictionary contracts without introducing runtime validation or a new workflow engine. Compatibility re-exports preserve the existing helper API and evaluator patch points. All root production modules are now included in source identity.

The profile is still a shared mutable dictionary, and tool selection remains explicit branches. This is a structural extraction, not a new plug-in system or a wholesale rewrite of existing logic.

## Checked results

| Check | Result | Evidence |
| --- | --- | --- |
| Regression suite, including two new boundary checks | 47/47, actual exit 0 | command-regression-final.json and its stdout/stderr |
| Protected v3 behaviour prerequisite | 13/13, no failures/unmeasured, actual exit 0 | behaviour-final.json, command-behaviour-final.json |
| Protected v3 combined suite | 15/15, no failures/unmeasured, actual exit 0 | acceptance-v3-all.json, command-v3-all.json |
| Full live fixture runs | Three sequential browser-gated runs completed; 28/28 protected v2 checks each | run-series.json; acceptance-001/002/003.json |
| Real Chrome prerequisite | Four HTTP/HTTPS positive/negative cases passed before each full run | browser-001/002/003.json |
| CLI/command matrix | 15 command categories with current-source receipts | command-matrix.json, evidence.json |
| Independent staged verifier, WordPress fixture, negative fixture | All actual exit 0 | command-verify.json, command-wordpress.json, command-negative.json |
| Functional comparison with pre-refactor full run | Task IDs/tool/status, findings, stages, configuration and classification match | functional-comparison.json |

The two new tests check component imports without the coordinators and absolute CLI execution from another working directory, including complete production-module identities. They are in tests/test_refactor_api.py.

The behaviour prerequisite and regressions finished before all three browser gates. Each gate launched the actual storage-observer/scanner argv through --then, so the outer receipt records the full child result. The candidate source stayed unchanged throughout. Source/input/configuration/stable tool identities match across all three runs; per-run probe provenance remains separate.

## Storage and proof evidence

Each run reproduced the same six findings: exposed Git configuration, boolean SQL injection and browser-executed reflected XSS over HTTP and HTTPS. Artifact hashes and browser DOM tokens were inspected independently of the agent's reported score. Current retained bytes include the extra independent verifier report added after run 001's storage trace.

| Run | Current retained bytes | Files | Sampled total peak bytes | Owned work peak bytes | Shared cache peak bytes | Chrome gate | v2 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 001 | 841,375 | 132 | 190,471,105 | 6,529,836 | 0 | 4/4 | 28/28 |
| 002 | 838,873 | 131 | 190,473,985 | 6,529,357 | 0 | 4/4 | 28/28 |
| 003 | 843,171 | 131 | 190,464,692 | 6,529,597 | 0 | 4/4 | 28/28 |

Each run retains about 0.80 MiB, below the 16 MiB / 250-file final limit. The largest sampled total peak was 190,473,985 bytes (181.65 MiB), below 256 MiB. Owned work and shared-cache final bytes were zero. The declared work roots are under /tmp; browser TMPDIR/profile paths fit the layout exercised by the real gate. Cleanup reports had no leftovers, and the owned workspace paths were absent afterward. No unaccounted symlinks were reported.

These are sampled measurements of the declared run/work/shared roots, not a system-wide filesystem write audit or an exact instantaneous peak. Preflight fixture state is separately covered by the gate's ownership and cleanup evidence.

## Evidence review and limitations

[independent-review.json](../../../../../../hackathons/ctf-profiler/validation/refactor-20261031/independent-review.json) records checks of all 13 protected-file hashes, 20 current-source command receipts and their log hashes, source identities, launch ordering, browser proofs, retained artifacts, budgets and cleanup. The protected v2/v3/browser evaluators were unchanged. Historical outputs were preserved. No new backup was made, no DeepSeek agent was started or resumed, and the scheduled ten-minute monitor remains paused.

Live coverage is the existing owned loopback fixture with unprivileged TCP and stages 1–5. Privileged UDP/OS discovery and Metasploit execution were not tested. The shorter stage command variants were checked offline, not as additional live scans. Existing independent evaluator passes do not prove every external tool/configuration or every possible write root.

**A previously identified dependency-audit gap remains:** Chrome identity fingerprints its launcher rather than the actual Chrome ELF, and WPScan identity omits its installed implementation entrypoint. The protected suites pass despite this gap. This refactor does not claim to close that separate issue or establish complete scanner release readiness.
