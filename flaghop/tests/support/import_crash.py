"""Stop a real offline import at one durable boundary for an external SIGKILL."""

import json
import os
from pathlib import Path
import sys
import threading
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
project_id, run_id, journal_path, parent_path, phase = sys.argv[1:]
parent = Path(parent_path)
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from app.services.execution_journal import ExecutionJournal
from app.services.project_hub import ProjectHub
from app.services.project_background import atomic_json
from app.scanning.settlement import settle_profile
from app.importers.nmap_runner import import_nmap_xml_into_project
from app.importers.NmapImporter import NmapImporter
from app.scanning import repository

journal = ExecutionJournal(journal_path)
runtime = WebRuntime(create_default_logic(), execution_journal=journal)
hub = ProjectHub(runtime)
project = hub.open(project_id)["project"]
record = json.loads((parent / "run.json").read_text())
entry = journal.create(
    project["path"],
    project_id=project_id,
    run_id=run_id,
    directory=record["directory"],
    source_identity=record["source_identity"],
    host_id=record["host_id"],
    target_ip=record["target_ip"],
)
record["execution_id"] = entry.id
atomic_json(parent / "run.json", record)


def checkpoint():
    with (parent / "at-checkpoint").open("w") as stream:
        stream.write(phase)
        stream.flush()
        os.fsync(stream.fileno())
    threading.Event().wait(30)
    raise RuntimeError("Parent did not kill the bounded import fixture")


original_scripts = NmapImporter._store_scripts
original_save = repository.save


def scripts(importer, *args):
    original_scripts(importer, *args)
    if phase == "inventory":
        checkpoint()


def save(*args, **kwargs):
    result = original_save(*args, **kwargs)
    if phase == "summary_database":
        checkpoint()
    return result


def write(path, value):
    if phase == "summary_file" and path.name == "summary.json":
        checkpoint()
    atomic_json(path, value)


with patch.object(NmapImporter, "_store_scripts", scripts), patch.object(repository, "save", save):
    state, reason, summary = settle_profile(
        runtime.logic.activeProject,
        record,
        parent,
        Path(project["folder"]),
        record["source_identity"],
        import_nmap_xml_into_project,
        journal=journal,
        write=write,
    )
    record.update(status=state, reason=reason, summary=summary, settlement="pending")
    atomic_json(parent / "run.json", record)
    checkpoint()
