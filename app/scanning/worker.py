"""CLI child adapter: unchanged scanner, owned proxy handshake and interrupt cleanup."""

import json
import os
from pathlib import Path
import signal
import sys
import time
import uuid

from app.scanning.source import scanner_source
from app.scanning.proxy_channel import read_json
from app.scanning.implementations import snapshot, comparison
from app.services.project_background import atomic_json


def proxy_adapter(channel, token, proxy_type):
    class GuardedProxy(proxy_type):
        def exchange(self, operation):
            message = {
                "token": token,
                "sequence": uuid.uuid4().hex,
                "operation": operation,
                "port": self.server.server_port,
            }
            atomic_json(channel, message)
            deadline = time.monotonic() + 12
            while time.monotonic() < deadline:
                try:
                    reply = read_json(channel.with_suffix(".ack")) or {}
                    if reply.get("sequence") == message["sequence"] and reply.get("token") == token:
                        if reply.get("error"):
                            raise OSError(reply["error"])
                        return
                except FileNotFoundError:
                    pass
                time.sleep(0.05)
            raise OSError("Project network guard did not acknowledge the scan proxy.")

        def __enter__(self):
            super().__enter__()
            try:
                self.exchange("open")
            except BaseException:
                super().__exit__(None, None, None)
                raise
            return self

        def __exit__(self, *args):
            try:
                self.exchange("close")
            finally:
                super().__exit__(*args)

    return GuardedProxy


def configure_environment(scratch):
    """Keep version-probe homes/caches inside the owned run, pin shared data.

    The standalone WPScan adapter selects an installed ~/.cache database when
    available. Preserve that exact selection explicitly before replacing HOME,
    so its before/after database audit and actual child agree.
    """
    scratch = Path(scratch)
    installed = Path.home() / ".cache"
    selected = installed if (installed / "wpscan/db").is_dir() else scratch / "cache"
    home, cache = scratch / "home", scratch / "cache"
    home.mkdir(mode=0o700, parents=True, exist_ok=True)
    cache.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.environ.update(
        HOME=str(home),
        XDG_CACHE_HOME=str(cache),
        XDG_CONFIG_HOME=str(home / "config"),
        XDG_DATA_HOME=str(home / "data"),
        CTF_PROFILER_WPSCAN_CACHE=str(selected),
        CTF_PROFILER_WORKSPACE=str(scratch),
        TMPDIR=str(scratch),
    )


def main():
    # This executable is selected by the app, never by an API-supplied command.
    request = Path(sys.argv[1])
    config = json.loads(request.read_text())
    source, _ = scanner_source()
    sys.path.insert(0, str(source))
    import ctf_profiler
    import staged_workflow

    staged_workflow.TargetProxy = proxy_adapter(
        request.with_name("proxy.json"), config["proxy_token"], staged_workflow.TargetProxy
    )
    configure_environment(config["scratch"])

    # The scanner handles KeyboardInterrupt and retains a partial profile.
    def interrupt(_signum, _frame):
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, interrupt)
    before = snapshot(ctf_profiler.inventory())
    try:
        return ctf_profiler.main(config["argv"])
    finally:
        after = snapshot(ctf_profiler.inventory())
        atomic_json(request.with_name("implementation-audit.json"), comparison(before, after))


if __name__ == "__main__":
    sys.exit(main())
