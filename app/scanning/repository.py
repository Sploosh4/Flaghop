"""Project database records use relative evidence paths; reload never reruns a scan."""

import json
from sqlalchemy import text


def table(connection):
    connection.execute(
        text(
            "CREATE TABLE IF NOT EXISTS flaghop_deep_scans (run_id TEXT PRIMARY KEY, host_id INTEGER NOT NULL, target TEXT NOT NULL, profile_sha256 TEXT NOT NULL, summary TEXT NOT NULL)"
        )
    )


def save(project, run_id, host_id, target, digest, summary):
    with project.database.engine.begin() as connection:
        table(connection)
        previous = connection.execute(
            text("SELECT profile_sha256 FROM flaghop_deep_scans WHERE run_id=:id"), {"id": run_id}
        ).scalar()
        if previous and previous != digest:
            raise ValueError("A scan identifier already belongs to different evidence.")
        connection.execute(
            text(
                "INSERT INTO flaghop_deep_scans VALUES (:id,:host,:target,:sha,:summary) ON CONFLICT(run_id) DO NOTHING"
            ),
            {"id": run_id, "host": host_id, "target": target, "sha": digest, "summary": json.dumps(summary)},
        )
        return not bool(previous)


def summaries(project, host_id=None):
    with project.database.engine.begin() as connection:
        table(connection)
        query = (
            "SELECT summary FROM flaghop_deep_scans"
            + (" WHERE host_id=:host" if host_id is not None else "")
            + " ORDER BY rowid DESC LIMIT 200"
        )
        return [json.loads(row[0]) for row in connection.execute(text(query), {"host": host_id})]
