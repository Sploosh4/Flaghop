"""Feature retirement cannot be reversed by a saved setting or an old API URL."""

import os
from pathlib import Path
import tempfile
from unittest import TestCase
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.api import create_app
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from app.services.execution_journal import ExecutionJournal
from app.settings import AppSettings, Settings
from app.tooling import audit_legion_tools


class FeatureRetirementTest(TestCase):

    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"LEGION_HOME": self.directory.name})
        self.env.start()
        self.runtime = WebRuntime(
            create_default_logic(),
            execution_journal=ExecutionJournal(Path(os.environ["LEGION_HOME"]) / "protected-executions"),
        )

    def tearDown(self):
        project = self.runtime.logic.activeProject
        self.runtime.logic.projectManager.closeProject(project)
        project.database.dispose()
        self.env.stop()
        self.directory.cleanup()

    def test_retired_endpoints_are_absent_on_the_native_transport(self):
        routes = [
            ("get", "/api/scheduler/provider/logs"),
            ("post", "/api/scheduler/provider/test"),
            ("get", "/api/workspace/credentials"),
            ("get", "/api/workspace/credential-capture"),
            ("post", "/api/workspace/credential-capture/start"),
            ("post", "/api/workspace/credential-capture/config"),
            ("get", "/api/screenshots/fixture.png"),
            ("post", "/api/workspace/hosts/1/refresh-screenshots"),
            ("post", "/api/workspace/hosts/1/dig-deeper"),
            ("post", "/api/workspace/hosts/1/note"),
            ("post", "/api/workspace/hosts/1/categories"),
            ("post", "/api/workspace/hosts/1/scripts"),
            ("delete", "/api/workspace/scripts/1"),
            ("post", "/api/targets/import-file"),
            ("get", "/api/workspace/project-ai-report"),
            ("get", "/api/workspace/project-report"),
            ("post", "/api/workspace/project-report/push"),
        ]
        with TestClient(create_app(self.runtime)) as native:
            for method, url in routes:
                for client in (native,):
                    with self.subTest(url=url, transport=type(client).__name__):
                        self.assertEqual(404, getattr(client, method)(url).status_code)
            self.assertEqual(200, native.get("/api/processes").status_code)
            self.assertEqual(200, native.get("/api/scheduler/approvals").status_code)

    def test_catalogue_and_installer_offer_only_retained_tools(self):
        settings = Settings(AppSettings())
        ids = {row["tool_id"] for row in self.runtime.get_workspace_tools()}
        for tool in (
            "responder",
            "ntlmrelayx",
            "screenshooter",
            "x11screen",
            "whatweb",
            "httpx",
            "nikto",
            "nuclei-web",
            "theharvester",
            "shodan-enrichment",
        ):
            self.assertNotIn(tool, ids)
        self.assertIn("smb-security-mode.nse", ids)
        self.assertIn("pipette-smtp-internal-discovery", ids)
        categories = {row.category for row in audit_legion_tools(settings)}
        self.assertFalse(categories & {"web", "screenshot", "relay", "planned", "credentials"})

    def test_saved_legacy_actions_are_not_reintroduced_at_startup(self):
        config = Path(self.directory.name) / "legion.conf"
        text = config.read_text()
        config.write_text(
            text.replace(
                "[PortActions]",
                "[PortActions]\nresponder=Capture, responder -I eth0, smb\nhttpx=Web, httpx -u [IP], http",
            )
        )
        restored = Settings(AppSettings())
        ids = {row[1] for row in restored.portActions}
        self.assertNotIn("responder", ids)
        self.assertNotIn("httpx", ids)
        self.assertIn("smb-security-mode.nse", ids)

    def test_current_settings_and_shell_do_not_render_retired_controls(self):
        body = TestClient(create_app(self.runtime), raise_server_exceptions=False).get("/").text
        for control in (
            "credential-capture-panel",
            "screenshots-modal",
            "provider-logs-modal",
            "host-selection-modal",
            "script-cve-modal",
            "report-provider-modal",
            "scheduler-provider-select",
            "jobs-modal",
        ):
            self.assertNotIn(f'id="{control}"', body)
        self.assertIn('id="jobs-body"', body)
        self.assertIn('id="scheduler-form"', body)

    def test_local_protocol_plan_preview_works_without_provider_state(self):
        from db.entities.host import hostObj
        from db.entities.port import portObj
        from db.entities.service import serviceObj

        project = self.runtime.logic.activeProject
        session = project.database.session()
        host = hostObj(ip="192.0.2.7", ipv4="192.0.2.7", hostname="fixture", status="up")
        session.add(host)
        session.commit()
        host_id = host.id
        service = serviceObj(name="smb", host=host_id, product="Samba", version="4")
        session.add(service)
        session.commit()
        port = portObj("445", "tcp", "open", host_id, service.id)
        session.add(port)
        session.commit()
        session.close()
        preview = self.runtime.get_scheduler_plan_preview(host_id=host_id, service="smb", port="445")
        self.assertEqual("deterministic", preview["current_mode"])
        self.assertEqual(1, preview["target_count"])
        self.assertNotIn("ai", preview["targets"][0])
        self.assertTrue(preview["targets"][0]["plan"]["steps"])
        detail = self.runtime.get_host_workspace(host_id)
        self.assertIn("observations", detail)
        self.assertNotIn("ai_analysis", detail)
        self.assertNotIn("screenshots", detail)
