"""The activity slice preserves valid legacy contracts and validates before actions."""

from unittest import TestCase
from unittest.mock import Mock
from fastapi.testclient import TestClient
from app.api import create_app
from tests.app.test_WebApp import DummyRuntime


class ActivityApiTest(TestCase):

    def setUp(self):
        self.runtime = DummyRuntime()
        self.client = TestClient(create_app(self.runtime), raise_server_exceptions=False)
        self.addCleanup(self.client.close)

    def test_activity_reads_have_native_contracts_and_cache_policy(self):
        for path in (
            "/api/workspace/overview",
            "/api/processes?limit=100",
            "/api/processes/1/output?offset=3&max_chars=24000",
            "/api/scans/history?limit=100",
            "/api/scheduler/decisions?limit=80",
            "/api/scheduler/approvals?status=pending&limit=200",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(200, response.status_code, response.text)
                self.assertEqual("fastapi", response.headers["X-Legion-API"])
                self.assertIn("no-store", response.headers["Cache-Control"])
                self.assertIsInstance(response.json(), dict)

    def test_process_actions_preserve_status_codes_and_service_arguments(self):
        self.runtime.start_process_retry_job = Mock(wraps=self.runtime.start_process_retry_job)
        for path, payload, status in (
            ("/api/processes/1/kill", {}, 200),
            ("/api/processes/1/close", {}, 200),
            ("/api/processes/1/retry", {"timeout": 45}, 202),
            ("/api/processes/clear", {"reset_all": False}, 200),
            ("/api/processes/clear", {"reset_all": True}, 200),
        ):
            with self.subTest(path=path, payload=payload):
                response = self.client.post(path, json=payload)
                self.assertEqual(status, response.status_code, response.text)
                self.assertEqual("fastapi", response.headers["X-Legion-API"])
                self.assertIn("status", response.json())
        self.runtime.start_process_retry_job.assert_called_with(process_id=1, timeout=45)

    def test_approval_and_family_actions_use_existing_service_without_implicit_execution(self):
        approval = {"id": 77, "status": "approved", "extra_audit_field": "retained"}
        job = {"id": 99, "type": "fixture-only", "status": "queued"}
        self.runtime.approve_scheduler_approval = Mock(return_value={"approval": approval, "job": job})
        payload = {"run_now": True, "approve_family": True, "family_action": "allowed"}
        response = self.client.post("/api/scheduler/approvals/77/approve", json=payload)
        self.assertEqual(202, response.status_code, response.text)
        self.assertEqual(approval, response.json()["approval"])
        self.runtime.approve_scheduler_approval.assert_called_once_with(approval_id=77, **payload)
        self.runtime.approve_scheduler_approval.return_value = {"approval": approval, "job": None}
        response = self.client.post("/api/scheduler/approvals/77/approve", json={"run_now": False})
        self.assertEqual(200, response.status_code, response.text)
        self.assertIsNone(response.json()["job"])
        self.runtime.approve_scheduler_approval.assert_called_with(
            approval_id=77, run_now=False, approve_family=False, family_action=""
        )
        self.runtime.reject_scheduler_approval = Mock(return_value={"id": 77, "status": "rejected"})
        response = self.client.post(
            "/api/scheduler/approvals/77/reject", json={"reason": "fixture", "family_action": "suppressed"}
        )
        self.assertEqual(200, response.status_code, response.text)
        self.runtime.reject_scheduler_approval.assert_called_once_with(
            approval_id=77, reason="fixture", family_action="suppressed"
        )

    def test_invalid_bodies_never_reach_mutating_services(self):
        for method in (
            "start_process_retry_job",
            "clear_processes",
            "approve_scheduler_approval",
            "reject_scheduler_approval",
        ):
            setattr(self.runtime, method, Mock())
        for path, payload in (
            ("/api/processes/1/retry", {"timeout": 0}),
            ("/api/processes/1/retry", {"timeout": "300"}),
            ("/api/processes/clear", {"reset_all": "false"}),
            ("/api/scheduler/approvals/77/approve", {"run_now": "false"}),
            ("/api/scheduler/approvals/77/approve", {"family_action": "blocked"}),
            ("/api/scheduler/approvals/77/reject", {"family_action": "allowed"}),
            ("/api/scheduler/approvals/77/reject", {"unexpected": True}),
        ):
            with self.subTest(path=path, payload=payload):
                response = self.client.post(path, json=payload)
                self.assertEqual(422, response.status_code, response.text)
                self.assertEqual("error", response.json()["status"])
        for method in (
            "start_process_retry_job",
            "clear_processes",
            "approve_scheduler_approval",
            "reject_scheduler_approval",
        ):
            getattr(self.runtime, method).assert_not_called()

    def test_invalid_queries_and_unknown_rows_return_errors(self):
        for path in (
            "/api/processes?limit=501",
            "/api/scans/history?limit=0",
            "/api/scheduler/decisions?limit=x",
            "/api/scheduler/approvals?limit=1001",
            "/api/processes/1/output?offset=-1",
            "/api/processes/1/output?max_chars=50001",
        ):
            with self.subTest(path=path):
                self.assertEqual(422, self.client.get(path).status_code)
        for path in ("/api/processes/999/output",):
            self.assertEqual(404, self.client.get(path).status_code)
        self.assertEqual(404, self.client.post("/api/scheduler/approvals/999/reject", json={}).status_code)

    def test_historical_nullable_process_fields_and_extension_metadata_survive(self):
        row = {
            "id": 8,
            "name": None,
            "hostIp": None,
            "port": None,
            "protocol": None,
            "status": "Finished",
            "percent": "",
            "estimatedRemaining": None,
            "legacy_field": "preserved",
        }
        self.runtime.get_workspace_processes = Mock(return_value=[row])
        response = self.client.get("/api/processes")
        self.assertEqual(200, response.status_code, response.text)
        self.assertEqual([row], response.json()["processes"])
