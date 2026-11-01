# DeepSeek handoff — finish and measure the Scanning workflow

Prepared **31 October 2026**. This is an implementation handoff for the existing project, based on two companion files:

1. [SCANNING-SUMMARY.md](/home/joshua/Documents/ChatGPT/Hackathons/SCANNING-SUMMARY.md) — what exists and where it is incomplete.
2. [SCANNING-HILL-CLIMBING-CRITERIA.md](/home/joshua/Documents/ChatGPT/Hackathons/SCANNING-HILL-CLIMBING-CRITERIA.md) — the full scoring rules and completion requirements.

Read both before editing. Keep them available with this file when transferring the handoff to another environment. Their recorded results are historical; inspect the current source and measure a fresh baseline.

## Your assignment

Finish the existing conditional five-stage scanner so that it produces accurate, complete, reproducible profiles of the owned local CTF lab. Use the hill-climbing criteria to choose improvements, measure each revision, and demonstrate completion.

Working directory:

```text
/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler
```

Deliver working changes, verification evidence, and an honest score. Keep this assignment focused on the existing lab workflow, adapters, classification, outcome reporting, and documentation.

Metasploit was assigned to another AI. Keep it excluded from staged evaluation and do not change its integration as part of this assignment. Legion integration, authenticated web investigation, new protocol families, and classification probability calibration are separate work.

## What you are taking over

- A working original profiler with Nmap discovery, conditional service checks, JSON profiles, raw evidence, and artifact hashes.
- A device classifier with evidence-backed role hypotheses and explicit uncertainty.
- A local lab at `127.0.0.2`, exposing TCP DNS `53`, SMB `445`, SSH `12222`, HTTP `18080`, and HTTPS `18443`; TCP `18444` is a closed control port.
- New staged adapters for httpx, fingerprintx, Katana, ffuf, Nuclei, ZAP web/API, WPScan, sqlmap, Dalfox, and independent HTTP/browser validation.
- A single-authentication lab runner and a target-restricted web proxy.
- Saved partial staged results and a historical 33-test passing run.

The original local lab and older Metasploit imports passed their checks. That does not establish completion of the expanded workflow. The reviewed staged run had a fingerprintx parser failure and a Dalfox status error. Dalfox handling was subsequently changed; a separate browser test reproduced XSS. WPScan installed successfully but lacks a positive live fixture result. A complete verified staged run was still missing.

## Where to look

All paths in this table are relative to the working directory above.

| File or directory | Purpose |
| --- | --- |
| `ctf_profiler.py` | Main CLI, execution, profile generation, outcome handling |
| `staged_workflow.py` | Stage planner, adapters, endpoint collection, assessment and validation |
| `scope_proxy.py` | Restricts web destinations to the configured target and ports |
| `device_classifier.py` | Classification rules and supporting evidence |
| `lab/run_target.py` | Existing owned target and lab exercises |
| `lab/run_workflow.sh` | Single-authentication runner; `--staged` selects the expanded workflow |
| `lab/start-and-scan.sh` | Privileged lab startup and discovery |
| `lab/verify_staged_profile.py` | Existing staged verifier; needs stronger checks |
| `tests/` | Existing automated regression tests |
| `validation/staged-web-smoke/` | Historical partial staged profile and raw outputs |
| `validation/browser-proof-smoke-2/` | Separate browser reproduction evidence |
| `validation/staged-unit-tests.log` | Historical 33-test result |
| `setup/staged-system-install.log` | Latest reviewed successful WPScan installation log |
| `README.md`, `CLASSIFICATION.md` | User documentation and classification semantics |

## First actions

1. Read applicable repository instructions and check for a storage budget. Inspect current changes and any active lab/test processes before editing or restarting services. Preserve other agents’ work and historical artifacts.
2. Inspect the CLI, current runner, verifier, installed tool versions, and newest run directories. Some reported gaps may already have changed. Do not restart an active evaluation merely to obtain a fresh directory.
3. Freeze the evaluation set and assign a version: service ground truth, existing positive exercises, corresponding corrected/negative fixtures, adapter error fixtures, and held-out classification fixtures. Keep expected answers out of production detection/classification inputs.
4. Create a new evaluation directory under `validation/deepseek-evaluation/` for this baseline. Record source hashes or revision, environment, configuration, and tool versions.
5. Run the existing regression suite and evaluate the current candidate. Mark unavailable evidence as unmeasured, worth zero; do not invent an initial score from old logs.

Existing entry points, subject to confirming the current source:

```bash
python3 -m unittest discover -s tests -v
python3 ctf_profiler.py --check-tools
bash lab/run_workflow.sh --staged --restart-lab
```

The last command restarts the owned lab and may require local sudo authentication. The staged runner should retain Metasploit exclusion. Use it when the lab is available for a fresh evaluation. Do not ask for passwords in chat or store them. If authentication or a missing dependency prevents a check, record that limitation and continue independent work.

## Priorities and acceptance evidence

| Priority | Work to finish | Evidence that it is finished |
| --- | --- | --- |
| 1 | Make results trustworthy before optimising the score | Parser failures propagate to partial stage/run status; malformed artifacts fail verification; URL scope uses parsed addresses and ports; finding evidence is checked for meaning as well as existence |
| 2 | Repair fingerprintx parsing and verify Dalfox outcome handling | Actual installed-version artifacts parse correctly; findings and incomplete-scan cases receive accurate outcomes; focused regressions cover both |
| 3 | Finish the complete staged lab run | One invocation produces all five accurately completed stages, expected service inventory, eight original follow-ups, and a passing strengthened verification report |
| 4 | Verify existing finding reproduction and negative cases | Existing Git-config, SQL-injection, and XSS exercises have independent evidence; corresponding corrected fixtures produce zero reproduced findings |
| 5 | Cover the conditional WordPress branch | WPScan enumerates an owned WordPress fixture and produces expected structured output; it still skips the non-WordPress lab. No positive vulnerability finding or paid/API-token capability is required |
| 6 | Complete reliability and classification checks | Missing tools, malformed/empty outputs, timeouts, interruption, repeated runs, conflicting fingerprints, and ambiguous held-out fixtures produce the outcomes required by the scoring file |
| 7 | Update documentation and prove repeatability | Current commands and limitations are documented; three consecutive fresh complete runs and the reserved fixtures pass; the final score can be independently recomputed |

An empty result can be valid for a tool that found nothing. Evaluate each adapter’s documented output contract; do not treat all empty outputs as either success or failure. Separate process completion, parsing, task coverage, and finding reproduction.

Do not hard-code the lab’s expected service inventory or weakness locations into general scanner decisions to satisfy the verifier. Task selection must continue to follow observed services and discovered endpoints.

## How to measure progress

The criteria file contains **30 scored checks**, five in each area. Give them stable IDs in its listed order:

| IDs | Area | Maximum | Points per passing check |
| --- | --- | ---: | ---: |
| W1–W5 | Complete workflow | 25 | 5 |
| A1–A5 | Adapter correctness | 15 | 3 |
| E1–E5 | Findings and evidence | 20 | 4 |
| R1–R5 | Reliability and outcomes | 15 | 3 |
| C1–C5 | Classification quality | 15 | 3 |
| D1–D5 | Reproducibility and docs | 10 | 2 |

Copy each check’s full condition from the criteria file into your evaluation report. Record `pass`, `fail`, or `unmeasured`, with evidence paths and a short reason. Only `pass` earns points. If a check contains several requirements, all must pass.

For every candidate revision:

1. Select a failed check and state the expected improvement.
2. Make a focused change and save the resulting source identity.
3. Evaluate the affected checks and applicable regressions.
4. Recompute the score from evidence applicable to that candidate. Reuse earlier evidence only when its source, dependencies, and configuration remain unchanged and that reuse is explicitly justified.
5. Accept a hill-climbing improvement only when the score increases and every preservation condition still holds. Record behaviour-preserving refactors separately.

After two unsuccessful revisions on the same check, inspect the failure evidence and revise the hypothesis. Do not weaken assertions, alter expected answers, skip eligible work, relabel partial results, or increase unsupported confidence to gain points.

The preservation conditions in the criteria file are mandatory: baseline regressions continue passing, target restrictions hold, the closed control port receives no follow-ups, Metasploit remains excluded, candidates remain separate from reproduced findings, and evaluation ground truth does not leak into scanner inputs. A higher score with a violated condition is a rejected revision.

## Required outputs

Save each evaluated revision in its own directory under `validation/deepseek-evaluation/`, containing:

- A machine-readable score report with all 30 check IDs, full conditions, outcomes, evidence references, area totals, overall total, and preservation-condition results.
- Source identity, tool versions, evaluation-set version, configuration, run IDs, durations, and any fixture-reset procedure.
- Raw logs/profiles or references to their preserved run directories.
- A short progress report: baseline score → current score, changes made, checks gained/lost, blockers, and next selected check.

Keep reports reproducible and distinguish blocked/unmeasured work from failed behaviour. Preserve earlier reports so progress is auditable.

## Definition of done

Report functional completion only with **100/100**, every preservation condition satisfied, three consecutive fresh complete lab runs, and passing reserved fixtures. In each repeated run, all three existing positive exercises must reproduce; their corrected/negative fixtures must produce zero reproduced findings.

The final evaluation must use the same final candidate and frozen evaluation set. Do not assemble a passing result from different revisions or cherry-picked runs. This establishes completion for the defined lab evaluation, not universal vulnerability coverage or exact device identification.

Speed optimisation is optional after functional completion. Compare medians from five runs per candidate under identical conditions; claim an improvement at **at least 10%** reduction while preserving the full score and fixed deadlines. Do not delay a completed functional handoff solely to pursue speed.

Finish with a concise report stating what changed, the measured score, which checks remain incomplete, and where the evidence is saved. If work is blocked, state the precise missing dependency or user action and continue any independent remaining tasks. Never report completion merely because code exists or a process exited successfully.
