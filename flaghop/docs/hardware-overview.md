# Hardware in Overview

The local hardware layer implements the approved picture-map design in Overview.
It uses the current project's host inventory, computer identity and saved network
checks. Opening it does not scan targets, discover VPNs or connect a tunnel.

- Six approved pictures with silhouette contours: brighter grey on hover/focus,
  purple on selection. Known IP, hostname and OS appear below; unknown fields are omitted.
- Laptop and optional VPN sit beneath the inventory. Layout fits automatically as
  devices arrive; the canvas supports dragging and wheel zoom.
- The VPN picture uses the selected WireGuard/OpenVPN protocol, falling back to
  the project's connector preference. NetworkManager alone does not identify a
  protocol, so the picture says Unknown. A preference is not connection evidence.
- Only saved, matching-revision route checks produce lines. Teal means an observed
  route; blue joins laptop/VPN when a matching VPN route was recorded. These are
  historical observations, not proof of a current connection or a physical cable.
  A later failed check suppresses its earlier successful route.
- Click or keys 1–9 select one device. Numbers stay reserved when devices disappear.
  Zero clears selection and refits the map. Double-click opens existing host details;
  backtick/right-click opens its keyboard-accessible menu.
- Q/W/E navigate Hardware, the existing Services view and Files. Editing fields,
  menus and dialogs retain their keyboard input. The results panel is resizable.

The right panel shows the selected host context, an empty collapsible Cyber Kill
Chain section above Hash/Cipher, and the workspace reader's Working/History controls.
The kill-chain section has no action source or runner yet. Reader results remain project-scoped; they are not
silently filtered by device without a verified provenance association. Full action
cards, observed intermediate hops and terminal integration remain separate work. The previous evidence graph is still available through search.

This checkpoint adds the first selected-device
Deep scan slice. With a device selected its Run action follows the reader groups;
otherwise a Deep scan folder lists devices below Working and above History.
Scan jobs/results are filtered by the selected device. Profile import updates
service inventory and shows role hypotheses, candidates and reproduced findings
without promoting them to physical identity or inventing topology links. Reader
results keep their existing project scope. Live guarded acceptance passed against owned fixtures;
see [scanner integration](scanner-integration.md).

`tests/desktop/hardware_smoke.py` checks the actual WebEngine rendering, masks,
hover/selected colours, asset loading, shortcuts, resizing and project isolation on
both API stacks. It uses synthetic inventory and saved observations without probes.

The subsequent panel/label refinement passed 55 React tests, schema/type/bundle
checks and 16 hardware desktop checks per transport. The unknown-type fallback
does not initiate VPN discovery or add connection lines.

Initial local verification on 31 October 2026: 53 React tests, 505 Python tests,
Black/flake8 and schema/type/bundle checks passed. The existing workspace suite
passed 66 checks per transport; the hardware suite passed 13 per transport, with
no JavaScript errors. Original artwork hashes and all six native contour sizes
were checked against the approved local assets.
