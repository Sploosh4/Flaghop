"""Bounded, read-only project file access for the reusable explorer/editor."""

import base64
import os
from pathlib import Path
import stat
from app.services.project_background import ProjectBackground


class ProjectFiles(ProjectBackground):
    def session(self):
        return {
            "session_id": self.identifier,
            "label": "Laptop",
            "kind": "local",
            "project_name": self.record.get("name", self.root.name),
            "project_id": self.identifier,
            "fixture": str(self.root),
            "connected": True,
            "mode": "local project",
            "capabilities": ["list", "preview"],
        }

    def checked(self, absolute):
        path = Path(absolute)
        if not path.is_absolute() or not path.is_relative_to(self.root):
            raise ValueError("File is outside this project.")
        if path == self.root:
            return path
        relative = path.relative_to(self.root)
        if any(part.startswith(".") or ".legion" in part for part in relative.parts):
            raise ValueError("Application state is not a project document.")
        return self.path(str(relative))

    def listing(self, absolute):
        path = self.checked(absolute)
        entries = []
        with os.scandir(path) as items:
            for entry in items:
                if (
                    entry.name.startswith(".")
                    or ".legion" in entry.name
                    or entry.name in {"reader-control.json", "reader-alerts.json"}
                ):
                    continue
                value = entry.stat(follow_symlinks=False)
                kind = "symlink" if entry.is_symlink() else "directory" if stat.S_ISDIR(value.st_mode) else "file"
                entries.append(
                    {
                        "name": entry.name,
                        "path": entry.path,
                        "kind": kind,
                        "size": value.st_size,
                        "mode": stat.filemode(value.st_mode),
                        "uid": value.st_uid,
                        "gid": value.st_gid,
                        "mtime_ns": value.st_mtime_ns,
                    }
                )
                if len(entries) >= 2000:
                    break
        return {"status": "ok", "path": str(path), "entries": entries, "truncated": len(entries) >= 2000}

    def preview(self, absolute):
        path = self.checked(absolute)
        with os.fdopen(os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK), "rb") as stream:
            if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
                raise ValueError("Only ordinary files can be previewed.")
            data = stream.read(65_537)
        return {
            "status": "ok",
            "data_b64": base64.b64encode(data[:65_536]).decode(),
            "truncated": len(data) > 65_536,
            "size": path.stat().st_size,
        }
