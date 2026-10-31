# Scanner integration checkpoint

Scanner integration checkpoint for `master`, developed on `codex/scanner-integration`.

## Implemented

- Selected-device Deep scan, one active job per project/device, explicit network
  revision, a literal target IP and optional explicit resolver. Arguments and
  fresh output ownership come from the app, not an API-supplied shell command.
- Shared job queue and ProcessRunner/NetworkLease. The scanner and descendants
  retain the private network GID; its egress is narrowed to the checked literal
  target/resolver and configured ports. Proxy registration permits only the
  listener proven to belong to that scan's group, with removal on proxy close.
- Queued/running/completed/partial/failed/held/cancelled records, retained errors,
  source/profile/evidence hashes, and restart handling. Old scanner process
  commands cannot be replayed into an existing output directory.
- Strict profile/path/checksum/single-target XML validation before import.
  Services reuse the existing Nmap inventory importer. Ranked roles remain
  hypotheses; candidates and independently reproduced findings stay separate.
- Selected-device results, Working, History and evidence reopening in the
  independent editor. Reader notifications remain project-scoped unless their
  source has a verified device association. Internal scan metadata does not
  generate discovery notifications; found target-file content remains eligible.
- Per-project database summaries and evidence under
  `workspace-tool-output/deep-scans/[run id]`. Existing project ZIP export includes
  that tool-output folder. No source toolchain or private run data is bundled.

## Source boundary

The bundle has all 18 production modules plus two assessment templates and one
wordlist, with a SHA-256 manifest. These files match the standalone scanner's
Python 3.12 compatibility candidate byte for byte. Only app adapters are new;
the scanner remains usable independently.

The app interpreter is Python 3.12. An initial compatibility run exposed malformed
wrapper-path handling in the scanner dependency auditor. Its owner corrected
`dependencies.py` and preserved primary errors in `ctf_profiler.py`, adding four
regressions. Those two corrected files and the four unchanged compatibility
tests are in this bundle. Fresh standalone validation passed 51 regressions on
both Python 3.12 and 3.14, 15 supplemental checks and three full five-stage runs.
Each run passed its real Chrome prerequisite (4/4) and acceptance suite (28/28).
The owner completed the command matrix and evidence review. Production hashes
match this bundle; report/test identities and counts are retained in
`vendor/ctf_profiler/validation-provenance.json`. These standalone fixture passes
do not satisfy the separate live app guard gate below.

External executables must already be available on PATH. Missing tools and
parse/cleanup failures remain visible. The known Chrome launcher-versus-ELF and
WPScan implementation-entrypoint fingerprint gaps remain open. Passing scanner
fixtures does not establish complete dependency or release sign-off.

## Validation and gate

The app tests cover scope/exclusions, target/project mismatch, missing/stale
configuration, deduplication, queued cancellation, timeout, malformed/incomplete
profiles, linked/traversing evidence, checksums, partial parse/tool/cleanup
outcomes, reload, callback persistence and owned-proxy registration. A real
temporary loopback proxy test checks its forwarding and rejection behavior;
it does not prove privileged nftables enforcement.

The desktop fixture runs a real child process that writes labelled synthetic
evidence, then exercises the actual API/job/import/results/editor flow on both
transports. Its lease is replaced for the fixture. It proves UI plumbing and
ownership, not a live target scan or kernel egress enforcement.

Before the final launcher fix, checks on 31 October 2026 passed 526 Python tests, Black/flake8, 56 React
tests, schema/type checks and the reproducible production build. Scanner desktop
fixtures passed 13 checks per transport. Existing workspace, hardware, document
and title-bar regressions passed another 230 checks across both transports, with
no reported JavaScript errors. The byte-verified packaged CLI also passed an
offline XML/profile/cleanup run under Python 3.12; offline parsing is not active
scan acceptance.

The app's profile validator also read all three current standalone run profiles
and verified their source identities, artifact hashes and one-target XML. Each
retained six services and six reproduced findings, distinct from its assessment
candidates. This was read-only validation of saved lab evidence, not a scan
through the app guard or an import into the user's workspace.

Commands from the repository root:

```sh
scripts/check-maintainability.sh
scripts/frontend.sh check
QT_QPA_PLATFORM=offscreen QTWEBENGINE_CHROMIUM_FLAGS=--disable-gpu \
  .venv/bin/python tests/desktop/scanner_smoke.py
LEGION_SMOKE_WEB_STACK=legacy QT_QPA_PLATFORM=offscreen \
  QTWEBENGINE_CHROMIUM_FLAGS=--disable-gpu \
  .venv/bin/python tests/desktop/scanner_smoke.py
```

The opt-in live acceptance uses a temporary owned loopback HTTP fixture and the
real guard. Run it as the normal project owner in the same terminal after local
administrator authentication:

```sh
sudo -v
.venv/bin/python tests/desktop/scanner_guarded_acceptance.py
```

`--tool-bin /path/to/already-installed/bin` can select existing dependencies;
it does not install or copy them. Exit 77 means missing administrator
authentication; exit 2 means incomplete/failed acceptance; exit 0 requires the
profile/import/reopen flow, supported reproduction, a real Chrome DOM proof under the guard, and allowed/denied-port controls. Detailed polling logs are suppressed; progress prints at most every 20 seconds. Optional tool failures
can still make the scanner profile partial even when that flow is demonstrated.

The live gate passed on 31 October 2026. The scanner ran as the normal user,
returned a complete profile, imported its service and reopened saved evidence.
Independent requests/DOM inspection confirmed the guarded browser executed the
owned reflection fixture. A separate normal-user probe in the scanner's private
GID received HTTP 200 on the allowed port and timed out on a second live owned
listener whose port was outside the project's allowlist. No guard bypass was used.

The launcher preserves the authenticated terminal session while allocating a
separate process group for cancellation. Its small runtime environment allowlist
is restored only after privileges have been dropped; it does not depend on
sudo-rs preserving `-E`. No sudo policy was changed and the scanner does not run
as root. The browser prerequisite passed all four real HTTP/HTTPS positive and
negative cases before the live app run. A `/tmp` directory alias points into the
project's mounted capped temporary directory; its path length matches the actual
layout and all data remains counted inside the cap. Protected tests are unchanged.

Earlier failures remain evidence: the original detached sudo launcher failed
before producing a profile; one retry stopped at the preflight path check; a
later quiet-output wrapper detached authentication before launch. The first
successful scanner/import/reopen run then exposed a collector race with atomic
metadata replacement. The collector now skips only transient root metadata,
preserves target evidence with similar names, and always attempts cleanup. Two
regressions reproduce that disappearance and preserve legitimate raw files.

The final live run retained 349,494 bytes in 43 files, including its app metadata.
The browser/scanner workspaces reported successful cleanup. Its captured log was
10,748 bytes rather than a stream of status polls. Post-launcher formatting,
lint and all **529 Python tests** passed; the current frontend also passed **56
React tests**, schema/type checks and the reproducible production build. Both
scanner desktop paths were rerun afterward: **13 checks per transport**, with no
reported JavaScript errors. Source hashes stayed unchanged through
the live check. This verifies the stated local fixture, not VPN/remote execution,
privileged UDP/OS detection or all possible browser configurations.

Local evidence is under the ignored `.artifacts/disposable/`: final command
receipt/log `command-app-live-006.json` and `.log`, four-case browser report
`scanner-browser-attempt-006.json`, and the unique report/run under
`scanner-guarded-acceptance/`. Final regression logs use `scanner-takeover-*`.
No investigation data or user project was used as a target or bundled publicly.

No authenticated sessions, pivoting, privilege escalation or Metasploit execution
are added; no DeepSeek agent or paused monitor has been started. The dependency-identity caveat above remains.
