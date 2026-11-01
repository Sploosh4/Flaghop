# Product scope

FlagHop prioritises vulnerable-machine and lab CTFs. The goal is a connected
workspace for reconnaissance, investigation, tool execution and evidence.

## Available in the app

| Area | Current behaviour |
| --- | --- |
| Projects | Named projects, configurable save folders, project switching, SQLite workspaces, save/save-as and ZIP restore/export. Renaming a project keeps its folder. |
| Interface | Qt WebEngine desktop or browser mode, React workspace/activity panels and retained host/service/graph/settings views, all served by FastAPI. |
| Hardware map | Six approved pictures, grey hover/focus and purple selection contours, inventory, saved route observations, pan/zoom, device shortcuts and a resizable results panel. |
| Scanner | Selected-device guarded Deep scan, job/process history, validated inventory/profile import, service and role hypotheses, candidate/reproduced findings and evidence reopening. |
| Network | Project-specific scope/exclusions/ports, connector/profile identity, explicit target checks and guarded local execution. See [setup](setup.md) for supported modes. |
| Readers and files | Project-scoped Cipher/Hash Start/Stop, Working/History, result opening/dismissal and independent local Files/editor windows. Reader engines remain separate dependencies. |
| Recovery | Bounded shutdown, protected owned-process cleanup and offline saved-result settlement. Network commands are never replayed on restart. |

Reader Stop is cooperative and does not confirm the instant a worker stops.
Text edits remain browser drafts; durable edited-copy saving is not implemented.
The empty Cyber Kill Chain section has no integrated action engine.

## Agreed requirements

### Categories, modules, integrations and actions

- Categories and subcategories describe what is targeted, with overlapping
  membership where appropriate. A machine can host related OS, identity and
  application targets in the same investigation.
- Modules organise implementation. Tool integrations adapt existing tools;
  actions represent individual investigator intentions. Modules/categories
  share canonical integrations by default, without duplicating toolchains.
- Every subcategory needs a positive definition of what it can do. Creating a
  subcategory or broadening an agreed definition/capability membership requires
  explicit user approval. AI review, tool discovery and inferred tags cannot
  supply it. The initial production taxonomy still needs agreement.
- Define an action's purpose, accepted inputs, applicability and possible outputs
  before building it. Assume cybersecurity knowledge, without requiring detailed
  tool knowledge. Prefer straightforward implementation and fewer design choices.
- The investigator chooses each meaningful action; FlagHop abstracts tool
  selection and coordination. Investigation is not forced into a fixed sequence.
  A new result must not silently authorise deeper work or expand target scope.

### Map, interaction and evidence

- Keep the approved near-black/grey/purple styling and device artwork. Device
  colour does not indicate vulnerability severity. Selection follows the image's
  silhouette. Put hostname, IP and OS name beneath devices, omitting unknown
  fields and OS versions from those labels.
- Display observed relationships with their source, age and uncertainty.
  Reachability, a service connection, hosting and a physical hop are different
  claims. Do not invent links or classify hardware from its picture alone.
- Known device keys 1–9 select devices; 0 clears selection/refits the map.
  Q/W/E navigate Hardware, Services and Files. Backtick/right-click opens the
  selected device menu. Preserve typing and native window controls.
- Actions should explain applicability and retain readable queue/running/error
  states. Results belong in History with evidence links. Keep execution outcome,
  reproduced finding, validated credential, session and privilege change distinct.
- Preserve originals and source/result associations. A baseline checksum detects
  later changes; it does not establish original authenticity. Arbitrary terminal
  output is not structured evidence without a parser.
- Opening a project/view/file must not start readers, connect a VPN or probe a
  network. Network diagnostics remain in Project setup.

## Outstanding work

- Module/category foundation around existing capabilities; final taxonomy and
  action definitions must be agreed before new capability scope is activated.
- Contextual action cards, bulk actions, an embedded terminal and unified
  Metasploit jobs/sessions. The separate profiler's inventory/note import does
  not implement the app's Metasploit action workflow.
- Observed intermediate-hop import and broader topology views.
- Authenticated SSH sessions associated with projects/devices in main Files.
  The separate SSH/SFTP workbench is not yet integrated there.
- Source/version navigation, durable edited copies, recovery/retention policy
  and repeatable reader installation.
- Connection-profile discovery/import/connect/disconnect, privileged/DCO and
  remote runner adapters, callback checks and optional traceroute.

## Decisions still open

- Whether map layers should be curated combinations of target categories;
  what the opening view should help the investigator decide and immediately see.
- Network-group rectangles, overlapping/multi-interface membership, identity
  pictures, OS badges and application/service satellites. These remain design
  proposals; artwork concepts do not establish implemented map behaviour.
- Meaning of grey relationship lines, connection styles and missing-hop display.
- Action-card metadata, stage filtering, running/completed placement, terminal
  docking and keyboard overflow beyond the available device/action keys.
- Initial reconnaissance depth, resource/time limits and automatic follow-up
  policy; brief versus deeper password recovery and retention of recovered data.
- First Metasploit/session functions and detailed pivot/privilege interpretation.

Authenticated web investigation (login sessions, cookies and tokens) and the
unified website-target workflow follow the basic integrated workflow. Removed
AI planners/providers, relay/capture and external-enrichment features are outside
the current scope. Unauthenticated web checks exist in the bundled scanner.
