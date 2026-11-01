#!/usr/bin/env python3
"""Deterministic Pi RPC peer for bridge lifecycle tests; never uses a network."""
import asyncio
import json
import os
from pathlib import Path
import sys


def emit(record):
    print(json.dumps(record), flush=True)


async def main():
    args = sys.argv[1:]
    assert args[args.index("--provider") + 1] == "openrouter"
    assert args[args.index("--model") + 1] == "deepseek/deepseek-v4.1-flash-1017"
    assert args[args.index("--thinking") + 1] == "max"
    if "--session" in args:
        session = Path(args[args.index("--session") + 1])
    else:
        directory = Path(args[args.index("--session-dir") + 1])
        directory.mkdir(parents=True, exist_ok=True)
        session = directory / "fake.jsonl"
    messages = json.loads(session.read_text()) if session.exists() else []
    queue = asyncio.Queue()

    async def run():
        while True:
            first = await queue.get()
            emit({"type": "agent_start"})
            pending = first
            while True:
                messages.append({"role": "user", "content": pending})
                emit({"type": "message_end", "message": messages[-1]})
                await asyncio.sleep(0.25 if pending == "slow" else 0.01)
                if pending == "crash":
                    os._exit(7)
                message = {"role": "assistant", "content": [{"type": "text", "text": "Reply: " + pending}],
                           "stopReason": "error" if pending == "fail" else "stop", "responseId": "fake-response"}
                if pending == "fail":
                    message["errorMessage"] = "Fake provider failure"
                messages.append(message)
                session.write_text(json.dumps(messages))
                emit({"type": "message_end", "message": message})
                if queue.empty():
                    break
                pending = queue.get_nowait()
            emit({"type": "agent_end"})
            await asyncio.sleep(0.02)
            emit({"type": "agent_settled", "aborted": False})

    worker = asyncio.create_task(run())
    reader = asyncio.StreamReader()
    transport, _ = await asyncio.get_running_loop().connect_read_pipe(
        lambda: asyncio.StreamReaderProtocol(reader), sys.stdin.buffer)
    try:
        while line := await reader.readline():
            record = json.loads(line)
            kind = record["type"]
            data = {}
            if kind == "get_state":
                routing = {"only": ["wafer"], "allow_fallbacks": False}
                if Path(os.environ["PI_CODING_AGENT_DIR"]).name == "wrong-routing":
                    routing["allow_fallbacks"] = True
                data = {"model": {"id": "deepseek/deepseek-v4.1-flash-1017", "provider": "openrouter",
                                  "compat": {"openRouterRouting": routing}}, "thinkingLevel": "max",
                        "sessionFile": str(session)}
            elif kind == "get_messages":
                data = {"messages": messages}
            elif kind == "prompt":
                await queue.put(record["message"])
                data = {"disposition": "started"}
            emit({"id": record["id"], "type": "response", "command": kind, "success": True, "data": data})
    finally:
        transport.close()
        worker.cancel()
        await asyncio.gather(worker, return_exceptions=True)


asyncio.run(main())
