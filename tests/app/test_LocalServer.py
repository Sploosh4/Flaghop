import unittest
from unittest.mock import patch

from app.local_server import local_backend


class LocalBackendTest(unittest.TestCase):
    @patch("app.local_server.subprocess.Popen")
    @patch("app.local_server.backend_ready", return_value=True)
    def test_existing_service_is_not_started_or_stopped(self, ready, popen):
        with local_backend():
            ready.assert_called_once()
        popen.assert_not_called()

    @patch("app.local_server.time.sleep")
    @patch("app.local_server.subprocess.Popen")
    @patch("app.local_server.backend_ready", side_effect=[False, False, True])
    def test_owned_backend_is_stopped_when_window_exits(self, ready, popen, sleep):
        process = popen.return_value
        process.poll.return_value = None
        with local_backend():
            process.terminate.assert_not_called()
        process.terminate.assert_called_once_with()
        process.wait.assert_called_once_with(timeout=5)

    @patch("app.local_server.subprocess.Popen")
    @patch("app.local_server.backend_ready", return_value=False)
    def test_failed_startup_is_reported(self, ready, popen):
        process = popen.return_value
        process.poll.return_value = 1
        process.returncode = 1
        with self.assertRaisesRegex(RuntimeError, "exited during startup"):
            with local_backend():
                self.fail("Backend never became ready")

    @patch("app.local_server.subprocess.Popen")
    @patch("app.local_server.backend_ready", return_value=False)
    def test_startup_timeout_stops_the_child(self, ready, popen):
        process = popen.return_value
        process.poll.return_value = None
        with self.assertRaises(TimeoutError):
            with local_backend(startup_timeout=-1):
                self.fail("Backend never became ready")
        process.terminate.assert_called_once_with()
