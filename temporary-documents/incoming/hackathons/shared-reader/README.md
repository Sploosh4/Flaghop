# Shared project readers

## FlagMap workspace enrollment

The same reader owner can now enroll managed workspaces from one or more Hub
catalogs, including projects in custom save folders outside the legacy root:

```bash
./run.sh watch --root /path/to/legacy-projects \
  --projects-catalog /path/to/main-config/project-hub.json \
  --projects-catalog /path/to/another-config/project-hub.json
```

Catalogs are read-only. Managed records use their stable `id` and existing real
`folder`; unmanaged, missing, symlinked or conflicting records are not enrolled.
Catalog additions/removals are reconciled while the watcher runs. There is still
one global compute-lock owner, not a new reader process for each workspace.
Do not combine catalog enrollment with the single-project `--project` option.

Each initialized workspace gets `.reader-state/worker-status.json`, refreshed on
an independent heartbeat thread. It contains `heartbeat_at` Unix seconds,
`worker_id`, matching Hub `project_id`, `engines: ["cipher", "password"]`, and
`available`. Clean retirement sets `available:false` and `heartbeat_at:0`.
The main app checks identity and freshness before enabling Start. This proves
worker availability, not that its current work step has already stopped.
Activity/pause-boundary observations remain separate in `activity-status.json`.

The reader never initializes or resets `reader-control.json` during enrollment.
New Hub projects write their initial paused state before publishing the catalog;
existing explicit states and legacy absence semantics are preserved. Pausing a
workspace retains its queue/results and does not stop another workspace or the
whole service.

The source service now uses the real current `Documents/FlagHop` legacy root and
the main application's `.state/config/project-hub.json` catalog. Output still
follows each configured project directory; this does not migrate or rename files.

Continuously watches `~/Documents/Hackathon`, discovers project/tool folders,
and routes original files, decoded content, extracted binary artifacts and
recovered password candidates through Cipher Watch and John/Hashcat. Queues and
source-to-result relationships survive restarts. Original files are read-only. Put files in a tool/input subfolder: project-root
application workspace files and state are excluded from ongoing inventory.

## Folder layout

```text
Documents/Hackathon/
  Project name/
    nmap/                         # any tool's original output, watched
    workspace-tool-output/        # existing Legion output, watched
    another-tool/                 # new folders are discovered automatically
    ciphey/
      artifacts/<sha256>.bin      # shared derived content, watched/deduplicated
      versions/.../decoded/      # Ciphey accepted candidates, watched
      versions/.../extracted/    # binary extractions, watched
      index.html                 # native Cipher Watch review
    password-crackers/
      jobs/.../recovered.txt     # recovered bytes, watched/deduplicated
      index.html                 # native John/Hashcat queue review
    reader-report.html           # combined graph review, refresh for updates
    reader-report.json           # source versions, transformations, queue states
    .reader-state/               # private immutable objects and SQLite graph
```

Yes, both readers' output locations are included. The coordinator scans their
**content artifacts**, not their own HTML/JSON reports, logs, pot files, candidate
plans, databases or temporary files. Those exclusions apply specifically to the
managed reader folders; ordinary JSON/text files emitted by other tools remain
inputs. Known generated content is an alias of its existing graph node, not a
fresh original. This prevents report regeneration from creating a feedback loop.

## Run

The launcher reuses the installed Hash Watch Python environment and native tools.
No additional download or system package is needed.

```bash
/home/joshua/Documents/ChatGPT/Hackathons/shared-reader/run.sh watch

# Point at a different environment, or select one project.
/home/joshua/Documents/ChatGPT/Hackathons/shared-reader/run.sh watch \
  --root /path/to/environment --project 'Project name'

# Inventory and drain bounded work, without leaving a watcher running.
/home/joshua/Documents/ChatGPT/Hackathons/shared-reader/run.sh once \
  --root /path/to/environment --project 'Project name' --max-steps 1000
```

`--wordlist` selects deeper seeds. Without it, the first 50,000 accepted seeds from the John bundled list are
used; that finite subset is recorded in the plan manifest and combined notices. `--benchmark-profile` enables the previously measured engine choices;
otherwise the native pipeline's default is John, with existing length fallbacks.
`--polling` supports filesystems with unreliable native notifications. A single
observer handles file creation/edit, atomic-save replacements and moved-in input
directories; periodic reconciliation defaults to 30 seconds. Projects stay
separate and receive round-robin work, one artifact and one bounded cracking
batch per project per turn. File events wait for the current bounded work unit.

The user service installed for this environment is `hackathon-readers.service`:

```bash
systemctl --user status hackathon-readers.service
systemctl --user stop hackathon-readers.service
systemctl --user start hackathon-readers.service
journalctl --user -u hackathon-readers.service -n 40 --no-pager
```

It uses the existing laptop benchmark profile. It is enabled for user-session
startup; it does not run while the laptop is suspended or powered off. Historical
results remain on disk. There is no automatic retention/deletion policy.

One project owner lock and the existing hash compute lock prevent competing
writers/workers. Stop the service before running a separate hash benchmark,
standalone hash worker, or an offline `once`/`resolve` command. Ambiguous raw hashes
retain `needs_format` instead of assuming an algorithm:

```bash
systemctl --user stop hackathon-readers.service
/home/joshua/Documents/ChatGPT/Hackathons/shared-reader/run.sh resolve \
  --project 'Project name' --target TARGET_ID --format ntlm
systemctl --user start hackathon-readers.service
```

The coordinator links the resolved target back to the original artifact and
continues processing its recovery. It never uses recovered credentials to log
into another service.

## Processing and evidence

Every unique byte sequence becomes one content-addressed node per project.
Each node is checked for hashes/protected formats and encoded content; first-layer
bytes do not need a successful Ciphey language check to proceed. Accepted Ciphey
text is explicitly an unverified candidate. Each edge records its transform and
location in its parent artifact. Decoded offsets are never presented as offsets
in the original file. Duplicate sources inherit the existing transformation graph.

Deterministic layers handle canonical Base64/Base32/Base85/Ascii85, wrapped or
unpadded Base64, UTF-16 with BOM, percent bytes, Unicode text escapes, and
concatenated literal encoded strings. Source expressions are never executed.
Bounded container readers handle ZIP, gzip, bzip2, XZ, PNG text chunks and
unencrypted PDF streams with direct lengths and a single FlateDecode filter. Recovered ZIP passwords
are used offline to read supported encrypted ZIP members, which return to the
same queue. ZIP members are read into bounded buffers and saved by content hash;
member filenames are metadata and are never used as extraction paths.

Default bounds per original source version: depth 8, 128 unique artifacts,
16 MB aggregate content; each artifact/file is limited to 2 MB, each archive to
32 visited members. Ciphey gets a one-second attempt/four-second file budget;
deep hash batches get five seconds and retain native batch-resume semantics.
Candidate budgets count distinct decoded byte values, not repeated locations.
Up to eight source locations per value are retained, with total occurrence counts;
location-evidence truncation does not mean content coverage was cut off. Both
readers' failures and transform limits contribute to a parent's partial status.
Limits, missing adapters, upstream worker failures and unresolved hashes remain
visible in the combined and native reports. A processed node is not a clean-file
verdict, and an exhausted finite wordlist is not proof of uncrackability.

Identity/cyclic outputs are deduplicated. At a limit, expansion stops with an
explicit notice. An artifact arriving later as a shallower original can revisit
previously limited expansion while reusing native evidence. Changed source bytes
create historical versions; unchanged content/settings do not restart searches.
Code, tool, wordlist-plan or configuration changes requeue artifacts under the
new configuration. In-flight work is replayed after interruption.

Symlink input components and special files are not followed. Reader-managed
artifact tampering becomes an error, rather than silently substituting evidence.
Project directories containing protected-file verifier jobs should keep stable
absolute paths: native helper records can embed those paths. Renaming a project
retains graph history, but relocating protected-file jobs is not a validated
migration workflow.

ROT13 and reversal of small passage-like text are emitted as explicit unverified
hypotheses. Their bytes are candidates, not proof of the historical plaintext.
Typed hash records and opaque identifiers bypass the pinned Ciphey heuristic
search; canonical Base64 layers are peeled first, and control-byte checker output
is rejected. This avoids measured bad paths; it does not repair every upstream
Ciphey decoder or establish language correctness.

Still outside scope: OCR, general PDF extraction (indirect stream lengths, filter
chains and arbitrary encryption), arbitrary archive/encryption variants, dynamic
source-code expressions, universal hash identification,
network authentication, Legion source integration and guaranteed plaintext
recognition. The pinned Ciphey binary can still panic on some inputs; that error
is retained and other queued artifacts continue.

## Validation

From this directory:

```bash
../hash-watch/.venv/bin/python -m unittest discover -s tests -v
```

Tests exercise the real native tools and Watchdog. They cover all seven earlier
handoff gaps, encrypted ZIP member reading, unchanged originals, generated-output
watching without feedback, cross-source provenance, restart/deduplication,
project separation, resource limits, symlinks/FIFOs, tamper detection, empty
passwords, regex rejection, malformed hash/checksum guards and new shallower
sources. The existing standalone component suites remain part of validation.
Recorded results are under `validation/`.

## Collection fixes and retesting

The frozen 255-file offline collection is rerun after the distinct-candidate,
format, context, output-validation and status-propagation fixes. See
[fix evidence](../../../../hackathons/shared-reader/validation/fixes-2026-10-31) and the evaluation reports. Input
bytes, test goals, seed lists and evaluation budgets are preserved. Real distinct
candidate, artifact, size and time limits still apply and produce explicit
partial/limit evidence; they are not an exhaustive-search guarantee.
