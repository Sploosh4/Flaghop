# Filesystem workspace primitives

Implemented first for the standalone filesystem/editor workbench, then connected
to the main app with Flagmap Builder. The main app now routes controls/results by
stable project ID and hosts the filesystem editor. See
[MAIN_APP_INTEGRATION.md](MAIN_APP_INTEGRATION.md) for that integration.

## Available now

- A top-right Start/Pause control for the entire configured workspace, shared by
  background collection, cipher analysis and password cracking through the reader
  backend. Changing folders or filesystem sources does not change that scope.
- A transport-independent controller supporting independently registered
  workspaces. Selecting a workspace never starts its jobs. Queues/results and
  durable requested state are retained by each workspace's backend.
- Per-workspace serialization and stale-response protection. Old reads cannot
  undo a Pause, controls finishing for A cannot repaint B, and a result arriving
  after A → B → A navigation cannot unexpectedly open in the editor.
- Newest-first result alerts, persisted dismissal through the existing backend,
  and an always-reachable, collapsed Working section. Alerts scroll separately.
- Open result loads the actual saved artifact into a workspace-scoped editor tab
  with its real filename, tool path and original-source attribution. Binary and
  partial results remain read-only previews; text edits stay in browser drafts.
- Existing remote browsing, local outputs and the original 235-entry filesystem
  demo remain available. No source files or remote write capability were added.

The generated component is installed at
`../shared-reader/workbench/reader-link.js`, served by the existing workbench at
`http://127.0.0.1:32965/`. Refresh the page to load it. Its previous UI adapter is
preserved in `validation/before-reader-link.js`.

## Source boundaries

- `web/workspace-controller.js`: controller and normalized workspace snapshots;
  no DOM, no reader-engine imports and no global service/process stops.
- `web/reader-adapter.js`: the current workbench HTTP adapter. It uses the
  session token in POST headers, never URLs, and does not retry control mutations
  automatically after an uncertain response.
- `web/workspace-panel.js`: controls and Working/Alerts view.
- `web/mount-reader.js`: binding to the existing filesystem and tabbed editor.
- `build.py`: atomically combines these dependency-free scripts into one asset.

The Ciphey chat owns the SSH/SFTP bridge, durable queue/control files and reader
engines under `../shared-reader/`. This component reuses those APIs.

## FlagMap host interface

The controller is exported as `globalThis.FlagMapWorkspace.WorkspaceController`.
Register each actual workspace with its stable project ID and its own adapter:

```js
const controller = new FlagMapWorkspace.WorkspaceController({
  openResult: ({workspaceId, alert, result}) => editor.openSavedResult({workspaceId, alert, result})
});
controller.register({id: project.id, label: project.name, adapter});
controller.subscribe(view => renderWorkspaceControls(view));
await controller.select(project.id); // reads state, never resumes work
await controller.setRunning(false); // current workspace only
```

Adapters implement:

| Method | Contract |
| --- | --- |
| `read()` | Return `running: boolean`, `alerts: []` and available status/provenance fields. |
| `setRunning(boolean)` | Persist requested state; acknowledge with `{running: boolean}`. |
| `dismiss(alertId)` | Persist notification dismissal; retain its file/evidence. |
| `result(alert)` | Read that saved artifact; do not execute it or write the original. |

The normalized snapshot retains backend status fields. Optional `observed_state`
is `running`, `pausing` or `paused`; an absent/unsupported observation stays
unknown. The UI says **Pause requested** until actual worker completion is
observable. A successfully saved request is not proof of worker termination.

Each alert contains `id`, `result_path`, `completed` (Unix seconds), `size`,
`origins`, and available outcome/label/transform fields. Editor identity includes
both workspace and result ID, so identical content on different workspaces does
not collide. Host-side project routing/access checks remain the backend's job.

## Current integration limits

- The standalone backend configures one workspace. The main app supplies real
  project IDs and workspace-specific API adapters; the native reader A/B workflow
  has been checked there. Changing the standalone filesystem-source dropdown
  remains distinct from switching main-app workspaces.
- Until the backend has a real project ID, the standalone mount uses its endpoint
  identity. That fallback is not a project migration/export identity.
- Pause uses the existing cooperative, finish-current-bounded-step policy. No
  immediate process suspension or arbitrary-tool cancellation was implemented.
- The current reader backend explicitly reports worker observation unsupported;
  the component therefore cannot assert the moment all workers have stopped.
- Saved-file locations come from the configured project folder. The component
  does not rename/migrate the current FlagHop folder to FlagMap or `flagmop`.
- Future background tools must implement workspace-aware control on the backend.
  Registering a view alone does not pause an unintegrated process.

## Build and verification

From `/home/joshua/Documents/ChatGPT/Hackathons`:

```bash
python3 filesystem-reader-integration/build.py
python3 filesystem-reader-integration/build.py --output shared-reader/workbench/reader-link.js
/home/joshua/Projects/legion/.tools/node/bin/node --test filesystem-reader-integration/tests/workspace-controller.test.cjs
```

The browser check requires the existing neutral SSH workbench running on 32965:

```bash
/home/joshua/Projects/legion/.venv/bin/python filesystem-reader-integration/tests/test_workbench_ui.py
```

It runs Chrome headlessly with DISPLAY/WAYLAND_DISPLAY removed and a separate
profile. It exercises real APIs, pauses/resumes and restores initial requested
state, opens actual derived files, and dismisses a synthetic lab result alert
while verifying that its bytes remain intact. It does not create/modify original
fixtures. It is not a general test to run against a user's live investigation.

Recorded verification: 18 controller/adapter tests, 25 browser checks and 3
existing backend workspace-control regressions passed. See `validation/`.
Browser screenshots are in the capped Legion project's
`.artifacts/disposable/workspace-primitives-ui/` directory.
