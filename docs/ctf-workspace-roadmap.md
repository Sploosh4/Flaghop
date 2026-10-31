# FlagHop CTF workspace roadmap

Reviewed 31 October 2026. FlagHop is the app being developed in [Sploosh4/Flagmap](https://github.com/Sploosh4/Flagmap), a CTF-focused Legion fork. The [delivery status](project-status.md) separates published code, verified local additions and separate tools. Checked local-development items below are not included in this documentation-only publication.

The goal is one workspace for device mapping, reconnaissance, commands, Metasploit and file investigation. The website replacement comes later.

## Delivery checklist

- [x] Published: desktop/browser workspace, local scans/tools, inventory, evidence graph, jobs, approvals and history.
- [x] Published: React/FastAPI workspace/activity panels and retained compatibility views.
- [x] Local development: FlagHop branding and configurable project folders.
- [x] Local development: project-specific reader Start/Pause, readiness, real Working/results and persistent dismissal.
- [x] Local development: project file browser and tabbed editor, preserving original evidence.
- [ ] Finish the separate scanner's repeatability and final evidence review.
- [ ] Finish and verify shared network settings, scope/exclusions and OpenVPN/WireGuard route enforcement in the separate checkout.
- [ ] Review and publish a coherent implementation checkpoint for the local additions.
- [ ] Implement the reviewed topology map, classifier/profile wiring, contextual actions and bulk command bar.
- [ ] Connect scanner jobs/results to the app's evidence and map.
- [ ] Build the full action panel/terminal and unified Metasploit job/session workflow.
- [ ] Map authenticated remote sessions into main Files; add source/version navigation and durable edited-copy saving.
- [ ] Package the reader setup and verify fresh installation and recovery.
- [ ] Revisit unified website targets after the basic integrated workflow.

## Map and reconnaissance

The existing evidence graph is not the planned topology map. Show the user's laptop/VPN, targets and observed intermediate hops without inventing physical connections. Preserve unknown hops and evidence age/source. Reachability, an exposed service and a confirmed network hop are different observations.

The reviewed picture/contour design is ready for implementation. Device artwork stays neutral; purple follows the selected picture's silhouette and filters its action panel. Connection colours represent connection types, with categories/colours still to settle. Device images alone do not establish identity or security capability.

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

Implemented: installer buttons and persisted per-project connector selection. Profile discovery, connect/disconnect controls and the diagnostics above remain planned work. Do not start checks simply by opening a project or changing its connector.

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

1. Close scanner repeatability/final review and real network/tunnel verification.
2. Review and publish the locally verified reader/files implementation checkpoint.
3. Demonstrate one selected target → scanner job → profile/map evidence → saved result in the editor.
4. Add the full action panel/terminal, Metasploit jobs and remote session mapping.
5. Package setup and test fresh installation, interruption/recovery and representative CTF exercises.
6. Agree the smaller website replacement after the basic workflow works.

There are no delivery dates or work-hours estimates. Evaluate useful leads, irrelevant suggestions, traceability and interruption recovery. The intended benefit is less repeated work and less switching between tools; that benefit still needs representative testing.
