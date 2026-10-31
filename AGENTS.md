# Local development

This fork has a user-requested **2,000,000,000 byte** project storage cap, established before code edits/tests. Apply the bundled `project-storage-cap` skill in `skills/project-storage-cap/SKILL.md`. Read `.project-storage.json`; check the mounted filesystem before writing. Keep dedicated environments, tooling, caches, test outputs and desktop profiles inside the project. Never remove source, Git history or user evidence to make room. The initial setup baseline is local `.storage-baseline.json` and must not be overwritten.

Preserve upstream functionality and GPL notices. UI changes must retain existing control IDs, event handlers, dialogs, graph views, exports and approval flows. Use deterministic local fixture data for visual checks; do not start scans or credential actions against a connected network as a UI test.

Work on `codex/` branches. Keep `.state`, `.desktop-profile`, environments, test output and caches out of Git. Before publishing, inspect the staged diff and run the relevant existing checks. Store disposable visual checks in `.artifacts/disposable`.

## Keep project descriptions current

When a change alters user-visible capabilities, setup, limitations or agreed scope, update the relevant documentation in the same change:

- `README.md`: concise product summary, available features and run instructions.
- `docs/project-status.md`: published code versus local development, separate tools, active work, planned/deferred scope and unresolved problems. Date status reviews and retain evidence/revision boundaries.
- `docs/ctf-workspace-roadmap.md` and `docs/requirements-and-questions.md`: delivery order, requirements and decisions still open. Remove resolved questions rather than adding contradictory updates.
- `MIGRATION.md` and `docs/background-workspaces.md`: changed API, compatibility, reader and setup contracts.
- `.github/repository-description.txt`: the intended GitHub About description. Keep it consistent with the README and update the GitHub field when repository administration is available and authorized. Editing this text file does not automatically change GitHub settings.

Working prototypes and reviewed Figma designs are not published app features. Separate execution completion, reproduced findings, sessions and privilege changes. Keep authenticated web investigation deferred until the basic integrated workflow is implemented; do not assume detailed pivoting or privilege-escalation scope is agreed.

Verify that new documentation is tracked and that relative links resolve. Preserve upstream licence notices and historical plans, marking superseded plans clearly. Do not copy local investigation evidence, recovered secrets or machine-specific paths into public documentation. Documentation review does not authorize unrelated implementation, publishing or settings changes.
