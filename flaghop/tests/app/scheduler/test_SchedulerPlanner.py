import os
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch


class _MemorySecretStore:
    _KNOWN_PROVIDER_ENV_VARS = {
        "lm_studio": "LM_STUDIO_API_KEY",
        "openai": "OPENAI_API_KEY",
        "claude": "ANTHROPIC_API_KEY",
    }
    _KNOWN_INTEGRATION_ENV_VARS = {
        "grayhatwarfare": "GRAYHATWARFARE_API_KEY",
        "chaos": "CHAOS_API_KEY",
        "shodan": "SHODAN_API_KEY",
    }

    def __init__(self, write_available=True):
        self.write_enabled = bool(write_available)
        self.secrets = {}

    @classmethod
    def provider_env_var(cls, provider_name):
        return str(cls._KNOWN_PROVIDER_ENV_VARS.get(str(provider_name or "").strip().lower(), "") or "")

    @classmethod
    def integration_env_var(cls, integration_name):
        return str(cls._KNOWN_INTEGRATION_ENV_VARS.get(str(integration_name or "").strip().lower(), "") or "")

    def write_available(self):
        return bool(self.write_enabled)

    def describe(self):
        return {"backend": "memory", "write_available": bool(self.write_enabled)}

    def get_secret(self, secret_ref, *, env_var=""):
        return str(self.secrets.get(str(secret_ref or ""), "") or "")

    def set_secret(self, secret_ref, value):
        self.secrets[str(secret_ref or "")] = str(value or "")
        return str(secret_ref or "")

    def delete_secret(self, secret_ref):
        self.secrets.pop(str(secret_ref or ""), None)


class SchedulerPlannerTest(unittest.TestCase):

    def test_deterministic_mode_follows_scheduler_mapping(self):
        from app.scheduler.config import SchedulerConfigManager
        from app.contracts.actions.planning import ActionSpec, PlanStep
        from app.scheduler.planner import SchedulerPlanner

        with tempfile.TemporaryDirectory() as tmpdir:
            manager = SchedulerConfigManager(config_path=os.path.join(tmpdir, "scheduler-ai.json"))
            manager.update_preferences({"mode": "deterministic"})
            planner = SchedulerPlanner(manager)

            settings = SimpleNamespace(
                automatedAttacks=[["smb-enum-users.nse", "smb", "tcp"]],
                portActions=[["SMB Users", "smb-enum-users.nse", "nmap --script=smb-enum-users [IP] -p [PORT]", "smb"]],
            )

            actions = planner.plan_actions("smb", "tcp", settings)
            self.assertEqual(1, len(actions))
            self.assertIsInstance(actions[0], PlanStep)
            self.assertIsInstance(actions[0].action, ActionSpec)
            self.assertEqual("smb-enum-users.nse", actions[0].tool_id)
            self.assertFalse(actions[0].requires_approval)
            self.assertEqual("smb-enum-users.nse", actions[0].action.action_id)
            self.assertTrue(actions[0].action.supports_deterministic)

    def test_planner_uses_normalized_engagement_policy_preset_for_plan_steps(self):
        from app.scheduler.config import SchedulerConfigManager
        from app.scheduler.planner import SchedulerPlanner

        settings = SimpleNamespace(
            automatedAttacks=[["nuclei-web", "http", "tcp"]],
            portActions=[
                ["Run nuclei web scan", "nuclei-web", "nuclei -u http://[IP]:[PORT] -silent", "http"],
            ],
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            manager = SchedulerConfigManager(config_path=os.path.join(tmpdir, "scheduler-ai.json"))
            manager.update_preferences(
                {
                    "mode": "deterministic",
                    "engagement_policy": {
                        "preset": "external_recon",
                        "scope": "external",
                        "intent": "recon",
                        "noise_budget": "low",
                    },
                }
            )
            planner = SchedulerPlanner(manager)

            actions = planner.plan_actions("http", "tcp", settings)

            self.assertEqual(1, len(actions))
            self.assertEqual("external_recon", actions[0].engagement_preset)
            self.assertEqual("external_pentest", actions[0].goal_profile)

    def test_internal_recon_blocks_credential_attack_actions(self):
        from app.scheduler.config import SchedulerConfigManager
        from app.scheduler.planner import SchedulerPlanner

        with tempfile.TemporaryDirectory() as tmpdir:
            manager = SchedulerConfigManager(config_path=os.path.join(tmpdir, "scheduler-ai.json"))
            manager.update_preferences(
                {
                    "mode": "deterministic",
                    "engagement_policy": {"preset": "internal_recon"},
                }
            )
            planner = SchedulerPlanner(manager)

            settings = SimpleNamespace(
                automatedAttacks=[["smb-default", "smb", "tcp"]],
                portActions=[
                    ["SMB Default", "smb-default", "hydra -s [PORT] -u root -P pass.txt [IP] smb", "smb"],
                ],
            )

            actions = planner.plan_actions("smb", "tcp", settings)

            self.assertEqual(1, len(actions))
            self.assertTrue(actions[0].is_blocked)
            self.assertEqual("blocked", actions[0].policy_decision)
            self.assertIn("credential_bruteforce", actions[0].danger_categories)

    def test_deterministic_mode_filters_candidates_whose_binary_is_not_available_in_tool_audit(self):
        from app.scheduler.config import SchedulerConfigManager
        from app.scheduler.planner import SchedulerPlanner

        with tempfile.TemporaryDirectory() as tmpdir:
            manager = SchedulerConfigManager(config_path=os.path.join(tmpdir, "scheduler-ai.json"))
            manager.update_preferences(
                {
                    "mode": "deterministic",
                    "goal_profile": "internal_asset_discovery",
                    "provider": "none",
                }
            )
            planner = SchedulerPlanner(manager)
            settings = SimpleNamespace(
                automatedAttacks=[
                    ["whatweb-http", "http", "tcp"],
                    ["nikto", "http", "tcp"],
                    ["banner", "http", "tcp"],
                ],
                portActions=[
                    ["WhatWeb", "whatweb-http", "whatweb http://[IP]:[PORT]", "http"],
                    ["Nikto", "nikto", "nikto -h [IP] -p [PORT]", "http"],
                    ["Banner", "banner", "LEGION_BANNER_TARGET=[IP] python3 -m app.banner_probe", "http"],
                ],
            )

            actions = planner.plan_actions(
                "http",
                "tcp",
                settings,
                context={
                    "tool_audit": {
                        "available_tool_ids": [],
                        "unavailable_tool_ids": ["whatweb", "nikto"],
                    },
                },
            )

            tool_ids = [item.tool_id for item in actions]
            self.assertIn("banner", tool_ids)
            self.assertNotIn("whatweb-http", tool_ids)
            self.assertNotIn("nikto", tool_ids)

    def test_planner_excludes_blacklisted_tool_ids_from_config(self):
        from app.scheduler.config import SchedulerConfigManager
        from app.scheduler.planner import SchedulerPlanner

        with tempfile.TemporaryDirectory() as tmpdir:
            manager = SchedulerConfigManager(config_path=os.path.join(tmpdir, "scheduler-ai.json"))
            manager.update_preferences(
                {
                    "mode": "ai",
                    "provider": "none",
                    "disabled_tool_ids": ["http-drupal-modules.nse", "http-vuln-zimbra-lfi.nse"],
                }
            )
            planner = SchedulerPlanner(manager)
            settings = SimpleNamespace(
                automatedAttacks=[["smbmap", "smb", "tcp"]],
                portActions=[
                    ["Drupal Modules", "http-drupal-modules.nse", "nmap --script http-drupal-modules.nse [IP]", "smb"],
                    ["Zimbra LFI", "http-vuln-zimbra-lfi.nse", "nmap --script http-vuln-zimbra-lfi.nse [IP]", "smb"],
                    ["WhatWeb", "smbmap", "smbmap [IP]", "smb"],
                ],
            )

            actions = planner.plan_actions("smb", "tcp", settings, limit=6)
            tool_ids = {item.tool_id for item in actions}
            self.assertNotIn("http-drupal-modules.nse", tool_ids)
            self.assertNotIn("http-vuln-zimbra-lfi.nse", tool_ids)
            self.assertIn("smbmap", tool_ids)

    def test_deterministic_mode_uses_strategy_packs_to_close_explicit_gap_when_context_exists(self):
        from app.scheduler.config import SchedulerConfigManager
        from app.scheduler.planner import SchedulerPlanner

        with tempfile.TemporaryDirectory() as tmpdir:
            manager = SchedulerConfigManager(config_path=os.path.join(tmpdir, "scheduler-ai-det-gap.json"))
            manager.update_preferences(
                {
                    "mode": "deterministic",
                    "engagement_policy": {"preset": "internal_pentest"},
                }
            )
            planner = SchedulerPlanner(manager)
            settings = SimpleNamespace(
                automatedAttacks=[
                    ["enum4linux-ng", "smb", "tcp"],
                    ["smb2-security-mode.nse", "smb", "tcp"],
                ],
                portActions=[
                    ["Nikto", "enum4linux-ng", "enum4linux-ng [IP]", "smb"],
                    ["WhatWeb", "smb2-security-mode.nse", "nmap --script=smb2-security-mode -p [PORT] [IP]", "smb"],
                ],
            )

            actions = planner.plan_actions(
                "smb",
                "tcp",
                settings,
                context={
                    "signals": {"web_service": True, "tls_detected": False},
                    "coverage": {"missing": ["missing_smb_signing_checks"]},
                },
            )

            self.assertEqual("smb2-security-mode.nse", actions[0].tool_id)
            self.assertIn("internal_network", actions[0].pack_ids)
            self.assertEqual("missing_smb_signing_checks", actions[0].coverage_gap)
            self.assertIn("internal_network", actions[0].rationale)


if __name__ == "__main__":
    unittest.main()
