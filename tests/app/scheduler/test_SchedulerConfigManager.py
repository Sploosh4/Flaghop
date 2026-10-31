import json
import os
import tempfile
import unittest
from unittest.mock import patch

from app.scheduler.config import SchedulerConfigManager, get_default_scheduler_config_path


class SchedulerConfigManagerTest(unittest.TestCase):
    def test_default_path_is_local_scheduler_configuration(self):
        with tempfile.TemporaryDirectory() as home, patch.dict(os.environ, {"LEGION_HOME": home}):
            self.assertEqual(os.path.join(home, "scheduler.json"), get_default_scheduler_config_path())

    def test_retired_configuration_cannot_reenable_features(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "scheduler.json")
            manager = SchedulerConfigManager(path)
            config = manager.update_preferences(
                {
                    "mode": "ai",
                    "provider": "openai",
                    "providers": {"openai": {"api_key": "fixture-secret"}},
                    "integrations": {"shodan": {"api_key": "fixture-secret"}},
                    "runners": {"container": {"enabled": True}},
                    "ai_feedback": {"enabled": True},
                    "project_report_delivery": {"endpoint": "https://example.invalid"},
                    "feature_flags": {
                        "credential_capture_panel": True,
                        "optional_runners": True,
                        "graph_workspace": True,
                    },
                }
            )
            self.assertEqual("deterministic", config["mode"])
            for key in ("provider", "providers", "integrations", "runners", "ai_feedback", "project_report_delivery"):
                self.assertNotIn(key, config)
            self.assertEqual({"graph_workspace": True, "context_summary_enabled": True}, config["feature_flags"])
            with open(path, encoding="utf-8") as handle:
                persisted = json.load(handle)
            self.assertEqual(config, persisted)
            self.assertNotIn("fixture-secret", json.dumps(persisted))

    def test_execution_limits_and_family_permissions_survive_reload(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "scheduler.json")
            manager = SchedulerConfigManager(path)
            manager.update_preferences({"max_concurrency": 500, "max_host_concurrency": -1, "max_jobs": 1})
            manager.approve_family("smb-check", {"tool_id": "smbmap", "label": "SMB checks"})
            config = SchedulerConfigManager(path)
            self.assertEqual(16, config.load()["max_concurrency"])
            self.assertEqual(1, config.load()["max_host_concurrency"])
            self.assertEqual(20, config.load()["max_jobs"])
            self.assertTrue(config.is_family_preapproved("smb-check"))
            config.block_family("smb-check", {}, reason="disabled for this project")
            self.assertFalse(config.is_family_preapproved("smb-check"))
            self.assertEqual("blocked", SchedulerConfigManager(path).get_family_policy_state("smb-check"))

    def test_malformed_configuration_uses_local_defaults(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "scheduler.json")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("[")
            self.assertEqual("deterministic", SchedulerConfigManager(path).load()["mode"])
