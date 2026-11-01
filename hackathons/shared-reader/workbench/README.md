# Standalone filesystem reader workbench

This component browses configured sources over read-only SFTP, collects complete
bounded snapshots and submits them through the existing shared Ciphey/John/Hashcat
reader. It has no dependency on FlagMap's source or APIs. The explorer/editor is
a separately licensed copy of Joshua's existing Filesystem-Access demo (COPYING,
NOTICE); its original files have not been edited.

Open **http://127.0.0.1:32965/**. The source selector offers the neutral SSH
container, saved local outputs, and the original filesystem demo (browse only).
Double-click opens a file. Editing/saving keeps browser drafts; Download exports
a copy. Remote originals cannot be saved through this component.

Start/Pause in the top right controls background jobs for the configured project,
independently of the displayed directory or source. It gates remote collection
and both readers. A running bounded operation finishes before pausing; pending
jobs and all evidence remain. Other projects in the shared worker continue.
Interactive browsing stays available, and changing location never resumes work.
“Include current folder” explicitly adds a collection scope; the subfolder
checkbox controls recursion. Workspace state persists across server restarts.

The Working & alerts panel shows coverage/connection errors and queue counts.
Newest completions appear first. Unverified ROT13/reversal-only hypotheses stay
in the evidence graph without creating default completion alerts. An alert opens the actual saved tool artifact
in a separate editor tab. Dismiss only hides the alert. Derived layers and
classical-cipher hypotheses need review; a readable candidate is not proof of
the historical original. All graph details remain in the evidence report.

## Local configuration and running

`private/config.json` contains provider configuration, project location, key
paths, known-hosts path and polling interval. Private keys stay on the backend;
the browser never receives them. The folder is mode 0700 and excluded by the
component .gitignore. Dependencies are pinned in requirements.lock.

```bash
cd /home/joshua/Documents/ChatGPT/Hackathons
uv venv shared-reader/.venv-ssh --python 3.12
uv pip install --python shared-reader/.venv-ssh/bin/python -r shared-reader/workbench/requirements.lock
shared-reader/.venv-ssh/bin/python shared-reader/workbench/server.py --config shared-reader/workbench/private/config.json
```

One shared reader daemon already watches the configured parent project directory.
This server only publishes snapshots; it does not create a second native worker
or install autostart. For another installation, run the existing shared-reader
watch command on the configured project parent. The reader automatically
reconciles input changes within 30 seconds, including work retained while paused.

The current configured output directory is
`/home/joshua/Documents/FlagHop/ssh-reader-integration/`.
FlagMap is the current product name; the physical directory comes from existing
configuration. This work does not rename or migrate user storage.

Layout:

- `ssh-input/<connection>/<path hash>/<content SHA>.bin`: immutable complete inputs.
- `ciphey/artifacts/<content SHA>.bin`: derived bytes, openable from alerts.
- `password-crackers/jobs/<target>/recovered.txt`: native recovered results.
- `reader-origins.json`: source URI, snapshot ID, connection/session identity,
  source path, byte count, SHA-256, collection metadata and optional project/device IDs.
- `reader-control.json`: workspace-wide requested running/paused state.
- `reader-bridge.json`: durable collection scope/history/notification state.
- `reader-report.json` / `.html`: reader graph and reports, including matched origins.

Metadata and temporary spool files are at project root, outside the reader's
tool-input layout, preventing feedback loops. Changes publish a new content
version; old bytes and provenance stay available. Identical content may share
native work while origin records remain separate.

## API for Filesystem-Access / host adapters

All endpoints bind to loopback. Host/Origin checks reject foreign requests;
mutations need the session's `X-Reader-Token` and matching Origin. This is a local
prototype API, not an authenticated multiuser network service. No CORS is enabled.
Specify `?source=<configured source ID>` for provider-specific operations.

| Endpoint | Contract |
| --- | --- |
| GET `/api/session` | Provider metadata, configured source labels, capabilities, connection state, mutation token. Disconnection still returns metadata so cached results remain usable. |
| GET `/api/list?path=...` | Real bounded directory entries; names/path/mode/size/mtime/kind. No invented entries. |
| GET `/api/preview?path=...` | Up to 4096 bytes as base64, explicit truncated/coverage state. Never analysis input. |
| POST `/api/control` | `{running: boolean}` for the entire configured workspace. Current policy is finish-bounded-step. |
| POST `/api/scope` | `{path, running, recursive}` explicitly includes/enables a remote collection scope beneath its configured source root. Still subject to workspace control. |
| POST `/api/snapshot` | `{path}` collects one complete remote file and returns its origin/snapshot record. Deliberate collection can occur while background analysis is paused. |
| GET `/api/status` | Requested running state, per-scope connection/coverage/errors, snapshot counts, actual reader/hash states, newest saved-result alerts. Fresh process-checked activity heartbeats support observed running/pausing/paused states; missing/stale heartbeats return unsupported. Collection and worker storage errors remain explicit. |
| POST `/api/dismiss` | `{id}` hides this derived-artifact notification, retaining file/queue/evidence. |
| GET `/api/result?path=...` | Bounded bytes for an allowlisted derived tool artifact, for a separate editor tab. |
| GET `/reports/...` | Reader reports and evidence beneath this project. |

`snapshot_id` is SHA-256(connection ID + NUL + original path + NUL + content SHA).
`id` on a derived alert is its content SHA, with `result_path`, byte size,
transformations, matched origins, actual node state and first-observed completion
time. Alert origins are bounded to eight with `origins_total` and
`origins_truncated`; complete provenance remains in the graph/report. Report `configuration` supplies engine/configuration identity. Optional
`project_id` (config) and `host_id` (provider) are mappings supplied by a host;
standalone mode leaves them absent/null rather than inventing devices.

The current server instance binds one project; a host adapter must bind a separate
instance or explicit workspace routing to switch projects. It must guard late UI
responses using its workspace/session identity. Selected-text/draft analysis and
general job registration are future adapters, not implemented claims here.

## Bounds and limitations

Each complete file is limited to 2 MB, each poll to 512 files / 32 MB / 256
directories and a two-second soft scheduling quantum (an in-flight SFTP call
can take up to its timeout). A durable traversal cursor continues later polls
instead of repeatedly scanning the same prefix. GUI listings are limited to
2000 entries; background collection streams larger listings. Gaps are explicit. Every eligible file
is hashed each cycle, so same-size/preserved-mtime edits are detected. This is
polling, not a remote Watchdog event subscription: a file created and deleted
between polls can be missed. A failed/partial cycle does not infer deletion.

Static symlinks and paths outside the source root are refused. SFTP v3 cannot
guarantee atomic no-follow traversal against a hostile concurrent symlink swap;
use a server-side chroot/read-only account, as the fixture does. The collector
checks size/mtime/mode before and after reading but cannot prove an adversarial
same-metadata edit during the read was atomic. Arbitrary hostile servers need
stronger snapshot facilities. Retained remote snapshots default to 512 MB and
10,000 versions, reserving 16 MB free space; configure `max_snapshot_bytes`,
`max_snapshot_versions`, and `min_free_bytes`. Reaching a limit defers collection
without deleting history. These limits cover remote snapshots, not every native
diagnostic/derived output. Per-file origin journals, fsynced atomic publication,
and replay reconcile interrupted snapshot/index commits. Workspace inventory
runs in bounded round-robin batches and storage failures are isolated and retried.
Requests beyond eight concurrent workbench handlers receive retryable 503s;
Start/Pause has reserved capacity. A restarted bridge's nonce is refreshed once
by the browser adapter while preserving open tabs and drafts.

## Neutral SSH fixture and lifecycle

`reader-ssh-fixture` is a fresh cached Ubuntu 24.04 LXD container: no CTF image,
challenge, exploitation or network scan. Only loopback networking remains inside
it. LXD maps localhost port 32222 to its localhost SSH port. Key-only OpenSSH
forces read-only internal-sftp in `/srv/reader-jail`; host keys were pinned through
the trusted LXD control plane. The fixture has no boot autostart. A per-container
`raw.lxc` mount setting avoids this laptop's cgroup-layout boot failure; no global
LXD/kernel settings were changed. Memory/CPU limits were requested; enforcement
is not claimed because LXC warned about the host's cgroup layout.

The server PID is in `validation/server-pid`; verify its command before stopping
it with SIGTERM. `lxc stop reader-ssh-fixture` stops the fixture only. After a
container restart, run `lxc exec reader-ssh-fixture -- /usr/sbin/sshd -f
/etc/ssh/sshd_reader_config` to restore its test SSH listener. The independent
shared reader process is recorded in `validation/reader-reload.json`; stopping
the GUI is not authorization to stop all projects' reader jobs.

## Further integrations that preserve independence

- Host “Open Files/Open Result” actions pass project/device/session context to
  this service through a small adapter; FlagMap displays the resulting evidence.
- A workspace job registry can use the same Start/Pause and Working model for
  future background adapters, with separate explicit disconnect controls.
- SSE/events can replace status polling and publish completion links to a host
  notification panel; alerts carry saved artifact IDs, not transient text.
- Explicit selected-text/local-draft analysis records revision/hash and ranges.
- Additional read-only sources (local drop folders, SFTP, archives, approved
  object storage) implement the same snapshot contract without changing decoders.
- A CLI/API and structured report export let other applications reuse the service.

These are extension points, not changes already made to FlagMap. The companion
Filesystem-Access contract is at `../../filesystem-reader-integration/CONTRACT.md`.
