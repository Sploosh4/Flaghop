# FlagHop UX/UI specification

Status: working specification. Agreed requirements describe intended behaviour;
they do not claim that behaviour is implemented. Discuss existing behaviour one
item at a time with Joshua before treating it as intended design.

## Working method

Work through the written specification first. Review it in rounds, then represent
the agreed design in the existing Figma file, review the visual result, and update
the written specification when decisions change. Open questions remain explicit;
no proposed category or action gains approval merely by appearing in this file.

Design destination: [FlagHop — UX Specification & Design](https://www.figma.com/design/LWCW4k3IdiQWJMoMPoX5Um).

Use the [Atlassian PRD template](https://www.atlassian.com/software/confluence/templates/product-requirements)
for purpose, requirements and questions, supplemented with layer visibility,
relationship and interaction tables. [NN/g's design-spec guidance](https://www.nngroup.com/articles/creating-design-specs-for-development/)
provides a practical handoff checklist. This is a tailored working format, not a
claim of compliance with an external standard.

## First layer: purpose and agreed behaviour

Help the investigator understand known targets and choose what to investigate
next. Use the word **layer**, rather than map view.

| Topic | Agreed behaviour | Implementation status |
| --- | --- | --- |
| Appearance | An item appears as soon as its existence is known. Hostname, IP and OS are not prerequisites. | Requires verification/design |
| Progressive detail | Fill in known hostname, IP address and OS name as information becomes available; exclude OS versions. | Partial in current host model |
| Unknown identity | An item can initially have none of those labels. Its existence can still be represented. | Requires design; do not invent addresses or names |
| Discovery time | Do not display when an item was discovered on this layer. Future details location is undecided. | Intended display rule |
| Relationships | Show that items are related. Relationship colour may distinguish the kind of relationship; palette and exact mappings remain open. | Current model has route/VPN links only |
| Strength | Do not encode relationship strength or confidence through line style in this build. | Deferred/removed proposal |
| Link interactions | Hovering and selecting links are deferred. | Current route lines have title tooltips; removal requires implementation work |
| Investigator computer | Always present. Support laptop and desktop variants. | Current model always uses laptop artwork |
| Connection picture | A custom composite illustration shows the computer beside a connected network element, in one picture. Provide laptop and desktop variants. | Agreed concept; artwork not yet created |
| Vocabulary | Network connection describes how the project reaches targets. Connector describes its configured mechanism. Avoid assuming it is always a VPN. | Agreed vocabulary; existing model still uses VPN |

The composite artwork does not decide whether its regions have separate controls
or which parts open network settings. That remains a question for discussion.

## Details to settle one at a time

1. Exact item types visible on the first layer: devices, networks, applications,
   services and identity systems. Existing artwork is not approval of visibility.
2. Network rectangles, overlapping membership and multiple interfaces.
3. Relationship definitions and colours, including hosting, communication,
   membership and routes. A route must not imply a physical cable or invented hop.
4. Unknown-item artwork, later identification and duplicate/identity resolution.
5. Composite computer/connection controls and connection status.
6. Placement of actions, running work, results and later details.
7. Empty/loading/error states, crowded layouts, keyboard behaviour and accessibility.

## Per-layer specification template

- Purpose and user questions.
- Visible item types and the evidence that makes each appear.
- Labels and progressive updates; unknown, conflicting and missing information.
- Relationship meanings, permitted endpoints and visual rules.
- Selection, actions, keyboard controls and navigation.
- Layout, artwork and visual examples.
- Empty/loading/error/crowded states and accessibility.
- Concrete acceptance scenarios, existing behaviour to confirm, and open questions.

## Initial acceptance scenarios

- A newly known item with no hostname/IP/OS still appears. Later information
  fills the agreed labels without requiring the user to rediscover the item.
- Discovery timestamps are absent from the first layer.
- The investigator computer remains visible in an empty project.
- Laptop and desktop composite pictures both include the network element.
- A local-network connector is representable without being labelled as a VPN.
- Link strength and link hover/selection are not required for this build.
