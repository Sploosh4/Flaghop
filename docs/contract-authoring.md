# Domain contract authoring

The application owns one definition of each action, result, observation and
artifact reference. All application consumers and tests import its canonical
module directly. HTTP routes and tool adapters translate these values; they do
not define copies. Database entities and page/snapshot compositions remain in
their existing layers. This change does not implement persistent run recovery.

| Folder | Contents | Approved roots |
| --- | --- | --- |
| `app/contracts/actions` | Action catalogue, planning records, tool/scan requests, process/job/reader outcomes and action policy records | `ActionModel`; internal `@dataclass` with `ActionData`; literal catalogues with `ActionConstants` |
| `app/contracts/observations` | Observed facts, historical target-state rows, scanner profiles, candidate/reproduced findings and rationale | `ObservationModel`, `ObservationRow`, or an existing observation subclass |
| `app/contracts/artifacts` | Evidence manifest entries, artifact references and reader result provenance | `ArtifactModel` or an existing artifact subclass |

`app/contracts/base.py` contains shared roots only. The three folders contain
Python definitions and their package initializers only. Put examples in tests,
instructions in docs, checks in `app/validation`/`scripts`, parsers in the parser
layer, and executable adapters in services/processes/scanning. Do not put a tool
implementation or an empty placeholder integration in the contract folders.

## Adding an action or result

1. Find the nearest existing action/request/result and reuse it where its meaning
   matches. Scheduler actions use `ActionSpec`, `PlanStep`, `ExecutionRecord`;
   local execution uses `CommandRequest`, `ExecutionResult`, and the runner
   contracts. Those layers have different responsibilities, not interchangeable
   definitions of success.
   Scheduler target/task/options records, engagement-policy values, pipette specs
   and tool-audit/install records are canonical action data too. Settings services
   perform OS/platform discovery; input contracts only normalize supplied values.
   Pipette formatting may use `shlex.quote` as a pure text conversion; launching
   that command remains the runner's responsibility.
2. Define new validated data with `ActionModel`. Use annotated fields, bounded
   inputs and explicit outcome choices. Internal records may use an `ActionData`
   dataclass, with `field(default_factory=...)` for mutable defaults. Catalogue
   namespaces may use `ActionConstants` and contain values only.
3. Put pure validation and serialization beside the fields. A definition may
   depend on other contracts and the approved pure core helpers. It must not
   import HTTP, Qt, database, scheduling or process services. Execution and
   application policy evaluation belong to the adapter/service.
4. Update every consumer. Keep stable identities, existing project/network
   validation, cancellation and approvals. An execution finishing does not prove
   a finding, credential validation, session or privilege change.
5. Test actual accepted/rejected payloads and the adapter boundary. Run the
   checker and relevant existing regressions. An unused class is not an
   integration.

Example of a new request (illustrative, not a registered action):

```python
from pydantic import Field
from app.contracts.base import ActionModel

class ExampleRequest(ActionModel):
    project_id: str = Field(min_length=1)
    target_id: int = Field(ge=1, strict=True)
    timeout: int = Field(default=60, ge=1, le=300, strict=True)
```

Requests reject unknown fields by default. Existing output readers that retain
historical tool extensions declare `ConfigDict(extra="allow")` explicitly.
Do not turn open historical metadata into a claim of validation: typed required
fields carry guarantees, while extension fields preserve original context.

## Observations and artifacts

Observations describe evidence, not UI state. Retain provenance, unknowns and
the distinction between hypotheses, candidates and reproduced findings. Legacy
confidence values remain scores, not calibrated probabilities. Keep normalization
and tool-specific parsing outside these folders and validate their final rows
against the shared definitions.

`ParsedObservations` validates the output of the retained protocol parser entry
point. Target-state normalizers validate technology, device category, finding,
quality, service, URL, coverage, credential and session rows before storage.
Missing historical optional fields stay missing. Reported credential/session
rows do not claim successful authentication or a live connection. `NetworkReport`
uses typed route and service-probe observations; configuration and check requests
live in the action network contracts, separate from observed responses.
Saved route source/gateway fields may be unknown and remain absent when missing;
route extensions are retained. The live runner independently requires and checks
the actual selected route before execution.

Scanner profile observations validate their stable tool/source fields and retain
tool-specific extensions. Incoming reproduced findings require explicit status
and bounded retained proof references; historical summaries may retain missing
proof as unknown. Do not apply the permissive historical summary class at an
incoming scanner validation boundary.

Artifact definitions describe references and manifests. They do not open paths,
check the filesystem or claim that a checksum establishes authenticity. The
owning service still checks project ownership, links, byte limits and actual
checksums before reading/importing. Reader evidence retains original origins.

Use `ArtifactLocator` for structured `artifact_refs`/`linked_evidence_refs` lists.
It preserves the existing string representation, including legacy opaque output
identifiers. A locator alone does not establish ownership or authorize reading.
`ProjectRelativePath` is for project-owned output paths and rejects absolute,
traversing, Windows-drive and ambiguous noncanonical paths. Original remote
source paths remain provenance strings, not local paths to open automatically.

Scanner `Artifact` entries require a nonnegative integer byte count and a SHA-256
digest; the importer checks actual files, checksums and reference membership.
`ArtifactReference` and `ScreenshotReference` cover historical target rows.
`ReaderOrigin` retains source extensions and missing fields, including through
HTTP serialization. Historical hash labels are preserved without asserting their
authenticity. Reader result paths and sizes are validated before presentation.

Internal dataclasses keep their existing constructor semantics; annotations do
not perform runtime validation by themselves. Untrusted payloads must pass the
Pydantic/API or owning service boundary. Raw legacy SQLite JSON/text fields stay
encoded at their transport boundary; do not treat them as structured locators
until decoded and validated.

## Feedback and verification

| Area | Behavioural acceptance | Regression coverage |
| --- | --- | --- |
| Actions/results | Valid declarations register once; malformed specs/requests are rejected; scheduler, pipette and tool-audit consumers use canonical classes | `test_ContractQuality`, existing scheduler/pipette/tooling/API suites |
| Observations | Parser output is checked, historical optional fields stay unknown, and candidates/reproduction remain distinct | `test_ObservationContracts`, target-state/network/scanner suites, hardware fixture |
| Artifacts | References cannot escape the project; actual manifests/bytes still agree; reader origins retain provenance without inventing identity | `test_ArtifactContracts`, reader/scanner suites, document and scanner desktop fixtures |

```sh
.venv/bin/python -B scripts/check-contracts.py
scripts/check-maintainability.sh
scripts/frontend.sh check
```

The first command checks definition-folder contents, dependencies, duplicate or
misplaced contract classes, approved bases and resolvable types/Pydantic schemas.
It also rejects import cycles, runtime methods in data classes and untyped
structured evidence-reference lists. Retired definition modules and imports cannot
be restored as compatibility copies; consumers must use the canonical owner.
Generic-named data classes in tool/scheduler/scanner modules are checked too.
Only the enumerated execution handles, callback bundles and mutable loop state
remain there; those are runtime implementation objects, not shared contracts.
It reports `path:line: rule repair-hint` and returns nonzero on violations. The
maintainability gate runs it in CI as well as locally. Boundary tests deliberately
introduce invalid examples so the checker itself cannot silently stop rejecting
them. Functional tests and fixtures establish behaviour; static checks alone
cannot prove network enforcement, remote session ownership or finding validity.

When a check fails, fix the definition or move the runtime work to its owner.
Do not disable a rule to make an integration pass. Record any genuinely new
contract category or allowed dependency here, with rejection coverage, before
changing the checker policy.
