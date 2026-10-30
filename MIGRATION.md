# FastAPI and React pilot

This is the agreed first slice, not a completed frontend or API rewrite. Python, SQLite, the scheduler, approval checks, subprocess execution and the Qt WebEngine window remain in use.

## Scope

`python legion.py --web` now runs one Uvicorn/ASGI process. Native FastAPI routes handle:

| Method | Path | Contract |
| --- | --- | --- |
| GET | `/health` | Health |
| GET | `/api/project` | Project |
| POST | `/api/project/rename` | RenameProject → ProjectResponse |
| GET | `/api/snapshot` | Snapshot |
| GET | `/api/jobs` | JobList |
| GET | `/api/jobs/{job_id}` | Job |
| POST | `/api/jobs/{job_id}/stop` | StopJobResponse |

`/ws/snapshot` uses asynchronous, bounded event queues. Thread callbacks wake the socket; it reads the ordered event journal before advancing its cursor. This avoids missing invalidation channels when worker notifications arrive out of order. Disconnects unsubscribe listeners. Background tool execution remains in the existing job manager, with its cancellation and approval behavior.

Other URLs, templates, static files and binary downloads pass through `a2wsgi` to the existing Flask application. Both layers receive the **same** runtime and job registry. Native responses include `X-Legion-API: fastapi`; native request-validation errors use HTTP 422 with the existing `status`/`error` envelope plus field details. Valid request paths and payloads are preserved. Unmigrated endpoints retain their existing validation behavior.

`/docs` and `/openapi.json` describe the native slice. `frontend/openapi.json` is exported without creating a project or starting workers. `openapi-typescript` generates the client types; `openapi-fetch` uses those types for requests and responses. TypeScript does not validate network data at runtime: native routes validate responses with Pydantic, while the legacy bootstrap bridge checks the required workspace/job fields.

## UI ownership

React owns the sidebar/title workspace identity, inline rename editor and Jobs table. It preserves sidebar double-click, title click, context-menu rename, Enter/blur save, Escape cancellation, error feedback, workspace-change guards and job stop actions. The old renderers/event handlers for those elements have been removed.

`react_bridge.js` is the narrow migration boundary. Existing view loaders publish project/job data; a typed external store feeds the React components. Legacy rendering does not mutate React-owned descendants. The graph, other panels, forms and navigation remain on the current implementation. React and legacy code are compiled together by Vite, retaining the existing UI control IDs.

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

The desktop test uses a real ASGI server, SQLite fixture and synthetic cancellable job. It does not launch scans. Project ZIP downloads, legacy routes, strict native validation, stale rename responses and WebSocket cleanup/concurrent ordering have dedicated checks.

## Assessment and next decision

The FastAPI slice removes handwritten request validation for these endpoints and provides a single source for generated frontend contracts. Most service code was reused. The event adapter required deliberate work: changing frameworks alone would not make the existing blocking wait safe on an ASGI event loop.

React gives workspace identity and job state one renderer each, replacing DOM mirrors and delegated handlers for those features. Component tests can exercise failures and request races without a complete desktop session. It also adds a Node build toolchain and a temporary bridge to the remaining views. Code volume and raw execution speed have not been used as acceptance criteria; no performance improvement has been claimed or benchmarked.

The pilot supports continuing by contained features. Migrate the remaining activity tables or workspace controls next; leave the graph until those patterns are established. The remaining Flask routes and imperative views are explicit follow-up work, not hidden behind generated types.

For comparison or transport rollback, run `python legion.py --web --web-stack legacy`. The same UI and data are used; the service command can add that flag if needed. No database conversion is involved.
