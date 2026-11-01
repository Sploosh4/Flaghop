"""Read-only source snapshots, bounded extraction and auditable decode records."""
import base64
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import fnmatch
import hashlib
import json
import os
import re
from pathlib import Path
import stat
import sys
import tempfile
import time
import uuid

from . import __version__
from .adapters import decode, run_tool
from .reporting import Store, atomic_text, atomic_bytes


def sha(data):
    return hashlib.sha256(data).hexdigest()


def utc():
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class Settings:
    encodings: str = "b64,hex,bx,bu,pu"
    min_decoded_bytes: int = 8
    max_file_bytes: int = 2_000_000
    max_candidate_bytes: int = 16_384
    max_candidates: int = 64
    decode_seconds: int = 2
    file_seconds: int = 30
    regex: str | None = None
    ignore: tuple = ()


class Scanner:
    def __init__(self, watch, output, base64dump, ciphey, settings=None):
        self.watch, self.output = Path(watch).resolve(), Path(output).resolve()
        self.base64dump, self.ciphey = Path(base64dump).resolve(), Path(ciphey).resolve()
        self.settings = settings or Settings()
        if self.settings.regex:
            re.compile(self.settings.regex)
        if not self.watch.is_dir():
            raise ValueError("Watch folder must exist")
        if self.output == self.watch or self.output.is_relative_to(self.watch) or self.watch.is_relative_to(self.output):
            raise ValueError("Input and output folders must be separate, non-nested directories")
        for tool in (self.base64dump, self.ciphey):
            if not tool.is_file():
                raise ValueError(f"Missing tool: {tool}; run setup.sh first")
        self.tools = {"base64dump": {"path": str(self.base64dump), "sha256": sha(self.base64dump.read_bytes())},
                      "ciphey": {"path": str(self.ciphey), "sha256": sha(self.ciphey.read_bytes()),
                                 "adapter": "Ciphey v0.12.1 CLI"}}
        code_hash = sha(b"".join(p.read_bytes() for p in sorted(Path(__file__).parent.glob("*.py"))))
        config = {"prototype_version": __version__, "code_sha256": code_hash,
                  "settings": asdict(self.settings), "tools": self.tools}
        self.code_hash = code_hash
        self.config_id = sha(json.dumps(config, sort_keys=True).encode())
        self.output.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.store = Store(self.output)
        self.store.render()

    def allowed(self, path):
        path = Path(os.path.abspath(path))
        if not path.is_relative_to(self.watch):
            return False
        relative = path.relative_to(self.watch)
        if any(fnmatch.fnmatch(relative.as_posix(), pattern) for pattern in self.settings.ignore):
            return False
        current = self.watch
        for part in relative.parts:
            current = current / part
            if current.is_symlink():
                return False
        return True

    def files(self, root=None):
        root = Path(root) if root else self.watch
        if not self.allowed(root):
            return
        for parent, dirs, names in os.walk(root, followlinks=False):
            dirs[:] = sorted(d for d in dirs if self.allowed(Path(parent) / d))
            for name in sorted(names):
                path = Path(parent) / name
                if self.allowed(path):
                    yield path

    def snapshot(self, path):
        if not self.allowed(path):
            return None
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(fd, "rb") as handle:
            before = os.fstat(handle.fileno())
            if not stat.S_ISREG(before.st_mode):
                return None
            stamp = (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns)
            if before.st_size > self.settings.max_file_bytes:
                return None, stamp, "file_size_limit"
            data = handle.read(self.settings.max_file_bytes + 1)
            after = os.fstat(handle.fileno())
        if len(data) > self.settings.max_file_bytes:
            return None, stamp, "file_size_limit"
        if stamp != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns):
            raise BlockingIOError("File changed while snapshot was read; retry after it settles")
        return data, stamp, None

    def scan(self, path, *, retry=False):
        path = Path(os.path.abspath(path))
        self.last_status = "ignored"
        snap = self.snapshot(path)
        if snap is None:
            return None
        data, stamp, skip = snap
        relative = path.relative_to(self.watch).as_posix()
        digest = sha(data) if data is not None else None
        fingerprint = digest or sha(repr(stamp).encode())
        previous = self.store.seen(relative, fingerprint, self.config_id)
        if not retry and previous:
            self.last_status = previous
            return None
        scan_id = uuid.uuid4().hex
        folder = self.output / "versions" / sha(relative.encode())[:16] / scan_id
        folder.mkdir(parents=True)
        report = {"schema_version": 1, "producer": "cipher-watch", "prototype_version": __version__,
                  "scan_id": scan_id, "created_at": utc(), "configuration_id": self.config_id, "code_sha256": self.code_hash,
                  "source": {"watch_root": str(self.watch), "relative_path": relative, "sha256": digest,
                             "fingerprint": fingerprint, "size_bytes": stamp[2], "mtime_ns": stamp[3]},
                  "settings": asdict(self.settings), "tools": self.tools, "status": "complete",
                  "coverage": {"scope": "contiguous encoded sequences in raw file bytes", "attempted": 0,
                               "extracted": 0, "warnings": [], "excluded": "symlinks and configured ignore patterns"},
                  "candidates": [], "findings": [], "legion_export": {"host_ip": None, "findings": [], "artifacts": []}}
        if skip:
            report["status"] = "skipped"
            report["coverage"]["warnings"].append(skip)
        else:
            try:
                self._process(data, report, folder)
            except Exception as error:
                report["status"] = "error"
                report["coverage"]["warnings"].append(f"{type(error).__name__}: {error}")
        # A finding always belongs to the immutable snapshot hash, even if an editor saves again.
        try:
            now = path.stat(follow_symlinks=False)
            if stamp != (now.st_dev, now.st_ino, now.st_size, now.st_mtime_ns, now.st_ctime_ns):
                report["coverage"]["warnings"].append("source_changed_during_scan")
        except OSError:
            report["coverage"]["warnings"].append("source_removed_during_scan")
        if report["coverage"]["warnings"] and report["status"] == "complete":
            report["status"] = "partial"
        self.last_status = report["status"]
        return self.store.save(report, folder)

    def _process(self, data, report, folder):
        started = time.monotonic()
        s = self.settings
        work = self.output / ".work"
        work.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=work) as temporary:
            temporary = Path(temporary)
            snapshot = temporary / "snapshot.bin"
            snapshot.write_bytes(data)
            bridge = Path(__file__).with_name("extract_bridge.py")
            raw = run_tool([sys.executable, str(bridge), str(self.base64dump), str(snapshot), s.encodings,
                            str(s.min_decoded_bytes), str(s.max_candidate_bytes), str(s.max_candidates)],
                           cwd=temporary, timeout=min(10, s.file_seconds), output_limit=8_000_000)
            self._diagnostics(folder, "extraction", raw)
            if raw["status"] != "complete":
                raise RuntimeError(f"base64dump extraction {raw['status']}")
            extraction = json.loads(raw["stdout"])
            report["coverage"]["warnings"].extend(extraction["warnings"])
            report["coverage"]["extracted"] = len(extraction["candidates"])
            report["coverage"]["unique_values"] = extraction.get('unique_values')
            report["coverage"]["location_notes"] = extraction.get('notes',[])
            # Preserve all extracted bytes even if language checking runs out of
            # time. The shared queue can still inspect them for hashes/containers.
            report['candidates'] = extraction['candidates']
            cached = {}
            for number, candidate in enumerate(extraction["candidates"], 1):
                identifier = f"candidate-{number:03d}"
                candidate["id"] = identifier
                candidate["status"] = "extracted"
                decoded_bytes = base64.b64decode(candidate["decoded_b64"])
                # Keep first-layer binary evidence, but Ciphey accepts text, not arbitrary bytes.
                try:
                    text = decoded_bytes.decode("utf-8")
                    if "\0" in text:
                        raise ValueError("NUL bytes")
                except (UnicodeError, ValueError):
                    candidate["status"] = "binary_first_layer"
                    evidence = folder / "extracted"
                    evidence.mkdir(exist_ok=True)
                    atomic_bytes(evidence / (identifier + ".bin"),decoded_bytes)
                    candidate["binary_file"] = f"extracted/{identifier}.bin"
                    continue
                cache_key = sha(decoded_bytes)
                if cache_key in cached:
                    result, diagnostic_ref = cached[cache_key]
                    candidate["reused_diagnostics"] = diagnostic_ref
                else:
                    remaining = s.file_seconds - (time.monotonic() - started)
                    if remaining < 1.5:
                        candidate["status"] = "not_attempted"
                        if 'file_time_limit' not in report['coverage']['warnings']:
                            report["coverage"]["warnings"].append("file_time_limit")
                        continue
                    seconds = min(s.decode_seconds, max(1, int(remaining - 0.5)))
                    result, tool_raw = decode(self.ciphey, text, home=temporary / identifier,
                                              cwd=temporary, seconds=seconds, regex=s.regex)
                    self._diagnostics(folder, identifier, tool_raw)
                    cached[cache_key] = (result, identifier)
                    report["coverage"]["attempted"] += 1
                candidate["status"] = result["status"]
                if result.get('reason'):
                    candidate['reason'] = result['reason']
                if result["status"] == "accepted_candidate":
                    self._finding(report, folder, candidate, result)
                elif result["status"] not in ("not_found","structured_text","rejected_candidate"):
                    report["coverage"]["warnings"].append(f"{identifier}: ciphey_{result['status']}")

    @staticmethod
    def _diagnostics(folder, name, raw):
        logs = folder / "raw"
        logs.mkdir(exist_ok=True)
        (logs / (name + ".stdout.txt")).write_text(raw["stdout"], encoding="utf-8")
        (logs / (name + ".stderr.txt")).write_text(raw["stderr"], encoding="utf-8")
        metadata = {k: v for k, v in raw.items() if k not in ("stdout", "stderr")}
        atomic_text(logs / (name + ".json"), json.dumps(metadata, indent=2))

    def _finding(self, report, folder, candidate, result):
        decoded = folder / "decoded"
        decoded.mkdir(exist_ok=True)
        file = f"decoded/{candidate['id']}.txt"
        atomic_text(folder / file,result['text'])
        finding = {"id": candidate["id"], "status": "accepted_candidate", "human_verified": False,
                   "location": {k: candidate[k] for k in ("offset", "length", "line", "byte_column")},
                   "steps": [f"base64dump:{candidate['encoding']}"] + result["steps"],
                   "text": result["text"], "decoded_sha256": sha(result["text"].encode()),
                   "decoded_file": file, "validation": result["validation"]}
        report["findings"].append(finding)
        # Export shape mirrors Legion observations; host attribution remains explicitly unset.
        ref = (folder / file).relative_to(self.output).as_posix()
        report["legion_export"]["findings"].append({
            "title": "Decoded content candidate", "severity": "info", "source_kind": "observed", "observed": True,
            "evidence": f"{report['source']['relative_path']} byte {candidate['offset']}; {' → '.join(finding['steps'])}",
            "evidence_items": [ref], "human_verified": False})
        report["legion_export"]["artifacts"].append({"ref": ref, "kind": "decoded_text", "tool_id": "cipher-watch",
                                                     "source_kind": "observed", "observed": True})

    def close(self):
        self.store.close()
