from __future__ import annotations

import logging
import json
import subprocess
import time

from sqlalchemy import text

from db.entities.l1script import l1ScriptObj

_PROCESS_READER_EXIT_GRACE_SECONDS = 2.0
_PROCESS_CRASH_MIN_RUNTIME_SECONDS = 5.0


def execute_command(runtime, **kwargs):
    """Application adapter; all process logic returns a consistent result object."""
    from types import SimpleNamespace
    from app.processes.models import CommandRequest, ExecutionPorts
    from app.processes.runner import ProcessRunner
    from app.services.project_networks import network_service
    from app.services.network_guard import NetworkLease

    request = CommandRequest(**kwargs)
    guard = NetworkLease(network_service(runtime), request)
    with runtime._lock:
        execution_project = runtime._require_active_project()

    def repository():
        with runtime._lock:
            runtime._ensure_process_tables()
            return execution_project.repositoryContainer.processRepository

    def record_network(process_id, lease):
        if not lease.report:
            return
        context = {**(lease.reference or {}), "revision": lease.report["revision"], "observation": lease.report}
        if getattr(lease, "snapshot", None):
            context.update(
                settings=lease.snapshot["prefs"].model_dump(),
                connector=lease.snapshot["connector"],
                execution_environment="local",
            )
        session = execution_project.database.session()
        try:
            session.execute(
                text(
                    "INSERT INTO process_network_context (process_id, context) VALUES (:id, :context) "
                    "ON CONFLICT(process_id) DO UPDATE SET context = excluded.context"
                ),
                {"id": process_id, "context": json.dumps(context)},
            )
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    registry = getattr(runtime, "process_registry", None)
    if registry is None:
        registry = SimpleNamespace(
            lock=runtime._process_runtime_lock, active=runtime._active_processes, kill_requests=runtime._kill_requests
        )
    ports = ExecutionPorts(
        repository=repository,
        registry=registry,
        jobs=getattr(runtime, "jobs", None),
        collect_command_artifacts=runtime._collect_command_artifacts,
        emit_ui_invalidation=runtime._emit_ui_invalidation,
        process_progress_adapter_for_command=runtime._process_progress_adapter_for_command,
        process_tree_activity_changed=runtime._process_tree_activity_changed,
        register_job_process=runtime._register_job_process,
        resolve_process_timeout_policy=runtime._resolve_process_timeout_policy,
        sample_process_tree_activity=runtime._sample_process_tree_activity,
        signal_process_tree=runtime._signal_process_tree,
        unregister_job_process=runtime._unregister_job_process,
        update_process_progress=runtime._update_process_progress,
        write_process_output_partial=runtime._write_process_output_partial,
        network_guard=guard,
        record_network_context=record_network,
    )
    return ProcessRunner(
        ports,
        reader_exit_grace=_PROCESS_READER_EXIT_GRACE_SECONDS,
        crash_min_runtime=_PROCESS_CRASH_MIN_RUNTIME_SECONDS,
    ).run(request)


def run_command_with_tracking(runtime, *, return_metadata=False, **kwargs):
    """Compatibility tuple API for existing plugins and runtime callers."""
    return execute_command(runtime, **kwargs).as_legacy(return_metadata)


def write_process_output_partial(runtime, process_id: int, output_text: str):
    with runtime._lock:
        project = getattr(runtime.logic, "activeProject", None)
        if not project:
            return
        runtime._ensure_process_tables()
        session = project.database.session()
        try:
            session.execute(
                text(
                    "INSERT INTO process_output (processId, output) "
                    "SELECT :process_id, '' "
                    "WHERE NOT EXISTS (SELECT 1 FROM process_output WHERE processId = :process_id)"
                ),
                {"process_id": int(process_id)},
            )
            session.execute(
                text("UPDATE process_output SET output = :output WHERE processId = :process_id"),
                {"process_id": int(process_id), "output": str(output_text)},
            )
            session.commit()
        except Exception:
            session.rollback()
            logging.getLogger(__name__).exception("Unable to persist partial process output for %s", process_id)
        finally:
            session.close()


def save_script_result_if_missing(runtime, host_ip: str, port: str, protocol: str, tool_id: str, process_id: int):
    with runtime._lock:
        project = getattr(runtime.logic, "activeProject", None)
        if not project:
            return

        host = project.repositoryContainer.hostRepository.getHostByIP(str(host_ip))
        if not host:
            return

        port_obj = project.repositoryContainer.portRepository.getPortByHostIdAndPort(
            host.id,
            str(port),
            str(protocol or "tcp").lower(),
        )
        if not port_obj:
            return

        script_repo = project.repositoryContainer.scriptRepository
        for existing in script_repo.getScriptsByPortId(port_obj.id):
            if str(getattr(existing, "scriptId", "")) == str(tool_id):
                return

        process_output = runtime.get_process_output(int(process_id))
        output_text = str(process_output.get("output", "") or "")

        session = project.database.session()
        try:
            row = l1ScriptObj(str(tool_id), output_text, str(port_obj.id), str(host.id))
            session.add(row)
            session.commit()
        except Exception:
            session.rollback()
            logging.getLogger(__name__).exception("Unable to persist partial process output for %s", process_id)
        finally:
            session.close()
