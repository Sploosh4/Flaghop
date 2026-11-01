# Scanning — hill-climbing criteria

Proposed acceptance criteria, **31 October 2026**. Companion to [the implementation summary](/home/joshua/Documents/ChatGPT/Hackathons/SCANNING-SUMMARY.md).

**Objective:** Make the existing five-stage scanner produce complete, accurate, reproducible profiles on the owned local lab. Improve correctness and reliability first, then speed. These are targets for future evaluation, not results already achieved.

## Scope

Evaluate the existing profiler, adapters, classification, lab runner, and documentation. Keep Metasploit excluded from staged runs, as already requested. Legion integration and additional protocol features are separate work; they are not requirements for this score.

Use the owned lab and explicitly configured test fixtures. Measure successful profiling and correct evidence handling, rather than the number of requests, alerts, or vulnerabilities reported.

## Baseline

The reviewed work has 33 passing automated tests, a verified original profiler, and a partial staged web smoke test. The complete staged run is unverified; fingerprintx parsing failed; Dalfox handling changed after that run; WPScan has no positive live test. A separate browser test reproduced XSS.

Do not assign an overall baseline score from those mixed historical results. Measure one fresh candidate against the criteria below and save its evidence first.

## Scoring

Each row has five equally weighted checks. Score **row weight × checks passed / 5**. A check passes only when saved evidence demonstrates its entire condition. Missing evidence earns zero. Maximum: **100 points**.

| Area | Weight | Five measurable checks |
| --- | ---: | --- |
| Complete workflow | 25 | (1) One invocation finishes discovery through validation. (2) All five stage records are present and accurately report completion. (3) All five expected open TCP services and the closed control port match ground truth. (4) All eight original follow-ups complete and parse successfully. (5) Three consecutive fresh runs satisfy checks 1–4 and pass the strengthened staged verifier. |
| Adapter correctness | 15 | (1) fingerprintx’s actual installed-version output parses into expected fields. (2) Dalfox findings exit code is handled correctly and incomplete output remains partial/failed. (3) httpx, Katana, ffuf, Nuclei, and both ZAP modes produce parseable expected artifacts. (4) WPScan runs on an owned WordPress fixture and skips the non-WordPress lab. (5) Missing tool, malformed output, empty successful output, and timeout cases all produce accurate outcomes without aborting unrelated tasks. |
| Findings and evidence | 20 | (1) The existing Git-config exercise has independent retrieval evidence. (2) The SQL-injection exercise has independent reproduction evidence. (3) The XSS exercise has independent browser-execution evidence. (4) Matching corrected/negative fixtures produce zero reproduced findings for those three weakness types. (5) Every reproduced finding has resolvable evidence, source task, target endpoint, and an explanation consistent with the recorded result. |
| Reliability and outcomes | 15 | (1) The lab runner needs at most one sudo authentication and follow-ups use a non-root account. (2) Every configured timeout is enforced and labelled accurately. (3) Process success with parser failure makes the affected stage/run partial. (4) Interruption retains readable partial results and identifies unfinished work. (5) Repeated runs use separate output directories and preserve prior artifacts without duplicated logical findings within a profile. |
| Classification quality | 15 | (1) The existing lab retains the supported service-host classification. (2) Adding conflicting OS evidence lowers confidence or records ambiguity. (3) Repeating evidence from one web interface does not increase its channel count or confidence. (4) Held-out ambiguous, insufficient-evidence, and conflicting-product fixtures never receive an unsupported high-confidence identity. (5) Every classification has evidence links, explanations, and heuristic-score wording; unsupported model, firmware, and active-NGFW claims remain unknown. |
| Reproducibility and docs | 10 | (1) README describes the current stages and limitations. (2) Every documented command/option exists and its example succeeds in the relevant local mode. (3) Runs record source revision or hashes, tool versions, configuration, and timestamps. (4) All recorded artifact hashes verify and all evidence paths resolve. (5) A saved evaluation report lets another reviewer recompute the score and identify every failed check. |

The three weakness exercises refer to existing lab behaviour. Detecting a scanner alert alone does not satisfy independent reproduction. WPScan success means correct enumeration and structured output on its fixture; it does not require an API token or a positive vulnerability finding.

## Conditions that every accepted revision must preserve

These conditions cannot be traded for points:

- All applicable baseline tests still pass. Fixing an incorrect test requires documented evidence of the original mistake; deleting assertions does not count as improvement.
- Target restrictions continue to work, including redirects, API references, and discovered URLs. The closed control port receives no follow-up probes.
- Metasploit remains excluded from the staged evaluation.
- Candidate alerts stay separate from reproduced findings. A failed, skipped, missing, or unparsed check cannot be relabelled successful to improve the score.
- Ground truth and expected answers are used by the evaluator, never supplied to classification or detection as target observations.

## Evaluation loop

1. **Freeze the evaluation set.** Record the lab version, expected service inventory, three existing positive exercises, corresponding negative fixtures, adapter error fixtures, and classification fixtures. Reserve some fixtures for final evaluation. Define which tasks are applicable before running the candidate.
2. **Measure the baseline.** Save results using the same tools, configuration, and machine that will evaluate revisions. Record each check as pass, fail, or unmeasured; unmeasured checks score zero.
3. **Change one identified weakness.** State the expected measurable improvement before editing. Examples include repairing fingerprintx parsing or propagating parser failure into stage status.
4. **Evaluate the affected checks and regressions.** Preserve raw evidence. Accept the revision only if all preservation conditions hold and its score increases. A behaviour-preserving refactor may be retained separately, but is not a hill-climbing gain.
5. **Run the complete evaluation for a release candidate.** Require three consecutive fresh lab runs plus the reserved fixtures. Update the score from those results, rather than combining the best outputs from different revisions.

If two successive revisions fail to improve the selected check, investigate the evidence and revise the hypothesis before another attempt. Never weaken fixtures, skip eligible tasks, increase unsupported confidence, or broaden the target scope to raise the score.

## Completion and performance targets

**Functional completion:** 100/100, every preservation condition satisfied, and three consecutive complete lab runs. Each positive exercise must be reproduced in all three runs; its corresponding negative fixture must produce zero reproduced findings. This demonstrates completion for the defined evaluation set, not universal scanner coverage.

Only then optimise runtime. Compare medians from five runs per revision with identical coverage, configuration, and hardware conditions. Prefer a reduction of at least **10%** while retaining 100/100 and all preservation conditions. Smaller changes need additional measurement before being called a speed improvement. Keep per-task deadlines fixed during the comparison.

Do not claim calibrated classification probabilities from this lab. That requires a separately labelled device dataset and evaluation plan.

## Required evaluation record

For each evaluated revision, save:

- Revision/hash, evaluation-set version, tool versions, and configuration.
- A pass/fail result and evidence path for each of the 30 scored checks.
- The six area scores, total score, preservation-condition results, and unresolved failures.
- Run durations and IDs for repeatability checks.
- A short decision: accepted improvement, rejected regression, or inconclusive.

Start from [the existing staged verifier](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/lab/verify_staged_profile.py), but strengthen it before using it as the sole completion judge. In particular, executable completion must not hide parser failure, URL scope must be parsed rather than checked by substring, and artifact existence alone must not stand in for meaningful proof.
