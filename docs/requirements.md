# Software requirements

## Purpose and scope

FlagHop is a desktop/browser workspace for vulnerable-machine and lab CTFs.
Its users understand reconnaissance and investigation but need not know every
tool. It connects target discovery, actions, files and evidence within projects.
Use [README](../README.md) for available features and
[architecture](architecture.md) for the implemented design.

This specification uses a lightweight requirements structure informed by
[ISO/IEC/IEEE 29148](https://www.iso.org/standard/72089.html), within the document
types described by [ISO/IEC/IEEE 15289](https://www.iso.org/standard/74909.html).
It is not a claim of full standards conformance.

## Terms and status

| Term | Meaning |
| --- | --- |
| Category/subcategory | A defined kind of target; memberships may overlap |
| Module | An implementation package with defined responsibilities |
| Tool integration | An adapter connecting an external tool to shared application contracts |
| Action | An individual investigative intention with defined inputs, applicability and outputs |
| Observation | Evidence of a fact or hypothesis, with source and uncertainty retained |

Approval and implementation are independent. **Agreed** records an accepted
product requirement; **Existing** identifies a compatibility requirement from
current app behaviour. Neither status approves a new category/action by inference.
Implementation is **Implemented**, **Partial** or **Planned** in this checkout.
Linked code/tests identify verification paths, not a claim of a fresh test run.

## Functional requirements

| ID | Requirement | Acceptance criterion / check | Approval | Implementation |
| --- | --- | --- | --- | --- |
| REQ-PRJ-001 | Project data and jobs shall retain their original project identity. | Switching, save-as and restore preserve isolation and evidence; [project checks](../tests/app/test_ProjectHub.py). | Existing | Implemented |
| REQ-CAT-001 | Categories/subcategories shall describe targets and allow overlapping membership. | One machine can expose related OS, identity and application targets without losing their associations. | Agreed | Planned |
| REQ-CAT-002 | Each subcategory shall positively define its capabilities and require explicit user approval for creation or expansion. | Unapproved definitions and indirect capability expansion cannot become active through discovery, installation or AI review. | Agreed | Planned |
| REQ-MOD-001 | Modules/categories shall share canonical tool integrations by default. | Multiple modules reference one integration while distinct actions/profiles remain separate; use the [existing registry](../app/scheduler/registry.py). | Agreed | Planned |
| REQ-ACT-001 | An action's purpose, inputs, applicability and possible outputs shall be defined before implementation. | A definition is inspectable independently of its tool; unknown capabilities remain unknown. [ActionSpec](../app/contracts/actions/planning.py) supplies the existing foundation. | Agreed | Partial |
| REQ-ACT-002 | The investigator shall choose meaningful actions while FlagHop abstracts tool selection and coordination. | Actions need no detailed tool knowledge, do not require a fixed investigation sequence and do not silently expand authorised scope. | Agreed | Partial |
| REQ-MAP-001 | Devices shall use the approved neutral artwork with silhouette-based hover/focus/selection. | Grey marks hover/focus, purple marks selection, and device colour does not assert severity; [map checks](../frontend/src/hub/hardware/HardwareMap.test.tsx). | Agreed | Implemented |
| REQ-MAP-002 | Device labels shall show known hostname, IP and OS name, excluding OS versions. | Unknown fields are omitted and version-bearing OS input is rendered as a name-only label; [current model](../frontend/src/hub/hardware/model.ts). | Agreed | Partial |
| REQ-MAP-003 | Relationship displays shall retain their evidence source, age, type and uncertainty. | Reachability, hosting, communication and physical hops remain distinct; missing hops are not invented. Saved routes exist; broader relationship views remain to build. | Agreed | Partial |
| REQ-UI-001 | Device/navigation shortcuts shall preserve terminal/editor typing. | 1–9 select, 0 clears/refits, Q/W/E navigate Hardware/Services/Files, and backtick/context menu operates the selection; [desktop fixture](../tests/desktop/hardware_smoke.py). | Agreed | Implemented |
| REQ-EVD-001 | Execution, candidate/reproduced findings, credential validation, sessions and privilege changes shall remain distinct outcomes. | An exit-zero process or parsed alert cannot create a reproduced finding without retained proof; [scanner contracts](../tests/app/test_ScannerContracts.py). | Agreed | Implemented |
| REQ-FIL-001 | Investigation shall preserve original files and source/result associations. | Opening, dismissing, copying and recovery retain original bytes and provenance; [artifact checks](../tests/app/test_ArtifactContracts.py). A checksum baseline does not establish original authenticity. | Agreed | Implemented |
| REQ-FIL-002 | Edited text shall support durable derived copies without overwriting original evidence. | An edited copy can be saved/reopened with a source association; current browser drafts alone do not satisfy this. | Agreed | Planned |
| REQ-RDR-001 | Reader controls shall operate per project with cooperative pause semantics. | Start needs fresh matching registration; Stop preserves work and reports the request without claiming immediate termination; [reader checks](../tests/app/test_ProjectBackground.py). | Existing | Implemented |

## Quality, interface and operating constraints

| ID | Requirement | Acceptance criterion / check | Approval | Implementation |
| --- | --- | --- | --- | --- |
| REQ-NET-001 | App-managed network work shall use its original project's verified scope/profile/route and enforced runner. | Exclusions, wrong paths and missing enforcement hold/interrupt work without unrestricted fallback; [network checks](../tests/app/test_ProjectNetworks.py), supported modes in [operations](operations.md). | Agreed | Implemented |
| REQ-OPEN-001 | Opening a project, view or file shall not start readers, connect a tunnel or initiate probes. | Navigation reads state; explicit controls start work; [workspace fixture](../tests/desktop/workspace_smoke.py). | Agreed | Implemented |
| REQ-REC-001 | Restart recovery shall use trusted owned-process cleanup and offline result settlement without network replay. | Copied/reused/unverified process identity grants no signalling authority; interrupted imports remain retryable; [recovery checks](../tests/app/test_ExecutionRecovery.py). | Existing | Implemented |
| REQ-HTTP-001 | One FastAPI application shall serve retained HTTP, file-transfer and WebSocket interfaces. | Existing routes boot without the removed transport stack; [transport checks](../tests/app/test_FastApiOnly.py). Generated OpenAPI is the HTTP contract reference. | Existing | Implemented |
| REQ-STO-001 | Dedicated project resources shall remain within the mounted 2,000,000,000-byte cap. | Source, environments, caches and outputs count; the [storage guard](../skills/project-storage-cap/SKILL.md) checks mount/usage. Protected evidence is not deleted to make space. | Agreed | Implemented |

## Pending specification

These are outstanding directions or questions, not approved new action definitions:

- Initial taxonomy and precise action definitions; remaining module integration.
- First map layer and whether layers are curated category combinations; network
  rectangles, overlapping/multi-interface membership, identity pictures, OS
  badges, application/service satellites, grey-line meanings and missing hops.
- Full action cards, bulk actions, terminal/remote-session docking, stage filters,
  running/result placement and keyboard overflow beyond available keys.
- Reconnaissance depth, time/traffic/compute limits and automatic follow-ups;
  brief versus deeper recovery, recovered-secret handling and retention.
- First integrated Metasploit jobs/sessions, remote SSH/SFTP Files, source/version
  navigation, reader packaging and fresh-install experience.
- Profile discovery/import/connect/disconnect, privileged/DCO and remote runners,
  callback checks, traceroute, and detailed pivot/privilege interpretation.

Authenticated web investigation and unified website targets follow the basic
integrated workflow. Removed AI planners/providers, relay/capture and external
enrichment remain outside current scope. Unauthenticated web checks already
exist in the bundled scanner. Artwork concepts do not implement map behaviour.
