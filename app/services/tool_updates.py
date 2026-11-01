import copy
import importlib.util
import json
import os
from pathlib import Path
import selectors
import signal
import subprocess
import threading
import time

from app.contracts.actions.jobs import JobOutcome
from app.contracts.actions.tool_updates import ToolUpdateEntry, ToolUpdateState


class ToolUpdates:
    def __init__(self, runtime, *, root=None):
        self.runtime = runtime
        self.root = Path(root or Path(__file__).resolve().parents[2])
        self.script = self.root / "scripts/security-tools.py"
        spec = importlib.util.spec_from_file_location("security_tool_registry", self.script)
        registry = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(registry)
        self.names = [*registry.RELEASES, "john", "base64dump", "wpscan"]
        self.lock = threading.RLock()
        self.state = ToolUpdateState(tools=[ToolUpdateEntry(name=name) for name in self.names]).model_dump()

    def snapshot(self):
        with self.lock:
            return copy.deepcopy(self.state)

    def start(self, request):
        with self.lock:
            if self.state["running"]:
                raise RuntimeError("Tool updates are already running.")
            selected = (
                [row["name"] for row in self.state["tools"] if row["status"] == "failed"]
                if request.retry_failed
                else self.names
            )
            if not selected:
                raise ValueError("There are no failed updates to retry.")
            self.state["running"] = True
            self.state["error"] = ""
            for row in self.state["tools"]:
                if row["name"] in selected:
                    row.update(status="pending", error="")
            try:
                job = self.runtime.jobs.start(
                    "tool-update", lambda: self.run(selected), exclusive=True, on_finish=self.finish
                )
            except Exception:
                self.state["running"] = False
                raise
            self.state["job_id"] = job["id"]
            return copy.deepcopy(self.state)

    def finish(self, job):
        with self.lock:
            if self.state["running"]:
                self.state.update(running=False, error=job.get("error") or "Update did not run.")

    def apply_event(self, data):
        name = data.get("name")
        with self.lock:
            for row in self.state["tools"]:
                if row["name"] == name:
                    validated = ToolUpdateEntry.model_validate({**row, **data})
                    row.update(validated.model_dump())
                    return
        raise ValueError("Unknown update tool.")

    def run(self, selected):
        output = ""
        failure = ""
        proc = None
        try:
            env = dict(os.environ)
            env["PATH"] = str(Path.home() / ".local/bin") + ":" + env.get("PATH", "")
            proc = subprocess.Popen(
                ["bash", str(self.root / "scripts/update-security-tools.sh"), "--events", "--only", *selected],
                cwd=self.root,
                env=env,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
            pending = b""
            started = time.monotonic()
            with selectors.DefaultSelector() as selector:
                selector.register(proc.stdout, selectors.EVENT_READ)
                while selector.get_map():
                    if self.state["job_id"] and self.runtime.jobs.is_cancel_requested(self.state["job_id"]):
                        raise RuntimeError("Tool update cancelled.")
                    if time.monotonic() - started > 7200:
                        raise TimeoutError("Tool updates exceeded two hours.")
                    for key, _ in selector.select(timeout=1):
                        data = os.read(key.fileobj.fileno(), 16384)
                        if not data:
                            selector.unregister(key.fileobj)
                            continue
                        output = (output + data.decode(errors="replace"))[-32000:]
                        pending += data
                        while b"\n" in pending:
                            line, pending = pending.split(b"\n", 1)
                            if line.startswith(b"TOOL_EVENT "):
                                self.apply_event(json.loads(line[11:]))
                        pending = pending[-32000:]
            if proc.wait(timeout=10):
                failure = output[-1000:] or "The tool updater failed."
        except Exception as exc:
            failure = str(exc)[:1000]
        finally:
            if proc is not None:
                if proc.poll() is None:
                    os.killpg(proc.pid, signal.SIGTERM)
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        os.killpg(proc.pid, signal.SIGKILL)
                        proc.wait()
                if proc.stdout:
                    proc.stdout.close()
            with self.lock:
                for row in self.state["tools"]:
                    if row["name"] in selected and row["status"] in {"pending", "checking", "updating"}:
                        row.update(status="failed", error=failure or "Update ended without a result.")
                self.state.update(running=False, error=failure)
                result = copy.deepcopy(self.state)
        failed = sum(row["status"] == "failed" for row in result["tools"])
        return JobOutcome("partial" if failed else "completed", result, failure)
