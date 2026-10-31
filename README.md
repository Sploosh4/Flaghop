# FlagHop

Projects default to `~/Documents/FlagHop/[project name]`. Change the base folder in Setup, below VPN. Desktop exports start in the project's `exports` folder; browser downloads use the browser's download settings. Existing `.legion` workspaces remain supported.

A desktop app for CTFs. Run scans and tools, keep the results in a project, and see what's running.

The plan is to bring the device map, Metasploit, file analysis and website tools into the same app.

## Roadmap

- [x] Desktop app, scans, evidence graph, jobs and approvals.
- [x] Backend cleanup and React/FastAPI workspace and activity panels.
- [x] Per-workspace reader controls, saved-result alerts, file browser and editor.
- [ ] Map devices and show connection types with coloured lines. Run commands from the map.
- [ ] Add Metasploit and a panel on the right for actions, decoded text, found files and hashes to try cracking.
- [ ] Package the reader setup and connect remote filesystem sessions.
- [ ] Revisit website targets and web tools after the network workflow.

[Full plan and open questions](docs/ctf-workspace-roadmap.md).

[Unfinished requests and UI/non-UI questions](docs/requirements-and-questions.md).

[Workspace reader setup and controls](docs/background-workspaces.md).

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

## Licence and credits

Based on [Hackman238/legion](https://github.com/Hackman238/legion). Licensed under [GPLv3](https://github.com/Hackman238/legion/blob/master/LICENSE). [Upstream credits](ATTRIBUTION.md).
