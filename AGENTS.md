# Documentation ownership

Only the **Project Manager** AI in chat
`01a1975d-5358-7750-9118-52b4ce220c10` may create, modify, delete, rename or
generate Markdown or any other documentation for this codebase. This includes
agent instructions, READMEs, guides, plans, status/review reports and documentation
in other formats. Documentation edits in code comments/docstrings are covered
too. Other AI agents must leave documentation to this Project Manager; changing
the format, location or filename does not bypass this restriction. They may work
on authorised code/tests and produce raw test logs or machine-readable results.

No AI, including Project Manager, may recommend, solicit or ask Project Manager
to add instructions or expand agent rules. Changes to agent instructions must
originate from an explicit user request. Reporting a defect or test result is
allowed; appending a request for new instructions is not.

The human user may change documentation or these rules at any time. This grant
does not authorise Project Manager to publish, push or change unrelated settings.

Joshua transferred project management to this chat. Linked checkout directories
use the exact owning AI chat name. An AI taking over a checkout updates its name
to match its chat, using Git worktree operations and preserving working changes.
Coordinate path changes with other users of that checkout; retain compatibility
aliases while existing processes depend on an old path. The primary repository
keeps its product name. Newly merged Markdown awaiting review belongs under
`temporary-documents/`; retain its original relative path within that folder.

# Local development

This fork has a user-requested **2,000,000,000 byte** project storage cap, established before code edits/tests. Apply the bundled `project-storage-cap` skill in `skills/project-storage-cap/SKILL.md`. Read `.project-storage.json`; check the mounted filesystem before writing. Keep dedicated environments, tooling, caches, test outputs and desktop profiles inside the project. Never remove source, Git history or user evidence to make room. The initial setup baseline is local `.storage-baseline.json` and must not be overwritten.

Preserve upstream functionality and GPL notices. UI changes must retain existing control IDs, event handlers, dialogs, graph views, exports and approval flows. Use deterministic local fixture data for visual checks; do not start scans or credential actions against a connected network as a UI test.

Work on `codex/` branches. Keep `.state`, `.desktop-profile`, environments, test output and caches out of Git. Before publishing, inspect the staged diff and run the relevant existing checks. Store disposable visual checks in `.artifacts/disposable`.

## Domain contracts: required for human and AI contributions

Read `CONTRIBUTING.md` before adding or changing tool actions/results,
observations or artifact references. Their single source is respectively
`app/contracts/actions`, `app/contracts/observations`, and `app/contracts/artifacts`.
Use the approved roots from `app/contracts/base.py`; reuse existing definitions
instead of adding a similar class elsewhere. These folders contain data definitions
and pure validation/conversion only. Keep services, runners, parsers, filesystem or
database access, UI, tests, examples and documentation outside them.

Run `.venv/bin/python -B scripts/check-contracts.py` and the relevant behavioural
tests after each contract change. The checker reports a path, rule and repair hint;
fix the owning definition rather than adding an exemption or weakening the gate.
New checker rules require rejection tests as well as a valid example. Regenerate
OpenAPI/TypeScript when wire shapes change and run the frontend contract check.
Report actual checks and remaining limits; a structural checker does not prove a
tool result is true. Keep candidates, reproduced findings, execution and sessions
distinct. Persistent recovery is now authorized for owned-process cleanup and
idempotent offline import/settlement of saved results. Never replay network
commands on restart or trust imported/copy-local PID/lease metadata as authority.

## Keep project descriptions current

When a change alters user-visible capabilities, setup, limitations or agreed
scope, Project Manager maintains the relevant documentation. This does not
authorise other AI agents to edit it or request instruction additions:

- `README.md`: concise product summary, available features and run instructions.
- `docs/requirements.md`: scope, agreed requirements, acceptance criteria, implementation status and unresolved decisions. Keep proposed or separately built features distinct from implemented app behaviour.
- `docs/architecture.md`: current component ownership, execution, persistence and compatibility boundaries.
- `CONTRIBUTING.md`: development setup, build/test procedures, canonical definitions, allowed dependencies and required checks.
- `docs/operations.md`: installation/configuration, network/readers, data recovery and troubleshooting.
- `.github/repository-description.txt`: the intended GitHub About description. Keep it consistent with the README and update the GitHub field when repository administration is available and authorized. Editing this text file does not automatically change GitHub settings.

Working prototypes and reviewed Figma designs are not published app features. Separate execution completion, reproduced findings, sessions and privilege changes. Keep authenticated web investigation deferred until the basic integrated workflow is implemented; do not assume detailed pivoting or privilege-escalation scope is agreed.

Keep these six main documents concise and current. Delete superseded plans,
completed task reports, old test counts and duplicated status text; do not create
a historical archive or restore the removed migration/status documents. Keep
licence/attribution notices and source-adjacent instructions needed to use assets,
skills or vendored components. Do not delete actual investigation evidence.

Categories and subcategories describe targets. A new subcategory or any expansion
of an agreed definition/capability membership requires explicit user approval;
AI review is not that approval. Define each action's purpose, inputs and outputs
before implementing it. Share canonical tool integrations across modules.

Verify that documentation is tracked and relative links resolve. Do not copy local
investigation evidence, recovered secrets or machine-specific paths into public
documentation. Documentation work does not authorize unrelated implementation,
publishing or settings changes.
