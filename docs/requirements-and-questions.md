# Requests and open questions

31 October 2026 contract decision: keep all tool action/result definitions,
observation definitions and artifact references in their dedicated `app/contracts`
folders, with no runtime/IO code, tests or documentation in those folders. Use
approved class roots, one canonical owner, a local/CI checker with rejection
tests, and contributor instructions for both people and AI agents. This
checkpoint updates existing consumers together. Persistent
run recovery is deferred; independent project execution remains separate work.
See [the authoring standard](contract-authoring.md).

Included transport: all HTTP routes, pages, ZIP transfer and WebSockets use FastAPI. The Flask fallback and transport selector are removed; existing project and reader formats are preserved. The separately authorised [architecture improvements](architecture-follow-ups.md) are included in this revision and verified locally.

Updated 31 October 2026. This separates working changes from requests still waiting. Nothing below authorises starting a deferred integration.

This file includes the current app, separate tools and reviewed designs. Design decisions do not imply implemented app interactions. See [delivery status](project-status.md) for the code/evidence boundary and [roadmap](ctf-workspace-roadmap.md) for delivery order.

- Application renamed FlagHop; upstream attribution and compatible workspace formats remain.
- Default save folder is configurable below VPN in Setup. New projects use `Documents/FlagHop/[project name]`; native export dialogs start in that project's `exports` folder. Changing the default affects new projects; an explicit migration can move existing folders after file readers have stopped.
- Existing projects were moved from the old Hackathon root to FlagHop. All 409 files passed size and hash verification; project IDs and reader state were preserved. An old-path compatibility link keeps historical artifact references working, and the reader now uses the new root.
- Map direction: laptop and VPN side by side beneath discovered devices, Obsidian-like connections, initially zoomed out with automatic zoom-out as the graph fills. Node size and spacing are chosen by the design, without exposed customization controls. The initial five visual-design questions are now answered; the Terra map-design agent is working in Figma through computer use.
- Device artwork has hostname, OS and IP underneath when found; missing values are omitted. Device shortcut numbers sit small at the top left. Links are straight. The right action panel is narrow and resizable, about 320–360 px.
- Josh rejected the first map draft and requested a restart with frequent critique. The immediate task is an editable, faithful replica of the current 1520 × 960 Harbour app screenshot, before adding a map or action panel. Typography, colours, spacing, icons, borders and window controls must match the existing app. Review the replica, topology and action panel as separate checkpoints. The first draft's typography, contrast, spacing, incomplete controls and loose connection endpoints did not meet the current app's standard.
- The rebuilt editable shell is available in [FlagHop UI](https://www.figma.com/design/LWCW4k3IdiQWJMoMPoX5Um/FlagHop-UI?node-id=4-118). It passed repeated visual comparisons and corrections against the app screenshot. Josh accepted this styling and asked Terra to add the map and action panel with continued review and corrections. Preserve the accepted shell while designing those additions.
- Josh requested two comparable Figma views: the existing device artwork and simpler rounded outline icons, without coloured backgrounds. Keep their layouts, labels, controls and action panels the same so the artwork is the comparison.
- Josh scrapped the proposed vulnerability-colour view after discussing its usefulness. Keep device icons neutral; do not add severity palettes or assessed/unassessed colouring. Connection colours still distinguish link types, and the selection outline still identifies the selected target.
- Both editable concepts are ready for visual review: [artwork](https://www.figma.com/design/LWCW4k3IdiQWJMoMPoX5Um/FlagHop-UI?node-id=4-290) and [outline](https://www.figma.com/design/LWCW4k3IdiQWJMoMPoX5Um/FlagHop-UI?node-id=4-433). Their exported sidebars, title bars and project headings match the accepted replica; the action panels match each other. Reviewed corrections covered label alignment, connection endpoints, text overlap, queued/interrupted states, Run/Open controls, stage filtering and Deep scan placement. These are static Figma concepts, not implemented app interactions.
- Josh prefers the picture/artwork version. He requested an outline following the selected picture's silhouette instead of the purple circle. The [picture-contour concept](https://www.figma.com/design/LWCW4k3IdiQWJMoMPoX5Um/FlagHop-UI?node-id=4-560) keeps the original picture and uses a separate editable purple outer contour. Purple identifies the selected device that filters the panel; it does not indicate severity. The previous two views remain available for comparison.
- All six device pictures use silhouette contours: no outline by default, light grey on hover, purple when selected. Josh approved the brighter hover treatment (`#b0aab9` at 90% opacity) after the first grey was too faint. The local GUI now implements these states directly in Overview's Hardware layer, with current inventory, saved observed routes, single-target selection, 1–9/0 shortcuts, existing details and a resizable results panel. Merged into `master` from `codex/hardware-overview` on 31 October 2026; `main` remains at `3e31fb4`. Scanner profile import is included in this checkpoint; observed-hop import and full target-filtered action cards remain planned; see [hardware limits](hardware-overview.md).
- At Josh's request in Filesystem-Access, the main app now integrates workspace-specific reader Start/Stop, real Working/result alerts, persistent dismissal, and the local filesystem/editor. The configured Hub ID/folder determines scope; switching views does not resume readers. A fresh worker registration is required for Start, and A Stop request remains distinct from confirmed worker shutdown. Real A/B acceptance covered decoding, synthetic password recovery, retained paused work and result/source integrity. Remote SSH browsing remains in its separate workbench; its main-app session mapping is still pending. See [workspace readers](background-workspaces.md).

## Project foundation in this pass

- [x] Click a project row to open its own home page and Overview.
- [x] Opening a project replaces the project list with a dedicated sidebar: project name at the top, Overview and Project setup below, Setup at the bottom. It does not expand a dropdown in the list. Click FlagHop to return to all projects.
- [x] Hide the old Hosts, Services, Graph, Activity, Credentials, Approvals and quick-action navigation, plus the old ribbon. Keep the reusable parts isolated for now; remove anything the replacement doesn't use later.
- [x] Create and switch named projects, with saved files under `Documents/FlagHop/[project name]` by default. Duplicate names get separate folders.
- [x] Move the project name and folder path to the upper left of Overview. Move the project VPN preference and file list to Project setup, with file access kept inside that project's folder. Keep the bottom computer Setup separate.
- [x] Put Setup with a gear at the bottom of the sidebar and show this computer there.
- [x] Press Setup again to return to the previous page, including its selected host/inspector. Remember that return destination across reloads.
- [x] Detect the Kali/Ubuntu installation profile automatically; remove the platform selector and show only matching install hints. Unsupported profiles keep the audit but cannot queue automatic installs.
- [x] Fill the main area with Application settings. Remove the bottom status bar; keep live status, job count and connection/version/bind/auth details under the existing information button.
- [x] Restore the sidebar collapse/reopen arrows and remember the collapsed state. Remove the decorative arrows from project rows.
- [x] Show a red, **unconfigured** Setup state and inactive VPN controls. This does not report whether a real VPN is connected.
- [x] Allow each project to use the global default or explicitly choose None. The global control currently shows No default.
- [x] Project Connector selection: NetworkManager, OpenVPN or WireGuard, persisted separately from connection state. Computer Setup can install the selected VPN client through the existing installer. Choosing or installing a connector does not connect it.
- [x] Shared [Network settings](project-network-settings.md), allowed targets/exclusions/ports, scope source, explicit profile/interface identity and configuration revisions. App-managed local network jobs use the original project's settings and common scope/profile/route/service checks, with Linux egress restrictions and distinct held outcomes. Real isolated WireGuard and userspace OpenVPN acceptance passed.
- [ ] Automatic connection-profile discovery/import/connect/disconnect, privileged/DCO adapters, remote runners, callback checks and optional traceroute remain planned. Opening a project or its settings does not connect or probe a network.
- [ ] A real connected/disconnected indicator. Red currently means configuration is incomplete.
- [ ] Josh's visual review of this foundation.

## Restored after the foundation review

The first foundation pass made these controls inaccessible. They are now available again:

- Sidebar collapse/reopen and remembered width, with pointer and keyboard resizing.
- Sidebar double-click and breadcrumb click to rename the current project, with validation and Enter/Escape handling. Renaming changes the display name; its existing folder is retained.
- A project context menu with Rename, Save, Save as, Export ZIP and Workspace details. Right-click or Shift F10 opens it; arrows, Home/End, Enter and Escape operate it. Ctrl S saves; Ctrl Shift S opens Save as.
- Open an existing `.legion` path and restore a workspace ZIP from the project home. External/restored workspaces are copied into the configured save folder. Save as creates a separate named project there and copies its documents; the original is preserved. Export/restore includes project documents as well as the existing session/tool-output bundle.
- Ctrl K command search across projects, views, actions and hosts. A project remains selected while searching. Views and tool dialogs open on demand; their old navigation and quick actions remain hidden.
- Application/tool, interface, scheduler and device-category settings from Setup or command search. Existing dialogs and inspectors are reused in an isolated same-origin panel, with their original handlers and close controls.
- Workspace details, live running/queued job counts, action status, version, bind/auth information and connection state. Snapshot updates use the existing WebSocket invalidations, with polling fallback.
- Restore the selected project and page after reload, along with sidebar collapse and width preferences.

The earlier full shell remains hidden by default. Its settings/inspectors are bootstrapped only when opened as a reused panel. No VPN discovery, connecting, scanning or new automatic tool execution is added by this restoration.

## Still to build

### Settings review

The tool audit covers the retained local discovery and protocol tools. Removed web, screenshot, relay and external-enrichment tools are no longer offered for installation. Connector client installation is explicit and separate from connecting a VPN.

- Interface settings controls the evidence graph and optional ASCII background.
- Scheduler settings controls deterministic follow-ups, approvals, concurrency and execution permissions. AI providers, prompt controls and alternate runners are removed.
- Device categories defines labels and matching rules for ports, fingerprints and CPE values.
- Main Setup contains this computer, default VPN preferences and connector installer buttons. Project setup contains the connector choice and shared Network settings, including explicit target checks. Discovery and connection management remain planned.

### Removed in this pass

- AI-assisted planning, provider connections, API-key storage, feedback/reflection loops and provider logs.
- Dedicated web checks, HTTP bootstrap scans, web/remote screenshots and their installers.
- Container, browser and manual execution adapters; commands still run locally with cancellation and output history.
- Responder/NTLM capture and relay, captured-credential exports and their settings.
- Shodan, Chaos, GrayhatWarfare and other external-enrichment launchers; external report delivery.
- Unrestored host-note/manual-category and Add Script controls, target-text-file import, and standalone logging dialogs. Scan/job/decision history remains in Activity. Nmap XML import, project files, graph annotations, exports and approvals remain.

Keep the local protocol checks for optional deeper actions: SMTP, SMB/RDP, IPMI and Cisco Smart Install add coverage beyond the Device Design classifier. Their presence does not mean every check should run automatically. The separate Device Design prototype is unchanged.

Supported automatic decoding and bounded password recovery now run through the separate shared reader; the local main app integrates workspace controls and real results. Deeper user-run recovery policy, packaging and source navigation still need work. Website integration is deferred, with the old suite removed. Network settings are active separately; the reviewed Figma map remains a design rather than a production implementation.

Useful future settings: workflow-specific tool selections, executable/wordlist paths in the UI, per-project targets/exclusions, CPU/RAM/time limits for decoding and recovery, file backup/retention controls, and editable keyboard bindings. Some related values already exist in configuration or Scheduler settings; the gap is a coherent project-facing UI.

### Map and navigation

- A network-topology map starting with the laptop and its VPN, separate from CTF targets. Different link colours mean different connection types.
- Automatically add discoveries from initial reconnaissance. Unknown devices/hops stay unknown, with their traceroute origin retained. Represent gaps without inventing direct physical connections.
- Use the approved device artwork and preserve uncertain classifications. The 21 images have been handed over but are not installed in the map.
- Switch between Devices, Services and Files/evidence with Q/W/E. Keep the selection across layers; more layer keys may be added if useful.
- Hovering an action highlights its target. Targets on another layer appear in a translucent preview without changing the selected layer.
- Number devices 1–9. Number keys select them and filter the panel. 0 returns home to the laptop and clears target selection.
- Backtick opens the selected device's context menu; arrows and numbered options operate it.

### Action panel and terminal

- A compact right-hand panel filtered by Kill Chain stage and selected target. Laptop/VPN selection does not filter it as a CTF target.
- Stage shortcuts Z/X/C/V/B/N, with M proposed for the seventh stage. The user accepted the stage question with “yes”; the seven-stage/M interpretation should be confirmed if changed.
- A/S/D/F/G/H/J/K/L/semicolon/apostrophe run corresponding visible actions. Keep typing in terminals/editors safe from these shortcuts.
- Each card has tactic/technique context, a plain explanation and a Run button on the right. The rest of the card fields still need agreement.
- Queued cards look different. Running cards are greyed, show a loading overlay and appear under Working. Keep them readable.
- Completed output moves to History at the bottom. Failed/interrupted actions return to the normal queue, marked red with the reason.
- Deep scan sits below Working and above History, grouped by device. Selecting a device collapses that group and puts a separated Deep scan action at the end of its action list.
- Use restrained colours for tactics/stages and file/cipher/hash events. Exact colours are not settled.
- An embedded terminal that runs real commands. Known command results should update the map; arbitrary terminal output cannot be assumed to be structured evidence.
- Integrate Metasploit actions with the same jobs, panel and results.

### Files, decoding and password recovery

- Local scanner slice: selected-device Deep scan, queued/running/partial/failure
  outcomes, validated profile import and independent evidence reopening are
  included in this checkpoint. Working/History and device filtering
  use actual project-bound records. Live owned-fixture acceptance passed with
  normal-user execution, real guarded browser proof, allowed/denied-port controls
  and evidence reopening. The integration is included in this `master` checkpoint.

- Included in `master`: an empty Cyber Kill Chain section now sits above Hash/Cipher. Its action engine is pending. Hardware shortcut numbers are larger and VPN pictures show the selected protocol where known; connection lines still require saved observations.

- Local integration is implemented through the shared reader's project-scoped APIs, queues/results and health metadata. Cipher Watch/Hash Watch engines remain in separate directories; packaging is pending. Do not duplicate toolchains into Legion without checking storage.
- Notify on new/changed files; show recognised encodings/ciphers/hashes and always offer Open.
- Run supported deciphering automatically, with processing limits and honest partial/failure states. Keep originals and derived results linked.
- Put password/hash actions at the top of the queue. Decide how the automatic brief pass relates to user-run deeper recovery.
- Limit John the Ripper/Hashcat background work so the laptop stays responsive; process one hash target at a time and support interruption/resume.
- Keep hash-format alternatives and source context. An integrity checksum is not automatically a password hash.
- Verify file integrity when a trusted reference checksum is available, or detect later changes against a recorded baseline. Decide how to show those different outcomes.
- The local project browser/editor is implemented. Text edits currently stay in browser drafts; durable edited copies in the configured project folder remain to implement. Remote browsing still lives in its separate workbench.

### Website tools and Figma

- Website integration remains a later phase. The old web checks and screenshot suite have been removed. Agree the smaller replacement before implementing it.
- Authenticated website investigation is deferred: login sessions, cookies, tokens and authenticated views come after the basic integration.
- **The Terra Figma map workflow has resumed at Josh's request**, through computer use after the first five visual questions were answered. This authorises a design draft; implementing the map remains separate work.
- Keep the near-black T3-inspired style, minimal visible text and no extra tips or explanatory UI copy.

## UI questions

1. The topology map will live directly in Overview. The project name and folder path sit at the upper left; connector preference and network diagnostics are in Project setup. Editor placement and action-filter grouping still need a decision.
2. Should renaming also rename its folder later? Inline rename is restored; it currently keeps the existing folder.
3. Local Files and Text Editor now open in independent windows/tabs. Remote SSH connections should become separate clickable sessions; how should they be named and associated with devices? Terminal placement remains open.
4. Which connection categories, colours and line styles should the map use? How should multiple missing traceroute hops look?
5. Should Q/W/E be the only layers initially? Which extra layer, if any, deserves R?
6. Confirm seven Kill Chain stages with M added. Should file/hash events stay visible when a stage filter is selected?
7. What happens when there are more than nine devices or eleven visible actions? Keys should not silently change targets while a user is about to press them.
8. Which card details remain visible, and which appear only when expanded? Where do the plain explanation and output go?
9. Should a running card move entirely into Working or also remain marked in its original list? How should finished Deep scan results appear?
10. Local/direct access is a normal mode. How should connection status distinguish unknown, disconnected and failed without implying a check that never happened?
11. Project files/results now open in the integrated editor or a read-only preview. How should durable edited copies be saved and named, and should a system-app option be added?

## Non-UI questions

1. What targets, scan depth and exclusions should initial reconnaissance accept? How is its execution location chosen: laptop/interface/VPN or a remote session?
2. Local/direct, NetworkManager and explicit OpenVPN/WireGuard identities are supported under the limits in the network guide. Which privileged or remote adapter should follow the current Linux runner?
3. Connector/default selection only saves a preference. Profile discovery and explicit connection management remain to design; project opening must not connect automatically.
4. Missing scope, wrong interface/profile/routes, unavailable enforcement and failed required services hold dependent network jobs. Offline file work can continue. Which additional diagnostics should be recorded without blocking?
5. Which observations become stale after a target reset, IP reuse, VPN/routing change or session loss? Agree the useful stale indicators and refresh behaviour; a specific example was requested earlier.
6. Which terminal tools can supply structured results? How should manually typed commands, exit status, output files and remote sessions be attributed to map entities?
7. Where do card explanations come from: authored descriptions, tool/module metadata or reviewed generated drafts? How are tactic, technique and Kill Chain stage mapped separately?
8. Which devices/services make an action applicable? EPSS scores CVEs, not tactics or hash jobs; decide whether it should only sort actions tied to matching CVEs, and what orders the rest.
9. Which scans belong in Deep scan, with what time, traffic and resource limits? Which actions need dependencies or approval?
10. Are brief hash attempts automatic, while longer recovery needs Run? What CPU/memory/time limits, queue ordering and pause/resume rules should apply? No automatic use of recovered credentials is agreed.
11. How is a checksum identified and associated with the file it verifies? A recorded baseline detects later changes but does not prove the original file was authentic.
12. Which file formats and decoder/cracker adapters come first? Archives, PDFs and other protected files have different support levels in the prototypes.
13. How are duplicate files, changed versions, recovered secrets, storage limits and retention handled? Which source and validation records must persist?
14. Which Metasploit modules, session functions and website tools are first? Keep command completion, validated findings, sessions and privilege changes as separate outcomes.

Prototype paths and user decisions are recorded in the handoffs in this chat and `WORKFLOW-DECISIONS.md` in the Hackathons workspace. Separate-tool tests do not prove main-app integration. Reader/files integration has its own local acceptance evidence; the scanner adapter now has its own live guarded acceptance; remote-session and Metasploit action wiring remain separate work.
