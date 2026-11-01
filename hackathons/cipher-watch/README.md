# Cipher Watch prototype

A local Python component combining **Watchdog + base64dump + Ciphey**. It scans an
existing folder recursively, processes new and changed files, and saves results
in a separate folder. It opens source files read-only; it never replaces them.

## Why this format

Reviewed the **5 Whys**, **Device Design**, and **Legion Builder** chats. The useful
output is an evidence record that explains where a lead came from, what was
tried, and what remains uncertain. This prototype therefore provides:

- Versioned JSON evidence, source SHA-256 hashes and byte locations.
- Separate decoded text files and first-layer binary extractions.
- An HTML review page with search, status filters and links to the evidence.
- A proposed Legion findings/artifacts export, with host attribution left unset.

It is a separate Python component, consistent with Legion's Python backend and
ongoing FastAPI/React migration. No Legion source, live workspace, profiler or
Metasploit database is modified. The export shape follows Legion's existing
findings/artifact fields; **a working Legion importer is not included**. Confidence
scores are deliberately not invented. A successful decode is an observation, not
a verified flag, credential, vulnerability or malicious file.

## Install

This setup is tested on **Linux x86_64**. It needs Python, Internet access for the
initial download, and either `uv` or Python's `venv` and `pip`.

```bash
cd /home/joshua/Documents/ChatGPT/Hackathons/cipher-watch
./setup.sh
```

The setup creates a local `.venv`, installs Watchdog 6.0.0, and downloads:

- **Ciphey v0.12.1** Linux binary, verified against its pinned SHA-256.
- **base64dump 0.0.30**, pinned to DidierStevensSuite commit
  `7d625d0b05c4638b981a2a2cc9a8481d7b73e56d` and verified against its SHA-256.

Versions, source URLs and expected hashes are recorded in `setup_tools.py` and
`.tools/manifest.json`. Dependencies stay inside this prototype; no administrator
access, system package change or automatic background service is required.
Runtime scanning does not require Internet access.

## Try the included synthetic files

The demo inbox contains a simple Base64 string, hex, and three layers of Base64.
All three decode to `hello there general`.

Scan once, requiring the known demo answer:

```bash
./watch-demo.sh --once --regex 'hello there general'
```

Open `examples/results/index.html` in a browser. To continuously watch that inbox:

```bash
./watch-demo.sh --regex 'hello there general'
```

Add, edit or move a file into `examples/inbox`. Refresh the HTML report to see
new results. Stop with **Ctrl+C**. The watcher is not enabled at login or boot.

The regex above is only for these synthetic fixtures. Omit it to use Ciphey's
default plaintext checkers, or supply your actual expected flag format.

## Watch your own folder

Both paths must be separate, non-nested folders. The input must already exist.

```bash
.venv/bin/python -m cipher_watch \
  --watch /absolute/path/to/ctf-files \
  --out /absolute/path/to/decoded-results
```

For flags, a more specific stopping condition can reduce false positives:

```bash
.venv/bin/python -m cipher_watch \
  --watch /absolute/path/to/ctf-files \
  --out /absolute/path/to/decoded-results \
  --regex 'flag\{' --decode-seconds 3 --file-seconds 30
```

Use `--polling` for a filesystem where native events are unreliable. Files are
inventoried initially, events are debounced for 0.6 seconds, and a reconciliation
scan runs every 30 seconds. Existing content versions are deduplicated across
restarts. Changed settings, code or tool hashes trigger new processing. To retry
an unchanged version explicitly, use `--once --retry`.

Only one process may own an output folder. Changes detected during a scan retain
the original snapshot hash and are labelled; pending events or reconciliation
process the new version later. The prototype does not promise to capture every
transient intermediate write or a file that disappears before it can be read.

## What gets extracted

The default base64dump generators search raw bytes for contiguous **Base64, hex,
`\x` escapes, `\u` escapes and `%u` escapes**. A bridge calls the pinned tool's
actual generator functions and adds exact source offsets; it does not parse the
human-readable table. `--encodings all` enables all supported base64dump formats,
including Base85, decimal and NetBIOS, at the cost of more noise. See `--help`.

Canonical Base64 text layers are peeled before heuristic checking. Typed hash
records and opaque identifiers are retained for artifact routing without a native
Ciphey call; other UTF-8 candidates use a fresh bounded Ciphey process. A
configured regex is independently enforced and control-byte output is rejected.
Ciphey may accept readable text or remove further layers. The combined path records both
base64dump and Ciphey operations. Identical candidate contents within one file
share a decode result while keeping their separate source locations.

Non-UTF-8 results or results containing NULs are saved as `.bin` evidence and
labelled `binary_first_layer`; further binary decoding is not attempted. The
wrapper never launches extracted content as shell commands or executables; Ciphey
applies its own built-in decoding routines. Byte offsets are zero-based; line numbers and byte columns
are one-based. For binary files these are byte-based locations, not document pages.

This version does **not** unpack archives/Office containers, parse PDFs, OCR
images, reconstruct concatenated strings, join wrapped Base64 lines, detect every
classical cipher passage, read remote filesystems, or decode arbitrary modern
encryption. Those need additional extractors. Ordinary text, hashes and IDs can
also resemble encodings. “No accepted candidates” does not mean a file is safe or
contains no hidden data.

## Outputs

```text
decoded-results/
  index.html                       # latest 500 file versions, refresh manually
  state.sqlite                     # persistent version/config deduplication
  .lock                            # prevents concurrent writers
  versions/<source-path-hash>/<scan-id>/
    report.json                    # source, hash, settings, coverage, findings
    decoded/candidate-001.txt       # checker-accepted text
    extracted/candidate-002.bin     # first-layer binary evidence, when present
    raw/extraction.stdout.txt
    raw/extraction.stderr.txt
    raw/extraction.json            # elapsed time, exit status, return code
    raw/candidate-001.stdout.txt
    raw/candidate-001.stderr.txt
    raw/candidate-001.json
```

Candidate records include the exact extracted bytes and first-layer decoded bytes
as Base64, encoding ID, location and processing status. Findings include decoded
text, combined decoder path, decoded SHA-256 and `human_verified: false`. The
`legion_export` contains findings/artifacts plus `host_ip: null`; a future importer
must attach it to a user-selected target. No host is inferred from a local filename.

Reports retain historical versions; they are never overwritten by a later source
edit. Only the index and deduplication database update. HTML timestamps use
Australia/Perth (AWST); JSON timestamps are UTC. Files with duplicate
candidate contents may reference another candidate's raw diagnostics. Treat all
results as local evidence: output can contain recovered secrets. New output
folders are created with owner-only permissions; existing folder permissions are
left as configured.

## Limits and failure reporting

Defaults: 2 MB per source file, 16 KiB per candidate, 64 distinct decoded values per file (up to eight retained locations each),
2 seconds per Ciphey attempt and approximately 30 seconds per file. Extraction
has a separate maximum of 10 seconds within that budget. Tool processes are
isolated with a 768 MiB address-space limit, bounded output, and process-group
termination on timeout. Symlinks and special files are not followed. Use
`--ignore '*.tmp'` (repeatable) for additional exclusions.

The pinned Ciphey release **can panic on some inputs**, and its CLI uses terminal
output rather than a structured decoding response. This prototype retains raw
output and marks panics, unexpected output, process failures and deadline/size
limits explicitly. `-d` alone does not suppress every special output prompt in
that release, so worker stdin is closed and the outer deadline remains enforced.
Ciphey uses an isolated temporary HOME/config/cache per job, avoiding changes to
an existing Ciphey setup. Temporary worker state is removed after processing.

- `complete`: configured extraction/processing finished; not a security verdict.
- `partial`: some candidates failed or a processing limit was reached.
- `skipped`: the file exceeded the configured file-size limit.
- `error`: extraction or another required operation failed.

Continuous mode reports read errors to stderr and keeps watching. `--once` returns
0 when processed/reused reports are complete, 2 for partial/error/skipped/read
failures, and 2 for argument/setup errors. A partial version is not repeatedly
retried on each reconciliation; use `--once --retry` or change the settings.
No automatic evidence retention/deletion policy is installed.

## Validation

```bash
.venv/bin/python -m unittest discover -s tests -v
```

Tests use real Watchdog events, the pinned base64dump and the downloaded Ciphey
binary for embedded/multilayer/hex decoding. They verify source bytes and mtime,
create/edit/atomic-save/directory-move events, restart deduplication, distinct
locations, binary evidence, ignored paths, symlinks/FIFOs, limits, HTML escaping,
and failure/timeout handling. Error and runaway-output cases use controlled
local fixtures; no external targets are contacted.

## Upstream references

- [Watchdog](https://github.com/gorakhargosh/watchdog)
- [base64dump.py source](https://github.com/DidierStevens/DidierStevensSuite/blob/7d625d0b05c4638b981a2a2cc9a8481d7b73e56d/base64dump.py)
- [Ciphey v0.12.1 release](https://github.com/bee-san/Ciphey/releases/tag/v0.12.1)

base64dump is public domain; Ciphey is MIT licensed; Watchdog is Apache-2.0
licensed. Upstream source/binaries remain under their respective terms.

## Shared continuous processing

The sibling `../shared-reader` watches project tool folders and reprocesses
extracted bytes, accepted text and recovered password candidates through both
readers. It also adds bounded archive/normalization layers. See
[shared reader setup](../shared-reader/README.md). A configured regex is now
independently enforced on Ciphey output; mismatches remain diagnostic evidence
and are not promoted to accepted findings.

Repeated occurrences no longer consume the distinct-value extraction budget.
The bridge scans each distinct encoding representation once, retains bounded
first/last locations and counts, and still reports a real distinct-value overflow.
All extracted first-layer candidates remain in a report even when language
checking reaches its deadline, so the shared router can inspect those bytes.
