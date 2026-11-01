# Main-app workspace integration

31 October 2026. Implemented jointly by Filesystem-Access (reader enrollment,
health and independent acceptance) and Flagmap Builder (main backend/React UI).

## Implemented connection

The main app now uses its stable Hub project ID for each background adapter.
`reader-control.json` persists each workspace's requested state. New managed
workspaces start paused before appearing in the catalog; navigation, file reads
and returning to a workspace do not start them. One workspace's Pause does not
stop the global reader owner or another workspace.

The existing reader owner enrolls configured Hub catalogs with repeatable
`--projects-catalog` arguments, including workspaces in custom save folders.
Fresh, identity-matched `.reader-state/worker-status.json` metadata advertises a
worker for each initialized workspace. Start is unavailable without a matching
worker. Readiness and actual pause-boundary observation remain separate.

The main application's top-right Start/Pause button and Working/alerts side panel
use real queue/results. Completion alerts open saved files in a project-bound
instance of the existing filesystem/editor. Dismiss retains the file and source
evidence. The main app filters hypothesis-only automatic alerts while keeping
their saved artifacts accessible for review.

## Main APIs

All routes below are relative to `/api/hub/projects/{project_id}`:

| Method | Route | Behaviour |
| --- | --- | --- |
| GET | `/background` | Requested state, matching worker readiness, actual queue/results. |
| POST | `/background/control` | `{ "running": true/false }`, persisted for that workspace. |
| POST | `/background/alerts/{result_id}/dismiss` | Hide notification; retain its result/evidence. |
| GET | `/background/results/{result_id}` | Bounded saved-result bytes and artifact provenance. |
| GET | `/filesystem` | Main-app instance of the explorer/editor. |
| GET | `/filesystem/api/session` | Project-specific filesystem root. |
| GET | `/filesystem/api/list` | Actual local project entries. |
| GET | `/filesystem/api/preview` | Bounded original file preview. |

The main control's selector is `#hub-background-toggle`; Working is
`#hub-background-working`, and alerts have `[data-result-id]`. The main app owns
its vendored adapter/assets; the standalone source remains separately usable.

## Independent real-worker acceptance

The isolated main-app instance on `http://127.0.0.1:5017` used two real managed
workspaces in a custom configured folder, with separate application state and a
headless browser. No network scans, exploitation or CTF image were used.

29 checks verified that A decoded and retained its first result, paused, and left
a new input untouched while B decoded another file and recovered an explicitly
synthetic MD5 password through the native queue. Returning/reloading A retained
Pause; Resume processed its waiting input without disabling B. Open displayed
the exact saved bytes in the integrated editor, retained source attribution and
the project boundary; Dismiss survived reload without deleting the file. Original
inputs stayed unchanged and no browser JavaScript errors were reported.

Four more checks created a third managed workspace while that same worker was
running, verified automatic enrollment and its initial paused state, processed a
real Base64 file, and checked the exact stable project ID in its heartbeat.
Sixteen catalog/health unit tests and three existing control regressions passed.

Evidence and reproducible acceptance scripts are under
`/home/joshua/Projects/legion/.state/research/main-workspace-integration/`.
Screenshots/logs are in the capped project's
`.artifacts/disposable/main-workspace-integration/` directory.

## Boundaries

Pause uses the current cooperative bounded-step policy and retains native queue
state. It does not suspend arbitrary unrelated processes. Additional background
tools must implement the same workspace-aware backend control contract. The UI
does not claim every worker is stopped when observation is unsupported.

This integration does not rename/migrate the configured save folder, disconnect
SSH sessions, write remote originals, or turn a decoding candidate into a verified
flag. The original 235-entry Penelope fixture remains separate and unchanged.
