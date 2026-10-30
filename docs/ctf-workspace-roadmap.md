# Planned CTF workspace

The plan for Sploosh4's Legion fork. Checked items are working; unchecked items are still to build. Suggestions and open questions are listed below.

Legion should let you map devices, run commands, use Metasploit and inspect files and websites in the same app.

## Roadmap

- [x] Desktop workspace, scans, evidence graph, jobs and approvals.
- [x] Backend cleanup and React/FastAPI workspace/activity panels.
- [ ] Device map with coloured connection types and commands launched from selected devices.
- [ ] Metasploit integration and a right-hand action/results panel.
- [ ] File-watcher/decoder integration, found-file notifications and user-run hash jobs.
- [ ] File browser and text editor.
- [ ] A unified workflow for website targets and web tools.

## What to build

### Initial reconnaissance and a visible map

- Run initial reconnaissance automatically and add discoveries about the selected targets to the map.
- Show the user's laptop, discovered devices and the links between them. Include an intermediate router or firewall when it has been observed.
- Use different link colours for different connections, with a legend. The categories and colours are still undecided.
- Use the approved device illustrations. Choose an image from the evidence about the device; the artwork alone doesn't establish its identity or NGFW capabilities.

### Actions on the right

- Show suggested actions from scan results in a panel on the right.
- Run Metasploit actions through the same panel and job controls.
- Show deciphered content, found files and suspected password hashes that can be queued for cracking.
- Give each action a **Run** button, the tactic and technique where applicable, and enough context to choose it. The full card contents are still undecided.
- Let the user run several actions. Show which are queued or running, and keep them visible until they finish.
- Only remove actions from the active list after completion. Decide where completed, failed and cancelled work goes.

### Incoming files, decoding and hashes

- Notify the user in the same panel when files arrive.
- Show recognised hashes, encodings or ciphers. Always offer **Open**, even when nothing is recognised.
- Try supported decoders and ciphers automatically. Some inputs will remain encrypted or unrecognised, and detection can be wrong.
- Queue suspected password hashes for the user to review and run.
- Keep a file's integrity checksum separate from suspected password hashes found inside it.

### Filesystem and text editor

- Include a file browser and text editor in the workspace.
- Decide whether to browse local files, remote files through active sessions, or both, and how edits relate to original evidence.

### Website targets

- Add website targets and web tools to the same views, with commands, results and evidence kept together.
- Choose which website tools to support first and how much to integrate them.

## What works now

The current app already contains persistent SQLite workspaces, host/service inventory, an evidence graph, tool execution, approval handling, background jobs and execution history. Workspace identity and activity panels have been migrated to React/TypeScript, with their API routes served by FastAPI. Other views still use the compatibility layer; see [the migration notes](../MIGRATION.md).

Web-tool commands and some Metasploit command mappings already exist. The unified website workflow and deeper Metasploit integration described here remain planned work.

The evidence graph exists; the planned map of network paths from the laptop is still to build. A discovered host, a reachable service and a confirmed network hop are different observations.

A separate local file-watching prototype combines Watchdog, base64dump and Ciphey. It preserves originals, records source hashes and candidate locations, saves derived files and reports failures or partial processing. It is not integrated into Legion, and there is no working Legion importer for its proposed export. Archive/PDF extraction and general cipher detection are not implemented in that prototype.

The device images have been selected. They still need to be added to Legion and matched to supported device classifications.

## Suggestions

These still need a decision.

| Area | Suggested behaviour |
| --- | --- |
| Map evidence | Distinguish reachability, observed hops and confirmed connections; retain unknown hops and show the source and age of a relationship. Supplement colours with labels or line styles. |
| Action cards | Include target, reason for the suggestion, supporting evidence, expected outcome, tool, execution location, prerequisites, impact, progress and access to output. |
| Queue behaviour | Prevent duplicate runs, limit concurrency, offer cancellation, keep failures actionable and retain completed work in searchable history. |
| Panel organisation | Provide views for the selected device, the whole workspace, running work and new files. |
| File attribution | Associate files with their actual collection job/session when known; ask for attribution when it is unknown instead of guessing from filenames. |
| Evidence and editing | Preserve originals, save decoded results and editable copies separately, and retain the link between source and derived content. |
| Analysis limits | Bound automatic processing, report unsupported or partial analysis, and present accepted plaintext as a candidate until verified. |
| Recovery and storage | Preserve useful state across restarts, report interrupted jobs, avoid silently rerunning them, and agree a retention policy for accumulated files. |

## Open questions

1. Does the file browser initially cover workspace files only, or remote machines as well?
2. Should selecting a map node filter the action panel to that device, with a separate whole-workspace view?
3. What inputs and scan depth should initial reconnaissance support: IPs, subnets, domains and/or imported scan results? How should the interface or VPN be chosen?
4. Which relationship categories and colours should the map use?
5. Which action-card fields are essential, and how should actions without a meaningful tactic/technique mapping appear?
6. Where should completed, failed and cancelled actions go, and when may an action be suggested again?
7. Which file types, encodings and cipher families should be supported first? What should a hash action require before it runs?
8. Should the editor cover notes, scripts and other text files, and how should saving or running a script work?
9. Which Metasploit actions and website tools should be integrated first, and what results should their cards show?

## Build order (proposed)

1. Settle the open choices and define a useful first reconnaissance result.
2. Build the map and action panel using the existing scans, jobs and evidence.
3. Add file notifications and a basic file browser/editor.
4. Add Metasploit, file analysis with processing limits, derived results and user-run hash jobs to the panel.
5. Add website targets and the selected web tools.
6. Try it in representative CTF exercises and fix what gets in the way.

There are no delivery dates yet. Test how long it takes to find a useful lead, how many suggestions are irrelevant, whether results can be traced to their evidence, and what survives an interruption. The goal is less repeated work and less switching between tools; that benefit still needs to be tested.
