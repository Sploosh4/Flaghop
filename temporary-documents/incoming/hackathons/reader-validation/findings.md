# Reader audit findings — 31 October 2026

Historical audit, before the shared loop was built. The subsequent implementation
is documented in [shared-reader](../../../../hackathons/shared-reader/README.md), including fixes for
regex enforcement, empty passwords, modular boundaries and JSON checksum context.
The original measurements below are retained as evidence of the earlier gaps.

The individual readers handle the tested supported cases, but they do not yet
form an automatic decode-and-recovery pipeline. The audit also exposes concrete
result-validation defects. Production reader code was left unchanged so these
failures remain reproducible.

## Measured results

The reviewed run is [runs/2026-10-31-reviewed/report.md](../../../../hackathons/reader-validation/runs/2026-10-31-reviewed/report.md),
with full machine-readable [results](../../../../hackathons/reader-validation/runs/2026-10-31-reviewed/summary.json).

- Existing component suites: **17 Cipher Watch tests + 24 Hash Watch tests pass**.
- Audit harness/property suite: **12 tests pass**, including 32 generated binary
  Base64 fixtures with three occurrences each, 36 hash label/quote/whitespace
  combinations, and 12 longer-token boundary checks.
- New real-tool audit: **68 cases: 37 pass, 1 failed contract, 30 gap probes**.
  The contract phase is 34 pass / 1 failure. Extension probes are 3 pass / 23 gaps.
  All seven tandem workflow probes miss their intended automatic end result.
- All 68 original fixtures retain identical bytes and modification timestamps.
  Source hashes, decoded hashes and available byte/line locations pass the audit's
  independent integrity checks.
- Five failed tandem cases recover successfully after an explicitly manual
  decoded-bytes-to-Hash-Watch intervention. A sixth succeeds after manually
  sending a recovered encoded password to Cipher Watch. These are controls, not
  evidence of an existing automatic feature.

These are reproducible fixtures, not percentages estimating recall or precision
on arbitrary files. Guided Ciphey cases and default-checker cases are separated
in the matrix. Password recovery is tested against a small finite known-answer
plan. The CPU/GPU benchmark was not repeated.

## Correctness gaps to address first

| Priority | Reproduction | Observation and cause | Required behavior |
|---|---|---|---|
| 1 | `regex_mismatch_must_not_accept` | A Base64 known-answer fixture produces a finding despite regex `^IMPOSSIBLE_AUDIT_MARKER_936743$`. The wrapper trusts Ciphey's acceptance output without independently enforcing its configured regex. Other malformed/wrapped cases can produce accepted one-character/control-character answers. | Validate the configured stopping condition on returned text. Preserve mismatching output as rejected evidence. Add negative tests, not just successful regex examples. |
| 1 | `native_john_empty_md5`, `native_hashcat_empty_md5`, `empty_password`, `bcrypt_empty_password` | Both native engines recover the empty MD5 password into their result files. The adapter then loses `b''` through `recovered(...) or existing` in `hash_watch/engines.py:74`. Separately, `plans.py:18` and `:39` exclude empty candidates, so normal queues never try them. | Distinguish an empty recovered password from no result, and provide an explicit, testable empty-candidate policy. |
| 1 | `malformed_bcrypt_boundary` | Appending `EXTRA` to a valid bcrypt record still queues and recovers the valid prefix. `detect.py`'s modular regex lacks a trailing token boundary. | Retain the malformed record for review; do not silently turn a substring into a confirmed complete input hash. |
| 1 | `md5_label_on_checksum` | `{"checksum":{"md5":"..."}}` auto-queues and recovers. The checksum guard only inspects the immediately adjacent field label and misses the enclosing object. | Use structured context or an explicit classification policy to distinguish password material from file checksums. |

Evidence for each row is in the corresponding case's `observation.json`, linked
from the full case matrix. A failed contract here means a newly exposed unmet
expectation, not that this test-only change broke production behavior.

## Missing automatic coordination

The existing programs independently process the same source bytes. Neither
automatically routes every decoded/extracted artifact or recovered value back
through both readers. Consequently:

| Case | Current result | Test-only control |
|---|---|---|
| Base64 containing an MD5 field | No automatic MD5 recovery | Manually forward the first decoded bytes: verified recovery |
| Hex containing an MD5 field | No automatic MD5 recovery | Manually forward decoded bytes: verified recovery |
| Two Base64 layers containing an MD5 field | No automatic MD5 recovery | Two explicit manual decoding steps, then hash scan: verified recovery |
| Plain hash plus another encoded hash | Plain hash recovers; encoded target is missed | Manually forward encoded field's decoded bytes: second recovery |
| Base64 containing an encrypted ZIP | Binary extraction stops in Cipher Watch | Manually forward binary bytes to Hash Watch: ZIP extraction and recovery succeed |
| Recovered password is itself Base64 text | The hash recovers; decoded message is absent | Manually forward recovered bytes to Cipher Watch: expected text succeeds |
| Unencrypted ZIP containing encoded text | No decoded member text | No unpacking control implemented in this audit; member extraction is a separate missing feature |

For the layered hash fixture, the control's second layer is explicitly decoded
by the test harness. It is not credited to Ciphey. Several encoded-hash inputs
also trigger upstream worker panics before any plaintext acceptance, so a
coordinator must inspect typed first-layer artifacts rather than requiring every
artifact to be accepted by Ciphey's plaintext checker.

## Extraction and format gaps

- **Base64 variants:** wrapped lines, concatenated quoted strings, missing padding
  and URL-safe alphabet fail the supplied fixtures.
- **Text encodings:** UTF-16 source files hide both encoded strings and hash
  labels from byte-pattern scanning. Ordinary JavaScript `\\u0068`-style text
  becomes NUL-containing binary under base64dump's little-endian word decoder;
  it needs a distinct text interpretation. Percent-byte URL escapes are absent.
- **Short payloads:** the default eight-byte decoded minimum misses `flag{x}`.
  This is a documented noise/coverage tradeoff, not an upstream decoding failure.
- **Optional formats:** Base85 succeeds with `encodings=b85`, fails under defaults.
  This is configuration coverage, not a missing underlying decoder.
- **Hash records:** a pwdump-like NTLM row remains two ambiguous digests; an
  algorithm sibling field leaves an MD5 unresolved. SHA-384 and pasted John ZIP
  records are not discovered by the current text detector.
- **Containers:** gzip inside Base64 stops as first-layer binary, and an
  unprotected ZIP's compressed text is never visited. Recognizing an encrypted
  container for a *2john helper is different from extracting ordinary members.
- **Classical cipher passages:** raw ROT13 text is not submitted intact to Ciphey
  by this extractor-first wrapper. In the separate direct-call control, the pinned
  Ciphey binary panics in `vigenere_decoder.rs` with an index-out-of-bounds error.
  This records instability on that fixture; it does not establish that all
  ROT13 inputs fail.

The deliberate `needs_format` result for an unlabelled raw digest remains a
passing contract. Bytes alone cannot reliably distinguish every raw algorithm,
checksum and identifier. Automatic processing should retain alternatives and
validation evidence rather than invent certainty.

## Suggested implementation order and acceptance gates

1. Fix the four correctness issues above and make the negative contract test pass.
2. Add a bounded artifact coordinator: inspect original files, extracted text and
   binary bytes, and recovered candidate bytes with both relevant readers. Retain
   parent/source hashes, transformation edges and exact validation outcomes.
   Deduplicate content/config work and bound depth, nodes, time and expanded bytes
   so repeated/cyclic outputs cannot cause endless work. Decoded offsets refer to
   their own artifact; do not report them as original-file offsets.
3. Add normalization/extractors with separate provenance for wrapped/URL-safe
   Base64, supported text encodings, structured hash records and archive members.
   Keep paths contained and impose decompression budgets.
4. Require all seven existing tandem probes to pass automatically, then add cycles,
   archive nesting/bombs, interrupted chained jobs, changed files during chaining,
   candidate floods, misleading labels, unsupported costs/formats and large mixed
   corpora. The existing watcher/restart tests remain necessary but do not test
   this missing coordinator.

Those are implementation proposals. No coordinator, integration, engine fix,
service installation, external scan or automatic authentication was performed
by this testing task.
