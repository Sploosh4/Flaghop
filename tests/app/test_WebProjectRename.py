from fastapi.testclient import TestClient
import os
import tempfile
import unittest
from tests.app import test_WebRuntimeProjectRestore as restore_tests


class WebProjectRenameTest(unittest.TestCase):

    def setUp(self):
        from app.api import create_app

        self.manager, self.logic, self.runtime = restore_tests.WebRuntimeProjectRestoreTest()._create_runtime()
        self.logic.activeProject = self.manager.createNewProject(projectType="legion", isTemp=True)
        self.client = TestClient(create_app(self.runtime), raise_server_exceptions=False)

    def tearDown(self):
        self.runtime._close_active_project()

    def test_rename_preserves_paths_and_evidence_and_survives_save_and_open(self):
        project = self.logic.activeProject
        path, output = project.properties.projectName, project.properties.outputFolder
        with project.database.engine.begin() as connection:
            connection.exec_driver_sql("CREATE TABLE rename_test_evidence (note TEXT)")
            connection.exec_driver_sql("INSERT INTO rename_test_evidence VALUES ('keep this evidence')")
        response = self.client.post(
            "/api/project/rename",
            json={
                "name": '  CTF "Blue" / café  ',
                "expected_path": path,
            },
        )
        self.assertEqual(200, response.status_code)
        self.assertEqual('CTF "Blue" / café', response.json()["project"]["display_name"])
        self.assertEqual(path, response.json()["project"]["name"])
        self.assertEqual(output, self.logic.activeProject.properties.outputFolder)
        with tempfile.TemporaryDirectory() as folder:
            saved_path = os.path.join(folder, "saved.legion")
            self.runtime.save_project_as(saved_path, replace=False)
            self.runtime.open_project(saved_path)
            self.assertEqual('CTF "Blue" / café', self.runtime.get_snapshot()["project"]["display_name"])
            with self.logic.activeProject.database.engine.connect() as connection:
                self.assertEqual(
                    "keep this evidence", connection.exec_driver_sql("SELECT note FROM rename_test_evidence").scalar()
                )
            self.runtime._close_active_project()

    def test_invalid_names_leave_project_unchanged(self):
        for name in ("", "   ", "x" * 121, "line\nbreak", "tab\tname", 42, None):
            with self.subTest(name=name):
                response = self.client.post("/api/project/rename", json={"name": name})
                self.assertEqual(422, response.status_code)
        self.assertEqual("", self.runtime.get_project_details()["display_name"])

    def test_stale_editor_cannot_rename_another_workspace(self):
        response = self.client.post(
            "/api/project/rename",
            json={
                "name": "Wrong workspace",
                "expected_path": "/an/old/workspace.legion",
            },
        )
        self.assertEqual(409, response.status_code)
        self.assertEqual("", self.runtime.get_project_details()["display_name"])

    def test_renamed_workspace_keeps_name_in_bundle_restore(self):
        import shutil

        self.runtime.rename_project("Exported workspace")
        archive_path, _name = self.runtime.build_project_bundle_zip()
        restore_root = ""
        try:
            result = self.runtime.restore_project_bundle_zip(archive_path)
            restore_root = result["restored"]["restore_root"]
            self.assertEqual("Exported workspace", self.runtime.get_project_details()["display_name"])
        finally:
            os.remove(archive_path)
            self.runtime._close_active_project()
            if restore_root:
                shutil.rmtree(restore_root)


if __name__ == "__main__":
    unittest.main()
