# FlagHop

A desktop workspace for CTFs, built from Legion. The repository is [Sploosh4/Flaghop](https://github.com/Sploosh4/Flaghop); the current app name is FlagHop. Run local scans and tools, keep their evidence in a project, and track jobs and results.

The next step is to connect device mapping, reconnaissance, Metasploit actions and file analysis in one workflow.

## Project status

Reviewed 31 October 2026. This checkpoint includes:

| Stage | What works or is being built |
| --- | --- |
| Workspace | Desktop/browser app, named projects, inventory, evidence graph, jobs, approvals, history, save/restore and ZIP export. React/FastAPI workspace and activity panels. |
| Files and readers | FlagHop branding, configurable project folders, per-workspace reader Start/Stop, Working/results, persistent dismissal, and a local file browser/editor. Reader engines are separate dependencies. |
| Network settings | Per-project targets, exclusions, ports and connection identity. Guarded local commands check scope, profile and routes, with Linux egress restrictions. |
| Scanner integration | Guarded selected-device Deep scan, validated profile/import, service and role hypotheses, separate candidate/reproduced findings, history and evidence reopening. Verified against owned local fixtures. |
| Still to integrate | Observed-hop topology, the full action panel/terminal, Metasploit jobs, remote sessions in Files, and repeatable reader setup. |
| Deferred | Unified website targets and authenticated web investigation after the basic network workflow. |

The current evidence graph and the planned network-topology map are separate views. Metasploit profile import exists in the separate profiler; the unified action/session workflow is still planned.

The `master` branch includes the picture-based [Hardware layer in Overview](docs/hardware-overview.md), using the current inventory and saved route observations. Scanner/profile import is included in this checkpoint; full action-card integration remains separate work.

It also adds collapsible Hash/Cipher results, Working then History, green Start/red Stop, and independent Files/editor windows. Internal workspace decoding noise stays in History. Stop is cooperative and takes effect at the next bounded step; worker-stop observation is not supported. This was merged into `master` on 31 October 2026; `main` subsequently received the scanner and FastAPI architecture checkpoint.

The map labels selected VPN types and uses larger device shortcut numbers. An empty Cyber Kill Chain section sits above Hash; action integration is still planned.

Reader integration has passed real two-workspace decoding and synthetic password-recovery checks. Text edits stay in browser drafts. The reader engines/service remain separate dependencies; cloning this branch does not install them.

This checkpoint adds guarded Deep scan jobs and profile/evidence import. Live owned-fixture acceptance passed with a normal-user scanner, allowed/denied-port controls, real browser proof and saved evidence reopening. See [architecture](docs/architecture.md) and [scanner integration](docs/scanner-integration.md).

[Delivery status](docs/project-status.md) · [Roadmap](docs/ctf-workspace-roadmap.md) · [Open questions](docs/requirements-and-questions.md) · [Readers](docs/background-workspaces.md) · [Network setup and limits](docs/project-network-settings.md)

This checkpoint centralizes action/result, observation and artifact-reference
definitions. [Contract authoring](docs/contract-authoring.md)
describes approved classes and the checker required for human and AI contributions.
Persistent run recovery remains deferred.

## Run

Use Python 3.12+ on Linux, with Nmap and the tools you want to run.

Network jobs require configured project scope, a matching interface/profile and administrator access for Linux enforcement. Unsupported or unconfigured jobs are held. Profile discovery and automatic connection management remain planned; see the network setup guide.

This checkout uses a **2 GB storage cap**. Mount a capped filesystem at the project root before installing, and keep environments, caches and data inside it. The [storage guard](skills/project-storage-cap/SKILL.md) checks the cap; it doesn't create it.

Install `requirements-desktop.txt` into `.venv`, then run:

```sh
.venv/bin/python legion.py
```

For the browser interface, use `requirements.txt` and run:

```sh
.venv/bin/python legion.py --web
```

Open <http://127.0.0.1:5000>. The local migration candidate serves all routes, pages, uploads, downloads and WebSockets through FastAPI/Uvicorn; it has no Flask fallback or `--web-stack` selector. Frontend assets are included; Node.js is only needed for development. Build and test commands are in [MIGRATION.md](MIGRATION.md).

Projects default to `~/Documents/FlagHop/[project name]`. Change the base folder in Setup. Existing `.legion` workspaces remain supported; moving existing project folders is an explicit operation.

## Licence and credits

Based on [Hackman238/legion](https://github.com/Hackman238/legion). Licensed under [GPLv3](https://github.com/Hackman238/legion/blob/master/LICENSE). [Upstream credits](ATTRIBUTION.md).
