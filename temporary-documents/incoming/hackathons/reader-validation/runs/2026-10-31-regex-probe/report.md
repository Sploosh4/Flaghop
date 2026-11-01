# Reader capability audit

Run: 2026-10-31T04:54:25.492913+00:00

All inputs are synthetic. Existing readers ran independently. Manual handoff controls are diagnostic interventions and do not count as automatic successes. Contract failures are regressions; extension/tandem failures are measured gaps, not promises made by the current README. No score estimates general detection accuracy.

Outcomes: {"regression": 1}. Originals unchanged: True.

| Case | Phase | Outcome | Cipher candidates | Hash queue | Evidence |
|---|---|---|---|---|---|
| regex_mismatch_must_not_accept | contract | regression | {"accepted_candidate": 1} | {} | [JSON](../../../../../../hackathons/reader-validation/runs/2026-10-31-regex-probe/regex_mismatch_must_not_accept/observation.json) |

## Interpretation

- A known-answer regex exercises extraction/decoding under a supplied stopping condition; default-checker cases are listed separately.
- A complete scan can contain zero useful candidates. This is processing completion, not proof of coverage.
- An ambiguous bare digest requiring explicit format selection is an intentional safety boundary and passes its contract.
- Hash recovery uses a small finite synthetic wordlist. No failure proves a hash cannot be cracked.
- Read observation.json and each raw process log before attributing a miss to the upstream tool rather than the wrapper.
- No product handoff loop, recursive archive unpacker, or Legion integration was implemented by this test harness.
