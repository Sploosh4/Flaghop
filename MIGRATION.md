# FastAPI and React migration

Workspace identity and activity now use React and FastAPI. This remains an incremental migration. Python, SQLite, the scheduler, approval checks, subprocess execution and the Qt WebEngine window remain in use.

## Current shell and integrations

The app opens on a React project home with project-specific navigation, save/restore/export, command search, live status and remembered sidebar preferences. Its visible name is FlagHop and its default project root is configurable, initially `Documents/FlagHop/[project name]`. Existing settings and inspectors load on demand in isolated same-origin panels; the hidden legacy shell does not run background loaders.

Project-ID-scoped reader controls, real Working/results and the local filesystem/editor are included. The reader service/toolchains remain separate dependencies. See [delivery status](docs/project-status.md) and [workspace reader contracts](docs/background-workspaces.md).

The `codex/hardware-overview` UI checkpoint uses independent Files/Text Editor windows (separate browser tabs), collapsible Hash/Cipher groups, and History below Working. Result opening does not mount the explorer. Native child windows share the desktop profile and project-bound download destination. Start/Stop labels retain the existing cooperative reader protocol; Stop does not confirm immediate termination. The Laptop source is local project storage; remote session mapping remains pending.

The empty Cyber Kill Chain group is a UI placeholder. VPN labels reuse saved protocol/connector preferences; they add no discovery requests or new connection-state API.

Shared project network settings, scope/exclusions, target checks and common-runner enforcement are included. Linux commands use per-command egress restrictions and retain the validated network context in their SQLite process history. Unconfigured or unsupported network work is held; offline work can continue. Real isolated WireGuard/userspace OpenVPN acceptance is recorded. Discovery, connect/disconnect controls, remote runners and callback checks remain planned. See [network setup and supported modes](docs/project-network-settings.md).

Reader/filesystem routes are listed in the reader contract. Both FastAPI and legacy transports also expose per-project `GET`/`PUT /api/hub/projects/{id}/network` and `POST /api/hub/projects/{id}/network/check`; writes use an expected configuration revision. Process output includes the saved `network_context`.

## Scope

`python legion.py --web` now runs one Uvicorn/ASGI process. Native FastAPI routes handle:

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

Other URLs, templates, static files and binary downloads pass through `a2wsgi` to the existing Flask application. Both layers receive the **same** runtime and job registry. Native responses include `X-Legion-API: fastapi`; native request-validation errors use HTTP 422 with the existing `status`/`error` envelope plus field details. Valid request paths and payloads are preserved. Unmigrated endpoints retain their existing validation behavior.

`/docs` and `/openapi.json` describe the native routes. `frontend/openapi.json` is exported without creating a project or starting workers. `openapi-typescript` generates the client types; `openapi-fetch` uses those types for requests and responses. TypeScript does not validate network data at runtime: native routes validate responses with Pydantic, while bootstrap bridges check workspace/job fields and activity row identities. Historical nullable database fields and extension metadata remain supported.

Native activity queries reject malformed or out-of-range limits with 422 instead of silently clamping them. Retry timeouts must be positive integers; mutation booleans must be JSON booleans. Unknown body keys and invalid family actions fail before calling a service. Approval defaults remain `run_now=true`, `approve_family=false`; the explicit Approve+Run and Allow Family buttons retain their existing meaning. Approval responses retain 202 when a job is queued and 200 when no job is created. Hiding and clearing processes use the existing runtime rules.

AI providers and feedback loops, web/screenshot integrations, alternate runners, credential capture/relay, external enrichment and report delivery have been removed. Their endpoints return 404 on both transports. Job, scan and decision histories now live inside Activity; the standalone logging dialogs are gone. Local execution, cancellation, approvals, project exports and Nmap XML import remain.

## UI ownership

The `codex/hardware-overview` checkpoint adds a React Hardware layer directly in Overview, reusing
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
LEGION_SMOKE_WEB_STACK=legacy QT_QPA_PLATFORM=offscreen \
  QTWEBENGINE_CHROMIUM_FLAGS="--disable-gpu --no-sandbox" \
  .venv/bin/python tests/desktop/workspace_smoke.py
```

Production frontend assets are versioned under `app/web/static/bundles/`. An ordinary launch needs Python and the desktop dependencies, not Node or a development server. The pinned npm lockfile and CI verify that the assets can be reproduced. TypeScript is pinned to 5.9.3 because the current OpenAPI generator uses its JavaScript compiler API; the native TypeScript 7 package is incompatible with that generator.

The current desktop test uses a real server and isolated SQLite project fixtures. It exercises project creation/switching, folder/file display, sidebar collapse/resizing, rename, Save/context menus, command search, settings dialogs, live status and remembered navigation against both ASGI and legacy transports without launching scans, installs or provider requests. The migrated activity components retain their component and service tests. Project ZIP downloads, legacy route compatibility, strict native validation, stale responses, action failures and WebSocket cleanup/concurrent ordering have dedicated checks.

## Assessment and next decision

The FastAPI slice removes handwritten request validation for these endpoints and provides a single source for generated frontend contracts. Most service code was reused. The event adapter required deliberate work: changing frameworks alone would not make the existing blocking wait safe on an ASGI event loop.

React gives workspace identity and activity one renderer each, replacing DOM mirrors and delegated handlers for those features. Component tests can exercise failures and request races without a complete desktop session. It also adds a Node build toolchain and temporary bridges to the remaining views. Code volume and raw execution speed have not been used as acceptance criteria; no performance improvement has been claimed or benchmarked.

The next contained features are workspace controls and host/service views. Graph migration remains separate. The remaining Flask routes and imperative views are explicit follow-up work.

For comparison or transport rollback, run `python legion.py --web --web-stack legacy`. The same UI and data are used; the service command can add that flag if needed. No database conversion is involved.
