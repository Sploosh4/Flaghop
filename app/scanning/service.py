"""One project/target-bound child job, guarded execution and durable result import."""

from datetime import datetime, timezone
import json
import ipaddress
import time
from pathlib import Path
import uuid

from app.core.contract_values import literal_ip
from app.scanning.execution import execute_scan
from app.scanning.lifecycle import settled, reconcile, TERMINAL
from app.scanning.history import ScanHistory, compact_record, read_record
import re
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
        with self.hub.workspace(self.identifier):
            self.current(request.host_id, request.target_ip)
            context = self.hub.networks.get(self.identifier)
            if not context["configured"] or context["revision"] != request.expected_revision:
                raise NetworkHeld("Configure this project's network and reload its current revision before Deep scan.")
            # Snapshot configuration while pinned, then release the project lock
            # before potentially slow DNS. Revalidate identity/revision below.
            reference = self.hub.networks.capture()
            targets = [request.target_ip, *([request.dns_resolver] if request.dns_resolver else [])]
            prefs = context["settings"]
        deadline = time.monotonic() + 8
        includes = self.hub.networks.resolve_scope(prefs["allowed_targets"], deadline)
        excludes = self.hub.networks.resolve_scope(prefs["exclusions"], deadline)
        if any(not self.hub.networks.allowed(ipaddress.ip_network(ip), includes, excludes) for ip in targets):
            raise NetworkHeld("Deep scan target/resolver is outside scope or excluded.")
        if request.dns_resolver and prefs["allowed_ports"] and 53 not in prefs["allowed_ports"]:
            raise NetworkHeld("Explicit DNS requires port 53 in this project's allowed ports.")
        with self.hub.workspace(self.identifier):
            self.current(request.host_id, request.target_ip)
            current = self.hub.networks.get(self.identifier)
            if current["config_id"] != reference["config_id"] or current["revision"] != request.expected_revision:
                raise NetworkHeld("Network settings changed during Deep scan preparation. Reload and retry.")
            for job in runtime.jobs.list_jobs():
                payload = job.get("payload", {})
                if (
                    job["type"] == "deep-scan"
                    and job["status"] in {"queued", "running"}
                    and payload.get("host_id") == request.host_id
                    and payload.get("project_id") == self.identifier
                ):
                    return self.detail(payload["scan_id"])
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
                with self.hub.workspace(self.identifier):
                    self.current(request.host_id, request.target_ip)
                    if self.hub.networks.get(self.identifier)["revision"] != request.expected_revision:
                        raise NetworkHeld("Network settings changed while Deep scan was queued. Reload and retry.")
                return execute_scan(self, record, request, identity, job_id)

            try:
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
            except Exception as exc:
                record.update(status="held", reason=str(exc), settlement="complete")
                atomic_json(parent / "run.json", record)
                raise
            record["job_id"] = job["id"]
            atomic_json(parent / "run.json", record)
            return record

    def detail(self, scan_id):
        with self.hub.workspace(self.identifier):
            if not re.fullmatch(r"[a-f0-9]{32}", scan_id):
                raise KeyError("Scan not found.")
            relative = (self.folder() / scan_id / "run.json").relative_to(self.root)
            path = self.path(str(relative))
            record = read_record(path)
            if record.get("project_id") != self.identifier or record.get("id") != scan_id:
                raise ValueError("Saved scan belongs to different evidence.")
            return reconcile(self, path, record)

    def list(self, *, compact=False):
        with self.hub.workspace(self.identifier):
            # One project cache per hub. Switching drops the previous cache, so
            # browsing many projects cannot grow metadata memory without bound.
            folder = self.folder()
            key = str(folder)
            cached = getattr(self.hub, "_scan_history", None)
            if cached is None or cached[0] != key:
                cached = self.hub._scan_history = (key, ScanHistory())
            runs = cached[1].records(self, folder)
            result = []
            for row in runs:
                job = self.hub.runtime.jobs.get_job(row["job_id"])
                payload = (job or {}).get("payload", {})
                live = (
                    job
                    and payload.get("scan_id") == row["id"]
                    and payload.get("project_id") == self.identifier
                    and (job["status"] in {"queued", "running"} or job.get("result", {}).get("persistence_error"))
                )
                if not compact or row["status"] not in TERMINAL or row.get("settlement") == "pending" or live:
                    row = self.detail(row["id"])
                    if compact:
                        row = compact_record(row)
                result.append(row)
            return {"runs": result}
