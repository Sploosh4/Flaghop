# Offline reader collection evaluation

Started: 2026-10-31T05:30:06.298143+00:00

**No CTF was joined, deployed or interacted with.** These are offline data files only. Public files came from upstream regression suites, not challenge platforms.

Known-answer fixtures use default production reader limits and the measured engine profile. No answer regex is supplied. Password tests use a small, explicit audit seed list plus the normal quick list; this measures workflow correctness, not password strength. Per-case evaluation budgets are 20 seconds (15 for unlabelled files), checked between bounded work units, with a 45-second external worker guard. A goal can pass while other incidental work remains pending.

Results so far: {"miss": 38, "noise": 2, "observation": 15, "pass": 182}

| Group | Outcomes |
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

| Case | Goal | Outcome | Drained | Seconds | Evidence |
|---|---|---|---|---:|---|
| text_0_base64 | plaintext | pass | True | 0.562 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_base64/project/reader-report.json) |
| text_0_hex | plaintext | pass | True | 0.623 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_hex/project/reader-report.json) |
| text_0_three_base64 | plaintext | pass | True | 0.847 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_three_base64/project/reader-report.json) |
| text_0_base32 | plaintext | miss | True | 0.263 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_base32/project/reader-report.json) |
| text_0_base85 | plaintext | miss | True | 0.274 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_base85/project/reader-report.json) |
| text_0_ascii85 | plaintext | miss | True | 0.255 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_ascii85/project/reader-report.json) |
| text_0_unpadded | plaintext | pass | True | 0.405 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_unpadded/project/reader-report.json) |
| text_0_wrapped | plaintext | pass | True | 0.902 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_wrapped/project/reader-report.json) |
| text_0_urlsafe | plaintext | pass | True | 0.388 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_urlsafe/project/reader-report.json) |
| text_0_escaped_bytes | plaintext | pass | True | 0.462 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_escaped_bytes/project/reader-report.json) |
| text_0_json_base64 | plaintext | pass | True | 0.446 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_json_base64/project/reader-report.json) |
| text_0_html_base64 | plaintext | pass | True | 0.539 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_html_base64/project/reader-report.json) |
| text_0_js_concat | plaintext | miss | True | 0.796 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_js_concat/project/reader-report.json) |
| text_0_percent_bytes | plaintext | miss | True | 0.286 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_percent_bytes/project/reader-report.json) |
| text_0_unicode_escapes | plaintext | miss | True | 0.345 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_unicode_escapes/project/reader-report.json) |
| text_0_utf16le | plaintext | pass | True | 0.583 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_utf16le/project/reader-report.json) |
| text_0_utf16be | plaintext | pass | True | 0.579 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_utf16be/project/reader-report.json) |
| text_0_rot13 | plaintext | miss | True | 0.264 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_rot13/project/reader-report.json) |
| text_0_reverse | plaintext | miss | True | 0.291 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_0_reverse/project/reader-report.json) |
| container_0_zip_plain | plaintext | pass | True | 0.411 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_zip_plain/project/reader-report.json) |
| container_0_zip_base64 | plaintext | pass | True | 0.602 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_zip_base64/project/reader-report.json) |
| container_0_zip_hex | plaintext | pass | True | 0.656 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_zip_hex/project/reader-report.json) |
| container_0_gzip_plain | plaintext | pass | True | 0.349 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_gzip_plain/project/reader-report.json) |
| container_0_gzip_base64 | plaintext | pass | True | 0.548 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_gzip_base64/project/reader-report.json) |
| container_0_base64_zip | plaintext | pass | True | 0.828 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_base64_zip/project/reader-report.json) |
| container_0_gzip_zip | plaintext | pass | True | 0.724 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_gzip_zip/project/reader-report.json) |
| container_0_zip_gzip | plaintext | pass | True | 0.748 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_zip_gzip/project/reader-report.json) |
| container_0_nested_zip | plaintext | pass | True | 0.778 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_nested_zip/project/reader-report.json) |
| container_0_tar_base64 | plaintext | pass | True | 0.491 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_tar_base64/project/reader-report.json) |
| container_0_tar_gzip | plaintext | pass | True | 0.589 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_tar_gzip/project/reader-report.json) |
| container_0_bzip2 | plaintext | miss | True | 0.32 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_bzip2/project/reader-report.json) |
| container_0_xz | plaintext | pass | True | 0.53 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_xz/project/reader-report.json) |
| container_0_zip_odd_path | plaintext | pass | True | 0.685 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_zip_odd_path/project/reader-report.json) |
| container_0_png_text | plaintext | pass | True | 0.595 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_png_text/project/reader-report.json) |
| container_0_png_compressed_text | plaintext | miss | True | 0.368 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_png_compressed_text/project/reader-report.json) |
| container_0_pdf_plain_stream | plaintext | pass | True | 0.683 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_pdf_plain_stream/project/reader-report.json) |
| container_0_pdf_flate_stream | plaintext | miss | True | 0.525 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_0_pdf_flate_stream/project/reader-report.json) |
| text_1_base64 | plaintext | pass | True | 0.543 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_base64/project/reader-report.json) |
| text_1_hex | plaintext | pass | True | 0.638 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_hex/project/reader-report.json) |
| text_1_three_base64 | plaintext | pass | True | 0.986 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_three_base64/project/reader-report.json) |
| text_1_base32 | plaintext | miss | True | 0.45 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_base32/project/reader-report.json) |
| text_1_base85 | plaintext | miss | True | 0.37 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_base85/project/reader-report.json) |
| text_1_ascii85 | plaintext | miss | True | 0.333 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_ascii85/project/reader-report.json) |
| text_1_unpadded | plaintext | pass | True | 0.528 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_unpadded/project/reader-report.json) |
| text_1_wrapped | plaintext | pass | True | 1.289 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_wrapped/project/reader-report.json) |
| text_1_urlsafe | plaintext | pass | True | 0.415 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_urlsafe/project/reader-report.json) |
| text_1_escaped_bytes | plaintext | pass | True | 0.472 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_escaped_bytes/project/reader-report.json) |
| text_1_json_base64 | plaintext | pass | True | 0.462 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_json_base64/project/reader-report.json) |
| text_1_html_base64 | plaintext | pass | True | 0.459 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_html_base64/project/reader-report.json) |
| text_1_js_concat | plaintext | miss | True | 0.773 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_js_concat/project/reader-report.json) |
| text_1_percent_bytes | plaintext | miss | True | 0.457 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_percent_bytes/project/reader-report.json) |
| text_1_unicode_escapes | plaintext | miss | True | 0.568 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_unicode_escapes/project/reader-report.json) |
| text_1_utf16le | plaintext | pass | True | 0.855 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_utf16le/project/reader-report.json) |
| text_1_utf16be | plaintext | pass | True | 0.657 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_utf16be/project/reader-report.json) |
| text_1_rot13 | plaintext | miss | True | 0.376 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_rot13/project/reader-report.json) |
| text_1_reverse | plaintext | miss | True | 0.4 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_1_reverse/project/reader-report.json) |
| container_1_zip_plain | plaintext | pass | True | 0.422 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_zip_plain/project/reader-report.json) |
| container_1_zip_base64 | plaintext | pass | True | 0.537 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_zip_base64/project/reader-report.json) |
| container_1_zip_hex | plaintext | pass | True | 0.798 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_zip_hex/project/reader-report.json) |
| container_1_gzip_plain | plaintext | pass | True | 0.415 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_gzip_plain/project/reader-report.json) |
| container_1_gzip_base64 | plaintext | pass | True | 0.655 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_gzip_base64/project/reader-report.json) |
| container_1_base64_zip | plaintext | pass | True | 0.718 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_base64_zip/project/reader-report.json) |
| container_1_gzip_zip | plaintext | pass | True | 0.657 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_gzip_zip/project/reader-report.json) |
| container_1_zip_gzip | plaintext | pass | True | 0.719 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_zip_gzip/project/reader-report.json) |
| container_1_nested_zip | plaintext | pass | True | 0.692 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_nested_zip/project/reader-report.json) |
| container_1_tar_base64 | plaintext | pass | True | 0.45 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_tar_base64/project/reader-report.json) |
| container_1_tar_gzip | plaintext | pass | True | 0.511 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_tar_gzip/project/reader-report.json) |
| container_1_bzip2 | plaintext | miss | True | 0.267 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_bzip2/project/reader-report.json) |
| container_1_xz | plaintext | miss | True | 0.258 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_xz/project/reader-report.json) |
| container_1_zip_odd_path | plaintext | pass | True | 0.552 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_zip_odd_path/project/reader-report.json) |
| container_1_png_text | plaintext | pass | True | 0.516 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_png_text/project/reader-report.json) |
| container_1_png_compressed_text | plaintext | miss | True | 0.369 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_png_compressed_text/project/reader-report.json) |
| container_1_pdf_plain_stream | plaintext | pass | True | 0.504 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_pdf_plain_stream/project/reader-report.json) |
| container_1_pdf_flate_stream | plaintext | miss | True | 0.411 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_1_pdf_flate_stream/project/reader-report.json) |
| text_2_base64 | plaintext | pass | True | 1.728 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_base64/project/reader-report.json) |
| text_2_hex | plaintext | pass | True | 1.723 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_hex/project/reader-report.json) |
| text_2_three_base64 | plaintext | pass | True | 2.31 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_three_base64/project/reader-report.json) |
| text_2_base32 | plaintext | miss | True | 0.391 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_base32/project/reader-report.json) |
| text_2_base85 | plaintext | miss | True | 0.261 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_base85/project/reader-report.json) |
| text_2_ascii85 | plaintext | miss | True | 0.277 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_ascii85/project/reader-report.json) |
| text_2_unpadded | plaintext | pass | True | 0.445 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_unpadded/project/reader-report.json) |
| text_2_wrapped | plaintext | pass | True | 0.975 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_wrapped/project/reader-report.json) |
| text_2_urlsafe | plaintext | pass | True | 0.339 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_urlsafe/project/reader-report.json) |
| text_2_escaped_bytes | plaintext | pass | True | 0.928 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_escaped_bytes/project/reader-report.json) |
| text_2_json_base64 | plaintext | pass | True | 1.162 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_json_base64/project/reader-report.json) |
| text_2_html_base64 | plaintext | pass | True | 1.071 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_html_base64/project/reader-report.json) |
| text_2_js_concat | plaintext | miss | True | 1.122 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_js_concat/project/reader-report.json) |
| text_2_percent_bytes | plaintext | miss | True | 0.273 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_percent_bytes/project/reader-report.json) |
| text_2_unicode_escapes | plaintext | miss | True | 0.347 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_unicode_escapes/project/reader-report.json) |
| text_2_utf16le | plaintext | pass | True | 0.964 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_utf16le/project/reader-report.json) |
| text_2_utf16be | plaintext | pass | True | 0.912 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_utf16be/project/reader-report.json) |
| text_2_rot13 | plaintext | miss | True | 0.346 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_rot13/project/reader-report.json) |
| text_2_reverse | plaintext | miss | True | 0.356 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/text_2_reverse/project/reader-report.json) |
| container_2_zip_plain | plaintext | pass | True | 0.451 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_zip_plain/project/reader-report.json) |
| container_2_zip_base64 | plaintext | pass | True | 1.165 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_zip_base64/project/reader-report.json) |
| container_2_zip_hex | plaintext | pass | True | 1.977 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_zip_hex/project/reader-report.json) |
| container_2_gzip_plain | plaintext | pass | True | 0.452 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_gzip_plain/project/reader-report.json) |
| container_2_gzip_base64 | plaintext | pass | True | 0.886 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_gzip_base64/project/reader-report.json) |
| container_2_base64_zip | plaintext | pass | True | 1.061 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_base64_zip/project/reader-report.json) |
| container_2_gzip_zip | plaintext | pass | True | 1.203 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_gzip_zip/project/reader-report.json) |
| container_2_zip_gzip | plaintext | pass | True | 1.172 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_zip_gzip/project/reader-report.json) |
| container_2_nested_zip | plaintext | pass | True | 1.152 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_nested_zip/project/reader-report.json) |
| container_2_tar_base64 | plaintext | pass | True | 0.891 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_tar_base64/project/reader-report.json) |
| container_2_tar_gzip | plaintext | pass | True | 0.886 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_tar_gzip/project/reader-report.json) |
| container_2_bzip2 | plaintext | miss | True | 0.329 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_bzip2/project/reader-report.json) |
| container_2_xz | plaintext | pass | True | 0.767 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_xz/project/reader-report.json) |
| container_2_zip_odd_path | plaintext | pass | True | 1.778 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_zip_odd_path/project/reader-report.json) |
| container_2_png_text | plaintext | pass | True | 0.929 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_png_text/project/reader-report.json) |
| container_2_png_compressed_text | plaintext | miss | True | 0.266 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_png_compressed_text/project/reader-report.json) |
| container_2_pdf_plain_stream | plaintext | pass | True | 1.817 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_pdf_plain_stream/project/reader-report.json) |
| container_2_pdf_flate_stream | plaintext | miss | True | 0.551 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/container_2_pdf_flate_stream/project/reader-report.json) |
| hash_md5_0 | password | pass | True | 0.941 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_md5_0/project/reader-report.json) |
| hash_md5_1 | password | pass | True | 0.888 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_md5_1/project/reader-report.json) |
| hash_md5_2 | password | pass | True | 1.536 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_md5_2/project/reader-report.json) |
| hash_wrapped_md5_b64 | password | pass | True | 2.236 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_md5_b64/project/reader-report.json) |
| hash_wrapped_md5_hex | password | pass | True | 2.45 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_md5_hex/project/reader-report.json) |
| hash_wrapped_md5_utf16 | password | pass | True | 1.139 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_md5_utf16/project/reader-report.json) |
| hash_sha1_0 | password | pass | True | 1.443 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha1_0/project/reader-report.json) |
| hash_sha1_1 | password | pass | True | 0.933 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha1_1/project/reader-report.json) |
| hash_sha1_2 | password | pass | True | 5.334 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha1_2/project/reader-report.json) |
| hash_wrapped_sha1_b64 | password | pass | True | 2.175 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha1_b64/project/reader-report.json) |
| hash_wrapped_sha1_hex | password | pass | True | 2.519 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha1_hex/project/reader-report.json) |
| hash_wrapped_sha1_utf16 | password | pass | True | 1.254 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha1_utf16/project/reader-report.json) |
| hash_sha256_0 | password | pass | True | 1.067 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha256_0/project/reader-report.json) |
| hash_sha256_1 | password | pass | True | 0.855 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha256_1/project/reader-report.json) |
| hash_sha256_2 | password | pass | True | 1.471 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha256_2/project/reader-report.json) |
| hash_wrapped_sha256_b64 | password | pass | True | 2.469 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha256_b64/project/reader-report.json) |
| hash_wrapped_sha256_hex | password | pass | True | 2.424 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha256_hex/project/reader-report.json) |
| hash_wrapped_sha256_utf16 | password | pass | True | 0.911 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha256_utf16/project/reader-report.json) |
| hash_sha512_0 | password | pass | True | 0.937 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha512_0/project/reader-report.json) |
| hash_sha512_1 | password | pass | True | 0.827 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha512_1/project/reader-report.json) |
| hash_sha512_2 | password | pass | True | 1.415 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha512_2/project/reader-report.json) |
| hash_wrapped_sha512_b64 | password | pass | True | 1.99 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha512_b64/project/reader-report.json) |
| hash_wrapped_sha512_hex | password | pass | True | 1.66 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha512_hex/project/reader-report.json) |
| hash_wrapped_sha512_utf16 | password | pass | True | 1.453 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha512_utf16/project/reader-report.json) |
| hash_ntlm_0 | password | pass | True | 0.99 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_ntlm_0/project/reader-report.json) |
| hash_ntlm_1 | password | pass | True | 0.836 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_ntlm_1/project/reader-report.json) |
| hash_ntlm_2 | password | pass | True | 1.263 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_ntlm_2/project/reader-report.json) |
| hash_wrapped_ntlm_b64 | password | pass | True | 2.186 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_ntlm_b64/project/reader-report.json) |
| hash_wrapped_ntlm_hex | password | pass | True | 2.382 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_ntlm_hex/project/reader-report.json) |
| hash_wrapped_ntlm_utf16 | password | pass | True | 0.891 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_ntlm_utf16/project/reader-report.json) |
| hash_bcrypt_0 | password | pass | True | 0.752 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_bcrypt_0/project/reader-report.json) |
| hash_bcrypt_1 | password | pass | True | 0.674 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_bcrypt_1/project/reader-report.json) |
| hash_bcrypt_2 | password | pass | True | 1.241 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_bcrypt_2/project/reader-report.json) |
| hash_wrapped_bcrypt_b64 | password | pass | True | 1.773 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_bcrypt_b64/project/reader-report.json) |
| hash_wrapped_bcrypt_hex | password | pass | True | 2.098 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_bcrypt_hex/project/reader-report.json) |
| hash_wrapped_bcrypt_utf16 | password | pass | True | 0.89 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_bcrypt_utf16/project/reader-report.json) |
| hash_sha512crypt_0 | password | pass | True | 1.173 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha512crypt_0/project/reader-report.json) |
| hash_sha512crypt_1 | password | pass | True | 1.055 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha512crypt_1/project/reader-report.json) |
| hash_sha512crypt_2 | password | pass | True | 2.427 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_sha512crypt_2/project/reader-report.json) |
| hash_wrapped_sha512crypt_b64 | password | pass | True | 2.453 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha512crypt_b64/project/reader-report.json) |
| hash_wrapped_sha512crypt_hex | password | pass | True | 2.622 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha512crypt_hex/project/reader-report.json) |
| hash_wrapped_sha512crypt_utf16 | password | pass | True | 1.246 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/hash_wrapped_sha512crypt_utf16/project/reader-report.json) |
| upstream_john_md5_0 | password | pass | True | 1.263 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/upstream_john_md5_0/project/reader-report.json) |
| upstream_john_md5_1 | password | pass | True | 1.597 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/upstream_john_md5_1/project/reader-report.json) |
| upstream_john_md5_2 | password | pass | True | 1.476 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/upstream_john_md5_2/project/reader-report.json) |
| password_shape_empty | password | pass | True | 0.777 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/password_shape_empty/project/reader-report.json) |
| password_shape_unicode | password | pass | True | 1.267 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/password_shape_unicode/project/reader-report.json) |
| password_shape_colon | password | pass | True | 1.266 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/password_shape_colon/project/reader-report.json) |
| password_shape_spaces | password | pass | True | 1.423 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/password_shape_spaces/project/reader-report.json) |
| password_shape_long | password | pass | True | 1.502 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/password_shape_long/project/reader-report.json) |
| password_not_in_plan | unrecovered | pass | True | 1.273 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/password_not_in_plan/project/reader-report.json) |
| unsupported_sha224 | hash_detected | miss | True | 0.479 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_sha224/project/reader-report.json) |
| unsupported_sha384 | hash_detected | miss | True | 0.503 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_sha384/project/reader-report.json) |
| unsupported_structured_0 | needs_adapter | pass | True | 0.288 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_structured_0/project/reader-report.json) |
| unsupported_structured_1 | needs_adapter | pass | True | 0.288 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_structured_1/project/reader-report.json) |
| unsupported_structured_2 | needs_adapter | pass | True | 0.308 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_structured_2/project/reader-report.json) |
| unsupported_structured_3 | needs_adapter | pass | True | 0.273 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/unsupported_structured_3/project/reader-report.json) |
| review_0 | review | pass | True | 0.48 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/review_0/project/reader-report.json) |
| review_1 | review | pass | True | 0.82 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/review_1/project/reader-report.json) |
| review_2 | review | pass | True | 0.475 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/review_2/project/reader-report.json) |
| review_3 | review | pass | True | 0.618 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/review_3/project/reader-report.json) |
| review_4 | review | pass | True | 0.481 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/review_4/project/reader-report.json) |
| review_5 | review | pass | True | 0.492 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/review_5/project/reader-report.json) |
| context_gap_0 | password | miss | True | 0.481 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_0/project/reader-report.json) |
| context_gap_1 | password | miss | True | 0.61 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_1/project/reader-report.json) |
| context_gap_2 | no_autocrack | noise | True | 0.929 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_2/project/reader-report.json) |
| context_gap_3 | no_autocrack | noise | True | 1.044 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/context_gap_3/project/reader-report.json) |
| malformed_0 | diagnosed | pass | True | 0.269 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_0/project/reader-report.json) |
| malformed_1 | diagnosed | pass | True | 0.729 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_1/project/reader-report.json) |
| malformed_2 | diagnosed | pass | True | 0.302 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_2/project/reader-report.json) |
| malformed_3 | diagnosed | pass | True | 0.431 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_3/project/reader-report.json) |
| malformed_4 | diagnosed | pass | True | 0.283 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_4/project/reader-report.json) |
| malformed_5 | diagnosed | pass | True | 0.342 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_5/project/reader-report.json) |
| malformed_6 | diagnosed | pass | True | 0.274 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_6/project/reader-report.json) |
| malformed_7 | diagnosed | pass | True | 0.321 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/malformed_7/project/reader-report.json) |
| negative_0 | quiet | pass | True | 0.272 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_0/project/reader-report.json) |
| negative_1 | quiet | pass | True | 0.245 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_1/project/reader-report.json) |
| negative_2 | quiet | pass | True | 0.373 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_2/project/reader-report.json) |
| negative_3 | quiet | pass | True | 0.271 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_3/project/reader-report.json) |
| negative_4 | quiet | pass | True | 0.255 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_4/project/reader-report.json) |
| negative_5 | quiet | pass | True | 0.262 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_5/project/reader-report.json) |
| negative_6 | quiet | pass | True | 0.274 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_6/project/reader-report.json) |
| negative_7 | quiet | pass | True | 0.265 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_7/project/reader-report.json) |
| negative_8 | quiet | pass | True | 0.257 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_8/project/reader-report.json) |
| negative_9 | quiet | pass | True | 0.25 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_9/project/reader-report.json) |
| negative_10 | quiet | pass | True | 0.35 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_10/project/reader-report.json) |
| negative_11 | quiet | pass | True | 0.464 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_11/project/reader-report.json) |
| negative_12 | quiet | pass | True | 0.468 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_12/project/reader-report.json) |
| negative_13 | quiet | pass | True | 0.292 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_13/project/reader-report.json) |
| negative_14 | quiet | pass | True | 0.259 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_14/project/reader-report.json) |
| negative_15 | quiet | pass | True | 0.275 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_15/project/reader-report.json) |
| negative_16 | quiet | pass | True | 0.3 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_16/project/reader-report.json) |
| negative_17 | quiet | pass | True | 0.337 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_17/project/reader-report.json) |
| negative_18 | quiet | pass | True | 0.307 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/negative_18/project/reader-report.json) |
| size_limit | size_guard | pass | True | 0.456 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/size_limit/project/reader-report.json) |
| depth_limit | limit_notice | pass | True | 9.608 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/depth_limit/project/reader-report.json) |
| archive_member_limit | limit_notice | pass | True | 3.882 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/archive_member_limit/project/reader-report.json) |
| gzip_expansion_limit | limit_notice | pass | True | 0.302 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/gzip_expansion_limit/project/reader-report.json) |
| encrypted_zip | password | pass | True | 0.947 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/encrypted_zip/project/reader-report.json) |
| base64_encrypted_zip | plaintext | pass | True | 1.004 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/base64_encrypted_zip/project/reader-report.json) |
| encrypted_ssh_key | password | pass | True | 8.409 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/encrypted_ssh_key/project/reader-report.json) |
| sqlite_embedded_base64 | plaintext | pass | True | 0.786 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/sqlite_embedded_base64/project/reader-report.json) |
| recovered_password_is_base64 | plaintext | pass | True | 2.381 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/recovered_password_is_base64/project/reader-report.json) |
| public_0 | observe | observation | True | 0.39 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_0/project/reader-report.json) |
| public_augmented_0 | password | pass | True | 2.85 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_0/project/reader-report.json) |
| public_1 | observe | observation | True | 0.459 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_1/project/reader-report.json) |
| public_augmented_1 | password | pass | True | 2.603 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_1/project/reader-report.json) |
| public_2 | observe | observation | True | 0.522 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_2/project/reader-report.json) |
| public_augmented_2 | password | pass | True | 3.153 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_2/project/reader-report.json) |
| public_3 | observe | observation | True | 0.889 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_3/project/reader-report.json) |
| public_augmented_3 | password | pass | True | 2.838 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_3/project/reader-report.json) |
| public_4 | observe | observation | True | 0.311 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_4/project/reader-report.json) |
| public_5 | observe | observation | True | 0.284 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_5/project/reader-report.json) |
| public_6 | observe | observation | True | 0.296 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_6/project/reader-report.json) |
| public_augmented_6 | password | pass | True | 2.39 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_6/project/reader-report.json) |
| public_7 | observe | observation | True | 0.295 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_7/project/reader-report.json) |
| public_augmented_7 | password | pass | True | 2.455 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_7/project/reader-report.json) |
| public_8 | observe | observation | True | 0.762 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_8/project/reader-report.json) |
| public_augmented_8 | password | pass | True | 2.353 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_8/project/reader-report.json) |
| public_9 | observe | observation | True | 0.314 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_9/project/reader-report.json) |
| public_augmented_9 | password | pass | True | 2.598 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_augmented_9/project/reader-report.json) |
| public_10 | observe | observation | True | 0.283 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_10/project/reader-report.json) |
| public_11 | observe | observation | True | 0.998 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_11/project/reader-report.json) |
| public_12 | observe | observation | True | 1.646 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_12/project/reader-report.json) |
| public_13 | observe | observation | True | 3.883 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_13/project/reader-report.json) |
| public_14 | observe | observation | True | 3.285 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-collection/public_14/project/reader-report.json) |
