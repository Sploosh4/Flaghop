# Offline reader collection evaluation

Started: 2026-10-31T05:58:32.910010+00:00

**No CTF was joined, deployed or interacted with.** These are offline data files only. Public files came from upstream regression suites, not challenge platforms.

Known-answer fixtures use default production reader limits and the measured engine profile. No answer regex is supplied. Password tests use a small, explicit audit seed list plus the normal quick list; this measures workflow correctness, not password strength. Per-case evaluation budgets are 20 seconds (15 for unlabelled files), checked between bounded work units, with a 45-second external worker guard. A goal can pass while other incidental work remains pending.

Results so far: {"observation": 15, "pass": 222}

| Group | Outcomes |
|---|---|
| ambiguity | {'pass': 6} |
| containers | {'pass': 54} |
| context | {'pass': 4} |
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
| text | {'pass': 57} |
| unsupported_hash | {'pass': 6} |
| upstream_vectors | {'pass': 3} |

| Case | Goal | Outcome | Drained | Seconds | Evidence |
|---|---|---|---|---:|---|
| text_0_base64 | plaintext | pass | True | 0.706 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_base64/project/reader-report.json) |
| text_0_hex | plaintext | pass | True | 0.638 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_hex/project/reader-report.json) |
| text_0_three_base64 | plaintext | pass | True | 1.563 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_three_base64/project/reader-report.json) |
| text_0_base32 | plaintext | pass | True | 0.635 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_base32/project/reader-report.json) |
| text_0_base85 | plaintext | pass | True | 0.563 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_base85/project/reader-report.json) |
| text_0_ascii85 | plaintext | pass | True | 0.552 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_ascii85/project/reader-report.json) |
| text_0_unpadded | plaintext | pass | True | 0.56 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_unpadded/project/reader-report.json) |
| text_0_wrapped | plaintext | pass | True | 1.665 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_wrapped/project/reader-report.json) |
| text_0_urlsafe | plaintext | pass | True | 0.552 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_urlsafe/project/reader-report.json) |
| text_0_escaped_bytes | plaintext | pass | True | 0.63 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_escaped_bytes/project/reader-report.json) |
| text_0_json_base64 | plaintext | pass | True | 0.727 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_json_base64/project/reader-report.json) |
| text_0_html_base64 | plaintext | pass | True | 1.532 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_html_base64/project/reader-report.json) |
| text_0_js_concat | plaintext | pass | True | 1.815 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_js_concat/project/reader-report.json) |
| text_0_percent_bytes | plaintext | pass | True | 0.568 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_percent_bytes/project/reader-report.json) |
| text_0_unicode_escapes | plaintext | pass | True | 0.725 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_unicode_escapes/project/reader-report.json) |
| text_0_utf16le | plaintext | pass | True | 0.856 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_utf16le/project/reader-report.json) |
| text_0_utf16be | plaintext | pass | True | 0.887 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_utf16be/project/reader-report.json) |
| text_0_rot13 | plaintext | pass | True | 0.459 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_rot13/project/reader-report.json) |
| text_0_reverse | plaintext | pass | True | 0.487 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_0_reverse/project/reader-report.json) |
| container_0_zip_plain | plaintext | pass | True | 0.604 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_zip_plain/project/reader-report.json) |
| container_0_zip_base64 | plaintext | pass | True | 0.846 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_zip_base64/project/reader-report.json) |
| container_0_zip_hex | plaintext | pass | True | 0.734 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_zip_hex/project/reader-report.json) |
| container_0_gzip_plain | plaintext | pass | True | 0.568 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_gzip_plain/project/reader-report.json) |
| container_0_gzip_base64 | plaintext | pass | True | 0.829 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_gzip_base64/project/reader-report.json) |
| container_0_base64_zip | plaintext | pass | True | 0.937 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_base64_zip/project/reader-report.json) |
| container_0_gzip_zip | plaintext | pass | True | 0.905 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_gzip_zip/project/reader-report.json) |
| container_0_zip_gzip | plaintext | pass | True | 0.981 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_zip_gzip/project/reader-report.json) |
| container_0_nested_zip | plaintext | pass | True | 0.989 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_nested_zip/project/reader-report.json) |
| container_0_tar_base64 | plaintext | pass | True | 0.637 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_tar_base64/project/reader-report.json) |
| container_0_tar_gzip | plaintext | pass | True | 1.054 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_tar_gzip/project/reader-report.json) |
| container_0_bzip2 | plaintext | pass | True | 1.0 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_bzip2/project/reader-report.json) |
| container_0_xz | plaintext | pass | True | 2.363 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_xz/project/reader-report.json) |
| container_0_zip_odd_path | plaintext | pass | True | 1.244 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_zip_odd_path/project/reader-report.json) |
| container_0_png_text | plaintext | pass | True | 1.479 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_png_text/project/reader-report.json) |
| container_0_png_compressed_text | plaintext | pass | True | 1.916 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_png_compressed_text/project/reader-report.json) |
| container_0_pdf_plain_stream | plaintext | pass | True | 0.846 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_pdf_plain_stream/project/reader-report.json) |
| container_0_pdf_flate_stream | plaintext | pass | True | 1.122 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_0_pdf_flate_stream/project/reader-report.json) |
| text_1_base64 | plaintext | pass | True | 0.799 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_base64/project/reader-report.json) |
| text_1_hex | plaintext | pass | True | 0.915 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_hex/project/reader-report.json) |
| text_1_three_base64 | plaintext | pass | True | 1.143 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_three_base64/project/reader-report.json) |
| text_1_base32 | plaintext | pass | True | 0.768 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_base32/project/reader-report.json) |
| text_1_base85 | plaintext | pass | True | 0.652 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_base85/project/reader-report.json) |
| text_1_ascii85 | plaintext | pass | True | 1.141 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_ascii85/project/reader-report.json) |
| text_1_unpadded | plaintext | pass | True | 0.662 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_unpadded/project/reader-report.json) |
| text_1_wrapped | plaintext | pass | True | 1.694 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_wrapped/project/reader-report.json) |
| text_1_urlsafe | plaintext | pass | True | 0.54 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_urlsafe/project/reader-report.json) |
| text_1_escaped_bytes | plaintext | pass | True | 0.665 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_escaped_bytes/project/reader-report.json) |
| text_1_json_base64 | plaintext | pass | True | 0.64 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_json_base64/project/reader-report.json) |
| text_1_html_base64 | plaintext | pass | True | 0.635 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_html_base64/project/reader-report.json) |
| text_1_js_concat | plaintext | pass | True | 1.538 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_js_concat/project/reader-report.json) |
| text_1_percent_bytes | plaintext | pass | True | 1.03 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_percent_bytes/project/reader-report.json) |
| text_1_unicode_escapes | plaintext | pass | True | 0.8 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_unicode_escapes/project/reader-report.json) |
| text_1_utf16le | plaintext | pass | True | 0.851 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_utf16le/project/reader-report.json) |
| text_1_utf16be | plaintext | pass | True | 0.776 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_utf16be/project/reader-report.json) |
| text_1_rot13 | plaintext | pass | True | 0.481 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_rot13/project/reader-report.json) |
| text_1_reverse | plaintext | pass | True | 0.477 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_1_reverse/project/reader-report.json) |
| container_1_zip_plain | plaintext | pass | True | 0.677 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_zip_plain/project/reader-report.json) |
| container_1_zip_base64 | plaintext | pass | True | 1.26 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_zip_base64/project/reader-report.json) |
| container_1_zip_hex | plaintext | pass | True | 0.909 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_zip_hex/project/reader-report.json) |
| container_1_gzip_plain | plaintext | pass | True | 0.557 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_gzip_plain/project/reader-report.json) |
| container_1_gzip_base64 | plaintext | pass | True | 0.722 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_gzip_base64/project/reader-report.json) |
| container_1_base64_zip | plaintext | pass | True | 0.864 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_base64_zip/project/reader-report.json) |
| container_1_gzip_zip | plaintext | pass | True | 1.998 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_gzip_zip/project/reader-report.json) |
| container_1_zip_gzip | plaintext | pass | True | 0.884 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_zip_gzip/project/reader-report.json) |
| container_1_nested_zip | plaintext | pass | True | 0.889 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_nested_zip/project/reader-report.json) |
| container_1_tar_base64 | plaintext | pass | True | 0.656 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_tar_base64/project/reader-report.json) |
| container_1_tar_gzip | plaintext | pass | True | 1.456 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_tar_gzip/project/reader-report.json) |
| container_1_bzip2 | plaintext | pass | True | 1.279 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_bzip2/project/reader-report.json) |
| container_1_xz | plaintext | pass | True | 0.752 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_xz/project/reader-report.json) |
| container_1_zip_odd_path | plaintext | pass | True | 0.749 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_zip_odd_path/project/reader-report.json) |
| container_1_png_text | plaintext | pass | True | 0.898 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_png_text/project/reader-report.json) |
| container_1_png_compressed_text | plaintext | pass | True | 0.759 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_png_compressed_text/project/reader-report.json) |
| container_1_pdf_plain_stream | plaintext | pass | True | 0.683 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_pdf_plain_stream/project/reader-report.json) |
| container_1_pdf_flate_stream | plaintext | pass | True | 0.836 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_1_pdf_flate_stream/project/reader-report.json) |
| text_2_base64 | plaintext | pass | True | 0.77 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_base64/project/reader-report.json) |
| text_2_hex | plaintext | pass | True | 0.798 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_hex/project/reader-report.json) |
| text_2_three_base64 | plaintext | pass | True | 1.158 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_three_base64/project/reader-report.json) |
| text_2_base32 | plaintext | pass | True | 0.885 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_base32/project/reader-report.json) |
| text_2_base85 | plaintext | pass | True | 0.771 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_base85/project/reader-report.json) |
| text_2_ascii85 | plaintext | pass | True | 0.758 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_ascii85/project/reader-report.json) |
| text_2_unpadded | plaintext | pass | True | 1.097 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_unpadded/project/reader-report.json) |
| text_2_wrapped | plaintext | pass | True | 1.565 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_wrapped/project/reader-report.json) |
| text_2_urlsafe | plaintext | pass | True | 0.521 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_urlsafe/project/reader-report.json) |
| text_2_escaped_bytes | plaintext | pass | True | 1.286 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_escaped_bytes/project/reader-report.json) |
| text_2_json_base64 | plaintext | pass | True | 1.301 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_json_base64/project/reader-report.json) |
| text_2_html_base64 | plaintext | pass | True | 0.953 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_html_base64/project/reader-report.json) |
| text_2_js_concat | plaintext | pass | True | 1.862 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_js_concat/project/reader-report.json) |
| text_2_percent_bytes | plaintext | pass | True | 0.844 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_percent_bytes/project/reader-report.json) |
| text_2_unicode_escapes | plaintext | pass | True | 1.257 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_unicode_escapes/project/reader-report.json) |
| text_2_utf16le | plaintext | pass | True | 0.976 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_utf16le/project/reader-report.json) |
| text_2_utf16be | plaintext | pass | True | 1.209 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_utf16be/project/reader-report.json) |
| text_2_rot13 | plaintext | pass | True | 0.767 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_rot13/project/reader-report.json) |
| text_2_reverse | plaintext | pass | True | 0.703 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/text_2_reverse/project/reader-report.json) |
| container_2_zip_plain | plaintext | pass | True | 0.817 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_zip_plain/project/reader-report.json) |
| container_2_zip_base64 | plaintext | pass | True | 0.925 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_zip_base64/project/reader-report.json) |
| container_2_zip_hex | plaintext | pass | True | 0.989 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_zip_hex/project/reader-report.json) |
| container_2_gzip_plain | plaintext | pass | True | 0.882 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_gzip_plain/project/reader-report.json) |
| container_2_gzip_base64 | plaintext | pass | True | 1.26 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_gzip_base64/project/reader-report.json) |
| container_2_base64_zip | plaintext | pass | True | 1.216 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_base64_zip/project/reader-report.json) |
| container_2_gzip_zip | plaintext | pass | True | 1.287 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_gzip_zip/project/reader-report.json) |
| container_2_zip_gzip | plaintext | pass | True | 0.988 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_zip_gzip/project/reader-report.json) |
| container_2_nested_zip | plaintext | pass | True | 1.015 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_nested_zip/project/reader-report.json) |
| container_2_tar_base64 | plaintext | pass | True | 0.798 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_tar_base64/project/reader-report.json) |
| container_2_tar_gzip | plaintext | pass | True | 1.146 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_tar_gzip/project/reader-report.json) |
| container_2_bzip2 | plaintext | pass | True | 0.987 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_bzip2/project/reader-report.json) |
| container_2_xz | plaintext | pass | True | 0.883 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_xz/project/reader-report.json) |
| container_2_zip_odd_path | plaintext | pass | True | 0.894 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_zip_odd_path/project/reader-report.json) |
| container_2_png_text | plaintext | pass | True | 1.194 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_png_text/project/reader-report.json) |
| container_2_png_compressed_text | plaintext | pass | True | 0.932 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_png_compressed_text/project/reader-report.json) |
| container_2_pdf_plain_stream | plaintext | pass | True | 1.058 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_pdf_plain_stream/project/reader-report.json) |
| container_2_pdf_flate_stream | plaintext | pass | True | 1.146 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/container_2_pdf_flate_stream/project/reader-report.json) |
| hash_md5_0 | password | pass | True | 1.022 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_md5_0/project/reader-report.json) |
| hash_md5_1 | password | pass | True | 0.843 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_md5_1/project/reader-report.json) |
| hash_md5_2 | password | pass | True | 1.214 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_md5_2/project/reader-report.json) |
| hash_wrapped_md5_b64 | password | pass | True | 0.817 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_md5_b64/project/reader-report.json) |
| hash_wrapped_md5_hex | password | pass | True | 1.022 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_md5_hex/project/reader-report.json) |
| hash_wrapped_md5_utf16 | password | pass | True | 1.055 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_md5_utf16/project/reader-report.json) |
| hash_sha1_0 | password | pass | True | 1.053 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha1_0/project/reader-report.json) |
| hash_sha1_1 | password | pass | True | 0.895 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha1_1/project/reader-report.json) |
| hash_sha1_2 | password | pass | True | 1.323 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha1_2/project/reader-report.json) |
| hash_wrapped_sha1_b64 | password | pass | True | 0.925 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha1_b64/project/reader-report.json) |
| hash_wrapped_sha1_hex | password | pass | True | 0.895 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha1_hex/project/reader-report.json) |
| hash_wrapped_sha1_utf16 | password | pass | True | 0.944 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha1_utf16/project/reader-report.json) |
| hash_sha256_0 | password | pass | True | 0.931 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha256_0/project/reader-report.json) |
| hash_sha256_1 | password | pass | True | 0.778 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha256_1/project/reader-report.json) |
| hash_sha256_2 | password | pass | True | 1.229 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha256_2/project/reader-report.json) |
| hash_wrapped_sha256_b64 | password | pass | True | 0.913 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha256_b64/project/reader-report.json) |
| hash_wrapped_sha256_hex | password | pass | True | 0.798 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha256_hex/project/reader-report.json) |
| hash_wrapped_sha256_utf16 | password | pass | True | 0.838 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha256_utf16/project/reader-report.json) |
| hash_sha512_0 | password | pass | True | 0.905 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha512_0/project/reader-report.json) |
| hash_sha512_1 | password | pass | True | 0.701 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha512_1/project/reader-report.json) |
| hash_sha512_2 | password | pass | True | 1.161 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha512_2/project/reader-report.json) |
| hash_wrapped_sha512_b64 | password | pass | True | 0.864 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512_b64/project/reader-report.json) |
| hash_wrapped_sha512_hex | password | pass | True | 0.972 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512_hex/project/reader-report.json) |
| hash_wrapped_sha512_utf16 | password | pass | True | 0.944 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512_utf16/project/reader-report.json) |
| hash_ntlm_0 | password | pass | True | 0.913 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_ntlm_0/project/reader-report.json) |
| hash_ntlm_1 | password | pass | True | 0.702 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_ntlm_1/project/reader-report.json) |
| hash_ntlm_2 | password | pass | True | 1.125 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_ntlm_2/project/reader-report.json) |
| hash_wrapped_ntlm_b64 | password | pass | True | 0.904 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_ntlm_b64/project/reader-report.json) |
| hash_wrapped_ntlm_hex | password | pass | True | 0.844 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_ntlm_hex/project/reader-report.json) |
| hash_wrapped_ntlm_utf16 | password | pass | True | 0.857 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_ntlm_utf16/project/reader-report.json) |
| hash_bcrypt_0 | password | pass | True | 0.802 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_bcrypt_0/project/reader-report.json) |
| hash_bcrypt_1 | password | pass | True | 0.627 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_bcrypt_1/project/reader-report.json) |
| hash_bcrypt_2 | password | pass | True | 1.216 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_bcrypt_2/project/reader-report.json) |
| hash_wrapped_bcrypt_b64 | password | pass | True | 0.788 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_bcrypt_b64/project/reader-report.json) |
| hash_wrapped_bcrypt_hex | password | pass | True | 1.058 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_bcrypt_hex/project/reader-report.json) |
| hash_wrapped_bcrypt_utf16 | password | pass | True | 0.792 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_bcrypt_utf16/project/reader-report.json) |
| hash_sha512crypt_0 | password | pass | True | 1.218 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha512crypt_0/project/reader-report.json) |
| hash_sha512crypt_1 | password | pass | True | 0.87 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha512crypt_1/project/reader-report.json) |
| hash_sha512crypt_2 | password | pass | True | 2.021 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_sha512crypt_2/project/reader-report.json) |
| hash_wrapped_sha512crypt_b64 | password | pass | True | 1.224 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512crypt_b64/project/reader-report.json) |
| hash_wrapped_sha512crypt_hex | password | pass | True | 1.268 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512crypt_hex/project/reader-report.json) |
| hash_wrapped_sha512crypt_utf16 | password | pass | True | 1.01 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/hash_wrapped_sha512crypt_utf16/project/reader-report.json) |
| upstream_john_md5_0 | password | pass | True | 1.124 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/upstream_john_md5_0/project/reader-report.json) |
| upstream_john_md5_1 | password | pass | True | 1.082 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/upstream_john_md5_1/project/reader-report.json) |
| upstream_john_md5_2 | password | pass | True | 1.233 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/upstream_john_md5_2/project/reader-report.json) |
| password_shape_empty | password | pass | True | 0.663 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/password_shape_empty/project/reader-report.json) |
| password_shape_unicode | password | pass | True | 1.177 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/password_shape_unicode/project/reader-report.json) |
| password_shape_colon | password | pass | True | 1.085 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/password_shape_colon/project/reader-report.json) |
| password_shape_spaces | password | pass | True | 1.07 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/password_shape_spaces/project/reader-report.json) |
| password_shape_long | password | pass | True | 1.285 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/password_shape_long/project/reader-report.json) |
| password_not_in_plan | unrecovered | pass | True | 1.067 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/password_not_in_plan/project/reader-report.json) |
| unsupported_sha224 | hash_detected | pass | True | 0.937 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/unsupported_sha224/project/reader-report.json) |
| unsupported_sha384 | hash_detected | pass | True | 0.84 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/unsupported_sha384/project/reader-report.json) |
| unsupported_structured_0 | needs_adapter | pass | True | 0.208 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_0/project/reader-report.json) |
| unsupported_structured_1 | needs_adapter | pass | True | 0.21 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_1/project/reader-report.json) |
| unsupported_structured_2 | needs_adapter | pass | True | 0.217 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_2/project/reader-report.json) |
| unsupported_structured_3 | needs_adapter | pass | True | 0.213 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/unsupported_structured_3/project/reader-report.json) |
| review_0 | review | pass | True | 0.38 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/review_0/project/reader-report.json) |
| review_1 | review | pass | True | 0.375 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/review_1/project/reader-report.json) |
| review_2 | review | pass | True | 0.376 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/review_2/project/reader-report.json) |
| review_3 | review | pass | True | 0.539 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/review_3/project/reader-report.json) |
| review_4 | review | pass | True | 0.5 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/review_4/project/reader-report.json) |
| review_5 | review | pass | True | 0.603 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/review_5/project/reader-report.json) |
| context_gap_0 | password | pass | True | 0.919 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/context_gap_0/project/reader-report.json) |
| context_gap_1 | password | pass | True | 0.994 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/context_gap_1/project/reader-report.json) |
| context_gap_2 | no_autocrack | pass | True | 0.686 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/context_gap_2/project/reader-report.json) |
| context_gap_3 | no_autocrack | pass | True | 0.568 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/context_gap_3/project/reader-report.json) |
| malformed_0 | diagnosed | pass | True | 0.291 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_0/project/reader-report.json) |
| malformed_1 | diagnosed | pass | True | 0.696 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_1/project/reader-report.json) |
| malformed_2 | diagnosed | pass | True | 0.25 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_2/project/reader-report.json) |
| malformed_3 | diagnosed | pass | True | 0.277 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_3/project/reader-report.json) |
| malformed_4 | diagnosed | pass | True | 0.221 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_4/project/reader-report.json) |
| malformed_5 | diagnosed | pass | True | 0.249 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_5/project/reader-report.json) |
| malformed_6 | diagnosed | pass | True | 0.223 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_6/project/reader-report.json) |
| malformed_7 | diagnosed | pass | True | 0.533 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/malformed_7/project/reader-report.json) |
| negative_0 | quiet | pass | True | 0.216 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_0/project/reader-report.json) |
| negative_1 | quiet | pass | True | 0.473 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_1/project/reader-report.json) |
| negative_2 | quiet | pass | True | 0.226 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_2/project/reader-report.json) |
| negative_3 | quiet | pass | True | 0.211 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_3/project/reader-report.json) |
| negative_4 | quiet | pass | True | 0.219 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_4/project/reader-report.json) |
| negative_5 | quiet | pass | True | 0.232 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_5/project/reader-report.json) |
| negative_6 | quiet | pass | True | 0.319 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_6/project/reader-report.json) |
| negative_7 | quiet | pass | True | 0.54 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_7/project/reader-report.json) |
| negative_8 | quiet | pass | True | 0.215 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_8/project/reader-report.json) |
| negative_9 | quiet | pass | True | 0.253 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_9/project/reader-report.json) |
| negative_10 | quiet | pass | True | 1.173 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_10/project/reader-report.json) |
| negative_11 | quiet | pass | True | 0.412 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_11/project/reader-report.json) |
| negative_12 | quiet | pass | True | 0.382 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_12/project/reader-report.json) |
| negative_13 | quiet | pass | True | 0.22 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_13/project/reader-report.json) |
| negative_14 | quiet | pass | True | 0.221 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_14/project/reader-report.json) |
| negative_15 | quiet | pass | True | 0.216 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_15/project/reader-report.json) |
| negative_16 | quiet | pass | True | 0.223 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_16/project/reader-report.json) |
| negative_17 | quiet | pass | True | 0.222 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_17/project/reader-report.json) |
| negative_18 | quiet | pass | True | 0.215 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/negative_18/project/reader-report.json) |
| size_limit | size_guard | pass | True | 0.142 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/size_limit/project/reader-report.json) |
| depth_limit | limit_notice | pass | True | 2.166 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/depth_limit/project/reader-report.json) |
| archive_member_limit | limit_notice | pass | True | 12.352 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/archive_member_limit/project/reader-report.json) |
| gzip_expansion_limit | limit_notice | pass | True | 0.214 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/gzip_expansion_limit/project/reader-report.json) |
| encrypted_zip | password | pass | True | 1.02 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/encrypted_zip/project/reader-report.json) |
| base64_encrypted_zip | plaintext | pass | True | 1.109 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/base64_encrypted_zip/project/reader-report.json) |
| encrypted_ssh_key | password | pass | True | 3.222 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/encrypted_ssh_key/project/reader-report.json) |
| sqlite_embedded_base64 | plaintext | pass | True | 0.865 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/sqlite_embedded_base64/project/reader-report.json) |
| recovered_password_is_base64 | plaintext | pass | True | 1.971 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/recovered_password_is_base64/project/reader-report.json) |
| public_0 | observe | observation | True | 0.237 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_0/project/reader-report.json) |
| public_augmented_0 | password | pass | True | 0.947 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_0/project/reader-report.json) |
| public_1 | observe | observation | True | 0.319 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_1/project/reader-report.json) |
| public_augmented_1 | password | pass | True | 1.039 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_1/project/reader-report.json) |
| public_2 | observe | observation | True | 0.423 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_2/project/reader-report.json) |
| public_augmented_2 | password | pass | True | 1.085 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_2/project/reader-report.json) |
| public_3 | observe | observation | True | 0.44 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_3/project/reader-report.json) |
| public_augmented_3 | password | pass | True | 1.061 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_3/project/reader-report.json) |
| public_4 | observe | observation | True | 0.286 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_4/project/reader-report.json) |
| public_5 | observe | observation | True | 0.212 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_5/project/reader-report.json) |
| public_6 | observe | observation | True | 0.442 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_6/project/reader-report.json) |
| public_augmented_6 | password | pass | True | 1.142 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_6/project/reader-report.json) |
| public_7 | observe | observation | True | 0.25 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_7/project/reader-report.json) |
| public_augmented_7 | password | pass | True | 0.982 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_7/project/reader-report.json) |
| public_8 | observe | observation | True | 0.212 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_8/project/reader-report.json) |
| public_augmented_8 | password | pass | True | 0.926 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_8/project/reader-report.json) |
| public_9 | observe | observation | True | 0.219 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_9/project/reader-report.json) |
| public_augmented_9 | password | pass | True | 0.978 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_augmented_9/project/reader-report.json) |
| public_10 | observe | observation | True | 0.238 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_10/project/reader-report.json) |
| public_11 | observe | observation | True | 1.761 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_11/project/reader-report.json) |
| public_12 | observe | observation | True | 1.063 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_12/project/reader-report.json) |
| public_13 | observe | observation | True | 3.839 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_13/project/reader-report.json) |
| public_14 | observe | observation | True | 3.03 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-collection/public_14/project/reader-report.json) |
