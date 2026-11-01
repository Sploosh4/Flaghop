"""Removed entrypoints must stay unavailable while the investigation core remains usable."""

from fastapi.testclient import TestClient

import contextlib
import io
import unittest
from app.api import create_app
from tests.app.test_WebApp import DummyRuntime


class CtfSurfaceRemovalTest(unittest.TestCase):

    def setUp(self):
        self.runtime = DummyRuntime()
        self.client = TestClient(create_app(self.runtime), raise_server_exceptions=False)

    def test_removed_download_and_editor_endpoints_are_unavailable(self):
        for path in (
            "/api/export/json",
            "/api/export/csv",
            "/api/export/hosts-json",
            "/api/export/hosts-csv",
            "/api/graph/export/json",
            "/api/graph/export/graphml",
            "/api/workspace/hosts/11/report?format=md",
            "/api/workspace/hosts/11/ai-report?format=json",
            "/api/workspace/project-report",
            "/api/workspace/project-ai-report",
            "/api/workspace/ai-reports/download-zip",
            "/api/settings/legion-conf",
        ):
            with self.subTest(path=path):
                self.assertEqual(404, self.client.get(path).status_code)
        self.assertEqual(404, self.client.post("/api/settings/legion-conf", json={"text": "x"}).status_code)
        self.assertEqual(
            404, self.client.post("/api/workspace/hosts/11/cves", json={"name": "CVE-2026-1234"}).status_code
        )
        self.assertEqual(404, self.client.delete("/api/workspace/cves/50").status_code)

    def test_ui_keeps_direct_workspace_controls_without_removed_surfaces(self):
        response = self.client.get("/")
        self.assertEqual(200, response.status_code)
        body = response.text
        for ident in (
            "startup-wizard-overlay",
            "ribbon-launch-wizard-button",
            "ribbon-export-menu-button",
            "graph-export-png-button",
            "graph-export-svg-button",
            "host-detail-cves",
            "host-detail-ai-findings",
            "workspace-add-cve-button",
            "settings-config-text",
            "settings-config-save-button",
        ):
            with self.subTest(removed=ident):
                self.assertNotIn(f'id="{ident}"', body)
        for ident in (
            "ribbon-workspace-new-action-button",
            "ribbon-workspace-open-action-button",
            "ribbon-import-xml-action-button",
            "ribbon-scan-add-action-button",
            "ribbon-scan-manual-action-button",
            "graph-workspace-canvas",
            "graph-layout-save-button",
            "settings-tool-audit-body",
            "settings-tool-install-run-button",
            "ribbon-workspace-download-action-button",
        ):
            with self.subTest(retained=ident):
                self.assertIn(f'id="{ident}"', body)

    def test_existing_findings_still_feed_internal_data_views(self):
        findings = self.client.get("/api/workspace/findings?host_id=11")
        self.assertEqual(200, findings.status_code)
        self.assertEqual("SMB signing not required", findings.json()["findings"][0]["title"])
        graph = self.client.get("/api/graph")
        self.assertEqual(200, graph.status_code)
        self.assertTrue(graph.json()["nodes"])
        self.assertEqual(200, self.client.get("/api/settings/tool-audit").status_code)

    def test_removed_batch_and_mcp_flags_are_rejected(self):
        from legion import build_arg_parser

        parser = build_arg_parser()
        for flag in ("--headless", "--mcp-server", "--input-file", "--output-file", "--run-actions"):
            with self.subTest(flag=flag), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as exc:
                    parser.parse_args([flag])
                self.assertEqual(2, exc.exception.code)
        self.assertTrue(parser.parse_args(["--web"]).web)
        self.assertTrue(parser.parse_args(["--tool-audit"]).tool_audit)
