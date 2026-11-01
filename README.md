# FlagHop

A desktop CTF workspace built from Legion. Run guarded local tools, investigate
devices and services, and keep files, evidence, jobs and results in one project.
Repository: [Sploosh4/Flaghop](https://github.com/Sploosh4/Flaghop).

**Status: incomplete prototype.** The implemented features below are usable;
the complete scan → action → session/files → flag workflow is unfinished.

Available features include a picture-based hardware map, selected-device Deep
scans, service inventory, evidence reopening, project save/restore/export and
local Files/editor windows. Cipher/password reader controls are integrated;
their engines and service are separate dependencies. Text edits remain browser
drafts. Full topology, contextual actions, Metasploit sessions and remote Files
are still to build. See [requirements](docs/requirements.md).

| Area | Current status |
| --- | --- |
| First-layer design and topology | **Incomplete:** progressive unknown targets, network grouping, relationship meanings and composite computer/connector pictures still need design or implementation. |
| Modules and categories | Backend capability foundation exists; **incomplete:** production taxonomy, new action definitions and category-driven UI remain pending. |
| Action cards and bulk work | **Incomplete:** the full contextual action panel and selected-target workflows remain to build. |
| Sessions and remote Files | **Incomplete:** unified Metasploit sessions, docked terminals, remote SSH/SFTP Files and durable edited copies are unfinished. |
| Reader packaging and installation | Existing controls work; **incomplete:** a fresh-install package and migration from the separate reader runtime are unfinished. |
| Broader workflows | **Incomplete:** detailed pivoting/privilege workflows need agreement; authenticated web investigation remains deferred. |

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

The collected Hackathons sources are under `hackathons/`, with current images
in [the artwork gallery](hackathons/output/flaghop-artwork/index.html). This is
ordinary source in the FlagHop repository, with no nested Hackathons Git history.
These folders include standalone prototypes and validation tools; their presence
does not mean every capability is integrated. **Prototype integration and
packaging are incomplete.**
The existing reader installation still uses its original runtime folder;
moving those installed tools into the capped code mount requires a separate
dependency/storage migration. Incoming documentation awaits review in
`temporary-documents/`.

## Licence and credits

Based on [Hackman238/legion](https://github.com/Hackman238/legion).
Licensed under [GPLv3](https://github.com/Hackman238/legion/blob/master/LICENSE).
[Upstream credits](ATTRIBUTION.md).
