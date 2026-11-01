# Real Chrome prerequisite

Josh requires proof that the actual browser works before more full runs. The existing 13 behaviour checks use controlled processes/path capture; this separate four-case gate launches the installed Chrome through **production `validate_browser`, Runner, Workspace and TargetProxy**.

It serves disposable owned HTTP and HTTPS fixtures on loopback. Positive pages execute a fresh controlled SVG handler and set the expected attribute on the rendered HTML root; negative pages escape the same payload and must not produce a proof. The observer independently parses the returned DOM and checks that each fresh fixture request arrived. All four Chrome invocations must exit 0. Missing browser, launch failure, timeout, false positive, escaped temporary paths, source edits or failed cleanup prevent a pass. The Chrome sandbox/options match the production validator; no `--no-sandbox` workaround is added.

| Requirement | Passing evidence |
| --- | --- |
| HTTP and HTTPS browser execution | Two positive cases fetch their fresh fixture URLs, exit 0 and produce both the actual DOM token and production finding |
| No false success | Two escaped negative cases exit 0 with no DOM proof or production finding |
| Measured workspace ownership | Browser TMPDIR and user-data paths remain under the declared owned `/tmp` root |
| Cleanup and candidate identity | No owned leftovers; servers stop; source hashes stay unchanged and match the candidate |
| Gate prevents wasted runs | `--then` launches its command only after all four cases pass; failure returns nonzero without executing it |

## Commands

Standalone smoke test (use a new report name):

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/browser_preflight.py \
  --project /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler \
  --output validation/round3-browser-preflight-001.json
```

**Start each new full run through this gate** by adding `--then` followed by the actual storage-observer/scanner command:

```text
python3 -B /absolute/path/scanning-acceptance-v3/browser_preflight.py \
  --project /absolute/path/ctf-profiler \
  --output validation/round3-browser-before-release-003.json \
  --then python3 -B /absolute/path/scanning-acceptance-v2/measure_storage.py [the real run/work/shared/output arguments] -- [the real scanner argv]
```

The second block describes argv structure, not a runnable command with filled-in paths. Use the existing authorised scan configuration and scope; do not invent another workflow. The gate writes its browser evidence first and then uses `exec`, so the outer recorder sees the actual full-run exit code. Do not append a full run after a semicolon, swallow a failing exit, or start the scanner independently. The default preflight uses a representative `/tmp/cp-r3-rel-work-check-*` root. Planned full-run workspace, browser TMPDIR and profile path byte lengths must not exceed those exercised by the successful test; shorten declared run roots if needed, keeping them measured. If the allocation strategy changes, rerun the gate.

Keep the original **13/13 behaviour prerequisite and applicable regressions** on the frozen candidate before this browser gate. Then gather three fresh matching full runs and the existing 15-check release evidence. These four additional real-browser cases do not change the protected v2/v3 evaluator, original baseline or thresholds. Source/browser changes invalidate old browser evidence. Any already-running pre-gate scan is exploratory only; preserve its outputs and use fresh names.

The evaluator's `--control-overlong-socket` option deliberately recreates the original nested per-task TMPDIR layout with the real browser. It must reproduce `Socket path too long`, return nonzero and never launch `--then`. A control run is **never release eligible**, even if an unexpected browser version tolerates the path. Use it only for harness validation, not for final runs. Controlled crashes inherit a zero core-file limit to avoid large core dumps.

Outputs retain bounded Chrome stdout/stderr, commands/exit codes, DOM proof results, source/browser hashes, workspace/cleanup evidence and timestamps. Ephemeral TLS keys, browser homes and fixture files are removed. No backup or full scan is created by a standalone preflight.
