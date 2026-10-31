"""Single-command runner with explicit collaborators and bounded lifecycle stages."""

import os
import logging
import queue
import subprocess
import threading
import time
from typing import List, Optional
from app.settings import AppSettings
from app.timing import getTimestamp
from app.tooling import build_tool_execution_env
from app.processes.models import CommandRequest, ExecutionResult, ExecutionState


class _TrackedProcessStub:

    def __init__(
        self,
        *,
        name: str,
        tab_title: str,
        host_ip: str,
        port: str,
        protocol: str,
        command: str,
        start_time: str,
        outputfile: str,
    ):
        self.name = str(name)
        self.tabTitle = str(tab_title)
        self.hostIp = str(host_ip)
        self.port = str(port)
        self.protocol = str(protocol)
        self.command = str(command)
        self.startTime = str(start_time)
        self.outputfile = str(outputfile)
        self.id = None

    def processId(self):
        return 0


class ProcessRunner:
    """One runner per command. Registry and repositories may be shared across commands."""

    def __init__(self, ports, *, reader_exit_grace=2.0, crash_min_runtime=5.0):
        self.ports = ports
        self.reader_exit_grace = reader_exit_grace
        self.crash_min_runtime = crash_min_runtime

    def run(self, request: CommandRequest) -> ExecutionResult:
        self.request = request
        self.state = ExecutionState()
        return self._execute()

    def _execute(self):
        self.state.process_repo = self.ports.repository()
        self.state.start_time = getTimestamp(True)
        stub = _TrackedProcessStub(
            name=str(self.request.tool_name),
            tab_title=str(self.request.tab_title),
            host_ip=str(self.request.host_ip),
            port=str(self.request.port),
            protocol=str(self.request.protocol),
            command=str(self.request.command),
            start_time=self.state.start_time,
            outputfile=str(self.request.outputfile),
        )
        try:
            self.state.process_id = int(self.state.process_repo.storeProcess(stub) or 0)
        except Exception:
            self.state.process_repo = self.ports.repository()
            self.state.process_id = int(self.state.process_repo.storeProcess(stub) or 0)
        if self.state.process_id <= 0:
            return self._build_result(False, "error: failed to create process record", 0)
        self.state.resolved_job_id = int(self.request.job_id or 0)
        if self.state.resolved_job_id > 0:
            self.ports.register_job_process(self.state.resolved_job_id, int(self.state.process_id))
            if self.ports.jobs.is_cancel_requested(self.state.resolved_job_id):
                self.state.process_repo.storeProcessCancelStatus(str(self.state.process_id))
                self.state.process_repo.storeProcessProgress(str(self.state.process_id), estimated_remaining=None)
                self.state.process_repo.storeProcessOutput(str(self.state.process_id), "[cancelled before start]")
                self.ports.unregister_job_process(int(self.state.process_id))
                return self._build_result(False, "killed", int(self.state.process_id))
        self.ports.emit_ui_invalidation("processes", "overview", throttle_seconds=0.1)
        self.state.proc: Optional[subprocess.Popen] = None
        self.state.output_parts: List[str] = []
        self.state.output_queue: queue.Queue = queue.Queue()
        self.state.reader_done = threading.Event()
        self.state.started_at = time.monotonic()
        timeout_policy = self.ports.resolve_process_timeout_policy(self.request.tool_name, self.request.timeout)
        self.state.quiet_long_running = bool(timeout_policy.get("quiet_long_running", False))
        self.state.inactivity_timeout_seconds = max(
            1,
            int(timeout_policy.get("inactivity_timeout_seconds", self.request.timeout) or self.request.timeout or 300),
        )
        self.state.hard_timeout_seconds = max(0, int(timeout_policy.get("hard_timeout_seconds", 0) or 0))
        self.state.progress_state = {
            "adapter": self.ports.process_progress_adapter_for_command(
                str(self.request.tool_name), str(self.request.command)
            ),
            "percent": None,
            "remaining": None,
            "message": "",
            "source": "",
            "updated_at": 0.0,
        }
        self.state.timed_out = False
        self.state.timeout_reason = ""
        self.state.killed = False
        self.state.flush_due_at = self.state.started_at
        self.state.elapsed_due_at = self.state.started_at
        self.state.last_output_at = self.state.started_at
        self.state.last_activity_at = self.state.started_at
        self.state.activity_sample_due_at = self.state.started_at
        self.state.last_process_activity = None
        self.state.process_exited_at = None
        try:
            self._start_process()
            self._monitor()
            return self._finish()
        except Exception as exc:
            from app.services.project_networks import NetworkHeld

            self.state.process_repo.storeProcessProblemStatus(str(self.state.process_id))
            try:
                self.state.process_repo.storeProcessProgress(str(self.state.process_id), estimated_remaining=None)
            except Exception:
                logging.getLogger(__name__).warning("Unable to update process progress", exc_info=True)
            self.state.process_repo.storeProcessOutput(
                str(self.state.process_id), f"[error] {exc}\n{''.join(self.state.output_parts)}"
            )
            reason = str(exc) if isinstance(exc, NetworkHeld) else f"error: {exc}"
            self._record_network()
            return self._build_result(False, reason, int(self.state.process_id))
        finally:
            if self.ports.network_guard is not None:
                try:
                    self.ports.network_guard.close()
                except Exception as exc:
                    try:
                        self.ports.network_guard.block(f"Network cleanup incomplete: {exc}")
                    except Exception:
                        logging.getLogger(__name__).exception("Unable to record network cleanup problem")
                    logging.getLogger(__name__).exception("Network restriction retained after cleanup failure")
                try:
                    self._record_network()
                except Exception:
                    logging.getLogger(__name__).exception("Unable to persist final network observation")
            with self.ports.registry.lock:
                self.ports.registry.active.pop(int(self.state.process_id), None)
                self.ports.registry.kill_requests.discard(int(self.state.process_id))
            self.ports.unregister_job_process(int(self.state.process_id))
            self.ports.emit_ui_invalidation("processes", "overview", throttle_seconds=0.1)

    def _start_process(self):
        guarded = self.ports.network_guard is not None
        argv = self.ports.network_guard.prepare() if guarded else self.request.command
        self._record_network()
        env = build_tool_execution_env()
        if guarded:
            env["NMAP_UNPRIVILEGED"] = "1"
        self.state.proc = subprocess.Popen(
            argv,
            shell=not guarded,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            start_new_session=os.name != "nt",
            env=env,
        )
        self.state.process_repo.storeProcessRunningStatus(str(self.state.process_id), str(self.state.proc.pid))
        with self.ports.registry.lock:
            self.ports.registry.active[int(self.state.process_id)] = self.state.proc
            self.ports.registry.kill_requests.discard(int(self.state.process_id))
        if self.state.quiet_long_running:
            self.state.last_process_activity = self.ports.sample_process_tree_activity(self.state.proc)
        reader_thread = threading.Thread(target=self._reader, args=(self.state.proc.stdout,), daemon=True)
        reader_thread.start()

    def _record_network(self):
        if self.ports.network_guard is not None and self.ports.record_network_context is not None:
            self.ports.record_network_context(self.state.process_id, self.ports.network_guard)

    def _monitor(self):
        while True:
            if self.ports.network_guard is not None and self.state.proc.poll() is None:
                self.ports.network_guard.verify()
            changed = False
            while True:
                try:
                    chunk = self.state.output_queue.get_nowait()
                except queue.Empty:
                    break
                self.state.output_parts.append(str(chunk))
                changed = True
                if self.state.progress_state.get("adapter"):
                    self.ports.update_process_progress(
                        self.state.process_repo,
                        process_id=int(self.state.process_id),
                        tool_name=str(self.request.tool_name),
                        command=str(self.request.command),
                        text_chunk=str(chunk),
                        runtime_seconds=max(0.0, time.monotonic() - self.state.started_at),
                        state=self.state.progress_state,
                    )
            now = time.monotonic()
            if changed:
                self.state.last_output_at = now
                self.state.last_activity_at = now
            if changed and now >= self.state.flush_due_at:
                self.ports.write_process_output_partial(int(self.state.process_id), "".join(self.state.output_parts))
                self.state.flush_due_at = now + 0.5
            if (
                self.state.quiet_long_running
                and now >= self.state.activity_sample_due_at
                and (self.state.proc.poll() is None)
            ):
                current_activity = self.ports.sample_process_tree_activity(self.state.proc)
                if self.ports.process_tree_activity_changed(self.state.last_process_activity, current_activity):
                    self.state.last_activity_at = now
                if current_activity is not None:
                    self.state.last_process_activity = current_activity
                self.state.activity_sample_due_at = now + 1.0
            if now >= self.state.elapsed_due_at:
                elapsed_seconds = int(now - self.state.started_at)
                try:
                    self.state.process_repo.storeProcessRunningElapsedTime(str(self.state.process_id), elapsed_seconds)
                except Exception:
                    logging.getLogger(__name__).warning(
                        "Unable to update elapsed time for process %s", self.state.process_id, exc_info=True
                    )
                if self.state.progress_state.get("adapter") == "tshark":
                    self.ports.update_process_progress(
                        self.state.process_repo,
                        process_id=int(self.state.process_id),
                        tool_name=str(self.request.tool_name),
                        command=str(self.request.command),
                        text_chunk="",
                        runtime_seconds=float(elapsed_seconds),
                        state=self.state.progress_state,
                    )
                self.state.elapsed_due_at = now + 1.0
            with self.ports.registry.lock:
                kill_requested = int(self.state.process_id) in self.ports.registry.kill_requests
            if kill_requested and self.state.proc.poll() is None:
                self.state.killed = True
                self.ports.signal_process_tree(self.state.proc, force=False)
                try:
                    self.state.proc.wait(timeout=2)
                except Exception:
                    self.ports.signal_process_tree(self.state.proc, force=True)
            if (
                self.state.resolved_job_id > 0
                and self.ports.jobs.is_cancel_requested(self.state.resolved_job_id)
                and (self.state.proc.poll() is None)
            ):
                self.state.killed = True
                self.ports.signal_process_tree(self.state.proc, force=False)
                try:
                    self.state.proc.wait(timeout=2)
                except Exception:
                    self.ports.signal_process_tree(self.state.proc, force=True)
            if self.state.proc.poll() is None:
                if self.state.hard_timeout_seconds > 0 and now - self.state.started_at > int(
                    self.state.hard_timeout_seconds
                ):
                    self.state.timed_out = True
                    self.state.timeout_reason = f"timeout after {int(self.state.hard_timeout_seconds)}s total runtime"
                    self.ports.signal_process_tree(self.state.proc, force=True)
                elif self.state.quiet_long_running and now - self.state.last_activity_at > int(
                    self.state.inactivity_timeout_seconds
                ):
                    self.state.timed_out = True
                    self.state.timeout_reason = (
                        f"timeout after {int(self.state.inactivity_timeout_seconds)}s without CPU/IO activity"
                    )
                    self.ports.signal_process_tree(self.state.proc, force=True)
                elif not self.state.quiet_long_running and now - self.state.last_output_at > int(
                    self.state.inactivity_timeout_seconds
                ):
                    self.state.timed_out = True
                    self.state.timeout_reason = (
                        f"timeout after {int(self.state.inactivity_timeout_seconds)}s without output"
                    )
                    self.ports.signal_process_tree(self.state.proc, force=True)
            if self.state.proc.poll() is not None:
                if self.state.process_exited_at is None:
                    self.state.process_exited_at = now
                if self.state.reader_done.is_set() and self.state.output_queue.empty():
                    break
                if now - self.state.process_exited_at >= float(self.reader_exit_grace):
                    try:
                        if self.state.proc.stdout is not None:
                            self.state.proc.stdout.close()
                    except Exception:
                        pass
                    while True:
                        try:
                            chunk = self.state.output_queue.get_nowait()
                        except queue.Empty:
                            break
                        self.state.output_parts.append(str(chunk))
                    self.state.output_parts.append(
                        "\n[notice] output stream did not close after process exit; forced completion\n"
                    )
                    break
            time.sleep(0.1)
        while True:
            try:
                chunk = self.state.output_queue.get_nowait()
            except queue.Empty:
                break
            self.state.output_parts.append(str(chunk))

    def _finish(self):
        combined_output = "".join(self.state.output_parts)
        runtime_seconds = max(0.0, float((self.state.process_exited_at or time.monotonic()) - self.state.started_at))
        allowed_exit_codes = AppSettings.allowed_nonzero_exit_codes(str(self.request.tool_name or ""))
        if self.state.timed_out:
            combined_output += f"\n[{self.state.timeout_reason}]"
            self.state.process_repo.storeProcessProblemStatus(str(self.state.process_id))
            self.state.process_repo.storeProcessProgress(str(self.state.process_id), estimated_remaining=None)
            self.state.process_repo.storeProcessOutput(str(self.state.process_id), combined_output)
            self._persist_special_output(combined_output)
            return self._build_result(False, f"failed: {self.state.timeout_reason}", int(self.state.process_id))
        if self.state.killed:
            self.state.process_repo.storeProcessKillStatus(str(self.state.process_id))
            self.state.process_repo.storeProcessProgress(str(self.state.process_id), estimated_remaining=None)
            self.state.process_repo.storeProcessOutput(str(self.state.process_id), combined_output)
            self._persist_special_output(combined_output)
            return self._build_result(False, "killed", int(self.state.process_id))
        if int(self.state.proc.returncode or 0) in allowed_exit_codes:
            try:
                self.state.process_repo.storeProcessProgress(
                    str(self.state.process_id), percent="100", estimated_remaining=None
                )
            except Exception:
                logging.getLogger(__name__).warning("Unable to update process progress", exc_info=True)
            self.state.process_repo.storeProcessOutput(str(self.state.process_id), combined_output)
            self._persist_special_output(combined_output)
            return self._build_result(
                True, f"completed (allowed exit {int(self.state.proc.returncode or 0)})", int(self.state.process_id)
            )
        if int(self.state.proc.returncode or 0) != 0:
            self._store_failure_status(self._classify_nonzero_exit(self.state.proc.returncode, runtime_seconds))
            self.state.process_repo.storeProcessProgress(str(self.state.process_id), estimated_remaining=None)
            self.state.process_repo.storeProcessOutput(str(self.state.process_id), combined_output)
            self._persist_special_output(combined_output)
            return self._build_result(False, f"failed: exit {self.state.proc.returncode}", int(self.state.process_id))
        try:
            self.state.process_repo.storeProcessProgress(
                str(self.state.process_id), percent="100", estimated_remaining=None
            )
        except Exception:
            logging.getLogger(__name__).warning(
                "Unable to store final progress for process %s", self.state.process_id, exc_info=True
            )
        self.state.process_repo.storeProcessOutput(str(self.state.process_id), combined_output)
        self._persist_special_output(combined_output)
        return self._build_result(True, "completed", int(self.state.process_id))

    def _store_failure_status(self, status_name: str):
        if str(status_name) == "Crashed":
            self.state.process_repo.storeProcessCrashStatus(str(self.state.process_id))
        else:
            self.state.process_repo.storeProcessProblemStatus(str(self.state.process_id))

    def _classify_nonzero_exit(self, returncode_value: int, runtime_seconds: float) -> str:
        try:
            code = int(returncode_value)
        except (TypeError, ValueError):
            return "Problem"
        signal_terminated = code < 0 or 128 <= code <= 192
        if signal_terminated and float(runtime_seconds) >= float(self.crash_min_runtime):
            return "Crashed"
        return "Problem"

    def _reader(self, pipe):
        try:
            if pipe is None:
                return
            for line in iter(pipe.readline, ""):
                self.state.output_queue.put(str(line))
        except Exception as exc:
            self.state.output_queue.put(f"\n[reader-error] {exc}\n")
        finally:
            try:
                if pipe is not None:
                    pipe.close()
            except Exception:
                pass
            self.state.reader_done.set()

    def _persist_special_output(self, output_text: str):
        normalized_tool = str(self.request.tool_name or "").strip().lower()
        if normalized_tool not in {"responder", "ntlmrelayx", "ntlmrelay"}:
            return

    def _build_result(self, executed, reason, process_identifier):
        process_id = int(process_identifier or 0)
        return ExecutionResult(
            bool(executed),
            str(reason),
            process_id,
            {
                "started_at": self.state.start_time,
                "finished_at": getTimestamp(True),
                "stdout_ref": f"process_output:{process_id}" if process_id > 0 else "",
                "stderr_ref": "",
                "artifact_refs": (
                    self.ports.collect_command_artifacts(self.request.outputfile) if process_id > 0 else []
                ),
                "network": self.ports.network_guard.report if self.ports.network_guard is not None else None,
            },
        )
