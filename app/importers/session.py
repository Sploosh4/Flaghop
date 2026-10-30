"""Own an import's SQLAlchemy session and write lock without changing stage commits."""

import logging


class ImportSession:
    def __init__(self, database):
        self.database = database
        self.session = None
        self._owns_lock = False

    def __enter__(self):
        self.session = self.database.session()
        return self

    def acquire_write_lock(self):
        if not self._owns_lock:
            self.database.dbsemaphore.acquire()
            self._owns_lock = True

    def release_write_lock(self):
        if self._owns_lock:
            self.database.dbsemaphore.release()
            self._owns_lock = False

    def __exit__(self, exc_type, exc, traceback):
        try:
            if exc_type is not None:
                try:
                    self.session.rollback()
                except Exception:
                    logging.getLogger(__name__).exception("Import rollback failed; preserving original error")
        finally:
            try:
                self.release_write_lock()
            finally:
                self.session.close()
        return False
