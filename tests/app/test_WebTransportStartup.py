"""Exercise the actual launcher, including its native default and temporary legacy option."""

import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]


class WebTransportStartupTest(unittest.TestCase):
    def test_launcher_serves_both_stacks_with_qt_unavailable(self):
        for stack in ("asgi", "legacy"):
            with self.subTest(stack=stack), tempfile.TemporaryDirectory() as folder:
                target = Path(folder)
                (target / "tmp").mkdir()
                with socket.socket() as reserved:
                    reserved.bind(("127.0.0.1", 0))
                    port = reserved.getsockname()[1]
                env = dict(
                    os.environ,
                    LEGION_HOME=str(target / "home"),
                    TMPDIR=str(target / "tmp"),
                    PYTHONDONTWRITEBYTECODE="1",
                )
                with (target / "server.log").open("w+") as output:
                    command = [
                        sys.executable,
                        "-c",
                        "import sys,runpy;sys.modules['PyQt6']=None;runpy.run_path('legion.py',run_name='__main__')",
                        "--web",
                        "--web-stack",
                        stack,
                        "--web-port",
                        str(port),
                    ]
                    process = subprocess.Popen(command, cwd=ROOT, env=env, stdout=output, stderr=subprocess.STDOUT)
                    try:
                        deadline = time.monotonic() + 15
                        while True:
                            try:
                                with urlopen(f"http://127.0.0.1:{port}/health", timeout=0.5) as response:
                                    self.assertEqual({"status": "ok"}, json.load(response))
                                    self.assertEqual(stack == "asgi", response.headers.get("X-Legion-API") == "fastapi")
                                break
                            except OSError:
                                if process.poll() is not None or time.monotonic() > deadline:
                                    output.seek(0)
                                    self.fail(output.read()[-5000:])
                                time.sleep(0.05)
                    finally:
                        process.terminate()
                        try:
                            process.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            process.kill()
                            process.wait(timeout=5)
