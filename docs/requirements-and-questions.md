# Requests and open questions

Updated 31 October 2026. This separates working changes from requests still waiting. Nothing below authorises starting a deferred integration.

## Project foundation in this pass

- [x] Click a project row to open its own home page and Overview.
- [x] Opening a project replaces the project list with a dedicated sidebar: project name at the top, Overview below, Setup at the bottom. It does not expand a dropdown in the list. Click Legion to return to all projects.
- [x] Hide the old Hosts, Services, Graph, Activity, Credentials, Approvals and quick-action navigation, plus the old ribbon. Keep the reusable parts isolated for now; remove anything the replacement doesn't use later.
- [x] Create and switch named projects, with saved files under `Documents/Hackathon/[project name]`. Duplicate names get separate folders.
- [x] Show project files in Overview, with file access kept inside that project's folder.
- [x] Put Setup with a gear at the bottom of the sidebar and show this computer there.
- [x] Press Setup again to return to the previous page, including its selected host/inspector. Remember that return destination across reloads.
- [x] Detect the Kali/Ubuntu installation profile automatically; remove the platform selector and show only matching install hints. Unsupported profiles keep the audit but cannot queue automatic installs.
- [x] Fill the main area with Application settings. Remove the bottom status bar; keep live status, job count and connection/version/bind/auth details under the existing information button.
- [x] Restore the sidebar collapse/reopen arrows and remember the collapsed state. Remove the decorative arrows from project rows.
- [x] Show a red, **unconfigured** Setup state and inactive VPN controls. This does not report whether a real VPN is connected.
- [x] Allow each project to use the global default or explicitly choose None. The global control currently shows No default.
- [ ] VPN discovery, installed-profile lists, refresh/rescan, live connection status, connecting and default-VPN selection. **Deferred at Josh's request. No VPN scanning is implemented.**
- [ ] A real connected/disconnected indicator. Red currently means configuration is incomplete.
- [ ] Josh's visual review of this foundation.

## Restored after the foundation review

The first foundation pass made these controls inaccessible. They are now available again:

- Sidebar collapse/reopen and remembered width, with pointer and keyboard resizing.
- Sidebar double-click and breadcrumb click to rename the current project, with validation and Enter/Escape handling. Renaming changes the display name; its existing folder is retained.
- A project context menu with Rename, Save, Save as, Export ZIP and Workspace details. Right-click or Shift F10 opens it; arrows, Home/End, Enter and Escape operate it. Ctrl S saves; Ctrl Shift S opens Save as.
- Open an existing `.legion` path and restore a workspace ZIP from the project home. External/restored workspaces are copied into the managed Hackathon folder. Save as creates a separate named project there and copies its documents; the original is preserved. Export/restore includes project documents as well as the existing session/tool-output bundle.
- Ctrl K command search across projects, views, actions and hosts. A project remains selected while searching. Views and tool dialogs open on demand; their old navigation and quick actions remain hidden.
- Application/tool, interface, scheduler and device-category settings from Setup or command search. Existing dialogs and inspectors are reused in an isolated same-origin panel, with their original handlers and close controls.
- Workspace details, live running/queued job counts, action status, version, bind/auth information and connection state. Snapshot updates use the existing WebSocket invalidations, with polling fallback.
- Restore the selected project and page after reload, along with sidebar collapse and width preferences.

The earlier full shell remains hidden by default. Its settings/inspectors are bootstrapped only when opened as a reused panel. No VPN discovery, connecting, scanning or new automatic tool execution is added by this restoration.

## Still to build

### Settings review

The tool audit now covers the retained local discovery and protocol tools. Removed web, screenshot, relay and external-enrichment tools are no longer offered for installation. No tools were installed during this change.

- Interface settings controls the evidence graph and optional ASCII background.
- Scheduler settings controls deterministic follow-ups, approvals, concurrency and execution permissions. AI providers, prompt controls and alternate runners are removed.
- Device categories defines labels and matching rules for ports, fingerprints and CPE values.
- Setup contains this computer and deferred VPN preferences. VPN discovery is still not implemented.

### Removed in this pass

- AI-assisted planning, provider connections, API-key storage, feedback/reflection loops and provider logs.
- Dedicated web checks, HTTP bootstrap scans, web/remote screenshots and their installers.
- Container, browser and manual execution adapters; commands still run locally with cancellation and output history.
- Responder/NTLM capture and relay, captured-credential exports and their settings.
- Shodan, Chaos, GrayhatWarfare and other external-enrichment launchers; external report delivery.
- Unrestored host-note/manual-category and Add Script controls, target-text-file import, and standalone logging dialogs. Scan/job/decision history remains in Activity. Nmap XML import, project files, graph annotations, exports and approvals remain.

Keep the local protocol checks for optional deeper actions: SMTP, SMB/RDP, IPMI and Cisco Smart Install add coverage beyond the Device Design classifier. Their presence does not mean every check should run automatically. The separate Device Design prototype is unchanged.

Automatic decoding and a bounded file-hash recovery queue are still planned. Removing credential capture does not remove those requirements. Website integration is deferred for a later design, with the old suite removed now. VPN discovery and the Figma workflow remain paused.

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

- Integrate Cipher Watch and Hash Watch. Both are separate local prototypes, not Legion integrations. Do not copy their toolchains into Legion without checking storage.
- Notify on new/changed files; show recognised encodings/ciphers/hashes and always offer Open.
- Run supported deciphering automatically, with processing limits and honest partial/failure states. Keep originals and derived results linked.
- Put password/hash actions at the top of the queue. Decide how the automatic brief pass relates to user-run deeper recovery.
- Limit John the Ripper/Hashcat background work so the laptop stays responsive; process one hash target at a time and support interruption/resume.
- Keep hash-format alternatives and source context. An integrity checksum is not automatically a password hash.
- Verify file integrity when a trusted reference checksum is available, or detect later changes against a recorded baseline. Decide how to show those different outcomes.
- Add a file browser/editor. Editing original evidence must save a copy under `Documents/Hackathon/[project name]`.

### Website tools and Figma

- Website integration remains a later phase. The old web checks and screenshot suite have been removed. Agree the smaller replacement before implementing it.
- Authenticated website investigation is deferred: login sessions, cookies, tokens and authenticated views come after the basic integration.
- **The Terra Figma workflow is paused.** Resume only after Josh reviews the foundation and asks to continue. No new Figma work is authorised by this log.
- Keep the near-black T3-inspired style, minimal visible text and no extra tips or explanatory UI copy.

## UI questions

1. Review the dedicated project-page layout. What should the new Overview contain beyond files and VPN preference?
2. Should renaming also rename its folder later? Inline rename is restored; it currently keeps the existing folder.
3. Should the file browser cover local files only, remote files, or both? Where should the editor and terminal dock?
4. Which connection categories, colours and line styles should the map use? How should multiple missing traceroute hops look?
5. Should Q/W/E be the only layers initially? Which extra layer, if any, deserves R?
6. Confirm seven Kill Chain stages with M added. Should file/hash events stay visible when a stage filter is selected?
7. What happens when there are more than nine devices or eleven visible actions? Keys should not silently change targets while a user is about to press them.
8. Which card details remain visible, and which appear only when expanded? Where do the plain explanation and output go?
9. Should a running card move entirely into Working or also remain marked in its original list? How should finished Deep scan results appear?
10. Should intentional No VPN look different from disconnected, unknown or failed status? Future red status should not imply a connection check that never happened.
11. Should project files open in a read-only preview, an editor, or the system app? How should edited copies be named?

## Non-UI questions

1. What targets, scan depth and exclusions should initial reconnaissance accept? How is its execution location chosen: laptop/interface/VPN or a remote session?
2. How should VPN discovery work across NetworkManager, external OpenVPN/WireGuard clients and unmanaged tunnels? Which providers/platforms need support? This remains deferred.
3. Does selecting a default VPN only remember it, or also connect it on project open? What happens when it is missing, disconnected or routes only some targets?
4. How should events without a VPN work: downloadable challenges, browser-hosted targets or an on-site network? Which failures should block a job rather than just mark its status?
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

Prototype paths and user decisions are recorded in the handoffs in this chat and `WORKFLOW-DECISIONS.md` in the Hackathons workspace. The prototypes' successful tests do not mean these features are integrated into Legion.
