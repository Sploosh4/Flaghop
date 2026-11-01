# Hash Watch prototype

A local folder watcher that discovers supported password hashes and protected
files, runs a short first recovery pass, and keeps unresolved work in a durable,
resumable deeper queue. Originals are opened read-only. Findings, passwords,
source evidence and process diagnostics go into a separate output folder.

This component is separate from Legion and the existing `cipher-watch` prototype.
No Legion project, system credential store or external target is scanned or
modified by setup, the demo or validation. Host attribution remains unset.

## What is ready

- Watchdog events for created/modified files, atomic replacements and moved-in
  directories; startup inventory and 30-second reconciliation.
- Hash extraction with byte offsets, line numbers, source SHA-256 and NTH format
  alternatives. Ambiguous bare hashes require explicit format selection.
- John Jumbo and Hashcat workers, using a measured engine profile per format.
- Three-second quick pass over an empty password plus 16 common candidates, followed by a deeper
  dictionary/variation plan processed in bounded 15-second batches.
- SQLite progress checkpoints, content/plan deduplication, immutable candidate
  plans, recovery evidence and an escaped searchable HTML review page.
- Separate `recovered.txt` and `recovered.json` outputs; source files never change.

## Laptop measurements

Measured on this laptop's AMD Ryzen AI 7 445 / Radeon 840M, with **four CPU worker
threads/processes** and normal desktop activity. These are matched synthetic
wordlist workloads, not peak built-in hash-rate benchmarks. Native John uses
AVX-512; Hashcat uses private PoCL CPU or Mesa Rusticl GPU runtimes. No `--force`,
self-test bypass or optimized-length Hashcat kernel was used.

The following are median seconds across **three warmed runs**, including process
startup. Initial timings and raw output are preserved separately.

| Format | Candidates per run | John CPU | Hashcat CPU | Hashcat Radeon | Selected |
|---|---:|---:|---:|---:|---|
| MD5 | 200,000 | 0.212 | 0.181 | 0.272 | Hashcat CPU |
| NTLM | 200,000 | 0.211 | 0.181 | 0.272 | Hashcat CPU |
| bcrypt, cost 5 | 32 | 0.242 | 0.603 | 2.110 | John CPU |
| SHA-512-crypt, 5,000 rounds | 32 | 0.663 | 1.205 | 45-second timeout | John CPU |

Every eligible engine/format pair also recovered a known synthetic password,
which was independently checked against the target hash. The GPU SHA-512-crypt
route did not complete within the deadline and is **not eligible for routing**.
Other workloads, costs, batch sizes, thread counts and system load can change the
ranking. A 0.03-second difference is a small local observation, not a universal
performance claim. SHA-1/SHA-256/SHA-512 and protected-file routes use John as the
unbenchmarked default; no speed comparison is claimed for them.

Full results: `validation/laptop/benchmark.json`; initial observations:
`validation/laptop/benchmark-initial.json`; hardware/device details and native
stdout/stderr are retained in that directory. `validation/refine_benchmark.py`
records the extra warmed measurements used for this delivered profile.

The benchmark profile checks hashes of John, the Hashcat launcher, shared core,
all modules and the private OpenCL runtimes, plus the configured thread count.
Changed builds require a fresh benchmark profile. Protected files without a
validated Hashcat adapter route to John.

## Setup

Tested on **Ubuntu 26.04 x86_64 with Python 3.12**, `uv`, GCC, make, apt package
metadata and `dpkg-deb` available:

```bash
cd /home/joshua/Documents/ChatGPT/Hackathons/hash-watch
./setup.sh
```

Setup downloads/extracts development and OpenCL packages into `.tools/sysroot`;
it does **not** install or upgrade system packages and needs no sudo. It builds:

- John Jumbo at commit `5184bc0b8c105f8c5978b112e723d65b2de3e63e` with native
  AVX-512, OpenMP, OpenCL, OpenSSL, GMP, zlib and bzip2 support.
- Hashcat **v8.0.0**, commit `6a7e3b5a96abcd6373c2e4112bc358abb24dc538`.
- Python dependencies including Watchdog 6.0.0 and Name-That-Hash 1.11.0.

The laptop initially had no registered OpenCL compute driver. Private PoCL and
Mesa runtimes now expose its CPU/GPU only to these tool processes. Two reviewable
relocation adaptations make this possible without touching `/usr` or `/etc`:

- `relocate_runtime.py` preserves the original Mesa library and creates a private
  copy with two libclc C-string paths redirected to a worker-local `.clc` link.
- `patch_hashcat.py` adds an opt-in GPU header include path. The variable is set
  only in the prototype's child environment.

Record of source versions, package hashes, tool hashes and omitted optional build
features: `validation/install.json`. Hashcat's optional generic Rust attack-mode 8
was not built because Cargo is absent; the implemented wordlist workflow does not
use that mode. Some optional John helpers still need additional dependencies.
Installed tools, private runtimes, build files, caches and validation evidence
currently occupy approximately **1.1 GB**, excluding user evidence/wordlists.
Setup is tailored to this Ubuntu environment, not a portable binary installer.

## Demo

The included files are synthetic: MD5 and NTLM examples, a bcrypt example, an
encrypted ZIP, an ambiguous digest and an unsupported-format example. The deeper
bcrypt example's password is `octopus!`; the ZIP password is `letmein`.

The already-generated report is `examples/results/index.html`. Start watching:

```bash
./watch-demo.sh
```

Add/edit files in `examples/inbox`, then refresh the report. Stop with **Ctrl+C**.
The watcher is not automatically started at login or boot. The demo uses its own
small seed list and the measured laptop profile; it is not a comprehensive
password-search demonstration.

## Your own folder

Input must exist; input/output folders must be separate and non-nested:

```bash
.venv/bin/python -m hash_watch watch \
  --watch /absolute/path/to/ctf-files \
  --out /absolute/path/to/hash-results \
  --benchmark-profile "$PWD/validation/laptop/benchmark.json"
```

Useful separate operations:

```bash
# Inventory and quick pass only. Deeper work remains queued.
.venv/bin/python -m hash_watch scan --watch /path/to/input --out /path/to/results

# Inventory without cracking.
.venv/bin/python -m hash_watch scan --watch /path/to/input --out /path/to/results --scan-only

# Continue the existing queue for ten batches, then checkpoint and exit.
.venv/bin/python -m hash_watch work --out /path/to/results --max-batches 10

# Show state counts without opening a worker or modifying the database.
.venv/bin/python -m hash_watch status --out /path/to/results

# Resolve one ambiguous raw digest; TARGET_ID appears in the report/queue.json.
.venv/bin/python -m hash_watch resolve --out /path/to/results --target TARGET_ID --format ntlm

# Retry errors or insufficient-budget pauses with a longer slice.
.venv/bin/python -m hash_watch work --out /path/to/results --slice-seconds 30 --retry-errors
```

A supplied `--wordlist /path/to/seeds.txt` configures deeper seeds. Without one,
the first 50,000 accepted seeds from John's bundled `password.lst` are used; the plan manifest records this bounded default. The plan tries each seed unchanged,
lowercase, capitalized, uppercase, and with suffixes `1`, `12`, `123`, `!`, `2025`
and `2026`. Quick seeds are included in the deep plan so a quick timeout cannot
leave a gap. This is a finite, inspectable search plan, **not an exhaustive search
of every password**. No external breach wordlist or account-specific data is
silently downloaded.

`--engine john` or `--engine hashcat --backend cpu|gpu` overrides routing.
`--raw-format md5|sha1|sha224|sha256|sha384|sha512|ntlm` explicitly chooses a raw format for
compatible digest lengths; checksum-like field contexts still require review.
Settings are saved in the output folder for subsequent `work`/`resolve` commands.
Use `--no-benchmark-profile` if deliberately changing thread counts before a new
benchmark. Use `--polling` for filesystems with unreliable native notifications.

## Resume semantics

The application owns the checkpoint. Each target/stage records a byte offset in
an immutable, hashed candidate plan. That offset advances **only when the native
engine confirms a batch was exhausted**. Completed batches are not replayed on
restart. An interrupted, crashed or timed-out batch is retried in full; a little
work may repeat, but candidate positions are not silently skipped.

This is **batch-level resumption**, not John `.rec` or Hashcat `.restore` session
resumption. Native recovery/pot files remain isolated per target. The supervisor
terminates the whole compute process group if its owning worker dies; this also
covers John's fork workers. Queue updates are committed to SQLite. A single
output owner and a project compute lock prevent competing workers/benchmarks.

Quick jobs take priority. Deep jobs rotate between targets after each batch.
Repeated deep timeouts shrink batches; a single-candidate timeout produces
`paused_budget` until explicitly retried with sufficient time. Expensive bcrypt
costs also reduce batch sizes. Engine errors never advance the offset or become
“no password found”. An automatic Hashcat failure falls back to John when that
fallback can preserve candidate-length coverage.

Conservative native John length limits are checked before each batch. Longer raw
candidates route to Hashcat's pure CPU kernels so a fast SIMD implementation does
not silently drop them. The configured plan still has its own explicit limits.

The proof in `validation/resume-proof.json` records a bcrypt checkpoint at byte
160, a fresh process continuing to a verified recovery, and unchanged hashes for
all five demo source files.

## Detection and extraction scope

Automatic raw recovery adapters: **MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, NTLM, bcrypt and
SHA-512-crypt**. Raw algorithms need an explicit setting or a matching field label
such as `md5 = "..."`; a bare 32-character hex string stays `needs_format` because
it can represent several algorithms or an ordinary checksum/identifier. NTH
alternatives are hypotheses, not calibrated confidence scores.

Recognised examples such as Argon2, yescrypt, SHA-256-crypt and phpass can be
retained as `needs_adapter` when no recovery adapter is implemented. NTH's full
database does not mean this prototype discovers or executes every supported mode.

File signatures route supported containers to bundled helpers: ZIP, RAR, 7z,
PDF, Office OLE, encrypted SSH keys and KeePass. **Encrypted ZIP extraction and
recovery were end-to-end tested.** Other routes are present but not end-to-end
validated here; unsupported variants, missing Perl/Python dependencies and helper
errors remain explicit in raw diagnostics and partial reports. Protected-file copies are retained read-only in each source audit, and their
hashes are checked before recovery work. Extractor filename/comment metadata is
kept separately from the cracking record, so temporary names do not defeat
deduplication. No encrypted file
is unpacked or overwritten after a password is recovered.

It does not scan system credential databases, collect network handshakes, log
into services, unpack arbitrary nested archives, parse SQL/SQLite application
schemas, OCR images, or understand every application-specific hash record.
Recovered candidates are verified offline; they are not automatically used to
access another system.

Protected-file snapshots are retained read-only and checked by SHA-256 before
recovery work. Filename/comment metadata remains in the evidence; it does not
create a new cracking target when an identical archive is scanned again.

## Evidence and states

```text
hash-results/
  index.html                     # search/filter; latest 500 targets; manual refresh
  queue.json                     # complete targets, attempts and source audit references
  config.json
  state.sqlite
  plans/<plan-id>/
    quick.txt
    deep.txt
    manifest.json                # input/plan hashes and finite recipe
  scans/<scan-id>/
    report.json                  # source hash, offsets, alternatives, queue target IDs
    source.bin                   # hashed, read-only copy for protected-file helpers
    raw/extractor.*              # protected-file helper diagnostics, when used
  jobs/<target-id>/
    target.hash
    recovered.txt                # only after recovery
    recovered.json               # password bytes in hex and verification result
    john.pot or hashcat.pot
    raw/attempt-*.json
    raw/attempt-*.stdout.txt
    raw/attempt-*.stderr.txt
```

Queue states include `needs_format`, `needs_adapter`, `queued_quick`,
`queued_deep`, `recovered`, `exhausted_plan`, `paused_budget`, `error` and resolved
links. `exhausted_plan` means only that the recorded finite plan was exhausted.
“Recovered” means a matching password candidate, not proof of the historical
original password. The report's completed-candidate count is the number of input
entries in fully completed batches, not a claim about exact native hash operations.

Raw hash recoveries receive an independent Python/hash-library check. Protected
file recoveries currently rely on John's format verification. No host identity,
privilege gain, authenticated session or vulnerability is inferred from recovery.

Source scans record skipped size limits and partial/error conditions separately
from recovery outcomes. New output folders are owner-only. Historical source
reports remain; only indexes and queue state update. Password evidence is local
and can be sensitive. No automatic deletion/retention policy is installed.

Defaults: 2 MB per source file, 128 candidate records per file, 16 MB / 50,000
seeds for a supplied wordlist, 96 bytes per seed and 128 bytes per generated
candidate. Comments/blank/overlong seeds are excluded by the plan generator.
Symlinks and special files are not followed. Resource budgets and type allowlists
mean “nothing recovered” is never a clean-file or no-hidden-data verdict.

## Validation and repeating benchmarks

```bash
.venv/bin/python -m unittest discover -s tests -v

# Choose a new output folder; prior benchmark evidence is preserved.
.venv/bin/python -m hash_watch benchmark \
  --out validation/new-laptop-run --threads 4 --repeats 3
```

Tests exercise real John/Hashcat CPU recovery, Watchdog create/edit/atomic-save/
directory-move events, protected ZIPs, original preservation, ambiguity, bounds,
long-candidate routing, checkpoint restart, interrupted/error batches, plan
integrity, HTML escaping and child termination after an owner is killed. The
recorded GPU correctness checks are in the laptop benchmark evidence.

Upstream sources: [John Jumbo](https://github.com/openwall/john),
[Hashcat](https://github.com/hashcat/hashcat),
[Name-That-Hash](https://github.com/bee-san/Name-That-Hash),
[Watchdog](https://github.com/gorakhargosh/watchdog),
[PoCL](https://portablecl.org/), [Mesa](https://docs.mesa3d.org/rusticl.html).
Upstream source notices and licences remain in the downloaded trees. This is a
local prototype; it has not been committed, published or integrated into Legion.

## Shared continuous processing

The sibling `../shared-reader` now coordinates both readers under
`~/Documents/Hackathon/<project>/<tool>`, including generated content artifacts.
See [shared reader setup](../../../../hackathons/shared-reader/README.md). Empty candidates are now
included in version-3 plans; native empty recoveries are preserved. Structured
JSON checksum values remain review-only, and modular records require complete
token boundaries. Earlier benchmark/resume artifacts describe their recorded
versions and are retained unchanged.

The bundled dictionary is larger than the 50,000-seed prototype budget. Default
version-3 plans explicitly select its first 50,000 accepted seeds and record the
selection in the manifest. User-supplied lists above the limit still fail rather
than being silently truncated.

Additional raw SHA-224/SHA-384 adapters have independent known-answer checks
with both John and Hashcat; unbenchmarked routing defaults to John. Structured
algorithm/hash sibling fields and the NT field of pwdump records carry explicit
format evidence. Checksum context is recognised in plain logs and embedded JSON.
Repeated hash values retain bounded location evidence rather than consuming the
entire distinct-target detection budget.
