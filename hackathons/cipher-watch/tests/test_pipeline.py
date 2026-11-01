import base64
from dataclasses import replace
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest

from cipher_watch.adapters import parse_ciphey, run_tool
from cipher_watch.extract_bridge import extract
from cipher_watch.scanner import Scanner, Settings

ROOT = Path(__file__).resolve().parent.parent
B64DUMP = ROOT / ".tools/base64dump.py"
CIPHEY = ROOT / ".tools/ciphey"
MESSAGE = b"hello there general"


def wait_for(check, seconds=15):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        result = check()
        if result:
            return result
        time.sleep(0.1)
    raise AssertionError("Timed out waiting for filesystem evidence")


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.inbox = self.root / "inbox"
        self.inbox.mkdir()
        self.out = self.root / "results"
        self.scanner = Scanner(self.inbox, self.out, B64DUMP, CIPHEY,
                               Settings(regex="hello there general", decode_seconds=1, file_seconds=8))
        self.addCleanup(self.temp.cleanup)
        self.addCleanup(self.scanner.close)

    def reports(self):
        return [json.loads(p.read_text()) for p in self.out.glob("versions/*/*/report.json")]

    def test_real_embedded_multilayer_decode_preserves_original_and_location(self):
        encoded = base64.b64encode(base64.b64encode(base64.b64encode(MESSAGE)))
        data = b'comment\npayload="' + encoded + b'"\n'
        source = self.inbox / "nested.json"
        source.write_bytes(data)
        before = source.stat()
        report = json.loads(self.scanner.scan(source).read_text())
        self.assertEqual(report["status"], "complete")
        finding = report["findings"][0]
        self.assertEqual(finding["text"], MESSAGE.decode())
        self.assertEqual(finding["steps"], ["base64dump:b64", "Base64", "Base64"])
        self.assertEqual(finding["location"]["offset"], data.index(encoded))
        self.assertEqual(finding["location"]["line"], 2)
        self.assertEqual(source.read_bytes(), data)
        self.assertEqual(source.stat().st_mtime_ns, before.st_mtime_ns)
        self.assertEqual(report["source"]["sha256"], hashlib.sha256(data).hexdigest())
        self.assertFalse(finding["human_verified"])
        self.assertIsNone(report["legion_export"]["host_ip"])

    def test_real_hex(self):
        path = self.inbox / "hex.txt"
        path.write_text('payload="' + MESSAGE.hex() + '"')
        r = json.loads(self.scanner.scan(path).read_text())
        self.assertEqual(r["findings"][0]["text"], MESSAGE.decode())
        self.assertEqual(r["findings"][0]["steps"], ["base64dump:hex"])

    def test_duplicate_occurrences_preserve_both_locations(self):
        encoded = base64.b64encode(MESSAGE)
        data = b'"' + encoded + b'"\n"' + encoded + b'"'
        result = extract(B64DUMP, data, ["b64"], 8, 1000, 64)
        self.assertEqual(len(result["candidates"]), 2)
        self.assertEqual([c["line"] for c in result["candidates"]], [1, 2])

    def test_restart_deduplicates_and_edits_keep_old_results(self):
        path = self.inbox / "note.txt"
        path.write_bytes(base64.b64encode(MESSAGE))
        first = self.scanner.scan(path)
        self.assertIsNone(self.scanner.scan(path))
        other = Scanner(self.inbox, self.out, B64DUMP, CIPHEY, self.scanner.settings)
        try:
            self.assertIsNone(other.scan(path))
            path.write_bytes(b'"' + base64.b64encode(MESSAGE) + b'"')
            second = other.scan(path)
            self.assertNotEqual(first, second)
            self.assertTrue(first.is_file())
            self.assertEqual(len(self.reports()), 2)
        finally:
            other.close()

    def test_limits_are_visible(self):
        path = self.inbox / "large.txt"
        path.write_bytes(b'x' * 100)
        self.scanner.settings = replace(self.scanner.settings, max_file_bytes=10)
        report = json.loads(self.scanner.scan(path).read_text())
        self.assertEqual(report["status"], "skipped")
        self.assertIn("file_size_limit", report["coverage"]["warnings"])
        encoded = base64.b64encode(MESSAGE)
        other = base64.b64encode(b'a different message')
        extraction = extract(B64DUMP, b'"' + encoded + b'" "' + other + b'"', ["b64"], 8, 1000, 1)
        self.assertEqual(len(extraction["candidates"]), 1)
        self.assertIn("candidate_count_limit", extraction["warnings"])

    def test_candidate_size_limit(self):
        result = extract(B64DUMP, base64.b64encode(MESSAGE), ["b64"], 8, 10, 64)
        self.assertEqual(result["candidates"], [])
        self.assertIn("candidate_size_limit", result["warnings"])

    def test_binary_first_layer_is_preserved(self):
        path = self.inbox / "binary.txt"
        original = bytes(range(256))
        path.write_bytes(base64.b64encode(original))
        ref = self.scanner.scan(path)
        report = json.loads(ref.read_text())
        c = report["candidates"][0]
        self.assertEqual(c["status"], "binary_first_layer")
        self.assertEqual((ref.parent / c["binary_file"]).read_bytes(), original)
        self.assertEqual(report["findings"], [])

    def test_symlinks_and_special_files_are_not_scanned(self):
        outside = self.root / "outside.txt"
        outside.write_bytes(base64.b64encode(MESSAGE))
        link = self.inbox / "link.txt"
        link.symlink_to(outside)
        self.assertIsNone(self.scanner.scan(link))
        directory = self.inbox / "linked-dir"
        directory.symlink_to(self.root)
        self.assertNotIn(link, list(self.scanner.files()))
        fifo = self.inbox / "pipe"
        os.mkfifo(fifo)
        self.assertIsNone(self.scanner.scan(fifo))

    def test_overlap_rejected(self):
        for out in [self.inbox, self.inbox / "results", self.root]:
            with self.assertRaises(ValueError):
                Scanner(self.inbox, out, B64DUMP, CIPHEY)

    def test_ignore_patterns(self):
        self.scanner.settings = replace(self.scanner.settings, ignore=("*.tmp",))
        path = self.inbox / "scratch.tmp"
        path.write_bytes(base64.b64encode(MESSAGE))
        self.assertIsNone(self.scanner.scan(path))

    def test_html_escapes_decoded_content_and_paths(self):
        path = self.inbox / "<img onerror=alert(1)>.txt"
        path.write_bytes(base64.b64encode(MESSAGE))
        self.scanner.scan(path)
        rendered = (self.out / "index.html").read_text()
        self.assertIn("&lt;img", rendered)
        self.assertNotIn("<img onerror", rendered)

    def test_tool_error_and_timeout_are_not_no_findings(self):
        fake = self.root / "broken-ciphey"
        fake.write_text('#!/bin/sh\necho failure >&2\nexit 7\n')
        fake.chmod(0o755)
        self.scanner.ciphey = fake
        path = self.inbox / "candidate.txt"
        path.write_bytes(base64.b64encode(MESSAGE))
        r = json.loads(self.scanner.scan(path).read_text())
        self.assertEqual(r["status"], "partial")
        self.assertIn("ciphey_error", str(r["coverage"]["warnings"]))
        fake.write_text('#!/bin/sh\nsleep 10\n')
        r = json.loads(self.scanner.scan(path, retry=True).read_text())
        self.assertEqual(r["status"], "partial")
        self.assertIn("ciphey_timeout", str(r["coverage"]["warnings"]))

    def test_no_candidates_produces_complete_empty_report(self):
        path = self.inbox / "plain.txt"
        path.write_text("Hi!\n")
        r = json.loads(self.scanner.scan(path).read_text())
        self.assertEqual(r["status"], "complete")
        self.assertEqual(r["findings"], [])


class AdapterTests(unittest.TestCase):
    def test_unrecognised_output_is_parse_error(self):
        self.assertEqual(parse_ciphey({"status": "complete", "stdout": "different format", "stderr": ""})["status"], "parse_error")

    def test_panic_with_zero_exit_is_error(self):
        r = parse_ciphey({"status": "complete", "stdout": "", "stderr": "panicked at somewhere"})
        self.assertEqual(r["status"], "error")

    def test_output_limit_terminates_child(self):
        with tempfile.TemporaryDirectory() as d:
            result = run_tool([sys.executable, "-c", "import sys;sys.stdout.write('x'*100000);sys.stdout.flush()"],
                              cwd=d, timeout=3, output_limit=1000)
        self.assertEqual(result["status"], "output_limit")
        self.assertLessEqual(len(result["stdout"]), 1000)


class LiveWatchTests(unittest.TestCase):
    def test_real_create_edit_atomic_save_move_directory_and_restart(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            inbox, out = root / "inbox", root / "results"
            inbox.mkdir()
            before = inbox / "existing.txt"
            before.write_bytes(base64.b64encode(MESSAGE))
            def reports():
                result = []
                for p in out.glob("versions/*/*/report.json"):
                    result.append(json.loads(p.read_text()))
                return result
            cmd = [sys.executable, "-m", "cipher_watch", "--watch", str(inbox), "--out", str(out),
                   "--regex", "hello there general", "--decode-seconds", "1", "--reconcile-seconds", "2"]
            def start():
                return subprocess.Popen(cmd, cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            process = start()
            try:
                wait_for(lambda: len(reports()) == 1)
                created = inbox / "new.txt"
                created.write_bytes(base64.b64encode(MESSAGE))
                wait_for(lambda: len(reports()) >= 2)
                created.write_bytes(b'"' + base64.b64encode(MESSAGE) + b'"')
                wait_for(lambda: len(reports()) >= 3)
                replacement = root / "replacement"
                replacement.write_bytes(b'payload="' + base64.b64encode(MESSAGE) + b'"')
                replacement.replace(created)
                wait_for(lambda: len(reports()) >= 4)
                directory = root / "incoming"
                directory.mkdir()
                (directory / "moved.txt").write_bytes(base64.b64encode(MESSAGE))
                directory.replace(inbox / "incoming")
                wait_for(lambda: any(r["source"]["relative_path"] == "incoming/moved.txt" for r in reports()))
                final_count = len(reports())
                self.assertEqual(before.read_bytes(), base64.b64encode(MESSAGE))
                self.assertTrue(all(r["findings"] for r in reports()))
            finally:
                process.terminate()
                process.wait(timeout=12)
            process = start()
            try:
                time.sleep(2)
                self.assertEqual(len(reports()), final_count)
                self.assertIsNone(process.poll())
            finally:
                process.terminate()
                process.wait(timeout=12)


if __name__ == "__main__":
    unittest.main()
