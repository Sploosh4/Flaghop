# FastAPI and React migration

Workspace identity and activity now use React and FastAPI. This remains an incremental migration. Python, SQLite, the scheduler, approval checks, subprocess execution and the Qt WebEngine window remain in use.

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
| GET | `/api/scheduler/provider/logs` | ProviderLogs |
| GET | `/api/scheduler/approvals` | ApprovalList |
| POST | `/api/scheduler/approvals/{approval_id}/approve` | ApproveApproval → ApprovalResponse (200 or 202) |
| POST | `/api/scheduler/approvals/{approval_id}/reject` | RejectApproval → ApprovalResponse |

`/ws/snapshot` uses asynchronous, bounded event queues. Thread callbacks wake the socket; it reads the ordered event journal before advancing its cursor. This avoids missing invalidation channels when worker notifications arrive out of order. Disconnects unsubscribe listeners. Background tool execution remains in the existing job manager, with its cancellation and approval behavior.

Other URLs, templates, static files and binary downloads pass through `a2wsgi` to the existing Flask application. Both layers receive the **same** runtime and job registry. Native responses include `X-Legion-API: fastapi`; native request-validation errors use HTTP 422 with the existing `status`/`error` envelope plus field details. Valid request paths and payloads are preserved. Unmigrated endpoints retain their existing validation behavior.

`/docs` and `/openapi.json` describe the native routes. `frontend/openapi.json` is exported without creating a project or starting workers. `openapi-typescript` generates the client types; `openapi-fetch` uses those types for requests and responses. TypeScript does not validate network data at runtime: native routes validate responses with Pydantic, while bootstrap bridges check workspace/job fields and activity row identities. Historical nullable database fields and extension metadata remain supported.

Native activity queries reject malformed or out-of-range limits with 422 instead of silently clamping them. Retry timeouts must be positive integers; mutation booleans must be JSON booleans. Unknown body keys and invalid family actions fail before calling a service. Approval defaults remain `run_now=true`, `approve_family=false`; the explicit Approve+Run and Allow Family buttons retain their existing meaning. Approval responses retain 202 when a job is queued and 200 when no job is created. Hiding and clearing processes use the existing runtime rules.

## UI ownership

React owns workspace identity, the Jobs and Processes tables, process output, scheduler rationale, decision and submitted-scan histories, provider logs, and approvals. It preserves existing control IDs, modal keyboard/backdrop handling, ANSI output, copy/download actions, process controls, approval risk/policy details and family actions. The old renderers and delegated action handlers for these elements have been removed. Script/screenshot viewers, graph, host/service views, settings and scan forms still use their existing implementation.

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

The desktop test uses a real server, SQLite activity fixtures and a synthetic cancellable job. It exercises process output/hiding, approval rejection, history dialogs, provider logs, live invalidations and counters against both ASGI and legacy transports without launching scans or provider requests. Project ZIP downloads, legacy route compatibility, strict native validation, stale responses, action failures and WebSocket cleanup/concurrent ordering have dedicated checks.

## Assessment and next decision

The FastAPI slice removes handwritten request validation for these endpoints and provides a single source for generated frontend contracts. Most service code was reused. The event adapter required deliberate work: changing frameworks alone would not make the existing blocking wait safe on an ASGI event loop.

React gives workspace identity and activity one renderer each, replacing DOM mirrors and delegated handlers for those features. Component tests can exercise failures and request races without a complete desktop session. It also adds a Node build toolchain and temporary bridges to the remaining views. Code volume and raw execution speed have not been used as acceptance criteria; no performance improvement has been claimed or benchmarked.

The next contained features are workspace controls and host/service views. Graph migration remains separate. The remaining Flask routes and imperative views are explicit follow-up work.

For comparison or transport rollback, run `python legion.py --web --web-stack legacy`. The same UI and data are used; the service command can add that flag if needed. No database conversion is involved.
