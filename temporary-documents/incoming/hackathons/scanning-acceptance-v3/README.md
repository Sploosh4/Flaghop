# Remaining-blocker acceptance checks

These checks supplement the protected v2 evaluator and original regressions. They do not replace them. The scanner can change; this evaluator and its command recorder belong to the observer. Report a reproducible harness defect rather than editing tests or weakening targets.

Josh's goal is a complete, trustworthy local scanning workflow. Passing the tests is evidence toward that outcome; the independent final review still checks scope, organisation and evidence gaps.

| Hill | Checks | Passing condition |
| --- | ---: | --- |
| B1 Temporary storage | 4 | Version probes, browser TMPDIR and actual browser profile stay inside measured roots; the observer sees a 24 MiB transient control followed by tiny retained output. |
| B2 Cleanup | 5 | A real permission failure cannot report success; clean runs record cleanup, preserve neighbours, and clean after interruption; failure stderr and large runtime-home diagnostics remain bounded and readable. |
| B3 Dependencies | 4 | Preserve full browser version; detect changed implementation behind an unchanged launcher and changes in the selected WPScan database; mutation during a run prevents clean completion. |
| B4 Command evidence | 1 | Current-source command receipts cover the supported command matrix with expected results, real return codes and intact logs. |
| Release evidence | 1 | Three matching full runs pass v2, total storage and dependency/cleanup checks against the final source. |

There are **15 checks**. Missing evidence counts as **unmeasured**, not passing. Each required check must pass; there is no average score that can cancel a failed blocker. The root-only cleanup fixture skips under UID 0, so run the suite as the ordinary project owner.

## Run the checks

From the project directory, using a fresh report path each time:

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/acceptance.py \
  --project /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler \
  --group behaviour --output validation/round3-v3-behaviour-001.json

python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/acceptance.py \
  --project /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler \
  --evidence validation/round3-evidence.json \
  --output validation/round3-v3-all-001.json
```

Use `--group release` to check just the manifest/command matrix. The all-check command returns nonzero for failures, unmeasured checks or source changes during execution. This avoids treating a partial suite as a release pass. Do not run acceptance against source while it is being edited; every report records source hashes.

The fixture tests write only to their own temporary directories, restore fixture permissions, and remove them afterward. Database mutation uses a disposable fixture selected by `CTF_PROFILER_WPSCAN_CACHE`, never the real installed cache. Network scanners are not run by the behaviour group. A temporary copy of Python source was used to establish the initial stable baseline; it was deleted afterward. It is not another project backup.

## Evidence contract

The scanner's existing round-three output fields are used:

- `cleanup.success`, `cleanup.run.errors`, `cleanup.run.leftovers` and `workspace.cleanup.leftovers`. Leftovers identify owned paths and logical bytes, including failures rather than just a success boolean.
- `workspace.owned_root`, within a root measured by the storage observer.
- `dependency_identity.before`, `dependency_identity.after`, `dependency_identity.unchanged`. A changed database must make the run partial with nonzero exit. `snapshot_dependencies(tools)` must describe the selected data and real implementation behind launchers.
- Release dependency identity includes ZAP core/plugin identities, WPScan gemspecs and database file hashes. This is a minimum check; the final review also examines whether those records identify the installation actually used.

Write a manifest at `validation/round3-evidence.json` containing **absolute paths**:

```json
{
  "command_receipts": ["/absolute/path/to/round3-command-help.json"],
  "limitations": ["Privileged UDP and Metasploit execution were not tested; outside this run's scope."],
  "runs": [
    {
      "run_root": "/absolute/path/to/validation/round3-final-001",
      "storage": "/absolute/path/to/validation/round3-storage-001.json",
      "acceptance": "/absolute/path/to/validation/round3-acceptance-001.json",
      "writable_roots": ["/absolute/path/to/validation/round3-final-001", "/tmp/cp-r3-001", "/absolute/path/to/round3-shared-001"]
    }
  ]
}
```

The example is a schema illustration, not a complete passing manifest: supply **three distinct runs** and receipts for every category below. Declare all newly writable locations. Do not add an outside path to the list and claim it was measured; containment is checked. Installed dependencies may be outside these roots only when they are unchanged dependencies, not uncounted new cache/runtime output.

Use the unchanged v2 observer with a short dedicated `/tmp` workspace. It samples, rather than enforcing a kernel quota. A sampled peak is a sampled peak; it does not establish byte-perfect process-wide accounting. Inspect writable-path coverage in the final review. The total new-workspace target is ≤256 MiB; dedicated additional shared runtime/cache peak ≤200 MiB; final work scratch zero. **≤16 MiB and ≤250 files apply to the whole retained run after cleanup. More than 16 MiB during execution is allowed.** The release check expects the shared observer root to contain dedicated additional runtime/cache, not a pre-existing installation.

## Capture actual command results

Use the supplied recorder rather than a wrapper whose final `echo` hides a failed child:

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/record_command.py \
  --project /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler \
  --output validation/round3-command-help.json --category help \
  --fixture 'CLI help; no target traffic' --expect-exit 0 \
  -- python3 -B ctf_profiler.py --help
```

The recorder preserves the child's exit code even when a nonzero exit was expected. It records argv/cwd, fixture, expected/actual return codes, timestamps, duration, bounded stdout/stderr and their hashes, and source hashes before/after. It never invokes a shell itself. Use actual test executables, not `bash -c 'test; echo done'`. An expected nonzero result is supported with `--expect-exit`; it must be explained in the fixture row.

Required categories: `help`, `check-tools`, `offline`, `dry-run`, `saved-xml`, `active-tcp`, `stage-1-3`, `stage-1-4`, `stage-1-5`, `verify`, `wordpress`, `negative`, `regression`, `acceptance-v2`, `supplemental`. Several receipts may share a category. For the supplemental receipt run **the behaviour group** to avoid making the release manifest depend on a receipt of its own unfinished check. Re-run applicable commands after production source changes; stale-source receipts fail. Check output semantics as well as return codes during review.

Harness controls:

```bash
python3 -B -m unittest discover -s /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3 -p test_harness.py -v
```

No final-release claim follows just from a receipt or a report containing `complete: true`. Independently inspect the reports, actual command selection, proof content and writable roots. Leave unsupported/privileged/excluded commands labelled; do not expand target scope to fill a table.
