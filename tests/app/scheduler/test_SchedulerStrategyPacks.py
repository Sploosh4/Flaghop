import unittest
from app.scheduler.models import ActionSpec
from app.scheduler.policy import normalize_engagement_policy
from app.scheduler.strategy_packs import evaluate_action_strategy, select_strategy_packs


class SchedulerStrategyPacksTest(unittest.TestCase):
    def test_smb_signing_gap_prioritizes_protocol_evidence(self):
        policy = normalize_engagement_policy({"preset": "internal_recon"})
        context = {"coverage": {"missing": ["missing_smb_signing_checks"]}}
        action = ActionSpec(
            action_id="smb2-security-mode.nse",
            tool_id="smb2-security-mode.nse",
            label="SMB signing",
            description="Check SMB signing",
            command_template="nmap --script=smb2-security-mode [IP]",
            service_scope=["smb"],
            protocol_scope=["tcp"],
        )
        selections = select_strategy_packs("smb", "tcp", policy, context)
        guidance = evaluate_action_strategy(action, selections, policy, context)
        self.assertIn("internal_network", guidance.pack_ids)
        self.assertEqual("missing_smb_signing_checks", guidance.coverage_gap)
        self.assertGreater(guidance.bonus, 0)
        self.assertTrue(guidance.evidence_expectations)
