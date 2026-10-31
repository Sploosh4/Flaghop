"""Project controls shared by the native and comparison transports."""

import shutil
import uuid
import zipfile
from pathlib import Path


class ProjectHubOperations:
    def __init__(self, hub):
        self.hub = hub
        self.runtime = hub.runtime

    def _active(self, identifier):
        record = self.hub._record(identifier)
        if self.hub._current().get("name") != record["path"]:
            raise RuntimeError("The active project changed. Reopen this project before continuing.")
        return record

    def _response(self, record):
        self.hub._remember(record)
        return {"project": record, "workspace": self.hub._current()}

    def rename(self, identifier, name):
        from app.services.project_hub import project_name

        with self.hub.lock, self.runtime._lock:
            record = self._active(identifier)
            name = project_name(name)
            self.runtime.rename_project(name, expected_path=record["path"])
            return self._response({**record, "name": name})

    def save(self, identifier):
        with self.hub.lock, self.runtime._lock:
            record = self._active(identifier)
            self.hub._check_idle()
            self.runtime.save_project_as(record["path"], replace=True)
            return self._response(record)

    def save_as(self, identifier, name):
        from app.services.project_hub import project_name

        with self.hub.lock, self.runtime._lock:
            source = self._active(identifier)
            self.hub._check_idle()
            name = project_name(name)
            try:
                record = self.hub._adopt({**source, "id": uuid.uuid4().hex, "name": name})
                self.runtime.rename_project(name, expected_path=record["path"])
                for path in self.hub.visible_files(identifier):
                    destination = Path(record["folder"]) / path.relative_to(source["folder"])
                    if not destination.exists():
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(path, destination)
            except Exception:
                if self.hub._current().get("name") != source["path"]:
                    self.runtime.open_project(source["path"])
                raise
            return self._response(record)

    def open_path(self, path):
        with self.hub.lock, self.runtime._lock:
            self.hub._check_idle()
            try:
                self.runtime.open_project(path)
            except FileNotFoundError as exc:
                raise KeyError(str(exc)) from exc
            current = self.hub._current()
            record = next((row for row in self.hub.list()["projects"] if row["path"] == current["name"]), None)
            if not record or not record["managed"]:
                record = self.hub._adopt(self.hub._legacy(current))
            return self._response(record)

    def bundle(self, identifier):
        with self.hub.lock, self.runtime._lock:
            record = self._active(identifier)
            path, filename = self.runtime.build_project_bundle_zip()
            try:
                with zipfile.ZipFile(path, "a", compression=zipfile.ZIP_DEFLATED) as archive:
                    for source in self.hub.visible_files(identifier):
                        archive.write(source, "project-files/" + source.relative_to(record["folder"]).as_posix())
            except Exception:
                Path(path).unlink(missing_ok=True)
                raise
            return path, filename

    def restore_zip(self, path):
        with self.hub.lock, self.runtime._lock:
            self.hub._check_idle()
            if not zipfile.is_zipfile(path):
                raise ValueError("Select a valid workspace ZIP.")
            with zipfile.ZipFile(path) as archive:
                documents = []
                for member in archive.infolist():
                    if not member.filename.startswith("project-files/") or member.is_dir():
                        continue
                    relative = Path(member.filename[len("project-files/") :])
                    if (
                        not relative.parts
                        or relative.is_absolute()
                        or any(part.startswith(".") for part in relative.parts)
                        or ".legion" in relative.name
                        or "\\" in str(relative)
                    ):
                        raise ValueError("Invalid project document path in ZIP.")
                    documents.append((member.filename, relative))
            self.runtime.restore_project_bundle_zip(path)
            record = self.hub._adopt(self.hub._legacy(self.hub._current()))
            # The existing restore validates session/tool output. Restore the new
            # shell's documents separately, using the same containment boundary.
            with zipfile.ZipFile(path) as archive:
                for member, relative in documents:
                    if relative.as_posix() in {"reader-control.json", "reader-alerts.json"}:
                        continue
                    destination = Path(record["folder"]) / relative
                    if not destination.resolve().is_relative_to(Path(record["folder"]).resolve()):
                        raise ValueError("Invalid project document path in ZIP.")
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(member) as source, destination.open("wb") as target:
                        shutil.copyfileobj(source, target)
            return self._response(record)
