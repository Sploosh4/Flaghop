# FlagHop CTF workspace roadmap

Included transport: all HTTP routes, pages, ZIP transfer and WebSockets use FastAPI. The Flask fallback and transport selector are removed; existing project and reader formats are preserved. The separately authorised [architecture improvements](architecture-follow-ups.md) are included in this revision and verified locally.

Reviewed 31 October 2026. FlagHop is the app being developed in [Sploosh4/Flagmap](https://github.com/Sploosh4/Flagmap), a CTF-focused Legion fork. The [delivery status](project-status.md) separates this implementation checkpoint, separate tools and planned work.

The goal is one workspace for device mapping, reconnaissance, commands, Metasploit and file investigation. The website replacement comes later.

## Delivery checklist

- [x] Published: desktop/browser workspace, local scans/tools, inventory, evidence graph, jobs, approvals and history.
- [x] Published: React/FastAPI workspace/activity panels and retained compatibility views.
- [x] FlagHop branding and configurable project folders.
- [x] Project-specific reader Start/Stop, readiness, real Working/results and persistent dismissal; engines remain separate dependencies.
- [x] Included in `master`: Hash/Cipher groups, Working then History, Start/Stop buttons and independent Files/editor windows. Stop remains cooperative; SSH session mapping is pending.
- [x] Included in `master`: empty Cyber Kill Chain group above Hash, larger device shortcut numbers and selected VPN protocol labels. Kill-chain actions and live connection discovery remain separate work.
- [x] Project file browser and tabbed editor, preserving original evidence.
- [x] Shared network settings, scope/exclusions, explicit profile identity and Linux enforcement for app-managed local commands; real isolated WireGuard/userspace OpenVPN acceptance.
- [x] Separate scanner repeatability/evidence reviewed; Chrome ELF/WPScan implementation fingerprints remain a documented limitation.
- [ ] Add automatic profile discovery/import/connect/disconnect and separately enforced privileged/remote adapters.
- [x] Local development: picture-based Hardware layer in Overview, selection contours, inventory/observed routes, shortcuts and a resizable results panel.
- [x] Local scanner/classifier profiles, service inventory, role hypotheses, candidate/reproduced findings and saved evidence.
- [ ] Observed intermediate hops, the full contextual action panel and bulk command bar.
- [x] Local selected-device scanner jobs/results connected to inventory, History and evidence reopening; real guarded fixture passed.
- [ ] Build the full action panel/terminal and unified Metasploit job/session workflow.
- [ ] Map authenticated remote sessions into main Files; add source/version navigation and durable edited-copy saving.
- [ ] Package the reader setup and verify fresh installation and recovery.
- [ ] Revisit unified website targets after the basic integrated workflow.

## Map and reconnaissance

This checkpoint connects selected-device Deep scan jobs
to guarded execution, profile import, service/role/finding views and saved evidence.
Synthetic app/desktop checks and real guarded owned-fixture acceptance pass.
The known implementation-fingerprint gaps remain documented.

The existing evidence graph is not the planned topology map. Show the user's laptop/VPN, targets and observed intermediate hops without inventing physical connections. Preserve unknown hops and evidence age/source. Reachability, an exposed service and a confirmed network hop are different observations.

The picture/contour hardware design is included in `master` (merged from `codex/hardware-overview` on 31 October 2026).
Device artwork stays neutral; a light-grey silhouette contour marks hover and
purple marks selection. The selected host appears in the results panel; full
target-filtered action cards remain planned. Saved route observations are drawn
without inventing physical links. Broader connection categories/colours remain
to settle. Device images alone do not establish identity or security capability.

Planned navigation includes Devices/Services/Files layers, stable device/action shortcuts, context menus and a bulk command bar. Protect terminal/editor typing from global shortcuts and define overflow behaviour before implementing it.

The separate profiler supplies ranked device-role hypotheses with evidence, alternatives and uncertainty. Its rule strength is not calibrated probability. Connect its output through an explicit job/profile contract rather than assuming a completed scan has updated the app.

## Connectors and target reachability in Settings

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

Agreed 31 October 2026. Implemented for app-managed local commands in the app: one network configuration per project, **Project setup → Network settings**, a shared read API, job references, scope/profile/route/service checks and Linux egress restrictions. See [setup, supported modes and tests](project-network-settings.md). Remote execution, callback verification and optional traceroute remain future work. Connection and per-target diagnostics stay in Settings, not on the map.

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

## Actions, terminal and Metasploit

Use one selected-target/stage-filtered action panel with Run, applicability, explanation, output and queue state. Laptop/VPN selection is not a CTF target filter. Keep actions readable while queued/running. Completed output goes to History; failures/interruption return with a reason. Final running-card placement and completed Deep scan presentation remain open.

Known terminal commands may provide structured observations; arbitrary terminal output must not be treated as parsed evidence. Integrate Metasploit through the shared jobs and outcome contracts. Existing profile import only moves inventory and a profile note into Metasploit; it does not implement module/session actions.

Keep execution completion, reproduced findings, sessions and privilege changes separate. Detailed pivoting and privilege-escalation interpretation remain unagreed.

## Files, decoding and password recovery

The local development app already connects to the shared cipher/password reader through stable project IDs. Real A/B acceptance covered pausing A while B decoded and recovered a synthetic password, retained pending work, result opening, dismissal and source integrity. See [workspace readers](background-workspaces.md).

The engines/service remain separate dependencies. They support bounded processing and preserve ambiguous hash formats and unresolved content. Supported archive/encoding layers do not establish arbitrary file-format or cipher coverage. Accepted plaintext remains a candidate until verified.

Main Files currently covers local project files and saved results. Remote SSH browsing/collection works separately with explicit authentication and verified host identity. Add project/session/target mapping, clickable source/version navigation and durable edited-copy saving. Current text edits stay in browser drafts.

Decide the brief automatic recovery versus user-run deeper policy, resource/time limits and retention. Keep source/result links, originals and derived content separate. An integrity checksum is not automatically a password hash or proof of authenticity.

## Network settings

VPN Setup is actively implementing shared project configuration, targets/exclusions, profile selection and checks at the common execution boundary in `codex/connector-settings`. OpenVPN/WireGuard installation does not prove correct tunnel routing. Complete real local tunnel tests, job/Settings wiring and integration before claiming enforcement in the main app.

Define behaviour for intentional no-VPN events, missing/disconnected profiles, split routes and network changes. Settings diagnostics must distinguish a saved preference from an observed connection.

## Deferred scope

Authenticated web investigation comes after the basic integrated workflow: login sessions, cookies, tokens and authenticated views are deferred. The smaller unified website replacement is also a later phase. Unauthenticated web reconnaissance remains in the separate scanner; the old main-app web/screenshot suite has been removed.

## Decisions and proposed build order

[Requests and open questions](requirements-and-questions.md) owns the detailed choices: map relationships/staleness, action metadata, stage/shortcut overflow, applicability, cancellation/concurrency, editor/session docking, recovery limits, retention and first Metasploit functions. Treat suggestions there as proposals until agreed.

1. Completed: scanner repeatability review and the defined local network/tunnel acceptance.
2. Completed: reader/files implementation checkpoint.
3. Completed: selected target → guarded scanner job → inventory/findings → saved evidence reopening. Broader topology remains planned.
4. Add the full action panel/terminal, Metasploit jobs and remote session mapping.
5. Package setup and test fresh installation, interruption/recovery and representative CTF exercises.
6. Agree the smaller website replacement after the basic workflow works.

There are no delivery dates or work-hours estimates. Evaluate useful leads, irrelevant suggestions, traceability and interruption recovery. The intended benefit is less repeated work and less switching between tools; that benefit still needs representative testing.
