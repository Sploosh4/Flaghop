# FlagHop architecture

FlagHop is a modular monolith with separate tool processes. Most application
features share one Python runtime and one SQLite database per project. Modules
separate their responsibilities; they are not independently deployed services
or dynamically loaded plug-ins.

```mermaid
flowchart TD
  Desktop[Qt WebEngine windows] --> UI[React workspace and retained HTML views]
  Browser[Browser mode] --> UI
  UI --> API[FastAPI and retained Flask routes]
  API --> Services[Project, workspace, scheduler and process services]
  Services --> Jobs[Background job queue]
  Jobs --> Runner[Tracked process runner]
  Runner --> Guard[Project network lease]
  Guard --> Scanner[Profiler CLI and external tools]
  Scanner --> Import[Validated profile and evidence import]
  Services --> DB[Project SQLite database]
  Import --> DB
  Import --> Files[Project evidence files]
  Files --> Editor[Independent Files and Text Editor windows]
  Reader[Separate cipher and password reader] --> Files
```

## Ownership

| Area | Responsibility |
| --- | --- |
| [`frontend/src/hub`](../frontend/src/hub) | Project navigation, hardware map, setup, reader and Deep scan panels. React state and project-ID guards prevent late responses replacing another workspace. |
| [`frontend/src/activity`](../frontend/src/activity) | Jobs, processes, output, approvals and other migrated activity panels. |
| [`app/desktop.py`](../app/desktop.py) and [`desktop_documents.py`](../app/desktop_documents.py) | Native windows around the same localhost app. Window controls use a narrow trusted-origin Qt bridge. |
| [`app/api`](../app/api) | FastAPI routes and Pydantic request/response contracts. OpenAPI generates TypeScript client types. |
| [`app/web`](../app/web) | Retained Flask endpoints, HTML/JavaScript views and compatibility adapters. FastAPI mounts this application for unmatched routes. |
| [`app/services`](../app/services) | Project catalog, workspace/session state, process registry, settings, events and network policy. |
| [`app/web/jobs.py`](../app/web/jobs.py) | In-memory queue with background workers, exclusive jobs, cancellation and explicit partial outcomes. Completion callbacks persist scanner states independently of the queue. |
| [`app/processes`](../app/processes) | Tracked child processes, output, activity/time limits and cancellation. Scanner argv bypasses shell interpretation; older command paths retain their compatibility API. |
| [`app/services/network_guard.py`](../app/services/network_guard.py) | Checks the captured project network reference and enforces egress for a private process group/GID and its descendants. Failed verification holds work. |
| [`app/scanning`](../app/scanning) | Thin scanner adapter: source verification, job ownership, proxy registration, profile validation, import and durable results. |
| [`vendor/ctf_profiler`](../vendor/ctf_profiler) | Byte-identified standalone scanner modules and small inputs. Tools/environments are installed separately; the app does not merge scanner internals into its runtime. |
| [`app/scheduler`](../app/scheduler) | Existing rule planning, risk/policy decisions, approvals and execution orchestration. Metasploit execution is not added by the scanner adapter. |
| [`db`](../db) | SQLAlchemy entities, repositories and per-project SQLite persistence. |

## A Deep scan

1. The selected device supplies a host ID and literal IP. The API accepts those,
   an expected network revision, a timeout and an optional explicit DNS resolver;
   it does not accept a command, scanner path or output directory.
2. The service checks the active project, device/IP match, configured revision,
   scope and exclusions. It deduplicates active scans for that device and creates
   a fresh owned run directory and project-bound job.
3. The worker rechecks the project/revision. ProcessRunner launches the CLI child
   through NetworkLease, with bounded logs and an overall deadline. Guarded
   launches preserve terminal authentication while using a separate cancellation
   process group; runtime environment restoration happens after privilege drop. Metasploit,
   privileged discovery and supplied target credentials are not enabled.
4. The scanner's localhost proxy registers its actual listener. The guard checks
   its private GID before allowing that port; unrelated localhost services are
   not generally allowed. The scanner proxy still limits forwarding to its one
   target and discovered ports.
5. The importer validates the profile schema, target, source hashes, timestamps,
   evidence paths/checksums and single-target XML before importing inventory.
   It keeps classification hypotheses, assessment candidates and independently
   reproduced findings separate. A successful process exit is not finding,
   session or privilege success.
6. Services enter the existing inventory. Scan summaries enter project SQLite;
   profiles, raw evidence and run metadata stay under the project's tool-output
   folder. Working and History use those real records, and Open uses the existing
   independent editor. No network hops are inferred from scanner output.

## Persistence and events

The project catalog maps stable project IDs to workspace files and folders.
SQLite stores inventory, process history and imported scan summaries. Output files
preserve the original evidence and hashes. The in-memory job queue does not
survive a backend restart; unfinished scan records are shown as interrupted, while
persisted completed, held and cancelled records remain available. Switching
projects is blocked while scan jobs are queued/running.

An event stream feeds WebSocket invalidations; polling remains available. The
cipher/password engines remain a separate service communicating through
project-scoped control, heartbeat, queue and result files. Their Start/Stop button
does not control manual Deep scan jobs.

## Remaining coupling

`WebRuntime` is still a compatibility facade over many older domain functions.
Some services depend on it, and the Nmap importer uses the existing database
repositories. Host/service, graph and settings views are not all React yet.
The shared runtime and locks therefore still matter: modular files do not make
each feature independently replaceable. This remains an incremental migration,
not a completed clean-room rewrite.

## Reasons and trade-offs

These are the reasons supported by the implementation and integration plan;
they are not a claim that every inherited component had a written design record.

| Choice | Reason | Cost or limitation |
| --- | --- | --- |
| One modular application | Reuse the existing workspace, jobs, inventory and editor without adding deployment services for a local desktop tool. | Shared runtime state and locks can couple otherwise separate modules. |
| Qt around a shared web interface | Desktop and browser modes share most UI code while Qt supplies independent native windows. | WebEngine adds memory/dependency cost, and native bridges need careful boundaries. |
| FastAPI alongside Flask | Migrate routes and typed contracts incrementally while preserving existing views and handlers. | Two API paths require compatibility tests; this is migration overhead rather than an ideal permanent endpoint. |
| Scanner as a child CLI | Isolate tool execution, support cancellation/deadlines, preserve the standalone scanner and reuse its verified behavior. | Adapters must manage processes, environment, logs and explicit import contracts. |
| Byte-identified source bundle | Ship a portable, known scanner revision without copying its toolchains or depending on a developer's checkout. | Scanner updates require deliberate synchronization and revalidation; hashes identify content, not its correctness. |
| Per-project SQLite and evidence files | Keep inventory/history queryable while retaining raw proof and portable project exports. | Database summaries and file metadata must remain consistent; atomic writes and validation are required. |
| In-memory job queue, persisted outcomes | Reuse the existing local queue with durable results and explicit interruption records. | Work does not resume automatically after restart; callbacks and shared locks add lifecycle complexity. |
| NetworkLease and an owned proxy | Enforce project scope for descendants while permitting only the browser/proxy listener owned by that scan. | Linux privilege, group, firewall and session behavior needs real platform testing. |
| Separate candidate and reproduced outcomes | Tool completion and scanner alerts do not establish a vulnerability, device identity or successful session. | More states and evidence must be represented in APIs and the UI. |

The process-session fix, Python 3.12 wrapper-path fix and evidence-collector race
were responses to observed failures. They were not all anticipated in the initial
plan. The boundaries above were planned; some implementation details were learned
through integration. The largest design debt is the shared compatibility runtime,
followed by the dual API stack and implicit task/profile dictionaries. Reducing
that coupling is a more useful next refactor than adding another framework or
splitting this local tool into more services.

The Deep scan implementation is included in this checkpoint for `master`.
Its fixture tests, passing real guarded acceptance and remaining limitations are
recorded in [scanner integration](scanner-integration.md).
