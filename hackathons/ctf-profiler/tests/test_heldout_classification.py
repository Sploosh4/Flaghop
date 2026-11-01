"""Evaluate reserved classification fixtures without feeding expectations to production."""
import copy
import json
from pathlib import Path
import unittest

from device_classifier import classify_device

FIXTURE = Path(__file__).resolve().parent / "fixtures/classification-heldout.json"
RANK = {"unknown": 0, "low": 1, "medium": 2, "high": 3}


class HeldOutClassificationTests(unittest.TestCase):
    def test_reserved_cases_never_receive_unsupported_high_confidence(self):
        data = json.loads(FIXTURE.read_text())
        for case in data["cases"]:
            with self.subTest(case=case["id"]):
                source = copy.deepcopy(case["input"])
                classification, identities, ngfw = classify_device(source)
                expected = case["expected"]
                self.assertEqual(source, case["input"], "classifier mutated evaluator input")
                if expected.get("no_primary"):
                    self.assertIsNone(classification["primary"])
                if "max_confidence" in expected:
                    self.assertLessEqual(RANK[classification["confidence"]],
                                         RANK[expected["max_confidence"]])
                for role in expected.get("forbid_roles", []):
                    hypotheses = [classification["primary"], *classification["alternatives"]]
                    self.assertFalse(any(h and h["device_type"] == role for h in hypotheses))
                if expected.get("unknown_vendor"):
                    self.assertIsNone(identities["vendor"]["value"])
                if expected.get("conflict"):
                    self.assertIn(expected["conflict"],
                                  [item["id"] for item in classification["conflicts"]])
                if expected.get("channels"):
                    self.assertEqual(classification["primary"]["evidence_channels"],
                                     expected["channels"])
                if expected.get("ngfw"):
                    self.assertEqual(ngfw, expected["ngfw"])


if __name__ == "__main__":
    unittest.main()
