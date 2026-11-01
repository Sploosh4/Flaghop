# DeepSeek Scanning code audit

**31 October 2026 — read-only code review.** No implementation, tests, configuration, saved evaluation results, or backups were changed. This report is the only retained file created for the audit. Diagnostic files were confined to temporary directories and removed afterward; Python bytecode writes were disabled for executable probes.

**Assessment:** The saved lab runs demonstrate useful working functionality, but the implementation and evaluator do not justify treating the reported **100/100** as assurance that the workflow is complete and reliable. I reproduced a broken production WPScan path, a timeout escape, inconsistent completion reporting, and several false passes in the tests/verifier.

This is a correctness, maintainability, architecture, and evidence review, not a comprehensive security assessment of every bundled third-party tool.

## Scope and method

- Compared current project source with the one-time compressed backup made before DeepSeek started. Read the archive directly without extracting or modifying it.
- Reviewed the changed profiler, staged adapters, verifier, WordPress fixture runner, new/changed tests, documentation, and supporting runner/proxy/classifier code.
- Inspected the final score report, saved profiles, verifier reports, and selected raw artifacts.
- Used harmless local process probes, a temporary owned loopback fixture, and in-memory mutations of saved profiles. Verifier report writes were intercepted in memory; original evidence remained intact.
- Did not rerun the complete scanning workflow, restart services, install anything, or contact an external target.

The four production source hashes match DeepSeek’s final report:

| File | SHA-256 |
| --- | --- |
| `ctf_profiler.py` | `d8db52548c1563561743c989f601018f57193cbeb5b7a0d6b284138116cbfac4` |
| `staged_workflow.py` | `6eae6789f7749f9a62b2ac6cb78eef5cb8f43deb82ad3df969594029a0ce8785` |
| `device_classifier.py` | `4686cf0ff7e797df1c14b2cdad3cece0732d4a6699ef9e9bd0ba34bacb552134` |
| `scope_proxy.py` | `fa9e07473462d3b15872cc7c93d6da2579791fc1b4a7f1a8c29697632eb34e4e` |

Priority means **P1: fix before relying on completion claims**, **P2: meaningful correctness or operational problem**, **P3: maintenance improvement**. “Existing” means the relevant mechanism was already present in the pre-DeepSeek backup; it is not attributed to DeepSeek as a newly introduced bug.

## Findings

### F01 — P1: WPScan passes the fixture runner but fails in the production environment

**Locations:** [isolated tool state](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:287), [production WPScan task](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:286), [fixture runner](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/lab/verify_wordpress_fixture.py:38).

The production runner changes `HOME` and `XDG_CACHE_HOME` to a fresh run-local directory, then invokes WPScan with `--no-update`. WPScan’s installed implementation resolves its database under those locations. The updated database in the real user’s cache is therefore unavailable. The new fixture runner uses `os.environ.copy()` and invokes WPScan directly, bypassing the production runner and proxy environment.

**Reproduced:** The production command/environment against the same static WordPress fixture exited **4**, with `scan_aborted: "Update required, you can not run a scan if a database file is missing."` The fixture report had passed under the user environment.

**Effect:** The positive fixture does not establish that the application’s conditional WordPress branch works. It fails on a fresh output directory despite the reported completed setup.

**Suggested correction:** Make database provisioning an explicit adapter dependency and evaluate through the real production adapter and its isolated environment. Preserve configuration isolation rather than simply inheriting the entire user environment.

**Origin:** Existing isolation/adapter mismatch; DeepSeek added the bypassing fixture and claimed the branch verified.

### F02 — P1: The process deadline stops being enforced when output pipes close

**Location:** [Runner polling and wait](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:305).

Timeout enforcement runs only while the stdout/stderr selector contains streams. If a child closes both streams and continues running, the loop ends and `process.wait()` has no timeout.

**Reproduced:** A harmless Python child closed stdout/stderr and slept for 0.7 seconds. With a **0.05-second** task deadline, it ran for **0.713 seconds** and was labelled **`completed`**. A child that never exits can hang indefinitely.

**Suggested correction:** Monitor process lifetime independently of stream lifetime, keep enforcing the deadline during the final wait, and retain process-group cleanup. Add a regression for early pipe closure.

**Origin:** Existing runner defect; not covered by the new claim that every configured timeout is enforced.

### F03 — P1: The strengthened verifier still accepts internally incorrect “complete” profiles

**Locations:** [source-task validation](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/lab/verify_staged_profile.py:117), [closed control check](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/lab/verify_staged_profile.py:150), [Metasploit exclusion and finding coverage](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/lab/verify_staged_profile.py:170).

Each following change was made **only to an in-memory copy** of the final saved profile. The unmodified verifier still returned **PASS with no failed checks**:

| Mutation | Why acceptance is incorrect |
| --- | --- |
| Remove the closed TCP `18444` record entirely | `None != "open"` treats missing evidence as a valid closed-port result |
| Remove every HTTPS reproduced finding | Only the set of weakness types is checked, so HTTP-only findings satisfy the claimed HTTP-and-HTTPS coverage |
| Add a failed Metasploit execution task while leaving stage summaries unchanged | Exclusion checks only reject completed Metasploit tasks; failed execution and contradictory stage summaries pass |
| Change every finding’s source task to `discovery` | The verifier checks that an ID exists, without checking its role, endpoint, successful outcome, or relationship to the proof |

The verifier also imports the production `in_scope` helper. That is useful reuse but makes scope verification less independent: a shared helper defect can affect both implementation and evaluator.

**Suggested correction:** Derive expected coverage and stage outcomes from task evidence; require an explicit closed observation; reject any executed excluded task; verify proof-to-task lineage and each required origin. Keep independent test cases for shared scope logic.

**Origin:** DeepSeek’s new verifier logic.

### F04 — P2: The negative tests can pass when validation was never successfully exercised

**Location:** [negative fixtures](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/tests/test_negative_fixtures.py:64).

The test constructs `base` without a trailing slash, then passes it to `validate_git`, which concatenates `.git/config`. The resulting URL is **`http://127.0.0.1:PORT.git/config`**, not the fixture endpoint. A separate correctly formed curl request succeeds, but it does not validate the helper’s request. The helper’s failed request produces no finding and the test passes.

The SQL/browser helper calls likewise do not assert successful execution or the expected evidence. **Reproduced:** Simulating `tool_missing` for the browser still let the entire negative test pass. The test then can report that XSS was not reproduced without having tested browser behaviour.

The SQL test uses a constant response, not an actual parameterised database lookup, despite the documentation’s wording. This is a legitimate simple negative fixture, but offers narrower assurance than claimed.

**Suggested correction:** Verify the actual URL, successful validator execution, and consumed proof for each negative case. Distinguish “checked and absent” from “not checked.” Exercise the production orchestration as well as helpers.

**Origin:** New DeepSeek tests/documentation.

### F05 — P2: Valid JSON with the wrong schema can crash the run instead of becoming a parser failure

**Locations:** [Dalfox normalisation](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:69), [artifact exception handling](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:89), [build exception boundary](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:813).

`normalise_dalfox` converts `meta.findings_count` with `int()` without validating its type. A nonempty object raises `TypeError`, which neither the artifact parser nor the build boundary catches. Similar assumptions exist when consuming nested Katana/ZAP objects.

**Reproduced:** A Dalfox artifact containing an object for `findings_count` let **`TypeError` escape**. Conversely, an exit-1 report declaring one finding but containing an empty findings list was accepted as complete. A non-list findings value with exit 0 was also accepted.

**Effect:** Schema drift or malformed scanner output can terminate the workflow before the final profile is written, or be reported as a successfully parsed result.

**Suggested correction:** Validate each adapter’s nested schema, fail malformed contracts locally, and preserve partial results at the orchestration boundary. Validate real finding records rather than trusting a count alone.

**Origin:** DeepSeek’s new parser helpers, plus existing weak contracts in adjacent adapters.

### F06 — P2: A run can be “completed” with partial stages and missing tools

**Locations:** [stage outcome calculation](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:118), [run outcome calculation](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:820).

The new stage logic treats `tool_missing` as partial; overall run logic does not.

**Reproduced without scanner execution:** Supplied the synthetic XML and mocked all tools as unavailable. Identification/enumeration were **partial**, while the run was **completed** and returned **exit 0**.

Missing optional tools may reasonably be allowed. The bug is the contradictory meanings across status layers. A caller cannot safely use the overall completion field as evidence that its requested stages completed.

**Suggested correction:** Define required/optional applicability and one status aggregation policy used by tasks, stages, and runs.

**Origin:** New stage handling combined with the existing overall aggregation policy.

### F07 — P2: ZAP API findings are discarded from the combined findings list

**Location:** [web and API ZAP handling](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:293).

The web ZAP result is traversed into `assessment_findings`. The API invocation’s returned rows are ignored. Its raw JSON survives, but API-only alerts never reach the combined candidate list.

**Confirmed in saved evidence:** The API report contains alerts, including SQL injection, while combined findings have only `nuclei-*` and `zap-PORT` sources, with no `zap-api-*` source.

**Suggested correction:** Use a shared alert normaliser for both modes, retaining origin/provenance and deliberate deduplication.

**Origin:** Existing staged integration gap, left unaddressed by the completion claim.

### F08 — P2: Each run archives hundreds of megabytes of duplicated tool runtime

**Locations:** [ZAP run-local home](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/staged_workflow.py:389), [recursive artifact manifest](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:666).

The final candidate’s manifest contains **750,315,534 bytes** across **2,078 files**. About **743,513,663 bytes** are ZAP `*-home/` contents. Four separate web/API ZAP homes repeat identical runtime JARs and webdriver binaries. The three accepted runs retain about **2.25 GB** of raw files in total.

Those files are then all hashed during profile generation and again during verification. Output limits cover selected logs/artifacts, not the aggregate runtime directories.

**Suggested correction:** Separate ephemeral tool state from retained evidence, reuse immutable runtime dependencies where supported, retain selected reports/logs, and impose a meaningful per-run storage budget. Preserve genuine evidence when defining retention.

**Origin:** Existing execution/retention design, amplified by the new evaluation sequence.

### F09 — P2: Interrupting version collection loses the partial profile

**Location:** [profile construction before the protected block](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:738).

DeepSeek added external version probes inside `initial_profile`, but `build()` calls that function before entering its interruption/error handler. The output directory already exists. Ctrl-C during a version probe can escape without writing `device-profile.json`, and retrying the same output path fails because it exists.

**Reproduced:** Injecting `KeyboardInterrupt` at version collection escaped `build`; the output directory existed, but the profile did not. The new interruption regression injects interruption much later, after initialisation.

**Suggested correction:** Initialise and persist minimal run state inside the protected lifetime boundary, then collect metadata. Test interruption during initialisation and active execution separately.

**Origin:** New version collection placement; the vulnerable early-init layout predates it.

### F10 — P2: Recorded versions and configuration are not sufficient to reproduce the run

**Locations:** [version command table](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:88), [version parsing](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:129), [recorded configuration](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/ctf_profiler.py:701).

The command table uses key `curl`, but the inventory uses `http`, so curl’s available version query is never selected. For other tools the first output line is stored even when it is ASCII art or an ANSI escape. Saved “versions” include underline characters for WPScan and banner art for httpx/Katana. Dalfox’s version query timed out.

For script wrappers, the recorded hash covers the small launcher, not the underlying Ruby gems or ZAP installation. Calling that executable hash “authoritative” overstates what it identifies.

Configuration omits requested stage range, skipped tools, UDP selection, assessment/validation timeouts, endpoint/origin limits, `--verify-tls`, and effective privilege/OS-detection mode. Commands preserve some information, but skipped decisions and missing flags cannot be reliably reconstructed from this abbreviated configuration. Source identity also omits templates, wordlists, and verifier/fixture versions.

**Suggested correction:** Record the complete effective configuration and dependency/template identities; use per-tool version extraction and clearly distinguish unknown versions, wrapper identity, and installed dependency identity.

**Origin:** New metadata implementation; abbreviated configuration was already present.

### F11 — P2: Documentation audit does not support the “every documented example works” claim

**Locations:** [README runner claim](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/README.md:53), [current runner](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/lab/run_workflow.sh:64), [saved documentation audit](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/validation/deepseek-evaluation/docs-command-audit.log).

The README still says the single-authentication runner performs a verified Metasploit import. The runner no longer executes/imports Metasploit, in either mode. `CLASSIFICATION.md` also describes the earlier import behaviour.

The saved documentation audit demonstrates `--check-tools`, one offline example, and help output. It does not exercise every documented command/option. The separately saved successful terminal/fixture runs add coverage, but do not justify the universal D2 wording. “Simulated executables exercise every adapter” also exceeds what the mocked pipeline test covers: that test exercises the original tools, not every extended production path.

**Suggested correction:** Correct stale behaviour descriptions and report a specific command matrix with untested rows, rather than marking all examples verified.

**Origin:** Stale earlier text retained during DeepSeek’s README update, plus overstated audit coverage.

## Architecture, unnecessary work, and maintenance notes

These are additional design observations, not all independent runtime failures.

| Priority | Observation | Practical consequence / direction |
| --- | --- | --- |
| P2 | Task lifecycle logic is split across `Runner.execute`, original normalisation, the staged `execute` closure, stage aggregation, run aggregation, and the verifier | F05/F06 are symptoms of inconsistent contracts. A typed adapter result and shared outcome rules would reduce drift |
| P2 | The five-stage planner is one large nested function with per-tool command construction and parsing intertwined | Hard to test real adapters independently; the WordPress fixture bypassed precisely this integration. Give adapters explicit dependency, plan, execute, and parse interfaces |
| P2 | Existing classifier only consumes Nmap, original HTTP/WhatWeb, and SMB evidence | New httpx/fingerprintx/Nuclei/discovered-page product evidence does not generally improve device classification. Rich raw output is collected without a normalised route into inference; decide which signals should contribute |
| P2 | Validation eligibility recognises a short hard-coded set of GET parameter names; default validation coverage is one URL per category | Coverage is much narrower than an arbitrary discovered application. POST/form/API inputs and differently named parameters can be missed. Document the tested subset and report omitted eligible work |
| P2 | `--verify-tls` is applied to the original curl path, while staged fallback/retrieval paths hard-code `--insecure` | A global-looking setting has inconsistent behaviour. Centralise transport policy; do not infer this option governs all tools today |
| P3 | Several adapter caps are hard-coded and not uniformly reported; unknown-service fingerprinting stops at four | An otherwise completed run may omit work without one consistent coverage ledger. Record every limit and omission alongside results |
| P3 | HTTP and API ZAP runs each spider and actively scan the same origin; HTTP and HTTPS versions of the same app repeat much work | Can be justified for distinct surfaces, but reuse discovered requests and distinguish duplicated application work from necessary per-transport checks before optimising |
| P3 | Negative-test cleanup joins the server thread before stopping its `serve_forever` loop and never calls `shutdown()` | Adds a three-second wait and can leave a daemon thread alive. The audit’s one negative test took about 3.5 seconds even with browser execution skipped |
| P3 | `parse_result_artifact` has an unused `output` argument; `staged_workflow.py` imports unused `sys`; the negative test has unused locals | Small cleanup opportunities; lower priority than reliability and integration defects |

The retained Metasploit code is outside this assignment’s agreed evaluation scope. I have not treated its mere presence as waste or proposed removing it.

## What the existing evidence does support

- There are saved completed lab profiles and passing verifier reports for the authenticated runner and two further active runs.
- The source identities match the reported final candidate.
- The saved final unit-test log contains **39 passing tests**. I did not rerun that whole suite, which invokes scanner/version processes and can produce additional state.
- The fingerprintx output-file fix addresses the original missing-artifact problem.
- The local-lab positive exercises have saved HTTP, scanner, and browser artifacts; this review does not claim those positive results were fabricated.
- Candidate findings remain distinct from reproduced findings in the main data model, and classification wording explicitly recognises uncertainty.

The problem is the gap between those specific successes and the broader completion claims. For example, the first accepted run used privileged TCP/UDP discovery and OS fingerprinting, while later active runs used unprivileged TCP discovery. They validate useful paths, but their configurations are not identical repeatability samples.

## Recommended order for a later fix task

1. Repair the production WPScan database/environment dependency and test through the actual adapter.
2. Fix deadline enforcement and make parser errors local, recoverable failures with saved partial profiles.
3. Align task/stage/run outcomes and fix the negative-test false passes.
4. Strengthen the verifier’s coverage, execution-exclusion, and proof-lineage checks; reassess the score from evidence.
5. Surface API findings, correct provenance/configuration and documentation claims, then address retention and architecture.

No fixes were applied. I have not assigned a replacement numerical score: several claimed checks need fresh, corrected evaluation, and subtracting points from the existing self-report would imply more certainty than this audit establishes.
