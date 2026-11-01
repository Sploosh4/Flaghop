# Legion CTF workflow decisions

## 31 October 2026 — user decisions

- Combine the custom Legion GUI/map, device profiler, Ciphey/file watcher,
  filesystem explorer/editor and Metasploit in the basic integrated workflow.
- Support contextual actions on individual mapped devices and a bottom command
  bar for actions across selected targets.
- **Deferred: authenticated web investigation.** Revisit after the basic
  integrated workflow is implemented. This covers login/session/cookie/token
  handling and investigation of authenticated application views. Unauthenticated
  web reconnaissance remains part of the reconnaissance discussion.
- **Agreed: credential and hash workflows**, including source attribution and
  recording validation outcomes.
- **Agreed: distinct execution and success outcomes**, rather than a single
  success flag for process completion, checks, sessions and privilege changes.
- Privilege-escalation interpretation and reachability/pivoting are being
  explained; their detailed implementation scope has not yet been agreed.

This records scope decisions, not implementation completion.
