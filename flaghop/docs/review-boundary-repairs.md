# Independent review repairs

Review repairs developed on `codex/review-boundaries` from `e23c5ce`,
verified 1 November 2026. Builder independently signed off on all eight repairs
after 95 focused tests and an unchanged source-identity check. The earlier eight
architecture improvements and their live acceptance
are historical evidence, not certification of this changed candidate.

| Finding | Repair and acceptance | Current evidence |
| --- | --- | --- |
| 1. Invalid profile facts could reach inventory before an API failure. | Validate typed incoming facts and the full summary before writes; cross-check supplied discovery facts against checksummed XML. Preserve supported extensions. | ScannerContracts and DeepScans reject invalid ports, invented fingerprints and out-of-range classifications without inventory/summary changes; valid extended evidence still imports. |
| 2. Named HTTP records did not enforce the real input/output contract. | Canonical strict requests/results across mutations, mandatory fields, bounds/enums, explicit legacy conversions and generated OpenAPI/TypeScript. | ActionBoundaries rejects wrong roots/unknown fields before runtime work, validates actual shipped JavaScript forms including all four scan modes, and rejects malformed service results. Unsupported command overrides remain rejected. |
| 3. Aliases and import forms bypassed the authoring gate. | Resolve ordinary/qualified aliases for bases/decorators/references and both import forms in cycle detection. No added exemptions. | ContractQuality has rejection fixtures and valid canonical examples; ScannerBundle checks byte-verified inputs. |
| 4. Shutdown and restart left work or persistence unfinished. | Stop admission and cancel owned work on one bounded deadline. Publish protected process identity before releasing the child gate; link Waiting rows atomically. Recover verified owned cleanup and offline inventory/marker/file settlement, preserving the selected project. | ExecutionRecovery uses real non-network processes, detached children through the sanitized scanner Runner, zombie/reused-PID controls, blocked settlement, prepare/publication failures, real SQLite rollback and SIGKILL at four import boundaries. No-profile and generic command recovery settle their real DB rows. Recovery controls show holds and retry without network replay. |
| 5. ZIP transfer lacked shared admission and atomic adoption. | Stream raw/multipart data into owned staging with configurable byte/member/expansion/ratio limits. Reserve actual destination filesystem headroom; adopt only after complete validation, with rollback. | TransferStorage and ProjectHub exercise size/space limits, disconnects, failed close/fsync/ledger writes, cross-device reservation, collision, copy and catalog-publication failure. Caller-owned originals remain intact. |
| 6. Queued source was not pinned before tools ran. | Persist the full 21-file source identity, verify it before tool setup, and execute from an owned immutable copy. | ScannerBundle and DeepScans hold changed queued sources before probes/launch and preserve the selected bytes across installation updates. The protected journal uses that same typed manifest. |
| 7. Copies lost or truncated History and inherited control identity. | Rebind derived owner/path fields separately from full results, preserve full-result extensions/provenance and original evidence, reset copied PID/execution controls and stop copied readers. Unowned legacy active rows become Interrupted history; protected originals stay held. | Actual restore→SaveAs and legacy-reopen tests preserve original controls/proof and avoid signals/launch. Full DB/summary-file comparisons cover extensions and lineage. Bounded reconciliation uses 32-row batches, early admission and one transaction; a 5,000-row fixture stays below 4 MiB traced Python memory. Oversized controls, malformed provenance and later-batch failure preserve originals. |
| 8. Falsey or negative results became successful empty records. | Validate raw outcomes through both outer runtime and queue; preserve explicit void-callback compatibility only. A cleanup hold must also make execution unsuccessful. | WebJobs, DeepScans and ActionBoundaries test `False`, `0`, empty sequences/text, explicit `executed=False`, malformed service responses and the actual jobs API. |

## Release checks

The frozen candidate passes 652 Python tests, Black/flake8 and the contract
checker; 62 frontend tests, generated OpenAPI/TypeScript checks and a reproducible
production build; and 128 native desktop checks (66 workspace, 16 hardware,
15 documents, 13 scanner, 18 window controls), with no JavaScript errors.
Dependency consistency and the mounted 2 GB storage check pass. All 21 bundled
scanner files and all 13 protected external evaluator files remain unchanged.

The checked production/test identity is
`502702a4bb8e609742e48a9e7d90e1785427b52878677ce7e87a21884a62ad74`
across 740 file entries. Local receipts are preserved under the ignored
`.state/research/review-boundaries/candidate-007/` directory. Independent final
review passed another 95 focused tests against that exact identity, covering all
eight findings. No actionable finding among those eight remains open.

The current work uses no new live scan, capture, installer, browser/VPN acceptance
or administrator authentication. Kernel helper permission failures and
unverifiable ownership remain held. Historical browser/network/storage figures
must not be relabelled as current measurements. The standalone scanner and the
three protected external evaluators must remain byte-identical.

## Scope and operating limits

- Recovery never replays a saved network command. A missing result remains
  interrupted; a recovered result with an unmeasured original process exit stays
  partial. Cleanup and DB settlement must finish before authority is removed.
- The journal is private application state outside copied/exported workspaces.
  A project-local PID, GID or old job ID is never signalling authority. Fixture
  runtimes explicitly inject separate private journals under their own temp tree.
- Inventory and its marker are one transaction. Files and final run metadata are
  separately durable, idempotent steps; this is not cross-store atomicity.
- Missing privilege or uncertain child/table ownership retains the restriction
  and the held reason. Unresolved authority blocks original-workspace save/copy/
  move and another network run while cleanup is unresolved. Other selected
  workspaces are preserved during offline recovery.
- Imported or unowned legacy process controls are historical facts, not live
  ownership. Original control values remain in database provenance; unchanged
  commands/output stay in their existing rows. Detail views explain the
  interruption. Control fields and stored provenance have explicit bounds;
  oversized/invalid inputs are rejected without truncation or partial adoption.
- Transfers default to 64 MiB uploaded, 256 MiB expanded, 128 MiB per member and
  10,000 members, plus free-space reservations. Configure `transfer_limits` in
  `.project-storage.json` or `LEGION_TRANSFER_LIMITS` in app configuration.
  These admission limits are separate from the scanner's 16 MiB/250-file retained
  result budget and the mounted 2,000,000,000-byte project cap.
- ASGI shutdown reports jobs still settling when its deadline expires. It does
  not claim that a blocked callback finished or terminate arbitrary Python code.
  Safe cleanup/reconciliation remains pending where needed.
