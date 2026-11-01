# FlagHop

A desktop CTF workspace built from Legion. Run guarded local tools, investigate
devices and services, and keep files, evidence, jobs and results in one project.
Repository: [Sploosh4/Flaghop](https://github.com/Sploosh4/Flaghop).

Available features include a picture-based hardware map, selected-device Deep
scans, service inventory, evidence reopening, project save/restore/export and
local Files/editor windows. Cipher/password reader controls are integrated;
their engines and service are separate dependencies. Text edits remain browser
drafts. Full topology, contextual actions, Metasploit sessions and remote Files
are still to build. See [requirements](docs/requirements.md).

## Install and run

Use Python 3.12+ on Linux. Install Nmap and the external tools you intend to use.
This project requires a mounted **2,000,000,000-byte storage cap** before installing
dependencies. Keep dedicated environments, caches and data inside it; the
[storage guard](skills/project-storage-cap/SKILL.md) checks the mount and usage.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-desktop.txt
.venv/bin/python flaghop.py
```

For browser-only mode, install `requirements.txt` instead and run
`.venv/bin/python flaghop.py --web`. Open <http://127.0.0.1:5000>.
FastAPI/Uvicorn serves all HTTP routes, pages, files and WebSockets. Production
frontend assets are included; Node.js is needed only for development.

Projects default to `~/Documents/FlagHop/[project name]`; change the base folder
in Setup. Existing `.legion` workspaces are supported. Network jobs require
project scope, a matching route/profile and Linux enforcement privileges;
unsupported or unconfigured work is held. Follow [operations](docs/operations.md).

## Development

Follow [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, builds, tests
and contract authoring. See [architecture](docs/architecture.md) for how the
application fits together; [AGENTS.md](AGENTS.md) contains AI-agent instructions.

## Licence and credits

Based on [Hackman238/legion](https://github.com/Hackman238/legion).
Licensed under [GPLv3](https://github.com/Hackman238/legion/blob/master/LICENSE).
[Upstream credits](ATTRIBUTION.md).
