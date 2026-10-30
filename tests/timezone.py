"""Temporary process-local timezone for tests of legacy, offset-free timestamps."""

from contextlib import contextmanager
import os
import time
import unittest
from unittest.mock import patch


@contextmanager
def local_timezone(zone):
    if not hasattr(time, "tzset"):
        raise unittest.SkipTest("The platform cannot select a process-local timezone")
    try:
        with patch.dict(os.environ, {"TZ": zone}):
            time.tzset()
            yield
    finally:
        # patch.dict has restored the caller's TZ before resetting libc's timezone.
        time.tzset()
