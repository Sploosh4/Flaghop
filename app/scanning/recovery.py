"""Recover trusted saved results and owned cleanup; never execute scanner argv."""

from pathlib import Path
import re
import os
from app.importers.nmap_runner import import_nmap_xml_into_project
from app.scanning.history import read_record
from app.scanning.settlement import settle_profile
from app.services.execution_journal import for_runtime
from app.services.project_background import ProjectBackground, atomic_json
from app.services.project_networks import NetworkHeld

SUMMARY_FIELDS = (
    "profile_status",
    "problems",
    "classification",
    "services",
    "candidates",
    "reproduced",
    "dependency_audit",
    "artifacts",
)


def recover(owner, scan_id):
    runtime = owner.hub.runtime
    with owner.hub.lock:
        if not re.fullmatch("[a-f0-9]{32}", scan_id):
            raise KeyError("Scan not found.")
        # The directory is taken from the protected journal, never an imported
        # request or a project-local PID. The caller selects only the run ID.
        journal = for_runtime(runtime)
        matches = [
            entry
            for path in journal.root.glob("*.json")
            if (entry := journal.get(path.stem)).run_id == scan_id and entry.project_id == owner.identifier
        ]
        if not matches:
            # A retry after successful settlement is a read, never renewed
            # cleanup authority. Completed copies can be opened the same way.
            filename = Path(owner.record["path"]).stem + "-tool-output/deep-scans/" + scan_id + "/run.json"
            path = owner.path(filename)
            if path.is_file():
                saved = read_record(path)
                if (
                    saved.get("id") == scan_id
                    and saved.get("project_id") == owner.identifier
                    and saved.get("settlement") == "complete"
                    and (saved.get("import_progress", {}).get("status") == "completed" or not saved.get("profile_path"))
                    and saved.get("recovery", {}).get("state") == "complete"
                ):
                    return saved
        if len(matches) != 1:
            raise NetworkHeld("No unique trusted execution journal remains. Copied history cannot authorize recovery.")
        entry = matches[0]
        return recover_entry(owner, entry)


def recover_entry(owner, entry):
    runtime = owner.hub.runtime
    journal = for_runtime(runtime)
    if entry.project_id != owner.identifier or entry.project_path != owner.record["path"]:
        raise NetworkHeld("Protected execution belongs to a different original workspace.")
    parent = owner.path(entry.directory)
    record = read_record(parent / "run.json")
    unpublished = (
        not entry.run_published
        and not any((entry.pid, entry.gid, entry.process_id))
        and not record.get("execution_id")
        and record.get("source_identity") == entry.model_dump()["source_identity"]
    )
    if (
        unpublished
        and not record.get("inherited_history")
        and all(
            record.get(key) == value
            for key, value in {
                "id": entry.run_id,
                "project_id": entry.project_id,
                "host_id": entry.host_id,
                "target_ip": entry.target_ip,
                "directory": entry.directory,
            }.items()
        )
    ):
        # A trusted prepare receipt can bridge a crash BEFORE run publication;
        # it cannot reinterpret a published/started or copied execution.
        record["execution_id"] = entry.id
    if (
        record.get("id") != entry.run_id
        or record.get("project_id") != owner.identifier
        or record.get("execution_id") != entry.id
        or record.get("inherited_history")
    ):
        raise NetworkHeld("Copied or mismatched history cannot authorize recovery.")
    if (
        record.get("host_id") != entry.host_id
        or record.get("target_ip") != entry.target_ip
        or record.get("directory") != entry.directory
    ):
        raise NetworkHeld("Saved target/directory differs from its protected queued identity.")
    job = runtime.jobs.get_job(record.get("job_id", 0))
    payload = (job or {}).get("payload", {})
    if (
        job
        and job["status"] in {"queued", "running"}
        and payload.get("scan_id") == entry.run_id
        and payload.get("project_id") == owner.identifier
    ):
        raise RuntimeError("This scan is still active or settling.")
    record["recovery"] = {"policy": "never-replay", "state": "cleaning", "retry_available": True}
    opened = None
    try:
        journal.cleanup(entry.id)
        record["recovery"]["state"] = "importing"
        atomic_json(parent / "run.json", record)
        active = getattr(runtime.logic, "activeProject", None)
        project = active
        if active is None or str(active.properties.projectName) != entry.project_path:
            # Open a separate database handle. Never select A over active B.
            project = opened = runtime.logic.projectManager.openExistingProject(entry.project_path)
        settle_process(project, entry)
        if not (parent / "profile/device-profile.json").is_file():
            record.update(
                status="interrupted",
                reason="Owned cleanup finished; no complete saved profile is available to import.",
                settlement="complete",
                recovery={"policy": "never-replay", "state": "complete", "retry_available": False},
            )
            atomic_json(parent / "run.json", record)
            journal.finish(entry.id)
            return record
        host = project.repositoryContainer.hostRepository.getHostByIP(record["target_ip"])
        if host is None or host.id != record["host_id"]:
            raise ValueError("Retained result target differs from its original workspace.")
        state, reason, summary = settle_profile(
            project,
            record,
            parent,
            owner.root,
            entry.model_dump()["source_identity"],
            import_nmap_xml_into_project,
            journal=journal,
        )
        if record.get("execution", {}).get("exit_code") is None and state == "completed":
            state, reason = "partial", "Saved results recovered; the original process exit was not measured."
        record.update(
            status=state,
            reason=reason,
            settlement="complete",
            summary={key: summary[key] for key in SUMMARY_FIELDS if key in summary},
            recovery={"policy": "never-replay", "state": "complete", "retry_available": False},
        )
        atomic_json(parent / "run.json", record)
        journal.finish(entry.id)
        runtime._emit_ui_invalidation("jobs", "overview", "hosts", "services", "graph")
        return record
    except Exception as exc:
        phase = journal.get(entry.id).phase
        record.update(
            status="held" if phase == "cleanup_required" else "failed",
            reason=str(exc),
            settlement="interrupted",
            recovery={
                "policy": "never-replay",
                "state": phase if phase == "cleanup_required" else "failed",
                "retry_available": True,
            },
        )
        atomic_json(parent / "run.json", record)
        raise
    finally:
        if opened is not None:
            runtime.logic.projectManager.closeProject(opened)
            opened.database.dispose()


def recovery_candidates(runtime, *, include_current=False):
    journal = for_runtime(runtime)
    candidates = {row.id: row for row in journal.orphans()}
    if include_current and journal.root.exists():
        registry = getattr(runtime, "process_registry", None)
        for path in journal.root.glob("*.json"):
            row = journal.get(path.stem)
            if row.id in candidates or row.owner_pid != os.getpid() or row.phase == "settled":
                continue
            job = runtime.jobs.get_job(row.job_id)
            if job and job["status"] in {"queued", "running"}:
                continue
            if registry is not None:
                with registry.lock:
                    if row.process_id in registry.active:
                        continue
            if row.phase == "cleanup_required" or row.job_id:
                candidates[row.id] = row
    return list(candidates.values())


def recovery_item(entry, reason=None):
    return {
        "execution_id": entry.id,
        "project_id": entry.project_id,
        "run_id": entry.run_id,
        "phase": entry.phase,
        "reason": reason or entry.reason or "Saved execution needs cleanup or offline result settlement.",
    }


def recovery_status(runtime):
    return {"pending": [recovery_item(entry) for entry in recovery_candidates(runtime, include_current=True)]}


def reconcile_orphans(runtime, hub, *, include_current=False):
    journal = for_runtime(runtime)
    report = {"recovered": [], "held": []}
    for entry in recovery_candidates(runtime, include_current=include_current):
        try:
            with hub.lock:
                if entry.phase == "settled":
                    journal.finish(entry.id)
                elif entry.run_id:
                    owner = ProjectBackground(hub, entry.project_id)
                    recover_entry(owner, entry)
                else:
                    journal.cleanup(entry.id)
                    active = getattr(runtime.logic, "activeProject", None)
                    opened = None
                    try:
                        project = active
                        if active is None or str(active.properties.projectName) != entry.project_path:
                            project = opened = runtime.logic.projectManager.openExistingProject(entry.project_path)
                        settle_process(project, entry)
                    finally:
                        if opened is not None:
                            runtime.logic.projectManager.closeProject(opened)
                            opened.database.dispose()
                    journal.finish(entry.id)
            report["recovered"].append(entry.id)
        except Exception as exc:
            report["held"].append(recovery_item(journal.get(entry.id), str(exc)))
    return report


def settle_process(project, entry):
    from sqlalchemy import text
    from app.timing import getTimestamp

    # The DB link commits with the Waiting row. It closes the crash window
    # before its numeric row ID can be published to the separate journal.
    with project.database.engine.begin() as connection:
        connection.execute(
            text(
                "UPDATE process SET status='Cancelled',endTime=:ended,estimatedRemaining=NULL WHERE status IN ('Running','Waiting') AND (execution_id=:execution OR (:id>0 AND id=:id))"
            ),
            {"ended": getTimestamp(True), "execution": entry.id, "id": entry.process_id},
        )
