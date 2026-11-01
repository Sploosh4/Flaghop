# Larger offline reader evaluation

**Scope:** Static local files only. No CTF platform, challenge instance, vulnerable machine, network target or authentication attempt was set up or used. Public downloads were upstream regression data, not CTF challenges.

Evaluated **255 files**: 240 with a stated oracle and 15 unchanged public samples without assumed hidden-content ground truth.

Overall goal outcomes: **{'pass': 187, 'miss': 44, 'noise': 2, 'observation': 15, 'inconclusive': 7}**. These categories test different things and must not be combined into a general accuracy percentage.

## Main findings and next fixes

The loop handles the tested simple supported routes, but it is not ready to be treated as an exhaustive scanner of ordinary project output files.

1. **Repeated candidates hide later payloads.** Four payloads at the beginning of logs (16 KB to 1.9 MB) were recovered. Six of seven end-of-file payloads across logs/JSON/INI/CSV were missed; CSV was the exception. In the 16 KB tail case, all 64 extracted candidates decoded to the same value, the last examined location was byte 7,081, and the real payload was near the end. The same cutoff occurred in a 1.9 MB file. Both the normalization pass and base64dump bridge limit occurrences before considering later useful unique values. Continuous rescanning deduplicates that file version, so it does not advance past the cutoff. **First fix:** budget distinct candidate values separately from source locations, preserve bounded occurrence evidence, and support continuation through a file. [Native proof](../../../../../../hackathons/shared-reader/evaluation/runs/candidate-starvation-proof.json).

2. **Incomplete coverage must remain visible.** All seven larger payload-free controls hit the candidate cap and are inconclusive, even though their queues reached idle. One malformed SSH fixture produced a failing `ssh2john` report while its combined parent was marked `done`. The combined status should include every reader's failure/limit state. The underlying errors are retained, but users should not have to inspect a child report to discover them.

3. **Several decoding routes are absent.** All three message variants were missed for Base32, Base85, Ascii85, concatenated JavaScript strings, percent-byte escapes, ordinary Unicode escapes, raw ROT13 and reversed text. These are routing/normalization gaps in the tested wrapper path, not proof that every upstream decoder lacks those algorithms.

4. **Compressed document fields need proper extractors.** Bzip2 failed all three fixtures; compressed PNG text and PDF Flate streams each failed all three. XZ worked in two of three only because an embedded Base64 sequence was still visible as literal bytes. TAR also exposed literal bytes successfully. Those passes do not establish XZ/TAR parsing support.

5. **Hash discovery/context needs expansion.** SHA-224 and SHA-384 were not discovered. A JSON sibling algorithm field and a pwdump-like NTLM row remained unresolved. Two checksums embedded in plain-text/log contexts were automatically cracked even though the test expected review; valid nested JSON checksum records were handled conservatively. Improve record parsing and context before adding more automatic recovery modes.

6. **Ciphey output still requires validation.** Actual worker panics occurred in 28 files, across 32 attempts; the shared evaluator itself survived all of them. Twenty files produced checker-accepted control-character strings, and some other outputs were valid partial fragments rather than the full intended message. Correct bytes were often recovered through another branch. Keep accepted text unverified and record which validation gate it satisfied. [Panic evidence](../../../../../../hackathons/shared-reader/evaluation/runs/panic-evidence.json), [control-character examples](../../../../../../hackathons/shared-reader/evaluation/runs/control-character-findings.json).

## What worked

- All **123** cases preclassified as existing supported text/password recovery paths reached their exact known answer. Across broader text/password probes the result was **145/187**, with **42** misses. Separately, two additional hash-discovery probes missed their goal; this explains the **44** total misses in the overall matrix.
- All 21 direct hash cases, all 22 hash-chain cases, the three external MD5 vectors and the five in-plan password-shape cases succeeded. A separate out-of-plan password correctly exhausted the finite plan without claiming recovery.
- ZIP/gzip nesting, encoded protected ZIPs, actual password-protected ZIP members, an offline encrypted SSH-key fixture, UTF-16 wrappers, and an embedded SQLite byte sequence worked in these examples.
- All eight appended-payload public-file variants were recovered. The unmodified upstream samples were scored only as observations. John reported an empty matching password for two encrypted-PDF fixtures; those are not counted as scored public-file recovery successes, and no claim about an unknown historical password is made.
- Nineteen small ordinary negative controls produced no checker-accepted text and no automatic cracking. The seven larger controls remain inconclusive because coverage was partial.
- There were no evaluator-worker failures, no external guard timeouts and no source/artifact integrity failures. All queues reached idle, which is explicitly distinguished from complete file coverage. Reader production code was unchanged in both runs. The existing live watcher was restored after each run.

## Exact end-result recovery

The 187 text/password cases require exact known bytes. Results: {'pass': 145, 'miss': 42}.
Cases classified as existing supported workflows: {'pass': 123}. Broader desired coverage: {'miss': 42, 'pass': 22}.

The evaluator supplies no plaintext regex. Hash workers receive a small, disclosed audit seed list plus their normal quick candidates. Password recovery results measure the pipeline with candidates in that finite plan; they do not measure resistance to arbitrary passwords. A separate out-of-plan password case checks that exhaustion is not called recovery.

## Breakdown

| File group | Outcomes |
|---|---|
| ambiguity | {'pass': 6} |
| containers | {'pass': 44, 'miss': 10} |
| context | {'miss': 2, 'noise': 2} |
| documents | {'pass': 1} |
| hash_chains | {'pass': 22} |
| hash_recovery | {'pass': 21} |
| larger_logs | {'pass': 5, 'miss': 6} |
| larger_negative_controls | {'inconclusive': 7} |
| limits | {'pass': 4} |
| malformed | {'pass': 8} |
| negative_controls | {'pass': 19} |
| password_edges | {'pass': 6} |
| protected_files | {'pass': 3} |
| public_augmented | {'pass': 8} |
| public_unfamiliar | {'observation': 15} |
| text | {'pass': 33, 'miss': 24} |
| unsupported_hash | {'miss': 2, 'pass': 4} |
| upstream_vectors | {'pass': 3} |

## Completion and error signals

- Cases with work remaining at their evaluation deadline: 0. A passed goal does not imply all incidental work completed.
- Worker crashes/external guard timeouts/integrity failures: 0.
- Original-input integrity failures: 0; immutable-artifact integrity failures: 0.
- Files with a Ciphey error/panic warning on at least one artifact: 28; files with a Ciphey timeout warning: 1.
- Files with partial/error hash scans: 1. Files where at least one such scan has a combined parent marked done: 1.
- Negative controls: {'pass': 19, 'inconclusive': 7}. Accepted checker candidates occurred in 0 of these 26 files.
- Unlabelled public files producing checker-accepted candidates: 0/15. They are observations requiring review, not scored true or false positives.
- Text/password goal files producing additional unexpected checker text: 22. The expected result may still have been recovered correctly.
- Production reader code unchanged during the run: True. Live watcher lifecycle: {'service': 'hackathon-readers.service', 'initially_active': True, 'restored': True, 'parts': [{'service': 'hackathon-readers.service', 'initially_active': True, 'paused_for_evaluation': True, 'restored': True}, {'service': 'hackathon-readers.service', 'initially_active': True, 'paused_for_evaluation': True, 'restored': True}]}.

## Unmet or inconclusive goals

| Case | Goal | Outcome | Native evidence |
|---|---|---|---|
| text_0_base32 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_base32/project/reader-report.json) |
| text_0_base85 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_base85/project/reader-report.json) |
| text_0_ascii85 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_ascii85/project/reader-report.json) |
| text_0_js_concat | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_js_concat/project/reader-report.json) |
| text_0_percent_bytes | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_percent_bytes/project/reader-report.json) |
| text_0_unicode_escapes | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_unicode_escapes/project/reader-report.json) |
| text_0_rot13 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_rot13/project/reader-report.json) |
| text_0_reverse | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_reverse/project/reader-report.json) |
| container_0_bzip2 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_bzip2/project/reader-report.json) |
| container_0_png_compressed_text | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_png_compressed_text/project/reader-report.json) |
| container_0_pdf_flate_stream | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_pdf_flate_stream/project/reader-report.json) |
| text_1_base32 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_base32/project/reader-report.json) |
| text_1_base85 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_base85/project/reader-report.json) |
| text_1_ascii85 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_ascii85/project/reader-report.json) |
| text_1_js_concat | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_js_concat/project/reader-report.json) |
| text_1_percent_bytes | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_percent_bytes/project/reader-report.json) |
| text_1_unicode_escapes | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_unicode_escapes/project/reader-report.json) |
| text_1_rot13 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_rot13/project/reader-report.json) |
| text_1_reverse | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_reverse/project/reader-report.json) |
| container_1_bzip2 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_bzip2/project/reader-report.json) |
| container_1_xz | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_xz/project/reader-report.json) |
| container_1_png_compressed_text | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_png_compressed_text/project/reader-report.json) |
| container_1_pdf_flate_stream | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_pdf_flate_stream/project/reader-report.json) |
| text_2_base32 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_base32/project/reader-report.json) |
| text_2_base85 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_base85/project/reader-report.json) |
| text_2_ascii85 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_ascii85/project/reader-report.json) |
| text_2_js_concat | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_js_concat/project/reader-report.json) |
| text_2_percent_bytes | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_percent_bytes/project/reader-report.json) |
| text_2_unicode_escapes | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_unicode_escapes/project/reader-report.json) |
| text_2_rot13 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_rot13/project/reader-report.json) |
| text_2_reverse | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_reverse/project/reader-report.json) |
| container_2_bzip2 | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_bzip2/project/reader-report.json) |
| container_2_png_compressed_text | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_png_compressed_text/project/reader-report.json) |
| container_2_pdf_flate_stream | plaintext | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_pdf_flate_stream/project/reader-report.json) |
| unsupported_sha224 | hash_detected | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_sha224/project/reader-report.json) |
| unsupported_sha384 | hash_detected | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_sha384/project/reader-report.json) |
| context_gap_0 | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_0/project/reader-report.json) |
| context_gap_1 | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_1/project/reader-report.json) |
| context_gap_2 | no_autocrack | noise | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_2/project/reader-report.json) |
| context_gap_3 | no_autocrack | noise | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_3/project/reader-report.json) |
| volume_16384_tail | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_16384_tail/project/reader-report.json) |
| volume_16384_negative | quiet | inconclusive | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_16384_negative/project/reader-report.json) |
| volume_131072_tail | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_131072_tail/project/reader-report.json) |
| volume_131072_negative | quiet | inconclusive | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_131072_negative/project/reader-report.json) |
| volume_1048576_tail | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_1048576_tail/project/reader-report.json) |
| volume_1048576_negative | quiet | inconclusive | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_1048576_negative/project/reader-report.json) |
| volume_1900000_tail | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_1900000_tail/project/reader-report.json) |
| volume_1900000_negative | quiet | inconclusive | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_1900000_negative/project/reader-report.json) |
| volume_json_tail | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_json_tail/project/reader-report.json) |
| volume_json_negative | quiet | inconclusive | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_json_negative/project/reader-report.json) |
| volume_ini_tail | password | miss | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_ini_tail/project/reader-report.json) |
| volume_ini_negative | quiet | inconclusive | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_ini_negative/project/reader-report.json) |
| volume_csv_negative | quiet | inconclusive | [report](../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-volume/volume_csv_negative/project/reader-report.json) |

## Method and limits

- Each case has its own fresh project, graph, native job folders and pot files. Cross-case recovery caches cannot satisfy an oracle.
- Default production depth, node, file-size, expansion, member, decoder and hash-slice limits are unchanged. Per-case evaluation limits are 20 seconds (15 for unlabelled files), checked between bounded units, and 160 coordinator turns; a separate 45-second process-tree guard handles stuck workers.
- A miss means this run reached queue idle without the expected goal; inspect diagnostics to distinguish routing gaps, unsupported formats and explicit reader failures. Inconclusive means the evaluator lacks a sound conclusion because of its own budget or incomplete/error reader coverage. An idle queue can still contain partial scans.
- ZIP member paths are never extracted to their named filesystem paths. Key material is a disposable local data fixture and was never used for authentication.
- TAR/XZ or other container passes can be incidental byte-pattern recovery. A pass does not establish structural support for that format.
- The size/expansion tests check deliberate limits. A file larger than 2 MB is explicitly skipped; this is not coverage of larger files.
- No reader fixes were applied while measuring. Parser crashes inside bounded subprocesses are preserved even when another branch reaches the expected answer.
- This is a diverse test collection, not a representative random sample of all CTF files, a security verdict, or proof that arbitrary modern encryption can be decoded.

## Evidence and sources

- [Full case matrix](../../../../../../hackathons/shared-reader/evaluation/runs/report.md)
- [Raw results](../../../../../../hackathons/shared-reader/evaluation/runs/summary.json)
- [Aggregated results](../../../../../../hackathons/shared-reader/evaluation/runs/analysis.json)
- [Frozen evaluation design](../../../../../../hackathons/shared-reader/evaluation/runs/evaluation-design.json)
- [Watcher pause/restore record](../../../../../../hackathons/shared-reader/evaluation/runs/service-lifecycle.json)
- [Corpus manifest](../../../../../../hackathons/shared-reader/evaluation/manifest.json)
- [Volume-probe manifest](../../../../../../hackathons/shared-reader/evaluation/volume-manifest.json)
- [Public download provenance, commits, hashes and acquisition failures](../../../../../../hackathons/shared-reader/evaluation/public-manifest.json)
- Public fixtures: CPython archive tests, Pillow image tests and qpdf PDF tests; source licences are retained beside downloaded files.
- Three external MD5 known-answer vectors come from the pinned installed John Jumbo rawMD5 test source.
