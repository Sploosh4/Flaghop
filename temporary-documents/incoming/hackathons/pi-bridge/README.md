# Pi bridge for Codex

## Tool activity monitor

`pi-observe watch AGENT_ID --since 30m` shows live tool calls, outcomes, reported
durations, slow calls, failure excerpts, repeated commands, and model usage.
`pi-observe scanner /path/to/device-profile.json` separately shows scanner-task
execution and parsing outcomes. It reads existing evidence without restarting
or controlling agents. See [observability commands and semantics](../../../../hackathons/pi-bridge/OBSERVABILITY.md).

A local MCP stdio server that controls independent Pi agents through Pi's supported
JSONL RPC interface. It needs Python 3.10+ and your installed Pi. There are no third
party Python dependencies, listening network ports, T3 processes, or copied T3 code.

Each agent uses `openrouter/deepseek/deepseek-v4.1-flash-1017` at **max** thinking.
Before sending a prompt, the bridge checks the model Pi actually loaded and requires
`compat.openRouterRouting.only = ["wafer"]` and `allow_fallbacks = false`.
Pi reads its existing credentials from `~/.pi/agent`; the bridge does not copy the key.

## Tools

| Tool | Purpose |
| --- | --- |
| `pi_start_agent` | Start in an explicit absolute `cwd` and send an initial `message`. |
| `pi_send_message` | Send a follow-up by `agent_id`; busy agents queue it. |
| `pi_get_agent` | Read recent replies, errors and status; optionally `wait_seconds: 0..50`. |
| `pi_list_agents` | Find saved agent IDs and statuses without model calls. |
| `pi_stop_agent` | End a running process while keeping its saved conversation. |

Start/send return acceptance, which is different from completion. Wait for `completed`
and inspect the reply; provider errors return `failed`. A wait deadline leaves work
running. Pi's `agent_settled` event determines completion, including automatic retries
and queued follow-ups. Text returned to Codex is capped at 16,000 characters per
message and the latest 12 user/assistant messages. Full history remains in Pi's session.

Agents normally have Pi's local read/edit/write/bash tools and load project context.
They run as your Linux user; a working directory is not a sandbox. Use `tool_mode:
"none"` for a conversation without executable tools. Discovered extensions and MCP
servers are disabled to keep the bridge independent and avoid interactive dialogs.
Up to eight agent processes can run in one connection. Agents are started only by
tool calls; there is no background service.

Agent metadata and native Pi sessions are stored with owner-only permissions under
`~/.local/state/pi-bridge`. The bridge stops its child processes when Codex closes the
MCP connection. A later `pi_send_message` resumes the saved session. File locks prevent
two Codex connections from controlling the same live agent; stop it in its owning
connection before resuming elsewhere. This bridge does not attach to an independently
opened Pi terminal or import T3 conversations.

## Install or reconnect

```bash
codex mcp add pi_agents -- /usr/bin/python3 /home/joshua/Documents/ChatGPT/Hackathons/pi-bridge/bridge.py
codex mcp get pi_agents
```

Restart the MCP connection in Codex settings if the tools are not visible in an
already-open chat. Example request: "Start a Pi agent in /path/to/project to review
the README, then show me its reply."

Remove the connection with `codex mcp remove pi_agents`. Source and saved Pi sessions
are retained. Restore ordinary Pi defaults through `~/.pi/agent/settings.json`;
the bridge explicitly selects this DeepSeek model and max thinking.

## Verify without API charges

```bash
cd /home/joshua/Documents/ChatGPT/Hackathons/pi-bridge
python3 -m unittest discover -s tests -v
```

Tests use a fake Pi RPC process to exercise streaming completion, queued follow-ups,
provider failures, process exits, shutdown, saved-session resumption, routing checks,
exclusive session access, and MCP discovery/tool calls. They never read your API key
or send model requests.
