# FlagHop delivery status

Repository: [Sploosh4/Flagmap](https://github.com/Sploosh4/Flagmap). The GitHub repository has been renamed; existing local folder paths and the current FlagHop application branding remain.

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
- Per-workspace Start/Pause, readiness heartbeats and automatic enrollment of new managed projects. Switching projects or views does not resume processing.
- Real Working and saved-result alerts. Open displays saved bytes in the project editor; Dismiss retains files and provenance.
- Project-bounded file browsing and a tabbed editor. Originals are preserved; text edits stay in browser drafts. Binary and incomplete results are read-only previews.

The independent local acceptance report records 29 checks for real A/B processing and result handling. Four further checks covered a new workspace appearing while the same worker was running. B decoded a file and recovered a synthetic password while A stayed paused; A retained its pending work and processed it after Resume. These are controlled local fixtures, not proof of universal decoder or password coverage.

Reader engines and service live in separate tool directories. See [workspace readers](background-workspaces.md) for the integration contract and limits.

## Active work

| Workstream | Current position | Remaining gate |
| --- | --- | --- |
| Scanner | Separate conditional five-stage profiler and device classifier. Saved round-two acceptance reports 28/28 methods passing, 100/100; the observer records 39/39 original regressions. Three recorded source hashes matched at review. | Three consecutive matching full runs and independent final evidence/documentation/dependency review remain open. Six of eight milestones are complete. Scanner-to-app integration is separate. |
| VPN/network setup | Included: shared scope/exclusions/ports, explicit profile/interface identity, Settings checks, original-project job references, held outcomes and guarded local execution. Real isolated WireGuard and userspace OpenVPN acceptance passed, including Nmap, denied destinations/ports and route-fallback blocking. | Profile discovery/import/connect/disconnect, raw-socket/DCO adapters, remote runners, callback verification and optional traceroute remain planned. |

Acceptance scores describe their defined lab suite. They do not measure whole-app completion, exploit coverage or exact device identity. Metasploit is excluded from the scanner's staged evaluation.

Network commands require local Linux enforcement tools and administrator access. WireGuard needs an existing nonzero transport fwmark; supported OpenVPN uses a userspace `tun` device. Missing enforcement holds a job rather than running it unrestricted. See [network settings and supported modes](project-network-settings.md).

Combined-checkpoint validation: 505 Python tests, Black/flake8, 46 React tests, schema/type checks and a reproducible production bundle passed. Both ASGI and legacy desktop runs passed 66 checks each with no JavaScript errors. The network guard, runner and real-tunnel acceptance sources match the verified network handoff; live host routes and VPNs were not used as test targets.

## Working separately

| Component | Available evidence | Main-app gap |
| --- | --- | --- |
| Device profiler/classifier | Parsed network profiles and ranked role hypotheses, with conflicts and unknowns retained. | Connect profiles/classification to the production device map. Rule strength is not calibrated probability. |
| Shared cipher/password reader | Supported decoding/recovery chains, mixed hashes/encodings, supported archive handling, durable queues and source/result provenance. | Package repeatable setup; add clickable source/version navigation. Engine directories remain external even though controls/results are locally integrated. |
| SSH/SFTP collector and workbench | Explicitly configured endpoints, supplied authentication, verified host identity, remote browsing and local evidence snapshots. | Map authenticated sessions into main Files and the correct project/target. Scope alone does not provide credentials or establish a session. |
| Metasploit profile import | Resource script imports Nmap inventory and a profile note; recorded import verification exists. | Unified module actions, sessions and outcome reporting in the app. Import completion is not exploitation success. |

## Planned and deferred

The reviewed picture/contour map design is ready for implementation. Hover uses a visible light-grey silhouette contour; purple marks the selected device. Connection colours represent connection types. It does not use vulnerability severity to colour device artwork. Figma states are design work, not production map interactions.

Still to build: production topology and keyboard navigation, scanner-to-app profile/event wiring, full action panel and embedded terminal, unified Metasploit jobs, remote sessions in Files, and reader installation/recovery packaging. See the [roadmap](ctf-workspace-roadmap.md).

Authenticated web investigation is deferred until the basic integrated workflow exists. The smaller unified website replacement is a later phase. Unauthenticated web reconnaissance remains in the separate scanner. Detailed privilege-escalation interpretation and reachability/pivoting scope are not yet agreed.

## Problems to track

1. **Integration:** no verified end-to-end path yet connects target selection, the new scanner, the production map, actions and remote Files.
2. **Scanner sign-off:** acceptance passes while repeatability and final review remain open.
3. **Network support:** automatic connection management and unsupported privileged/remote adapters remain incomplete. The tested guard covers app-managed local commands only.
4. **Pause observation:** requests are durable and cooperative; the app cannot confirm the instant every worker has stopped.
5. **Evidence navigation/editing:** provenance exists, but return-to-source links, a visual version chain and durable edited-copy saving remain incomplete.
6. **Packaging/storage:** separate reader dependencies are not a fresh-install experience. The project has a 2,000,000,000-byte cap; measure before copying toolchains.

Earlier roadmap statements that treated all reader/file features as unbuilt have been reconciled in this update. Remove resolved problems when their evidence and implementation checkpoint are available.

## Proposed next milestone

Finish scanner verification, then demonstrate one selected target → scan → evidence → saved-result workflow in the app using the shared network guard. Follow with full action/session wiring, remote Files and repeatable setup. This is a proposed delivery order; no delivery date or work-hours estimate is agreed.

## Evidence ownership

Current application contracts are described in [MIGRATION.md](../MIGRATION.md) and [workspace readers](background-workspaces.md). Implementation and remaining choices are recorded in [requests and questions](requirements-and-questions.md).

The local scanner's owning records are `ctf-profiler/validation/round2-acceptance-003.json`, `SCANNING-PROGRESS-MILESTONES.md` and `pi-bridge/observability/milestones-state.json` in the Hackathons workspace. Reader acceptance is under the app's ignored `.state/research/main-workspace-integration/`. Those local evidence files are not bundled in this public repository. Do not publish real investigation data or recovered secrets to fill that gap.

Update this review alongside relevant implementation changes. Move a capability to the published section only when its code is actually published, and cite checks for the same revision.
