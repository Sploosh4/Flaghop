"""Controls for the observer-owned command recorder and evidence checker."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('v3_acceptance', HERE / 'acceptance.py')
acceptance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acceptance)


class HarnessControls(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='cp-v3-harness-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'app.py').write_text('print("fixture")\n')
        self.output = self.root / 'receipt with spaces.json'

    def record(self, script, expect=0, timeout=5):
        process = subprocess.run([sys.executable, '-B', str(HERE / 'record_command.py'),
              '--project', str(self.root), '--output', str(self.output), '--category', 'fixture',
              '--fixture', 'disposable harness control', '--expect-exit', str(expect),
              '--timeout', str(timeout), '--', sys.executable, '-B', '-c', script],
              capture_output=True, text=True, timeout=10)
        return process, json.loads(self.output.read_text())

    def test_failure_exit_is_preserved_even_when_expected(self):
        process, receipt = self.record('import sys; print("canary"); sys.exit(7)', expect=7)
        self.assertEqual(process.returncode, 7)
        self.assertEqual(receipt['exit_code'], 7)
        self.assertTrue(receipt['expected_result_observed'])

    def test_output_is_drained_and_bounded(self):
        process, receipt = self.record('print("x" * 2000000)')
        self.assertEqual(process.returncode, 0)
        self.assertTrue(receipt['logs']['stdout']['truncated'])
        self.assertEqual(receipt['logs']['stdout']['captured_bytes'], 256 * 1024)
        self.assertGreater(receipt['logs']['stdout']['total_bytes'], 2000000)

    def test_deadline_applies_when_child_closes_its_pipes(self):
        process, receipt = self.record('import os,time; os.close(1); os.close(2); time.sleep(20)', timeout=0.2)
        self.assertEqual(process.returncode, 124)
        self.assertTrue(receipt['timed_out'])
        self.assertFalse(receipt['expected_result_observed'])

    def test_failed_expectation_is_not_passing_receipt(self):
        _, receipt = self.record('raise SystemExit(3)', expect=0)
        acceptance.OPTIONS = argparse.Namespace(project=self.root)
        with self.assertRaises(AssertionError):
            acceptance.check_receipt(self, receipt)

    def test_tampered_log_is_rejected(self):
        _, receipt = self.record('print("original")')
        acceptance.OPTIONS = argparse.Namespace(project=self.root)
        acceptance.check_receipt(self, receipt)
        Path(receipt['logs']['stdout']['path']).write_text('changed')
        with self.assertRaises(AssertionError):
            acceptance.check_receipt(self, receipt)

    def test_source_change_invalidates_receipt(self):
        _, receipt = self.record('print("unchanged")')
        acceptance.OPTIONS = argparse.Namespace(project=self.root)
        (self.root / 'app.py').write_text('print("new revision")\n')
        with self.assertRaises(AssertionError):
            acceptance.check_receipt(self, receipt)

    def test_existing_receipt_is_never_overwritten(self):
        self.record('print("first")')
        saved = self.output.read_bytes()
        self.assertNotEqual(subprocess.run([sys.executable, '-B', str(HERE / 'record_command.py'),
              '--project', str(self.root), '--output', str(self.output), '--category', 'fixture',
              '--fixture', 'again', '--', sys.executable, '-c', 'print("second")'],
              capture_output=True, timeout=10).returncode, 0)
        self.assertEqual(self.output.read_bytes(), saved)


if __name__ == '__main__':
    unittest.main()
