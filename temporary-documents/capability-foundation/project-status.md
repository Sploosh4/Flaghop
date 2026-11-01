# FlagHop delivery status

## Review repairs — 1 November 2026

Developed on `codex/review-boundaries` from `e23c5ce`, these changes repair eight
failures found in independent review. These include pre-write
profile/XML validation, actual UI/action contracts, alias/cycle enforcement,
bounded shutdown and protected offline recovery, bounded atomic ZIP restores,
queued source pinning, full copied-history preservation and truthful outcomes.
See [the eight-item acceptance record](review-boundary-repairs.md).

Targeted fixtures include real non-network child termination, detached scanner
Runner children, unreaped crashed owners, actual SQLite rollback, SIGKILL at four
import boundaries and original-A recovery with B still selected. Unverified
ownership and missing cleanup permission remain held. None of these fixtures
adds a new live scanner/browser/VPN certification. The frozen candidate passes
652 Python tests, Black/flake8, contract checks, 62 frontend tests, generated
OpenAPI/TypeScript and reproducible production assets, and 128 native desktop
checks without JavaScript errors. Dependency and mounted storage checks pass.
Builder independently signed off after another 95 focused tests and a matching
740-file source identity. All eight review findings are closed in this revision.

## Historical contract sweep

31 October 2026 checkpoint, developed from `main` revision `877b794`.
Action/result, observation and artifact-reference definitions now have dedicated
definition-only packages and canonical application/test imports. A checker in the
maintainability/CI gate enforces approved roots, ownership, pure dependencies,
folder contents, import cycles and structured reference types. Contributor rules
and rejection tests make violations actionable for future human/AI changes.
Parser/target-state, network-report and reader-result boundaries use the shared
models while services retain file ownership, links and checksum enforcement.
At this historical checkpoint, persistent recovery was deferred. The current
authorized cleanup/offline-settlement work above supersedes that limitation.
Final local validation passed 588 Python tests, Black/flake8, the contract checker,
58 frontend tests, generated OpenAPI/TypeScript checks and the reproducible
production bundle. Native fixtures passed 110 checks (66 workspace, 16 hardware,
15 documents, 13 scanner) with no JavaScript errors. These fixtures do not add a
new live network-enforcement claim. The storage guard passed within the existing
2 GB cap. Earlier counts describe their own dated checkpoints. See
[contract authoring](contract-authoring.md).

Repository: [Sploosh4/Flaghop](https://github.com/Sploosh4/Flaghop). The GitHub repository has been renamed; existing local folder paths and the current FlagHop application branding remain.

Reviewed **31 October 2026**. This describes the project across its published repository, local development app and separate tools. It is a dated review, not a live monitor or a release announcement.

This checkpoint combines the workspace/reader implementation, the published documentation review and the project network settings work. The app remains FlagHop; renaming its repository did not move local folders again.

## Published foundation

- Desktop Qt WebEngine shell and localhost browser mode.
- Named projects, SQLite workspaces, local scan/tool execution, host/service inventory and evidence graph.
- Jobs, approvals, cancellation, execution history, Nmap XML import and project save/restore/export.
- React/TypeScript project and activity panels served through FastAPI, with retained compatibility views.

Some earlier AI, web/screenshot, relay and external-enrichment integrations were removed. They are not part of the current product promise. The historical upstream changelog remains preserved.

## Included file and reader integration

This checkpoint includes:

- FlagHop branding, configurable project save folders, and separate project/computer setup.
- Stable project-ID routing for cipher/password reader controls, queues, results and local Files.
- Per-workspace Start/Stop, readiness heartbeats and automatic enrollment of new managed projects. Switching projects or views does not resume processing.
- Real Working and saved-result alerts. Open displays saved bytes in the project editor; Dismiss retains files and provenance.
- Project-bounded file browsing and a tabbed editor. Originals are preserved; text edits stay in browser drafts. Binary and incomplete results are read-only previews.

The independent local acceptance report records 29 checks for real A/B processing and result handling. Four further checks covered a new workspace appearing while the same worker was running. B decoded a file and recovered a synthetic password while A stayed paused; A retained its pending work and processed it after Resume. These are controlled local fixtures, not proof of universal decoder or password coverage.

Reader engines and service live in separate tool directories. See [workspace readers](background-workspaces.md) for the integration contract and limits.

## FastAPI-only migration and architecture improvements

This revision replaces all remaining HTTP handlers, Jinja pages, uploads/downloads and static serving with native FastAPI routes. Flask, Flask-Sock, Werkzeug and the WSGI adapter are removed from requirements and application imports; there is no alternate transport flag. It builds on the earlier `ca4caea` scanner checkpoint. Local validation passed without those packages installed: 529 Python tests plus three transfer-lifecycle tests, Black/flake8, 56 React tests, generated contracts/types, reproducible production assets and 128 native desktop checks (66 workspace, 16 hardware, 15 documents, 13 scanner fixture, 18 window controls). The running localhost backend was restarted while idle and serves health, page and assets successfully. Older two-transport counts below describe their dated checkpoints, not a requirement to retain that stack.

Josh authorised and this revision includes verified material improvements for all eight [architecture follow-ups](architecture-follow-ups.md), with before/after evidence and regression tests. The improvements add shared project lock ownership, typed scanner facts, settled job publication/restart recovery, bounded history polling, checked scanner updates and strict proxy IPC. It also supplements the standalone dependency audit with actual Chrome/WPScan application hashes. The frozen code passes 564 Python tests, 58 frontend tests, 51 scanner regressions, 13 supplemental behaviour checks, 128 native desktop checks. Native HEAD/OPTIONS compatibility is tested across the retained route inventory and checked on the running backend. The fresh real-browser gate passed four cases before the app acceptance run. Scale measurements cover 1,000 saved runs with bounded 200-card rendering. Fresh real app allowed/denied traffic, browser reproduction, settled import/evidence reopening and isolated WireGuard/OpenVPN guard/common-runner checks pass. Final scan retention is 493,081 bytes/44 files, with 186,010,745 bytes sampled temporary growth and no temporary leftovers; see the follow-up record for measurement limits.

## Active work

This checkpoint implements a thin adapter around
all 18 scanner modules: selected-device Deep scan jobs, revision/scope checks,
guarded descendants and an owned-proxy handshake, validated profile/evidence
import, service and role/finding views, and independent evidence reopening.
At the earlier `ca4caea` checkpoint, app fixture tests exercised both transports; this revision tests the retained native transport. Live privileged egress acceptance
passed against an owned local fixture: normal-user execution, allowed/denied-port
controls, real guarded browser proof, profile import and evidence reopening. No
guard bypass was used. Post-launcher checks passed 529 Python tests and 56 React tests, with scanner fixtures
and the existing desktop regressions passing on both transports. The scanner's
owner completed fresh Python 3.12 compatibility validation and evidence review:
51 regressions on each interpreter, 15 supplemental checks and three 28/28
browser-gated runs. That standalone audit remains narrower; this revision adds actual Chrome/WPScan implementation fingerprints in the app worker. See [scanner integration](scanner-integration.md)
and [architecture](../../docs/architecture.md).

| Workstream | Current position | Remaining gate |
| --- | --- | --- |
| Scanner | Conditional five-stage profiler and device classifier; current Python 3.12 compatibility candidate passes 51 regressions on both interpreters, 15 supplemental checks and three matching browser-gated runs with 28/28 acceptance checks each. Source and evidence review completed. | The app now supplements the standalone audit with Chrome ELF/WPScan application fingerprints. Shared OS/Ruby dependency coverage remains incomplete. The owned-fixture app guard path passed separately; this does not establish every network/tool configuration. |
| VPN/network setup | Included: shared scope/exclusions/ports, explicit profile/interface identity, Settings checks, original-project job references, held outcomes and guarded local execution. Real isolated WireGuard and userspace OpenVPN acceptance passed, including Nmap, denied destinations/ports and route-fallback blocking. | Profile discovery/import/connect/disconnect, raw-socket/DCO adapters, remote runners, callback verification and optional traceroute remain planned. |

Acceptance scores describe their defined lab suite. They do not measure whole-app completion, exploit coverage or exact device identity. Metasploit is excluded from the scanner's staged evaluation.

Network commands require local Linux enforcement tools and administrator access. WireGuard needs an existing nonzero transport fwmark; supported OpenVPN uses a userspace `tun` device. Missing enforcement holds a job rather than running it unrestricted. See [network settings and supported modes](project-network-settings.md).

Earlier combined-checkpoint validation: 505 Python tests, Black/flake8, 46 React tests, schema/type checks and a reproducible production bundle passed. Both ASGI and legacy desktop runs passed 66 checks each with no JavaScript errors. The network guard, runner and real-tunnel acceptance sources match the verified network handoff; live host routes and VPNs were not used as test targets.

## Working separately

| Component | Available evidence | Main-app gap |
| --- | --- | --- |
| Device profiler/classifier | Parsed profiles and ranked role hypotheses, with conflicts/unknowns retained; local app adapter updates service inventory and exposes saved role/finding evidence. | Extend the broader action/session workflow separately. Rule strength is not calibrated probability. |
| Shared cipher/password reader | Supported decoding/recovery chains, mixed hashes/encodings, supported archive handling, durable queues and source/result provenance. | Package repeatable setup; add clickable source/version navigation. Engine directories remain external even though controls/results are locally integrated. |
| SSH/SFTP collector and workbench | Explicitly configured endpoints, supplied authentication, verified host identity, remote browsing and local evidence snapshots. | Map authenticated sessions into main Files and the correct project/target. Scope alone does not provide credentials or establish a session. |
| Metasploit profile import | Resource script imports Nmap inventory and a profile note; recorded import verification exists. | Unified module actions, sessions and outcome reporting in the app. Import completion is not exploitation success. |

## Hardware/editor UI checkpoint

Merged from `codex/hardware-overview` into `master` on 31 October 2026: the Hardware layer now renders directly in Overview,
using the approved pictures and grey-hover/purple-selection silhouette contours.
It uses project-matched inventory and saved route observations, with device
selection/shortcuts, details, pan/zoom and a resizable results panel. The app
code matches the CI-verified `78e278c` checkpoint. `main` remains at `3e31fb4`. See [hardware behaviour and limits](hardware-overview.md).

The picture/contour artwork and selection treatment are included in `master`. The
full scanner-fed topology, observed intermediate hops and unified action panel
remain planned. Device artwork has no vulnerability severity colouring.

The same checkpoint groups Hash/Cipher notifications, add History below
Working, and use green Start/red Stop controls. Internal database/wordlist-derived
candidates stay in History. Files and Text Editor open independently with native
window controls; opening a result neither replaces Overview nor opens Files.
The local source is labelled Laptop. Remote SSH session mapping remains pending.
The panel also has an empty Cyber Kill Chain section above Hash. Device shortcut
numbers are larger; the VPN picture shows the selected WireGuard/OpenVPN type
where known, or Unknown otherwise. Neither the label nor an empty section implies an active connection
or implemented kill-chain actions.

Local UI validation: 507 Python tests and 54 React tests passed, along with
format/lint, schema/type and production-bundle checks. Workspace, hardware and
independent-document smoke checks passed on both transports (188 checks total).
Native title-bar checks also passed. These checks use isolated synthetic files
and do not run target scans or connect to SSH hosts.
The subsequent Cyber Kill Chain/number/VPN-label refinement passed 55 React tests
and 16 hardware desktop checks per transport, including the Unknown fallback.

## Planned and deferred

Included in this checkpoint: the verified scanner/profile import slice.
Still to build: observed-hop topology import, the full action panel and embedded
terminal, unified Metasploit jobs, remote sessions in Files, and reader
installation/recovery packaging. See the [roadmap](ctf-workspace-roadmap.md).

Authenticated web investigation is deferred until the basic integrated workflow exists. The smaller unified website replacement is a later phase. Unauthenticated web reconnaissance remains in the separate scanner. Detailed privilege-escalation interpretation and reachability/pivoting scope are not yet agreed.

## Problems to track

1. **Broader integration:** selected-target scan, inventory, findings and saved evidence are verified locally. Full action/session wiring, observed-hop topology and remote Files remain separate work.
2. **Scanner identity:** the local candidate adds actual Chrome ELF and selected WPScan application fingerprints with mutation tests. Shared OS/Ruby dependencies remain outside that audit; fresh local app/browser evidence passes. The earlier checkpoint retains the older scope.
3. **Network support:** automatic connection management and unsupported privileged/remote adapters remain incomplete. The tested guard covers app-managed local commands only.
4. **Pause observation:** requests are durable and cooperative; the app cannot confirm the instant every worker has stopped.
5. **Evidence navigation/editing:** provenance exists, but return-to-source links, a visual version chain and durable edited-copy saving remain incomplete.
6. **Packaging/storage:** separate reader dependencies are not a fresh-install experience. The project has a 2,000,000,000-byte cap; measure before copying toolchains.

Earlier roadmap statements that treated all reader/file features as unbuilt have been reconciled in this update. Remove resolved problems when their evidence and implementation checkpoint are available.

## Proposed next milestone

The selected target → scan → evidence → saved-result workflow passed with the shared network guard. Next work is full action/session wiring, remote Files and repeatable setup. This is a proposed delivery order; no delivery date or work-hours estimate is agreed.

## Evidence ownership

Current application contracts are described in [MIGRATION.md](../MIGRATION.md) and [workspace readers](background-workspaces.md). Implementation and remaining choices are recorded in [requests and questions](requirements-and-questions.md).

The local scanner's owning records are `ctf-profiler/validation/compat-python312-20261031/REPORT.md` and its source/evidence manifests. Earlier round-two reports and observer milestones remain historical records in the Hackathons workspace. Reader acceptance is under the app's ignored `.state/research/main-workspace-integration/`. Those local evidence files are not bundled in this public repository. Do not publish real investigation data or recovered secrets to fill that gap.

Update this review alongside relevant implementation changes. Move a capability to the published section only when its code is actually published, and cite checks for the same revision.

## Local capability-foundation candidate — 1 November 2026

A local branch experiments with declarative module/integration metadata and a
read-only inspection endpoint over existing action sources. Existing execution
and policy remain in their current owners. No production category definitions
are approved; proposals remain draft. See [authoring](capability-authoring.md)
and [inventory](capability-action-inventory.md). This is a local candidate,
not a published release or a new live scanner/network certification.
