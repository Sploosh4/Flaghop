# Scanning acceptance v2

Read [the round-two instructions](/home/joshua/Documents/ChatGPT/Hackathons/DEEPSEEK-SCANNING-NEXT-STEPS.md) for the recommended order, 12 weighted hill climbs, commands, and release conditions.

- `acceptance.py`: 28 executable test methods; stdlib only. Default group is `quick`; use `--group all` for the whole score.
- `measure_storage.py`: samples a real command’s new run, temporary work, and shared-cache directories. It measures usage; it never deletes artifacts or enforces 16 MiB during execution.
- `baseline.json`: measured storage breakdown and target calculations.
- `baseline-all.json`, `baseline-all.log`: failing-first acceptance baseline. **6 pass, 21 fail, 1 unmeasured; 20.1111/100**. Failures are expected on the audited implementation.
- `protected-files.json`: hashes of evaluator inputs and the follow-up instructions. Preserve these while improving production code; report harness bugs for review rather than weakening checks.

**16 MiB means the final retained run after cleanup. Temporary use above 16 MiB is allowed.** A self-test of the observer used a temporary 24 MiB file, removed it, and successfully measured 1 KiB final retained output.

The separate sampled peak target is 256 MiB across the new writable roots; the optional additional shared-cache budget is 200 MiB. Original installed dependencies, historical runs, and the one existing backup are excluded only when left unchanged. New state moved elsewhere must still be declared and counted.

Tests use temporary local fixtures and inspect saved proof. Some checks intentionally run the installed WordPress/browser tools against owned loopback fixtures. The WordPress check exercises the production scanner path; version-probe subprocesses are suppressed in that specific adapter test and assessed separately. The API canary is a synthetic orchestration test, not a claim of a live scanner assessment.

Keep API/CLI compatibility with the documented evaluator entry points. A comprehensive release additionally needs three fresh fixed-configuration live lab runs, original regression coverage, and review of evidence/provenance and writable-root completeness; green unit tests alone do not establish all of that.
