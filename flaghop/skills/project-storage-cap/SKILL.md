---
name: project-storage-cap
description: Enforce a project's explicit disk budget, including its dedicated environments, caches, test artifacts and tooling. Use when a user requests a storage cap or when working in a project containing .project-storage.json.
---

# Project storage cap

Apply only to the selected project and its dedicated resources. Read `.project-storage.json` for the limit and cleanup paths, and pass the selected project as `--root`. The default requested budget is **2,000,000,000 bytes (2 GB)**, established after installation and before code edits or tests. An explicit project policy takes precedence.

## Before work

- Run `python3 scripts/storage_guard.py --root PROJECT --check` from this skill directory. Verify the configured capped filesystem is mounted when `require_mount` is true. A missing mount is a blocker for writes; do not write into the underlying mountpoint.
- Count source, `.git`, project-specific Python/browser environments, test dependencies, caches, profiles, temporary files and results. Shared system applications need not be duplicated, but do not relocate project-specific files outside the root to evade the cap.
- Put dedicated caches in `PROJECT/.cache`, temporary work in `PROJECT/.tmp`, and disposable test output in `PROJECT/.artifacts/disposable`. Store real user evidence and project data in `PROJECT/.state`, which cleanup must preserve.
- Capture the initial usage as `PROJECT/.storage-baseline.json` once installation and storage setup are complete, **before application code edits or tests**. Do not recreate that baseline later.

## During work

- Run the guard before and after installs, builds, tests, downloads and artifact generation. Run `--watch` as a user service during project work to clean disposable files when allocated usage reaches 90% of the limit. The filesystem ceiling prevents writes beyond its capacity even between checks.
- Before a large write, reserve enough headroom for its peak size, including unpacked copies. Use bounded downloads and logs; avoid full duplicate checkouts.
- Cleanup is already authorized for unnecessary files in this project. Only delete reproducible caches or files explicitly placed in disposable output paths. The helper does not follow symlinks and never deletes source, Git history, environments, credentials, profiles, user scans or evidence.
- If reclaimable files cannot restore headroom, stop the write and explain what protected data occupies the space. Do not increase the cap or delete protected material to pass a check.

## Hard limits

A periodic cleanup job is not a hard quota. Use an actual filesystem/project quota or a dedicated fixed-capacity filesystem when the user requests an enforceable ceiling. Provisioning must preserve existing data, verify the mounted source, and persist mounting across reboot. The helper checks but does not provision the filesystem.

## Helper

`python3 scripts/storage_guard.py --root PROJECT --check` reports usage and cleans when needed; exits nonzero if the mount is missing or protected data leaves inadequate headroom. `--watch` repeats every five seconds. The JSON policy's cleanup paths must be relative, cannot contain symlinks or `..`, and must reside under `.cache` or `.artifacts/disposable`. Bytecode caches outside protected environments are also disposable.
