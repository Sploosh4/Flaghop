# DeepSeek follow-up — fix the audit findings and climb against independent tests

Prepared **31 October 2026**. Read [the code audit](/home/joshua/Documents/ChatGPT/Hackathons/DEEPSEEK-SCANNING-CODE-AUDIT.md) first. This follow-up supersedes the earlier 100-point completion checklist for acceptance of the next revision. Preserve the earlier summary, criteria, reports, and single backup as historical evidence.

## Storage clarification from the user

**The 16 MiB limit applies to retained output AFTER a run finishes and its temporary files are cleaned up. It is NOT a 16 MiB execution-time limit. The scanner may use more while running.**

Retained output means the whole run directory: profile, reports, proof, logs, and any remaining state. Peak temporary usage and shared caches are measured separately. Do not satisfy the final limit by deleting required proof or moving uncounted state elsewhere.

## Assignment and boundaries

Improve the existing project at `/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler`. Fix production behaviour and evaluate it through the new acceptance package at `/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v2`.

Start with the broken WordPress branch, process deadlines, parser/outcome handling, and verifier/negative-test false passes. Then fix API alert aggregation, metadata and documentation, and retention. Refactor shared policies where these defects demonstrate duplication; avoid a broad rewrite before regression protection is in place.

Keep Metasploit, Legion integration, additional target/protocol scope, and authenticated web investigation excluded. Use only the existing owned local lab and configured owned fixtures. No new agents or provider/MCP changes. **Do not create another backup** or alter the existing archive. Do not delete historical runs to meet a new-run storage target.

## Measured storage opportunity

Measurements are saved in [baseline.json](/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v2/baseline.json), using the existing `candidate-4` run:

| Component | Bytes |
| --- | ---: |
| Whole retained run | 751,037,028 |
| ZAP runtime directories | 743,513,663 |
| Browser state | 5,308,749 |
| Other isolated tool state | 1,224,223 |
| Remaining raw evidence | 268,899 |
| Profile, run log, and verifier report | 721,494 |

Removing ZAP runtime from retained output alone would leave **7,523,365 bytes**. Separating browser and other transient state as well leaves approximately **990,393 bytes** of evidence/reports. This is a retention opportunity calculated from the saved manifest, not proof that a correct cleanup implementation exists yet.

**Final retained target: ≤16,777,216 bytes (16 MiB)**, both apparent file bytes and allocated regular-file blocks. This saves at least **734,259,812 bytes per run**, or **97.766%** against the measured whole-run baseline. Also target **≤250 retained regular files**, versus 2,081 currently: at least **88.0% fewer**.

Separate operating targets:

- **Sampled peak new workspace: ≤256 MiB**, including the current run, its scratch directory, and any additional shared cache. This allows substantially more than 16 MiB while running. The historical peak was not measured; do not claim a measured peak-to-peak percentage improvement.
- **Additional persistent shared cache: ≤200 MiB**, counted once and reported explicitly. Existing installed tool binaries are excluded only if unchanged. New data cannot be hidden under the installed-tool directory.
- **Final scratch contents: zero regular-file bytes**. Empty scratch directories may remain.
- Over five runs, final outputs plus a full 200 MiB shared cache would be at most **280 MiB**, versus about **3.755 GB** for five baseline-sized outputs: approximately **92.2% less**. Measure the actual result; this is a budget calculation.

Consider ephemeral ZAP homes cleaned after their reports/proofs are harvested, or supported reuse of immutable runtime dependencies. Reusing the existing installed dependencies may avoid needing a new shared cache. Preserve isolation and validate all evidence hashes after cleanup.

## The new hill climbs

Each hill has executable checks. Points within a hill are proportional to passing test methods; a method with subcases passes only if all its subcases pass. Failed, errored, skipped, and unmeasured checks earn zero. Maximum **100**. A high score does not override the release conditions below.

| Hill | Weight | Baseline problem → measurable target | Test group |
| --- | ---: | --- | --- |
| H01 Production WordPress | 10 | 0/2 fresh production attempts succeed → **2/2**, using actual conditional selection, Runner, isolated environment, proxy and parser; retain the non-WordPress skip regression | `wordpress` |
| H02 Deadlines | 10 | Closed-pipe child overruns and is labelled complete → **3/3 process variants timed out correctly**, each within **0.45 s for a 0.1 s deadline**; repeat to establish stability | `quick` |
| H03 Honest verifier | 20 | Only 1/8 deliberately invalid profiles is rejected → **8/8 structured rejections**, while the unchanged positive control still passes | `verifier` |
| H04 Negative coverage | 10 | Invalid Git URL and silent browser non-execution → **zero invalid fixture URLs, all negative validator tasks actually complete, missing browser never earns a tested-negative pass** | `negative` |
| H05 Parser contracts | 10 | Wrong-schema Dalfox output can pass or escape with TypeError → **7/7 malformed/incomplete cases rejected locally, zero escaping exceptions**, installed-format positive control preserved | `quick` |
| H06 Consistent outcomes | 8 | Run says completed while stages are partial → **zero such contradictions**, with partial execution returning exit 2; preserve applicable baseline failure/timeout tests | `quick` |
| H07 API result use | 6 | API-only alert disappears → **1/1 unique API canary retained with API provenance**, web canary retained, neither promoted to reproduced | `quick` |
| H08 Storage with evidence | 12 | ~751 MB/2,081 files retained → **≤16 MiB/250 files after cleanup**, separately measured peak/cache budgets, **all six HTTP/HTTPS proof combinations preserved** | `storage` |
| H09 Interrupted initialisation | 5 | Metadata interruption escapes without profile → **zero uncaught initialisation interruptions**, readable partial profile and exit 2; preserve the later-interruption regression | `quick` |
| H10 Reproducibility | 5 | Missing options and banner-art “versions” → **10/10 listed configuration fields, meaningful versions for 12/12 known tools, content hashes for every assessment template and the wordlist** | `metadata` |
| H11 Accurate documentation | 2 | Current runner incorrectly described as importing Metasploit → **zero stale current-behaviour claims**; complete a command-evidence matrix with no untested example labelled verified | `quick`, plus documentation review |
| H12 Fixture cleanup | 2 | Test server daemon survives cleanup → **zero live fixture-server threads**, cleanup/check completes in **<2 s** when browser is deliberately unavailable | `negative` |

The timeout and cleanup thresholds are bounds for controlled fixtures, not claims about scanner throughput. Do not invent percentage speedups for correctness defects: measure rejection, execution coverage, missing results, or outcome consistency instead.

The measured baseline on the new suite is **20.1111/100: 6 passing methods, 21 failing methods, and 1 unmeasured method** (historical peak storage was not recorded). See `scanning-acceptance-v2/baseline-all.json` and `baseline-all.log`. This is a new acceptance standard, not a directly comparable rerun of the old 100-point checklist. Production source was unchanged when this baseline was recorded.

## Runnable tests

[acceptance.py](/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v2/acceptance.py) contains **28 test methods**, including eight independent verifier mutations. It writes only to temporary directories and an explicitly named new JSON report. Live fixture checks stay on loopback. The WordPress test deliberately uses the real application path; do not replace it with a direct WPScan subprocess test.

For focused work:

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v2/acceptance.py \
  --group quick --run /absolute/path/to/new-run
```

Groups are `quick`, `verifier`, `wordpress`, `negative`, `storage`, `metadata`, and `all`. `--run` is the outer directory containing `profile/device-profile.json`. Supplying no run or peak trace deliberately leaves dependent checks unmeasured; it does not produce full acceptance.

For a full score on one candidate:

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v2/acceptance.py \
  --group all --run /absolute/path/to/new-run \
  --trace /absolute/path/to/storage-trace.json \
  --output /absolute/path/to/new-acceptance-report.json
```

Output report paths must be new. The score is for that invocation only. Do not add scores from different revisions, fixtures, or invocations to manufacture 100.

### Metadata contract for this round

Add these effective `configuration` keys using the CLI’s meanings: `stages`, `skip`, `udp_ports`, `assessment_timeout`, `validation_timeout`, `max_web_origins`, `max_endpoints`, `max_validation_urls`, `verify_tls`, `effective_privileged_discovery`. Preserve existing useful fields. Record `input_identity` as a mapping from repository-relative template/wordlist path to a record containing its actual `sha256`.

Versions must contain real numeric versions, not copied banner lines. Use the installed tool’s supported version query or a verified local installation/package manifest; do not hard-code an expected version merely to match the test. Record underlying script dependencies as well as launchers when explaining reproducibility. This latter dependency coverage needs review beyond the regex check.

## Measuring temporary versus final storage

[measure_storage.py](/home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v2/measure_storage.py) runs a command and samples three disjoint writable roots every 0.2 seconds. It does **not** stop the run for exceeding 16 MiB. The final-output limit is checked only after completion; the observer separately records the peak, final scratch usage, and shared cache usage.

Example for a new run using the already-running owned lab:

```bash
cd /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/scanning-acceptance-v2/measure_storage.py \
  --run validation/round2-run-001 \
  --work validation/round2-work-001 \
  --shared validation/round2-shared-cache \
  --output validation/round2-storage-001.json \
  -- python3 -B ctf_profiler.py 127.0.0.2 \
     --ports 53,445,12222,18080,18443,18444 --os-detection off \
     --dns-server 127.0.0.2 --tool-timeout 45 --tls-timeout 240 \
     --stages 1-5 --no-metasploit --skip metasploit_check \
     --out validation/round2-run-001/profile
```

The observer supplies `TMPDIR` for scratch; it does not configure an application cache. If you add shared-cache configuration, pass it explicitly to the application and use the observed shared root. Declare every additional writable location. Do not move runtime files outside measurement to improve the result. Report sampler limitations: very short bursts may be missed, and this is not a kernel quota. The observer rejects unaccounted symlinks; retained run evidence must be self-contained.

Existing tool installations, historical runs, and the one backup are not part of the new-run budget and must remain intact. No final-budget cleanup may delete proof that the independent verifier requires.

## Work and reporting loop

1. Read the audit and this plan. Run the new tests against the current candidate before changing production behaviour. The recorded baseline intentionally fails many checks; this is a different evaluation from the earlier self-scored 100.
2. Pick one failed hill. State which failure should disappear and what evidence will prove it.
3. Fix production code or the faulty existing fixture, then run its focused group and applicable original regression tests. Avoid broadening scope or removing working features to reduce storage.
4. Record revision/source/input hashes, test outcomes, storage bytes, task coverage, and any user-action blockers in `DEEPSEEK-PROGRESS.md` and a new round-two report. Unmeasured stays unmeasured.
5. Run all groups against the same final candidate before reporting a full score. Keep evaluator inputs, weights, and thresholds fixed. Do not edit this acceptance package to make implementation failures green; report a demonstrable harness defect for review instead.

## Release conditions beyond the numeric score

- All applicable original 39 regressions still pass; any extra tests remain meaningful. Do not delete assertions to get a green result.
- Three consecutive fresh full lab runs use the same production source, tool/input versions, fixture version, flags, discovery coverage, and per-task deadlines. Each preserves eight original follow-ups, all five stages, the closed control observation, and all six existing HTTP/HTTPS proof combinations.
- Each of those three final outputs meets the **post-cleanup 16 MiB** budget and has a storage trace. No further implementation edits occur between them.
- Negative fixtures are really exercised; corrected cases yield zero reproduced findings. Missing tools or aborted validation must never count as tested negatives.
- Target restrictions, Metasploit exclusion, evidence hashes, and classification uncertainty remain intact. Additional alerts do not earn points just for being numerous.
- Independently review the command matrix, dependency identity, and all extra writable locations. The executable suite is a floor, not proof of every architectural property.

For architecture, centralise adapter result/status and transport policy, then reduce the monolithic orchestration where it demonstrably removes duplicate logic. Document classifier inputs and unsupported input coverage. Small unused-import/argument cleanup is last; do not use lower line count as a substitute for functional improvement.

Keep the user’s ten-minute updates active while working. Report completion only with the current measured acceptance score, evidence paths, storage before/after, remaining limitations, and release-condition results. No new backup is needed.
