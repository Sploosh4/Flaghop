"""Observation boundaries retain historical meaning and reject unsupported claims."""

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from pydantic import ValidationError

from app.contracts.observations.parser import ParsedObservations
from app.contracts.observations.network import NetworkReport
from app.contracts.observations.scanner import CandidateFinding, VerifiedFinding, ScannerObservation
from app.scheduler.state_support.normalization import (
    _normalize_technologies,
    _normalize_device_categories,
    _normalize_findings,
    _normalize_credentials,
    _normalize_sessions,
)
from app.scanning.profile import validate_profile
from app.scheduler.observation_parsers import extract_tool_observations
from tests.support.scanner_fixture import write_profile


class ObservationContractsTest(unittest.TestCase):
    def test_protocol_parser_entry_point_rejects_malformed_adapter_observations(self):
        result = {"technologies": [{"name": "Fixture", "source_kind": "invented", "observed": True}]}
        with patch("app.scheduler.observation_parsers._parse_database_info_output", return_value=result):
            with self.assertRaises(ValidationError):
                extract_tool_observations("mysql-info.nse", "fixture output")

    def test_historical_routes_preserve_missing_source_gateway_and_extensions(self):
        route = {"destination": "192.0.2.10", "interface": "wg-fixture", "metric": 7}
        report = NetworkReport(
            status="ready", reason="Saved observation", revision=1, checked_at="2026-10-31T00:00:00Z", routes=[route]
        )
        self.assertEqual([route], report.model_dump()["routes"])

    def test_target_normalization_retains_provenance_and_optional_field_absence(self):
        row = _normalize_technologies([{"name": "Fixture", "source_kind": "inferred", "confidence": 42}])[0]
        self.assertEqual(("inferred", False, 42), (row["source_kind"], row["observed"], row["confidence"]))
        category = _normalize_device_categories([{"name": "Router", "source_kind": "inferred"}])[0]
        self.assertNotIn("observed", category)
        self.assertNotIn("reasons", category)
        finding = _normalize_findings([{"title": "Possible issue", "evidence": "reported text"}])[0]
        self.assertNotIn("status", finding)
        self.assertNotIn("quality_action", finding)

    def test_invalid_scores_cannot_propagate_nan_into_target_state(self):
        for value in (float("nan"), float("inf"), float("-inf")):
            with self.subTest(value=value):
                row = _normalize_technologies([{"name": "Fixture", "confidence": value}])[0]
                self.assertEqual(0, row["confidence"])
                json.dumps(row, allow_nan=False)
                finding = _normalize_findings([{"title": "Fixture", "cvss": value}])[0]
                self.assertEqual(0, finding["cvss"])
                json.dumps(finding, allow_nan=False)

    def test_reported_credentials_and_sessions_do_not_become_live_success(self):
        credential = _normalize_credentials([{"username": "fixture", "secret_ref": "candidate"}])[0]
        session = _normalize_sessions([{"session_type": "ssh", "host": "192.0.2.10"}])[0]
        self.assertNotIn("validated", credential)
        self.assertNotIn("connected", session)

    def test_parser_output_is_validated_without_inventing_missing_confidence(self):
        document = {"technologies": [{"name": "Fixture", "source_kind": "observed", "observed": True}]}
        parsed = ParsedObservations.model_validate(document).model_dump(exclude_unset=True)
        self.assertEqual(document, parsed)
        document["technologies"][0]["source_kind"] = "confirmed"
        with self.assertRaises(ValidationError):
            ParsedObservations.model_validate(document)

    def test_candidate_and_verified_contracts_cannot_be_interchanged(self):
        with self.assertRaises(ValidationError):
            CandidateFinding(status="reproduced")
        for payload in ({"status": "candidate", "evidence": "raw/a"}, {"status": "reproduced", "evidence": []}):
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                VerifiedFinding.model_validate(payload)

    def test_scanner_observation_extensions_survive_and_source_paths_are_checked(self):
        row = ScannerObservation(tool="http", title="Fixture", custom={"retained": True})
        self.assertEqual({"retained": True}, row.model_dump()["custom"])
        with tempfile.TemporaryDirectory() as folder:
            profile = write_profile(folder)
            profile["observations"][0]["source"] = "../outside"
            Path(folder, "device-profile.json").write_text(json.dumps(profile))
            with self.assertRaises(ValidationError):
                validate_profile(folder, "192.0.2.10", profile["source_identity"])
