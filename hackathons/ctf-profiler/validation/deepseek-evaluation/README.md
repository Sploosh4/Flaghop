# DeepSeek evaluation evidence

Start with [`FINAL-REPORT.md`](FINAL-REPORT.md) and the machine-readable
[`score-report.json`](score-report.json).

- `baseline/` — fresh pre-fix baseline (45/100) and its `score-report.json`.
- `candidate-1/` — interim fixed candidate evaluated from saved real Nmap XML.
  Same production source hashes as the final candidate; superseded by the
  three-run final evidence.
- `candidate-3/`, `candidate-4/`, and
  `../staged-lab/20261031T063423Z-244709/` — the three consecutive final runs.
  The earlier `../staged-lab/20261031T061817Z-209227/` runner evidence is
  preserved separately.
- `wordpress-fixture-final/` — positive owned WordPress/WPScan evidence.
- `negative-fixtures-final.json` — corrected fixture with zero reproduced findings.
- `unit-tests-final.log` — 39 passing tests.
- `terminal-full-run/` — preserved earlier and latest user-authorized
  single-sudo runner attempts; `latest-run.json` points to the latest.

The verifier reads `lab/ground-truth.json` only as evaluator evidence. It is not
passed to scanner planning or classification. Recompute commands are in
`FINAL-REPORT.md`.
