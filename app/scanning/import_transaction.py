"""Import inventory and its idempotency marker in one SQLite transaction.

The historical importer commits stages. Binding its sessions to an externally
owned connection makes those commits flushes; only this unit commits inventory
and the scan marker together. Recovery can then safely retry a saved profile.
"""

import threading
from types import SimpleNamespace
from sqlalchemy.orm import sessionmaker
from db.repositories.HostRepository import HostRepository
from app.scanning import repository


def import_once(project, record, xml, digest, summary, importer, phase):
    database = project.database
    with database.dbsemaphore, database.engine.connect() as connection:
        with connection.begin():
            # pysqlite otherwise defers BEGIN until the first write. An explicit
            # transaction also makes DDL and fault-injected stage commits atomic.
            connection.exec_driver_sql("BEGIN IMMEDIATE")
            repository.table(connection)
            previous = connection.exec_driver_sql(
                "SELECT profile_sha256 FROM flaghop_deep_scans WHERE run_id=?", (record["id"],)
            ).scalar()
            if previous:
                if previous != digest:
                    raise ValueError("Saved profile changed after import.")
                return False
            adapter = SimpleNamespace(session=sessionmaker(bind=connection), dbsemaphore=threading.Semaphore(1))
            if xml is not None:
                completed = importer(project, str(xml), database=adapter, host_repository=HostRepository(adapter))
                if not completed.completed:
                    raise RuntimeError("Inventory import did not finish; no changes were committed.")
            phase("summary_database")
            repository.save(
                project, record["id"], record["host_id"], record["target_ip"], digest, summary, connection=connection
            )
    return True
