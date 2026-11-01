# Resume the remaining Scanning work

Josh authorised resuming the same DeepSeek agent, keeping the tests/browser gate and restarting ten-minute updates. Project: `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler`. Agent: `6163dacad4ae4aa6`. The prior turn ended with repeated `Request timed out.` errors; the scans themselves had finished successfully. Preserve the saved conversation, current model/provider and all existing evidence. No new backup or agent.

Read [the main blocker handoff](/home/joshua/Documents/ChatGPT/Hackathons/DEEPSEEK-SCANNING-FINAL-BLOCKERS.md), [v3 checks](/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/README.md), [real Chrome gate](/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v3/CHROME-PREFLIGHT.md), and [handoff skill](/home/joshua/.codex/skills/deepseek-handoff/SKILL.md). This file supplies the latest state and ordering; it does not remove any existing release condition.

## Checked starting point

- `round3-release-003` and `004` both completed all five stages and six HTTP/HTTPS proof combinations after passing the real four-case browser gate. Source, numeric versions, inputs and effective configuration match. They retained 840,941 / 831,121 bytes and 131 files each, with sampled peaks 190,504,378 / 190,473,661 bytes. Work/cache finished empty. Preserve these runs.
- Current source passed v2 **28/28, 100/100** on release-003, v3 behaviour **13/13**, the real-browser **4/4** gate and **44 regressions**. These results are candidate-specific; recheck source identities before reusing them.
- All protected v2/v3/browser-gate manifests are intact. A score is not overall completion. The full v3 command/repeatability checks remain unmeasured, and the command matrix/final evidence report are absent.

## Remaining criteria

| Criterion | Starting gap | Required result / evidence |
| --- | --- | --- |
| Stable identity | `tool_versions.*.version_tmpdir` changes each run; sqlmap's `version_output_excerpt` contains a clock time | Separate stable implementation/version identity from per-run probe provenance while preserving both. Add a small targeted regression proving equivalent identities across different work roots/timestamps and continued detection of real executable/database changes. Keep the protected evaluator unchanged. |
| Repeatable workflow | Two functional gated successes; strict identity equality fails and third run is absent | Three fresh complete gated runs from one final source, with matching identities/config/coverage/deadlines, v2 verification for each and all six proof combinations. Any production edit invalidates affected previous runs for this series. |
| Resource/cleanup evidence | Two measured runs; final all-root review unfinished | Preserve the declared short `/tmp` workspace, prove coverage of every new writable root, empty final scratch and honest cleanup errors. Whole retained run ≤16 MiB /250 files; sampled new-workspace ≤256 MiB; additional shared cache ≤200 MiB. More than16 MiB during execution is allowed. |
| Command/dependency evidence | Only partial command receipts exist | Finish B3/B4 installed implementation/database before/after evidence and the supported-command matrix using the observer-owned recorder. Capture actual argv, expected/actual child return codes, bounded intact logs and current source hashes. Label exclusions; do not expand scope. |
| Final acceptance | No complete v3 release manifest/report | Create `validation/round3-evidence.json` with absolute paths, pass all15 v3 methods plus the separate4 real browser cases and applicable regressions, and link the saved proof/storage/command evidence in a final report. Independent observer review remains required. |

## Work order

1. Inspect the latest source/reports and update the progress note, which currently predates the socket-path fix. Diagnose identity stability first; make the smallest useful change. Keep true versions, implementation hashes and mutation detection meaningful. Do not merely hide errors or discard required path evidence.
2. Run targeted tests, the protected **13-method v3 behaviour group**, and all applicable regressions (currently44, plus your new tests). Require zero fail/skip/unmeasured and actual child exit0 on unchanged source before any final run. If a harness appears defective, provide a reproducer for observer review rather than editing it.
3. Freeze the candidate. Launch **each** full measured run through `browser_preflight.py --then` followed by the real unchanged storage-observer/scanner argv. All4 actual HTTP/HTTPS positive/negative cases must pass first; failure must prevent the full run. Use new report/run names, keep production workspace/profile/socket paths within the tested layout, and preserve historical outputs. Never use `rm` to reuse an evidence filename.
4. Run v2 on every final run, finish current-source recorded command coverage, build the manifest and run all15 v3 checks. Inspect actual content and exit codes, not just `bash` success or a self-reported score. Keep agent claims separate from independently checked facts.
5. Update `DEEPSEEK-PROGRESS.md` with criterion status, source/evaluator identities, measured retained/peak/work/cache bytes, exact report paths and remaining difficulties. Finish the report only when the requirements and Josh's intended working scanner are actually satisfied.

Use the same owned local lab/fixtures. Metasploit execution, Legion integration, authenticated investigation and new target scope remain excluded. Do not alter sudoers, obtain/store a password, change provider/MCP settings, or start other agents. Continue independent work if one command is genuinely blocked. Keep model replies and tool output concise; read targeted report sections instead of dumping the whole conversation. The observer reports every ten minutes; it will stop on completion/failure and will not interrupt tests for a checkpoint.
