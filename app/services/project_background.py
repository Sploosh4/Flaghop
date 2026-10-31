"""Project-scoped reader controls and saved evidence; never imports or starts engines."""

import base64
import json
import os
from pathlib import Path
import re
import stat
import time
import uuid

CONTENT_ID = re.compile(r"[a-f0-9]{64}\Z")


def atomic_json(path, value):
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        with temporary.open("x", encoding="utf-8") as stream:
            os.chmod(temporary, 0o600)
            json.dump(value, stream, ensure_ascii=True)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


class ProjectBackground:
    def __init__(self, hub, identifier):
        self.hub = hub
        self.identifier = identifier
        self.record = hub._record(identifier)
        self.root = Path(self.record["folder"])
        if not self.root.is_absolute() or self.root.is_symlink() or not self.root.is_dir():
            raise ValueError("The project folder is unavailable.")
        self.root = self.root.resolve()

    def path(self, relative):
        parts = Path(relative).parts
        if not parts or Path(relative).is_absolute() or ".." in parts:
            raise ValueError("Invalid project file path.")
        path = self.root
        for part in parts:
            path = path / part
            if path.is_symlink():
                raise ValueError("Linked files cannot be opened here.")
        if not path.resolve().is_relative_to(self.root):
            raise ValueError("File is outside this project.")
        return path

    def document(self, relative):
        path = self.path(relative)
        try:
            if path.stat().st_size > 16_000_000:
                raise ValueError("Reader metadata exceeds the size limit.")
            value = json.loads(path.read_text())
        except FileNotFoundError:
            return {}
        if not isinstance(value, dict):
            raise ValueError("Reader metadata is not an object.")
        return value

    def worker(self):
        worker = self.document(".reader-state/worker-status.json")
        heartbeat = worker.get("heartbeat_at")
        available = (
            worker.get("available") is True
            and worker.get("project_id") == self.identifier
            and isinstance(heartbeat, (float, int))
            and 0 <= time.time() - heartbeat <= 30
        )
        return {"available": available, "heartbeat_at": heartbeat, "engines": worker.get("engines", [])}

    def results(self):
        report = self.document("reader-report.json")
        origins = self.document("reader-origins.json")
        sources = {row["id"]: row for row in report.get("sources", [])}
        derived = {edge["child"] for edge in report.get("edges", [])}
        provenance = {}
        for reach in report.get("provenance", []):
            source = sources.get(reach["source"], {})
            origin = source.get("origin") or origins.get(source.get("path"))
            if not isinstance(origin, dict) or origin.get("sha256") != source.get("sha256"):
                origin = {key: source[key] for key in ("id", "path", "sha256", "created", "status") if key in source}
            provenance.setdefault(reach["node"], []).append(origin)
        rows = []
        for node in report.get("nodes", []):
            identifier = node.get("id", "")
            if (
                not CONTENT_ID.fullmatch(identifier)
                or identifier not in derived
                or node.get("status") not in {"done", "partial"}
            ):
                continue
            relative = f"ciphey/artifacts/{identifier}.bin"
            path = self.path(relative)
            if path.is_file():
                rows.append(
                    {
                        "id": identifier,
                        "result_path": relative,
                        "size": path.stat().st_size,
                        "completed": path.stat().st_mtime,
                        "origins": provenance.get(identifier, []),
                        "state": node["status"],
                        "label": "Derived artifact · review required",
                        "transformations": sorted(
                            {edge["kind"] for edge in report.get("edges", []) if edge["child"] == identifier}
                        ),
                    }
                )
        queue = self.document("password-crackers/queue.json")
        for target in queue.get("targets", []):
            identifier = target.get("id", "")
            if not CONTENT_ID.fullmatch(identifier) or target.get("status") != "recovered":
                continue
            relative = f"password-crackers/jobs/{identifier}/recovered.txt"
            path = self.path(relative)
            if path.is_file():
                rows.append(
                    {
                        "id": "hash-" + identifier,
                        "result_path": relative,
                        "size": path.stat().st_size,
                        "completed": path.stat().st_mtime,
                        "origins": [
                            origin
                            for relation in report.get("target_nodes", [])
                            if relation["target"] == identifier
                            for origin in provenance.get(relation["node"], [])
                        ],
                        "state": "recovered",
                        "label": "Recovered candidate · review required",
                        "transformations": ["password-recovery"],
                    }
                )
        return report, queue, sorted(rows, key=lambda row: (-row["completed"], row["id"]))

    def status(self):
        control = self.document("reader-control.json")
        report, queue, results = self.results()
        dismissed = self.document("reader-alerts.json").get("dismissed", [])
        dismissed = set(dismissed) | set(self.document("reader-bridge.json").get("dismissed", []))
        # The existing reader treats an absent control as enabled. New Hub projects
        # explicitly start paused; GET must not change a legacy project's state.
        running = control.get("running") is True if control else True
        return {
            "project_id": self.identifier,
            "project": str(self.root),
            "running": running,
            "requested_state": "running" if running else "paused",
            "control_configured": bool(control),
            "observed_state": "unsupported",
            "worker_observation": "unsupported",
            "worker": self.worker(),
            "alerts": [
                row
                for row in results
                if row["id"] not in dismissed
                and not (
                    row["transformations"] and all(kind.startswith("hypothesis:") for kind in row["transformations"])
                )
            ][:100],
            "node_states": report.get("node_states", {}),
            "hash_states": report.get("hash_states", {}),
            "working": [
                {"id": node["id"], "tool": "cipher", "state": node["status"]}
                for node in report.get("nodes", [])
                if node.get("status") in {"queued", "running"}
            ]
            + [
                {"id": row["id"], "tool": "password", "state": row["status"]}
                for row in queue.get("targets", [])
                if row.get("status", "").startswith(("queued", "running"))
            ],
            "reader_updated": report.get("updated"),
            "pause_semantics": "Pause applies to this workspace's registered background readers after the current bounded step. Interactive browsing stays available.",
        }

    def control(self, running):
        if running and not self.worker()["available"]:
            raise RuntimeError("No live reader is registered for this workspace.")
        atomic_json(self.path("reader-control.json"), {"running": running, "pause_policy": "finish-bounded-step"})
        return self.status()

    def dismiss(self, identifier):
        if not any(row["id"] == identifier for row in self.results()[2]):
            raise KeyError("Result not found.")
        state = self.document("reader-alerts.json")
        state["dismissed"] = sorted(set(state.get("dismissed", [])) | {identifier})
        atomic_json(self.path("reader-alerts.json"), state)
        return {"status": "ok"}

    def result(self, identifier):
        row = next((row for row in self.results()[2] if row["id"] == identifier), None)
        if row is None:
            raise KeyError("Result not found.")
        path = self.path(row["result_path"])
        with os.fdopen(os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK), "rb") as stream:
            if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
                raise ValueError("Only ordinary result files can be opened.")
            data = stream.read(65_537)
        return {
            "status": "ok",
            "data_b64": base64.b64encode(data[:65_536]).decode(),
            "truncated": len(data) > 65_536,
            "size": path.stat().st_size,
            "artifact": row,
        }
