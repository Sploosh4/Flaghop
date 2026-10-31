"""Project persistence and isolated local file access; no VPN or network activity."""

import json
import fcntl
import os
from pathlib import Path
import tempfile
import zipfile
from unittest import TestCase
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.api import create_app
from app.services.project_hub import ProjectHub
from app.services.project_storage import download_folder
from app.web import create_app as create_legacy_app
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime


class ProjectHubTest(TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.env = patch.dict(
            os.environ,
            {"LEGION_HOME": str(self.root / "config"), "LEGION_PROJECTS_DIR": str(self.root / "Documents/Hackathon")},
        )
        self.env.start()
        self.logic = create_default_logic()
        self.runtime = WebRuntime(self.logic)
        self.hub = ProjectHub(self.runtime)

    def tearDown(self):
        project = self.logic.activeProject
        self.logic.projectManager.closeProject(project)
        project.database.dispose()
        self.env.stop()
        self.temp.cleanup()

    def test_create_switch_and_reload_catalog_with_project_folders(self):
        first = self.hub.create("First lab")["project"]
        self.assertEqual(self.root / "Documents/Hackathon/First lab", Path(first["folder"]))
        self.assertTrue(Path(first["path"]).is_file())
        second = self.hub.create("Second lab")["project"]
        self.assertNotEqual(first["id"], second["id"])
        opened = self.hub.open(first["id"])
        self.assertEqual("First lab", opened["workspace"]["display_name"])
        self.assertEqual(first["path"], self.runtime.get_project_details()["name"])
        reloaded = ProjectHub(self.runtime)
        self.assertIn(second["id"], [row["id"] for row in reloaded.list()["projects"]])
        self.assertEqual(0o600, self.hub.config_path.stat().st_mode & 0o777)

    def test_duplicate_names_never_overwrite_an_existing_folder(self):
        first = self.hub.create("Lab")["project"]
        original = Path(first["folder"]) / "notes.txt"
        original.write_text("original")
        second = self.hub.create("Lab")["project"]
        self.assertEqual("Lab (2)", Path(second["folder"]).name)
        self.assertEqual("original", original.read_text())

    def test_flaghop_default_and_custom_folder_persist_without_moving_existing_projects(self):
        with patch.dict(os.environ, {}, clear=False), patch("pathlib.Path.home", return_value=self.root):
            os.environ.pop("LEGION_PROJECTS_DIR", None)
            fresh = ProjectHub(self.runtime, config_path=self.root / "fresh.json")
            self.assertEqual(self.root / "Documents/FlagHop", fresh.root)
        first = self.hub.create("Original")["project"]
        destination = self.root / "custom output"
        self.hub.set_save_folder(str(destination))
        reloaded = ProjectHub(self.runtime)
        self.assertEqual(destination, reloaded.root)
        self.assertTrue(Path(first["path"]).is_file())
        second = reloaded.create("New project")["project"]
        self.assertEqual(destination / "New project", Path(second["folder"]))
        self.assertEqual(destination / "New project/exports", download_folder(reloaded.config_path))
        self.assertEqual(Path(first["folder"]) / "exports", download_folder(reloaded.config_path, first["id"]))

    def test_explicit_migration_preserves_ids_documents_and_unregistered_project_files(self):
        row = self.hub.create("Existing")["project"]
        Path(row["folder"], "notes.txt").write_text("original evidence")
        extra = self.hub.root / "reader demo"
        extra.mkdir()
        (extra / "finding.txt").write_text("separate reader output")
        destination = self.root / "Documents/FlagHop"
        self.hub.set_save_folder(str(destination), move_existing=True)
        migrated = next(item for item in self.hub.list()["projects"] if item["id"] == row["id"])
        self.assertEqual(row["id"], migrated["id"])
        self.assertEqual(destination / "Existing", Path(migrated["folder"]))
        self.assertEqual(migrated["path"], self.runtime.get_project_details()["name"])
        self.assertEqual("original evidence", Path(migrated["folder"], "notes.txt").read_text())
        self.assertEqual("separate reader output", (destination / "reader demo/finding.txt").read_text())
        self.assertEqual(Path(row["path"]).resolve(), Path(migrated["path"]).resolve())
        self.assertTrue((self.root / "Documents/Hackathon").is_symlink())

    def test_migration_rejects_locked_readers_collisions_and_nested_destinations(self):
        row = self.hub.create("Existing")["project"]
        state = Path(row["folder"], ".reader-state")
        state.mkdir()
        destination = self.root / "Documents/FlagHop"
        with (state / "owner.lock").open("w") as stream:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaisesRegex(RuntimeError, "Pause file processing"):
                self.hub.set_save_folder(str(destination), move_existing=True)
        (destination / "Existing").mkdir()
        with self.assertRaisesRegex(ValueError, "matching names"):
            self.hub.set_save_folder(str(destination), move_existing=True)
        with self.assertRaisesRegex(ValueError, "outside"):
            self.hub.set_save_folder(str(Path(row["folder"], "nested")), move_existing=True)
        self.assertTrue(Path(row["path"]).is_file())

    def test_migration_failure_rolls_back_files_catalog_and_active_workspace(self):
        import shutil

        row = self.hub.create("Existing")["project"]
        Path(row["folder"], "notes.txt").write_text("preserve me")
        (self.hub.root / "extra").mkdir()
        old_root = self.hub.root
        old_config = self.hub.config_path.read_text()
        move = shutil.move
        calls = 0

        def fail_second(source, destination):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError("fixture interrupted move")
            return move(source, destination)

        with patch("app.services.project_storage.shutil.move", side_effect=fail_second):
            with self.assertRaisesRegex(OSError, "interrupted move"):
                self.hub.set_save_folder(str(self.root / "Documents/FlagHop"), move_existing=True)
        self.assertEqual(old_root, self.hub.root)
        self.assertEqual(old_config, self.hub.config_path.read_text())
        self.assertEqual(row["path"], self.runtime.get_project_details()["name"])
        self.assertEqual("preserve me", Path(row["folder"], "notes.txt").read_text())

    def test_invalid_names_do_not_create_files_or_replace_project(self):
        before = self.runtime.get_project_details()["name"]
        for name in ("", "..", "../elsewhere", "/absolute", "a\\b", "hidden\x00name", ".private", "x" * 121):
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.hub.create(name)
        self.assertEqual(before, self.runtime.get_project_details()["name"])
        self.assertFalse(self.hub.root.exists())

    def test_existing_temporary_project_can_be_opened_and_saved(self):
        row = self.hub.list()["projects"][0]
        self.assertFalse(row["managed"])
        opened = self.hub.open(row["id"])
        self.assertTrue(opened["project"]["managed"])
        self.assertFalse(opened["workspace"]["is_temporary"])
        self.assertTrue(Path(opened["project"]["folder"]).is_relative_to(self.hub.root))

    def test_switch_rejects_active_work_without_changing_project(self):
        row = self.hub.create("Lab")["project"]
        self.runtime._active_processes[99] = object()
        try:
            with self.assertRaises(RuntimeError):
                self.hub.create("Other")
            self.assertEqual(row["path"], self.runtime.get_project_details()["name"])
        finally:
            self.runtime._active_processes.clear()

    def test_file_listing_and_download_boundaries(self):
        row = self.hub.create("Lab")["project"]
        folder = Path(row["folder"])
        (folder / "notes.txt").write_text("hello")
        outside = self.root / "outside.txt"
        outside.write_text("outside")
        (folder / "linked.txt").symlink_to(outside)
        names = [file["path"] for file in self.hub.files(row["id"])["files"]]
        self.assertIn("notes.txt", names)
        self.assertNotIn("linked.txt", names)
        self.assertNotIn("workspace.legion", names)
        self.assertEqual("hello", self.hub.file_path(row["id"], "notes.txt").read_text())
        for path in ("../outside.txt", str(outside), "linked.txt", "workspace.legion", "workspace.legion-wal"):
            with self.subTest(path=path), self.assertRaises((ValueError, KeyError)):
                self.hub.file_path(row["id"], path)

    def test_setup_has_no_discovery_and_preferences_persist(self):
        row = self.hub.create("Lab")["project"]
        with patch("subprocess.run", side_effect=AssertionError("No external discovery is allowed")):
            settings = self.hub.settings()
            self.assertEqual([], settings["vpns"])
            self.assertEqual("unconfigured", settings["vpn_status"])
            self.assertTrue(settings["computer"]["name"])
            self.hub.set_vpn(row["id"], "none")
            self.hub.set_vpn(None, None)
        self.assertEqual("none", json.loads(self.hub.config_path.read_text())["projects"][-1]["vpn"])
        with self.assertRaises(ValueError):
            self.hub.set_vpn(None, "some-vpn")

    def test_connector_preferences_persist_without_connecting_or_affecting_other_projects(self):
        first = self.hub.create("First")["project"]
        second = self.hub.create("Second")["project"]
        with patch("subprocess.run", side_effect=AssertionError("No connection or probe is allowed")):
            for connector in ("openvpn", "wireguard", "networkmanager"):
                self.hub.set_connector(first["id"], connector)
                reloaded = ProjectHub(self.runtime).list()["projects"]
                self.assertEqual(connector, next(row for row in reloaded if row["id"] == first["id"])["connector"])
                self.assertEqual(
                    "networkmanager", next(row for row in reloaded if row["id"] == second["id"])["connector"]
                )
        with self.assertRaises(ValueError):
            self.hub.set_connector(first["id"], "invalid")
        with self.assertRaises(KeyError):
            self.hub.set_connector("missing", "wireguard")

    def test_old_catalog_gets_a_connector_default_without_changing_vpn_preference(self):
        first = self.hub.create("Legacy")["project"]
        data = self.hub._read()
        data["projects"][-1].pop("connector")
        data["projects"][-1]["vpn"] = "none"
        self.hub._write(data)
        opened = self.hub.open(first["id"])["project"]
        self.assertEqual("networkmanager", opened["connector"])
        self.assertEqual("none", opened["vpn"])

    def test_native_and_legacy_routes_use_the_same_project_service(self):
        for stack in ("native", "legacy"):
            with self.subTest(stack=stack):
                if stack == "native":
                    client = TestClient(create_app(self.runtime), raise_server_exceptions=False)
                    self.addCleanup(client.close)
                    post = lambda url, payload: client.post(url, json=payload)
                    payload = lambda response: response.json()
                    get = client.get
                else:
                    client = create_legacy_app(self.runtime).test_client()
                    post = lambda url, body: client.post(url, json=body)
                    payload = lambda response: response.get_json()
                    get = client.get
                response = post("/api/hub/projects", {"name": f"{stack} lab"})
                self.assertEqual(200, response.status_code, response.data if stack == "legacy" else response.text)
                row = payload(response)["project"]
                connector_url = f"/api/hub/projects/{row['id']}/connector"
                self.assertEqual(200, post(connector_url, {"selection": "wireguard"}).status_code)
                self.assertEqual(422, post(connector_url, {"selection": "invalid"}).status_code)
                self.assertEqual(422, post(connector_url, {"selection": "openvpn", "connect": True}).status_code)
                reopened = post(f"/api/hub/projects/{row['id']}/open", {})
                self.assertEqual("wireguard", payload(reopened)["project"]["connector"])
                with (
                    patch.object(
                        self.runtime,
                        "start_tool_install_job",
                        return_value={
                            "id": 99,
                            "type": "tool-install",
                            "status": "queued",
                        },
                    ) as install,
                    patch("app.tooling.detect_supported_tool_install_platform", return_value="ubuntu"),
                ):
                    for connector in ("openvpn", "wireguard"):
                        queued = post("/api/hub/connectors/install", {"connector": connector})
                        self.assertEqual(202, queued.status_code)
                        install.assert_called_with(platform="ubuntu", scope="missing", tool_keys=[connector])
                    self.assertEqual(
                        422, post("/api/hub/connectors/install", {"connector": "networkmanager"}).status_code
                    )
                    self.assertEqual(2, install.call_count)
                self.assertEqual(200, get("/api/hub/settings").status_code)
                folder = str(self.root / f"{stack} output")
                changed = post("/api/hub/settings/save-folder", {"path": folder})
                self.assertEqual(200, changed.status_code)
                self.assertEqual(folder, payload(changed)["projects_folder"])
                self.assertEqual(400, post("/api/hub/settings/save-folder", {"path": "relative"}).status_code)
                self.assertEqual(422, post("/api/hub/settings/save-folder", {"path": 3}).status_code)
                self.assertEqual(422, post("/api/hub/projects", {"name": 3}).status_code)
                self.assertEqual(404, post("/api/hub/projects/missing/open", {}).status_code)
                Path(row["folder"], "notes.txt").write_text("fixture notes")
                downloaded = get(f"/api/hub/projects/{row['id']}/file?path=notes.txt")
                self.assertEqual(200, downloaded.status_code)
                self.assertIn("attachment", downloaded.headers["Content-Disposition"])
                self.assertEqual("nosniff", downloaded.headers["X-Content-Type-Options"])
                renamed = post(f"/api/hub/projects/{row['id']}/rename", {"name": f"{stack} renamed"})
                self.assertEqual(200, renamed.status_code)
                self.assertEqual(f"{stack} renamed", payload(renamed)["project"]["name"])
                self.assertEqual(200, post(f"/api/hub/projects/{row['id']}/save", {}).status_code)
                copy = post(f"/api/hub/projects/{row['id']}/save-as", {"name": f"{stack} copy"})
                self.assertEqual(200, copy.status_code)
                copied = payload(copy)["project"]
                self.assertEqual(409, post(f"/api/hub/projects/{row['id']}/save", {}).status_code)
                bundle = get(f"/api/hub/projects/{copied['id']}/bundle")
                self.assertEqual(200, bundle.status_code)
                data = bundle.data if stack == "legacy" else bundle.content
                restored = (
                    client.post("/api/hub/restore-zip", data=data, content_type="application/zip")
                    if stack == "legacy"
                    else client.post("/api/hub/restore-zip", content=data, headers={"Content-Type": "application/zip"})
                )
                self.assertEqual(200, restored.status_code)
                self.assertEqual("fixture notes", Path(payload(restored)["project"]["folder"], "notes.txt").read_text())
                self.assertEqual(200, post("/api/hub/open-path", {"path": row["path"]}).status_code)
                self.assertEqual(
                    404, post("/api/hub/open-path", {"path": str(self.root / "missing.legion")}).status_code
                )

    def test_restored_project_controls_update_catalog_and_preserve_copies(self):
        row = self.hub.create("Original")["project"]
        Path(row["folder"], "notes.txt").write_text("original evidence")
        renamed = self.hub.operations.rename(row["id"], "Renamed")["project"]
        self.assertEqual(row["folder"], renamed["folder"])
        self.assertEqual("Renamed", self.hub.operations.save(row["id"])["workspace"]["display_name"])
        copied = self.hub.operations.save_as(row["id"], "Copy")["project"]
        self.assertNotEqual(row["id"], copied["id"])
        self.assertEqual("original evidence", Path(copied["folder"], "notes.txt").read_text())
        Path(copied["folder"], "notes.txt").write_text("edited copy")
        self.assertEqual("original evidence", Path(row["folder"], "notes.txt").read_text())
        with self.assertRaises(RuntimeError):
            self.hub.operations.rename(row["id"], "Wrong project")
        opened = self.hub.operations.open_path(row["path"])
        self.assertEqual(row["id"], opened["project"]["id"])
        self.assertEqual("Renamed", opened["project"]["name"])

    def test_zip_round_trip_includes_project_documents_and_rejects_traversal(self):
        row = self.hub.create("Bundle lab")["project"]
        Path(row["folder"], "notes.txt").write_text("fixture document")
        path, _ = self.hub.operations.bundle(row["id"])
        self.addCleanup(Path(path).unlink, missing_ok=True)
        with zipfile.ZipFile(path) as archive:
            self.assertEqual(b"fixture document", archive.read("project-files/notes.txt"))
        restored = self.hub.operations.restore_zip(path)["project"]
        self.assertNotEqual(row["id"], restored["id"])
        self.assertEqual("fixture document", Path(restored["folder"], "notes.txt").read_text())
        with zipfile.ZipFile(path, "a") as archive:
            archive.writestr("project-files/../../outside.txt", "invalid")
        with self.assertRaises(ValueError):
            self.hub.operations.restore_zip(path)
        self.assertEqual(restored["path"], self.runtime.get_project_details()["name"])
