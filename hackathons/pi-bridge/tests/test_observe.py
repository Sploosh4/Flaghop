import json
import os
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from observe import SessionIndex, atomic_output, clean, describe, scanner_snapshot


class ObserveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "session.jsonl"
        self.path.touch()
        self.index = SessionIndex(self.path)
        self.metadata = {"agent_id": "0123456789abcdef", "name": "Fixture", "status": "running"}

    def append(self, message, stamp=1700000000, identifier="entry"):
        event = {"type": "message", "id": identifier, "timestamp": stamp, "message": message}
        with self.path.open("a") as stream:
            stream.write(json.dumps(event) + "\n")

    def call(self, identifier="one", tool="bash", command="echo hello", stamp=1700000000):
        self.append({"role": "assistant", "content": [{"type": "toolCall", "id": identifier,
                     "name": tool, "arguments": {"command": command}}]}, stamp)

    def result(self, identifier="one", error=False, duration=123, stamp=1700000001, text="hello"):
        self.append({"role": "toolResult", "toolName": "bash", "toolCallId": identifier,
                     "content": [{"type": "text", "text": text}], "isError": error, "durationMs": duration}, stamp)

    def snapshot(self, **kwargs):
        self.index.update()
        return self.index.snapshot(self.metadata, **kwargs)

    def test_reported_duration_and_call_correlation(self):
        self.call()
        self.result(duration=123)
        data = self.snapshot()
        self.assertEqual(data["counts"]["calls"], 1)
        self.assertEqual(data["counts"]["succeeded"], 1)
        self.assertEqual(data["calls"][0]["duration_ms"], 123)
        self.assertEqual(data["calls"][0]["timing_basis"], "pi_reported")
        self.assertEqual(data["tools"][0]["p95_ms"], 123)

    def test_errors_and_nonzero_exit_codes(self):
        self.call()
        self.result(text="error\nCommand exited with code 7", error=False)
        data = self.snapshot()
        self.assertEqual(data["calls"][0]["status"], "failed")
        self.assertEqual(data["calls"][0]["exit_code"], 7)
        self.assertIn("error", data["calls"][0]["error_preview"])

    def test_pending_is_not_automatically_failed_or_proven_started(self):
        self.call()
        data = self.snapshot()
        self.assertEqual(data["calls"][0]["status"], "awaiting_result")
        self.assertIsNone(data["calls"][0]["duration_ms"])
        self.metadata["status"] = "completed"
        self.assertEqual(self.snapshot()["calls"][0]["status"], "incomplete")

    def test_missing_duration_is_labelled_estimate_and_excluded_from_latency(self):
        self.call(stamp=1700000000)
        self.result(duration=None, stamp=1700000002)
        data = self.snapshot()
        self.assertEqual(data["calls"][0]["duration_ms"], 2000)
        self.assertTrue(data["calls"][0]["timing_basis"].startswith("estimated"))
        self.assertEqual(data["tools"][0]["reported_duration_count"], 0)
        self.assertIsNone(data["tools"][0]["p95_ms"])

    def test_partial_append_incremental_update_and_no_duplicate_counts(self):
        self.call()
        self.index.update()
        self.assertEqual(self.index.update(), 0)
        result = json.dumps({"message": {"role": "toolResult", "toolCallId": "one", "isError": False}})
        with self.path.open("a") as stream:
            stream.write(result[:20])
        self.assertEqual(self.snapshot()["counts"]["awaiting_result"], 1)
        with self.path.open("a") as stream:
            stream.write(result[20:] + "\n")
        self.assertEqual(self.snapshot()["counts"]["succeeded"], 1)
        self.result()
        self.assertEqual(self.snapshot()["counts"]["calls"], 1)

    def test_truncation_resets_old_session_data(self):
        self.call()
        self.result()
        self.snapshot()
        self.path.write_text("")
        self.assertEqual(self.snapshot()["counts"]["calls"], 0)

    def test_memory_retention_is_explicit(self):
        self.index = SessionIndex(self.path, max_calls=2)
        for identifier in ("a", "b", "c"):
            self.call(identifier)
            self.result(identifier)
        data = self.snapshot()
        self.assertEqual(data["counts"]["calls"], 2)
        self.assertEqual(data["calls_dropped_by_memory_limit"], 1)

    def test_filters_and_repeated_failures(self):
        for identifier in ("a", "b"):
            self.call(identifier)
            self.result(identifier, error=True, duration=500)
        self.call("success", stamp=1700000010, command="echo different")
        self.result("success", stamp=1700000011)
        data = self.snapshot(status="failed", slow_ms=400)
        self.assertEqual(len(data["calls"]), 2)
        self.assertEqual(data["repeated_identical_calls"][0]["failures"], 2)
        self.assertEqual(self.snapshot(since=1700000005)["counts"]["calls"], 1)

    def test_previews_do_not_copy_file_contents_and_redact_common_credentials(self):
        _, preview = describe("write", {"path": "/tmp/file", "content": "DO_NOT_COPY_THIS_BODY"})
        self.assertNotIn("DO_NOT_COPY_THIS_BODY", preview)
        _, preview = describe("bash", {"command": "API_KEY=supersecret echo --password hunter2\nprint('private body')"})
        self.assertNotIn("supersecret", preview)
        self.assertNotIn("hunter2", preview)
        self.assertNotIn("private body", preview)
        self.assertNotIn("secret", clean("Authorization: Bearer secret"))
        self.assertNotIn("hidden", clean("\x1b]52;c;hidden\x07visible"))

    def test_model_usage_not_duplicated_by_refresh(self):
        self.append({"role": "assistant", "content": [], "usage": {"input": 2, "output": 3,
                     "totalTokens": 5, "cost": {"total": 0.01}}})
        self.assertEqual(self.snapshot()["model"]["reported_cost_usd"], .01)
        self.assertEqual(self.snapshot()["model"]["reported_usage"]["totalTokens"], 5)

    def test_malformed_lines_are_counted_not_silently_accepted(self):
        self.path.write_text("bad json\n[]\n")
        self.assertEqual(self.snapshot()["parse_warnings"]["malformed_lines"], 2)

    def test_atomic_snapshot_is_small_private_and_bounded(self):
        output = Path(self.temp.name) / "current.json"
        atomic_output(output, {"one": 1})
        self.assertEqual(json.loads(output.read_text()), {"one": 1})
        self.assertEqual(output.stat().st_mode & 0o777, 0o600)
        with self.assertRaisesRegex(ValueError, "2 MiB"):
            atomic_output(output, {"large": "x" * (3 * 1024 * 1024)})
        self.assertEqual(json.loads(output.read_text()), {"one": 1})

    def test_scanner_execution_and_parse_status_remain_distinct(self):
        profile = Path(self.temp.name) / "profile.json"
        profile.write_text(json.dumps({"tasks": [{"id": "fingerprintx", "tool": "fingerprintx",
            "status": "completed", "parse_status": "failed", "duration_seconds": .4,
            "parse_error": "invalid artifact"}], "validated_vulnerabilities": [{"status": "candidate"}]}))
        data = scanner_snapshot(profile)
        self.assertEqual(data["tasks"][0]["execution_status"], "completed")
        self.assertEqual(data["tasks"][0]["outcome"], "parse_failed")
        self.assertEqual(data["tasks"][0]["duration_ms"], 400)
        self.assertEqual(data["reproduced_findings"], 0)


if __name__ == "__main__":
    unittest.main()
