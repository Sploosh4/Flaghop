# Capability metadata and authoring

This experimental, read-only foundation separates target category, capability
module, shared tool integration and investigator action. It does not define an
approved taxonomy or change scheduler policy or execution. Existing `ActionSpec`
and `ActionRegistry` remain the action authority. The legacy Settings and pipette
sources retain their distinct catalogue behaviours and profiles.

## Declarative folder

A module package directory contains `manifest.json` (version 1). The working
synthetic example in `tests/fixtures/capability/example/manifest.json` references
one integration from two modules and two existing action IDs. Integrations are
identified by the existing action's `tool_id`. Modules declare action IDs,
integration IDs and optional module dependencies. Categories contain an explicit
positive definition and references to actions/modules; these are proposals.
The loader validates the entire set before returning it, including unique IDs,
known references, integration-to-action consistency and acyclic dependencies.
Invalid JSON, unknown fields, version mismatch, symlinks and missing manifests
fail with an error; nothing is registered or imported. Manifest discovery never
executes code. The contract classes live in `app/contracts/actions/capabilities.py`;
filesystem and dependency validation is in `app/capabilities/manifests.py`.

Adapters, parsers, documentation and tests belong outside contract directories.
Third-party installations, binaries, project results and secrets are not module
assets. Reuse a canonical integration rather than copying an installation.
Action identifiers remain independent even when a tool is shared. Runtime
execution and project network policy remain in their existing owners. The example
is a test fixture, not a new installed investigative action.

## Approval boundary

The source-controlled baseline in `app/capabilities/manifests.py` is empty:
no production subcategory definition has been approved. A manifest cannot supply
an approval flag or its own baseline. A candidate's definition, membership and
resolved canonical action contents are compared with the separately controlled
baseline, including actions inherited via module dependencies. Changes stay draft
and produce a change report. Future baseline changes require Joshua's explicit
recorded decision, reviewed as a separate source change; the data itself is not
cryptographic proof of that decision. Nothing here offers an approval operation.
The current application remains unclassified and existing functionality remains
available. The loader is not yet integrated into an installation workflow.

`GET /api/workspace/capabilities` is a read-only snapshot for the active project.
It relates existing settings actions and pipettes to their integration IDs and
identifies unclassified taxonomy. It reports declared tool prerequisites without
probing installation; unverified availability is unknown. Existing artifact types
are legacy inferred hints, not guarantees of output. The endpoint does not run a
command, connect, install, or accept a project identifier. The catalogue's
existing ordering, duplicate behavior and policy decisions remain authoritative.
See [action inventory](capability-action-inventory.md) for source and uncertainty.
