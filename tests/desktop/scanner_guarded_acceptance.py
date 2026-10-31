"""Opt-in live acceptance: real scanner and NetworkLease against an owned loopback HTTP fixture.

Run as the normal project owner after `sudo -v` in the same terminal. Optional
--tool-bin selects an already installed tool directory; nothing is installed/copied.
Exit 77 means administrator authentication is unavailable, 2 incomplete acceptance,
and 0 the profile/import/evidence flow plus supported reproduction was observed.
"""

import argparse
import http.server
import json
import logging
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")
ARTIFACTS = ROOT / ".artifacts/disposable/scanner-guarded-acceptance"

from tests.support.scanner_acceptance import browser_proof, probe_guard, retain_evidence, worker_group


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tool-bin", type=Path)
    parser.add_argument("--artifacts", type=Path, default=ARTIFACTS)
    options = parser.parse_args()
    artifacts = options.artifacts.resolve()
    if not artifacts.is_relative_to(ROOT):
        parser.error("--artifacts must stay within the project storage cap")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    artifacts.mkdir(parents=True, exist_ok=True)
    privilege = subprocess.run(["sudo", "-n", "true"], capture_output=True, text=True, timeout=5)
    if privilege.returncode or os.geteuid() == 0:
        report = {
            "status": "blocked",
            "reason": "Run as the normal project owner after sudo -v in the same terminal.",
            "guard_bypassed": False,
        }
        (artifacts / "report.json").write_text(json.dumps(report, indent=2))
        print(json.dumps(report))
        return 77
    if options.tool_bin:
        if not options.tool_bin.is_dir():
            parser.error("--tool-bin must name an installed directory")
        os.environ["PATH"] = str(options.tool_bin.resolve()) + os.pathsep + os.environ.get("PATH", "")

    requests = []

    class Fixture(http.server.BaseHTTPRequestHandler):
        server_version = "SyntheticCTFFixture/1.0"

        def log_message(self, *_):
            pass

        def do_GET(self):
            requests.append(self.path)
            if self.path == "/.git/config":
                body = b"[core]\nrepositoryformatversion = 0\n# Synthetic owned fixture; no repository or secrets.\n"
            elif self.path in ("/", "/robots.txt"):
                body = b'<html><title>Owned synthetic CTF fixture</title><a href="/.git/config">Synthetic fixture configuration</a><a href="/echo?q=hello">Owned reflection fixture</a></html>'
            elif urlsplit(self.path).path == "/echo":
                value = parse_qs(urlsplit(self.path).query).get("q", [""])[0]
                body = ("<html><body>" + value + "</body></html>").encode()
            else:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        do_HEAD = do_GET

    from fastapi.testclient import TestClient
    from app.api import create_app
    from app.scanning.source import scanner_source
    from app.services.network_models import NetworkUpdate
    from app.web.bootstrap import create_default_logic
    from app.web.runtime import WebRuntime
    from db.entities.host import hostObj

    fixture = tempfile.TemporaryDirectory(dir=ROOT / ".tmp", delete=False)
    os.environ["LEGION_HOME"] = str(Path(fixture.name) / "config")
    os.environ["LEGION_PROJECTS_DIR"] = str(Path(fixture.name) / "projects")
    server = http.server.ThreadingHTTPServer(("127.0.0.2", 0), Fixture)
    blocked = http.server.ThreadingHTTPServer(("127.0.0.2", 0), Fixture)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    blocked_thread = threading.Thread(target=blocked.serve_forever, daemon=True)
    blocked_thread.start()
    logic = create_default_logic()
    runtime = WebRuntime(logic)
    web = create_app(runtime)
    hub = web.state.project_hub
    project = hub.create("Owned loopback scanner acceptance")["project"]
    session = logic.activeProject.database.session()
    host = hostObj(ip="127.0.0.2", hostname="owned-loopback", status="up")
    session.add(host)
    session.commit()
    host_id = host.id
    session.close()
    hub.networks.save(
        project["id"],
        NetworkUpdate(
            expected_revision=0,
            settings={
                "name": "Owned acceptance",
                "scope_source": "Temporary HTTP fixture started by this test",
                "allowed_targets": ["127.0.0.2"],
                "allowed_ports": [server.server_port],
                "interface": "lo",
            },
        ),
    )
    client = TestClient(web)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    prefix = f"/api/hub/projects/{project['id']}"
    response = client.post(
        prefix + "/deep-scans",
        json={"host_id": host_id, "target_ip": "127.0.0.2", "expected_revision": 1, "timeout": 300},
    )
    report = {
        "target": "127.0.0.2",
        "port": server.server_port,
        "guard_bypassed": False,
        "source": scanner_source()[1],
        "start_http_status": response.status_code,
    }
    run = None
    settled = False
    try:
        response.raise_for_status()
        run = response.json()
        # The second server is reachable normally, but its port is absent from
        # the actual project's allowlist. Probe under the real worker's GID.
        import urllib.request

        direct = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with direct.open(f"http://127.0.0.2:{blocked.server_port}/", timeout=3) as control:
            report["excluded_listener_control"] = control.status
        gid = worker_group(Path(project["folder"]) / run["directory"] / "request.json")
        report["kernel_guard_probe"] = probe_guard(gid, server.server_port, blocked.server_port)
        print("Guard probe finished; checking scanner completion.", flush=True)
        deadline = time.monotonic() + 330
        next_update = time.monotonic() + 20
        while time.monotonic() < deadline:
            state = client.get(prefix + "/deep-scans").json()["runs"][0]
            if state["status"] not in {"queued", "running"}:
                settled = True
                break
            if time.monotonic() >= next_update:
                print(f"Guarded scan: {state['status']}", flush=True)
                next_update = time.monotonic() + 20
            time.sleep(1)
        else:
            runtime.stop_job(run["job_id"])
            raise RuntimeError("Guarded acceptance deadline exceeded")
        report["run"] = state
        report["pipeline_passed"] = bool(state.get("profile_path") and state["summary"].get("services"))
        if state.get("profile_path"):
            path = Path(project["folder"]) / state["profile_path"]
            preview = client.get(prefix + "/filesystem/api/preview", params={"path": str(path)})
            report["evidence_reopened"] = preview.status_code == 200
            report["profile_sha256"] = state.get("profile_sha256")
            report["guarded_browser"] = browser_proof(json.loads(path.read_text()), path.parent, requests)
        report["supported_reproduction_observed"] = bool(state.get("summary", {}).get("reproduced"))
        report["status"] = (
            "passed"
            if report.get("pipeline_passed")
            and report.get("evidence_reopened")
            and report["supported_reproduction_observed"]
            and report["kernel_guard_probe"]["passed"]
            and report.get("guarded_browser", {}).get("passed")
            and state["status"] == "completed"
            and state.get("settlement") == "complete"
            and state.get("implementation_unchanged") is True
            else "incomplete"
        )
        return 0 if report["status"] == "passed" else 2
    except Exception as exc:
        report.update(status="failed", reason=str(exc))
        if run:
            runtime.stop_job(run["job_id"])
            deadline = time.monotonic() + 25
            while time.monotonic() < deadline:
                job = runtime.jobs.get_job(run["job_id"])
                if job and job["status"] not in {"queued", "running"}:
                    settled = True
                    break
                time.sleep(0.2)
        return 2
    finally:
        try:
            for source in (Path(project["folder"]) / "workspace-tool-output/deep-scans").glob("*"):
                if source.is_dir() and not source.is_symlink():
                    destination = artifacts / source.name
                    retain_evidence(source, destination)
                    report["retained_evidence"] = str(destination.relative_to(ROOT))
        except OSError as exc:
            report.update(status="failed", collection_error=str(exc))
            raise
        finally:
            identifier = (report.get("run") or {}).get("id", project["id"])
            (artifacts / f"report-{identifier}.json").write_text(json.dumps(report, indent=2))
            (artifacts / "report.json").write_text(json.dumps(report, indent=2))
            print(json.dumps({k: v for k, v in report.items() if k not in {"source", "run"}}))
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
            blocked.shutdown()
            blocked.server_close()
            blocked_thread.join(timeout=2)
            if settled or not run:
                active = logic.activeProject
                logic.projectManager.closeProject(active)
                active.database.dispose()
                fixture.cleanup()
            else:
                print(f"Unsettled job; fixture evidence preserved at {fixture.name}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
