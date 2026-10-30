# Planned CTF workspace

This is the intended direction for the Sploosh4 Legion fork. It records the owner's plans and separates them from recommendations that still need a decision. Publishing this roadmap does not implement these features or settle the open questions.

The aim is to keep reconnaissance, the network map, suggested actions, incoming files and notes in one workspace. A user should be able to see what has been discovered, choose several useful actions, inspect their results and continue without losing track of the evidence.

## Confirmed direction

### Initial reconnaissance and a visible map

- Initial reconnaissance should automatically discover and map information about the selected targets.
- The map should include the user's laptop and show relationships to discovered devices and between devices where appropriate. An observed router or firewall can appear between the laptop and a target.
- Different relationship types should use different link colours. The exact colours and relationship categories still need to be defined; include a legend.
- Use the approved device illustrations supplied for this fork. The artwork is illustrative: having a router, server or NGFW image does not establish that a discovered device has that identity or capability.

### Actions on the right

- A panel on the right should fill with suggested actions based on scan results.
- Each action should include a tactic and technique where applicable, essential context and a **Run** button. The full card contents will be decided later.
- The user should be able to press Run on several actions. Each should visibly enter a queued or running state and remain visible while it is in progress.
- Actions should leave the active list only after completion. The treatment of failed, cancelled and completed work still needs a decision.

### Incoming files, decoding and hashes

- The same panel should notify the user when new files arrive.
- File notifications should show detected hashes, encodings or ciphers where recognised, and always provide **Open**, including when nothing is recognised.
- Supported decoding and deciphering should be attempted automatically. This is a goal for supported inputs, not a promise to decrypt arbitrary encryption or correctly recognise every candidate.
- Suspected password hashes should produce queued actions for the user to review and run.
- A file's own integrity checksum must be distinguished from a suspected password hash found inside it.

### Filesystem and text editor

- Include a file browser and text editor in the workspace.
- Decide later whether the browser covers local workspace files, remote files through active sessions, or both, and how editing relates to original evidence.

## Existing foundation and remaining work

The current development branches already contain persistent SQLite workspaces, host/service inventory, an evidence graph, tool execution, approval handling, background jobs and execution history. Workspace identity and activity panels have been migrated to React/TypeScript, with their API routes served by FastAPI. Other views still use the compatibility layer; see [the migration notes](../MIGRATION.md).

The evidence graph is a useful foundation, but it does not establish that the proposed laptop-centred network topology workflow is complete. A discovered host, a reachable service and a confirmed network hop are different observations.

A separate local file-watching prototype combines Watchdog, base64dump and Ciphey. It preserves originals, records source hashes and candidate locations, saves derived files and reports failures or partial processing. It is not integrated into Legion, and there is no working Legion importer for its proposed export. Archive/PDF extraction and general cipher detection are not implemented in that prototype.

The device image set has been selected and handed over. Importing it into the shipped map assets and mapping supported classifications to the images remains implementation work.

## Recommendations awaiting decisions

These are suggestions, not settled product requirements.

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

## Questions to answer next

1. Does the file browser initially cover workspace files only, or remote machines as well?
2. Should selecting a map node filter the action panel to that device, with a separate whole-workspace view?
3. What inputs and scan depth should initial reconnaissance support: IPs, subnets, domains and/or imported scan results? How should the interface or VPN be chosen?
4. Which relationship categories and colours should the map use?
5. Which action-card fields are essential, and how should actions without a meaningful tactic/technique mapping appear?
6. Where should completed, failed and cancelled actions go, and when may an action be suggested again?
7. Which file types, encodings and cipher families should be supported first? What should a hash action require before it runs?
8. Should the editor cover notes, scripts and other text files, and how should saving or running a script work?

## Suggested delivery order

1. Agree the remaining workflow decisions and define what a useful first reconnaissance result looks like.
2. Build the map and right-hand action panel around existing scans, jobs and evidence.
3. Add file notifications and a basic file browser/editor.
4. Integrate bounded file analysis, derived results and user-run hash jobs.
5. Test the complete workflow in representative CTF exercises and improve it from observed friction.

No dates or completion promises are attached to these phases. A useful evaluation should measure time to a useful lead, irrelevant suggestions, evidence traceability and recovery after an interruption. The intended benefit is less repeated work and less switching between tools; it has not yet been demonstrated for this planned workflow.
