# Scanning workflow — final measured report

**Date:** 31 October 2026  
**Evaluation set:** owned lab ground truth `2026-10-30` plus held-out
classification fixtures `heldout-2026-10-31-v1`  
**Release candidate source hashes:**

| File | SHA-256 |
| --- | --- |
| `ctf_profiler.py` | `d8db52548c1563561743c989f601018f57193cbeb5b7a0d6b284138116cbfac4` |
| `staged_workflow.py` | `6eae6789f7749f9a62b2ac6cb78eef5cb8f43deb82ad3df969594029a0ce8785` |
| `device_classifier.py` | `4686cf0ff7e797df1c14b2cdad3cece0732d4a6699ef9e9bd0ba34bacb552134` |
| `scope_proxy.py` | `fa9e07473462d3b15872cc7c93d6da2579791fc1b4a7f1a8c29697632eb34e4e` |

## Result

- **Measured baseline: 45/100** (`baseline/score-report.json`).
- **Final measured score: 100/100**, all 30 checks pass.
- Area totals: Complete workflow **25/25**, Adapter correctness **15/15**,
  Findings and evidence **20/20**, Reliability and outcomes **15/15**,
  Classification quality **15/15**, Reproducibility and docs **10/10**.
- All six preservation conditions pass.
- Machine-readable result: [`score-report.json`](../../../../../../hackathons/ctf-profiler/validation/deepseek-evaluation/score-report.json).

Each check’s full condition, outcome, points, reason and evidence paths are in
the score report. This is functional completion for the defined owned-lab
evaluation, not universal vulnerability coverage or exact device identification.

## Three consecutive fresh complete runs

All three used the same frozen source above and passed the strengthened verifier,
including all eight original follow-ups, five expected open TCP services, the
closed control port, and all three reproduced exercises over HTTP and HTTPS.

| Run | Evidence directory | Duration | Verifier |
| --- | --- | ---: | --- |
| Fresh active-discovery run 3 | `validation/deepseek-evaluation/candidate-3/` | 198.1 s | PASS |
| Fresh active-discovery run 4 | `validation/deepseek-evaluation/candidate-4/` | 200.0 s | PASS |
| Latest user-authorized terminal runner, one sudo authentication, privileged Nmap | `validation/staged-lab/20261031T063423Z-244709/` | 99.5 s profile / 386 s terminal wall | PASS |

Follow-ups in the runner profile ran as uid **1000**, not root. The latest
terminal attempt records process exit **0** in
`validation/deepseek-evaluation/terminal-full-run/attempt-20261031T063127Z/`.
The earlier user-authorized runner (`20261031T061817Z-209227`) and its terminal
evidence remain preserved. Direct `sudo -n` from my session still required
interactive authentication; the password was entered only in the opened
terminal, never requested in chat or stored by me, and sudoers was not changed.

## Main changes

1. **fingerprintx correctness:** added the installed CLI’s `-o` artifact output,
   validated the actual JSON fields (`ip`, `port`, `protocol`, `tls`,
   `transport`), and exposed `service` for conditional HTTP follow-up.
2. **Dalfox outcomes:** exit 1 is accepted only with a structured finding;
   exit 1 without findings and `meta.incomplete` reports become failed/partial.
3. **Trustworthy verification:** `lab/verify_staged_profile.py` now parses URL
   scope, checks ground-truth services and the closed port, resolves all hashes,
   re-derives Git/SQL/browser proof content, requires `source_task`, and ensures
   parser failures propagate to stage/run status.
4. **Evidence quality:** reproduced findings now carry source tasks and
   parameter-aware deduplication; the SQL check compares baseline/true/false
   bodies; the XSS proof checks the browser-rendered marker token.
5. **Fixtures:** added a positive owned WordPress fixture (WPScan 4.2.0 found
   WordPress 6.4.3 and theme `fixture`, no API token), a corrected negative
   fixture with zero reproduced findings, and reserved held-out classification
   cases.
6. **Reliability:** interruption writes readable partial output and records
   unfinished work; empty successful output differs from malformed/missing
   artifacts; missing tools and timeouts remain isolated to their tasks.
7. **Reproducibility:** profiles record source hashes, tool paths/versions or
   executable hashes, configuration and timestamps. README now documents the
   staged workflow and current limitations.

## Evidence index

- Score: `validation/deepseek-evaluation/score-report.json`
- Unit tests: `validation/deepseek-evaluation/unit-tests-final.log` — **39/39 OK**
- Baseline: `validation/deepseek-evaluation/baseline/`
- Candidate 3: `validation/deepseek-evaluation/candidate-3/`
- Candidate 4: `validation/deepseek-evaluation/candidate-4/`
- Runner: `validation/staged-lab/20261031T063423Z-244709/`
- Runner terminal: `validation/deepseek-evaluation/terminal-full-run/attempt-20261031T063127Z/`
  and `validation/deepseek-evaluation/terminal-full-run/latest-run.json`
- WordPress fixture: `validation/deepseek-evaluation/wordpress-fixture-final/`
- Negative fixture: `validation/deepseek-evaluation/negative-fixtures-final.json`
- Documentation audit: `validation/deepseek-evaluation/docs-command-audit.log`

## Recompute

```bash
cd /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler
PATH="$PWD/.tools/bin:$PATH" python3 -m unittest discover -s tests -v
PATH="$PWD/.tools/bin:$PATH" python3 lab/verify_staged_profile.py \
  validation/staged-lab/20261031T063423Z-244709
PATH="$PWD/.tools/bin:$PATH" python3 lab/verify_staged_profile.py \
  validation/deepseek-evaluation/candidate-3
PATH="$PWD/.tools/bin:$PATH" python3 lab/verify_staged_profile.py \
  validation/deepseek-evaluation/candidate-4
python3 lab/verify_wordpress_fixture.py --lab-profile \
  validation/deepseek-evaluation/candidate-4/profile
```

## Limitations

- Functional completion is scoped to the owned lab and fixtures. It does not
  establish universal detector coverage, calibrated classification
  probabilities, or physical device identity.
- Speed was not optimised; the optional five-run performance comparison was not
  part of this completion claim. The three accepted runs have fixed per-task
  deadlines.
- Metasploit and Legion integration remain excluded. No Pi/MCP/provider
  configuration was changed.
