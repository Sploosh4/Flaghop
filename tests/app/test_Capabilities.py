import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.capabilities.manifests import load_manifests, validate_manifests
from app.contracts.actions.capabilities import CapabilityManifest
from app.contracts.actions.planning import ActionSpec
from app.scheduler.registry import ActionRegistry


class CapabilityTests(unittest.TestCase):
    def setUp(self):
        self.registry = ActionRegistry(
            [
                ActionSpec(
                    action_id="first-action",
                    tool_id="example-tool",
                    label="first",
                    description="first",
                    command_template="one",
                ),
                ActionSpec(
                    action_id="second-action",
                    tool_id="example-tool",
                    label="second",
                    description="second",
                    command_template="two",
                ),
            ]
        )
        self.root = Path(__file__).parents[1] / "fixtures/capability"
        self.payload = json.loads((self.root / "example/manifest.json").read_text())

    def validate(self, payload):
        return validate_manifests([CapabilityManifest.model_validate(payload)], self.registry)

    def test_fixture_shares_integration_and_stays_draft(self):
        result = load_manifests(self.root, self.registry)
        self.assertEqual(result["modules"]["first"].integration_ids, ["example-tool"])
        self.assertEqual(result["modules"]["second"].integration_ids, ["example-tool"])
        self.assertEqual(result["change_report"][0]["status"], "draft")
        self.assertEqual(set(result["change_report"][0]["snapshot"]["actions"]), {"first-action", "second-action"})

    def test_only_exact_controlled_snapshot_is_active(self):
        original = self.validate(self.payload)["change_report"][0]["snapshot"]
        with patch("app.capabilities.manifests._APPROVED_BASELINE", (original,)):
            self.assertEqual(self.validate(self.payload)["change_report"][0]["status"], "approved")
            self.assertEqual(len(self.validate(self.payload)["active_categories"]), 1)
            altered_registry = ActionRegistry(
                [
                    ActionSpec(
                        action_id="first-action",
                        tool_id="example-tool",
                        label="first",
                        description="first",
                        command_template="changed",
                    ),
                    self.registry.get("second-action"),
                ]
            )
            changed_report = validate_manifests([CapabilityManifest.model_validate(self.payload)], altered_registry)
            self.assertEqual(changed_report["active_categories"], [])
            changed = copy.deepcopy(self.payload)
            changed["modules"][0]["action_ids"] = []
            self.assertEqual(self.validate(changed)["change_report"][0]["status"], "draft")
            changed = copy.deepcopy(self.payload)
            changed["categories"][0]["definition"] += " expanded"
            self.assertEqual(self.validate(changed)["change_report"][0]["status"], "draft")
        changed = copy.deepcopy(self.payload)
        self.assertEqual(self.validate(changed)["active_categories"], [])
        changed["categories"][0]["approved"] = True
        with self.assertRaises(ValueError):
            self.validate(changed)

    def test_duplicate_missing_cycle_and_wrong_version_rejected(self):
        for change, match in [
            (lambda p: p["modules"].append(copy.deepcopy(p["modules"][0])), "duplicate"),
            (lambda p: p["modules"][0]["integration_ids"].append("missing"), "missing"),
            (lambda p: p["modules"][0].update(depends_on=["second"]), "cyclic"),
            (lambda p: p.update(version=2), "version"),
            (lambda p: p["categories"][0].update(definition="   "), "definition"),
        ]:
            payload = copy.deepcopy(self.payload)
            change(payload)
            with self.assertRaisesRegex(ValueError, match):
                self.validate(payload)

    def test_discovery_is_atomic_and_never_executes_code(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "good").mkdir()
            (root / "good/manifest.json").write_text(json.dumps(self.payload))
            (root / "good/executable.py").write_text("raise RuntimeError('must not import')")
            self.assertEqual(len(load_manifests(root, self.registry)["modules"]), 2)
            (root / "bad").mkdir()
            (root / "bad/manifest.json").write_text("{")
            with self.assertRaisesRegex(ValueError, "invalid manifest"):
                load_manifests(root, self.registry)
            self.assertEqual(len(self.registry.all()), 2)


class CapabilityApiTests(unittest.TestCase):
    def test_inspection_uses_real_active_project_without_execution(self):
        from fastapi.testclient import TestClient
        from app.api import create_app
        from tests.app.test_FeatureRetirement import FeatureRetirementTest

        case = FeatureRetirementTest("test_catalogue_and_installer_offer_only_retained_tools")
        case.setUp()
        try:
            with patch("subprocess.Popen", side_effect=AssertionError("execution forbidden")):
                with TestClient(create_app(case.runtime)) as client:
                    response = client.get("/api/workspace/capabilities")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "ok")
            self.assertEqual(data["categories"], [])
            self.assertTrue(data["actions"])
            self.assertTrue(data["modules"])
            actions = {a["action_id"]: a for a in data["actions"]}
            for module in data["modules"]:
                for action_id in module["action_ids"]:
                    self.assertIn(action_id, actions)
            integrations = {i["id"]: i for i in data["integrations"]}
            for action in actions.values():
                self.assertIn(action["action_id"], integrations[action["integration_id"]]["action_ids"])
            self.assertTrue(any(a["source"] == "pipette" for a in actions.values()))
            self.assertIsNone(data["missing_prerequisites"])
        finally:
            case.tearDown()


class LegacyCompatibilityTests(unittest.TestCase):
    def test_blank_and_unsupported_rows_are_ignored_by_real_catalogue(self):
        from tests.app.test_WebRuntimeDomainModules import _ToolRuntime
        from app.web.runtime_tool_catalog import workspace_tools_rows

        runtime = _ToolRuntime()
        before = workspace_tools_rows(runtime)
        runtime.settings.portActions.extend([["bad", "", "no-op", ""], ["bad", "unsupported-xyz", "no-op", ""]])
        self.assertEqual(before, workspace_tools_rows(runtime))
