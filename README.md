# FlagHop

A desktop workspace for CTFs, built from Legion. The repository is [Sploosh4/Flagmap](https://github.com/Sploosh4/Flagmap); the current app name is FlagHop. Run local scans and tools, keep their evidence in a project, and track jobs and results.

The next step is to connect device mapping, reconnaissance, Metasploit actions and file analysis in one workflow.

## Project status

Reviewed 31 October 2026. The published code and the local development app are at different stages:

| Stage | What works or is being built |
| --- | --- |
| Published foundation | Desktop/browser workspace, named projects, local scans and tools, inventory, evidence graph, jobs, approvals, history, save/restore and ZIP export. React/FastAPI workspace and activity panels. |
| Verified in local development; code publication pending | FlagHop branding and configurable project folders. Per-workspace cipher/password reader Start/Pause, real Working/results, persistent alert dismissal, and a local file browser/editor. |
| In progress separately | Final scanner verification and shared project network settings for OpenVPN/WireGuard, targets, exclusions and route checks. |
| Still to integrate | The reviewed device-map design, scanner results in the app, unified action panel/terminal, Metasploit jobs, remote sessions in Files, and repeatable reader setup. |
| Deferred | Unified website targets and authenticated web investigation after the basic network workflow. |

The current evidence graph and the planned network-topology map are separate views. Metasploit profile import exists in the separate profiler; the unified action/session workflow is still planned.

Local reader integration has passed real two-workspace decoding and synthetic password-recovery checks. Pause is cooperative and displays **Pause requested** until stop observation is supported. Text edits currently stay in browser drafts. The reader engines/service remain separate dependencies; cloning this branch does not install them.

[Delivery status and remaining problems](docs/project-status.md) · [Roadmap](docs/ctf-workspace-roadmap.md) · [Requests and open questions](docs/requirements-and-questions.md) · [Local reader integration](docs/background-workspaces.md)

## Run

Use Python 3.12+ on Linux, with Nmap and the tools you want to run.

This checkout uses a **2 GB storage cap**. Mount a capped filesystem at the project root before installing, and keep environments, caches and data inside it. The [storage guard](skills/project-storage-cap/SKILL.md) checks the cap; it doesn't create it.

Install `requirements-desktop.txt` into `.venv`, then run:

```sh
.venv/bin/python legion.py
```

For the browser interface, use `requirements.txt` and run:

```sh
.venv/bin/python legion.py --web
```

Open <http://127.0.0.1:5000>. Frontend assets are included; Node.js is only needed for development. Build and test commands are in [MIGRATION.md](MIGRATION.md).

The published foundation uses `~/Documents/Hackathon/[project name]`. The local FlagHop development app defaults to `~/Documents/FlagHop/[project name]` and lets you change the base folder in Setup. Existing `.legion` workspaces remain supported. See the delivery status before relying on development-only features.

## Licence and credits

Based on [Hackman238/legion](https://github.com/Hackman238/legion). Licensed under [GPLv3](https://github.com/Hackman238/legion/blob/master/LICENSE). [Upstream credits](ATTRIBUTION.md).
