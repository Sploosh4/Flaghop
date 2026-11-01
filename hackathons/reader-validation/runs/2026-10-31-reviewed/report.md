# Reader capability audit

Run: 2026-10-31T04:54:44.584139+00:00

All inputs are synthetic. Existing readers ran independently. Manual handoff controls are diagnostic interventions and do not count as automatic successes. Contract failures are regressions; extension/tandem failures are measured gaps, not promises made by the current README. No score estimates general detection accuracy.

Outcomes: {"gap": 30, "pass": 37, "regression": 1}. Originals unchanged: True.

| Case | Phase | Outcome | Cipher candidates | Hash queue | Evidence |
|---|---|---|---|---|---|
| embedded_base64 | contract | pass | {"accepted_candidate": 1} | {} | [JSON](embedded_base64/observation.json) |
| three_base64_layers | contract | pass | {"accepted_candidate": 1} | {} | [JSON](three_base64_layers/observation.json) |
| hex | contract | pass | {"accepted_candidate": 1} | {} | [JSON](hex/observation.json) |
| backslash_x | contract | pass | {"accepted_candidate": 1} | {} | [JSON](backslash_x/observation.json) |
| utf8_source_offset | contract | pass | {"accepted_candidate": 1} | {} | [JSON](utf8_source_offset/observation.json) |
| duplicate_locations | contract | pass | {"accepted_candidate": 2} | {} | [JSON](duplicate_locations/observation.json) |
| backslash_u_words | contract | pass | {"accepted_candidate": 1} | {} | [JSON](backslash_u_words/observation.json) |
| percent_u_words | contract | pass | {"accepted_candidate": 1} | {} | [JSON](percent_u_words/observation.json) |
| default_checker_base64 | contract | pass | {"accepted_candidate": 1} | {} | [JSON](default_checker_base64/observation.json) |
| default_checker_three_layers | contract | pass | {"accepted_candidate": 1} | {} | [JSON](default_checker_three_layers/observation.json) |
| binary_first_layer_retained | contract | pass | {"binary_first_layer": 1} | {} | [JSON](binary_first_layer_retained/observation.json) |
| plain_short_negative | contract | pass | {} | {} | [JSON](plain_short_negative/observation.json) |
| regex_mismatch_must_not_accept | contract | regression | {"accepted_candidate": 1} | {} | [JSON](regex_mismatch_must_not_accept/observation.json) |
| plain_english_negative | contract | pass | {} | {} | [JSON](plain_english_negative/observation.json) |
| hex_binary_negative | contract | pass | {"binary_first_layer": 2} | {} | [JSON](hex_binary_negative/observation.json) |
| base64_candidate_limit_visible | contract | pass | {"accepted_candidate": 1} | {} | [JSON](base64_candidate_limit_visible/observation.json) |
| two_distinct_payloads | contract | pass | {"accepted_candidate": 2} | {} | [JSON](two_distinct_payloads/observation.json) |
| labelled_md5 | contract | pass | {} | {"recovered": 1} | [JSON](labelled_md5/observation.json) |
| labelled_sha1 | contract | pass | {} | {"recovered": 1} | [JSON](labelled_sha1/observation.json) |
| labelled_sha256 | contract | pass | {} | {"recovered": 1} | [JSON](labelled_sha256/observation.json) |
| labelled_sha512 | contract | pass | {} | {"recovered": 1} | [JSON](labelled_sha512/observation.json) |
| labelled_ntlm | contract | pass | {} | {"recovered": 1} | [JSON](labelled_ntlm/observation.json) |
| uppercase_digest | contract | pass | {} | {"recovered": 1} | [JSON](uppercase_digest/observation.json) |
| json_hash_field | contract | pass | {} | {"recovered": 1} | [JSON](json_hash_field/observation.json) |
| bcrypt | contract | pass | {} | {"recovered": 1} | [JSON](bcrypt/observation.json) |
| sha512crypt | contract | pass | {} | {"recovered": 1} | [JSON](sha512crypt/observation.json) |
| bare_digest_requires_review | contract | pass | {} | {"needs_format": 1} | [JSON](bare_digest_requires_review/observation.json) |
| checksum_context_requires_review | contract | pass | {} | {"needs_format": 1} | [JSON](checksum_context_requires_review/observation.json) |
| unsupported_argon_retained | contract | pass | {} | {"needs_adapter": 1} | [JSON](unsupported_argon_retained/observation.json) |
| hash_candidate_limit_visible | contract | pass | {} | {"recovered": 1} | [JSON](hash_candidate_limit_visible/observation.json) |
| sha256_with_hyphen | contract | pass | {} | {"recovered": 1} | [JSON](sha256_with_hyphen/observation.json) |
| native_john_md5 | contract | pass | {} | {} | [JSON](native_john_md5/observation.json) |
| native_john_ntlm | contract | pass | {} | {} | [JSON](native_john_ntlm/observation.json) |
| native_hashcat_md5 | contract | pass | {} | {} | [JSON](native_hashcat_md5/observation.json) |
| native_hashcat_ntlm | contract | pass | {} | {} | [JSON](native_hashcat_ntlm/observation.json) |
| javascript_unicode_escapes | extension | gap | {"binary_first_layer": 1} | {} | [JSON](javascript_unicode_escapes/observation.json) |
| percent_u_unicode_text | extension | gap | {"binary_first_layer": 1} | {} | [JSON](percent_u_unicode_text/observation.json) |
| wrapped_base64 | extension | gap | {"error": 1, "accepted_candidate": 1} | {} | [JSON](wrapped_base64/observation.json) |
| concatenated_base64 | extension | gap | {"error": 1, "accepted_candidate": 1} | {} | [JSON](concatenated_base64/observation.json) |
| unpadded_base64 | extension | gap | {} | {} | [JSON](unpadded_base64/observation.json) |
| urlsafe_base64 | extension | gap | {} | {} | [JSON](urlsafe_base64/observation.json) |
| url_percent_escapes | extension | gap | {} | {} | [JSON](url_percent_escapes/observation.json) |
| short_encoded_secret | extension | gap | {} | {} | [JSON](short_encoded_secret/observation.json) |
| utf16_base64_source | extension | gap | {} | {} | [JSON](utf16_base64_source/observation.json) |
| raw_rot13_passage | extension | gap | {} | {} | [JSON](raw_rot13_passage/observation.json) |
| gzip_inside_base64 | extension | gap | {"binary_first_layer": 1} | {} | [JSON](gzip_inside_base64/observation.json) |
| base85_opt_in | extension | pass | {"accepted_candidate": 1} | {} | [JSON](base85_opt_in/observation.json) |
| base85_default | extension | gap | {} | {} | [JSON](base85_default/observation.json) |
| ntlm_pwdump_record | extension | gap | {} | {"needs_format": 2} | [JSON](ntlm_pwdump_record/observation.json) |
| utf16_hash_source | extension | gap | {} | {} | [JSON](utf16_hash_source/observation.json) |
| algorithm_sibling_field | extension | gap | {} | {"needs_format": 1} | [JSON](algorithm_sibling_field/observation.json) |
| sha384_discovery | extension | gap | {} | {} | [JSON](sha384_discovery/observation.json) |
| john_record_in_text | extension | gap | {} | {} | [JSON](john_record_in_text/observation.json) |
| malformed_bcrypt_boundary | extension | gap | {} | {"recovered": 1} | [JSON](malformed_bcrypt_boundary/observation.json) |
| md5_label_on_checksum | extension | gap | {} | {"recovered": 1} | [JSON](md5_label_on_checksum/observation.json) |
| empty_password | extension | gap | {} | {"exhausted_plan": 1} | [JSON](empty_password/observation.json) |
| unicode_password | extension | pass | {} | {"recovered": 1} | [JSON](unicode_password/observation.json) |
| colon_password | extension | pass | {} | {"recovered": 1} | [JSON](colon_password/observation.json) |
| bcrypt_empty_password | extension | gap | {} | {"exhausted_plan": 1} | [JSON](bcrypt_empty_password/observation.json) |
| native_john_empty_md5 | extension | gap | {} | {} | [JSON](native_john_empty_md5/observation.json) |
| native_hashcat_empty_md5 | extension | gap | {} | {} | [JSON](native_hashcat_empty_md5/observation.json) |
| base64_hash | tandem | gap | {"error": 1} | {} | [JSON](base64_hash/observation.json) |
| hex_hash | tandem | gap | {"binary_first_layer": 1, "error": 1} | {} | [JSON](hex_hash/observation.json) |
| double_base64_hash | tandem | gap | {"error": 1} | {} | [JSON](double_base64_hash/observation.json) |
| mixed_plain_and_encoded_hash | tandem | gap | {"error": 1, "binary_first_layer": 2} | {"recovered": 1} | [JSON](mixed_plain_and_encoded_hash/observation.json) |
| unprotected_zip_encoded_member | tandem | gap | {} | {} | [JSON](unprotected_zip_encoded_member/observation.json) |
| base64_encrypted_zip | tandem | gap | {"binary_first_layer": 1} | {} | [JSON](base64_encrypted_zip/observation.json) |
| recovered_password_is_encoded_text | tandem | gap | {"binary_first_layer": 2} | {"recovered": 1} | [JSON](recovered_password_is_encoded_text/observation.json) |

## Interpretation

- A known-answer regex exercises extraction/decoding under a supplied stopping condition; default-checker cases are listed separately.
- A complete scan can contain zero useful candidates. This is processing completion, not proof of coverage.
- An ambiguous bare digest requiring explicit format selection is an intentional safety boundary and passes its contract.
- Hash recovery uses a small finite synthetic wordlist. No failure proves a hash cannot be cracked.
- Read observation.json and each raw process log before attributing a miss to the upstream tool rather than the wrapper.
- No product handoff loop, recursive archive unpacker, or Legion integration was implemented by this test harness.
