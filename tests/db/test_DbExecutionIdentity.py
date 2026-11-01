"""Fresh interpreter coverage: test discovery must not hide entity import order."""

import os
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest import TestCase

ROOT = Path(__file__).resolve().parents[2]


class DatabaseExecutionIdentityTest(TestCase):
    def test_new_and_legacy_database_initialize_before_process_entity_import(self):
        script = """
import sqlite3,sys
from pathlib import Path
path=Path(sys.argv[1])
if sys.argv[2]=='legacy':
    with sqlite3.connect(path) as connection:
        connection.execute('CREATE TABLE process (id INTEGER PRIMARY KEY,pid TEXT,status TEXT)')
        connection.execute("INSERT INTO process VALUES (7,'original pid','Finished')")
assert 'db.entities.process' not in sys.modules
from db.SqliteDbAdapter import Database
database=Database(str(path))
with database.engine.connect() as connection:
    assert connection.exec_driver_sql('SELECT 1').scalar()==1
    if sys.argv[2]=='legacy':
        columns={row[1] for row in connection.exec_driver_sql('PRAGMA table_info(process)')}
        assert 'execution_id' in columns, columns
        assert tuple(connection.exec_driver_sql('SELECT id,pid,status,execution_id FROM process').first())==(7,'original pid','Finished',None)
database.dispose()
print('fresh interpreter database migration passed')
"""
        with tempfile.TemporaryDirectory(dir=ROOT / ".tmp") as folder:
            for mode in ("new", "legacy"):
                with self.subTest(mode=mode):
                    result = subprocess.run(
                        [sys.executable, "-B", "-c", script, str(Path(folder) / (mode + ".legion")), mode],
                        cwd=ROOT,
                        env={**os.environ, "LEGION_HOME": str(Path(folder) / "config")},
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )
                    self.assertEqual(0, result.returncode, result.stdout + result.stderr)
                    self.assertIn("fresh interpreter database migration passed", result.stdout)
