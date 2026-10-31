# Workspace readers

Status: app integration included in the 31 October 2026 checkpoint. This does not install the separate reader engines/service. See [delivery status](project-status.md) for the code and dependency boundary.

The header's Start/Stop control applies to the selected project's registered
background readers: cipher analysis and password recovery. Selecting a project,
changing views and opening files do not enable processing. New projects start
paused. Stop preserves queues and results and takes effect at the reader's next
bounded step. Worker-stop observation is not yet supported: the button reflects
the requested state, not proof that the current step has ended. The existing
API still uses `running: false` and `requested_state: "paused"`.

The reader runs as a separate service. Its repeatable `--projects-catalog` option
enrolls managed IDs and folders from the Hub's `project-hub.json`, including custom
save locations. It publishes a matching, fresh
`.reader-state/worker-status.json` heartbeat. Missing, stale or withdrawn
registration disables Start, with the reason in its accessible label and tooltip. Stop remains
available without a live worker. This app never starts or stops a global engine
process to control one project.

Results and Working come from the actual `reader-report.json`, password queue
and saved tool artifacts in each configured folder. Alerts are newest first within
collapsible Hash and Cipher groups. Working is followed by collapsed History.
An empty collapsible Cyber Kill Chain section sits above Hash; its action engine
is not integrated and its count remains zero.
Historical candidates originating only from the app's workspace databases or
generated username/password lists appear in History, rather than as new findings.
Hypothesis-only transformations also stay in History. Dismiss writes
`reader-alerts.json`; it does not delete the result or provenance. Successful Open
marks the notification handled. Existing standalone bridge dismissals are respected.

Files and Text Editor reuse the filesystem/editor component in independent native
windows, or separate tabs in browser mode. Opening a result leaves the main view
unchanged and does not list or open Files. Originals remain read-only to the backend; text edits are browser drafts.
Binary and incomplete results remain read-only previews. Editor instances and
draft identities are scoped to project IDs. The standalone SSH workbench stays
available separately; no SSH connection is closed by these controls. Mapping its
remote sessions into the main Files view is separate work. The local source is
labelled Laptop; the old numeric Session label was the project ID, not an SSH session.

## Host API

The local Overview hardware layer adds a selected-device header to the existing
results panel and a width resizer. This does not change the reader API, engine
control, alert identity or project scope. Device-specific reader filtering waits
for a verified source/target association; selecting a picture does not resume work.

All routes below are under `/api/hub/projects/{identifier}`. They resolve the
catalog's stable ID directly, independently of the currently open database.

- `GET /background`: requested state, availability, actual Working, alerts and History.
- `POST /background/control`: strict JSON `{ "running": true|false }`.
- `POST /background/alerts/{alert_id}/dismiss`: retain the saved result.
- `GET /background/results/{alert_id}`: bounded saved bytes and provenance.
- `GET /filesystem`: the same-origin filesystem/editor view.
- `GET /editor?result=...` or `?path=...`: independent saved result or local document.
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
