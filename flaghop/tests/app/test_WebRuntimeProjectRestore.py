import collections
import collections.abc
import datetime
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import MagicMock
import zipfile

from sqlalchemy import text

from tests.timezone import local_timezone

for _name in ("Mapping", "MutableMapping", "Sequence", "Callable"):
    if not hasattr(collections, _name):
        setattr(collections, _name, getattr(collections.abc, _name))


class WebRuntimeProjectRestoreTest(unittest.TestCase):
    def setUp(self):
        from pathlib import Path
        from unittest.mock import patch

        root = Path(__file__).resolve().parents[2]
        self.temp = tempfile.TemporaryDirectory(dir=root / ".tmp")
        self.addCleanup(self.temp.cleanup)
        self.env = patch.dict(
            os.environ,
            {
                "LEGION_HOME": str(Path(self.temp.name) / "config"),
                "LEGION_PROJECTS_DIR": str(Path(self.temp.name) / "projects"),
            },
        )
        self.env.start()
        self.addCleanup(self.env.stop)

    def _create_runtime(self):
        from app.ProjectManager import ProjectManager
        from app.logic import Logic
        from app.logging.legionLog import getAppLogger, getDbLogger
        from app.shell.DefaultShell import DefaultShell
        from app.web.runtime import WebRuntime
        from app.services.execution_journal import ExecutionJournal
        from db.RepositoryFactory import RepositoryFactory

        shell = DefaultShell()
        repository_factory = RepositoryFactory(getDbLogger())
        project_manager = ProjectManager(shell, repository_factory, getAppLogger())
        logic = Logic(shell, project_manager, MagicMock())
        runtime = WebRuntime(
            logic, execution_journal=ExecutionJournal(Path(os.environ["LEGION_HOME"]) / "protected-executions")
        )
        return project_manager, logic, runtime

    def test_legacy_single_legion_zip_restores_and_creates_missing_output_folder(self):
        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        legacy_zip = ""
        restore_root = ""
        try:
            with tempfile.NamedTemporaryFile(prefix="legacy-legion-", suffix=".zip", delete=False) as temp_zip:
                legacy_zip = temp_zip.name
            with zipfile.ZipFile(legacy_zip, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                archive.write(project.properties.projectName, "AllendalePD.legion")

            restored = runtime.restore_project_bundle_zip(legacy_zip)
            restore_root = str(restored.get("restored", {}).get("restore_root", "") or "")
            restored_project = logic.activeProject

            self.assertIsNotNone(restored_project)
            self.assertEqual("legacy-single-legion-zip", restored["restored"]["manifest_format"])
            self.assertTrue(str(restored_project.properties.projectName or "").endswith("AllendalePD.legion"))
            self.assertTrue(os.path.isdir(restored_project.properties.outputFolder))
            self.assertTrue(
                os.path.isfile(os.path.join(restored_project.properties.outputFolder, "legion-usernames.txt"))
            )
            self.assertTrue(
                os.path.isfile(os.path.join(restored_project.properties.outputFolder, "legion-passwords.txt"))
            )
            self.assertTrue(os.path.isdir(os.path.join(restored_project.properties.outputFolder, "screenshots")))

            snapshot = runtime.get_snapshot()
            self.assertEqual(restored_project.properties.projectName, snapshot["project"]["name"])
        finally:
            if legacy_zip and os.path.isfile(legacy_zip):
                os.remove(legacy_zip)
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()
            if restore_root:
                shutil.rmtree(restore_root, ignore_errors=True)

    def test_open_project_failure_keeps_previous_project_active(self):
        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        bad_project_path = ""
        try:
            with tempfile.NamedTemporaryFile(prefix="bad-project-", suffix=".legion", delete=False) as handle:
                bad_project_path = handle.name
                handle.write(b"not a sqlite database")

            with self.assertRaises(Exception):
                runtime.open_project(bad_project_path)

            self.assertIs(logic.activeProject, project)
            self.assertEqual(project.properties.projectName, runtime.get_project_details()["name"])
            self.assertEqual(project.properties.projectName, runtime.get_snapshot()["project"]["name"])
        finally:
            if bad_project_path and os.path.isfile(bad_project_path):
                os.remove(bad_project_path)
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()

    def test_project_bundle_includes_process_history_artifact(self):
        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        bundle_path = ""
        try:
            runtime._ensure_process_tables()
            session = project.database.session()
            try:
                first_process = session.execute(
                    text(
                        "INSERT INTO process ("
                        "pid, display, name, tabTitle, hostIp, port, protocol, command, startTime, endTime, "
                        "estimatedRemaining, elapsed, outputfile, status, closed, percent, "
                        "progressMessage, progressSource, progressUpdatedAt"
                        ") VALUES ("
                        ":pid, :display, :name, :tabTitle, :hostIp, :port, :protocol, :command, :startTime, :endTime, "
                        ":estimatedRemaining, :elapsed, :outputfile, :status, :closed, :percent, "
                        ":progressMessage, :progressSource, :progressUpdatedAt"
                        ")"
                    ),
                    {
                        "pid": "4201",
                        "display": "True",
                        "name": "whatweb-http",
                        "tabTitle": "WhatWeb HTTP",
                        "hostIp": "10.0.0.5",
                        "port": "5357",
                        "protocol": "tcp",
                        "command": "whatweb http://10.0.0.5:5357",
                        "startTime": "2026-03-21T22:30:00Z",
                        "endTime": "2026-03-21T22:30:05Z",
                        "estimatedRemaining": 0,
                        "elapsed": 5,
                        "outputfile": "/tmp/legion/whatweb-http.txt",
                        "status": "Finished",
                        "closed": "False",
                        "percent": "100",
                        "progressMessage": "",
                        "progressSource": "",
                        "progressUpdatedAt": "",
                    },
                )
                session.execute(
                    text("INSERT INTO process_output (processId, output) VALUES (:process_id, :output)"),
                    {
                        "process_id": int(first_process.lastrowid or 0),
                        "output": "fingerprint complete",
                    },
                )
                session.execute(
                    text(
                        "INSERT INTO process ("
                        "pid, display, name, tabTitle, hostIp, port, protocol, command, startTime, endTime, "
                        "estimatedRemaining, elapsed, outputfile, status, closed, percent, "
                        "progressMessage, progressSource, progressUpdatedAt"
                        ") VALUES ("
                        ":pid, :display, :name, :tabTitle, :hostIp, :port, :protocol, :command, :startTime, :endTime, "
                        ":estimatedRemaining, :elapsed, :outputfile, :status, :closed, :percent, "
                        ":progressMessage, :progressSource, :progressUpdatedAt"
                        ")"
                    ),
                    {
                        "pid": "4202",
                        "display": "False",
                        "name": "curl-headers",
                        "tabTitle": "Curl Headers",
                        "hostIp": "10.0.0.5",
                        "port": "5357",
                        "protocol": "tcp",
                        "command": "curl -k -I http://10.0.0.5:5357",
                        "startTime": "21 Mar 2026 22:30:01.000000",
                        "endTime": "21 Mar 2026 22:30:02.000000",
                        "estimatedRemaining": 0,
                        "elapsed": 1,
                        "outputfile": "/tmp/legion/curl-headers.txt",
                        "status": "Finished",
                        "closed": "True",
                        "percent": "100",
                        "progressMessage": "Requests 2534/4720 | RPS 166 | Matches 0 | Errors 16",
                        "progressSource": "nuclei",
                        "progressUpdatedAt": "21 Mar 2026 22:30:02.500000",
                    },
                )
                session.commit()
            finally:
                session.close()

            bundle_path, _bundle_name = runtime.build_project_bundle_zip()
            with zipfile.ZipFile(bundle_path, "r") as archive:
                names = set(str(item or "") for item in archive.namelist())
                manifest_name = next(name for name in names if name.endswith("/manifest.json"))
                process_history_name = next(name for name in names if name.endswith("/process-history.json"))
                manifest = json.loads(archive.read(manifest_name).decode("utf-8"))
                payload = json.loads(archive.read(process_history_name).decode("utf-8"))

            local_tz = datetime.datetime.now().astimezone().tzinfo or datetime.timezone.utc
            expected_human_start_utc = (
                datetime.datetime(2026, 3, 21, 22, 30, 1, tzinfo=local_tz).astimezone(datetime.timezone.utc).isoformat()
            )
            expected_human_end_utc = (
                datetime.datetime(2026, 3, 21, 22, 30, 2, tzinfo=local_tz).astimezone(datetime.timezone.utc).isoformat()
            )
            expected_human_progress_utc = (
                datetime.datetime(2026, 3, 21, 22, 30, 2, 500000, tzinfo=local_tz)
                .astimezone(datetime.timezone.utc)
                .isoformat()
            )

            self.assertEqual(2, int(manifest.get("process_history_count", 0) or 0))
            self.assertEqual(2, len(payload))
            self.assertEqual("curl-headers", payload[0]["name"])
            self.assertEqual("True", payload[0]["closed"])
            self.assertEqual("21 Mar 2026 22:30:01.000000", payload[0]["startTime"])
            self.assertEqual(expected_human_start_utc, payload[0]["startTimeUtc"])
            self.assertEqual(expected_human_end_utc, payload[0]["endTimeUtc"])
            self.assertEqual("nuclei", payload[0]["progressSource"])
            self.assertEqual("Requests 2534/4720 | RPS 166 | Matches 0 | Errors 16", payload[0]["progressMessage"])
            self.assertEqual(expected_human_progress_utc, payload[0]["progressUpdatedAtUtc"])
            self.assertEqual("whatweb-http", payload[1]["name"])
            self.assertEqual(1, int(payload[1]["hasOutput"]))
            self.assertEqual("whatweb http://10.0.0.5:5357", payload[1]["command"])
            self.assertEqual("2026-03-21T22:30:00Z", payload[1]["startTime"])
            self.assertEqual("2026-03-21T22:30:00+00:00", payload[1]["startTimeUtc"])
            self.assertEqual("2026-03-21T22:30:05+00:00", payload[1]["endTimeUtc"])
        finally:
            if bundle_path and os.path.isfile(bundle_path):
                os.remove(bundle_path)
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()

    # UTC-05 makes the legacy local start appear later than the aware UTC end.
    @local_timezone("EST5")
    def test_project_bundle_reconciles_reversed_mixed_process_timestamps(self):
        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        bundle_path = ""
        try:
            runtime._ensure_process_tables()
            session = project.database.session()
            try:
                session.execute(
                    text(
                        "INSERT INTO process ("
                        "pid, display, name, tabTitle, hostIp, port, protocol, command, startTime, endTime, "
                        "estimatedRemaining, elapsed, outputfile, status, closed, percent, "
                        "progressMessage, progressSource, progressUpdatedAt"
                        ") VALUES ("
                        ":pid, :display, :name, :tabTitle, :hostIp, :port, :protocol, :command, :startTime, :endTime, "
                        ":estimatedRemaining, :elapsed, :outputfile, :status, :closed, :percent, "
                        ":progressMessage, :progressSource, :progressUpdatedAt"
                        ")"
                    ),
                    {
                        "pid": "7001",
                        "display": "False",
                        "name": "httpx-bootstrap",
                        "tabTitle": "httpx bootstrap",
                        "hostIp": "api.example.com",
                        "port": "",
                        "protocol": "tcp",
                        "command": "httpx -l targets.txt -json",
                        "startTime": "24 Mar 2026 02:27:52.130291",
                        "endTime": "2026-03-24T02:27:53.130291+00:00",
                        "estimatedRemaining": 0,
                        "elapsed": 1,
                        "outputfile": "/tmp/legion/httpx-bootstrap.txt",
                        "status": "Finished",
                        "closed": "True",
                        "percent": "100",
                        "progressMessage": "",
                        "progressSource": "",
                        "progressUpdatedAt": "24 Mar 2026 02:27:52.500000",
                    },
                )
                session.commit()
            finally:
                session.close()

            bundle_path, _bundle_name = runtime.build_project_bundle_zip()
            with zipfile.ZipFile(bundle_path, "r") as archive:
                process_history_name = next(
                    name for name in archive.namelist() if str(name).endswith("/process-history.json")
                )
                payload = json.loads(archive.read(process_history_name).decode("utf-8"))

            self.assertEqual("httpx-bootstrap", payload[0]["name"])
            self.assertEqual("2026-03-24T02:27:52.130291+00:00", payload[0]["startTimeUtc"])
            self.assertEqual("2026-03-24T02:27:53.130291+00:00", payload[0]["endTimeUtc"])
            self.assertEqual("2026-03-24T02:27:52.500000+00:00", payload[0]["progressUpdatedAtUtc"])
        finally:
            if bundle_path and os.path.isfile(bundle_path):
                os.remove(bundle_path)
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()

    def test_get_process_output_includes_structured_progress_payload(self):
        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        try:
            runtime._ensure_process_tables()
            session = project.database.session()
            try:
                process_result = session.execute(
                    text(
                        "INSERT INTO process ("
                        "pid, display, name, tabTitle, hostIp, port, protocol, command, startTime, endTime, "
                        "estimatedRemaining, elapsed, outputfile, status, closed, percent, "
                        "progressMessage, progressSource, progressUpdatedAt"
                        ") VALUES ("
                        ":pid, :display, :name, :tabTitle, :hostIp, :port, :protocol, :command, :startTime, :endTime, "
                        ":estimatedRemaining, :elapsed, :outputfile, :status, :closed, :percent, "
                        ":progressMessage, :progressSource, :progressUpdatedAt"
                        ")"
                    ),
                    {
                        "pid": "5001",
                        "display": "True",
                        "name": "nuclei-web",
                        "tabTitle": "Nuclei Web",
                        "hostIp": "10.0.0.9",
                        "port": "5357",
                        "protocol": "tcp",
                        "command": "nuclei -u http://10.0.0.9:5357",
                        "startTime": "2026-03-22T05:08:46Z",
                        "endTime": "",
                        "estimatedRemaining": 13,
                        "elapsed": 15,
                        "outputfile": "/tmp/legion/nuclei-web.txt",
                        "status": "Running",
                        "closed": "False",
                        "percent": "53.0",
                        "progressMessage": "Requests 2534/4720 | RPS 166 | Matches 0 | Errors 16",
                        "progressSource": "nuclei",
                        "progressUpdatedAt": "22 Mar 2026 00:08:46.336234",
                    },
                )
                process_id = int(process_result.lastrowid or 0)
                session.execute(
                    text("INSERT INTO process_output (processId, output) VALUES (:process_id, :output)"),
                    {
                        "process_id": process_id,
                        "output": "[0:00:15] | Requests: 2534/4720 (53%)",
                    },
                )
                session.commit()
            finally:
                session.close()

            payload = runtime.get_process_output(process_id)

            self.assertEqual("Running", payload["status"])
            self.assertEqual("nuclei-web", payload["name"])
            self.assertEqual("53.0", payload["progress"]["percent"])
            self.assertEqual("Nuclei", payload["progress"]["source"])
            self.assertIn("53.0%", payload["progress"]["summary"])
            self.assertIn("Requests 2534/4720", payload["progress"]["summary"])
            self.assertEqual(13, payload["progress"]["estimated_remaining"])
        finally:
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()

    def test_get_process_output_redacts_api_keys_in_command(self):
        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        try:
            runtime._ensure_process_tables()
            session = project.database.session()
            try:
                process_result = session.execute(
                    text(
                        "INSERT INTO process ("
                        "pid, display, name, tabTitle, hostIp, port, protocol, command, startTime, endTime, "
                        "estimatedRemaining, elapsed, outputfile, status, closed, percent"
                        ") VALUES ("
                        ":pid, :display, :name, :tabTitle, :hostIp, :port, :protocol, :command, :startTime, :endTime, "
                        ":estimatedRemaining, :elapsed, :outputfile, :status, :closed, :percent"
                        ")"
                    ),
                    {
                        "pid": "9101",
                        "display": "True",
                        "name": "shodan-enrichment",
                        "tabTitle": "Shodan Enrichment",
                        "hostIp": "connect.example.com",
                        "port": "",
                        "protocol": "tcp",
                        "command": "python3 -m app.shodan_probe --target connect.example.com --api-key super-secret-key --output /tmp/out.json",
                        "startTime": "2026-03-24T10:00:00Z",
                        "endTime": "2026-03-24T10:00:05Z",
                        "estimatedRemaining": 0,
                        "elapsed": 5,
                        "outputfile": "/tmp/out.json",
                        "status": "Finished",
                        "closed": "False",
                        "percent": "100",
                    },
                )
                process_id = int(process_result.lastrowid or 0)
                session.execute(
                    text("INSERT INTO process_output (processId, output) VALUES (:process_id, :output)"),
                    {
                        "process_id": process_id,
                        "output": "ok",
                    },
                )
                session.commit()
            finally:
                session.close()

            payload = runtime.get_process_output(process_id)

            self.assertIn("--api-key ***redacted***", payload["command"])
            self.assertNotIn("super-secret-key", payload["command"])
        finally:
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()

    def test_project_bundle_process_history_redacts_api_keys_in_command(self):
        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        bundle_path = ""
        try:
            runtime._ensure_process_tables()
            session = project.database.session()
            try:
                session.execute(
                    text(
                        "INSERT INTO process ("
                        "pid, display, name, tabTitle, hostIp, port, protocol, command, startTime, endTime, "
                        "estimatedRemaining, elapsed, outputfile, status, closed, percent"
                        ") VALUES ("
                        ":pid, :display, :name, :tabTitle, :hostIp, :port, :protocol, :command, :startTime, :endTime, "
                        ":estimatedRemaining, :elapsed, :outputfile, :status, :closed, :percent"
                        ")"
                    ),
                    {
                        "pid": "9102",
                        "display": "False",
                        "name": "grayhatwarfare",
                        "tabTitle": "Grayhat Warfare",
                        "hostIp": "tantalumlabs.io",
                        "port": "",
                        "protocol": "tcp",
                        "command": "GRAYHAT_API_KEY='top-secret-token' python3 -m app.grayhatwarfare_probe --domain tantalumlabs.io --api-key top-secret-token --output /tmp/grayhat.json",
                        "startTime": "2026-03-24T10:10:00Z",
                        "endTime": "2026-03-24T10:10:07Z",
                        "estimatedRemaining": 0,
                        "elapsed": 7,
                        "outputfile": "/tmp/grayhat.json",
                        "status": "Finished",
                        "closed": "True",
                        "percent": "100",
                    },
                )
                session.commit()
            finally:
                session.close()

            bundle_path, _bundle_name = runtime.build_project_bundle_zip()
            with zipfile.ZipFile(bundle_path, "r") as archive:
                process_history_name = next(
                    name for name in archive.namelist() if str(name).endswith("/process-history.json")
                )
                payload = json.loads(archive.read(process_history_name).decode("utf-8"))

            self.assertIn("***redacted***", payload[0]["command"])
            self.assertNotIn("top-secret-token", payload[0]["command"])
        finally:
            if bundle_path and os.path.isfile(bundle_path):
                os.remove(bundle_path)
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()

    def test_graph_content_returns_inline_evidence_preview_and_download_for_finding_records(self):
        from app.scheduler.state import upsert_target_state
        from db.entities.host import hostObj

        project_manager, logic, runtime = self._create_runtime()
        project = project_manager.createNewProject(projectType="legion", isTemp=True)
        logic.activeProject = project

        try:
            session = project.database.session()
            try:
                host = hostObj(ip="192.168.3.133", ipv4="192.168.3.133", hostname="fileserver.local")
                session.add(host)
                session.commit()
                host_id = int(host.id)
            finally:
                session.close()

            upsert_target_state(
                project.database,
                host_id,
                {
                    "host_ip": "192.168.3.133",
                    "findings": [
                        {
                            "title": "SMB shares enumerated (2)",
                            "severity": "info",
                            "evidence": "smbmap: ADMIN$, C$",
                            "evidence_items": ["ADMIN$", "C$"],
                            "source_kind": "observed",
                            "observed": True,
                        }
                    ],
                },
                merge=False,
            )

            runtime.rebuild_evidence_graph(host_id=host_id)
            with runtime._lock:
                snapshot = runtime._get_graph_snapshot_locked()
            finding_node = next(
                node
                for node in list(snapshot.get("nodes", []) or [])
                if str(node.get("type", "") or "") == "finding"
                and str(node.get("label", "") or "") == "SMB shares enumerated (2)"
            )
            evidence_node = next(
                node
                for node in list(snapshot.get("nodes", []) or [])
                if str(node.get("type", "") or "") == "evidence_record"
                and str(node.get("properties", {}).get("evidence", "") or "") == "smbmap: ADMIN$, C$"
            )

            self.assertIn("ADMIN$", list(finding_node.get("evidence_refs", []) or []))
            self.assertIn("C$", list(evidence_node.get("evidence_refs", []) or []))

            related = runtime.get_graph_related_content(str(finding_node.get("node_id", "") or ""))
            self.assertEqual(1, int(related.get("entry_count", 0) or 0))
            entry = list(related.get("entries", []) or [])[0]
            self.assertEqual("text", str(entry.get("kind", "") or ""))
            self.assertTrue(bool(entry.get("available")))
            self.assertIn("smbmap: ADMIN$, C$", str(entry.get("preview_text", "") or ""))
            self.assertIn("ADMIN$", str(entry.get("preview_text", "") or ""))
            self.assertIn("C$", str(entry.get("preview_text", "") or ""))

            content = runtime.get_graph_content(str(evidence_node.get("node_id", "") or ""), download=True)
            self.assertEqual("text", str(content.get("kind", "") or ""))
            self.assertTrue(bool(content.get("download")))
            self.assertIn("smbmap: ADMIN$, C$", str(content.get("text", "") or ""))
            self.assertIn("ADMIN$", str(content.get("text", "") or ""))
            self.assertIn("C$", str(content.get("text", "") or ""))
        finally:
            active_project = getattr(logic, "activeProject", None)
            if active_project is not None:
                runtime._close_active_project()


if __name__ == "__main__":
    unittest.main()
