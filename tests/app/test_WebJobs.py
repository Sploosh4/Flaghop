import time
import threading
import unittest


class WebJobManagerTest(unittest.TestCase):
    def test_partial_outcome_calls_its_completion_callback_once(self):
        from app.web.jobs import WebJobManager, JobOutcome

        completed = []
        manager = WebJobManager()
        job = manager.start(
            "fixture-partial",
            lambda: JobOutcome("partial", {"evidence": "saved"}, "tool missing"),
            on_finish=lambda row: completed.append(row),
        )
        finished = self._wait_for_state(manager, job["id"], {"partial"})
        self.assertEqual("partial", finished["status"])
        deadline = time.monotonic() + 1
        while not completed and time.monotonic() < deadline:
            time.sleep(0.01)
        self.assertEqual(1, len(completed))
        self.assertEqual("saved", completed[0]["result"]["evidence"])
        manager.cancel_job(job["id"])
        self.assertEqual(1, len(completed))

    def test_terminal_state_and_exclusive_release_wait_for_persistence(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager(worker_count=2)
        entered, release, following = threading.Event(), threading.Event(), threading.Event()
        self.addCleanup(release.set)
        published = []
        manager._on_change = lambda row, event: published.append((row["id"], event))

        def persist(row):
            self.assertEqual("completed", row["status"])
            # Reentrant reads must not deadlock, nor expose an unsettled result.
            self.assertEqual("running", manager.get_job(row["id"])["status"])
            from types import SimpleNamespace
            from app.web.runtime_process_jobs import stop_job

            response = stop_job(SimpleNamespace(jobs=manager), row["id"])
            self.assertFalse(response["stopped"])
            self.assertTrue(response["job"]["settling"])
            self.assertIn("saving", response["message"])
            entered.set()
            release.wait(3)

        first = manager.start("save-evidence", lambda: {"proof": "retained"}, exclusive=True, on_finish=persist)
        self.assertTrue(entered.wait(1))
        second = manager.start("next-project", lambda: (following.set(), {})[1])
        self.assertEqual("running", manager.get_job(first["id"])["status"])
        self.assertEqual("queued", manager.get_job(second["id"])["status"])
        self.assertNotIn((first["id"], "completed"), published)
        self.assertFalse(following.is_set())
        release.set()
        self.assertEqual("completed", self._wait_for_state(manager, first["id"], {"completed"})["status"])
        self.assertTrue(following.wait(1))

    def test_persistence_failure_is_visible_and_preserves_execution_result(self):
        from app.web.jobs import WebJobManager

        def fail(_row):
            raise OSError("fixture disk full")

        manager = WebJobManager()
        with self.assertLogs("app.web.jobs", level="ERROR"):
            job = manager.start("import", lambda: {"evidence": "original"}, on_finish=fail)
            settled = self._wait_for_state(manager, job["id"], {"failed", "completed"})
        self.assertEqual("failed", settled["status"])
        self.assertEqual("completed", settled["result"]["execution_status"])
        self.assertEqual("original", settled["result"]["evidence"])
        self.assertIn("fixture disk full", settled["error"])

    def test_queued_cancel_persists_before_notifying_and_does_not_execute(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager()
        gate, entered = threading.Event(), threading.Event()
        self.addCleanup(gate.set)
        manager.start("blocker", lambda: (entered.set(), gate.wait(3), {})[-1])
        self.assertTrue(entered.wait(1))
        events = []
        manager._on_change = lambda _row, event: events.append(event)
        job = manager.start(
            "cancel-me",
            lambda: self.fail("Cancelled runner executed"),
            on_finish=lambda row: events.append("persisted:" + row["status"]),
        )
        result = manager.cancel_job(job["id"])
        self.assertEqual("cancelled", result["status"])
        self.assertLess(events.index("persisted:cancelled"), events.index("cancelled"))
        manager.cancel_job(job["id"])
        self.assertEqual(1, events.count("persisted:cancelled"))
        gate.set()

    def test_active_queue_has_explicit_backpressure_without_dropping_pending_work(self):
        from app.web.jobs import WebJobManager

        gate, entered = threading.Event(), threading.Event()
        self.addCleanup(gate.set)
        manager = WebJobManager(max_jobs=20)
        first = manager.start("blocker", lambda: (entered.set(), gate.wait(4), {})[-1])
        self.assertTrue(entered.wait(1))
        pending = [manager.start("queued", lambda: {}) for _ in range(19)]
        with self.assertRaisesRegex(RuntimeError, "queue is full"):
            manager.start("overflow", lambda: self.fail("Overflow ran"))
        self.assertEqual(20, len(manager.list_jobs()))
        self.assertTrue(all(manager.get_job(row["id"])["status"] == "queued" for row in pending))
        gate.set()
        self.assertEqual("completed", self._wait_for_state(manager, first["id"], {"completed"})["status"])

    def test_invalid_runner_result_fails_without_losing_worker_or_exclusive_slot(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager()
        broken = manager.start("bad-result", lambda: "not a dictionary", exclusive=True)
        failed = self._wait_for_state(manager, broken["id"], {"failed"})
        self.assertEqual("failed", failed["status"])
        self.assertIn("result dictionary", failed["error"])
        next_job = manager.start("next", lambda: {"ok": True})
        self.assertEqual("completed", self._wait_for_state(manager, next_job["id"], {"completed"})["status"])

    def _wait_for_state(self, manager, job_id, states, timeout=1.5):
        deadline = time.time() + timeout
        while time.time() < deadline:
            job = manager.get_job(job_id)
            if job and job.get("status") in states:
                return job
            time.sleep(0.02)
        return manager.get_job(job_id)

    def test_job_completes_with_result(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager(max_jobs=20)
        job = manager.start("unit-test", lambda: {"ok": True})
        finished = self._wait_for_state(manager, job["id"], {"completed"})

        self.assertIsNotNone(finished)
        self.assertEqual("completed", finished["status"])
        self.assertEqual(True, finished["result"].get("ok"))

    def test_job_records_failure(self):
        from app.web.jobs import WebJobManager

        def _boom():
            raise RuntimeError("boom")

        manager = WebJobManager(max_jobs=20)
        job = manager.start("unit-test", _boom)
        finished = self._wait_for_state(manager, job["id"], {"failed"})

        self.assertIsNotNone(finished)
        self.assertEqual("failed", finished["status"])
        self.assertIn("boom", finished["error"])

    def test_queue_front_runs_before_waiting_jobs(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager(max_jobs=20)
        release_first = threading.Event()
        first_started = threading.Event()
        run_order = []

        def _first():
            first_started.set()
            release_first.wait(timeout=1.5)
            run_order.append("first")
            return {"ok": True}

        def _second():
            run_order.append("second")
            return {"ok": True}

        def _save():
            run_order.append("save")
            return {"ok": True}

        first = manager.start("nmap-scan", _first)
        self._wait_for_state(manager, first["id"], {"running"})
        self.assertTrue(first_started.is_set())

        second = manager.start("tool-run", _second)
        save = manager.start("project-save-as", _save, queue_front=True)

        release_first.set()
        self._wait_for_state(manager, save["id"], {"completed"})
        self._wait_for_state(manager, second["id"], {"completed"})

        self.assertEqual(["first", "save", "second"], run_order)

    def test_exclusive_job_waits_for_running_jobs_and_runs_before_later_jobs(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager(max_jobs=20, worker_count=3)
        release_gate = threading.Event()
        run_order = []

        def _first():
            release_gate.wait(timeout=1.5)
            run_order.append("first")
            return {"ok": True}

        def _second():
            release_gate.wait(timeout=1.5)
            run_order.append("second")
            return {"ok": True}

        def _save():
            run_order.append("save")
            return {"ok": True}

        def _third():
            run_order.append("third")
            return {"ok": True}

        first = manager.start("nmap-scan", _first)
        second = manager.start("tool-run", _second)
        self._wait_for_state(manager, first["id"], {"running"})
        self._wait_for_state(manager, second["id"], {"running"})

        save = manager.start("project-save-as", _save, queue_front=True, exclusive=True)
        third = manager.start("tool-run", _third)

        release_gate.set()
        self._wait_for_state(manager, save["id"], {"completed"})
        self._wait_for_state(manager, third["id"], {"completed"})

        self.assertIn("save", run_order)
        self.assertIn("third", run_order)
        self.assertLess(run_order.index("save"), run_order.index("third"))

    def test_cancel_queued_job_marks_cancelled(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager(max_jobs=20, worker_count=1)
        release_gate = threading.Event()
        run_order = []

        def _first():
            release_gate.wait(timeout=1.5)
            run_order.append("first")
            return {"ok": True}

        def _second():
            run_order.append("second")
            return {"ok": True}

        first = manager.start("nmap-scan", _first)
        self._wait_for_state(manager, first["id"], {"running"})
        second = manager.start("tool-run", _second)

        cancelled = manager.cancel_job(second["id"], reason="cancelled in test")
        self.assertIsNotNone(cancelled)
        self.assertEqual("cancelled", cancelled["status"])

        release_gate.set()
        self._wait_for_state(manager, first["id"], {"completed"})
        final_second = manager.get_job(second["id"])
        self.assertEqual("cancelled", final_second["status"])
        self.assertEqual(["first"], run_order)

    def test_cancel_running_job_marks_job_cancelled(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager(max_jobs=20, worker_count=1)
        job_ref = {"id": 0}

        def _runner():
            deadline = time.time() + 1.5
            while time.time() < deadline:
                if manager.is_cancel_requested(job_ref["id"]):
                    return {"cancelled": True}
                time.sleep(0.02)
            return {"timed_out": True}

        job = manager.start("long-running", _runner)
        job_ref["id"] = int(job["id"])
        self._wait_for_state(manager, job["id"], {"running"})

        manager.cancel_job(job["id"], reason="cancelled in test")
        finished = self._wait_for_state(manager, job["id"], {"cancelled"})
        self.assertIsNotNone(finished)
        self.assertEqual("cancelled", finished["status"])
        self.assertTrue(finished.get("cancel_requested"))

    def test_list_jobs_prioritizes_active_jobs_above_recent_inactive_jobs(self):
        from app.web.jobs import WebJobManager

        manager = WebJobManager(max_jobs=20, worker_count=2)
        release_gate = threading.Event()

        def _running():
            release_gate.wait(timeout=1.5)
            return {"ok": True}

        running_job = manager.start("long-running", _running)
        self._wait_for_state(manager, running_job["id"], {"running"})

        completed_ids = []
        for index in range(4):
            job = manager.start(f"quick-{index}", lambda idx=index: {"index": idx})
            completed_ids.append(int(job["id"]))

        self._wait_for_state(manager, completed_ids[-1], {"completed"})

        listed = manager.list_jobs(limit=2)
        listed_ids = [int(job.get("id") or 0) for job in listed]
        listed_statuses = [str(job.get("status") or "") for job in listed]

        self.assertEqual(int(running_job["id"]), listed_ids[0])
        self.assertEqual("running", listed_statuses[0])
        self.assertEqual(3, len(listed))
        self.assertEqual(completed_ids[-1], listed_ids[1])
        self.assertEqual(completed_ids[-2], listed_ids[2])

        release_gate.set()
        self._wait_for_state(manager, running_job["id"], {"completed"})


if __name__ == "__main__":
    unittest.main()
