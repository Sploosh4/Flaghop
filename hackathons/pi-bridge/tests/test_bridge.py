import asyncio
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bridge import Bridge, MODEL

FAKE = Path(__file__).parent / "fake_pi.py"


class BridgeTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.bridge = Bridge(self.root / "state", FAKE, self.root / "pi-config")

    async def asyncTearDown(self):
        await self.bridge.close()
        self.temporary.cleanup()

    async def start(self, message="hello", wait=1):
        return await self.bridge.call("pi_start_agent", {"cwd": str(self.root), "message": message,
                                                       "tool_mode": "none", "wait_seconds": wait})

    async def test_followup_and_resume_after_bridge_restart(self):
        first = await self.start()
        self.assertEqual(first["status"], "completed")
        self.assertEqual(first["model"], MODEL)
        agent_id = first["agent_id"]
        followup = await self.bridge.call("pi_send_message", {"agent_id": agent_id, "message": "again", "wait_seconds": 1})
        self.assertEqual([m["text"] for m in followup["messages"] if m["role"] == "user"], ["hello", "again"])
        listing = await self.bridge.call("pi_list_agents", {})
        self.assertNotIn("connection", listing["agents"][0])
        await self.bridge.close()
        self.bridge = Bridge(self.root / "state", FAKE, self.root / "pi-config")
        saved = await self.bridge.call("pi_get_agent", {"agent_id": agent_id})
        self.assertEqual(saved["status"], "stopped")
        resumed = await self.bridge.call("pi_send_message", {"agent_id": agent_id, "message": "resumed", "wait_seconds": 1})
        self.assertEqual(resumed["status"], "completed")
        self.assertEqual(len(resumed["messages"]), 6)

    async def test_timeout_keeps_running_and_queued_followup_settles(self):
        started = await self.start("slow", wait=0)
        self.assertEqual(started["status"], "running")
        queued = await self.bridge.call("pi_send_message", {"agent_id": started["agent_id"], "message": "queued", "wait_seconds": 1})
        self.assertEqual(queued["status"], "completed")
        self.assertEqual(queued["messages"][-1]["text"], "Reply: queued")

    async def test_provider_error_is_failed(self):
        failed = await self.start("fail")
        self.assertEqual(failed["status"], "failed")
        self.assertEqual(failed["error"], "Fake provider failure")

    async def test_unexpected_exit_is_failed(self):
        failed = await self.start("crash")
        self.assertEqual(failed["status"], "failed")
        self.assertIn("status 7", failed["error"])

    async def test_routing_drift_rejected_before_first_prompt(self):
        self.bridge.agent_dir = self.root / "wrong-routing"
        with self.assertRaisesRegex(ValueError, "no prompt sent"):
            await self.start()
        self.assertFalse(list((self.root / "state").glob("*/sessions/fake.jsonl")))

    async def test_active_session_cannot_be_opened_twice(self):
        first = await self.start()
        other = Bridge(self.root / "state", FAKE, self.root / "pi-config")
        try:
            with self.assertRaisesRegex(ValueError, "another Codex connection"):
                await other.call("pi_send_message", {"agent_id": first["agent_id"], "message": "no duplicate"})
            listing = await other.call("pi_list_agents", {})
            self.assertEqual(listing["agents"][0]["connection"], "another Codex connection")
        finally:
            await other.close()

    async def test_stop_running_agent_and_validate_arguments(self):
        first = await self.start("slow", wait=0)
        agent = self.bridge.agents[first["agent_id"]]
        stopped = await self.bridge.call("pi_stop_agent", {"agent_id": first["agent_id"]})
        self.assertEqual(stopped["status"], "stopped")
        self.assertIsNotNone(agent.process.returncode)
        for arguments in [{"agent_id": "../../bad"}, {"agent_id": first["agent_id"], "wait_seconds": True},
                          {"agent_id": first["agent_id"], "wait_seconds": 51}]:
            with self.assertRaises(ValueError):
                await self.bridge.call("pi_get_agent", arguments)

    async def test_mcp_wire_startup_discovery_and_error(self):
        process = await asyncio.create_subprocess_exec(
            sys.executable, str(Path(__file__).resolve().parents[1] / "bridge.py"),
            "--state-dir", str(self.root / "wire-state"), "--pi", str(FAKE),
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        async def request(request_id, method, params=None):
            process.stdin.write((json.dumps({"jsonrpc": "2.0", "id": request_id, "method": method, "params": params or {}}) + "\n").encode())
            await process.stdin.drain()
            return json.loads(await asyncio.wait_for(process.stdout.readline(), 5))
        try:
            ready = await request(1, "initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "test", "version": "1"}})
            self.assertEqual(ready["result"]["protocolVersion"], "2025-06-18")
            discovery = await request(2, "tools/list")
            self.assertEqual(len(discovery["result"]["tools"]), 5)
            result = await request(3, "tools/call", {"name": "pi_get_agent", "arguments": {"agent_id": "bad"}})
            self.assertTrue(result["result"]["isError"])
            result = await request(4, "tools/call", {"name": "pi_start_agent", "arguments": {"cwd": str(self.root), "message": "wire", "wait_seconds": 1}})
            self.assertFalse(result["result"]["isError"])
            self.assertEqual(json.loads(result["result"]["content"][0]["text"])["status"], "completed")
        finally:
            process.stdin.close()
            await asyncio.wait_for(process.wait(), 8)
            self.assertEqual((await process.stderr.read()).decode(), "")

    async def test_sigterm_stops_owned_agent(self):
        state = self.root / "signal-state"
        process = await asyncio.create_subprocess_exec(
            sys.executable, str(Path(__file__).resolve().parents[1] / "bridge.py"),
            "--state-dir", str(state), "--pi", str(FAKE),
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        try:
            process.stdin.write((json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                "params": {"name": "pi_start_agent", "arguments": {"cwd": str(self.root), "message": "slow"}}}) + "\n").encode())
            await process.stdin.drain()
            response = json.loads(await asyncio.wait_for(process.stdout.readline(), 5))
            self.assertFalse(response["result"]["isError"])
            process.terminate()
            await asyncio.wait_for(process.wait(), 8)
            metadata = json.loads(next(state.glob("*/agent.json")).read_text())
            self.assertEqual(metadata["status"], "stopped")
            self.assertEqual(process.returncode, 0)
        finally:
            if process.returncode is None:
                process.kill()
                await process.wait()


if __name__ == "__main__":
    unittest.main()
