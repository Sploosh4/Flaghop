# Architecture follow-up work

Owner: the coding agent working with Josh. Reviewed 31 October 2026.

The FastAPI-only migration and the eight material improvements below are
included in this revision and verified locally. Each has a baseline, a concrete
code change and regression evidence. The earlier scanner checkpoint remains
separate. Original local test and live-run reports are preserved. The ten-minute DeepSeek monitor remains paused.

## Transport prerequisite

Native FastAPI routers now serve the retained HTTP routes, Jinja pages, uploads,
downloads, static assets and WebSockets. Flask, Flask-Sock, Werkzeug and the WSGI
adapter are absent from application imports, requirements and the dedicated
runtime. The transport selector and fallback are removed. Existing project and
reader formats are preserved.

The original explicit inventory covered 97 method/path combinations but omitted
Flask's automatic HEAD/OPTIONS methods. Native routers now provide both, with
cross-router Allow headers and no mutation from OPTIONS. Tests cover the original
URLs, static assets, unknown paths and HEAD export cleanup. Both ZIP export paths
remove temporary files even after a send error or cancellation. Ordinary evidence
files are retained. The idle running backend was restarted; actual health, page,
asset, HEAD and OPTIONS requests passed.

## Eight measured improvements

| Issue and baseline | Implemented improvement | Evidence and remaining limit |
| --- | --- | --- |
| Shared runtime/locking: scanner operations used the broad facade and separate hub/runtime locks. | One reentrant lock owns the runtime/project catalog across hub instances; scanner transactions bind project identity. DNS runs outside the lock, followed by a pinned project/revision check before queueing. | Concurrency tests exercise two hubs, network capture, project switching, duplicate scans and paused scope resolution. The broad runtime facade remains. |
| Implementation identity: wrappers/source were fingerprinted without actual Chrome/WPScan code coverage. | App worker audits the Chrome ELF and selected WPScan application's installed versions, assets and gemspecs before/after; missing, changed and unmeasured states remain explicit. Parent recomputes the comparison. | Mutation tests change the ELF and WPScan entry/library behind unchanged wrappers. Live run identified a 300,920,136-byte Chrome ELF and 315 WPScan files (445,362 bytes), unchanged across execution. Shared OS/browser libraries and arbitrary Ruby dependencies/plugins remain outside this scope. The standalone audit remains narrower. |
| Implicit contracts: task/profile/summary dictionaries permitted ambiguous state and finding fields. | Typed task, problem, service, import-progress and finding contracts validate boundary data while retaining supported extension fields. Candidates and reproduced findings are distinct; reproduced findings require nonempty, retained, checksummed proof references. | Malformed state/type/path cases, valid partial/skipped outcomes and missing/escaping proof controls pass. Generated frontend contracts pass. This does not make every inherited runtime dictionary typed. |
| Settlement: terminal publication and exclusive-slot release preceded persistence; callback errors could look successful. | Jobs stay active through settlement. Persistence failure becomes visible, preserves execution facts and blocks clean completion. Import progress records inventory, DB-summary and summary-file stages. Duplicate lookup uses one primary-key query. | Callback ordering/reentrancy, cancelled queue, write-fault and restart tests pass. Original profiles remain openable. Live import/settlement/reopening passed. Inventory keeps existing DB transactions; there is no cross-store atomicity claim. |
| Recovery: orphan interruption was response-only; numeric queue IDs could be reused after restart. | Persist interruption once; match job type/project/scan identity; never replay network work automatically. Active queue saturation rejects new work rather than silently dropping pending jobs. | Reused-ID, repeat-read, queue saturation and invalid runner-result tests pass. Recovery intentionally reports interrupted work rather than resuming processes. |
| Vendoring: a hand-maintained manifest had no checked updater. | Explicit bounded 21-file inventory and staged updater, with reviewed candidate digest and manifest published last. Tools/evaluators are excluded. | Four layout/digest/update tests pass; all 21 current bundled inputs match standalone source. Interrupted mixed updates fail verification until repaired. Historical proof is not relabelled. |
| History/resources: polling opened every full run record before keeping only 200. | Stream directories, retain the best 200 rows, cache compact metadata under a 4 MiB serialized-entry budget and fetch details only when expanded; closing cards releases details. | At 1,000 runs, old polling read 74,092,000 bytes; warm new polling reads zero JSON records. Encoded responses fall from 14,818,810 to 107,210 bytes (99.28% smaller). Directory/stat work remains proportional to history. Cache bytes are not a process-RSS quota. |
| Privileged helpers: proxy registration separated link/stat/read operations. | Typed, bounded, nonblocking descriptor reads reject symlinks, hard links, FIFOs, invalid ports/tokens and malformed messages before privileged operations. The isolated 36-line listener verifier stays small. | Eight guard tests cover listener identity, proxy ownership, bounded child output and timeout cleanup. Fresh real app allowed/denied traffic and isolated WireGuard/OpenVPN common-runner tests pass. This is not a full scanner-over-every-VPN certification. |

History allocation measurements compare the actual previous implementation at
`ca4caea`: traced Python peak falls from 76,216,073 to 5,835,594 bytes cold
(92.34% lower), and 144,454 bytes warm. These are listing allocations, not RSS.
Synthetic desktop checks at zero and 1,000 saved runs render at most 200 cards;
sampled process-tree PSS was 414.43 MiB and 443.60 MiB respectively. The scale
run's 1,014 assertions include repeated retention checks, not 1,014 distinct UI
behaviours. Qt/WebEngine and SQLite remain justified choices for this application;
no extra deployment services or unrelated framework rewrite were introduced.

## Final verification

Verification `008` passes with unchanged production/test hashes:

- 564 Python tests, with Black and flake8.
- 58 frontend tests, schema/type checks and reproducible production assets.
- 51 standalone scanner regressions and 13 protected supplemental behaviour checks.
- 128 native desktop checks across workspace, hardware, documents, scanner and window controls.

The dedicated environment passes `pip check` without the removed Flask stack.
All three external protected evaluator manifests verify unchanged.

Fresh live attempt `009` completed with real child exit zero, matching the frozen
candidate. The four-case Chrome HTTP/HTTPS positive/negative gate ran before the
app workflow and authorised its actual command. All four cases observed fresh
requests, correct DOM proof/negative results and clean owned browser state.

The normal-user app worker reached the allowed loopback service; a directly
reachable excluded port timed out under its actual private guard group. The
scanner completed, committed its inventory/summary, settled, reproduced a
controlled browser finding and reopened the retained evidence. All 36 profile
artifact checksums and profile identity were revalidated afterward. Dalfox's
recorded exit 1 is an explicitly accepted result code with a parsed result
artifact, not a hidden shell failure. Skipped inapplicable tools remain skipped;
WPScan application fingerprints were measured, but this non-WordPress fixture
does not prove a live WordPress scan.

Separate fresh network/mount namespaces exercised real WireGuard and OpenVPN:
allowed service and common-runner Nmap passed; extra destination/port and kernel
fallback traffic were blocked; route changes and exclusions held execution.
Fixture processes, temporary keys and owned state were cleaned. This validates
the common guard/runner over those VPN fixtures, not every scanner tool over VPN.

Final retained scan evidence is **493,081 bytes across 44 files**, below the
16 MiB/250-file post-cleanup limit. Sampled project temporary growth peaked at
**186,010,745 bytes**; capped-filesystem allocation growth peaked at
**187,813,888 bytes**. More than 16 MiB during execution is allowed. No temporary
growth leftovers remained. One-second samples can miss short-lived peaks and
cannot attribute concurrent writes; shared installed tools were not copied.
The mounted 2,000,000,000-byte project cap remained healthy.

## Residual architectural limits

The material-improvement goal is verified locally, not a claim that all inherited
debt has disappeared. Remaining limits are the broad runtime facade, existing
inventory transactions without cross-store atomicity, non-exhaustive dependency
fingerprints, linear directory/stat work and separate reader/setup packaging.
Broader action/session wiring and remote Files remain separate roadmap work.
GitHub CI is separate from the recorded local validation.
