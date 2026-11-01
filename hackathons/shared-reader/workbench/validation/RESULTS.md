# SSH and filesystem integration validation — 31 October 2026

The standalone reader workbench is connected to Joshua's filesystem explorer
design at http://127.0.0.1:32965/. It reads a neutral Ubuntu LXD fixture through
pinned, key-only SSH/SFTP, publishes immutable local snapshots, and uses the
existing native Ciphey/John/Hashcat processing loop. No CTF, challenge service,
exploitation, remote credential login using recovered passwords or network scan
was set up or performed.

## Results

| Check set | Result | Evidence |
| --- | --- | --- |
| Real SFTP provider and bounded snapshot tests | 13 passed | transport-tests-final.log |
| Live SSH → local snapshots → native reader queue → saved results | 24 passed | e2e.json, e2e-final.log |
| Full shared-reader regressions, with live worker stopped during the run | 37 passed | shared-tests-isolated.log |
| Focused workspace control and origin-registry regressions | 3 passed; two also appear in the full run above | control-tests-final.log |
| Original filesystem GUI fixture preservation | 235/235 entries match saved byte hashes and permission modes | original-gui-fixture.json |
| Browser checks | Original file, read-only truncated preview, workspace pause/resume from editor, separate derived tab, actual saved-result open, Working state | gui-final.png, verification.json |

The initial concurrent regression run had one existing watcher test time out.
The complete isolated run passed in 20.389 seconds; the live worker was restored.
This suggests timing/resource contention, and is a reason to test loaded-system
latency further, rather than discard the initial failure. No retry threshold was
relaxed to obtain the isolated pass.

## What was exercised

- Pinned host identity succeeds; absent/wrong host keys and wrong client keys fail.
- Server-enforced read-only SFTP rejects attempted writes.
- Binary bytes survive unchanged; spaces, quotes, Unicode and newline filenames
  remain data and retain correctly escaped source URIs.
- Paths outside the configured root and static symlink traversal are refused.
- Denied files/directories, oversize files and collection gaps remain explicit.
- A changed-during-read source is refused rather than submitted as complete.
- A same-size edit with its original mtime preserved creates a new byte version;
  the old snapshot remains intact. Repeated unchanged bytes deduplicate.
- The 4096-byte editor preview cannot be edited/downloaded as a complete file;
  the full remote log reaches the reader, including its late embedded hash.
- The synthetic MD5 target is recovered by the native queue; multilayer Base64
  and atomic-save/directory-move file content reach saved decoded artifacts.
- Removing the real LXD SSH proxy reports disconnect; restoring it resumes
  polling. History is retained through the outage.
- Pausing workspace A prevents new background collection while interactive
  browsing remains available. A new input in workspace B still processes.
  Resuming A collects and decodes the retained file.
- Every reported SSH input carries a matching origin SHA. Identical decoded
  bytes from multiple paths retain multiple origins and can reuse native work.
- Alerts refer to real files in the tool output tree. Dismiss hides the alert
  without deleting the file, graph, queue or evidence.
- Foreign Host/Origin, mutation without a token, and result-path traversal fail.
  Evidence HTML receives a restrictive sandbox policy.

Filesystem-Access supplied its reusable workspace frontend during this work;
the final installed frontend was verified in the browser. The reader backend,
workbench and shared folder contract remain independent of FlagMap's source.
The original explorer HTML and 235-entry fixture were left unchanged.

## Limits and next tests

1. Load/fairness: several busy workspaces, bounded pause latency, long native
   attempts, UI responsiveness, and CPU/network contention. Requested pause is
   implemented, but the API explicitly reports worker observation unsupported;
   it does not yet acknowledge the exact instant every worker reaches idle.
2. Disk pressure/crash recovery: storage quotas, full/read-only disks, process
   termination during publication, interrupted native attempts and durable alerts.
   Total retained snapshot history currently has no disk quota.
3. False positives and notification volume: real source/log/binary corpora can
   generate several decoding layers and unverified cipher hypotheses. Test
   grouping/ranking without hiding genuine uncommon results.
4. Remote event coverage: polling can miss files created and deleted between
   polls. An explicitly installed remote event source would be needed for stronger
   coverage; no such agent was installed here.
5. Hostile concurrent mutation: SFTP v3 cannot atomically guarantee no-follow
   traversal or a stable snapshot on arbitrary adversarial servers. The fixture's
   server-side chroot/read-only restrictions provide an additional boundary.
6. Host adapter: stable project/device/session mapping, workspace switching and
   stale responses, selected text/draft revisions, optional completion events,
   and additional job types, while preserving standalone operation.

The workbench and neutral container are left running on localhost. No boot
autostart was added. Stop/restart and configuration details are in ../README.md.
