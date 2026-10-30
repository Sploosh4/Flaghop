"""SQLite schema primitives. Callers own transactions and use trusted schema identifiers."""

from sqlalchemy import text


def ensure_column(session, table_name: str, column_name: str, column_type: str):
    rows = session.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    if str(column_name) not in {str(row[1]) for row in rows if len(row) > 1}:
        session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
