# Planned CTF workspace

The plan for Sploosh4's Legion fork. Checked items are working; unchecked items are still to build. Suggestions and open questions are listed below.

Legion should let you map devices, run commands, use Metasploit and inspect files and websites in the same app.

## Roadmap

- [x] Desktop workspace, scans, evidence graph, jobs and approvals.
- [x] Backend cleanup and React/FastAPI workspace/activity panels.
- [ ] OpenVPN, WireGuard and local/direct network connections, with connection and target reachability checks in Settings.
- [x] Shared local project network configuration and common checks before automatic network jobs run; see [supported modes](project-network-settings.md).
- [ ] Device map with coloured connection types and commands launched from selected devices.
- [ ] Metasploit integration and a right-hand action/results panel.
- [ ] File-watcher/decoder integration, found-file notifications and user-run hash jobs.
- [ ] File browser and text editor.
- [ ] A unified workflow for website targets and web tools.

## What to build

### Initial reconnaissance and a visible map

- Run initial reconnaissance automatically and add discoveries about the selected targets to the map.
- Show the user's laptop, discovered devices and the links between them. Include an intermediate router or firewall when it has been observed.
- Use different link colours for different connections, with a legend. The categories and colours are still undecided.
- Use the approved device illustrations. Choose an image from the evidence about the device; the artwork alone doesn't establish its identity or NGFW capabilities.

### Connectors and target reachability in Settings

Agreed 31 October 2026. Keep connection diagnostics and per-target route/reachability checks in Settings, not on the map.

- Support OpenVPN profiles, WireGuard profiles and local/direct access over Ethernet, Wi-Fi and virtual lab networks. Local access without a VPN is an intentional mode, not a connection error.
- Each project's Project setup has a **Connector** dropdown with exactly **NetworkManager**, **OpenVPN** and **WireGuard**. This selects the connection manager/client; profile selection and local/direct mode are separate settings. NetworkManager can manage OpenVPN, WireGuard and local interfaces.
- Computer Setup has **Install OpenVPN** and **Install WireGuard** buttons beside the default VPN controls. Queue only the selected tool through the existing installer and show its outcome. Installing a client or choosing a connector does not connect a tunnel.
- Keep a selected project connector separate from its connection profile and from live connection status. Preserve compatibility with existing default/None VPN preferences until the profile controls are implemented.
- Detect NetworkManager-managed profiles and externally managed OpenVPN/WireGuard interfaces. Show ownership; do not start duplicate tunnels or disconnect external clients automatically.
- Inspect OpenVPN session state; for WireGuard distinguish interface configuration from peer handshake/traffic observations. An idle peer's old handshake alone does not establish failure. A connected tunnel does not prove target access.
- For each selected target, resolve its hostname if needed, then ask the OS for the selected interface, source IP and next-hop gateway. On Linux use a structured route lookup such as `ip -j route get`, matching the tool's execution environment and any relevant routing policy. Compare the selected path with the project's expected connection. A default route's existence alone does not establish a usable lab route.
- Check a bounded number of probes to the selected target: ICMP where appropriate and TCP connections to supplied or known service ports. Keep route selection, observed responses and application/service availability as separate results. No ping reply or a timeout means no response observed, not proof that the host is down. Treat a refused connection as a rejection response, not an available service.
- Optional **Trace route** reports observed intermediate hops; unanswered hops remain unknown. Tunnels and filtering can hide routers, and tracing does not establish a complete physical path or the return path.
- Record target/address, connector, execution environment, interface/source/gateway, probe method/port, result, reason and check time. Mark prior results as needing a recheck after VPN/routing changes, session loss, IP reuse or target resets, retaining history.
- Check callback/listener reachability separately when a workflow needs it. Outbound access to a target service does not prove that the target can connect back.

Implemented: installer buttons, persisted connector selection, shared Network settings, explicit target checks and guarded local command execution. Automatic profile discovery, connect/disconnect controls and optional traceroute remain planned work. Opening a project or changing its connector does not connect or probe a network.

### Shared project network configuration

Agreed 31 October 2026. Implemented for app-managed local commands in the connector-settings checkout: one network configuration per project, **Project setup → Network settings**, a shared read API, job references, scope/profile/route/service checks and Linux egress restrictions. See [setup, supported modes and tests](project-network-settings.md). Remote execution, callback verification and optional traceroute remain future work. Connection and per-target diagnostics stay in Settings, not on the map.

| Setting | Purpose |
| --- | --- |
| Network name and scope source | Identify the hackathon/lab and record the organiser's supplied scope or the user's explicit configuration. |
| Allowed targets | Explicit IPv4/IPv6 addresses, CIDR ranges, hostnames or challenge endpoints, with port/protocol limits where supplied. Do not assume the event occupies one subnet. |
| Exclusions | Addresses, ranges or endpoints that must not be targeted; exclusions take precedence over inclusions. |
| Connection mode and profile | Local/direct access or a specific OpenVPN/WireGuard profile, together with the project's Connector choice. Use a stable profile identifier; an interface name such as `tun0` alone does not identify the event. |
| Execution environment | Identify where tools run: initially the local runner, with an explicit environment/session reference when other runners are supported. |
| Network identity | Project ID, network-configuration ID and revision, so jobs and tools share the same configuration without accidentally using another project's current settings. |

Keep configured target scope separate from observed state: interfaces, source addresses, gateway/routes, tunnel/peer state and per-target reachability results with timestamps. A VPN route, WireGuard AllowedIPs, an attached interface subnet or a discovered host does not grant target scope. The VPN client's own address/subnet can differ from the challenge target ranges.

Expose the project network configuration and its observed state through one shared backend service and a read API for tool integrations. Pass the project/network IDs and configuration revision to each job. Tools must not derive the event network independently from the default interface, scan history or a global active-project setting. Do not expose VPN private keys or passwords in the shared context or job metadata.

Before initial reconnaissance, scheduler follow-ups, retries, subnet expansion or any other app-managed automatic network action, the common runner must:

1. Load the job's project network configuration. Hold network work if it is missing or incomplete; local file analysis can continue without network access.
2. Validate every intended destination against inclusions and exclusions. Resolve hostnames in the execution environment and check the actual destination addresses; new discoveries, redirects and expanded targets must pass the same scope checks before being contacted.
3. Verify the selected connection/profile is available in that execution environment, and check the OS route, source address and interface for each destination against that connection. Local/direct mode must match its selected network too.
4. Refresh stale observations immediately before execution. Hold the job if the scope, profile or route no longer matches; show the reason in Settings and job history. Do not silently fall back to another network, switch VPNs or rewrite routes.
5. Run the bounded reachability/service checks needed by the action. A route match and an allowed target are mandatory; a ping timeout alone does not establish failure. If a required service cannot be verified, record that outcome and hold the dependent action without labelling the host definitively down.
6. Execute through the verified network environment. Metadata or exported environment variables alone do not constrain a subprocess's traffic. Use supported source/interface controls or an isolated network environment as appropriate; choose the enforcement mechanism during implementation and verify that it prevents fallback.

Apply these checks at the common execution boundary, including integrated Metasploit actions and future network adapters, rather than relying on each tool's UI. Validate listener/callback settings separately when required. Independently launched external tools need an explicit integration or wrapper; reading a configuration file alone does not enforce their network use.

Invalidate observations after a configuration edit, VPN disconnect/reconnect, route/interface change, target reset, IP reuse or execution-session loss. Revalidate queued jobs against the new revision before starting. If a running network job loses its verified path, prevent further network steps and cancel or isolate active traffic as supported, preserving output and marking interruption; never silently resume it on a different network. Record the configuration revision, checked destination, execution environment, selected route, check time and decision with each run.

Acceptance uses deterministic fixtures for project isolation, local/direct access, excluded destinations, scope and hostname checks, missing/wrong routes, configuration revisions, held network work and continued offline jobs. Real isolated WireGuard and userspace OpenVPN tests exercise service access, extra-destination/port restrictions, route-change detection and packet-level fallback blocking. Keep this coverage as the remaining adapters are implemented.

### Actions on the right

- Show suggested actions from scan results in a panel on the right.
- Run Metasploit actions through the same panel and job controls.
- Show deciphered content, found files and suspected password hashes that can be queued for cracking.
- Give each action a **Run** button, the tactic and technique where applicable, and enough context to choose it. The full card contents are still undecided.
- Let the user run several actions. Show which are queued or running, and keep them visible until they finish.
- Only remove actions from the active list after completion. Decide where completed, failed and cancelled work goes.

### Incoming files, decoding and hashes

- Notify the user in the same panel when files arrive.
- Show recognised hashes, encodings or ciphers. Always offer **Open**, even when nothing is recognised.
- Try supported decoders and ciphers automatically. Some inputs will remain encrypted or unrecognised, and detection can be wrong.
- Queue suspected password hashes for the user to review and run.
- Keep a file's integrity checksum separate from suspected password hashes found inside it.

### Filesystem and text editor

- Include a file browser and text editor in the workspace.
- Decide whether to browse local files, remote files through active sessions, or both, and how edits relate to original evidence.

### Website targets

- Add website targets and web tools to the same views, with commands, results and evidence kept together.
- Choose which website tools to support first and how much to integrate them.

## What works now

The current app already contains persistent SQLite workspaces, host/service inventory, an evidence graph, tool execution, approval handling, background jobs and execution history. Workspace identity and activity panels have been migrated to React/TypeScript, with their API routes served by FastAPI. Other views still use the compatibility layer; see [the migration notes](../MIGRATION.md).

Web-tool commands and some Metasploit command mappings already exist. The unified website workflow and deeper Metasploit integration described here remain planned work.

The evidence graph exists; the device map is still to build. A discovered host, a reachable service and a confirmed network hop are different observations. Connection-path and reachability diagnostics belong in Settings.

A separate local file-watching prototype combines Watchdog, base64dump and Ciphey. It preserves originals, records source hashes and candidate locations, saves derived files and reports failures or partial processing. It is not integrated into Legion, and there is no working Legion importer for its proposed export. Archive/PDF extraction and general cipher detection are not implemented in that prototype.

The device images have been selected. They still need to be added to Legion and matched to supported device classifications.

## Suggestions

These still need a decision.

| Area | Suggested behaviour |
| --- | --- |
| Map evidence | Keep connection-path and target reachability diagnostics in Settings. Map relationships must still have evidence; supplement colours with labels or line styles. |
| Action cards | Include target, reason for the suggestion, supporting evidence, expected outcome, tool, execution location, prerequisites, impact, progress and access to output. |
| Queue behaviour | Prevent duplicate runs, limit concurrency, offer cancellation, keep failures actionable and retain completed work in searchable history. |
| Panel organisation | Provide views for the selected device, the whole workspace, running work and new files. |
| File attribution | Associate files with their actual collection job/session when known; ask for attribution when it is unknown instead of guessing from filenames. |
| Evidence and editing | Preserve originals, save decoded results and editable copies separately, and retain the link between source and derived content. |
| Analysis limits | Bound automatic processing, report unsupported or partial analysis, and present accepted plaintext as a candidate until verified. |
| Recovery and storage | Preserve useful state across restarts, report interrupted jobs, avoid silently rerunning them, and agree a retention policy for accumulated files. |

## Open questions

1. Does the file browser initially cover workspace files only, or remote machines as well?
2. Should selecting a map node filter the action panel to that device, with a separate whole-workspace view?
3. What input methods and scan depth should initial reconnaissance support? Its target scope and execution network must come from the shared project network configuration.
4. Which relationship categories and colours should the map use?
5. Which action-card fields are essential, and how should actions without a meaningful tactic/technique mapping appear?
6. Where should completed, failed and cancelled actions go, and when may an action be suggested again?
7. Which file types, encodings and cipher families should be supported first? What should a hash action require before it runs?
8. Should the editor cover notes, scripts and other text files, and how should saving or running a script work?
9. Which Metasploit actions and website tools should be integrated first, and what results should their cards show?

## Build order (proposed)

1. Define a useful first reconnaissance result and implement the shared project network settings and runner checks before enabling automatic network workflows.
2. Build the map and action panel using the existing scans, jobs and evidence.
3. Add file notifications and a basic file browser/editor.
4. Add Metasploit, file analysis with processing limits, derived results and user-run hash jobs to the panel.
5. Add website targets and the selected web tools.
6. Try it in representative CTF exercises and fix what gets in the way.

There are no delivery dates yet. Test how long it takes to find a useful lead, how many suggestions are irrelevant, whether results can be traced to their evidence, and what survives an interruption. The goal is less repeated work and less switching between tools; that benefit still needs to be tested.
