import unittest
from types import SimpleNamespace
from app.scheduler.registry import ActionRegistry


class SchedulerRegistryTest(unittest.TestCase):
    def test_registry_preserves_local_protocol_scope_and_risk_metadata(self):
        settings = SimpleNamespace(
            automatedAttacks=[["smb-enum-users.nse", "smb", "tcp"], ["enum4linux-ng", "smb", "tcp"]],
            portActions=[
                ["SMB users", "smb-enum-users.nse", "nmap --script=smb-enum-users [IP] -p [PORT] -oA [OUTPUT]", "smb"],
                ["SMB enumeration", "enum4linux-ng", "enum4linux-ng -A [IP]", "smb"],
            ],
        )
        registry = ActionRegistry.from_settings(settings)
        action = registry.get_by_tool_id("smb-enum-users.nse")
        self.assertTrue(action.supports_deterministic)
        self.assertEqual("local", action.runner_type)
        self.assertIn("nmap", action.artifact_types)
        self.assertEqual(["tcp"], action.protocol_scope)
        self.assertIn("internal_network", action.pack_tags)
        self.assertEqual(2, len(registry.for_deterministic("smb", "tcp")))
        self.assertEqual([], registry.for_deterministic("smtp", "udp"))
