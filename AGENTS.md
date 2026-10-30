# Local development

This fork has a user-requested **2,000,000,000 byte** project storage cap, established before code edits/tests. Apply the bundled `project-storage-cap` skill in `skills/project-storage-cap/SKILL.md`. Read `.project-storage.json`; check the mounted filesystem before writing. Keep dedicated environments, tooling, caches, test outputs and desktop profiles inside the project. Never remove source, Git history or user evidence to make room. The initial setup baseline is local `.storage-baseline.json` and must not be overwritten.

Preserve upstream functionality and GPL notices. UI changes must retain existing control IDs, event handlers, dialogs, graph views, exports and approval flows. Use deterministic local fixture data for visual checks; do not start scans or credential actions against a connected network as a UI test.

Work on `codex/` branches. Keep `.state`, `.desktop-profile`, environments, test output and caches out of Git. Before publishing, inspect the staged diff and run the relevant existing checks. Store disposable visual checks in `.artifacts/disposable`.
