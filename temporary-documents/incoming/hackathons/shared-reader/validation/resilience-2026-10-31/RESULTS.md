# Reader load, recovery and false-positive validation

31 October 2026, Australia/Perth. Local synthetic fixtures and the existing neutral
Ubuntu SSH/SFTP container only. No CTF, challenge service, exploitation, target
scan or use of recovered passwords for authentication was set up or performed.

The reproduced gaps were fixed and the affected checks rerun. **145 automated
tests pass**, plus the five native experiment groups, the real SSH/HTTP load run,
and a live browser restart/draft check. The normal catalog-aware reader service
and standalone workbench are running again; the workbench's original requested
running state was restored. The 235-entry original GUI fixture still matches
its saved byte hashes and permission modes.

## Measured results

| Area | Evidence and result |
| --- | --- |
| Native workspace load | 8 workspaces, 247 input files. B's first decoded result in 0.95 s while A had inventoried only 50 files. A's complete inventory took 5.519 s. All 247 originals preserved. |
| Pause/fairness | Pause acknowledgement in 0.103 s. While A stayed paused, B recovered a synthetic hash in 0.41 s. Resuming A collected its retained new file. |
| Real SSH collection | All 700 files collected in 2.235 s with all hashes and origin records verified. Restart retained all 700 snapshots and the paused state. New remote files were under /load-tests/2a9a6a01, outside the live GUI's /files collection scope. |
| HTTP load | 160 status requests from 8 concurrent clients: all 200 responses. p50 3.01 ms, p95 4.74 ms, maximum 6.31 ms. |
| Overload | 32 simultaneous listing requests: 8 admitted and 24 explicit retryable 503 responses, with the server remaining healthy. Reserved Start/Pause capacity acknowledged Pause in 11.22 ms. |
| Filesystem failure | Real ENOSPC and EROFS on a private 64 KiB tmpfs; previous complete result retained and retry succeeded after restoring capacity/write access. The host disk was not filled. |
| Process interruption | SIGKILL during object staging exposed no partial final artifact; restart succeeded and removed abandoned staging. Guarded child stopped when its owner died. A bcrypt batch marked running was interrupted, replayed after restart, and independently verified as recovered. |
| Negative/positive controls | 36 negative files caused **0 automatic cracking targets**. All 12/12 positive goals passed with per-source provenance, including MD5/SHA-1/SHA-224/SHA-256/SHA-384/SHA-512 and layered encodings. All 48 source files unchanged. |
| Large listings | Background collection passed a separate 2,105-file test despite the GUI's explicit 2,000-entry preview/listing limit. |
| Browser recovery | Restarted bridge with an unsaved draft open; first Pause action refreshed its stale nonce, the draft stayed intact, observed Paused appeared, and Resume restored the initial running state. Original remote bytes were unchanged. |

These are bounded synthetic workload measurements on this laptop, not throughput
or worst-case pause guarantees for arbitrary files, servers or cryptographic costs.

## Reproduced gaps and fixes

| Gap | Before | After |
| --- | --- | --- |
| Prefix starvation | 700-file folder collected [512, 512, 512] across three polls; budget exhaustion was also mislabelled disconnected. | Durable traversal cursor collected [512, 700, 700]; scheduling yields remain connected and explicitly partial until coverage completes. |
| Storage fault terminated collection | Injected ENOSPC escaped and killed the loop. | Loop survives and retries. Per-workspace backpressure no longer stops other workspaces; errors are visible. |
| Premature complete origin | A complete origin could be recorded although snapshot publication failed. | A durable per-file journal marks publication pending until complete bytes exist; restart reconciles a published file if the version-index commit failed. |
| Poisoned immutable artifact | Interrupted direct write left a partial final object; retry failed integrity checks. | Fsynced staging and atomic publication expose complete bytes only, preserving previous complete outputs. Shared artifacts, decoded outputs, recovered outputs, protected-file snapshots and plans use this path. |
| Missing provenance after restart | Source row could commit before reach edges; ordinary re-ingestion skipped the existing row. | Re-ingestion repairs missing reach edges without duplicating the source. |
| Missing recovered export | Verified recovery could commit before recovered.txt/recovered.json was written. | Missing exports are restored from the verified persisted recovery, and export failures are retryable. Existing mismatching evidence is refused rather than overwritten. |
| Checksum false positives | 12 of 24 checksum controls were selected for automatic recovery by the detector. | 0 of 24 selected; file-integrity metadata stays review-only. Credential positive controls still route to recovery. |
| Hypothesis alert flood | 24 pure ROT13/reversal hypotheses produced 24 default completion alerts. | 0 default alerts for these hypotheses, while all 24 artifacts remain. Working reports retained hypotheses; saved artifacts/full evidence remain accessible. |
| Pause acknowledgement unavailable | API exposed requested state only. | Separate activity heartbeat permits running/pausing/paused acknowledgement. Missing/stale activity remains unsupported; availability heartbeat is separate. |
| Saturation and restart UX | Parallel operations had no explicit handler admission limit, and bridge restart could require retrying a stale-token action manually. | Bounded admission, retryable overload response and reserved control capacity; one automatic nonce refresh preserves tabs and drafts. |
| Lost coverage warnings across batches | A later successful batch could hide an earlier unreadable file. | Cumulative sweep notices and last-cycle coverage retain the partial result. |

The collector uses small per-file journals plus batched aggregate indexes to
avoid rewriting the entire growing origin/version index for every unchanged file.
Native inventory is bounded and round-robin; source reports are batched. Result
status builds edge lookup once and returns at most eight origins per alert with
explicit total/truncation fields; the full graph retains every origin.

## Test evidence

- shared-regressions.log: 54 shared-reader tests, including catalog/control checks.
- hash-regressions.log: 24 hash-reader tests.
- cipher-regressions.log: 17 cipher-reader tests.
- transport-regressions.log: 13 real SSH transport tests.
- resilience-tests.log: 17 new fault/load/coverage regressions.
- frontend-tests.log: 20 workspace/controller/adapter tests.
- before.json, after-final.json: same reproducible baseline experiments.
- native-metrics.json: process interruption, native workload and per-source positive oracles.
- http-ssh-metrics.json: real SSH and loopback HTTP load/overload measurements.
- tmpfs-evidence.json: actual private-filesystem error codes and recovered writes.
- ui-recovery.json, gui-recovery.png: live browser recovery/draft evidence.
- verification.json: live service readback, code hashes and consolidated results.

The first full regression launch held an outer compute lock, which correctly
prevented its CLI watcher subtest from starting. That harness run was stopped;
the complete suites were rerun without the outer lock, allowing each CLI test to
own the lock normally. All final suites pass. This was a test-harness error, not
a production watcher failure. The single normal service was restored afterward.

Filesystem-Access's concurrent catalog/availability integration was preserved;
activity status uses its own file to avoid overwriting availability. No FlagMap
host source was changed in this chat. Its separate main-app acceptance is not
counted in this report's totals.

## Remaining limits

- Polling cannot capture files created and deleted entirely between observations.
  The explicit probe created/deleted five files between polls and collected zero.
  Coverage now identifies this sampling model. Stronger coverage needs an explicit
  remote event/snapshot source; no extra remote agent was installed here.
- Snapshot retention defaults to 512 MB / 10,000 versions with 16 MB free reserved;
  reaching a limit defers collection and keeps history. This is not an overall
  quota on all native diagnostics/derived outputs. Sustained retention still
  needs an operator policy and capacity monitoring.
- Deliberately corrupted metadata is detected and refused, with artifact bytes
  preserved; arbitrary corruption is not silently repaired by guessing controls
  or dismissal state. Atomic publication and journals cover the tested interrupted
  write/commit paths, not every possible hardware/storage failure.
- SFTP still cannot guarantee an atomic snapshot against a hostile concurrent
  same-metadata mutation or symlink swap on arbitrary servers. Server-side chroot
  and read-only access remain part of the tested fixture boundary.
- The negative corpus is limited. Zero unnecessary cracking targets here does
  not establish a universal false-positive rate or prove decoded text is the
  historical original. Candidate layers and hypotheses still require review.
