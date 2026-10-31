"""Project navigation and user-visible folders. No network or VPN discovery."""

import hashlib
import json
import os
import platform
import threading
import uuid
from pathlib import Path

from app.paths import get_legion_home
from app.services.project_hub_operations import ProjectHubOperations
from app.services.project_storage import default_save_folder, migrate_project_folders, writable_save_folder
from app.services.project_background import atomic_json


def project_name(value):
    name = str(value or "").strip()
    if not name or len(name) > 120 or name in {".", ".."}:
        raise ValueError("Enter a project name (1–120 characters).")
    if any(ord(char) < 32 or char in "/\\\x7f" for char in name) or name.startswith("."):
        raise ValueError("Project names cannot contain path separators or control characters.")
    return name


class ProjectHub:
    def __init__(self, runtime, *, config_path=None, projects_dir=None):
        self.runtime = runtime
        self.config_path = Path(config_path or Path(get_legion_home()) / "project-hub.json")
        self.default_root = Path(projects_dir or os.environ.get("LEGION_PROJECTS_DIR") or default_save_folder())
        self.root_overridden = bool(projects_dir or os.environ.get("LEGION_PROJECTS_DIR"))
        self.lock = threading.RLock()
        self.operations = ProjectHubOperations(self)
        from app.services.project_networks import ProjectNetworks

        self.networks = ProjectNetworks(self)
        if runtime is not None:
            runtime.project_networks = self.networks

    @property
    def root(self):
        data = self._read()
        if data.get("save_folder"):
            return Path(data["save_folder"])
        legacy = Path.home() / "Documents/Hackathon"
        if not self.root_overridden and any(
            row.get("managed") and Path(row.get("folder", "")).parent == legacy for row in data["projects"]
        ):
            return legacy
        return self.default_root

    def _read(self):
        if not self.config_path.exists():
            return {"projects": [], "default_vpn": None}
        data = json.loads(self.config_path.read_text())
        if not isinstance(data, dict) or not isinstance(data.get("projects"), list):
            raise ValueError("Project settings could not be read.")
        return data

    def _write(self, data):
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.config_path.with_name(f".{self.config_path.name}.{uuid.uuid4().hex}.tmp")
        try:
            with temporary.open("x", encoding="utf-8") as stream:
                os.chmod(temporary, 0o600)
                json.dump(data, stream, indent=2)
            temporary.replace(self.config_path)
        finally:
            temporary.unlink(missing_ok=True)

    def _current(self):
        return self.runtime.get_project_details()

    def _legacy(self, project):
        path = str(project.get("name", ""))
        return {
            "id": hashlib.sha256(path.encode()).hexdigest()[:24],
            "name": project.get("display_name") or "Untitled workspace",
            "path": path,
            "folder": "",
            "managed": False,
            "vpn": "inherit",
            "connector": "networkmanager",
        }

    def list(self):
        with self.lock:
            data = self._read()
            projects = [
                {"connector": "networkmanager", **row} for row in data["projects"] if Path(row["path"]).is_file()
            ]
            current = self._current()
            if current.get("name") and not any(row["path"] == current["name"] for row in projects):
                projects.append(self._legacy(current))
            return {"projects": projects}

    def _check_idle(self):
        if (
            self.runtime._save_in_progress
            or self.runtime._count_running_scan_jobs(include_queued=True)
            or self.runtime._active_processes
        ):
            raise RuntimeError("Stop running jobs before switching projects.")

    def _folder(self, name):
        self.root.mkdir(parents=True, exist_ok=True)
        for number in range(1, 10000):
            folder = self.root / (name if number == 1 else f"{name} ({number})")
            try:
                folder.mkdir(mode=0o700)
                return folder
            except FileExistsError:
                continue
        raise RuntimeError("No project folder is available for that name.")

    def _adopt(self, record):
        """Save through the existing SQLite backup/output-copy path, never overwrite a folder."""
        folder = self._folder(project_name(record["name"]))
        try:
            self.runtime.save_project_as(str(folder / "workspace.legion"), replace=False)
        except Exception:
            if not any(folder.iterdir()):
                folder.rmdir()
            raise
        # A new registered workspace must not start reader jobs just by existing.
        atomic_json(folder / "reader-control.json", {"running": False, "pause_policy": "finish-bounded-step"})
        return {**record, "path": self._current()["name"], "folder": str(folder), "managed": True}

    def _remember(self, record):
        data = self._read()
        data["projects"] = [row for row in data["projects"] if row["id"] != record["id"]]
        data["projects"].append(record)
        data["active_project"] = record["id"]
        self._write(data)

    def open(self, identifier):
        with self.lock, self.runtime._lock:
            records = self.list()["projects"]
            record = next((row for row in records if row["id"] == identifier), None)
            if record is None:
                raise KeyError("Project not found.")
            if self._current().get("name") != record["path"] or not record["managed"]:
                self._check_idle()
            if self._current().get("name") != record["path"]:
                self.runtime.open_project(record["path"])
            if not record["managed"]:
                record = self._adopt(record)
            self._remember(record)
            return {"project": record, "workspace": self._current()}

    def create(self, name):
        name = project_name(name)
        with self.lock, self.runtime._lock:
            self._check_idle()
            current = self._current()
            if current.get("name"):
                previous = next(
                    (row for row in self.list()["projects"] if row["path"] == current["name"]), self._legacy(current)
                )
                if current.get("is_temporary"):
                    previous = self._adopt(previous)
                self._remember(previous)
                previous_path = previous["path"]
            else:
                previous_path = ""
            try:
                self.runtime.create_new_temporary_project()
                self.runtime.rename_project(name, expected_path=self._current()["name"])
                record = self._adopt(
                    {
                        "id": uuid.uuid4().hex,
                        "name": name,
                        "vpn": "inherit",
                        "connector": "networkmanager",
                        "managed": False,
                    }
                )
            except Exception:
                if previous_path and Path(previous_path).is_file() and self._current().get("name") != previous_path:
                    self.runtime.open_project(previous_path)
                raise
            self._remember(record)
            return {"project": record, "workspace": self._current()}

    def settings(self):
        with self.lock:
            return {
                "default_vpn": self._read().get("default_vpn"),
                "vpn_status": "unconfigured",
                "computer": {"name": platform.node() or "This computer", "system": platform.system()},
                "projects_folder": str(self.root),
                "vpns": [],
            }

    def set_vpn(self, identifier, selection):
        # Discovery/connection is deliberately deferred. Only explicit None/inherit choices are currently valid.
        with self.lock:
            data = self._read()
            if identifier is None:
                if selection is not None:
                    raise ValueError("VPN discovery is not configured.")
                data["default_vpn"] = None
            else:
                row = next((row for row in data["projects"] if row["id"] == identifier), None)
                if row is None:
                    raise KeyError("Project not found.")
                if selection not in {"inherit", "none"}:
                    raise ValueError("VPN discovery is not configured.")
                row["vpn"] = selection
            self._write(data)
            return {"status": "ok"}

    def set_save_folder(self, path, move_existing=False):
        destination = writable_save_folder(path)
        with self.lock, self.runtime._lock:
            data = self._read()
            data["save_folder"] = str(destination)
            if move_existing and destination != self.root.resolve():
                migrate_project_folders(self, destination, data)
            else:
                self._write(data)
            return self.settings()

    def set_connector(self, identifier, selection):
        if selection not in {"networkmanager", "openvpn", "wireguard"}:
            raise ValueError("Choose NetworkManager, OpenVPN or WireGuard.")
        with self.lock:
            data = self._read()
            row = next((row for row in data["projects"] if row["id"] == identifier), None)
            if row is None:
                raise KeyError("Project not found.")
            row["connector"] = selection
            network = data.get("networks", {}).get(identifier)
            if network is not None:
                network["revision"] = network.get("revision", 0) + 1
            self._write(data)
        return {"status": "ok"}

    def install_connector(self, connector):
        from app.web.services.settings_service import SettingsService

        if connector not in {"openvpn", "wireguard"}:
            raise ValueError("Choose OpenVPN or WireGuard to install.")
        return SettingsService(self.runtime).start_tool_install({"scope": "missing", "tool_keys": [connector]})

    def _record(self, identifier):
        row = next((row for row in self._read()["projects"] if row["id"] == identifier), None)
        if row is None or not row.get("managed"):
            raise KeyError("Project not found.")
        return row

    def file_path(self, identifier, relative):
        root = Path(self._record(identifier)["folder"]).resolve()
        path = root / relative
        if not relative or Path(relative).is_absolute() or any(part.startswith(".") for part in Path(relative).parts):
            raise ValueError("Invalid file path.")
        if any(parent.is_symlink() for parent in [path, *path.parents] if parent != root.parent):
            raise ValueError("Linked files cannot be opened here.")
        resolved = path.resolve()
        if not resolved.is_relative_to(root) or ".legion" in resolved.name or not resolved.is_file():
            raise KeyError("File not found.")
        return resolved

    def files(self, identifier):
        root = Path(self._record(identifier)["folder"])
        rows = []
        for path in self.visible_files(identifier):
            rows.append({"path": str(path.relative_to(root)), "size": path.stat().st_size})
            if len(rows) >= 500:
                return {"files": rows, "truncated": True}
        return {"files": rows, "truncated": False}

    def visible_files(self, identifier):
        root = Path(self._record(identifier)["folder"])
        for folder, directories, filenames in os.walk(root, followlinks=False):
            directories[:] = sorted(
                name for name in directories if not name.startswith(".") and not (Path(folder) / name).is_symlink()
            )
            for name in sorted(filenames):
                path = Path(folder) / name
                if (
                    name.startswith(".")
                    or ".legion" in name
                    or path.is_symlink()
                    or name in {"reader-control.json", "reader-alerts.json"}
                ):
                    continue
                if name in {"legion-usernames.txt", "legion-passwords.txt"} and path.stat().st_size == 0:
                    continue
                yield path
