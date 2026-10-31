import threading
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.importers.session import ImportSession
from app.services.events import EventStream
from app.services.processes import ProcessRegistry
from app.services.workspace import WorkspaceSession
from app.scheduler.state_support.storage import ensure_scheduler_target_state_table


class ServiceOwnershipTest(unittest.TestCase):
    def test_workspaces_and_process_registries_do_not_share_mutable_state(self):
        first, second = WorkspaceSession(), WorkspaceSession()
        first.autosave.last_error = "fixture error"
        self.assertEqual("", second.autosave.last_error)
        first, second = ProcessRegistry(), ProcessRegistry()
        first.register(7, 12)
        first.register(7, 13)
        first.unregister(12)
        self.assertEqual([13], first.members(7))
        self.assertEqual([], second.members(7))
        first.unregister(13)
        self.assertEqual({}, first.job_process_ids)
        self.assertEqual({}, first.process_job_id)

    def test_event_stream_is_bounded_and_merges_pending_channels(self):
        events = EventStream()
        other = EventStream()
        for _ in range(300):
            events.emit("jobs", "jobs")
        events.emit("hosts")
        self.assertEqual(256, len(events.events))
        event = events.wait(after_seq=0, timeout_seconds=0.01)
        self.assertEqual(["hosts", "jobs"], event["channels"])
        self.assertEqual(301, event["seq"])
        self.assertEqual([], other.events)
        self.assertEqual("heartbeat", events.wait(after_seq=301, timeout_seconds=0.001)["type"])

    def test_import_failure_rolls_back_closes_and_releases_lock(self):
        database = SimpleNamespace(session=MagicMock(), dbsemaphore=threading.Semaphore(1))
        error = ValueError("fixture import failed")
        database.session.return_value.rollback.side_effect = OSError("fixture rollback failed")
        with self.assertLogs("app.importers.session", level="ERROR"):
            with self.assertRaises(ValueError) as caught:
                with ImportSession(database) as unit:
                    unit.acquire_write_lock()
                    raise error
        self.assertIs(error, caught.exception)
        database.session.return_value.close.assert_called_once()
        self.assertTrue(database.dbsemaphore.acquire(blocking=False))
        database.dbsemaphore.release()

    def test_required_schema_error_reaches_caller_after_rollback(self):
        database = SimpleNamespace(session=MagicMock())
        database.session.return_value.execute.side_effect = RuntimeError("fixture schema failure")
        with self.assertRaisesRegex(RuntimeError, "fixture schema failure"):
            ensure_scheduler_target_state_table(database)
        database.session.return_value.rollback.assert_called_once()
        database.session.return_value.close.assert_called_once()

    def test_process_runner_uses_explicit_ports_and_cleans_up_after_a_real_local_command(self):
        import shlex
        import sys
        from app.processes.models import CommandRequest, ExecutionPorts, ExecutionResult
        from app.processes.runner import ProcessRunner

        registry = ProcessRegistry()
        repository = MagicMock()
        repository.storeProcess.return_value = 42
        ports = ExecutionPorts(
            repository=lambda: repository,
            registry=registry,
            jobs=SimpleNamespace(is_cancel_requested=lambda _: False),
            collect_command_artifacts=lambda _: [],
            emit_ui_invalidation=lambda *args, **kwargs: None,
            process_progress_adapter_for_command=lambda *args: "",
            process_tree_activity_changed=lambda *args: False,
            register_job_process=registry.register,
            resolve_process_timeout_policy=lambda *args: {"inactivity_timeout_seconds": 5},
            sample_process_tree_activity=lambda _: None,
            signal_process_tree=lambda proc, force: proc.kill() if force else proc.terminate(),
            unregister_job_process=registry.unregister,
            update_process_progress=lambda *args, **kwargs: None,
            write_process_output_partial=lambda *args: None,
        )
        request = CommandRequest(
            tool_name="fixture",
            tab_title="fixture",
            host_ip="",
            port="",
            protocol="tcp",
            command=shlex.join([sys.executable, "-c", "print('local fixture output')"]),
            outputfile="",
            timeout=5,
            job_id=7,
        )
        result = ProcessRunner(ports).run(request)
        self.assertIsInstance(result, ExecutionResult)
        self.assertTrue(result.executed, result.reason)
        self.assertEqual(42, result.process_id)
        self.assertEqual("process_output:42", result.metadata["stdout_ref"])
        self.assertIn("local fixture output", repository.storeProcessOutput.call_args.args[1])
        self.assertEqual({}, registry.active)
        self.assertEqual([], registry.members(7))
        self.assertEqual({}, registry.process_job_id)
