"""Start a local backend for a directly launched desktop, without owning existing services."""

from contextlib import contextmanager
from pathlib import Path
import json
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import urlopen


def backend_ready(url):
    try:
        with urlopen(url.rstrip("/") + "/health", timeout=0.5) as response:
            return json.load(response).get("status") == "ok"
    except (URLError, TimeoutError, ValueError, OSError):
        return False


@contextmanager
def local_backend(url="http://127.0.0.1:5000", startup_timeout=15):
    """Reuse an existing backend; stop a child only when this desktop started it."""
    if backend_ready(url):
        yield
        return
    root = Path(__file__).resolve().parents[1]
    process = subprocess.Popen(
        [sys.executable, str(root / "legion.py"), "--web", "--web-port", "5000"],
        cwd=root,
    )
    try:
        deadline = time.monotonic() + startup_timeout
        while not backend_ready(url):
            if process.poll() is not None:
                raise RuntimeError(f"Legion backend exited during startup ({process.returncode}).")
            if time.monotonic() >= deadline:
                raise TimeoutError("Legion backend did not become ready in time.")
            time.sleep(0.1)
        yield
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
