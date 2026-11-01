from __future__ import annotations

import datetime
import json
import os
import tempfile
import zipfile
from typing import List, Tuple


def build_project_bundle_zip(runtime) -> Tuple[str, str]:
    with runtime._lock:
        project = runtime._require_active_project()
        runtime._ensure_process_tables()
        props = project.properties
        project_file = str(getattr(props, "projectName", "") or "")
        output_folder = str(getattr(props, "outputFolder", "") or "")
        running_folder = str(getattr(props, "runningFolder", "") or "")
    try:
        process_history = runtime._process_history_records(project)
    except Exception:
        process_history = []
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%SZ")
    bundle_name = f"flaghop-session-{timestamp}.zip"
    root_name = f"flaghop-session-{timestamp}"
    tmp = tempfile.NamedTemporaryFile(prefix="flaghop-session-", suffix=".zip", delete=False)
    bundle_path = tmp.name
    tmp.close()

    try:
        with zipfile.ZipFile(bundle_path, "w", compression=zipfile.ZIP_DEFLATED, allowZip64=True) as archive:
            manifest = {
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "project_file": project_file,
                "output_folder": output_folder,
                "running_folder": running_folder,
                "process_history_count": len(process_history) if isinstance(process_history, list) else 0,
            }
            archive.writestr(
                f"{root_name}/manifest.json",
                json.dumps(manifest, indent=2, sort_keys=True),
            )
            zip_add_file_if_exists(
                archive,
                project_file,
                f"{root_name}/session/{os.path.basename(project_file or 'session.legion')}",
            )
            archive.writestr(
                f"{root_name}/process-history.json",
                json.dumps(list(process_history or []), indent=2, sort_keys=True),
            )
            zip_add_dir_if_exists(archive, output_folder, f"{root_name}/tool-output")
            zip_add_dir_if_exists(archive, running_folder, f"{root_name}/running")
    except Exception:
        try:
            if os.path.isfile(bundle_path):
                os.remove(bundle_path)
        except Exception:
            pass
        raise

    return bundle_path, bundle_name


def zip_add_file_if_exists(archive: zipfile.ZipFile, src_path: str, arc_path: str):
    path = str(src_path or "").strip()
    if not path or not os.path.isfile(path):
        return
    archive.write(path, arcname=str(arc_path).replace("\\", "/"))


def zip_add_dir_if_exists(archive: zipfile.ZipFile, src_dir: str, arc_root: str):
    root = str(src_dir or "").strip()
    if not root or not os.path.isdir(root):
        return []

    archive_errors: List[str] = []

    def _walk_error(exc):
        archive_errors.append(str(exc))

    for base, _dirs, files in os.walk(root, onerror=_walk_error):
        for file_name in files:
            full_path = os.path.join(base, file_name)
            if not os.path.isfile(full_path):
                continue
            rel_path = os.path.relpath(full_path, root)
            arc_path = os.path.join(arc_root, rel_path).replace("\\", "/")
            try:
                archive.write(full_path, arcname=arc_path)
            except OSError as exc:
                archive_errors.append(f"{full_path}: {exc}")

    if archive_errors:
        preview = "; ".join(archive_errors[:3])
        remaining = len(archive_errors) - min(len(archive_errors), 3)
        suffix = f"; +{remaining} more" if remaining > 0 else ""
        raise ValueError(f"Failed to add bundled artifacts from {root}: {preview}{suffix}")
    return []
