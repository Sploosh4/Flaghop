"""Keep the web/backend independent of the optional desktop toolkit."""

from fastapi.testclient import TestClient

import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from app.core.events import EventHook
from app.web.services.settings_service import _refresh_runtime_settings


class BackendIsolationTest(unittest.TestCase):

    def test_backend_starts_and_serves_without_qt(self):
        root = Path(__file__).resolve().parents[2]
        with tempfile.TemporaryDirectory() as folder:
            env = dict(os.environ, LEGION_HOME=folder)
            result = subprocess.run(
                [
                    sys.executable,
                    "-c",
                    "\nimport sys\nsys.modules['PyQt6'] = None\nfrom app.web.bootstrap import create_default_logic\nfrom app.web.runtime import WebRuntime\nfrom app.services.execution_journal import ExecutionJournal\nfrom pathlib import Path\nimport os\nfrom app.api import create_app\nfrom fastapi.testclient import TestClient\nlogic = create_default_logic()\ntry:\n    client = TestClient(create_app(WebRuntime(logic, execution_journal=ExecutionJournal(Path(os.environ['LEGION_HOME'])/'protected-executions'))))\n    assert client.get('/health').status_code == 200\n    assert client.get('/api/graph').status_code == 200\n    from app.api import create_app as create_native_app\n    from fastapi.testclient import TestClient\n    with TestClient(create_native_app(WebRuntime(logic, execution_journal=ExecutionJournal(Path(os.environ['LEGION_HOME'])/'protected-executions')))) as native:\n        assert native.get('/health').headers['X-Legion-API'] == 'fastapi'\n        assert native.get('/api/project').status_code == 200\n        assert native.get('/api/graph').status_code == 200\nfinally:\n    logic.projectManager.closeProject(logic.activeProject)\n",
                ],
                cwd=root,
                env=env,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                timeout=20,
            )
            self.assertEqual(0, result.returncode, result.stdout[-5000:])

    def test_failed_settings_reload_preserves_live_configuration(self):
        runtime = SimpleNamespace(settings_file=object(), settings=object())
        before = runtime.settings_file, runtime.settings
        with (
            patch("app.web.services.settings_service.AppSettings"),
            patch("app.web.services.settings_service.Settings", side_effect=ValueError("invalid settings")),
        ):
            with self.assertRaisesRegex(ValueError, "invalid settings"):
                _refresh_runtime_settings(runtime)
        self.assertEqual(before, (runtime.settings_file, runtime.settings))

    def test_event_callback_failure_is_visible_and_other_listeners_continue(self):
        hook = EventHook()
        received = []
        hook.connect(lambda value: (_ for _ in ()).throw(ValueError("bad listener")))
        hook.connect(received.append)
        with self.assertLogs("app.core.events", level="ERROR") as logs:
            hook.emit(25)
        self.assertEqual([25], received)
        self.assertIn("bad listener", "\n".join(logs.output))
