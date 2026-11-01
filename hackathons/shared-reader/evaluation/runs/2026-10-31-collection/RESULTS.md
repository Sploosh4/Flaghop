# Larger offline reader evaluation

**Scope:** Static local files only. No CTF platform, challenge instance, vulnerable machine, network target or authentication attempt was set up or used. Public downloads were upstream regression data, not CTF challenges.

Evaluated **237 files**: 222 with a stated oracle and 15 unchanged public samples without assumed hidden-content ground truth.

Overall goal outcomes: **{'pass': 182, 'miss': 38, 'noise': 2, 'observation': 15}**. These categories test different things and must not be combined into a general accuracy percentage.

## Exact end-result recovery

The 176 text/password cases require exact known bytes. Results: {'pass': 140, 'miss': 36}.
Cases classified as existing supported workflows: {'pass': 119}. Broader desired coverage: {'miss': 36, 'pass': 21}.

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
- Files with a Ciphey error/panic warning on at least one artifact: 24; files with a Ciphey timeout warning: 1.
- Files with partial/error hash scans: 1. Files where at least one such scan has a combined parent marked done: 1.
- Negative controls: {'pass': 19}. Accepted checker candidates occurred in 0 of these 19 files.
- Unlabelled public files producing checker-accepted candidates: 0/15. They are observations requiring review, not scored true or false positives.
- Text/password goal files producing additional unexpected checker text: 22. The expected result may still have been recovered correctly.
- Production reader code unchanged during the run: True. Live watcher lifecycle: {'service': 'hackathon-readers.service', 'initially_active': True, 'paused_for_evaluation': True, 'restored': True}.

## Unmet or inconclusive goals

| Case | Goal | Outcome | Native evidence |
|---|---|---|---|
| text_0_base32 | plaintext | miss | [report](text_0_base32/project/reader-report.json) |
| text_0_base85 | plaintext | miss | [report](text_0_base85/project/reader-report.json) |
| text_0_ascii85 | plaintext | miss | [report](text_0_ascii85/project/reader-report.json) |
| text_0_js_concat | plaintext | miss | [report](text_0_js_concat/project/reader-report.json) |
| text_0_percent_bytes | plaintext | miss | [report](text_0_percent_bytes/project/reader-report.json) |
| text_0_unicode_escapes | plaintext | miss | [report](text_0_unicode_escapes/project/reader-report.json) |
| text_0_rot13 | plaintext | miss | [report](text_0_rot13/project/reader-report.json) |
| text_0_reverse | plaintext | miss | [report](text_0_reverse/project/reader-report.json) |
| container_0_bzip2 | plaintext | miss | [report](container_0_bzip2/project/reader-report.json) |
| container_0_png_compressed_text | plaintext | miss | [report](container_0_png_compressed_text/project/reader-report.json) |
| container_0_pdf_flate_stream | plaintext | miss | [report](container_0_pdf_flate_stream/project/reader-report.json) |
| text_1_base32 | plaintext | miss | [report](text_1_base32/project/reader-report.json) |
| text_1_base85 | plaintext | miss | [report](text_1_base85/project/reader-report.json) |
| text_1_ascii85 | plaintext | miss | [report](text_1_ascii85/project/reader-report.json) |
| text_1_js_concat | plaintext | miss | [report](text_1_js_concat/project/reader-report.json) |
| text_1_percent_bytes | plaintext | miss | [report](text_1_percent_bytes/project/reader-report.json) |
| text_1_unicode_escapes | plaintext | miss | [report](text_1_unicode_escapes/project/reader-report.json) |
| text_1_rot13 | plaintext | miss | [report](text_1_rot13/project/reader-report.json) |
| text_1_reverse | plaintext | miss | [report](text_1_reverse/project/reader-report.json) |
| container_1_bzip2 | plaintext | miss | [report](container_1_bzip2/project/reader-report.json) |
| container_1_xz | plaintext | miss | [report](container_1_xz/project/reader-report.json) |
| container_1_png_compressed_text | plaintext | miss | [report](container_1_png_compressed_text/project/reader-report.json) |
| container_1_pdf_flate_stream | plaintext | miss | [report](container_1_pdf_flate_stream/project/reader-report.json) |
| text_2_base32 | plaintext | miss | [report](text_2_base32/project/reader-report.json) |
| text_2_base85 | plaintext | miss | [report](text_2_base85/project/reader-report.json) |
| text_2_ascii85 | plaintext | miss | [report](text_2_ascii85/project/reader-report.json) |
| text_2_js_concat | plaintext | miss | [report](text_2_js_concat/project/reader-report.json) |
| text_2_percent_bytes | plaintext | miss | [report](text_2_percent_bytes/project/reader-report.json) |
| text_2_unicode_escapes | plaintext | miss | [report](text_2_unicode_escapes/project/reader-report.json) |
| text_2_rot13 | plaintext | miss | [report](text_2_rot13/project/reader-report.json) |
| text_2_reverse | plaintext | miss | [report](text_2_reverse/project/reader-report.json) |
| container_2_bzip2 | plaintext | miss | [report](container_2_bzip2/project/reader-report.json) |
| container_2_png_compressed_text | plaintext | miss | [report](container_2_png_compressed_text/project/reader-report.json) |
| container_2_pdf_flate_stream | plaintext | miss | [report](container_2_pdf_flate_stream/project/reader-report.json) |
| unsupported_sha224 | hash_detected | miss | [report](unsupported_sha224/project/reader-report.json) |
| unsupported_sha384 | hash_detected | miss | [report](unsupported_sha384/project/reader-report.json) |
| context_gap_0 | password | miss | [report](context_gap_0/project/reader-report.json) |
| context_gap_1 | password | miss | [report](context_gap_1/project/reader-report.json) |
| context_gap_2 | no_autocrack | noise | [report](context_gap_2/project/reader-report.json) |
| context_gap_3 | no_autocrack | noise | [report](context_gap_3/project/reader-report.json) |

## Method and limits

- Each case has its own fresh project, graph, native job folders and pot files. Cross-case recovery caches cannot satisfy an oracle.
- Default production depth, node, file-size, expansion, member, decoder and hash-slice limits are unchanged. Per-case evaluation limits are 20 seconds (15 for unlabelled files), checked between bounded units, and 160 coordinator turns; a separate 45-second process-tree guard handles stuck workers.
- A miss means this run reached queue idle without the expected goal; inspect diagnostics to distinguish routing gaps, unsupported formats and explicit reader failures. Inconclusive means the evaluator budget expired without a decisive result.
- ZIP member paths are never extracted to their named filesystem paths. Key material is a disposable local data fixture and was never used for authentication.
- TAR/XZ or other container passes can be incidental byte-pattern recovery. A pass does not establish structural support for that format.
- The size/expansion tests check deliberate limits. A file larger than 2 MB is explicitly skipped; this is not coverage of larger files.
- No reader fixes were applied while measuring. Parser crashes inside bounded subprocesses are preserved even when another branch reaches the expected answer.
- This is a diverse test collection, not a representative random sample of all CTF files, a security verdict, or proof that arbitrary modern encryption can be decoded.

## Evidence and sources

- [Full case matrix](report.md)
- [Raw results](summary.json)
- [Aggregated results](analysis.json)
- [Frozen evaluation design](evaluation-design.json)
- [Watcher pause/restore record](service-lifecycle.json)
- [Corpus manifest](../../manifest.json)
- [Public download provenance, commits, hashes and acquisition failures](../../public-manifest.json)
- Public fixtures: CPython archive tests, Pillow image tests and qpdf PDF tests; source licences are retained beside downloaded files.
- Three external MD5 known-answer vectors come from the pinned installed John Jumbo rawMD5 test source.
