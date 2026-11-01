# Reader validation and gap probes

This suite tests the real local Cipher Watch and Hash Watch prototypes against
synthetic files. It adds no production handoff loop and changes no reader code.
Run it with the existing Hash Watch Python environment; no installation is needed.

The latest reviewed audit is [findings.md](findings.md). The full measured case
matrix is [report.md](runs/2026-10-31-reviewed/report.md) and machine-readable results
are [summary.json](runs/2026-10-31-reviewed/summary.json). Each case retains its input,
source hashes, scan reports, worker diagnostics and independently checked source
locations. Manual bridge controls have separate evidence folders and never count
as automatic success.

## Run

From `/home/joshua/Documents/ChatGPT/Hackathons`:

```bash
# Test the audit's accounting and evidence oracles.
hash-watch/.venv/bin/python -m unittest discover -s reader-validation/tests -v

# Verify supported cases first. Choose a NEW output directory on every run.
hash-watch/.venv/bin/python reader-validation/audit.py \
  --phase contract --out reader-validation/runs/my-contract-run

# Then explore wider expectations, followed by combined workflow probes.
hash-watch/.venv/bin/python reader-validation/audit.py \
  --phase extension --out reader-validation/runs/my-gap-run
hash-watch/.venv/bin/python reader-validation/audit.py \
  --phase tandem --out reader-validation/runs/my-tandem-run

# Or run all phases in that order, making every unmet goal fail the command.
hash-watch/.venv/bin/python reader-validation/audit.py \
  --out reader-validation/runs/my-full-run --fail-on-gaps

# Target one reproducible failure.
hash-watch/.venv/bin/python reader-validation/audit.py \
  --case native_john_empty_md5 --out reader-validation/runs/my-empty-password-run \
  --fail-on-gaps
```

The existing component suites remain available as described in their READMEs:
run `.venv/bin/python -m unittest discover -s tests -v` from each prototype.
Their audit-time logs are preserved under `runs/2026-10-31-reviewed/baseline/`.

Default exit status is nonzero for a failed contract, unexpected exception or
source/evidence integrity failure. Extension/tandem gaps remain visible in the
report but fail the command only with `--fail-on-gaps`. This lets the contract
suite remain useful while broader gaps are still being implemented. Gaps are not
silently skipped or decorated with unittest `expectedFailure`.

## Scope and interpretation

- `contract`: supported decoding/recovery, deliberate ambiguity handling, bounds,
  negative controls, native engine controls and evidence correctness.
- `extension`: desired broader coverage and malformed-input/precision probes.
  Some misses reflect documented scope/settings; others expose wrapper defects.
- `tandem`: both current readers run against the same original file. No missing
  coordinator is simulated. Test-only manual forwarding then isolates whether
  connecting the existing components would solve a miss.
- Cipher cases explicitly distinguish a supplied known-answer regex from
  Ciphey's default checker. Exact known-answer comparisons happen outside the
  readers. A plaintext-checker acceptance is not treated as proof of correctness.
- Every case checks original bytes and mtime, evidence hashes and byte locations.
  Extraction-helper locations are not invented as raw-file offsets.
- Cracking uses a tiny finite synthetic plan, four CPU workers and bounded
  attempts. Existing CPU/GPU benchmark rankings are not rebenchmarked here.
- The audit takes Hash Watch's existing project compute lock. Do not run other
  direct native engine scripts concurrently. Normal runs take roughly one minute
  here; performance is not an acceptance target.
- Inputs, recovered answers and manual probes stay below the selected audit
  directory. Never point this harness at an existing evidence folder. It refuses
  to overwrite a run. No network scans, authentication or background watcher is
  started by this suite.

The initial exploratory run is retained in `runs/2026-10-31-initial`. It used
ordinary Unicode escape strings as a BU/PU decoding contract; inspection showed
base64dump actually decodes little-endian two-byte words. The reviewed audit
corrects those contract fixtures and tests ordinary Unicode escapes separately
as a broader text-handling gap. The intermediate `runs/2026-10-31-audit` then exposed a missing negative regex check; the reviewed run includes that additional contract test. Use the reviewed audit for counts.
