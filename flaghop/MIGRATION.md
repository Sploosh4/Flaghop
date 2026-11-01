# FastAPI and React migration

## Domain-contract consolidation

This checkpoint, developed from `877b794` of `main`, moves tool action,
result, observation and artifact-reference definitions into dedicated packages
under `app/contracts`. Application and test imports use their canonical modules;
the old definition modules are removed rather than maintained as copies.
Application/page compositions, runtime handles, policy evaluation and IO stay
outside these packages. [Authoring rules and checks](docs/contract-authoring.md)
define allowed roots and the quality gate now run by maintainability/CI.

Parser output and normalized target rows are checked against shared observation
models. Network reports use typed route/service responses. Reader provenance
retains extensions and missing fields; artifact manifests and relative result
paths are typed without replacing byte/path ownership checks in the services.
The reviewed repairs add protected owned-process cleanup and idempotent
offline result recovery. Concurrent project execution and the planned
Metasploit/session workflow remain separate work.

The HTTP server is now FastAPI-only. Workspace identity and activity use React; the remaining HTML/JavaScript views use the same native server. The UI migration remains incremental. Python, SQLite, the scheduler, approval checks, subprocess execution and the Qt WebEngine window remain in use.

## Current shell and integrations

The app opens on a React project home with project-specific navigation, save/restore/export, command search, live status and remembered sidebar preferences. Its visible name is FlagHop and its default project root is configurable, initially `Documents/FlagHop/[project name]`. Existing settings and inspectors load on demand in isolated same-origin panels; the hidden legacy shell does not run background loaders.

Project-ID-scoped reader controls, real Working/results and the local filesystem/editor are included. The reader service/toolchains remain separate dependencies. See [delivery status](docs/project-status.md) and [workspace reader contracts](docs/background-workspaces.md).

The UI checkpoint merged into `master` from `codex/hardware-overview` uses independent Files/Text Editor windows (separate browser tabs), collapsible Hash/Cipher groups, and History below Working. Result opening does not mount the explorer. Native child windows share the desktop profile and project-bound download destination. Start/Stop labels retain the existing cooperative reader protocol; Stop does not confirm immediate termination. The Laptop source is local project storage; remote session mapping remains pending.

The empty Cyber Kill Chain group is a UI placeholder. VPN labels reuse saved protocol/connector preferences; they add no discovery requests or new connection-state API.

Shared project network settings, scope/exclusions, target checks and common-runner enforcement are included. Linux commands use per-command egress restrictions and retain the validated network context in their SQLite process history. Unconfigured or unsupported network work is held; offline work can continue. Real isolated WireGuard/userspace OpenVPN acceptance is recorded. Discovery, connect/disconnect controls, remote runners and callback checks remain planned. See [network setup and supported modes](docs/project-network-settings.md).

Reader/filesystem routes are listed in the reader contract. FastAPI also exposes per-project `GET`/`PUT /api/hub/projects/{id}/network` and `POST /api/hub/projects/{id}/network/check`; writes use an expected configuration revision. Process output includes the saved `network_context`.

This checkpoint adds `GET`/`POST /api/hub/projects/{id}/deep-scans` on the native API. POST returns 202 with a project/host-bound run; it accepts a literal target IP, host ID, expected revision, timeout and optional explicit resolver. Commands and output paths are app-owned. Jobs can now report `partial`; per-job completion callbacks persist pre-launch held/cancelled outcomes. The generated client and snapshot guard accept that status. Existing command callers retain their old contracts. See [scanner boundaries and live validation](docs/scanner-integration.md).

## Scope

`python legion.py --web` now runs one Uvicorn/ASGI process. All 97 retained HTTP method/path combinations are registered natively. The typed activity subset includes:

| Method | Path | Contract |
| --- | --- | --- |
| GET | `/health` | Health |
| GET | `/api/project` | Project |
| POST | `/api/project/rename` | RenameProject → ProjectResponse |
| GET | `/api/snapshot` | ActivitySnapshot |
| GET | `/api/jobs` | JobList |
| GET | `/api/jobs/{job_id}` | Job |
| POST | `/api/jobs/{job_id}/stop` | StopJobResponse |
| GET | `/api/workspace/overview` | Overview, including scheduler rationale |
| GET | `/api/processes` | ProcessList |
| GET | `/api/processes/{process_id}/output` | ProcessOutput, including chunks/progress |
| POST | `/api/processes/{process_id}/kill` | ProcessAction |
| POST | `/api/processes/{process_id}/retry` | RetryProcess → RetriedProcess (202) |
| POST | `/api/processes/{process_id}/close` | ProcessAction |
| POST | `/api/processes/clear` | ClearProcesses → ClearedProcesses |
| GET | `/api/scans/history` | ScanList |
| GET | `/api/scheduler/decisions` | DecisionList |
| GET | `/api/scheduler/approvals` | ApprovalList |
| POST | `/api/scheduler/approvals/{approval_id}/approve` | ApproveApproval → ApprovalResponse (200 or 202) |
| POST | `/api/scheduler/approvals/{approval_id}/reject` | RejectApproval → ApprovalResponse |

`/ws/snapshot` uses asynchronous, bounded event queues. Thread callbacks wake the socket; it reads the ordered event journal before advancing its cursor. This avoids missing invalidation channels when worker notifications arrive out of order. Disconnects unsubscribe listeners. Background tool execution remains in the existing job manager, with its cancellation and approval behavior.

The same FastAPI application serves every retained route, Jinja page, static asset, ZIP upload/download and WebSocket. Synchronous service handlers run in its worker pool. File responses stream from disk; temporary ZIP exports are removed after transmission, and failed restore uploads are removed unless a background job has taken ownership. There is no WSGI mount, transport selector or Flask dependency. Request-validation errors use HTTP 422 with the existing `status`/`error` envelope and field details. Routes migrated in this final pass retain their existing service validation and status codes; not all dictionaries have typed response models yet.

`/docs` and `/openapi.json` describe the native routes. `frontend/openapi.json` is exported without creating a project or starting workers. `openapi-typescript` generates the client types; `openapi-fetch` uses those types for requests and responses. TypeScript does not validate network data at runtime: native routes validate responses with Pydantic, while bootstrap bridges check workspace/job fields and activity row identities. Historical nullable database fields and extension metadata remain supported.

Native activity queries reject malformed or out-of-range limits with 422 instead of silently clamping them. Retry timeouts must be positive integers; mutation booleans must be JSON booleans. Unknown body keys and invalid family actions fail before calling a service. Approval defaults remain `run_now=true`, `approve_family=false`; the explicit Approve+Run and Allow Family buttons retain their existing meaning. Approval responses retain 202 when a job is queued and 200 when no job is created. Hiding and clearing processes use the existing runtime rules.

AI providers and feedback loops, web/screenshot integrations, alternate runners, credential capture/relay, external enrichment and report delivery have been removed. Their endpoints return 404 on the native API. Job, scan and decision histories now live inside Activity; the standalone logging dialogs are gone. Local execution, cancellation, approvals, project exports and Nmap XML import remain.

## UI ownership

The `master` branch includes a React Hardware layer directly in Overview, reusing
the current snapshot, computer settings and project network read API. Its view
model discards inventory from a different active project and ignores stale or
mismatched route observations. Device selection and keyboard navigation are
local UI state; they never execute a tool. No API routes or database formats
changed. See [hardware behaviour and limits](docs/hardware-overview.md).

React owns workspace identity, the Jobs and Processes tables, process output, scheduler rationale, decision and submitted-scan histories and approvals. It preserves existing control IDs, modal keyboard/backdrop handling, ANSI output, copy/download actions, process controls, approval risk/policy details and family actions. The old renderers and delegated action handlers for these elements have been removed. The script-output viewer, graph, host/service views, settings and scan forms still use their existing implementation.

`react_bridge.js` publishes project/job data. `activity_bridge.js` publishes activity snapshots and forwards legacy graph/dialog requests to the typed activity controller. Commands arriving before React mounts are buffered. Typed external stores feed components; legacy code does not mutate their descendants. Panel loaders display errors and discard responses superseded by a live snapshot or workspace switch. Mutations disable related controls and prevent duplicate submissions. Process output has a separate session with bounded chunks, automatic refresh, completion handling and guards against late responses after closing, switching processes or switching workspaces. No endpoint or client automatically grants approval during migration.

## Reproduce the checks

Install `requirements-dev.txt` into `.venv` and use Node.js 24 LTS. Local tools may live under `.tools/node`; `scripts/frontend.sh` detects that installation. All local caches and generated test output stay inside the project storage cap.

```bash
scripts/frontend.sh install
scripts/frontend.sh generate     # after changing native contracts
scripts/frontend.sh build        # rebuild versioned production assets and license notices
scripts/frontend.sh check        # schema/type drift, component tests, typecheck, reproducible bundle
scripts/check-maintainability.sh
QT_QPA_PLATFORM=offscreen QTWEBENGINE_CHROMIUM_FLAGS="--disable-gpu --no-sandbox" \
  .venv/bin/python tests/desktop/workspace_smoke.py
```

Production frontend assets are versioned under `app/web/static/bundles/`. An ordinary launch needs Python and the desktop dependencies, not Node or a development server. The pinned npm lockfile and CI verify that the assets can be reproduced. TypeScript is pinned to 5.9.3 because the current OpenAPI generator uses its JavaScript compiler API; the native TypeScript 7 package is incompatible with that generator.

The current desktop test uses a real server and isolated SQLite project fixtures. It exercises project creation/switching, folder/file display, sidebar collapse/resizing, rename, Save/context menus, command search, settings dialogs, live status and remembered navigation against the native ASGI server without launching scans, installs or provider requests. The migrated activity components retain their component and service tests. Project ZIP downloads, retained route coverage, strict native validation, stale responses, action failures and WebSocket cleanup/concurrent ordering have dedicated checks.

## Assessment and next decision

The FastAPI slice removes handwritten request validation for these endpoints and provides a single source for generated frontend contracts. Most service code was reused. The event adapter required deliberate work: changing frameworks alone would not make the existing blocking wait safe on an ASGI event loop.

React gives workspace identity and activity one renderer each, replacing DOM mirrors and delegated handlers for those features. Component tests can exercise failures and request races without a complete desktop session. It also adds a Node build toolchain and temporary bridges to the remaining views. Code volume and raw execution speed have not been used as acceptance criteria; no performance improvement has been claimed or benchmarked.

Workspace controls, host/service views and the graph still have imperative UI code. Those are UI follow-ups, independent of the completed HTTP transport migration. Existing workspaces need no database conversion.

The migration removes the old `--web-stack` selector rather than silently falling back. `tests/app/test_FastApiOnly.py` checks retained route coverage and boots with imports of the removed stack blocked. Both CI and desktop fixtures now exercise the single production transport. See [architecture follow-ups](docs/architecture-follow-ups.md) for the separately authorised improvement goal and its closure criteria.

## Scanner lifecycle and history candidate

Jobs expose `settling=true` while their completion callback persists results.
They remain active and retain their exclusive slot; Stop explains that saving
must finish rather than claiming cancellation. Persistence failures report failed
jobs, preserving the execution outcome separately. Queued work has explicit
backpressure at the configured active-job limit. Restart recovery marks saved
work interrupted and never automatically launches its stored command.

The reviewed repairs add a private execution journal outside copied/exported
workspaces. Child execution waits for durable identity publication. Cleanup uses
boot/start identity, pidfds, private network ownership and inherited app tags;
unverified ownership or missing administrator access remains held. Active
process rows are linked to that journal before network preparation. Database
initialization adds nullable `process.execution_id` to legacy tables
without changing existing row values. Process repositories remain free of
constructor migration side effects. ASGI
shutdown stops admission, requests cancellation and waits on one bounded
deadline, including persistence callbacks. An unfinished shutdown is reported.

Startup can settle original-project process rows and import a validated retained
profile without changing the selected project or rerunning network work.
Inventory and its idempotency marker commit together; summary files and final
run state can then be retried after interruption. History provides Recover saved
result/Retry cleanup, and a workspace notice exposes held generic executions.
`GET /api/recovery` checks pending work; `POST /api/recovery` retries eligible
cleanup/settlement. It accepts no PID, command or filesystem path. A scan-specific
`POST .../deep-scans/{scan_id}/recover` selects saved evidence by owned IDs.

Save as and ZIP restore preserve full results and original evidence, retain
lineage, stop copied readers and remove actionable old run identity. Copied
metadata never authorizes process signalling. An unresolved protected execution
blocks copying, saving or moving its original workspace; a cleanup hold also
blocks another network run there. ZIP imports now share configurable streaming
and expansion limits, owned staging, actual-filesystem reservations and atomic
workspace adoption. Oversize and storage admission failures return 413/507.

Copied process rows clear actionable PID/execution IDs; Running/Waiting becomes
Interrupted. The original control values remain in bounded provenance, while
commands/output remain unchanged. Legacy reopen applies this only to unowned
history, preserving actual handles and protected journal links. Reconciliation
uses 32-row batches and one transaction after admission. Invalid/oversized
controls or provenance reject the adoption without truncating evidence.

`GET /api/hub/projects/{id}/deep-scans?compact=true` returns list metadata with
`summary_omitted=true`; the workspace polls this form. `GET
/api/hub/projects/{id}/deep-scans/{scan_id}` loads full results on expansion.
The old full-list form remains available to existing callers. Task facts and
summary fields now have generated types, with extensions retained.


Temporary ZIP responses now clean up in a shielded `finally` even if the ASGI
send fails or is cancelled. This applies only to generated exports, never stored
evidence. Import progress reports which inventory/database/file stages settled;
a failed import keeps the validated original profile accessible.

For repeatable resource measurements, run `.venv/bin/python tests/desktop/scanner_resources.py`. It runs sequential synthetic desktop fixtures at zero and 1,000 saved
scans, checks the 200-card bound and reports sampled RSS/PSS. It never launches a
network scanner. Results and screenshots remain under disposable project output.
