"""Idempotent offline inventory/result settlement; this module never runs tools."""

import json
from app.scanning.profile import validate_profile, summarize, owned_file
from app.services.project_background import atomic_json


def settle_profile(project, record, parent, root, identity, importer, *, journal=None, write=atomic_json):
    try:
        source_identity = {name: value for name, value in identity.items() if name.endswith(".py")}
        document, digest, xml = validate_profile(parent / "profile", record["target_ip"], source_identity)
        record["profile_path"] = str((parent / "profile/device-profile.json").relative_to(root))
        record["profile_sha256"] = digest
        if journal:
            entry = journal.get(record["execution_id"])
            if entry.profile_sha256 and entry.profile_sha256 != digest:
                raise ValueError("Retained profile differs from the protected import identity.")
            journal.update(entry.id, profile_sha256=digest)
        summary = summarize(document)
        record["implementation_unchanged"] = False
        audit_path = parent / "implementation-audit.json"
        if audit_path.is_file():
            from app.scanning.implementations import comparison

            audit_path = owned_file(parent, "implementation-audit.json", 2 * 1024 * 1024)
            # The audit is app-owned but still bounded before parsing.
            with audit_path.open("rb") as stream:
                raw_audit = stream.read(2 * 1024 * 1024 + 1)
            if len(raw_audit) > 2 * 1024 * 1024:
                raise ValueError("Implementation audit exceeds its 2 MiB limit.")
            audit = json.loads(raw_audit)
            checked = comparison(audit["before"], audit["after"])
            record["implementation_audit_path"] = str(audit_path.relative_to(root))
            summary["dependency_audit"] = (
                "Available implementation identities unchanged; missing tools and shared-library limits are recorded."
                if checked["unchanged"]
                else "Implementation changed or its coverage is unmeasured."
            )
            record["implementation_unchanged"] = checked["unchanged"]
        summary.update(
            id=record["id"],
            host_id=record["host_id"],
            target_ip=record["target_ip"],
            profile_sha256=digest,
            profile_path=str((parent / "profile/device-profile.json").relative_to(root)),
        )

        # Validated evidence remains openable even if a later DB/file
        # write fails. The journal never implies cross-store atomicity.
        from app.scanning import repository

        prior = repository.get(project, record["id"])
        if prior is not None:
            if prior.get("profile_sha256") != digest:
                raise ValueError("Saved profile changed after import.")
            summary = prior
        progress = record["import_progress"] = {
            "status": "running",
            "phase": "inventory",
            "inventory_committed": False,
            "summary_committed": False,
            "inventory_may_be_partial": False,
        }

        write(parent / "run.json", record)
        from app.scanning.import_transaction import import_once

        def importing(phase):
            progress["phase"] = phase
            write(parent / "run.json", record)

        import_once(project, record, xml, digest, summary, importer, importing)
        progress.update(inventory_committed=xml is not None, summary_committed=True, phase="summary_file")

        write(parent / "run.json", record)
        write(parent / "summary.json", summary)
        progress.update(status="completed", phase="complete")

        incomplete = (
            document["run"]["status"] == "partial"
            or summary["problems"]
            or document["run"].get("error")
            or document.get("cleanup", {}).get("success") is False
            or record.get("implementation_unchanged") is False
        )
        state = "partial" if incomplete else "completed"
        if document["run"]["mode"] != "active":
            state = "planned"
        if document["run"].get("interrupted"):
            state = "cancelled"
        reason = document["run"].get("error") or (
            "Scanner output is incomplete; see task, cleanup and implementation audit outcomes." if incomplete else ""
        )
        return state, reason, summary
    except Exception as exc:
        progress = record.get("import_progress")
        if progress and progress["phase"] != "complete":
            progress.update(status="failed", reason=str(exc))
        raise
