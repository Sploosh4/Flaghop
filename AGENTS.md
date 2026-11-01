# Review consolidation

Josh requested FlagHop and Hackathons work only. Reviewer, Worker and Project
Manager remain excluded from new work collection. GreenSpark and Laptop work
are outside this repository.

This repository preserves the component layout and source bytes for review.
Component instructions and licences still apply within their directories.
Do not treat consolidation as proof of new integration, portability or test
coverage. Do not start scanners, authenticate, install toolchains, change live
services or delete originals as part of reviewing this snapshot.

Run `python3 -B tools/verify_consolidation.py` to check captured bytes and Git
ancestry. The source manifest and exclusion policy are in `CONSOLIDATION.json`.
Keep runtime state, credentials, dependencies, caches and generated raw results
out of Git. Do not erase the original locations until Josh approves deletion
after reviewing both included files and exclusions.

FlagHop retains its existing mounted 2 GB storage policy. This review copy has
no installed environment and is not a replacement for the running installation.
Provision and verify compliant storage before running component build/test/setup
commands; do not move the original toolchains here to evade their storage cap.
