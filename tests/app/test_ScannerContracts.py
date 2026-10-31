"""Task and summary contracts reject bad facts without discarding extensions."""

from pathlib import Path
import tempfile
import unittest
from pydantic import ValidationError
from app.scanning.models import TaskFacts, ScanSummary
from app.scanning.profile import validate_profile
from tests.support.scanner_fixture import write_profile


class ScannerContractsTest(unittest.TestCase):
    def test_all_recorded_task_outcomes_and_extension_fields_survive_validation(self):
        for status in (
            "completed",
            "failed",
            "timed_out",
            "output_limit",
            "tool_missing",
            "supplied",
            "skipped",
            "skipped_offline",
            "disabled",
            "planned",
        ):
            with self.subTest(status=status):
                task = TaskFacts.model_validate(
                    {"id": "fixture", "tool": "nmap", "status": status, "extension": {"source": "kept"}}
                )
                self.assertEqual({"source": "kept"}, task.model_dump()["extension"])
        task = TaskFacts(id="http", status="completed", parse_status="failed", parse_error="invalid JSON")
        self.assertEqual("failed", task.parse_status)

    def test_bad_states_types_durations_and_paths_fail_at_import_boundary(self):
        invalid = [
            {"status": "success"},
            {"id": ""},
            {"exit_code": True},
            {"duration_seconds": -1},
            {"stdout": "../outside"},
            {"stdout": "raw/../../outside"},
            {"stderr": "raw\\outside"},
            {"parse_status": "probably okay"},
        ]
        for update in invalid:
            with tempfile.TemporaryDirectory() as folder, self.subTest(update=update):
                import json

                profile = write_profile(folder)
                profile["tasks"][0].update(update)
                Path(folder, "device-profile.json").write_text(json.dumps(profile))
                with self.assertRaises(ValidationError):
                    validate_profile(folder, "192.0.2.10", profile["source_identity"])
                self.assertTrue(Path(folder, "raw/nmap.xml").is_file())

    def test_summary_has_typed_services_findings_and_meaningful_problem_details(self):
        summary = ScanSummary.model_validate(
            {
                "services": [{"port": 80, "protocol": "tcp", "state": "open", "fingerprint": {"name": "http"}}],
                "candidates": [{"title": "Possible issue", "status": "candidate", "template_id": "fixture"}],
                "problems": [{"id": "http", "tool": "curl", "status": "timed_out", "reason": "deadline"}],
                "extension": "kept",
            }
        )
        self.assertEqual(80, summary.services[0].port)
        self.assertEqual("fixture", summary.candidates[0].model_dump()["template_id"])
        self.assertEqual("deadline", summary.problems[0].reason)
        self.assertEqual("kept", summary.model_dump()["extension"])
        for invalid in ({"services": [{"port": 80}]}, {"reproduced": [{"status": "completed"}]}):
            with self.assertRaises(ValidationError):
                ScanSummary.model_validate(invalid)


class FindingProvenanceContractTest(unittest.TestCase):
    def test_candidates_cannot_be_presented_as_reproduced_or_reference_unretained_proof(self):
        import json

        for update in (
            {"status": "candidate"},
            {"evidence": []},
            {"evidence": "raw/not-retained.txt"},
            {"evidence": "../outside"},
            {"evidence": None},
        ):
            with tempfile.TemporaryDirectory() as folder, self.subTest(update=update):
                profile = write_profile(folder)
                profile["validated_vulnerabilities"][0].update(update)
                Path(folder, "device-profile.json").write_text(json.dumps(profile))
                with self.assertRaises(ValueError):
                    validate_profile(folder, "192.0.2.10", profile["source_identity"])
                self.assertTrue(Path(folder, "raw/nmap.xml").is_file())
        with self.assertRaises(ValidationError):
            ScanSummary.model_validate({"reproduced": [{"status": "candidate"}]})
        with self.assertRaises(ValidationError):
            ScanSummary.model_validate({"candidates": [{"status": "reproduced"}]})
