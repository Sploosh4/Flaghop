# FlagHop architecture

FlagHop is a modular monolith with separate tool processes. Most application
features share one Python runtime and one SQLite database per project. Modules
separate their responsibilities; they are not independently deployed services
or dynamically loaded plug-ins.

```mermaid
flowchart TD
  Desktop[Qt WebEngine windows] --> UI[React workspace and retained HTML views]
  Browser[Browser mode] --> UI
  UI --> API[FastAPI HTTP and WebSockets]
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
| [`app/api`](../app/api) | FastAPI routes and application/page compositions. OpenAPI generates TypeScript client types from the canonical contracts. |
| [`app/contracts`](../app/contracts) | Definition-only actions/results, observations and artifact references, using approved roots. Parsers, runners, storage and HTTP services stay outside. See [authoring and quality gate](contract-authoring.md). |
| [`app/web`](../app/web) | HTML/JavaScript assets, templates, job manager and framework-independent service adapters. There is no second web application. |
| [`app/services`](../app/services) | Project catalog, workspace/session state, process registry, settings, events and network policy. |
| [`app/web/jobs.py`](../app/web/jobs.py) | Bounded in-memory queue with background workers, exclusive jobs and cancellation. Completion callbacks persist results before terminal publication and release; write failures become visible job failures. |
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

The contract consolidation does not add durable
job recovery or independent multi-project execution. Those remain separate work.
The checker runs in the maintainability/CI gate and catches ownership, dependency,
class, reference-type and import-cycle regressions. Behavioural and desktop fixture
tests verify the consuming paths; a structural pass does not verify a finding.

The project catalog maps stable project IDs to workspace files and folders.
SQLite stores inventory, process history and imported scan summaries. Output files
preserve the original evidence and hashes. The in-memory job queue does not
survive a backend restart. Recovery persists an explicit interruption marker and
never replays network work. Pending final writes remain distinguishable from
settled outcomes, even when a database summary already exists. Persisted complete,
held and cancelled records remain available. Switching
projects is blocked while scan jobs are queued/running.

An event stream feeds WebSocket invalidations; polling remains available. The
cipher/password engines remain a separate service communicating through
project-scoped control, heartbeat, queue and result files. Their Start/Stop button
does not control manual Deep scan jobs.

## Remaining coupling

`WebRuntime` is still a compatibility facade over many older domain functions.
Some services depend on it, and the Nmap importer uses the existing database
repositories. Host/service, graph and settings views are not all React yet.
The project catalog and runtime now share one reentrant lock, eliminating their
previous opposite acquisition orders. Scanner operations bind an explicit
workspace transaction and recheck identity before import. The broad runtime
facade still matters: modular files do not make
each feature independently replaceable. This remains an incremental migration,
not a completed clean-room rewrite.

## Reasons and trade-offs

These are the reasons supported by the implementation and integration plan;
they are not a claim that every inherited component had a written design record.

| Choice | Reason | Cost or limitation |
| --- | --- | --- |
| One modular application | Reuse the existing workspace, jobs, inventory and editor without adding deployment services for a local desktop tool. | Shared runtime state and locks can couple otherwise separate modules. |
| Qt around a shared web interface | Desktop and browser modes share most UI code while Qt supplies independent native windows. | WebEngine adds memory/dependency cost, and native bridges need careful boundaries. |
| One FastAPI host | Share HTTP, templates, uploads, downloads and asynchronous WebSockets without a WSGI bridge. Generate frontend contracts from OpenAPI. | Some retained handlers still rely on service-level dictionary validation; those contracts need further typing. |
| Scanner as a child CLI | Isolate tool execution, support cancellation/deadlines, preserve the standalone scanner and reuse its verified behavior. | Adapters must manage processes, environment, logs and explicit import contracts. |
| Byte-identified source bundle | Ship a portable, known scanner revision without copying its toolchains or depending on a developer's checkout. | Scanner updates require deliberate synchronization and revalidation; hashes identify content, not its correctness. |
| Per-project SQLite and evidence files | Keep inventory/history queryable while retaining raw proof and portable project exports. | Database summaries and file metadata must remain consistent; atomic writes and validation are required. |
| Bounded local job queue, persisted outcomes | Preserve exclusive ownership until evidence settles; reject a full active queue and record interruption after restart. | Work does not resume automatically. A runner and callback are still local Python callables, not a durable distributed queue. |
| NetworkLease and an owned proxy | Enforce project scope for descendants while permitting only the browser/proxy listener owned by that scan. | Linux privilege, group, firewall and session behavior needs real platform testing. |
| Separate candidate and reproduced outcomes | Tool completion and scanner alerts do not establish a vulnerability, device identity or successful session. | More states and evidence must be represented in APIs and the UI. |

The process-session fix, Python 3.12 wrapper-path fix and evidence-collector race
were responses to observed failures. They were not all anticipated in the initial
plan. The boundaries above were planned; some implementation details were learned
through integration. The largest design debt is the shared compatibility runtime,
followed by implicit task/profile dictionaries. The dual API stack has been removed in this revision. Reducing
that coupling is a more useful next refactor than adding another framework or
splitting this local tool into more services.

The Deep scan implementation is included in this checkpoint for `master`.
Its fixture tests, passing real guarded acceptance and remaining limitations are
recorded in [scanner integration](scanner-integration.md).

## Verified architecture improvements

The application validates task outcomes and scan summaries at import/API
boundaries while preserving extension fields. Available Chrome ELF and selected
WPScan application files receive a separate before/after audit from the app
worker; unknown layouts stay unmeasured and prevent a clean scan result. This
supplements the standalone audit. Shared OS/browser libraries and arbitrary Ruby
dependencies/plugins remain outside that added coverage.

History polling uses compact metadata and a bounded serialized-entry cache;
full results load when a card is expanded. Existing detail consumers can still
request full rows. The first read of a restored/uncached history still reads its
metadata files. Directory/stat work remains proportional to history size; this
is not a database-backed history index or a hard RSS limit.

Scanner updates use the explicit inventory and review-digest workflow in
`scripts/update-scanner.py`. Proxy IPC uses typed messages and a single bounded,
nonblocking descriptor read before any privileged command. The privileged
listener checker remains isolated and unchanged. Current test evidence and the
remaining platform limits are in [architecture follow-ups](architecture-follow-ups.md).
