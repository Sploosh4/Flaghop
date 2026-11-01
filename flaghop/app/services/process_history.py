"""Bounded historical control reconciliation, with no signalling or execution."""

import json
from pathlib import Path
from sqlalchemy import text
from app.contracts.observations.process_history import ProcessHistoryEvent, ProcessHistoryOrigin, ProcessHistoryView
from app.services.storage_admission import StorageAdmission
from app.timing import getTimestamp

MAX_ORIGIN = 128 * 1024
BATCH = 32
CONTROL_LIMITS = {"pid": 128, "status": 64, "execution_id": 128, "endTime": 128}


def parse_origin(raw):
    if not isinstance(raw, str):
        raise ValueError("Process history provenance must be bounded JSON text; original data was preserved.")
    if len(raw.encode()) > MAX_ORIGIN:
        raise ValueError("Process history provenance exceeds its bound; original data was preserved.")
    try:
        return ProcessHistoryOrigin.model_validate_json(raw)
    except ValueError:
        raise ValueError("Invalid process history provenance; original data was preserved.") from None


def _history_exists(connection):
    return bool(
        connection.exec_driver_sql(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='flaghop_process_history'"
        ).scalar()
    )


def _validate_origins(connection):
    if not _history_exists(connection):
        return
    # CASE prevents transferring oversized cells into Python at all. Iterate
    # one bounded JSON value at a time instead of materializing history.
    rows = connection.execute(
        text(
            "SELECT CASE WHEN length(CAST(provenance AS BLOB))<=:limit THEN provenance ELSE NULL END FROM flaghop_process_history"
        ),
        {"limit": MAX_ORIGIN},
    )
    for row in rows:
        if row[0] is None:
            raise ValueError("Process history provenance exceeds its bound; original data was preserved.")
        parse_origin(row[0])


def reconcile(project, *, copied=False, runtime=None, owner_id="", source_project="", admission=None):
    path = str(project.properties.projectName)
    protected_ids = set()
    protected_executions = set()
    if not copied and runtime is not None:
        journal = getattr(runtime, "execution_journal", None)
        for entry in journal.pending(path) if journal is not None else []:
            protected_ids.add(entry.process_id)
            protected_executions.add(entry.id)
        registry = getattr(runtime, "process_registry", None)
        if registry is not None:
            with registry.lock:
                protected_ids.update(registry.active)
    where = "status IN ('Running','Waiting')"
    if copied:
        where += " OR (pid IS NOT NULL AND pid NOT IN ('','-1','0')) OR (execution_id IS NOT NULL AND execution_id!='')"
    where = "(" + where + ")"
    parameters = {}
    if not copied:
        if protected_ids:
            names = []
            for index, value in enumerate(protected_ids):
                key = f"owned_id_{index}"
                parameters[key] = value
                names.append(":" + key)
            where += " AND id NOT IN (" + ",".join(names) + ")"
        if protected_executions:
            names = []
            for index, value in enumerate(protected_executions):
                key = f"owned_execution_{index}"
                parameters[key] = value
                names.append(":" + key)
            where += " AND (execution_id IS NULL OR execution_id NOT IN (" + ",".join(names) + "))"
    with project.database.engine.connect() as connection:
        if not connection.exec_driver_sql("SELECT 1 FROM sqlite_master WHERE type='table' AND name='process'").scalar():
            return
        count = connection.execute(text("SELECT COUNT(*) FROM process WHERE " + where), parameters).scalar()
        history_exists = _history_exists(connection)
        existing_bytes = (
            connection.execute(
                text("SELECT COALESCE(SUM(length(CAST(provenance AS BLOB))),0) FROM flaghop_process_history")
            ).scalar()
            if history_exists
            else 0
        )
    if not count and not history_exists:
        return
    if not count:
        with project.database.engine.connect() as connection:
            _validate_origins(connection)
        return
    reason = (
        "Copied process history; no process was resumed."
        if copied
        else "Reopened history without trusted live ownership; process state is unverified."
    )
    event = ProcessHistoryEvent(
        reason=reason, recorded_at=getTimestamp(True), owner_id=owner_id, source_project=source_project or path
    ).model_dump()
    # Admit BEFORE fetching/parsing control cells. Account for SQLite rollback,
    # preserved origins, escaped control values and prospective B-tree pages.
    per_row = 6 * sum(CONTROL_LIMITS.values()) + 3 * len(json.dumps(event).encode()) + 512
    amount = 2 * Path(path).stat().st_size + count * per_row + 3 * existing_bytes + 65536
    admission = admission or getattr(runtime, "storage_admission", None) or StorageAdmission()
    reservation = admission.reserve(amount, Path(path).parent)
    try:
        with project.database.engine.begin() as connection:
            connection.exec_driver_sql("BEGIN IMMEDIATE")
            invalid = []
            for name, limit in CONTROL_LIMITS.items():
                accepted = "'text','integer','null'" if name == "pid" else "'text','null'"
                invalid.append(f"(typeof({name}) NOT IN ({accepted}) OR length(CAST({name} AS BLOB))>{limit})")
            invalid.append(
                "(typeof(estimatedRemaining) NOT IN ('integer','real','text','null') OR (typeof(estimatedRemaining)='text' AND length(CAST(estimatedRemaining AS BLOB))>128) OR (typeof(estimatedRemaining) IN ('integer','real') AND ABS(estimatedRemaining)>1000000000000))"
            )
            bad = connection.execute(
                text("SELECT id FROM process WHERE " + where + " AND (" + " OR ".join(invalid) + ") LIMIT 1"),
                parameters,
            ).first()
            if bad is not None:
                raise ValueError("Process history control exceeds supported bounds/type; no controls were changed.")
            _validate_origins(connection)
            if not count:
                return
            connection.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS flaghop_process_history (process_id INTEGER PRIMARY KEY,provenance TEXT NOT NULL)"
                )
            )
            after = None
            while True:
                suffix = " AND id>:after" if after is not None else ""
                # Keyset paging remains stable when control fields change, even
                # if an imported database has an index on status or PID.
                rows = (
                    connection.execute(
                        text(
                            "SELECT id,pid,status,execution_id,estimatedRemaining,endTime FROM process WHERE "
                            + where
                            + suffix
                            + " ORDER BY id LIMIT :batch"
                        ),
                        {**parameters, "after": after, "batch": BATCH},
                    )
                    .mappings()
                    .fetchall()
                )
                if not rows:
                    break
                after = rows[-1]["id"]
                for row in rows:
                    if not copied and (row["id"] in protected_ids or row["execution_id"] in protected_executions):
                        continue
                    controls = {key: value for key, value in row.items() if key != "id"}
                    original = ProcessHistoryOrigin(original_controls=controls, events=[event]).model_dump()
                    previous = connection.execute(
                        text("SELECT provenance FROM flaghop_process_history WHERE process_id=:id"), {"id": row["id"]}
                    ).scalar()
                    if previous:
                        original = parse_origin(previous).model_dump()
                        original["events"].append(event)
                        original = ProcessHistoryOrigin.model_validate(original).model_dump()
                    encoded = json.dumps(original)
                    if len(encoded.encode()) > MAX_ORIGIN:
                        raise ValueError("Process history provenance exceeds its bound; original data was preserved.")
                    connection.execute(
                        text(
                            "INSERT INTO flaghop_process_history VALUES (:id,:value) ON CONFLICT(process_id) DO UPDATE SET provenance=excluded.provenance"
                        ),
                        {"id": row["id"], "value": encoded},
                    )
                    connection.execute(
                        text(
                            "UPDATE process SET pid='-1',execution_id=NULL,status=CASE WHEN status IN ('Running','Waiting') THEN 'Interrupted' ELSE status END,estimatedRemaining=NULL WHERE id=:id"
                        ),
                        {"id": row["id"]},
                    )
    finally:
        reservation.close()


def origin_view(project, process_id):
    with project.database.engine.connect() as connection:
        if not _history_exists(connection):
            return None
        row = connection.execute(
            text(
                "SELECT CASE WHEN length(CAST(provenance AS BLOB))<=:limit THEN provenance ELSE NULL END FROM flaghop_process_history WHERE process_id=:id"
            ),
            {"id": process_id, "limit": MAX_ORIGIN},
        ).first()
    if row is None:
        return None
    if row[0] is None:
        raise ValueError("Process history provenance exceeds its bound; original data was preserved.")
    origin = parse_origin(row[0])
    event = origin.events[-1]
    status = origin.original_controls.get("status")
    pid = origin.original_controls.get("pid")
    # Commands and secret-bearing extensions stay in their original rows. Only
    # non-authoritative control provenance is exposed through this view.
    return ProcessHistoryView(
        original_status=status if isinstance(status, str) else "unknown",
        original_pid=str(pid) if isinstance(pid, (str, int)) and str(pid).lstrip("-").isdigit() else "unverified",
        reason=event.reason,
        recorded_at=event.recorded_at,
        source_project=event.source_project,
    ).model_dump()
