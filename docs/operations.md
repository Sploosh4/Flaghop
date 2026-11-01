# Operations

Use this guide to configure, run and recover FlagHop. Start with
[README](../README.md) for installation/launch and
[CONTRIBUTING](../CONTRIBUTING.md) for development/build/test procedures.

## Installation and startup

Prerequisites: Python 3.12+ on Linux, a mounted project storage cap and the
dependencies for desktop or browser mode. Nmap and other scanner executables
must be available on PATH; the app does not bundle their toolchains.

1. Follow the README installation command for your chosen mode.
2. Launch `legion.py` for desktop or `legion.py --web` for browser mode using
   the project environment.
3. Open/create a project. Select the base save folder in Setup if required.

Expected result: the project home/Overview opens. Missing external tools remain
visible as unavailable or incomplete work. Reader readiness and network setup
are separate prerequisites; a successful launch does not establish either.

## Project network

Prerequisites: a saved project, the supplied lab/event scope and a connection
already configured through your selected client. In **Project setup → Network settings**:

1. Choose NetworkManager, OpenVPN or WireGuard as the connector. This selects
   the manager/client; connection mode and live state are separate settings.
2. Enter the lab/event name and scope source. Configure allowed IPv4/IPv6
   addresses, CIDRs or exact hostnames, exclusions and any TCP/UDP port limits.
   Exclusions win; a route or interface subnet does not establish permission.
3. Select local/direct, OpenVPN or WireGuard mode, the expected interface and
   the profile identity where needed.
4. Optionally enter required TCP services as `hostname:port` or `IP:port`.
5. Save, then explicitly check a target. Saving does not connect or scan.

| Connector | Profile identity |
| --- | --- |
| NetworkManager | Active connection UUID on the selected interface |
| OpenVPN | Absolute configuration path matching a running client with an explicit tunnel device; process and configuration digest are rechecked |
| WireGuard | Expected peer public key on the selected interface |

Expected result: the settings save and the explicit target check reports its
observations or a held reason. Opening Settings or saving does not connect or
probe. Local/direct mode can leave profile identity blank, but the target route must
match the expected interface. A saved preference is not a live connection;
no response is not proof a host is down. Diagnostics stay in Settings.

Linux enforcement needs `ip`, `nft`, `setpriv`, `unshare`, `mount`, `pkill`,
`pgrep` and `getent`, plus the client for the selected connection mode. Local
administrator access is required through an administrator-launched app or
existing noninteractive sudo authorization. Missing enforcement holds work.

- WireGuard needs an existing nonzero transport fwmark. The app does not change
  it; encrypted peer traffic must use the checked transport path.
- OpenVPN uses a userspace `tun` device. DCO needs a separate enforced adapter;
  configure `disable-dco` for the supported runner.
- Nmap TCP connect scanning is supported. Explicit raw-socket modes and passive
  capture are held. Other tools needing elevated capabilities fail explicitly.
- Range preflight checks inspect boundary addresses; packet restrictions cover
  all destinations. A range overlapping an exclusion is held as a whole.
- Profile discovery/import/connect/disconnect, remote runners, separate callback
  checks and traceroute are not implemented.

Jobs recheck the original project's settings before starting and monitor path
changes. Independently launched external tools need an integration/wrapper;
reading the settings API does not constrain their traffic. See
[architecture](architecture.md) for enforcement and persistence boundaries.

## Cipher and password readers

Prerequisites: the separate shared-reader service and Cipher/Hash engines are
installed/configured. FlagHop does not install or launch them.

1. From the shared-reader directory, enroll the running app's project-hub catalog:

   ```sh
   ./run.sh watch --root /path/to/legacy-projects \
     --projects-catalog /path/to/app-config/project-hub.json
   ```

2. Open the intended project and check reader readiness, then use Start.
3. Use Stop to request a pause; queues/results remain available.

Expected result: a fresh matching registration enables Start; Working/History
reflect that project's actual jobs/results. `--projects-catalog` is repeatable
and includes custom save folders. Use one shared reader owner rather than one
process per workspace.

The worker publishes `.reader-state/worker-status.json` with the matching Hub
project ID and a fresh heartbeat. Missing/stale registration disables Start;
Stop remains available. New projects start paused. Project/view changes do not
resume processing; Stop requests a pause at the next bounded step, preserving
queues and results rather than confirming immediate termination.

Dismiss retains result bytes/provenance. Internal metadata and database/wordlist
candidates do not become new discoveries. Deep scan jobs have separate controls;
reader Start/Stop does not control them.

Files and Text Editor use independent native windows or browser tabs. Original
files remain unchanged; text edits are browser drafts, and binary/incomplete
results are read-only previews. Reader results stay project-scoped until a
verified source association permits device filtering. SSH browsing remains in
the separate workbench.

## Save, export and restore

1. Save through the project context menu or Ctrl S. Rename changes the displayed
   project name while retaining its folder. Use Save as for a separate copy.
2. Use Export ZIP for a portable workspace with its project files/tool output.
3. From project home, open an existing `.legion` workspace or restore its ZIP
   into the configured save location. Check the resulting project before use.

Expected result: the copy/restore preserves full saved results, original evidence
and source lineage. Copied readers are stopped and copied execution controls have
no live authority. Network configuration may need setup before new network work.
An unresolved protected execution blocks save/copy/move of its original project.
Transfer limits reject oversized/invalid archives or insufficient space without
partially adopting a workspace. Do not use copying to bypass a cleanup hold.

Text-editor changes remain browser drafts. Durable edited-copy saving is not
available; original evidence stays unchanged.

## Recover interrupted work

1. Inspect History or the workspace recovery notice for the affected project.
2. Resolve the reported permission/configuration/ownership problem where possible.
3. Use Recover saved result or Retry cleanup for eligible original work, then
   check the resulting status and evidence.

Expected result: verified owned processes are cleaned up and validated retained
results can settle offline. Missing or unverifiable ownership remains held;
missing execution-exit evidence remains partial. Restarting/recovering never
replays a saved network command. Do not edit stored PID/GID or journal fields to
force cleanup. A new network attempt is a separate explicit action.

For integrations, inspect `GET /api/recovery` and the corresponding retry routes
in the running app's `/docs` or `/openapi.json`; requests use owned IDs, not PIDs
or arbitrary filesystem paths.

## Troubleshooting

| Symptom | Check / next step |
| --- | --- |
| Reader Start disabled | Confirm the service is running, its catalog matches the app, and `.reader-state/worker-status.json` has a fresh matching project ID/registration. |
| Stop requested but work visible | Pause is cooperative. Allow the current bounded step to reach its pause boundary; Stop is not proof of immediate termination. |
| Network action held | Read the saved reason; check scope/exclusions, profile identity, route/interface, required services and Linux enforcement privileges. Do not run through an unrestricted fallback. |
| Connection configured but target unverified | Use the explicit Settings target check. A saved preference or connected tunnel does not establish target-service access; an unanswered probe does not prove a host down. |
| Partial/failed scan | Inspect the saved tool errors, dependency availability, parsing/proof and cleanup state. Retain useful evidence; do not relabel it successful. |
| Save/restore blocked | Resolve protected cleanup, archive limits or space admission. Actual evidence must not be deleted merely to make room. |
