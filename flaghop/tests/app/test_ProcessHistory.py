"""Bounded adoption history with atomic preservation and no imported authority."""

import json
from pathlib import Path
import tracemalloc
from unittest import TestCase
from unittest.mock import patch
from sqlalchemy import text
from pydantic import ValidationError
from app.contracts.observations.process_history import ProcessHistoryOrigin
from app.services.process_history import reconcile, origin_view, MAX_ORIGIN
from tests.app import test_ProjectHub as fixtures


class ProcessHistoryTest(TestCase):
    setUp = fixtures.ProjectHubTest.setUp
    tearDown = fixtures.ProjectHubTest.tearDown

    def test_large_history_reconciliation_has_bounded_python_working_memory(self):
        self.hub.create("Large historical controls")
        project = self.logic.activeProject
        count = 5000
        with project.database.engine.begin() as connection:
            connection.execute(
                text("INSERT INTO process (pid,status,command) VALUES ('999999','Running','original command')"),
                [{} for _ in range(count)],
            )
        tracemalloc.start()
        try:
            reconcile(project, copied=True, owner_id="copied-fixture")
            _, peak = tracemalloc.get_traced_memory()
        finally:
            tracemalloc.stop()
        self.assertLess(peak, 4 * 1024 * 1024)
        with project.database.engine.connect() as connection:
            self.assertEqual(
                count,
                connection.execute(
                    text(
                        "SELECT COUNT(*) FROM process WHERE status='Interrupted' AND pid='-1' AND execution_id IS NULL AND command='original command'"
                    )
                ).scalar(),
            )
            self.assertEqual(count, connection.execute(text("SELECT COUNT(*) FROM flaghop_process_history")).scalar())
        print(
            json.dumps(
                {"process_history_rows": count, "python_peak_bytes": peak, "memory_budget_bytes": 4 * 1024 * 1024}
            )
        )

    def test_oversized_control_rejects_restore_without_truncation_or_adoption(self):
        row = self.hub.create("Oversized historical control")["project"]
        project = self.logic.activeProject
        original_pid = "9" * 65536
        with project.database.engine.begin() as connection:
            connection.execute(text("INSERT INTO process (pid,status) VALUES (:pid,'Running')"), {"pid": original_pid})
        original = Path(row["path"]).read_bytes()
        catalog = self.hub._read()
        bundle, _ = self.hub.operations.bundle(row["id"])
        self.addCleanup(Path(bundle).unlink, missing_ok=True)
        with self.assertRaisesRegex(ValueError, "control exceeds supported bounds"):
            self.hub.operations.restore_zip(bundle)
        self.assertIs(project, self.logic.activeProject)
        self.assertEqual(catalog, self.hub._read())
        self.assertEqual(original, Path(row["path"]).read_bytes())
        with project.database.engine.connect() as connection:
            self.assertEqual(original_pid, connection.execute(text("SELECT pid FROM process")).scalar())

    def test_invalid_or_oversized_stored_provenance_is_bounded_before_parsing(self):
        self.hub.create("Invalid historical provenance")
        project = self.logic.activeProject
        with self.assertRaises(ValidationError):
            ProcessHistoryOrigin(original_controls={}, events=[])
        for raw in (json.dumps({"original_controls": {}, "events": []}), " " * (MAX_ORIGIN + 1), b"{}", 42):
            with self.subTest(type=type(raw).__name__):
                with project.database.engine.begin() as connection:
                    connection.execute(
                        text(
                            "CREATE TABLE IF NOT EXISTS flaghop_process_history (process_id INTEGER PRIMARY KEY,provenance TEXT NOT NULL)"
                        )
                    )
                    connection.execute(
                        text(
                            "INSERT INTO flaghop_process_history VALUES (1,:raw) ON CONFLICT(process_id) DO UPDATE SET provenance=excluded.provenance"
                        ),
                        {"raw": raw},
                    )
                original = Path(project.properties.projectName).read_bytes()
                with self.assertRaisesRegex(ValueError, "provenance"):
                    reconcile(project, copied=True)
                with self.assertRaisesRegex(ValueError, "provenance"):
                    origin_view(project, 1)
                self.assertEqual(original, Path(project.properties.projectName).read_bytes())

    def test_bounded_legacy_timing_text_is_preserved_as_history(self):
        self.hub.create("Legacy timing text")
        project = self.logic.activeProject
        with project.database.engine.begin() as connection:
            connection.execute(
                text("INSERT INTO process (pid,status,estimatedRemaining) VALUES ('999999','Waiting','unknown')")
            )
        reconcile(project, copied=True)
        with project.database.engine.connect() as connection:
            origin = json.loads(connection.execute(text("SELECT provenance FROM flaghop_process_history")).scalar())
            self.assertEqual("unknown", origin["original_controls"]["estimatedRemaining"])
            self.assertEqual(
                ("Interrupted", None),
                tuple(connection.execute(text("SELECT status,estimatedRemaining FROM process")).first()),
            )

    def test_later_batch_failure_rolls_back_all_controls_and_provenance(self):
        self.hub.create("Atomic historical controls")
        project = self.logic.activeProject
        with project.database.engine.begin() as connection:
            connection.execute(
                text("INSERT INTO process (pid,status) VALUES ('999999','Running')"), [{} for _ in range(40)]
            )
        original = Path(project.properties.projectName).read_bytes()
        # Break after the first32-row batch has written real SQL updates.
        from app.services import process_history

        original_model = process_history.ProcessHistoryOrigin
        seen = 0

        def fail(*args, **kwargs):
            nonlocal seen
            seen += 1
            if seen == 35:
                raise OSError("later bounded batch failure")
            return original_model(*args, **kwargs)

        with patch.object(process_history, "ProcessHistoryOrigin", side_effect=fail):
            with self.assertRaisesRegex(OSError, "later bounded batch"):
                reconcile(project, copied=True)
        self.assertEqual(original, Path(project.properties.projectName).read_bytes())
        with project.database.engine.connect() as connection:
            self.assertEqual(
                40,
                connection.execute(
                    text("SELECT COUNT(*) FROM process WHERE status='Running' AND pid='999999'")
                ).scalar(),
            )
            self.assertIsNone(
                connection.execute(text("SELECT name FROM sqlite_master WHERE name='flaghop_process_history'")).scalar()
            )
