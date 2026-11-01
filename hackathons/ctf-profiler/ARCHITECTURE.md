# Scanner architecture

The scanner is a sequential Python application with a CLI coordinator and reusable components. External scanners run as child processes. Evidence is stored in files; no job service or database is required.

## Entry points and contracts

`ctf_profiler.main(argv)` validates CLI options and calls `build(args)`. Existing imports such as `ctf_profiler.Runner`, `parse_nmap`, `tool_identity` and the public staged-workflow helpers remain available for callers and the independent evaluators. Their implementations live in the modules below.

Planners produce task dictionaries with `id`, `tool`, `command`, `trigger` and `timeout`, plus optional stage, endpoint, artifact and isolation fields. `execution.TaskSpec` and `TaskResult` describe the shared contract. The Runner adds execution status, exit code, timing and raw-output paths; parsers add their own outcome. These annotations do not turn input dictionaries into runtime-validated objects.

The coordinator owns the mutable profile. It records discovery, tasks, observations, assessment candidates, independently reproduced findings, classification, cleanup and dependency evidence. Extended orchestration receives a Runner and task/normalisation callbacks; lower-level components do not import the CLI.

## Module ownership

| Module | Responsibility |
| --- | --- |
| `ctf_profiler.py` | CLI validation, run lifecycle and profile assembly |
| `staged_workflow.py` | Conditional stage orchestration and stage summaries |
| `settings.py` | Supported tools/stages, version and shared output limits |
| `execution.py` | Task contracts, deadlines, process-group termination and bounded stream capture |
| `tool_environment.py` | Environment allowlist, browser scratch and isolated tool homes/cache selection |
| `discovery.py` | Nmap command construction and single-target XML validation/parsing |
| `service_plan.py` | Conditional SSH/SMB/HTTP/TLS/DNS follow-up plans |
| `service_parsers.py` | Service-output normalisation and HTTP page clues |
| `web_parsers.py` | Strict fingerprintx/Dalfox schemas, web artifact parsing and link extraction |
| `web_assessment.py` | Bounded HTTP/API retrieval, scoped OpenAPI handling and ZAP adapters |
| `finding_validation.py` | Independent Git, SQL and real-browser XSS reproduction |
| `metasploit_adapter.py` | Optional resource export and existing narrowly scoped check preparation |
| `workspace.py` | Owned scratch allocation, runtime diagnostics and observable cleanup |
| `identities.py` | Tool inventory, source/input hashes, stable versions and per-run probe provenance |
| `dependencies.py` | Existing installed dependency/database fingerprinting |
| `device_classifier.py` | Pure classification rules over saved observations |
| `scope_proxy.py` | Parsed URL scope checks and the target-restricted web proxy |
| `evidence.py` | Bounded reads, JSON writes, checksums and artifact manifests |

The important dependency direction is coordinator → planners/adapters → execution/evidence/workspace. The generic Runner delegates tool-specific environment preparation; it does not construct scanner-specific command lines. Tool decisions remain explicit branches in the stage planner. This refactor does not introduce a plug-in loader or generic workflow engine.

## Extending a tool

Register executable aliases in `settings.py`; put command selection in the appropriate planner/adapter, output contracts in the relevant parser, and independent proof logic in `finding_validation.py` when supported. Add focused behaviour tests. Keep process management in `execution.py` and temporary ownership in `workspace.py`/`tool_environment.py`. Components can be imported without loading the CLI or the staged controller.

All root Python production modules are included in `source_identity`. Stable tool identity and per-run version-probe provenance stay separate. The existing incomplete resolution of the actual Chrome binary and WPScan gem entrypoint is an outstanding dependency-audit issue; the refactor does not claim to fix it.

## Verification boundary

`lab/verify_staged_profile.py` remains an independent reader of the saved profile and separate lab ground truth. It does not reuse scanner scope/proof helpers. The protected v2/v3 evaluators and real Chrome preflight remain outside the implementation. Full lab runs use the real browser gate followed by the unchanged storage observer. The 16 MiB target concerns retained output after cleanup; temporary peak use is measured separately.

Historical validation outputs belong to their recorded source hashes. Refactor verification is stored under `validation/refactor-20261031/`; old successful reports are not evidence for the refactored candidate.

The subsequent Python 3.12 integration fix is recorded separately under
`validation/compat-python312-20261031/`. Literal wrapper paths are heuristic
dependency hints: multiline or unstatable hints cannot abort profiling. Real
dependency read failures still make the run partial, retaining the original
error alongside the dependency-change flag. This fix does not close the Chrome
ELF/WPScan fingerprint gap above.

## Module sizes after extraction

This snapshot counts physical Python lines, including comments and blank lines, on 31 October 2026, including the subsequent Python 3.12 dependency compatibility fix. Existing modules totalled 2,216 lines / 111,925 bytes before the refactor. The split adds explicit imports and task type contracts; it reduces responsibility per module rather than total line count.

| Module | Before lines | After lines | After KiB |
| --- | ---: | ---: | ---: |
| `ctf_profiler.py` | 1,079 | 343 | 17.6 |
| `staged_workflow.py` | 596 | 225 | 14.9 |
| `device_classifier.py` | 217 | 217 | 12.9 |
| `scope_proxy.py` | 118 | 129 | 5.6 |
| `dependencies.py` | 114 | 121 | 5.0 |
| `workspace.py` | 92 | 146 | 5.4 |
| `execution.py` | extracted | 181 | 7.1 |
| `service_parsers.py` | extracted | 139 | 5.7 |
| `identities.py` | extracted | 130 | 5.1 |
| `web_assessment.py` | extracted | 110 | 6.0 |
| `discovery.py` | extracted | 107 | 4.4 |
| `web_parsers.py` | extracted | 102 | 4.4 |
| `service_plan.py` | extracted | 99 | 4.7 |
| `finding_validation.py` | extracted | 99 | 6.8 |
| `metasploit_adapter.py` | extracted | 89 | 4.0 |
| `tool_environment.py` | extracted | 49 | 2.2 |
| `settings.py` | extracted | 43 | 0.9 |
| `evidence.py` | extracted | 42 | 1.3 |
