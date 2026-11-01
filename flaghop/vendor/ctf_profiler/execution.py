"""Tool-neutral sequential process execution and task contracts."""
from __future__ import annotations

from datetime import datetime, timezone
import os
from pathlib import Path
import selectors
import shutil
import signal
import subprocess
import time
from typing import TypedDict
from settings import MAX_ARTIFACT, MAX_LOG, TOOLS
from tool_environment import child_environment, prepare_tool_environment
from workspace import Workspace


class TaskSpec(TypedDict, total=False):
    """Known fields shared by planners, adapters and the process runner."""
    id: str
    tool: str
    command: list[str]
    trigger: str
    timeout: float
    stage: int
    port: int
    url: str
    watch: list[str]
    stdout_limit: int
    success_exit_codes: list[int]
    isolated_tool_state: bool


class TaskResult(TaskSpec, total=False):
    """Execution facts; parser outcomes may be added by an adapter."""
    status: str
    exit_code: int | None
    stdout: str
    stderr: str
    started_at: str
    finished_at: str
    duration_seconds: float
    reason: str
    parse_status: str
    parse_error: str



def utc_now():
    return datetime.now(timezone.utc).isoformat()


def stop_process(process):
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


class Runner:
    """Sequential, deadline-bound child processes with bounded raw evidence."""

    def __init__(self, output, tools, offline=False, dry_run=False, skip=(), workspace=None):
        self.output = Path(output)
        self.tools = tools
        self.offline = offline
        self.dry_run = dry_run
        self.skip = set(skip)
        self.workspace = workspace or Workspace.local(self.output / "scratch")

    def execute(self, spec: TaskSpec) -> TaskResult:
        result = dict(spec)
        result.update({"started_at": utc_now(), "exit_code": None})
        if self.offline:
            result.update(status="skipped_offline", reason="Offline mode makes no tool calls")
            return result
        if spec["tool"] in self.skip:
            result.update(status="disabled", reason="Disabled by --skip")
            return result
        if self.dry_run:
            result.update(status="planned", reason="Dry run; command was not executed")
            return result
        if spec["tool"] in TOOLS and not self.tools.get(spec["tool"]):
            result.update(status="tool_missing", reason="Executable not found on PATH")
            return result
        argv = list(spec["command"])
        executable = shutil.which(argv[0])
        if executable is None:
            result.update(status="tool_missing", reason=f"Executable not found: {argv[0]}")
            return result
        argv[0] = executable
        result["command"] = argv
        stdout_path = self.output / "raw" / (spec["id"] + ".stdout")
        stderr_path = self.output / "raw" / (spec["id"] + ".stderr")
        result["stdout"] = str(stdout_path.relative_to(self.output))
        result["stderr"] = str(stderr_path.relative_to(self.output))
        sizes = {"stdout": 0, "stderr": 0}
        caps = {"stdout": spec.get("stdout_limit", MAX_LOG), "stderr": MAX_LOG}
        started = time.monotonic()
        process = None
        selector = selectors.DefaultSelector()
        reason = None
        environment, runtime = prepare_tool_environment(
            self.workspace, spec["tool"], spec.get("isolated_tool_state", False))
        result.update(runtime)
        try:
            with stdout_path.open("wb") as out, stderr_path.open("wb") as err:
                process = subprocess.Popen(
                    argv, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE, cwd=self.output,
                    env=environment, start_new_session=True,
                )
                for stream, name, destination in (
                    (process.stdout, "stdout", out), (process.stderr, "stderr", err)
                ):
                    os.set_blocking(stream.fileno(), False)
                    selector.register(stream, selectors.EVENT_READ, (name, destination))
                # Keep enforcing the deadline even when the child closes both
                # pipes early; selector lifetime is independent of process life.
                while process.poll() is None or selector.get_map():
                    if reason is None and time.monotonic() - started > spec["timeout"]:
                        reason = "timed_out"
                        stop_process(process)
                    if reason is None:
                        for artifact in spec.get("watch", []):
                            path = Path(artifact)
                            if path.exists() and path.stat().st_size > MAX_ARTIFACT:
                                reason = "output_limit"
                                stop_process(process)
                                break
                    if selector.get_map():
                        for key, _ in selector.select(0.05):
                            try:
                                chunk = os.read(key.fileobj.fileno(), 65536)
                            except BlockingIOError:
                                continue
                            if not chunk:
                                selector.unregister(key.fileobj)
                                key.fileobj.close()
                                continue
                            name, destination = key.data
                            remaining = max(0, caps[name] - sizes[name])
                            destination.write(chunk[:remaining])
                            sizes[name] += min(len(chunk), remaining)
                            if len(chunk) > remaining and reason is None:
                                reason = "output_limit"
                                stop_process(process)
                    else:
                        time.sleep(0.02)
                    if process.poll() is not None and not selector.get_map():
                        break
                result["exit_code"] = process.wait()
                result["status"] = reason or (
                    "completed" if process.returncode in spec.get("success_exit_codes", [0]) else "failed"
                )
        except OSError as error:
            result.update(status="failed", reason=str(error))
        finally:
            selector.close()
            if process is not None and process.poll() is None:
                stop_process(process)
                process.wait()
            # Browser/tool scratch is owned by Workspace and removed by its
            # reported cleanup after the run; never ignore a failed deletion here.
            if process is not None:
                for stream in (process.stdout, process.stderr):
                    if stream is not None and not stream.closed:
                        stream.close()
            result.update(
                finished_at=utc_now(),
                duration_seconds=round(time.monotonic() - started, 3),
                captured_bytes=sizes,
            )
        return result


def task(task_id, tool, command, trigger, timeout, **extra):
    return {
        "id": task_id, "tool": tool, "command": command,
        "trigger": trigger, "timeout": timeout, **extra,
    }
