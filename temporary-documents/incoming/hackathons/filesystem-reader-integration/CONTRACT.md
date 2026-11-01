# Filesystem, reader and FlagMap integration

Draft for the Filesystem-Access and Ciphey chats, 31 October 2026.
This records an integration proposal, not features already shipped in FlagMap.
Includes Joshua's confirmed workspace-control and results workflow below.
Start/Pause covers all background jobs in the current workspace, initially cipher
analysis and password cracking. SSH connection handling and pause timing remain
pending.

## Implementation status

The standalone filesystem workbench now has the reusable workspace controller,
top-right control, Working/Alerts view, saved-result editor binding and HTTP
adapter described in [README.md](../../../../hackathons/filesystem-reader-integration/README.md). The generated asset is installed in
`shared-reader/workbench/reader-link.js`. Flagmap Builder subsequently added the
main-app project-ID routes, controls, alerts and hosted filesystem/editor.
The standalone endpoint exposes one workspace; the main app's real A/B workflow
passed native reader acceptance checks. See [MAIN_APP_INTEGRATION.md](../../../../hackathons/filesystem-reader-integration/MAIN_APP_INTEGRATION.md).
The current reader
backend reports worker observation unsupported, so the UI distinguishes a saved
Pause request from confirmed worker completion.

## Intended workflow

1. Select a mapped device in FlagMap and open Files for an associated session.
2. Browse the entries actually returned by that session. Unknown or inaccessible
   directories stay unknown or inaccessible; the UI never invents their contents.
3. The top-right Start/Pause button controls all background jobs in that workspace,
   initially cipher analysis and password cracking. Opening a file is not the
   unconditional analysis trigger.
4. Double-click a readable file to open it in the existing tabbed editor.
   Independently collect a bounded, complete snapshot for the readers. The
   editor's existing 4 KiB preview is not an analysis input.
5. Keep active analysis in the side panel's Working section. Save each derived
   output as a real file beneath the configured project folder and producing
   tool's directory. Completed outputs create alerts at the top of the alert list.
6. Clicking a completion alert opens the saved derived file in the filesystem
   editor. Dismiss hides the alert while retaining the file and evidence.
7. Return a result to FlagMap with its project, device, source and evidence links.
   A decoding candidate is not automatically a confirmed flag or vulnerability.

The explorer/editor, remote transport and reader remain usable without FlagMap.
FlagMap supplies project/device context and displays their results through a
small adapter rather than copying the decoder or filesystem implementations.

## Current sources and integration points

- Explorer/editor: `/home/joshua/Projects/legion/.state/research/penelope-explorer-20261031/`.
  Existing Penelope demo: `http://127.0.0.1:32965/` when its lab server is running.
  Supports real listings, previews, properties, tabbed text and browser drafts.
- Readers: `shared-reader/shared_reader/project.py` and `watch.py`, with
  Cipher Watch and Hash Watch behind the persistent project content graph.
- FlagMap's current host identity: project-scoped integer `host.id` from
  `app/web/runtime_workspace_identity.py`; project identity is the Hub project's
  string `id` in `app/api/hub_contracts.py`.
- Current Hub file API lists/downloads local project files. Its `HubFile` only
  contains `path` and `size`; it does not model remote sessions or provenance.
  Keep remote Files separate from that existing API until an explicit extension
  preserves its current behaviour.
- Current project storage setting is obtained from the Hub service. It still
  resolves to `Documents/FlagHop` on this machine, with the old Hackathon path a
  compatibility symlink. The new product name is FlagMap; do not hardcode either
  folder name or migrate user files as part of this adapter.

## Ownership during implementation

- Ciphey chat: SSH/SFTP transport, immutable snapshot collection, reader ingestion
  and standalone bridge/server. Confirm its exact files and API before editing
  the shared explorer HTML or reader modules from Filesystem-Access.
- Filesystem-Access chat: integration review, original-file/editor constraints,
  the host-facing contract and product questions. No overlapping source edits.
- Flagmap Builder: the active host application and map/action-panel design.
  This proposal does not change that chat's files, layout or migration work.

## Required boundary data

Names below describe required information. They are not a claim that an HTTP
endpoint or existing reader field already implements them.

### Context and session

- `project_id`: FlagMap's stable Hub ID, not a project display name or directory.
- `host_id`: the device ID scoped to that project; absent in standalone mode.
- `connection_id`: persistent connection identity when available.
- `session_id`: the live shell/SFTP session. Reconnection can create a new session.
- `transport`: `penelope`, `sftp` or a future explicit adapter.
- `capabilities`: list, preview, complete snapshot, and optional watch. No write
  capability is implied by opening an editor.
- `connection_state`: connected, disconnected or reconnecting, separate from the
  state of a cached local snapshot or an analysis job.

Use the server's opaque entry identifier for operations. Display names and paths
are data, not shell commands or local extraction paths. Preserve unusual names.

### Source version and coverage

- An immutable `snapshot_id` plus full-content SHA-256 and collected byte count.
- Original remote path/entry ID, session identity, collection time and observed
  metadata such as size and modification time.
- Explicit coverage: complete, preview-only, size-limited, changed-during-read,
  unreadable, missing or disconnected. Never label an incomplete snapshot complete.
- A collection record links the content hash to its origin. Identical bytes on
  two devices may share analysis work within the project, but keep both origins.
- Changed source bytes create a new version. Results for the earlier version
  remain available and are visibly historical.

### Analysis and results

- `analysis_id`, source snapshot ID, engine/configuration identity and requested
  input kind: original snapshot, local draft or selected text.
- Queue/execution state independent of outcome and coverage. Preserve actual
  reader states and notices rather than flattening them into one success boolean.
- Every derived artifact links to its parent artifact, transformation and source
  version. Byte offsets refer to the stated parent; decoded offsets are not
  silently presented as positions in the remote original.
- Preserve limits, unresolved formats, unsupported formats, errors and interrupted
  work. A processed file is not a clean verdict; a candidate is unverified.
- Render recovered/decoded bytes as text or a bounded binary view. Do not render
  file content as active HTML or execute source expressions.

### Workspace control and notification lifecycle

Confirmed by Joshua in Filesystem-Access:

- One top-right Start/Pause control for all background jobs in the current
  workspace, including cipher analysis and password cracking for now.
- Its purpose is workspace switching: pause A's background jobs, work in B, and
  later resume A with its pending work and completed results retained. The
  control belongs to the whole workspace, regardless of the visible tool/folder.
- Active work is tucked into the side panel's Working section.
- Completed output is a real file under Documents → application folder →
  project → tool. The literal application-folder spelling is being clarified;
  the adapter uses the configured project directory.
- A completion alert is inserted at the top of the alerts list.
- Click opens the resulting file with the filesystem editor. Dismiss dismisses
  the alert; it does not delete the file or its provenance.

Implementation requirements proposed to support those choices:

- A stable workspace `scope_id` identifies the background-job scope independently
  of editor tabs and the currently displayed folder. Individual collection jobs
  can have explicit folder/recursion settings without changing control scope.
- Persist requested `running`/`paused` state per scope. A local Pause must not
  stop the global reader service or another workspace's work.
- Paused A must release its active compute capacity at the chosen pause boundary
  so B can make progress. A paused queue cannot monopolize a shared worker slot.
  Returning to A or opening one of its files must not silently resume its jobs.
- Switching workspaces selects the destination workspace's own control state.
  Automatically pausing/resuming on navigation, or restricting the application to
  one running workspace, has not been requested and must not be inferred.
- Keep requested state separate from actual worker state. If finishing a bounded
  step is chosen, show Pausing until that step finishes, then Paused.
- Pause retains pending work, completed files and results. Its exact treatment
  of in-flight work is pending rather than silently choosing cancellation.
- All workspace background workers should participate through job-specific
  pause/resume capabilities; the initial implementation includes the two readers.
  This control does not itself grant authorization to launch new jobs or targets.
- SSH handling is under discussion. The recommendation is to include background
  SSH/SFTP collection/sync jobs in Start/Pause while leaving their connection and
  deliberate interactive browsing available. A separate Disconnect action would
  close the connection. This is a proposal, not Joshua's confirmed choice.
- Emit completion only after the resulting file has been successfully written
  and is available to the editor. A partial/error outcome is visibly different
  from a usable decoded-result alert.
- Each alert references a stable result/artifact ID, its source version, project,
  producing tool, actual output-file reference and completion time.
- A notification identity deduplicates polling/restart delivery. A new result
  version can produce a new alert; refreshing the same report cannot.
- Store dismissal separately from analysis/result status. Proposed persistence
  is project-local, so reopening the project does not resurrect dismissed alerts.
- Resolve output-file references through the component's artifact API. The UI
  must not turn arbitrary remote paths or HTML report links into editor targets.
- While a scope is paused, already collected files and completed results remain
  browsable. Opening one does not silently resume background analysis.

## Editor and navigation behaviour

- Original, local draft and derived result are visibly distinct documents.
- Saving retains the demo's local-draft behaviour; download exports a copy.
  Remote writes remain a separate, unimplemented capability.
- A draft analysis uses the draft revision/hash. It must not reuse results for a
  different remote version merely because the filename matches.
- Selected-text analysis records the document revision and selected range;
  decoded-result ranges remain relative to the result document.
- Opening a result on another device or switching projects cannot repaint the
  current editor with a late response from an earlier request.
- A disconnected session can still show collected snapshots and completed
  results, clearly marked as cached. Live refresh remains unavailable.
- FlagMap receives a component action such as Open Files/Open Result with opaque
  IDs, not a raw filesystem path or a blanket browser filesystem permission.

## Product choices pending

1. Should workspace Pause keep SSH connected while pausing background collection,
   or should it also disconnect? Joshua has requested benefits/downsides first.
2. Does Pause finish the current bounded work step or interrupt/resume immediately?
3. Does the literal `flagmop` folder mean FlagMap, using the project's configured
   save folder, or is that spelling intentional?

The earlier automatic-on-open recommendation and results-beside-editor layout
are superseded by Joshua's Start/Pause and Working → alert → open-file workflow.
Whole-file vs selection vs background-collection priority has not separately
been answered; selected-text decoding remains a possible later action.

These remain configuration/UI decisions. Transport and provenance work can
proceed independently; do not enable new collection scope based on silence.

## Integration checks

- Open a real file through each supported transport; compare complete snapshot
  hashes with the source and verify original bytes/modes remain unchanged.
- Analyse content beyond byte 4096 to demonstrate that preview truncation does
  not silently truncate analysis. Show explicit size-limit outcomes.
- Exercise changed-during-read, permission denied, removal, disconnect/reconnect,
  symlinks, spaces, quotes, Unicode and newline-containing names.
- Show separate source versions after a remote edit, and correct provenance for
  identical content from different devices or sessions.
- Restart the reader/bridge and verify durable queue/result links, deduplication
  and no feedback loop from generated reports.
- Distinguish original snapshot, unsaved local draft and derived result. Preserve
  the existing editor's double-click, tabs and keyboard behaviour.
- Start/Pause one scope while another remains active. Switch away and back;
  retain each scope's requested state and queue without stopping the service.
- Verify Working → completion alert happens after the output file is available;
  click opens that exact artifact and Dismiss retains it. Poll/restart must not
  duplicate the same alert or restore an already dismissed notification.
- Run isolated UI checks without taking over Joshua's desktop. Existing 235-entry
  Penelope fixture stays unchanged; any new SSH test inputs are separately labelled.

The Ciphey chat owns its currently authorized neutral SSH/container test. This
document does not initiate scans, credential use, a CTF or additional targets.
