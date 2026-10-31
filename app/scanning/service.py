"""One project/target-bound child job, guarded execution and durable result import."""

from datetime import datetime, timezone
import json
from pathlib import Path
import uuid

from app.scanning.profile import literal_ip
from app.scanning.execution import execute_scan
from app.scanning.lifecycle import settled, TERMINAL
from app.scanning.source import scanner_source
from app.services.project_background import ProjectBackground, atomic_json
from app.services.project_networks import NetworkHeld


class DeepScans(ProjectBackground):
    def current(self, host_id=None, target=None):
        project = self.hub.runtime._require_active_project()
        if str(project.properties.projectName) != self.record["path"]:
            raise RuntimeError("Reopen the scan's original project before starting or importing it.")
        if host_id is not None:
            host = self.hub.runtime._resolve_host(host_id)
            if host is None or literal_ip(str(host.ip)) != target:
                raise ValueError("Selected device and literal target IP do not match this project.")
        return project

    def folder(self):
        project = self.current()
        folder = Path(project.properties.outputFolder) / "deep-scans"
        relative = folder.relative_to(self.root)
        self.path(str(relative))  # Reject linked path components before writing.
        return folder

    def start(self, request):
        runtime = self.hub.runtime
        with self.hub.lock, runtime._lock:
            self.current(request.host_id, request.target_ip)
            context = self.hub.networks.get(self.identifier)
            if not context["configured"] or context["revision"] != request.expected_revision:
                raise NetworkHeld("Configure this project's network and reload its current revision before Deep scan.")
            # Validate literal targets against saved scope/exclusions before allocating a job.
            reference = self.hub.networks.capture()
            targets = [request.target_ip, *([request.dns_resolver] if request.dns_resolver else [])]
            prefs = context["settings"]
            import ipaddress
            import time

            includes = self.hub.networks.resolve_scope(prefs["allowed_targets"], time.monotonic() + 8)
            excludes = self.hub.networks.resolve_scope(prefs["exclusions"], time.monotonic() + 8)
            if any(not self.hub.networks.allowed(ipaddress.ip_network(ip), includes, excludes) for ip in targets):
                raise NetworkHeld("Deep scan target/resolver is outside scope or excluded.")
            if request.dns_resolver and prefs["allowed_ports"] and 53 not in prefs["allowed_ports"]:
                raise NetworkHeld("Explicit DNS requires port 53 in this project's allowed ports.")
            for previous in self.list()["runs"]:
                if previous["host_id"] == request.host_id and previous["status"] in {"queued", "running"}:
                    return previous
            _, identity = scanner_source()
            run_id = uuid.uuid4().hex
            parent = self.folder() / run_id
            parent.mkdir(mode=0o700, parents=True, exist_ok=False)
            record = {
                "id": run_id,
                "project_id": self.identifier,
                "host_id": request.host_id,
                "target_ip": request.target_ip,
                "status": "queued",
                "job_id": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "network_context": reference,
                "directory": str(parent.relative_to(self.root)),
                "profile_path": "",
                "summary": {},
                "reason": "",
            }
            atomic_json(parent / "run.json", record)

            def work(job_id):
                with self.hub.lock, runtime._lock:
                    self.current(request.host_id, request.target_ip)
                    if self.hub.networks.get(self.identifier)["revision"] != request.expected_revision:
                        raise NetworkHeld("Network settings changed while Deep scan was queued. Reload and retry.")
                return execute_scan(self, record, request, identity, job_id)

            job = runtime._start_job(
                "deep-scan",
                work,
                payload={
                    "project_id": self.identifier,
                    "scan_id": run_id,
                    "host_id": request.host_id,
                    "targets": targets,
                    "expected_revision": request.expected_revision,
                    "directory": record["directory"],
                },
                exclusive=True,
                on_finish=lambda job: settled(self, job),
            )
            record["job_id"] = job["id"]
            atomic_json(parent / "run.json", record)
            return record

    def list(self):
        runtime = self.hub.runtime
        with runtime._lock:
            folder = self.folder()
            runs = []
            if folder.exists():
                for directory in sorted(folder.iterdir(), key=lambda p: p.name):
                    if not directory.is_dir() or directory.is_symlink() or len(directory.name) != 32:
                        continue
                    path = self.path(str(directory.relative_to(self.root) / "run.json"))
                    if not path.is_file():
                        continue
                    # A validated profile may be 2 MiB; summaries can legitimately
                    # exceed the old 100 KiB cutoff and must remain in History.
                    if path.stat().st_size > 4 * 1024 * 1024:
                        raise ValueError("Saved Deep scan metadata exceeds its 4 MiB limit.")
                    row = json.loads(path.read_text())
                    if row.get("project_id") != self.identifier:
                        continue
                    if row["status"] not in TERMINAL:
                        job = runtime.jobs.get_job(row["job_id"])
                        if job and job.get("payload", {}).get("scan_id") == row["id"]:
                            row.update(status=job["status"], reason=job.get("error", ""))
                        else:
                            row.update(
                                status="interrupted", reason="App restarted before this scan recorded completion."
                            )
                    runs.append(row)
            return {"runs": sorted(runs, key=lambda r: r["created_at"], reverse=True)[:200]}
