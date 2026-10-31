# Workspace readers

Status: app integration included in the 31 October 2026 checkpoint. This does not install the separate reader engines/service. See [delivery status](project-status.md) for the code and dependency boundary.

The header's Start/Pause control applies to the selected project's registered
background readers: cipher analysis and password recovery. Selecting a project,
changing views and opening files do not enable processing. New projects start
paused. Pause preserves queues and results and takes effect at the reader's next
bounded step; the UI shows **Pause requested** because worker-stop observation is
not yet supported.

The reader runs as a separate service. Its repeatable `--projects-catalog` option
enrolls managed IDs and folders from the Hub's `project-hub.json`, including custom
save locations. It publishes a matching, fresh
`.reader-state/worker-status.json` heartbeat. Missing, stale or withdrawn
registration shows **Reader unavailable** and prevents Start. Pause remains
available without a live worker. This app never starts or stops a global engine
process to control one project.

Results and Working come from the actual `reader-report.json`, password queue
and saved tool artifacts in each configured folder. Alerts are newest first.
Hypothesis-only transformations remain browsable but do not produce automatic
alerts. Dismiss writes `reader-alerts.json`; it does not delete the result or
provenance. Existing standalone bridge dismissals are also respected.

Files reuses the filesystem/editor component for local project folders and saved
results. Originals remain read-only to the backend; text edits are browser drafts.
Binary and incomplete results remain read-only previews. Editor instances and
draft identities are scoped to project IDs. The standalone SSH workbench stays
available separately; no SSH connection is closed by these controls. Mapping its
remote sessions into the main Files view is separate work.

## Host API

All routes below are under `/api/hub/projects/{identifier}`. They resolve the
catalog's stable ID directly, independently of the currently open database.

- `GET /background`: requested state, availability, actual Working and alerts.
- `POST /background/control`: strict JSON `{ "running": true|false }`.
- `POST /background/alerts/{alert_id}/dismiss`: retain the saved result.
- `GET /background/results/{alert_id}`: bounded saved bytes and provenance.
- `GET /filesystem`: the same-origin filesystem/editor view.
- `GET /filesystem/api/session`, `/list?path=...`, `/preview?path=...`:
  project-bounded local file access. Existing `/files` and `/file` APIs remain.

`frontend/src/hub/reader/workspace-controller.js` is an app-owned ESM adaptation
of `filesystem-reader-integration/web/workspace-controller.js`, adding explicit
deselection. `hub-files.html` is an app-owned snapshot of the shared reader's
filesystem/editor, with scoped API and draft identities. Source prototypes and
their toolchains remain separate; do not overwrite their files from this app.

Acceptance evidence is stored locally under
`.state/research/main-workspace-integration/`. Its real-worker checks include
pausing A while B decodes and recovers a synthetic hash, returning to paused A,
resuming its pending input, opening saved bytes, persistent dismissal and source
integrity. The inputs are labelled synthetic local data.
