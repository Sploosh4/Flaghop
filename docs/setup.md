# Setup

Follow the installation and development commands in [README](../README.md).
Keep dedicated environments, caches and temporary outputs within the mounted
project storage cap. External scanner executables must be available on PATH;
missing tools and incomplete results remain visible.

## Project network

In **Project setup → Network settings**:

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

Local/direct mode can leave profile identity blank, but the target route must
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

Jobs capture their original project, configuration ID and revision. They recheck
scope, profile, routes and required services before starting and monitor changes
during execution. Scope/profile failures hold work; path changes interrupt it.
There is no unrestricted fallback. External tools started independently need an
integration/wrapper; reading the settings API does not constrain their traffic.

## Cipher and password readers

Install/configure the separate shared-reader service and its Cipher/Hash engines.
FlagHop does not install or launch them. From that service's directory, enroll
the app's project-hub catalog using its launcher:

```sh
./run.sh watch --root /path/to/legacy-projects \
  --projects-catalog /path/to/app-config/project-hub.json
```

`--projects-catalog` is repeatable. It enrolls managed stable project IDs and
their actual folders, including custom save locations. Use the catalog belonging
to the running app. Do not create a reader process for every workspace.

The worker publishes `.reader-state/worker-status.json` with the matching Hub
project ID and a fresh heartbeat. Missing/stale registration disables Start;
Stop remains available. New projects start paused. Project/view changes do not
resume processing; Stop requests a pause at the next bounded step, preserving
queues and results rather than confirming immediate termination.

Working/History come from `reader-report.json`, the password queue and saved
artifacts. Dismiss retains result bytes/provenance. Internal metadata and
database/wordlist-only candidates do not become new discoveries. Deep scan jobs
have separate controls; reader Start/Stop does not control them.

Files and Text Editor use independent native windows or browser tabs. Original
files remain unchanged; text edits are browser drafts, and binary/incomplete
results are read-only previews. Reader results stay project-scoped until a
verified source association permits device filtering. SSH browsing remains in
the separate workbench.

## API and checks

Use `/docs`, `/openapi.json` and generated frontend types for current HTTP
contracts. Project routes use `/api/hub/projects/{id}`; IDs resolve independently
of the currently selected workspace.

| Route suffix | Use |
| --- | --- |
| `GET/PUT /network` | Read/update settings; PUT supplies `expected_revision` and `settings` |
| `POST /network/check` | Explicit target check, with optional TCP port |
| `GET /background` | Reader readiness, requested state, Working and History |
| `POST /background/control` | Strict JSON `{"running": true}` or `{"running": false}` |
| `POST /background/alerts/{alert_id}/dismiss` | Dismiss while retaining evidence |
| `GET /background/results/{alert_id}` | Bounded saved result and provenance |
| `GET /filesystem`, `GET /editor` | Project-scoped files and independent editor |
| `GET/POST /deep-scans` | List scans or request a guarded selected-device scan |

Native desktop fixtures run against FastAPI with isolated project data; for
example `tests/desktop/workspace_smoke.py` and `hardware_smoke.py`. They must not
probe connected targets. Run relevant fixtures with `QT_QPA_PLATFORM=offscreen`
and the existing project Python environment.

Privileged network acceptance is opt-in and separate from ordinary checks.
`tests/desktop/network_tunnels.py` requires isolated network/mount namespaces
and creates/removes owned WireGuard/OpenVPN peers and listeners. It must not
run directly in the host network namespace. From the repository root:

```sh
pkexec env PYTHONDONTWRITEBYTECODE=1 unshare --mount --net --propagation private -- \
  "$PWD/.venv/bin/python" "$PWD/tests/desktop/network_tunnels.py"
```
