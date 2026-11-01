"""Debounced filesystem events with periodic reconciliation and graceful shutdown."""
import logging
import os
from pathlib import Path
import threading
import time

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from watchdog.observers.polling import PollingObserver

LOG = logging.getLogger("hash-watch")


class FolderWatcher(FileSystemEventHandler):
    def __init__(self, scanner, *, debounce=0.6, reconcile=30, polling=False):
        self.scanner = scanner
        self.debounce = debounce
        self.reconcile = reconcile
        self.pending = {}
        self.lock = threading.Lock()
        self.stop = scanner.stop
        self.overflow = False
        self.observer = PollingObserver(timeout=0.5) if polling else Observer()

    def enqueue(self, path):
        path = Path(os.path.abspath(path))
        if not self.scanner.allowed(path):
            return
        with self.lock:
            if len(self.pending) >= 2048 and path not in self.pending:
                self.overflow = True
                return
            self.pending[path] = time.monotonic() + self.debounce

    def event(self, path, directory=False):
        # Directory expansion happens on the worker, never in Watchdog's dispatcher.
        self.enqueue(path)

    def on_created(self, event):
        self.event(event.src_path, event.is_directory)

    def on_modified(self, event):
        if not event.is_directory:
            self.event(event.src_path)

    def on_moved(self, event):
        self.event(event.dest_path, event.is_directory)

    def scan_path(self, path):
        try:
            if path.is_dir():
                for file in self.scanner.files(path):
                    self.enqueue(file)
                return
            report = self.scanner.scan(path)
            if report:
                LOG.info("Saved evidence: %s", report)
        except BlockingIOError:
            self.enqueue(path)
        except FileNotFoundError:
            LOG.debug("File removed before scan: %s", path)
        except OSError:
            LOG.exception("Cannot read %s", path)

    def run(self, *, ready=None):
        self.observer.schedule(self, str(self.scanner.watch), recursive=True)
        self.observer.start()  # Start before inventory so creations during inventory are caught.
        try:
            for file in self.scanner.files():
                self.enqueue(file)
            if ready:
                ready.set()
            last_reconcile = time.monotonic()
            LOG.info("Watching %s; results: %s", self.scanner.watch, self.scanner.output)
            while not self.stop.is_set():
                now = time.monotonic()
                with self.lock:
                    due = [p for p, deadline in self.pending.items() if deadline <= now][:32]
                    for path in due:
                        del self.pending[path]
                    overflow = self.overflow
                    self.overflow = False
                for path in due:
                    if self.stop.is_set():
                        break
                    self.scan_path(path)
                if overflow or time.monotonic() - last_reconcile >= self.reconcile:
                    # Visit one at a time to avoid repeatedly starving the first 2,048 paths.
                    for path in self.scanner.files():
                        if self.stop.is_set():
                            break
                        self.scan_path(path)
                    last_reconcile = time.monotonic()
                if not self.stop.is_set():
                    self.scanner.work_one()
                self.stop.wait(0.1)
        finally:
            self.observer.stop()
            self.observer.join(timeout=5)
