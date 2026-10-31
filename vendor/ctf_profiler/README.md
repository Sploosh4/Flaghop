# Standalone scanner source snapshot

This is the user-owned, refactored CTF profiler source reviewed on 31 October
2026. Its 18 production modules and three template/wordlist inputs are copied
byte for byte. `source-manifest.json` records each production/input file's SHA-256.
The original standalone scanner remains separate and unchanged.

No toolchains, environments, caches, private investigations or validation output
are bundled. Install external tools separately and make them available on PATH;
missing dependencies remain visible in the saved profile. This snapshot does
not resolve the known Chrome ELF/WPScan entrypoint identity gaps.

FlagHop runs the CLI through `app.scanning.worker` and the shared network guard.
The adapter adds only a scan-owned localhost proxy handshake and interruption
handling; it does not change the scanner's planners or proof rules.

`tests/test_dependency_compat.py` and its synthetic XML fixture retain the four
upstream Python 3.12 regressions unchanged. From this directory run
`../../.venv/bin/python -m unittest discover -s tests -p test_dependency_compat.py`.
`validation-provenance.json` records their hashes, the reviewed standalone report
identities and test counts without copying private run evidence. Standalone
acceptance does not establish the app's live guarded execution path.

## Updating this snapshot

From the repository root, run `.venv/bin/python scripts/update-scanner.py
--source /path/to/reviewed/scanner --check`. It reports changed inputs and a
candidate manifest digest without writing. Review the source diff and its
standalone tests first. Apply that exact candidate with `--write
--expected-manifest DIGEST`, then rerun the check, scanner compatibility tests,
app import/guard regressions and browser-gated acceptance before claiming the
new bundle is verified. A changed candidate rejects the review digest.

The updater accepts only the explicit 18-module/three-input inventory and bounded
ordinary files. Tools, environments, private evidence and evaluator files are
never copied. New modules need an explicit inventory review. Inputs are staged;
the manifest is published last so an interrupted update fails runtime identity
checks. Rerun the same reviewed update to repair it. Historical validation
provenance is not silently relabelled as evidence for a new source revision.
