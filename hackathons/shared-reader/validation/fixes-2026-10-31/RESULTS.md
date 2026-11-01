# Reader fixes and frozen-collection rerun

No CTFs, challenge services, labs or network targets were set up or used. All tests used the same offline files as the original evaluation. No recovered credential was used for authentication.

**Result: all 240 scored goals met; the same 15 unlabelled public samples remain observations.** This is goal completion on a frozen collection, not a claim that every file was decrypted or that arbitrary input has 100% detection accuracy.

| Outcome | Before | After |
|---|---:|---:|
| pass | 187 | 240 |
| miss | 44 | 0 |
| noise | 2 | 0 |
| inconclusive | 7 | 0 |
| observation | 15 | 15 |

## Priority fix: late payloads

All seven end-of-file payloads now recover, including the six previously missed. All four beginning-of-file probes still recover, and all seven larger negative controls now complete without the old repeated-candidate cutoff. Sizes range from 16 KB to 1.9 MB.

Both extraction paths now count distinct decoded byte values. Repeated matches are scanned once per encoding representation, retain bounded source locations and total occurrence counts, and do not spend the entire content budget. Base64dump retains up to eight locations per decoded value, including first/last occurrences. The normalization pass scans past duplicate quoted values instead of stopping after its first 64 matches.

A language-checking deadline no longer discards already-extracted byte records: those remain available to hash/container routing. Real distinct-value overflow, oversized candidates and time/expansion limits still produce explicit partial/limit evidence.

## Other fixes

- Added canonical Base32/Base85/Ascii85, percent-byte and Unicode-text decoding, plus literal quoted-string concatenation without evaluating source code.
- Added bounded bzip2/XZ decoding, PNG text-chunk extraction and direct-length single-Flate PDF streams. XZ now has a real decompression edge rather than incidental byte recovery.
- Added SHA-224/SHA-384 detection and adapters, checked against real John and Hashcat recovery with independent hashlib verification. Added sibling algorithm/hash field parsing and pwdump NT-field recognition.
- Checksum context now works in plain log text and JSON embedded after a log prefix; the two unwanted cracking actions became review-only detections.
- Parent status includes hash-reader errors and transform limits, so the malformed SSH helper failure remains visible as partial.
- Canonical Base64 text layers are peeled before heuristic search. Typed hashes/opaque identifiers bypass risky native search and remain routed artifacts. Non-text checker output is rejected. The pinned native Ciphey binary itself was not upgraded or patched.

## Validation and remaining interpretation limits

- Actual Ciphey panic attempts: 32 -> 0; files with panics: 28 -> 0.
- Accepted control-character outputs: 22 -> 0.
- Hash failures hidden beneath a done parent: 1 -> 0.
- Regressions of previously passed goals: 0. Original/artifact integrity failures after fixes: 0. Evaluator crashes/external guard timeouts: 0.
- All original input hashes, goals, audit seed hashes and numeric evaluation limits match the previous run. The 237-file and 18-file reruns each use fresh projects and pot files. Reader code was frozen throughout both runs.
- The 17 Cipher Watch, 24 Hash Watch and 23 shared-loop baseline tests passed. Twelve new regression tests passed, including near-limit duplicate/footer coverage, true distinct-value overflow, retained leads after a deadline, context parsing, real SHA-224/SHA-384 native recovery and failure-status propagation.
- 6 raw classical-cipher goals are reached through explicitly unverified ROT13/reversal hypotheses: text_0_rot13, text_0_reverse, text_1_rot13, text_1_reverse, text_2_rot13, text_2_reverse. Their exact known bytes match the test oracle; the product does not claim it has independently established the historical plaintext. Printable partial checker fragments also remain unverified candidates.
- needs_format and needs_adapter outcomes remain appropriate for ambiguous hashes and unsupported recovery adapters. A finite candidate plan can correctly exhaust without finding a password. Neither outcome is counted as decryption success.
- Native Ciphey can still fail on other inputs. Avoiding the measured panic paths and rejecting control bytes is not a general repair of its upstream heuristics.
- The 2 MB file, 64 distinct decoded-value, 128 artifact, depth, expansion and time budgets remain deliberate limits. Larger or more diverse inputs can still be partial; repeated occurrences no longer masquerade as 64 distinct leads.
- General PDF parsing, arbitrary archive/encryption variants, OCR and dynamic code expressions remain outside these added routes.

## Per-case results

| Case | Before | After | Native evidence |
|---|---|---|---|
| text_0_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_base64/project/reader-report.json) |
| text_0_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_hex/project/reader-report.json) |
| text_0_three_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_three_base64/project/reader-report.json) |
| text_0_base32 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_base32/project/reader-report.json) |
| text_0_base85 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_base85/project/reader-report.json) |
| text_0_ascii85 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_ascii85/project/reader-report.json) |
| text_0_unpadded | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_unpadded/project/reader-report.json) |
| text_0_wrapped | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_wrapped/project/reader-report.json) |
| text_0_urlsafe | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_urlsafe/project/reader-report.json) |
| text_0_escaped_bytes | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_escaped_bytes/project/reader-report.json) |
| text_0_json_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_json_base64/project/reader-report.json) |
| text_0_html_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_html_base64/project/reader-report.json) |
| text_0_js_concat | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_js_concat/project/reader-report.json) |
| text_0_percent_bytes | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_percent_bytes/project/reader-report.json) |
| text_0_unicode_escapes | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_unicode_escapes/project/reader-report.json) |
| text_0_utf16le | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_utf16le/project/reader-report.json) |
| text_0_utf16be | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_utf16be/project/reader-report.json) |
| text_0_rot13 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_rot13/project/reader-report.json) |
| text_0_reverse | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_0_reverse/project/reader-report.json) |
| container_0_zip_plain | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_zip_plain/project/reader-report.json) |
| container_0_zip_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_zip_base64/project/reader-report.json) |
| container_0_zip_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_zip_hex/project/reader-report.json) |
| container_0_gzip_plain | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_gzip_plain/project/reader-report.json) |
| container_0_gzip_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_gzip_base64/project/reader-report.json) |
| container_0_base64_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_base64_zip/project/reader-report.json) |
| container_0_gzip_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_gzip_zip/project/reader-report.json) |
| container_0_zip_gzip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_zip_gzip/project/reader-report.json) |
| container_0_nested_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_nested_zip/project/reader-report.json) |
| container_0_tar_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_tar_base64/project/reader-report.json) |
| container_0_tar_gzip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_tar_gzip/project/reader-report.json) |
| container_0_bzip2 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_bzip2/project/reader-report.json) |
| container_0_xz | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_xz/project/reader-report.json) |
| container_0_zip_odd_path | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_zip_odd_path/project/reader-report.json) |
| container_0_png_text | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_png_text/project/reader-report.json) |
| container_0_png_compressed_text | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_png_compressed_text/project/reader-report.json) |
| container_0_pdf_plain_stream | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_pdf_plain_stream/project/reader-report.json) |
| container_0_pdf_flate_stream | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_0_pdf_flate_stream/project/reader-report.json) |
| text_1_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_base64/project/reader-report.json) |
| text_1_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_hex/project/reader-report.json) |
| text_1_three_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_three_base64/project/reader-report.json) |
| text_1_base32 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_base32/project/reader-report.json) |
| text_1_base85 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_base85/project/reader-report.json) |
| text_1_ascii85 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_ascii85/project/reader-report.json) |
| text_1_unpadded | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_unpadded/project/reader-report.json) |
| text_1_wrapped | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_wrapped/project/reader-report.json) |
| text_1_urlsafe | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_urlsafe/project/reader-report.json) |
| text_1_escaped_bytes | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_escaped_bytes/project/reader-report.json) |
| text_1_json_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_json_base64/project/reader-report.json) |
| text_1_html_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_html_base64/project/reader-report.json) |
| text_1_js_concat | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_js_concat/project/reader-report.json) |
| text_1_percent_bytes | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_percent_bytes/project/reader-report.json) |
| text_1_unicode_escapes | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_unicode_escapes/project/reader-report.json) |
| text_1_utf16le | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_utf16le/project/reader-report.json) |
| text_1_utf16be | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_utf16be/project/reader-report.json) |
| text_1_rot13 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_rot13/project/reader-report.json) |
| text_1_reverse | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_1_reverse/project/reader-report.json) |
| container_1_zip_plain | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_zip_plain/project/reader-report.json) |
| container_1_zip_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_zip_base64/project/reader-report.json) |
| container_1_zip_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_zip_hex/project/reader-report.json) |
| container_1_gzip_plain | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_gzip_plain/project/reader-report.json) |
| container_1_gzip_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_gzip_base64/project/reader-report.json) |
| container_1_base64_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_base64_zip/project/reader-report.json) |
| container_1_gzip_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_gzip_zip/project/reader-report.json) |
| container_1_zip_gzip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_zip_gzip/project/reader-report.json) |
| container_1_nested_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_nested_zip/project/reader-report.json) |
| container_1_tar_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_tar_base64/project/reader-report.json) |
| container_1_tar_gzip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_tar_gzip/project/reader-report.json) |
| container_1_bzip2 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_bzip2/project/reader-report.json) |
| container_1_xz | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_xz/project/reader-report.json) |
| container_1_zip_odd_path | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_zip_odd_path/project/reader-report.json) |
| container_1_png_text | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_png_text/project/reader-report.json) |
| container_1_png_compressed_text | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_png_compressed_text/project/reader-report.json) |
| container_1_pdf_plain_stream | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_pdf_plain_stream/project/reader-report.json) |
| container_1_pdf_flate_stream | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_1_pdf_flate_stream/project/reader-report.json) |
| text_2_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_base64/project/reader-report.json) |
| text_2_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_hex/project/reader-report.json) |
| text_2_three_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_three_base64/project/reader-report.json) |
| text_2_base32 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_base32/project/reader-report.json) |
| text_2_base85 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_base85/project/reader-report.json) |
| text_2_ascii85 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_ascii85/project/reader-report.json) |
| text_2_unpadded | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_unpadded/project/reader-report.json) |
| text_2_wrapped | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_wrapped/project/reader-report.json) |
| text_2_urlsafe | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_urlsafe/project/reader-report.json) |
| text_2_escaped_bytes | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_escaped_bytes/project/reader-report.json) |
| text_2_json_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_json_base64/project/reader-report.json) |
| text_2_html_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_html_base64/project/reader-report.json) |
| text_2_js_concat | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_js_concat/project/reader-report.json) |
| text_2_percent_bytes | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_percent_bytes/project/reader-report.json) |
| text_2_unicode_escapes | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_unicode_escapes/project/reader-report.json) |
| text_2_utf16le | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_utf16le/project/reader-report.json) |
| text_2_utf16be | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_utf16be/project/reader-report.json) |
| text_2_rot13 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_rot13/project/reader-report.json) |
| text_2_reverse | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/text_2_reverse/project/reader-report.json) |
| container_2_zip_plain | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_zip_plain/project/reader-report.json) |
| container_2_zip_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_zip_base64/project/reader-report.json) |
| container_2_zip_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_zip_hex/project/reader-report.json) |
| container_2_gzip_plain | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_gzip_plain/project/reader-report.json) |
| container_2_gzip_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_gzip_base64/project/reader-report.json) |
| container_2_base64_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_base64_zip/project/reader-report.json) |
| container_2_gzip_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_gzip_zip/project/reader-report.json) |
| container_2_zip_gzip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_zip_gzip/project/reader-report.json) |
| container_2_nested_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_nested_zip/project/reader-report.json) |
| container_2_tar_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_tar_base64/project/reader-report.json) |
| container_2_tar_gzip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_tar_gzip/project/reader-report.json) |
| container_2_bzip2 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_bzip2/project/reader-report.json) |
| container_2_xz | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_xz/project/reader-report.json) |
| container_2_zip_odd_path | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_zip_odd_path/project/reader-report.json) |
| container_2_png_text | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_png_text/project/reader-report.json) |
| container_2_png_compressed_text | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_png_compressed_text/project/reader-report.json) |
| container_2_pdf_plain_stream | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_pdf_plain_stream/project/reader-report.json) |
| container_2_pdf_flate_stream | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/container_2_pdf_flate_stream/project/reader-report.json) |
| hash_md5_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_md5_0/project/reader-report.json) |
| hash_md5_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_md5_1/project/reader-report.json) |
| hash_md5_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_md5_2/project/reader-report.json) |
| hash_wrapped_md5_b64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_md5_b64/project/reader-report.json) |
| hash_wrapped_md5_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_md5_hex/project/reader-report.json) |
| hash_wrapped_md5_utf16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_md5_utf16/project/reader-report.json) |
| hash_sha1_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha1_0/project/reader-report.json) |
| hash_sha1_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha1_1/project/reader-report.json) |
| hash_sha1_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha1_2/project/reader-report.json) |
| hash_wrapped_sha1_b64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha1_b64/project/reader-report.json) |
| hash_wrapped_sha1_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha1_hex/project/reader-report.json) |
| hash_wrapped_sha1_utf16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha1_utf16/project/reader-report.json) |
| hash_sha256_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha256_0/project/reader-report.json) |
| hash_sha256_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha256_1/project/reader-report.json) |
| hash_sha256_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha256_2/project/reader-report.json) |
| hash_wrapped_sha256_b64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha256_b64/project/reader-report.json) |
| hash_wrapped_sha256_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha256_hex/project/reader-report.json) |
| hash_wrapped_sha256_utf16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha256_utf16/project/reader-report.json) |
| hash_sha512_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha512_0/project/reader-report.json) |
| hash_sha512_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha512_1/project/reader-report.json) |
| hash_sha512_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha512_2/project/reader-report.json) |
| hash_wrapped_sha512_b64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512_b64/project/reader-report.json) |
| hash_wrapped_sha512_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512_hex/project/reader-report.json) |
| hash_wrapped_sha512_utf16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512_utf16/project/reader-report.json) |
| hash_ntlm_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_ntlm_0/project/reader-report.json) |
| hash_ntlm_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_ntlm_1/project/reader-report.json) |
| hash_ntlm_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_ntlm_2/project/reader-report.json) |
| hash_wrapped_ntlm_b64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_ntlm_b64/project/reader-report.json) |
| hash_wrapped_ntlm_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_ntlm_hex/project/reader-report.json) |
| hash_wrapped_ntlm_utf16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_ntlm_utf16/project/reader-report.json) |
| hash_bcrypt_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_bcrypt_0/project/reader-report.json) |
| hash_bcrypt_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_bcrypt_1/project/reader-report.json) |
| hash_bcrypt_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_bcrypt_2/project/reader-report.json) |
| hash_wrapped_bcrypt_b64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_bcrypt_b64/project/reader-report.json) |
| hash_wrapped_bcrypt_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_bcrypt_hex/project/reader-report.json) |
| hash_wrapped_bcrypt_utf16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_bcrypt_utf16/project/reader-report.json) |
| hash_sha512crypt_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha512crypt_0/project/reader-report.json) |
| hash_sha512crypt_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha512crypt_1/project/reader-report.json) |
| hash_sha512crypt_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_sha512crypt_2/project/reader-report.json) |
| hash_wrapped_sha512crypt_b64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512crypt_b64/project/reader-report.json) |
| hash_wrapped_sha512crypt_hex | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512crypt_hex/project/reader-report.json) |
| hash_wrapped_sha512crypt_utf16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512crypt_utf16/project/reader-report.json) |
| upstream_john_md5_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/upstream_john_md5_0/project/reader-report.json) |
| upstream_john_md5_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/upstream_john_md5_1/project/reader-report.json) |
| upstream_john_md5_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/upstream_john_md5_2/project/reader-report.json) |
| password_shape_empty | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/password_shape_empty/project/reader-report.json) |
| password_shape_unicode | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/password_shape_unicode/project/reader-report.json) |
| password_shape_colon | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/password_shape_colon/project/reader-report.json) |
| password_shape_spaces | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/password_shape_spaces/project/reader-report.json) |
| password_shape_long | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/password_shape_long/project/reader-report.json) |
| password_not_in_plan | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/password_not_in_plan/project/reader-report.json) |
| unsupported_sha224 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/unsupported_sha224/project/reader-report.json) |
| unsupported_sha384 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/unsupported_sha384/project/reader-report.json) |
| unsupported_structured_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_0/project/reader-report.json) |
| unsupported_structured_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_1/project/reader-report.json) |
| unsupported_structured_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_2/project/reader-report.json) |
| unsupported_structured_3 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_3/project/reader-report.json) |
| review_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/review_0/project/reader-report.json) |
| review_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/review_1/project/reader-report.json) |
| review_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/review_2/project/reader-report.json) |
| review_3 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/review_3/project/reader-report.json) |
| review_4 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/review_4/project/reader-report.json) |
| review_5 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/review_5/project/reader-report.json) |
| context_gap_0 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/context_gap_0/project/reader-report.json) |
| context_gap_1 | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/context_gap_1/project/reader-report.json) |
| context_gap_2 | noise | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/context_gap_2/project/reader-report.json) |
| context_gap_3 | noise | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/context_gap_3/project/reader-report.json) |
| malformed_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_0/project/reader-report.json) |
| malformed_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_1/project/reader-report.json) |
| malformed_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_2/project/reader-report.json) |
| malformed_3 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_3/project/reader-report.json) |
| malformed_4 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_4/project/reader-report.json) |
| malformed_5 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_5/project/reader-report.json) |
| malformed_6 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_6/project/reader-report.json) |
| malformed_7 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/malformed_7/project/reader-report.json) |
| negative_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_0/project/reader-report.json) |
| negative_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_1/project/reader-report.json) |
| negative_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_2/project/reader-report.json) |
| negative_3 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_3/project/reader-report.json) |
| negative_4 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_4/project/reader-report.json) |
| negative_5 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_5/project/reader-report.json) |
| negative_6 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_6/project/reader-report.json) |
| negative_7 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_7/project/reader-report.json) |
| negative_8 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_8/project/reader-report.json) |
| negative_9 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_9/project/reader-report.json) |
| negative_10 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_10/project/reader-report.json) |
| negative_11 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_11/project/reader-report.json) |
| negative_12 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_12/project/reader-report.json) |
| negative_13 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_13/project/reader-report.json) |
| negative_14 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_14/project/reader-report.json) |
| negative_15 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_15/project/reader-report.json) |
| negative_16 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_16/project/reader-report.json) |
| negative_17 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_17/project/reader-report.json) |
| negative_18 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/negative_18/project/reader-report.json) |
| size_limit | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/size_limit/project/reader-report.json) |
| depth_limit | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/depth_limit/project/reader-report.json) |
| archive_member_limit | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/archive_member_limit/project/reader-report.json) |
| gzip_expansion_limit | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/gzip_expansion_limit/project/reader-report.json) |
| encrypted_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/encrypted_zip/project/reader-report.json) |
| base64_encrypted_zip | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/base64_encrypted_zip/project/reader-report.json) |
| encrypted_ssh_key | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/encrypted_ssh_key/project/reader-report.json) |
| sqlite_embedded_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/sqlite_embedded_base64/project/reader-report.json) |
| recovered_password_is_base64 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/recovered_password_is_base64/project/reader-report.json) |
| public_0 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_0/project/reader-report.json) |
| public_augmented_0 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_0/project/reader-report.json) |
| public_1 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_1/project/reader-report.json) |
| public_augmented_1 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_1/project/reader-report.json) |
| public_2 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_2/project/reader-report.json) |
| public_augmented_2 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_2/project/reader-report.json) |
| public_3 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_3/project/reader-report.json) |
| public_augmented_3 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_3/project/reader-report.json) |
| public_4 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_4/project/reader-report.json) |
| public_5 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_5/project/reader-report.json) |
| public_6 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_6/project/reader-report.json) |
| public_augmented_6 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_6/project/reader-report.json) |
| public_7 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_7/project/reader-report.json) |
| public_augmented_7 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_7/project/reader-report.json) |
| public_8 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_8/project/reader-report.json) |
| public_augmented_8 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_8/project/reader-report.json) |
| public_9 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_9/project/reader-report.json) |
| public_augmented_9 | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_augmented_9/project/reader-report.json) |
| public_10 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_10/project/reader-report.json) |
| public_11 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_11/project/reader-report.json) |
| public_12 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_12/project/reader-report.json) |
| public_13 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_13/project/reader-report.json) |
| public_14 | observation | observation | [report](../../evaluation/runs/2026-10-31-fixed-collection/public_14/project/reader-report.json) |
| volume_16384_head | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_16384_head/project/reader-report.json) |
| volume_16384_tail | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_16384_tail/project/reader-report.json) |
| volume_16384_negative | inconclusive | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_16384_negative/project/reader-report.json) |
| volume_131072_head | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_131072_head/project/reader-report.json) |
| volume_131072_tail | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_131072_tail/project/reader-report.json) |
| volume_131072_negative | inconclusive | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_131072_negative/project/reader-report.json) |
| volume_1048576_head | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_1048576_head/project/reader-report.json) |
| volume_1048576_tail | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_1048576_tail/project/reader-report.json) |
| volume_1048576_negative | inconclusive | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_1048576_negative/project/reader-report.json) |
| volume_1900000_head | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_1900000_head/project/reader-report.json) |
| volume_1900000_tail | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_1900000_tail/project/reader-report.json) |
| volume_1900000_negative | inconclusive | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_1900000_negative/project/reader-report.json) |
| volume_json_tail | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_json_tail/project/reader-report.json) |
| volume_json_negative | inconclusive | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_json_negative/project/reader-report.json) |
| volume_ini_tail | miss | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_ini_tail/project/reader-report.json) |
| volume_ini_negative | inconclusive | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_ini_negative/project/reader-report.json) |
| volume_csv_tail | pass | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_csv_tail/project/reader-report.json) |
| volume_csv_negative | inconclusive | pass | [report](../../evaluation/runs/2026-10-31-fixed-volume/volume_csv_negative/project/reader-report.json) |

## Evidence

- [Machine-readable comparison](comparison.json)
- [Full rerun metadata](rerun-summary.json)
- [New regression tests](regressions.log)
- [Shared baseline](shared-baseline.log)
- [Cipher baseline](cipher-baseline.log)
- [Hash baseline](hash-baseline.log)
- [Original collection report](../../evaluation/runs/RESULTS.md)
- [Saved active-reader launch and restoration record](active-reader.json)
