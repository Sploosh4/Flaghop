# Scanning progress milestones

Observer checkpoints for the existing round-two work, **31 October 2026**.
These group the agreed acceptance criteria; they add no new task for DeepSeek.
Do not send them as extra instructions to the agent.

Report every ten minutes using:

| Milestone | Status | Added since last update | Blockers / difficulties |
| --- | --- | --- | --- |

Use **Complete**, **In progress**, **Blocked**, or **Not checked**. A completed
milestone needs saved evidence. Missing evidence is not a pass. Milestone counts
describe checkpoints, not percentage of time or effort remaining.

| ID | Milestone | Measurable completion condition |
| --- | --- | --- |
| M1 | Reliable execution | H02/H05/H06/H09: all seven acceptance methods pass, covering deadlines, parser contracts, outcome consistency, and interrupted initialisation |
| M2 | Working integrations | H01/H07: both acceptance methods pass, including two fresh production WordPress attempts and preservation of API-only findings |
| M3 | Trustworthy verification | H03/H04/H12: all 12 methods pass, including eight rejected verifier mutations, its passing positive control, real negative-validator execution, missing-browser detection, and fixture cleanup |
| M4 | Reproducible results | H10/H11: all four methods pass for configuration, versions, input hashes and stale documentation claims; broader documentation/dependency review remains M8 |
| M5 | Small retained output | H08: all three methods pass for the same completed run; final output ≤16 MiB and ≤250 regular files, sampled peak ≤256 MiB, extra shared cache ≤200 MiB, scratch empty, no unaccounted links, and all six HTTP/HTTPS proof combinations retained |
| M6 | Original regressions preserved | All 39 applicable regression tests pass on the candidate. Record additions or changed assertions; a lower test count is not equivalent evidence |
| M7 | Repeatable full workflow | Three consecutive fresh complete runs use matching source, tool/input identities, effective configuration, coverage and deadlines. Every run has passing verification, a storage trace meeting M5, eight original follow-ups and all six proof combinations |
| M8 | Final evidence review | Final report links current acceptance/regression results and the three matching runs; evaluator integrity and source identities are checked; documentation command coverage, dependency identity, writable roots and limitations are independently reviewed. The agent’s completion claim alone is insufficient |

The full acceptance score began at **20.1111/100**: six passing, 21 failing and
one unmeasured method out of 28. The previous evaluation’s 100/100 is historical.
The current suite can reach 100 while M7/M8 remain unfinished.

## Evidence and comparison

Project: `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler`.

- Read `DEEPSEEK-PROGRESS.md`, `validation/round2-acceptance-*.json`, regression
  logs, storage traces, final-run profiles and verifier reports. Prefer saved
  results over a stale progress note.
- Check the source hashes recorded in the acceptance result against current
  code before carrying a pass forward. Check `scanning-acceptance-v2/protected-files.json`
  against its files. Do not sum focused-group scores from different revisions.
- Compare effective run settings, not only the abbreviated configuration label.
  Do not mix privileged TCP/UDP/OS scans with unprivileged TCP-only runs when
  counting a matching three-run series. Exclude earlier failed attempts.
- Read/update only the observer’s comparison record at
  `/home/joshua/Documents/ChatGPT/Hackathons/pi-bridge/observability/milestones-state.json`.
  Save observation time, milestone status/evidence, latest score, run IDs,
  storage values and difficulties so the next table reports actual changes.
  Do not edit agent evidence, source, tests or backups.

Use the live monitor on every check:

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/pi-bridge/observe.py \
  summary 6163dacad4ae4aa6 --since 10m --limit 8 --json
```

Inspect underlying test/storage reports even if the shell tool succeeded.
Compare waiting-call age with recent similar calls and fresh log output before
calling it stuck. Repeated differing attempts can be useful fixes; repeated
errors without progress are a difficulty. A deliberate `sleep` while a scan
runs is a wait, not evidence of a failure loop.

Put each difficulty beside its affected milestone. Note whether it is resolved,
still being worked on, or requires the user. Do not carry resolved blockers
forward. **16 MiB applies after cleanup; greater temporary usage is allowed.**

When the agent finishes or fails, report the measured outcome and any unfinished
milestones, then remove the recurring check. Do not mark M8 complete just to
close the timer.
