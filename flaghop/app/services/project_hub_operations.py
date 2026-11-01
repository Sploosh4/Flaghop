"""Project controls shared by the native API and domain callers."""

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
            from app.services.execution_journal import require_settled

            require_settled(self.runtime, record["path"])
            self.hub._check_idle()
            self.runtime.save_project_as(record["path"], replace=True)
            return self._response(record)

    def save_as(self, identifier, name):
        from app.services.project_hub import project_name

        with self.hub.lock, self.runtime._lock:
            source = self._active(identifier)
            from app.services.execution_journal import require_settled

            require_settled(self.runtime, source["path"])
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
                from app.scanning.history_identity import rebind_history

                rebind_history(self.runtime.logic.activeProject, record["id"])
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
                        properties = self.runtime.logic.activeProject.properties
                        if any(
                            source.is_relative_to(Path(folder))
                            for folder in (properties.outputFolder, properties.runningFolder)
                        ):
                            continue
                        archive.write(source, "project-files/" + source.relative_to(record["folder"]).as_posix())
            except Exception:
                Path(path).unlink(missing_ok=True)
                raise
            return path, filename

    def restore_zip(self, path):
        from app.services.project_restore import restore_into_hub

        return restore_into_hub(self.hub, path)
