# Project network settings

Each saved project has a shared network configuration in **Project setup → Network settings**. Opening these settings reads saved data only. **Check saved network** explicitly checks a target; automatic commands repeat their own checks before starting. Network diagnostics stay in Settings, not on the device map.

## Configure a project

1. Choose the project's Connector: NetworkManager, OpenVPN or WireGuard.
2. Enter the event/lab name and the source of its scope, such as the organiser's instructions.
3. Enter allowed IPs, IPv4/IPv6 CIDRs or exact hostnames, and any exclusions. Exclusions win. Optional allowed ports restrict TCP/UDP traffic across that scope.
4. Select local/direct, OpenVPN or WireGuard mode, the expected interface and, for a VPN, its profile identity.
5. Optionally list required TCP services as `hostname:port` or `IP:port`. These must be verified before a dependent command starts. A timeout is not reported as proof that the host is down.
6. Save, then check a target. Saving does not connect a tunnel, change routes or start reconnaissance.

Profile identities depend on the connector:

| Connector | Identity |
| --- | --- |
| NetworkManager | Active connection UUID on the selected interface. |
| OpenVPN | Absolute configuration path matching a running client with an explicit tunnel device. The process and configuration digest are checked again during execution. |
| WireGuard | Expected peer public key on the selected interface. This is not a private key. |

Local/direct mode can leave the profile identity blank. The interface still has to match the target route. A connected interface's own subnet does not establish the event's allowed targets.

For ranges, preflight route checks inspect the boundary addresses; the per-packet egress restriction applies to every destination. A subnet job overlapping an exclusion is held in its entirety; use non-overlapping targets. The runner does not silently turn that request into a different scan.

## Execution and enforcement

The shared backend stores a configuration ID/revision per project, and exposes it through:

- `GET /api/hub/projects/{id}/network`
- `PUT /api/hub/projects/{id}/network` with `expected_revision` and `settings`
- `POST /api/hub/projects/{id}/network/check` with `target` and optional TCP `port`

Updates reject stale revisions instead of overwriting newer edits. Preferences live in the existing project-hub catalog; restored or newly copied projects without a network configuration remain unconfigured and cannot start network work.

Network jobs capture their project reference when queued. The common command boundary checks the original project, current scope, exclusions, profile, interface/source route and required services before spawning. Parallel scheduler work inherits the same context. Queued work revalidates against the latest revision of its original project; a project switch cannot retarget a job to another event with overlapping private addresses.

On Linux, the runner installs a private nftables table for a unique command GID. It restricts that group's outbound traffic to the checked interface index, source addresses, allowed destinations and ports. Exclusions are applied first. Subprocesses and descendants run with that GID, cleared supplementary groups, no capabilities and no new privileges. Checked hostname mappings are pinned in a private mount namespace's `/etc/hosts`; the host's file is unchanged. Custom resolvers cannot send to destinations outside the egress policy.

The runner refreshes connection/interface/route checks while a command runs. A changed configuration, profile, source or path interrupts it. Per-command rules also block fallback packets while that change is being detected. Each process stores its project/configuration reference, validated settings and observation in the SQLite workspace; its output API exposes `network_context`, retained after save/reopen. Completed, failed and interrupted commands retain their evidence; held jobs have a distinct `held` status. Offline file jobs do not require a configured network.

Only this command group's traffic is affected. Cleanup stops any remaining processes with its private GID before removing its table. If cleanup cannot establish that the children stopped, it retains the restriction and reports the problem. It never flushes the host ruleset or disconnects an existing VPN.

## Supported modes and requirements

- Linux tools: `ip`, `nft`, `setpriv`, `unshare`, `mount`, `pkill`, `pgrep`; hostname lookup uses `getent`. OpenVPN/WireGuard/NetworkManager are required for their respective modes.
- Installing OpenVPN/WireGuard clients is separate from configuring or connecting a profile. The Setup buttons use the existing targeted installer.
- Creating the egress restriction, private GID and mount namespace requires local administrator access: an administrator-launched app, or an existing noninteractive sudo authorization. If it is unavailable, commands are held. No command is launched as an unrestricted fallback.
- WireGuard requires a nonzero transport fwmark already configured on the selected interface. The policy permits only marked encrypted UDP traffic to the observed peer endpoints through their checked transport interfaces. Commands have no capability to forge that mark. The app does not change an existing profile's mark or routing design.
- OpenVPN is supported through a userspace `tun` device. DCO devices are held pending a separate enforced adapter; use a profile configured with `disable-dco` for this runner.
- Nmap TCP connect scanning is supported. Explicit raw-socket Nmap modes and passive capture are held; other tools that require elevated capabilities fail explicitly. NetworkManager profile discovery/import, connect/disconnect controls, remote runners, separate callback verification and optional traceroute remain future work.
- This controls app-managed local commands. Independently launched external tools need their own wrapper/integration; the read API alone does not enforce their traffic.

## Verification

Unit and UI fixtures cover scope/exclusion precedence, settings revisions, project isolation, route changes, no-response reporting, missing enforcement, job references and the common runner boundary. They do not scan a connected network.

`tests/desktop/network_tunnels.py` exercises real WireGuard and OpenVPN tunnels plus Nmap through the common process runner. It refuses to run in the host's network or mount namespace. It creates an isolated local peer, ephemeral keys/certificates, private routes and test listeners, checks permitted traffic and blocked destinations/ports/fallback, then removes its fixtures. Private keys remain in the capped project and are deleted; the test uses a private bind mount at WireGuard's supported config location without changing the host's configuration.

Run from the checkout with an administrator-authentication dialog:

```bash
pkexec env PYTHONDONTWRITEBYTECODE=1 unshare --mount --net --propagation private -- \
  "$PWD/.venv/bin/python" "$PWD/tests/desktop/network_tunnels.py"
```
