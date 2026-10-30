import threading
import unittest
from unittest.mock import Mock

from db.SqliteDbAdapter import Database


class DatabaseCommitTest(unittest.TestCase):
    def setUp(self):
        self.database = Database.__new__(Database)
        self.database.dbsemaphore = threading.Semaphore(1)
        self.database.log = Mock()
        self.session = Mock()
        self.database.session = Mock(return_value=self.session)

    def assert_lock_released(self):
        self.assertTrue(self.database.dbsemaphore.acquire(blocking=False))
        self.database.dbsemaphore.release()

    def test_commit_succeeds_without_retry_or_rollback(self):
        self.database.commit()
        self.session.commit.assert_called_once_with()
        self.session.rollback.assert_not_called()
        self.assert_lock_released()

    def test_failure_rolls_back_and_reaches_caller(self):
        error = RuntimeError("write failed")
        self.session.commit.side_effect = error
        with self.assertRaises(RuntimeError) as caught:
            self.database.commit()
        self.assertIs(error, caught.exception)
        self.session.commit.assert_called_once_with()
        self.session.rollback.assert_called_once_with()
        self.assert_lock_released()

    def test_rollback_failure_preserves_original_error_and_releases_lock(self):
        error = RuntimeError("write failed")
        self.session.commit.side_effect = error
        self.session.rollback.side_effect = ValueError("rollback failed")
        with self.assertRaises(RuntimeError) as caught:
            self.database.commit()
        self.assertIs(error, caught.exception)
        self.assert_lock_released()
