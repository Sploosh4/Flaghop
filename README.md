# merge-after-review-delete-the-rest

FlagHop and Hackathons work collected for review on 1 November 2026.
The original repositories, working folders and running services remain intact.
The repository name is not approval to delete them.

| Location | Contents |
| --- | --- |
| [flaghop/](flaghop/README.md) | FlagHop application from reviewed `main` commit `fc8a960`, with its available Git history retained. |
| [hackathons/ctf-profiler/](hackathons/ctf-profiler/README.md) | Standalone scanner, lab fixture source, tests, setup scripts and review reports. |
| [hackathons/cipher-watch/](hackathons/cipher-watch/README.md), [hash-watch/](hackathons/hash-watch/README.md), [shared-reader/](hackathons/shared-reader/README.md) | Reader source, tests, examples, evaluation harnesses and review summaries. |
| [hackathons/filesystem-reader-integration/](hackathons/filesystem-reader-integration/README.md) | Reader integration contract, web assets and tests. |
| [hackathons/pi-bridge/](hackathons/pi-bridge/README.md) | Pi bridge and tool-activity monitor source and tests. |
| [hackathons/scanning-acceptance-v2/](hackathons/scanning-acceptance-v2/README.md), [v3/](hackathons/scanning-acceptance-v3/README.md), [reader-validation/](hackathons/reader-validation/README.md) | Observer-owned acceptance suites and reader audit harnesses. |
| [hackathons/](hackathons/) | Handoffs, audit documents, workflow notes and original design/workbook outputs. |

GreenSpark and Laptop work are excluded at Josh's request. New work owned by
Reviewer, Worker and Project Manager was not collected.

## What was preserved

FlagHop source is unchanged from the reviewed application. Its 21 bundled
scanner files also match the standalone source. All included source files have
byte counts, SHA-256 digests and executable-mode records in
[CONSOLIDATION.json](CONSOLIDATION.json).

The VPN checkout has five historical commits outside the main branch's ancestry;
their history is retained as an additional parent of the consolidation commit.
Its older application tree does not replace the newer reviewed application.
Other included FlagHop branch tips were already ancestors of the reviewed main.
The Hackathons repository had no commits, so its selected working files receive
their first commit here.

Run the read-only capture check:

```sh
python3 -B tools/verify_consolidation.py
```

## What stays at the originals

Installed toolchains, virtual environments, browser profiles, caches, credentials,
live configuration, raw scan results, generated evaluation corpora, backups and
duplicate output ZIPs are excluded. Evaluation scripts and Markdown review
reports are included; their raw proof directories are not. The manifest records
the selection rules and excluded directory counts. Keep the originals for any
evidence review that needs those bytes.

This is source consolidation, not a new combined application or a fresh test
certification. Existing imports, commands and documentation may refer to their
original installation paths. Run component commands from the relevant component
directory after reviewing its setup and storage requirements. No dependencies
were installed and no live scans or services were started for this consolidation.

Each component retains its original licence notices. No new licence is imposed
on work that did not already declare one.
