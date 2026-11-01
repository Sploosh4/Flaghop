# Review of the round-two implementation

**31 October 2026.** Read-only review completed before dispatching the next fixes. No scanner source or historical evidence was changed by this review.

**Organisation judgment:** Reasonably separated at the project level, but still prototype-level inside the main modules. The code is more reliable than the first audited version. It is not yet well organised enough to extend comfortably without another round of duplicated policies.

## What improved

- The closed-pipe timeout is fixed in the process loop.
- Dalfox now validates nested report types/counts and keeps malformed output local.
- Run and stage failure handling agree on missing tools and parser errors.
- The WordPress production branch now has access to the installed database.
- Web/API ZAP alert extraction is shared and preserves API provenance.
- The verifier independently checks scope, requires closed-port evidence, and checks both proof origins and stronger task lineage.
- Saved evidence demonstrates three matching functional runs, 28/28 acceptance methods and 39/39 regressions. Retained output is approximately 0.6 MB per run.

These are substantive improvements, not merely cleaner reports.

## Organisation concerns

| Area | Evidence | Assessment |
| --- | --- | --- |
| Module boundaries | Separate classifier, proxy, orchestration, process runner and lab verifier files | A useful starting separation; preserve it |
| Main profiler | `ctf_profiler.py`: 1,015 lines; `Runner.execute` 131 lines; `build` 118 lines | CLI, execution, identity collection, tool-specific dependency setup, cleanup and export remain mixed |
| Stage orchestration | `staged_workflow.py`: 576 lines; `run` 182 lines with nested execution/planning helpers | Commands, applicability, parsing, profile mutation and lifecycle management are tightly coupled |
| Workspace ownership | `/tmp` allocation in Runner and browser validation, version probes overriding TMPDIR, separate per-task and end-of-run cleanup | Several owners make it easy to miss measurement or cleanup paths |
| Tool environment | Generic Runner knows browser socket constraints and WPScan’s user-cache layout | Adapter-specific setup belongs behind a small preparation interface, with the Runner focused on process execution |
| Outcomes | Similar failure/status sets appear in execution, stage aggregation, run aggregation and verification | Centralise production lifecycle rules; keep independent verifier checks separate |
| Data contracts | Most interfaces exchange mutable dictionaries with implicit required fields | Explicit adapter/result/workspace records would improve readability and make failures easier to localise |

Line counts alone are not defects. The concern is that unrelated responsibilities and policies are interleaved in those functions. A small shared workspace/lifecycle component is justified; a wholesale rewrite is not needed to close the remaining blockers.

## Confirmed remaining issues

### R1: The peak-storage measurement still omits real temporary directories

[Version probes](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:165) force `TMPDIR=/tmp`. [Runner browser scratch](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:328) and [browser profiles](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:531) allocate directly under `/tmp`.

The observer watches only the supplied run/work/shared roots and does not follow external symlinks. Cleaning those directories afterward does not measure their peak. The approximately 188 MB recorded peak therefore describes the observed roots, not the entire new workspace.

Chrome’s short Unix-socket path requirement is legitimate. Use a **short, declared `/tmp` workspace that the observer actually watches**, rather than placing files in unrelated random directories. The existing observer already accepts a short `/tmp` directory as `--work`; it may not need modification at all.

The final 16 MiB retained-output target is met. This issue concerns complete temporary peak measurement, not a requirement to keep runtime usage below 16 MiB.

### R2: Cleanup failure is silently treated as success

[End-of-run cleanup](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:746), [per-tool cleanup](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:111), and browser cleanup call `shutil.rmtree(..., ignore_errors=True)` without recording whether deletion worked.

**Reproduced:** In a temporary offline fixture, a runtime file was placed inside a directory without write permission before cleanup. The file survived, but `build` returned **exit 0**, `run.status` was **completed**, and no run error was recorded. Permissions were restored and temporary files removed after the probe.

Cleanup needs an observable result: owned paths, leftovers, errors and the effect on run status. Failure evidence should be retained in bounded logs before large runtime homes are removed; deleting all runtime state unconditionally can discard useful tool diagnostics.

### R3: Tool identity still identifies launchers better than their dependencies

[Tool identity](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:147) now extracts useful version numbers and hashes executables, but it still hashes small shell launchers for ZAP/WPScan rather than the underlying installed code/dependency set. The browser-version regex also records at most three numeric components, losing a fourth build component when present.

The comment that a wrapper hash is “authoritative” is too strong. A wrapper can remain unchanged while the jar, Ruby gems, browser executable, or database changes. The installation lock file is useful provenance but does not itself prove that the installed dependency files match it.

The WPScan database is said to be reused read-only, but pointing `XDG_CACHE_HOME` at an existing user cache does not enforce or demonstrate immutability. Record the selected dependency/database paths and verify their relevant identity before and after the measured run. Avoid changing the original user cache or installing fresh dependencies merely to make this test pass.

### R4: Documentation and final-review coverage are broader than the evidence shown

The new reports establish the tested local workflows and corrected claims. They do not include a round-two command matrix showing which documented examples were actually executed, with their real return codes and evidence paths.

Keep runnable supported examples distinct from placeholders, privileged commands, and excluded Metasploit work. Unsupported or out-of-scope examples should be labelled accordingly, not silently counted as verified.

## Recommended next step

Close R1–R4 with a small workspace/dependency/lifecycle refactor, then repeat the fixed-configuration evidence sequence. Preserve the existing functional tests and protected evaluator. Treat the final review milestone as unfinished until the extra writable locations, underlying dependencies and documented command claims have evidence.

This review does not establish that total peak usage exceeded 256 MiB; it establishes that the current measurement cannot prove that it stayed below that budget.
