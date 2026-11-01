# Python 3.12 compatibility fix — 31 October 2026

Flaghop Builder found that its Python 3.12.16 interpreter could not run the unchanged scanner reliably. The old dependency auditor treated a multiline testssl comment as a quoted absolute path. Python 3.12 Path.is_file() raised ENAMETOOLONG; Python 3.14 suppresses that stat error, which hid the defect during previous validation. Initial profile creation stopped, and the later dependency comparison replaced the original error message.

## Changes

Only two production files changed:

- dependencies.py: quoted literal hints cannot span lines or contain NUL; quoting must match. Individual invalid, overlong or unstatable path hints are skipped rather than aborting collection. Valid implementation files still contribute content hashes. This remains heuristic literal discovery, not a shell parser.
- ctf_profiler.py: a dependency comparison no longer overwrites an existing primary run error. The dependency-change flag and partial outcome remain visible.

Four new regression tests in ../../tests/test_dependency_compat.py cover multiline comments, valid paths with spaces, quoted/unquoted overlong literals, stat errors, implementation mutation detection and preservation of the original read failure. The four test methods failed against the original source on Python 3.12. One intermediate test assertion incorrectly required an unquoted wrapper to omit its shebang interpreter; the final test correctly requires the valid implementation and excludes the invalid hint. All intermediate reports are retained.

The source remains modular: 18 root Python files, 2,371 physical lines, 116,711 bytes. dependencies.py is 121 lines and the CLI coordinator remains 343. Existing scanner CLI/profile contracts are unchanged.

## Checked results

| Check | Result | Recorded evidence |
| --- | --- | --- |
| Targeted compatibility tests, Python 3.12 | 4/4, actual exit 0 | command-targeted-final.json |
| Full regressions, Python 3.12.16 | 51/51, actual exit 0 | command-regression-312.json |
| Full regressions, Python 3.14.4 | 51/51, actual exit 0 | command-regression-system.json |
| Protected v3 behaviour prerequisite, Python 3.12 | 13/13; no failures/unmeasured | behaviour-312.json |
| Three full five-stage runs, Python 3.12 | All completed, six independently reproduced findings each | run-series.json; run-001/002/003 |
| Real Chrome gate before each full run | 4/4 HTTP/HTTPS positive/negative cases each | browser-001/002/003.json |
| Protected v2 acceptance per run | 28/28 each, actual exit 0 | acceptance-001/002/003.json |
| Full protected v3 evidence suite | 15/15; no failures/unmeasured, actual exit 0 | acceptance-v3-all.json |
| Command matrix | 15 categories with current-source receipts | command-matrix.json; evidence.json |
| Independent profile verifier, WordPress and negative fixtures | Actual exit 0 | command-verify/wordpress/negative.json |

Regressions and the 13 behaviour checks finished before the browser gates. Each full run was launched by browser_preflight.py --then with the actual unchanged storage-observer/scanner argv. Production source stayed frozen. Source/input/configuration/stable-tool identities match across all three runs. Per-run provenance is kept separately. No historical result was counted as a current pass.

The reporting coordinator was paused while its second full-run child continued untouched, then restarted after that child completed. This corrected a command-matrix path that still referred to the previous refactor directory. The completed scan receipts were reused; no scan was interrupted or repeated, and old evidence was not overwritten. run-series.json records the coordinator note.

## Storage and independent inspection

| Run | Current retained bytes | Files | Sampled total peak bytes | Owned /tmp work peak bytes | Shared-cache peak bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| 001 | 841,290 | 132 | 190,475,873 | 6,529,904 | 0 |
| 002 | 843,157 | 131 | 190,481,143 | 6,529,901 | 0 |
| 003 | 838,316 | 131 | 190,505,290 | 6,529,658 | 0 |

All runs retain about 0.80 MiB, below the final 16 MiB / 250-file limit. Owned work and shared-cache final bytes were zero; no unaccounted symlinks or owned cleanup leftovers were reported. The largest sampled total peak is 181.68 MiB, below 256 MiB. Run 001 current bytes include its additional independent verifier report after the storage trace.

[independent-review.json](independent-review.json) records checks of 13 protected-file hashes, 22 current-source receipts/log hashes, the 18 production hashes, all three stable identities, browser gate ordering/launch argv, actual browser requests/exits/DOM proofs, 130 saved artifact hashes per run, path-length fit, retained budgets and cleanup. These are sampled measurements of declared run/work/shared roots, not a system-wide write audit. Preflight state has separate ownership/cleanup evidence.

## Builder handoff and limits

Current changed-file hashes:

- `dependencies.py`: `9bc5dd7af7995133438ed01dbaea302667e6a280ed073cea37cf7d05b49efb11`
- `ctf_profiler.py`: `e419e64a9fbe99913e1973596a84be845fabfc017919675d30de854e16f88f5b`

[source-manifest.json](source-manifest.json) lists all production files and the new regression test hash. Builder can refresh these two files without flattening the scanner's modules or copying local tooling/history into FlagHop. Standalone fixture evidence does not prove the application's guarded job/egress path: that live integration test is separate and was awaiting administrator authentication in Builder's last update.

The pre-existing dependency-identity gap remains open: Chrome launcher identity omits the actual Chrome ELF, and WPScan identity omits its implementation entrypoint. Protected tests pass despite that gap. No claim of complete dependency/release sign-off is made. Privileged UDP/OS detection, Metasploit execution and separate active shorter-stage runs remain outside this validation; stage-variant command checks are offline.

No new backup or agent was created. The ten-minute DeepSeek monitor remains paused.
