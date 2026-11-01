"""Killed-owner fixture: real gated runner, sanitized vendor Runner, no network."""

import json
import os
from pathlib import Path
import shlex
import sys
import time
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
mode, folder = sys.argv[1], Path(sys.argv[2])

if mode == "owner":
    from app.services.execution_journal import ExecutionJournal
    from app.contracts.actions.process import CommandRequest
    from app.processes.runner import ProcessRunner
    from app.processes.models import ExecutionPorts
    from app.services.processes import ProcessRegistry
    from app.web.runtime_process_control import signal_process_tree

    journal = ExecutionJournal(folder / "protected")
    entry = journal.create(str(folder / "fixture.legion"))
    (folder / "entry.json").write_text(json.dumps({"id": entry.id, "token": entry.token}))
    repository = SimpleNamespace(storeProcess=lambda _: 1)
    repository.__dict__.update(
        {
            name: lambda *args, **kwargs: None
            for name in (
                "storeProcessRunningStatus",
                "storeProcessProblemStatus",
                "storeProcessProgress",
                "storeProcessOutput",
                "storeProcessRunningElapsedTime",
            )
        }
    )
    registry = ProcessRegistry()
    noop = lambda *args, **kwargs: None
    ports = ExecutionPorts(
        repository=lambda: repository,
        registry=registry,
        jobs=SimpleNamespace(is_cancel_requested=lambda _: False),
        collect_command_artifacts=lambda _: [],
        emit_ui_invalidation=noop,
        process_progress_adapter_for_command=lambda *args: "",
        process_tree_activity_changed=lambda *args: False,
        register_job_process=noop,
        resolve_process_timeout_policy=lambda *args: {"inactivity_timeout_seconds": 30},
        sample_process_tree_activity=lambda _: None,
        signal_process_tree=signal_process_tree,
        unregister_job_process=noop,
        update_process_progress=noop,
        write_process_output_partial=noop,
        ownership=(journal, entry.id),
    )
    request = CommandRequest(
        tool_name="owned-fixture",
        tab_title="fixture",
        host_ip="",
        port="",
        protocol="tcp",
        command=shlex.join([sys.executable, str(Path(__file__).resolve()), "adapter", str(folder)]),
        outputfile="",
        timeout=30,
    )
    ProcessRunner(ports).run(request)
elif mode == "adapter":
    from app.scanning.source import scanner_source, pin_source
    from app.scanning.worker import install_execution_identity

    scratch = folder / "scratch"
    scratch.mkdir()
    source = pin_source(scratch, scanner_source()[1])
    sys.path.insert(0, str(source))
    import execution
    import tool_environment

    assert "FLAGHOP_EXECUTION_TOKEN" not in tool_environment.child_environment()
    install_execution_identity(os.environ["FLAGHOP_EXECUTION_TOKEN"])
    output = folder / "output"
    (output / "raw").mkdir(parents=True)
    execution.Runner(output, {}).execute(
        {
            "id": "owned",
            "tool": "owned-fixture",
            "command": [sys.executable, str(Path(__file__).resolve()), "tool", str(folder)],
            "timeout": 30,
        }
    )
elif mode == "tool":
    import subprocess

    child = subprocess.Popen(
        [sys.executable, "-c", "import time; time.sleep(30)"],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    (folder / "children.json").write_text(
        json.dumps(
            {
                "tool": os.getpid(),
                "adapter": os.getppid(),
                "child": child.pid,
                "token": os.environ.get("FLAGHOP_EXECUTION_TOKEN"),
                "gid": os.getgid(),
            }
        )
    )
    time.sleep(30)
