"""Independent readiness heartbeats; never claim that worker tasks have stopped."""
import json
import logging
import os
from pathlib import Path
import threading
import time
import uuid

LOG = logging.getLogger('shared-readers.health')


class WorkerHealth:
    def __init__(self, interval=2):
        self.interval = interval
        self.worker_id = uuid.uuid4().hex
        self.targets = {}
        self.lock = threading.RLock()
        self.stop = threading.Event()
        self.thread = None
        self.errors = {}

    def _write(self, folder, project_id, available=True):
        # Address the reserved state directory by fd; a replaced symlink cannot
        # redirect this metadata write into another workspace or arbitrary file.
        descriptor = os.open(Path(folder)/'.reader-state', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        name = '.worker-status-' + uuid.uuid4().hex + '.tmp'
        try:
            if not available:
                try:
                    fd = os.open('worker-status.json', os.O_RDONLY | os.O_NOFOLLOW, dir_fd=descriptor)
                    with os.fdopen(fd) as stream:
                        if json.load(stream).get('worker_id') != self.worker_id:
                            return
                except FileNotFoundError:
                    return
            data = dict(schema_version=1, heartbeat_at=time.time() if available else 0,
                        engines=['cipher', 'password'], worker_id=self.worker_id,
                        project_id=project_id, available=available, observed_state='unsupported')
            if not available:
                data['stopped_at'] = time.time()
            fd = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=descriptor)
            with os.fdopen(fd, 'w') as stream:
                json.dump(data, stream)
                stream.write('\n'); stream.flush(); os.fsync(stream.fileno())
            os.replace(name, 'worker-status.json', src_dir_fd=descriptor, dst_dir_fd=descriptor)
            self.errors.pop(str(folder), None)
        finally:
            try:
                os.unlink(name, dir_fd=descriptor)
            except FileNotFoundError:
                pass
            os.close(descriptor)

    def _publish(self, folder, project_id, available=True):
        try:
            self._write(folder, project_id, available)
        except (OSError, ValueError, AttributeError) as error:
            if self.errors.get(str(folder)) != str(error):
                LOG.warning('Workspace heartbeat unavailable for %s: %s', folder, error)
            self.errors[str(folder)] = str(error)

    def set_targets(self, targets):
        with self.lock:
            for folder, project_id in self.targets.items():
                if folder not in targets or targets[folder] != project_id:
                    self._publish(folder, project_id, False)
            self.targets = dict(targets)

    def pulse(self):
        with self.lock:
            for folder, project_id in self.targets.items():
                self._publish(folder, project_id)

    def start(self):
        if self.thread is not None:
            return
        def loop():
            while not self.stop.is_set():
                self.pulse()
                self.stop.wait(self.interval)
        self.thread = threading.Thread(target=loop, name='reader-heartbeat', daemon=True)
        self.thread.start()

    def close(self):
        self.stop.set()
        if self.thread is not None:
            self.thread.join(timeout=5)
        with self.lock:
            for folder, project_id in self.targets.items():
                self._publish(folder, project_id, False)
            self.targets.clear()
