#!/usr/bin/env python3
"""Local MCP stdio bridge to independent Pi RPC sessions. Python stdlib only."""
from __future__ import annotations

import argparse
import asyncio
from collections import deque
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import signal
import sys
import tempfile
import uuid

MODEL = "deepseek/deepseek-v4.1-flash-1017"
PROVIDER = "openrouter"
ROUTING = {"only": ["wafer"], "allow_fallbacks": False}
INSTRUCTIONS = (
    "Delegate to Pi only when the user authorizes agent work. Start an agent in an "
    "explicit absolute working directory; it uses DeepSeek V4.1 Flash 1017, max "
    "thinking, and Wafer only with no fallbacks. Start/send acknowledge acceptance, "
    "not completion. Use pi_get_agent to wait and inspect status, reply, and errors. "
    "Reuse an agent_id for follow-ups. Agents have normal local Pi file/shell access "
    "unless tool_mode=none. Stop unused agents. No T3 Code is used."
)


def now():
    return datetime.now(timezone.utc).isoformat()


def atomic_json(path, value):
    fd, temporary = tempfile.mkstemp(prefix=".update-", dir=path.parent)
    try:
        with os.fdopen(fd, "w") as output:
            json.dump(value, output, ensure_ascii=False, indent=2)
            output.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def summarize(message):
    if message.get("role") not in ("user", "assistant"):
        return None
    content = message.get("content", "")
    text = content if isinstance(content, str) else "".join(
        block.get("text", "") for block in content if block.get("type") == "text"
    )
    result = {"role": message["role"], "text": text[:16000]}
    if len(text) > 16000:
        result["truncated"] = True
    for key in ("responseId", "stopReason", "errorMessage", "usage"):
        if key in message:
            result[key] = message[key]
    return result


class Agent:
    def __init__(self, bridge, data):
        self.bridge = bridge
        self.data = data
        self.directory = bridge.root / data["agent_id"]
        self.process = None
        self.lockfile = None
        self.reader = self.stderr_reader = None
        self.pending = {}
        self.idle = asyncio.Event()
        self.idle.set()
        self.operation = asyncio.Lock()
        self.diagnostics = deque(maxlen=8)
        self.last_assistant = None
        self.stopping = False

    def save(self):
        self.data["updated_at"] = now()
        atomic_json(self.directory / "agent.json", self.data)

    def snapshot(self):
        return dict(self.data)

    async def launch(self):
        self.lockfile = (self.directory / "lock").open("a")
        try:
            fcntl.flock(self.lockfile, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            self.lockfile.close()
            self.lockfile = None
            raise ValueError("Agent is active in another Codex connection; stop it there first.")
        self.stopping = False
        args = [str(self.bridge.pi), "--mode", "rpc", "--provider", PROVIDER,
                "--model", MODEL, "--thinking", "max", "--no-extensions", "--no-mcp"]
        if self.data["tool_mode"] == "none":
            args.append("--no-tools")
        session = self.data.get("session_file")
        if session and Path(session).is_file():
            args += ["--session", session]
        else:
            args += ["--session-dir", str(self.directory / "sessions")]
        env = os.environ.copy()
        env["PI_CODING_AGENT_DIR"] = str(self.bridge.agent_dir)
        try:
            self.process = await asyncio.create_subprocess_exec(
                *args, cwd=self.data["cwd"], env=env, start_new_session=True,
                stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE, limit=16 * 1024 * 1024,
            )
            self.reader = asyncio.create_task(self.read_events())
            self.stderr_reader = asyncio.create_task(self.read_stderr())
            state = await self.rpc("get_state")
            model = state.get("model", {})
            routing = model.get("compat", {}).get("openRouterRouting", {})
            if (model.get("id") != MODEL or model.get("provider") != PROVIDER
                    or state.get("thinkingLevel") != "max"
                    or routing.get("only") != ["wafer"]
                    or routing.get("allow_fallbacks") is not False):
                raise ValueError("Pi did not load the required model/max/Wafer-only settings; no prompt sent.")
            self.data.update(model=MODEL, provider=PROVIDER, thinking="max", routing=ROUTING,
                             session_file=state.get("sessionFile"), status="idle", error=None)
            history = await self.rpc("get_messages")
            self.data["messages"] = [item for m in history.get("messages", [])
                                     if (item := summarize(m)) is not None][-12:]
            self.save()
        except BaseException:
            await self.close()
            raise

    async def rpc(self, command, timeout=25, **fields):
        if not self.process or self.process.returncode is not None:
            raise ValueError("Pi process is not running.")
        request_id = uuid.uuid4().hex
        future = asyncio.get_running_loop().create_future()
        self.pending[request_id] = future
        try:
            self.process.stdin.write((json.dumps({"id": request_id, "type": command, **fields}) + "\n").encode())
            await self.process.stdin.drain()
            response = await asyncio.wait_for(future, timeout)
            if not response.get("success"):
                raise ValueError(response.get("error", "Pi rejected the command."))
            return response.get("data", {})
        finally:
            self.pending.pop(request_id, None)

    async def read_stderr(self):
        while line := await self.process.stderr.readline():
            self.diagnostics.append(line.decode(errors="replace").strip()[:1000])

    async def read_events(self):
        try:
            while line := await self.process.stdout.readline():
                event = json.loads(line)
                kind = event.get("type")
                if kind == "response":
                    future = self.pending.get(event.get("id"))
                    if future is not None and not future.done():
                        future.set_result(event)
                elif kind == "agent_start":
                    self.idle.clear()
                    self.data["status"] = "running"
                    self.save()
                elif kind == "message_end":
                    message = event.get("message", {})
                    item = summarize(message)
                    if item:
                        self.data.setdefault("messages", []).append(item)
                        self.data["messages"] = self.data["messages"][-12:]
                        if item["role"] == "assistant":
                            self.last_assistant = item
                        self.save()
                elif kind == "agent_settled":
                    last = self.last_assistant or {}
                    self.data["status"] = ("aborted" if event.get("aborted") else
                                           "failed" if last.get("stopReason") in ("error", "aborted") else
                                           "completed")
                    self.data["error"] = last.get("errorMessage")
                    self.save()
                    self.idle.set()
                elif kind == "tool_execution_start":
                    self.data["activity"] = "Running tool: " + event.get("toolName", "unknown")
                    self.save()
        except (ValueError, OSError) as error:
            self.data.update(status="failed", error="Pi event stream failed: " + str(error))
            if self.process.returncode is None:
                try:
                    os.killpg(self.process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
        finally:
            if self.process.returncode is None:
                await self.process.wait()
            for future in list(self.pending.values()):
                if not future.done():
                    future.set_exception(ValueError("Pi exited before acknowledging the command."))
            if not self.stopping:
                self.data.update(status="failed", error="Pi exited unexpectedly (status %s)." % self.process.returncode)
                self.save()
            self.idle.set()

    async def send(self, message, wait_seconds):
        async with self.operation:
            self.last_assistant = None
            self.idle.clear()
            self.data.update(status="running", error=None, activity="Prompt submitted")
            self.save()
            try:
                result = await self.rpc("prompt", message=message, streamingBehavior="followUp")
            except BaseException as error:
                if isinstance(error, (asyncio.TimeoutError, asyncio.CancelledError)):
                    # An acknowledgement timeout is not evidence that work stopped.
                    self.data["error"] = "Prompt acknowledgement failed; inspect agent state before retrying."
                else:
                    self.data.update(status="failed", error=str(error))
                    self.idle.set()
                self.save()
                raise
            if result.get("disposition") == "handled" and self.data["status"] == "running":
                self.data["status"] = "idle"
                self.save()
                self.idle.set()
        await self.wait(wait_seconds)
        return {**self.snapshot(), "disposition": result.get("disposition")}

    async def wait(self, seconds):
        if seconds and not self.idle.is_set():
            try:
                await asyncio.wait_for(self.idle.wait(), seconds)
            except asyncio.TimeoutError:
                pass  # The Pi agent continues; only this wait has expired.

    async def close(self):
        async with self.operation:
            self.stopping = True
            if self.process and self.process.returncode is None:
                if self.process.stdin:
                    self.process.stdin.close()
                try:
                    await asyncio.wait_for(self.process.wait(), 3)
                except asyncio.TimeoutError:
                    try:
                        os.killpg(self.process.pid, signal.SIGTERM)
                    except ProcessLookupError:
                        pass
                    try:
                        await asyncio.wait_for(self.process.wait(), 2)
                    except asyncio.TimeoutError:
                        try:
                            os.killpg(self.process.pid, signal.SIGKILL)
                        except ProcessLookupError:
                            pass
                        await self.process.wait()
            for task in (self.reader, self.stderr_reader):
                if task:
                    if not task.done():
                        task.cancel()
                    await asyncio.gather(task, return_exceptions=True)
            if self.lockfile:
                self.lockfile.close()
                self.lockfile = None
            self.data["status"] = "stopped"
            self.save()
            self.idle.set()


def schema(properties, required=()):
    return {"type": "object", "properties": properties, "required": list(required), "additionalProperties": False}


TEXT = {"type": "string", "minLength": 1}
ID = {"type": "string", "pattern": "^[a-f0-9]{16}$"}
WAIT = {"type": "integer", "minimum": 0, "maximum": 50, "default": 0}


def tool(name, description, fields, required=(), read_only=False):
    return {"name": name, "description": description, "inputSchema": schema(fields, required),
            "annotations": {"readOnlyHint": read_only, "destructiveHint": name in ("pi_start_agent", "pi_send_message"),
                            "openWorldHint": not read_only}}


TOOLS = [
    tool("pi_start_agent", "Start a persistent Pi agent and send its first task. Normal Pi file/shell tools are enabled by default. Returns acceptance/status; use pi_get_agent to await completion.",
         {"cwd": {**TEXT, "description": "Existing absolute working directory."}, "message": TEXT,
          "name": TEXT, "tool_mode": {"type": "string", "enum": ["default", "none"], "default": "default"},
          "wait_seconds": WAIT}, ("cwd", "message")),
    tool("pi_send_message", "Send a follow-up to an existing Pi agent. A busy agent queues it for its next turn. A stopped agent resumes its saved conversation. Does not interrupt existing work.",
         {"agent_id": ID, "message": TEXT, "wait_seconds": WAIT}, ("agent_id", "message")),
    tool("pi_get_agent", "Read status, recent replies, errors and provider response IDs. Optionally wait up to 50 seconds; timeout leaves the agent running. Completed and failed are distinct outcomes.",
         {"agent_id": ID, "wait_seconds": WAIT}, ("agent_id",), True),
    tool("pi_list_agents", "List saved Pi agents and their status. Does not start agents or make model requests.", {}, read_only=True),
    tool("pi_stop_agent", "Stop a Pi agent owned by this connection, terminating current work. Conversation remains saved for later resumption.",
         {"agent_id": ID}, ("agent_id",)),
]


class Bridge:
    def __init__(self, root, pi, agent_dir):
        self.root, self.pi, self.agent_dir = Path(root), Path(pi), Path(agent_dir)
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.agents = {}
        self.creation = asyncio.Lock()

    def metadata(self, agent_id):
        if not re.fullmatch(r"[a-f0-9]{16}", agent_id):
            raise ValueError("Invalid agent_id.")
        path = self.root / agent_id / "agent.json"
        if not path.is_file():
            raise ValueError("Unknown agent_id.")
        return json.loads(path.read_text())

    def saved_snapshot(self, agent_id):
        data = self.metadata(agent_id)
        with (self.root / agent_id / "lock").open("a") as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                data["status"] = "stopped"
            except BlockingIOError:
                data["connection"] = "another Codex connection"
        return data

    async def load(self, agent_id):
        async with self.creation:
            agent = self.agents.get(agent_id)
            if agent and agent.process and agent.process.returncode is None:
                return agent
            if agent:
                await agent.close()
            if self.running_count() >= 8:
                raise ValueError("Eight agents are already running; stop one first.")
            agent = Agent(self, self.metadata(agent_id))
            agent.data["status"] = "starting"
            self.agents[agent_id] = agent
            try:
                await agent.launch()
            except BaseException:
                self.agents.pop(agent_id, None)
                raise
            return agent

    def running_count(self):
        return sum(bool((a.process and a.process.returncode is None)
                        or (a.process is None and a.data["status"] == "starting"))
                   for a in self.agents.values())

    async def call(self, name, arguments):
        definition = next((t for t in TOOLS if t["name"] == name), None)
        if definition is None:
            raise ValueError("Unknown tool.")
        validate(arguments, definition["inputSchema"])
        wait = arguments.get("wait_seconds", 0)
        if name == "pi_start_agent":
            cwd = Path(arguments["cwd"])
            if not cwd.is_absolute() or not cwd.is_dir():
                raise ValueError("cwd must be an existing absolute directory.")
            if self.running_count() >= 8:
                raise ValueError("Eight agents are already running; stop one first.")
            agent_id = uuid.uuid4().hex[:16]
            directory = self.root / agent_id
            directory.mkdir(mode=0o700)
            agent = Agent(self, {"agent_id": agent_id, "name": arguments.get("name", "Pi agent"),
                                "cwd": str(cwd.resolve()), "tool_mode": arguments.get("tool_mode", "default"),
                                "created_at": now(), "messages": [], "status": "starting"})
            agent.save()
            self.agents[agent_id] = agent
            await agent.launch()
            return await agent.send(arguments["message"], wait)
        if name == "pi_list_agents":
            rows = []
            for path in sorted(self.root.glob("*/agent.json")):
                agent = self.agents.get(path.parent.name)
                data = agent.snapshot() if agent else self.saved_snapshot(path.parent.name)
                rows.append({k: v for k, v in data.items() if k != "messages"})
            return {"agents": rows}
        agent_id = arguments["agent_id"]
        self.metadata(agent_id)
        if name == "pi_get_agent":
            agent = self.agents.get(agent_id)
            if agent:
                await agent.wait(wait)
                return agent.snapshot()
            return self.saved_snapshot(agent_id)
        if name == "pi_stop_agent":
            agent = self.agents.get(agent_id)
            if agent:
                await agent.close()
                return agent.snapshot()
            saved = self.saved_snapshot(agent_id)
            if saved.get("connection"):
                raise ValueError("Agent is active in another Codex connection; stop it there first.")
            return saved
        agent = await self.load(agent_id)
        return await agent.send(arguments["message"], wait)

    async def close(self):
        await asyncio.gather(*(a.close() for a in self.agents.values()), return_exceptions=True)


def validate(arguments, definition):
    if not isinstance(arguments, dict):
        raise ValueError("Tool arguments must be an object.")
    if set(arguments) - set(definition["properties"]):
        raise ValueError("Unknown tool argument.")
    if set(definition["required"]) - set(arguments):
        raise ValueError("Missing required tool argument.")
    for key, value in arguments.items():
        field = definition["properties"][key]
        if field["type"] == "string":
            if not isinstance(value, str) or not value.strip() or len(value) > 200000:
                raise ValueError(key + " must be a nonempty string of at most 200000 characters.")
            if "enum" in field and value not in field["enum"]:
                raise ValueError("Invalid " + key)
            if "pattern" in field and not re.fullmatch(field["pattern"], value):
                raise ValueError("Invalid " + key)
        elif field["type"] == "integer":
            if type(value) is not int or not field["minimum"] <= value <= field["maximum"]:
                raise ValueError(key + " must be an integer from 0 to 50.")


def emit(value):
    sys.stdout.write(json.dumps(value, ensure_ascii=False) + "\n")
    sys.stdout.flush()


async def serve(bridge):
    loop = asyncio.get_running_loop()
    main_task = asyncio.current_task()
    loop.add_signal_handler(signal.SIGTERM, main_task.cancel)
    reader = asyncio.StreamReader(limit=2 * 1024 * 1024)
    transport, _ = await asyncio.get_running_loop().connect_read_pipe(
        lambda: asyncio.StreamReaderProtocol(reader), sys.stdin.buffer)
    requests = {}

    async def handle(request):
        request_id = request.get("id")
        try:
            method, params = request.get("method"), request.get("params") or {}
            if method == "initialize":
                version = params.get("protocolVersion")
                supported = ("2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25")
                result = {"protocolVersion": version if version in supported else supported[-1],
                          "serverInfo": {"name": "pi-bridge", "version": "1.0.0"},
                          "capabilities": {"tools": {}}, "instructions": INSTRUCTIONS}
            elif method == "ping":
                result = {}
            elif method == "tools/list":
                result = {"tools": TOOLS}
            elif method == "tools/call":
                try:
                    data = await bridge.call(params.get("name"), params.get("arguments", {}))
                    result = {"content": [{"type": "text", "text": json.dumps(data, ensure_ascii=False)}], "isError": False}
                except (ValueError, OSError, asyncio.TimeoutError) as error:
                    result = {"content": [{"type": "text", "text": str(error) or "Pi command timed out."}], "isError": True}
            else:
                emit({"jsonrpc": "2.0", "id": request_id, "error": {"code": -32601, "message": "Method not found"}})
                return
            emit({"jsonrpc": "2.0", "id": request_id, "result": result})
        except asyncio.CancelledError:
            emit({"jsonrpc": "2.0", "id": request_id, "error": {"code": -32800, "message": "Request cancelled"}})
        except Exception as error:
            print("pi-bridge: " + type(error).__name__, file=sys.stderr)
            emit({"jsonrpc": "2.0", "id": request_id, "error": {"code": -32603, "message": "Bridge internal error; check local diagnostics."}})
        finally:
            requests.pop(request_id, None)

    try:
        while line := await reader.readline():
            try:
                request = json.loads(line)
            except ValueError:
                emit({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}})
                continue
            if not isinstance(request, dict) or request.get("jsonrpc") != "2.0" or not isinstance(request.get("method"), str):
                emit({"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Invalid request"}})
                continue
            if "id" not in request:
                if request["method"] == "notifications/cancelled":
                    target = requests.get(request.get("params", {}).get("requestId"))
                    if target:
                        target.cancel()
                continue
            request_id = request["id"]
            if type(request_id) not in (str, int) or request_id in requests:
                emit({"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Invalid or duplicate request id"}})
                continue
            requests[request_id] = asyncio.create_task(handle(request))
    finally:
        transport.close()
        tasks = list(requests.values())
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        await bridge.close()
        loop.remove_signal_handler(signal.SIGTERM)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, default=Path.home() / ".local/state/pi-bridge")
    parser.add_argument("--pi", type=Path, default=Path.home() / ".local/bin/pi")
    parser.add_argument("--agent-dir", type=Path, default=Path.home() / ".pi/agent")
    args = parser.parse_args()
    os.umask(0o077)
    bridge = Bridge(args.state_dir, args.pi, args.agent_dir)
    try:
        asyncio.run(serve(bridge))
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass


if __name__ == "__main__":
    main()
