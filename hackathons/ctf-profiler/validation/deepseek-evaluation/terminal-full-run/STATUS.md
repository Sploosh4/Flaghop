# Terminal full-run monitor

Checked: 2026-10-31T06:40Z (14:40 AWST)

## Current state

- **No `RUNNING` file is present** in either this directory or the latest
  attempt subdirectory, and no `ctf_profiler.py`, `run_workflow.sh`,
  `start-and-scan.sh`, or privileged Nmap process is active. The previously
  reported Nmap PID 209276 no longer exists; its run completed at 06:20:44Z.
- The terminal titled `DeepSeek — full local CTF test` is the original
  user-authorized terminal. Its run has already finished; the shell is waiting
  at the post-run prompt, not scanning the lab.

## Completed attempts

| Attempt | Run directory | Terminal exit | Verifier |
| --- | --- | ---: | --- |
| Root attempt, 2026-10-31T06:18:14Z | `validation/staged-lab/20261031T061817Z-209227/` | 0 | PASS (29/29 checks) |
| Latest attempt, 2026-10-31T06:31:27Z | `validation/staged-lab/20261031T063423Z-244709/` | 0 | PASS (29/29 checks) |

Both runs used the frozen source hashes recorded in
`../../../DEEPSEEK-PROGRESS.md` and in each profile. Follow-ups ran as uid 1000.
The latest attempt is referenced by `latest-run.json`; it is the third run in
the accepted three-run sequence. The measured score remains **100/100**.

No scanner/verifier source was edited and no backup was created.
