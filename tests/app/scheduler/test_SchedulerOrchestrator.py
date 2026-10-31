import unittest
from types import SimpleNamespace


class _ConfigStub:
    def __init__(self):
        self.state = {
            "mode": "deterministic",
            "max_concurrency": 2,
            "max_host_concurrency": 1,
            "ai_feedback": {
                "enabled": True,
                "max_rounds_per_target": 4,
                "max_actions_per_round": 2,
                "recent_output_chars": 900,
            },
            "engagement_policy": {"preset": "internal_recon"},
            "goal_profile": "internal_asset_discovery",
        }

    def load(self):
        return dict(self.state)


class _PlannerStub:
    def __init__(self, decisions, provider_payloads=None):
        self.decisions = list(decisions)
        self.provider_payloads = list(provider_payloads or [])
        self.calls = []
        self.plan_calls = 0

    def plan_actions(self, service, protocol, settings, **kwargs):
        self.calls.append(
            {
                "service": service,
                "protocol": protocol,
                "settings": settings,
                **kwargs,
            }
        )
        if self.decisions and isinstance(self.decisions[0], list):
            index = min(self.plan_calls, len(self.decisions) - 1)
            selected = self.decisions[index]
        else:
            selected = self.decisions
        self.plan_calls += 1
        return list(selected)

    def get_last_provider_payload(self, clear=False):
        _ = clear
        if self.provider_payloads:
            index = max(0, min(self.plan_calls - 1, len(self.provider_payloads) - 1))
            return dict(self.provider_payloads[index])
        return {"provider": "stub"}


class SchedulerOrchestratorTest(unittest.TestCase):

    def test_collect_project_targets_includes_host_root_target_for_hostname_scope(self):
        from app.ProjectManager import ProjectManager
        from app.logging.legionLog import getAppLogger, getDbLogger
        from app.scheduler.orchestrator import SchedulerOrchestrator
        from app.shell.DefaultShell import DefaultShell
        from db.RepositoryFactory import RepositoryFactory
        from db.entities.host import hostObj
        from db.entities.port import portObj
        from db.entities.service import serviceObj

        repository_factory = RepositoryFactory(getDbLogger())
        project_manager = ProjectManager(DefaultShell(), repository_factory, getAppLogger())
        project = project_manager.createNewProject(projectType="legion", isTemp=True)

        try:
            session = project.database.session()
            host = hostObj(ip="104.26.2.143", ipv4="104.26.2.143", hostname="example.com")
            session.add(host)
            session.flush()
            service = serviceObj("http", int(host.id))
            session.add(service)
            session.flush()
            session.add(portObj("80", "tcp", "open", int(host.id), int(service.id)))
            session.commit()
            session.close()

            targets = SchedulerOrchestrator.collect_project_targets(project)

            self.assertGreaterEqual(len(targets), 2)
            self.assertEqual("host", targets[0].service_name)
            self.assertEqual("", targets[0].port)
            self.assertEqual("example.com", targets[0].metadata.get("host_root_token"))
            self.assertTrue(any(item.service_name == "http" and item.port == "80" for item in targets))
        finally:
            project_manager.closeProject(project)

    def test_run_targets_routes_blocked_approval_and_execution_through_callbacks(self):
        from app.contracts.actions.planning import PlanStep
        from app.scheduler.orchestrator import (
            SchedulerDecisionDisposition,
            SchedulerExecutionTask,
            SchedulerOrchestrator,
            SchedulerRunOptions,
            SchedulerTarget,
        )

        blocked = PlanStep.from_legacy_fields(
            tool_id="hydra",
            label="Hydra",
            command_template="hydra [IP]",
            protocol="tcp",
            score=1,
            rationale="blocked test",
            mode="deterministic",
            goal_profile="internal_asset_discovery",
            family_id="fam-blocked",
            danger_categories=["credential_bruteforce"],
            approval_state="blocked",
            policy_reason="blocked by policy",
        )
        approval = PlanStep.from_legacy_fields(
            tool_id="nuclei-web",
            label="Nuclei",
            command_template="nuclei -u http://[IP]:[PORT]",
            protocol="tcp",
            score=2,
            rationale="approval test",
            mode="deterministic",
            goal_profile="external_pentest",
            family_id="fam-approval",
            danger_categories=["exploit_execution"],
            approval_state="approval_required",
            policy_reason="approval required",
        )
        allowed = PlanStep.from_legacy_fields(
            tool_id="whatweb",
            label="WhatWeb",
            command_template="whatweb http://[IP]:[PORT]",
            protocol="tcp",
            score=3,
            rationale="allowed test",
            mode="deterministic",
            goal_profile="external_recon",
            family_id="fam-allowed",
            danger_categories=[],
            approval_state="not_required",
        )

        planner = _PlannerStub([blocked, approval, allowed])
        orchestrator = SchedulerOrchestrator(_ConfigStub(), planner=planner)
        target = SchedulerTarget(
            host_id=11, host_ip="10.0.0.5", hostname="demo", port="80", protocol="tcp", service_name="http"
        )

        blocked_events = []
        approval_events = []
        executed_events = []

        def handle_blocked(**kwargs):
            blocked_events.append(kwargs["decision"].tool_id)
            return SchedulerDecisionDisposition(action="skipped", reason="blocked")

        def handle_approval(**kwargs):
            approval_events.append(kwargs["decision"].tool_id)
            return SchedulerDecisionDisposition(action="execute", approval_id=77, reason="approved inline")

        def execute_batch(tasks, max_concurrency):
            self.assertEqual(2, max_concurrency)
            self.assertEqual(2, len(tasks))
            for item in tasks:
                self.assertIsInstance(item, SchedulerExecutionTask)
            return [
                {
                    "decision": task.decision,
                    "tool_id": task.tool_id,
                    "executed": True,
                    "reason": "queued",
                    "process_id": 0,
                    "execution_record": None,
                    "approval_id": int(task.approval_id or 0),
                }
                for task in tasks
            ]

        def on_execution_result(**kwargs):
            executed_events.append((kwargs["decision"].tool_id, kwargs["result"].get("approval_id", 0)))

        summary = orchestrator.run_targets(
            settings=SimpleNamespace(portActions=[]),
            targets=[target],
            engagement_policy={"preset": "external_pentest"},
            options=SchedulerRunOptions(
                scheduler_mode="deterministic",
                scheduler_concurrency=2,
            ),
            handle_blocked=handle_blocked,
            handle_approval=handle_approval,
            execute_batch=execute_batch,
            on_execution_result=on_execution_result,
        )

        self.assertEqual(["hydra"], blocked_events)
        self.assertEqual(["nuclei-web"], approval_events)
        self.assertEqual([("nuclei-web", 77), ("whatweb", 0)], executed_events)
        self.assertEqual(3, summary["considered"])
        self.assertEqual(0, summary["approval_queued"])
        self.assertEqual(2, summary["executed"])
        self.assertEqual(1, summary["skipped"])

    def test_run_targets_skips_host_root_banner_and_nmap_without_port(self):
        from app.contracts.actions.planning import PlanStep
        from app.scheduler.orchestrator import (
            SchedulerExecutionTask,
            SchedulerOrchestrator,
            SchedulerRunOptions,
            SchedulerTarget,
        )

        banner = PlanStep.from_legacy_fields(
            tool_id="banner",
            label="Grab banner",
            command_template="LEGION_BANNER_TARGET=[IP] LEGION_BANNER_PORT=[PORT] LEGION_BANNER_PROTOCOL=tcp python3 -m app.banner_probe",
            protocol="tcp",
            score=95,
            rationale="bad host-root choice",
            mode="ai",
            goal_profile="internal_asset_discovery",
            family_id="fam-banner",
        )
        nmap = PlanStep.from_legacy_fields(
            tool_id="nmap",
            label="Run nmap",
            command_template="nmap -Pn -sV -sC -p [PORT] [IP]",
            protocol="tcp",
            score=94,
            rationale="bad host-root choice",
            mode="ai",
            goal_profile="internal_asset_discovery",
            family_id="fam-nmap",
        )
        subfinder = PlanStep.from_legacy_fields(
            tool_id="subfinder",
            label="Subfinder",
            command_template="subfinder -d [IP] -o [OUTPUT].jsonl",
            protocol="tcp",
            score=93,
            rationale="valid host-root choice",
            mode="ai",
            goal_profile="external_pentest",
            family_id="fam-subfinder",
        )

        planner = _PlannerStub([[banner, nmap, subfinder]])
        orchestrator = SchedulerOrchestrator(_ConfigStub(), planner=planner)
        target = SchedulerTarget(
            host_id=81,
            host_ip="198.51.100.50",
            hostname="portal.example.com",
            port="",
            protocol="tcp",
            service_name="host",
        )

        executed_batches = []

        def execute_batch(tasks, max_concurrency):
            self.assertEqual(2, max_concurrency)
            executed_batches.append([task.tool_id for task in tasks])
            for item in tasks:
                self.assertIsInstance(item, SchedulerExecutionTask)
            return [
                {
                    "decision": task.decision,
                    "tool_id": task.tool_id,
                    "executed": True,
                    "reason": "queued",
                    "process_id": 0,
                    "execution_record": None,
                    "approval_id": int(task.approval_id or 0),
                }
                for task in tasks
            ]

        summary = orchestrator.run_targets(
            settings=SimpleNamespace(
                portActions=[
                    [
                        "Grab banner",
                        "banner",
                        "LEGION_BANNER_TARGET=[IP] LEGION_BANNER_PORT=[PORT] LEGION_BANNER_PROTOCOL=tcp python3 -m app.banner_probe",
                        "http,https",
                    ],
                    ["Run nmap", "nmap", "nmap -Pn -sV -sC -p [PORT] [IP]", ""],
                    [
                        "Run subfinder passive subdomain discovery",
                        "subfinder",
                        "subfinder -d [IP] -o [OUTPUT].jsonl",
                        "host",
                    ],
                ],
                automatedAttacks=[],
            ),
            targets=[target],
            engagement_policy={"preset": "external_pentest"},
            options=SchedulerRunOptions(
                scheduler_mode="ai",
                scheduler_concurrency=2,
            ),
            execute_batch=execute_batch,
        )

        self.assertEqual([], executed_batches)
        self.assertEqual(0, summary["executed"])
        self.assertEqual(3, summary["skipped"])

    def test_run_targets_uses_existing_attempts_even_without_feedback_loop(self):
        from app.contracts.actions.planning import PlanStep
        from app.scheduler.orchestrator import SchedulerOrchestrator, SchedulerRunOptions, SchedulerTarget

        subfinder = PlanStep.from_legacy_fields(
            tool_id="subfinder",
            label="Subfinder",
            command_template="subfinder -d [IP] -o [OUTPUT].jsonl",
            protocol="tcp",
            score=5,
            rationale="root discovery",
            mode="deterministic",
            goal_profile="external_pentest",
            family_id="fam-subfinder",
        )

        planner = _PlannerStub([subfinder])
        orchestrator = SchedulerOrchestrator(_ConfigStub(), planner=planner)
        target = SchedulerTarget(
            host_id=1,
            host_ip="104.26.2.143",
            hostname="example.com",
            port="",
            protocol="tcp",
            service_name="host",
            metadata={"host_root_token": "example.com", "target_type": "host_root"},
        )

        summary = orchestrator.run_targets(
            settings=SimpleNamespace(
                portActions=[["Run subfinder", "subfinder", "subfinder -d [IP] -o [OUTPUT].jsonl", "host"]],
                automatedAttacks=[],
            ),
            targets=[target],
            engagement_policy={"preset": "external_recon"},
            options=SchedulerRunOptions(
                scheduler_mode="deterministic",
                scheduler_concurrency=1,
            ),
            existing_attempts=lambda **_kwargs: {"tool_ids": {"subfinder"}},
            execute_batch=lambda *_args, **_kwargs: self.fail("execute_batch should not run for excluded attempts"),
        )

        self.assertEqual(["subfinder"], planner.calls[0]["excluded_tool_ids"])
        self.assertEqual(0, summary["executed"])


if __name__ == "__main__":
    unittest.main()
