"""Execute one guarded scanner child and retain truthful terminal outcomes."""

from pathlib import Path
import secrets
import shlex
import shutil
import sys
import tempfile

from app.importers.nmap_runner import import_nmap_xml_into_project
from app.scanning import repository
from app.scanning.profile import summarize, validate_profile
from app.services.project_background import atomic_json
from app.services.project_networks import NetworkHeld
from app.web.jobs import JobOutcome
from app.web.runtime_execution import execute_command

ROOT = Path(__file__).resolve().parents[2]


def execute_scan(owner, record, request, identity, job_id):
    runtime = owner.hub.runtime
    parent = owner.path(record["directory"])
    scratch = Path(tempfile.mkdtemp(prefix="s-", dir=ROOT / ".tmp"))
    token = secrets.token_hex(32)
    context = owner.hub.networks.get(owner.identifier)
    ports = context["settings"]["allowed_ports"]
    argv = [
        request.target_ip,
        "--out",
        str(parent / "profile"),
        "--ports",
        ",".join(map(str, ports)) if ports else "top1000",
        "--stages",
        "1-5",
        "--no-metasploit",
        "--skip",
        "metasploit_check",
        "--os-detection",
        "off",
        "--nmap-timeout",
        str(min(300, request.timeout)),
    ]
    if request.dns_resolver:
        argv += ["--dns-server", request.dns_resolver]
    atomic_json(parent / "request.json", {"argv": argv, "proxy_token": token, "scratch": str(scratch)})
    record.update(status="running", job_id=job_id)
    atomic_json(parent / "run.json", record)
    command = (sys.executable, "-m", "app.scanning.worker", str(parent / "request.json"))
    state, reason, summary = "failed", "", {}
    try:
        result = execute_command(
            runtime,
            tool_name="device-profile",
            tab_title="Deep scan",
            host_ip=request.target_ip,
            port="",
            protocol="tcp",
            command=shlex.join(command),
            argv=command,
            cwd=str(ROOT),
            outputfile=str(parent / "profile/device-profile.json"),
            timeout=request.timeout,
            hard_timeout=request.timeout,
            job_id=job_id,
            network_targets=tuple(runtime.jobs.get_job(job_id)["payload"]["targets"]),
            output_limit=1024 * 1024,
            cancel_grace=10,
            proxy_channel=str(parent / "proxy.json"),
            proxy_token=token,
        )
        record["process_id"] = result.process_id
        record["execution"] = result.metadata
        reason = result.reason
        with runtime._lock:
            owner.current(request.host_id, request.target_ip)
            output = runtime.get_process_output(result.process_id).get("output", "") if result.process_id else ""
            (parent / "log.txt").write_text(output[: 1024 * 1024])
            record["log_path"] = str((parent / "log.txt").relative_to(owner.root))
            if (parent / "profile/device-profile.json").exists():
                source_identity = {name: value for name, value in identity.items() if name.endswith(".py")}
                document, digest, xml = validate_profile(parent / "profile", request.target_ip, source_identity)
                summary = summarize(document)
                summary.update(
                    id=record["id"],
                    host_id=request.host_id,
                    target_ip=request.target_ip,
                    profile_sha256=digest,
                    profile_path=str((parent / "profile/device-profile.json").relative_to(owner.root)),
                )
                project = owner.current(request.host_id, request.target_ip)
                prior = next(
                    (r for r in repository.summaries(project, request.host_id) if r.get("id") == record["id"]), None
                )
                if prior and prior["profile_sha256"] != digest:
                    raise ValueError("Saved profile changed after import.")
                if not prior:
                    if xml is not None:
                        import_nmap_xml_into_project(project, str(xml))
                    repository.save(project, record["id"], request.host_id, request.target_ip, digest, summary)
                atomic_json(parent / "summary.json", summary)
                record["profile_path"] = summary["profile_path"]
                record["profile_sha256"] = digest
                incomplete = (
                    document["run"]["status"] == "partial"
                    or summary["problems"]
                    or document["run"].get("error")
                    or document.get("cleanup", {}).get("success") is False
                )
                state = "partial" if incomplete else "completed"
                if document["run"]["mode"] != "active":
                    state = "planned"
                if document["run"].get("interrupted"):
                    state = "cancelled"
                reason = document["run"].get("error") or (
                    "Scanner output is incomplete; see task and cleanup outcomes." if incomplete else ""
                )
            elif any((parent / "profile").rglob("*")):
                state = "partial"
                reason = f"{reason}; no complete profile; raw evidence retained."
        if (result.metadata.get("network") or {}).get("status") == "held":
            state, reason = "held", result.metadata["network"]["reason"]
        elif not result.executed and state in {"completed", "planned"}:
            state, reason = "partial", result.reason
    except NetworkHeld as exc:
        state, reason = "held", str(exc)
    except Exception as exc:
        state, reason = "failed", str(exc)
    finally:
        try:
            shutil.rmtree(scratch)
        except OSError as exc:
            state, reason = "partial", f"{reason}; Scan scratch cleanup failed: {exc}"
        if runtime.jobs.is_cancel_requested(job_id):
            state, reason = "cancelled", reason or "Stopped by user; available evidence retained."
        record.update(
            status=state,
            reason=reason,
            summary={
                "profile_status": summary.get("profile_status", ""),
                "problems": summary.get("problems", []),
                "classification": summary.get("classification", {}),
                "services": summary.get("services", []),
                "candidates": summary.get("candidates", []),
                "reproduced": summary.get("reproduced", []),
                "dependency_audit": summary.get("dependency_audit", ""),
                "artifacts": summary.get("artifacts", []),
            },
        )
        atomic_json(parent / "run.json", record)
        retained = [p for p in parent.rglob("*") if p.is_file()]
        if len(retained) > 250 or sum(p.stat().st_size for p in retained) > 16 * 1024 * 1024:
            record.update(status="partial", reason=f"{reason}; retained scan output exceeds 16 MiB/250 files.")
            state, reason = record["status"], record["reason"]
            atomic_json(parent / "run.json", record)
        runtime._emit_ui_invalidation("jobs", "overview", "hosts", "services", "graph")
    return JobOutcome(
        "completed" if state == "planned" else state, {"scan_id": record["id"], "scan_status": state}, reason
    )
