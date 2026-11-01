# DeepSeek follow-up — close the final review blockers

Read [the latest code review](/home/joshua/Documents/ChatGPT/Hackathons/DEEPSEEK-SCANNING-ROUND2-REVIEW.md) before making changes. The user has authorised fixing the remaining blockers and restarting ten-minute updates.

Project: `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler`.

The existing 28-method evaluator reports 100/100 on three runs, and 39 regressions pass. Keep those successes. The remaining gaps concern full storage measurement, cleanup failure handling, dependency identity and documentation evidence. Do not reuse the current 100/100 as proof these extra checks passed.

## Executable hills and plan

**Additional Chrome gate requested by Josh:** use [the real browser preflight](/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/CHROME-PREFLIGHT.md) before any further full run. It must pass all four real HTTP/HTTPS positive/negative cases with current unchanged source, actual Chrome exit 0, valid fresh DOM proof and clean owned state. Launch each full run through `browser_preflight.py --then` followed by the actual measured-run command: a failing preflight must never launch that command. This is separate from, and additional to, the 13 behaviour checks and regressions below. Do not edit or bypass this observer-owned gate. The already-started `round3-release-002` is also exploratory under this new requirement; preserve it and start a fresh final series only after the gate. Keep final-run browser/profile/TMPDIR path lengths within the tested layout. A new source/browser change requires new prerequisite evidence.

**Josh's latest ordering requirement:** before starting any more final runs, run the observer-owned v3 **behaviour group**, fix all three baseline failures, and obtain **13 pass / 0 fail / 0 unmeasured**, exit 0, with unchanged source hashes matching the final candidate. Run applicable regressions afterward. Your own five supplemental tests and the old 28-method evaluator are not substitutes. A production edit invalidates this prerequisite and affected final runs. The already-started `validation/round3-final-001` is exploratory evidence only; let it finish safely, preserve it and use fresh names for the eventual final series. Record the prerequisite report, source hashes and ordering in `DEEPSEEK-PROGRESS.md`. Final runs must start after the prerequisite pass on the matching source.

Josh explicitly requested executable tests and hill-climbing against them. The observer-owned [v3 suite and evidence contract](/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/README.md) now provide **15 supplemental checks**. The stable-source baseline taken during your early round-three edits was **10 pass, 3 fail, 2 unmeasured**; see `scanning-acceptance-v3/baseline-final.json`. This is not the old round-two score. The first failures concern standalone version TMPDIR, selected database identity and mutation preventing completion. The missing checks require the command matrix and three full measured runs.

Plan:

1. Read the suite, contract and baseline; confirm your source revision and diagnose each failing behaviour. Preserve the organisation improvements already working.
2. Fix one unmet condition, run its targeted tests, then the behaviour group. Record actual return codes and per-check progress. Keep all protected v2/v3 tests, thresholds and baselines unchanged; report a reproducible evaluator defect for observer review.
3. Once the behaviour group and regressions pass, freeze the production candidate. Use the supplied command recorder for current-source command receipts, and create three matching measured full runs without editing source during the sequence.
4. Build `validation/round3-evidence.json` with absolute receipt/run paths following the README. Run the complete v3 suite with `--evidence`; a behaviour-only pass does not close the release checks.
5. Inspect the result against Josh's actual goal, not just the pass count. Update progress and the final report with evidence and remaining limitations. Independent final review remains required.

From `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler`:

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/acceptance.py --project /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler --group behaviour --output validation/round3-v3-behaviour-001.json
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/acceptance.py --project /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler --evidence validation/round3-evidence.json --output validation/round3-v3-all-001.json
```

Use fresh output filenames for each invocation. Keep iterating toward the unmet conditions without weakening tests or dropping requested features. Repeated failures need diagnosis or a changed approach, not identical blind retries. Reuse the existing agent and single existing backup. The reusable handoff workflow is [deepseek-handoff](/home/joshua/.codex/skills/deepseek-handoff/SKILL.md); it also describes how to plan and report this loop.

## B1 — Account for all new temporary storage, including /tmp

Prefer a short dedicated workspace such as `/tmp/cp-r3-001`, supplied as the observer’s `--work` root. Allocate browser profiles, Chrome singleton sockets, version-probe scratch and tool temporary state within that declared root or another explicitly measured root. Do not measure all of `/tmp`, which includes unrelated applications.

The protected v2 observer already accepts a short `/tmp` work root. **First try fixing the application’s allocations and environment so that the existing observer covers them.** Keep protected v2 scripts, thresholds, baseline and hashes unchanged. If an additional observer capability is genuinely needed, implement and test it separately; do not weaken the protected evaluator to get a pass.

Acceptance evidence:

- A harmless control command creates a **24 MiB** transient file under the declared `/tmp` workspace, keeps it long enough to sample, deletes it, and retains a tiny output. The observer must report at least 24 MiB while running and the small final size afterward.
- Tests show actual browser/user-data paths and version-probe TMPDIR fall within the declared workspace. Test path containment, not a substring.
- Record every additional writable location, with ownership and measurement coverage. Preserve per-run logical and allocated-byte accounting and symlink checks.
- Three new matching full lab runs meet **≤16 MiB retained after cleanup**, **≤250 retained files**, **≤256 MiB sampled total new workspace**, **≤200 MiB additional shared cache**, empty final scratch and no unaccounted paths/links.
- Retain all stages, eight original follow-ups, closed control observation, and six HTTP/HTTPS proof combinations. Storage during execution may exceed 16 MiB.

## B2 — Make cleanup failures visible and preserve useful failure diagnostics

Replace unchecked cleanup with an owned-workspace lifecycle that records attempted paths, errors and leftovers. Never delete paths merely because they match a broad global `/tmp` prefix. Only clean the current run’s explicitly owned allocations.

Acceptance evidence:

- A permission-denied/deletion-failure fixture leaves a file on purpose. The profile records the cleanup failure and remaining path/bytes, and cannot claim a fully completed clean run. Keep a readable partial profile and meaningful exit status.
- A failed tool/parse/interrupted run still cleans owned temporary state where possible. Capture a bounded diagnostic excerpt/log before discarding a failing tool’s large runtime home.
- An unrelated neighbouring fixture directory survives cleanup unchanged.
- Successful runs produce explicit cleanup evidence and zero owned scratch leftovers. Do not silently suppress failures with `ignore_errors=True` and then report success.

## B3 — Identify the installed code and database behind wrappers

Record meaningful full version strings, wrapper identity, resolved implementation entry points and the relevant installed dependency/manifest hashes. Include new production modules in source identity if you extract them during refactoring.

For ZAP, identify the actual installation/core jar and add-on versions/manifest. For WPScan, identify the loaded application/gems and chosen database, not only the launcher. Verify selected pre-existing dependency/database identities before and after execution to support “unchanged” claims. A broad user cache is not demonstrated read-only simply because it is called shared.

Acceptance evidence:

- A fixture keeps its launcher unchanged but changes an underlying implementation file; the identity comparison detects it.
- A database/cache-mutation fixture is detected and prevents an “unchanged dependency” release claim.
- Preserve all components of versions such as a four-component browser version. No expected version strings may be hard-coded solely to satisfy a test.
- Save dependency evidence compactly; do not copy whole installations into each run or create another backup. Do not modify installed source databases for the negative fixture; use disposable owned fixtures.

## B4 — Show which documented commands were verified

Create a concise command matrix for the current supported scope. Each row needs argv, fixture/configuration, actual subprocess return code, expected result and a saved evidence path.

Cover help/check-tools, offline/dry-run, saved XML, owned active TCP and supported stage selections, verification, WordPress/negative fixtures, and the complete regression/acceptance commands. Mark placeholders, unavailable privileged cases and excluded Metasploit commands explicitly; do not expand scope to execute them.

Acceptance evidence:

- No unexecuted example is labelled verified. Do not infer a test pass from a wrapper ending with `echo`/`cat`; capture the test process’s own return code.
- Correct stale claims and document real limitations and writable roots.
- Final report links the command matrix, cleanup checks, dependency identities and complete storage traces; keep reported versus independently checked evidence distinct.

## Focused organisation work

The current module separation is useful, but ownership is scattered. Introduce or consolidate a small workspace/lifecycle component that owns scratch allocation, prepared tool environments, measurement-root registration and cleanup results. Keep the generic Runner focused on process execution. Use explicit adapter preparation/results where it removes the browser/WPScan branches from generic code.

Keep the CLI and public helper interfaces needed by the protected evaluator compatible. Preserve independent verifier logic. Do not spend this task splitting every file, adding a framework, or removing working features just to reduce line counts. Every structural change needs a concrete blocker or test it improves.

## Evidence and completion

- Use new `validation/round3-*` outputs. Preserve all historical runs, reports and the single existing compressed backup. **No additional backup.**
- Add targeted supplemental tests for B1–B4 outside the protected v2 acceptance package. Record baseline failures and corrected results. These are additional release conditions, not a replacement self-scored checklist.
- Run all applicable original 39 regressions, the protected 28 methods, and the supplemental checks. Then produce three fresh complete runs with identical final source/tool/input identities, effective flags, coverage and deadlines. Do not edit production source during that sequence.
- Update `DEEPSEEK-PROGRESS.md` with B1–B4 status, measured results, retained/total peak/scratch/cache bytes, source identity, evidence paths, and precise blockers. A full peak value is unmeasured until every new writable root is covered.
- Final report must state whether each blocker is closed and which evidence proves it. Do not mark the final review complete on the basis of your own score alone.

Use only the owned local lab/fixtures. Metasploit, Legion integration, authenticated investigation and new target scope remain excluded. Do not spawn agents, change provider/MCP settings, alter sudoers or obtain/store a password. If privilege blocks one check, state the exact blocked command and continue independent work.

The existing observer will give the user milestone tables every ten minutes. Those tables are for observation; continue the concrete work in this file until it is verified or an actual user-action blocker remains.
