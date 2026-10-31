"""User-selected project storage and explicit, reversible folder migration."""

from contextlib import ExitStack
import fcntl
import json
from pathlib import Path
import shutil
import tempfile


def default_save_folder():
    return Path.home() / "Documents" / "FlagHop"


def writable_save_folder(value):
    if not value or "\x00" in value:
        raise ValueError("Enter an absolute folder path.")
    folder = Path(value).expanduser()
    if not folder.is_absolute():
        raise ValueError("Enter an absolute folder path.")
    folder = folder.resolve()
    try:
        folder.mkdir(parents=True, exist_ok=True, mode=0o700)
        with tempfile.TemporaryFile(dir=folder):
            pass
    except OSError as exc:
        raise ValueError(f"The save folder is not writable: {folder}") from exc
    return folder


def migrate_project_folders(hub, destination, data):
    """Move an existing root only after jobs and external readers have stopped."""
    source = hub.root.resolve()
    if source == destination:
        return
    if source.is_relative_to(destination) or destination.is_relative_to(source):
        raise ValueError("Choose a folder outside the existing project folder tree.")
    hub._check_idle()
    moves = [(path, destination / path.name) for path in source.iterdir()] if source.exists() else []
    if any(target.exists() or target.is_symlink() for _, target in moves):
        raise ValueError("The destination contains matching names. Choose an empty folder.")
    original = hub._read()
    active = hub._current().get("name", "")
    active_moves = bool(active and Path(active).is_relative_to(source))
    moved = []
    compatibility_link = False
    with ExitStack() as locks:
        for directory, _ in moves:
            if not directory.is_dir() or directory.is_symlink():
                continue
            for relative in (".reader-state/owner.lock", "ciphey/.lock", "password-crackers/.lock"):
                lock_path = directory / relative
                if lock_path.is_file():
                    stream = locks.enter_context(lock_path.open("r"))
                    try:
                        fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    except BlockingIOError as exc:
                        raise RuntimeError("Pause file processing before moving project folders.") from exc
        try:
            if active_moves:
                hub.runtime._close_active_project()
            for old, new in moves:
                shutil.move(str(old), str(new))
                moved.append((old, new))
            for row in data["projects"]:
                for key in ("path", "folder"):
                    if row.get(key) and Path(row[key]).is_relative_to(source):
                        row[key] = str(destination / Path(row[key]).relative_to(source))
            if active_moves:
                hub.runtime.open_project(str(destination / Path(active).relative_to(source)))
            if moved and not any(source.iterdir()):
                source.rmdir()
                try:
                    source.symlink_to(destination, target_is_directory=True)
                except OSError:
                    source.mkdir()
                    raise
                compatibility_link = True
            hub._write(data)
        except Exception:
            if active_moves:
                hub.runtime._close_active_project()
            if compatibility_link:
                source.unlink()
                source.mkdir()
            for old, new in reversed(moved):
                shutil.move(str(new), str(old))
            hub._write(original)
            if active_moves:
                hub.runtime.open_project(active)
            raise


def download_folder(config_path, project_id=None):
    """Choose the native save-dialog directory without changing browser storage."""
    try:
        data = json.loads(Path(config_path).read_text())
    except (OSError, ValueError):
        data = {}
    identifier = project_id or data.get("active_project")
    for row in data.get("projects", []):
        if row.get("id") == identifier and row.get("managed") and row.get("folder"):
            return Path(row["folder"]) / "exports"
    return Path(data.get("save_folder") or default_save_folder())
