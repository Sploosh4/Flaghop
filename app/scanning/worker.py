"""CLI child adapter: unchanged scanner, owned proxy handshake and interrupt cleanup."""

import json
import os
from pathlib import Path
import signal
import sys
import time
import uuid

from app.scanning.source import scanner_source
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
                    reply = json.loads(channel.with_suffix(".ack").read_text())
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
    os.environ["CTF_PROFILER_WORKSPACE"] = config["scratch"]
    os.environ["TMPDIR"] = config["scratch"]

    # The scanner handles KeyboardInterrupt and retains a partial profile.
    def interrupt(_signum, _frame):
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, interrupt)
    return ctf_profiler.main(config["argv"])


if __name__ == "__main__":
    sys.exit(main())
