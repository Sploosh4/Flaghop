"""Execute one guarded scanner child and retain truthful terminal outcomes."""

from pathlib import Path
import secrets
import json
import shlex
import shutil
import sys
import tempfile

from app.importers.nmap_runner import import_nmap_xml_into_project
from app.scanning.profile import owned_file
from app.services.project_background import atomic_json
from app.services.project_networks import NetworkHeld
from app.contracts.actions.jobs import JobOutcome
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
    atomic_json(
        parent / "request.json",
        {"argv": argv, "proxy_token": token, "scratch": str(scratch), "source_identity": identity},
    )
    from app.services.execution_journal import for_runtime

    journal = for_runtime(runtime)
    try:
        entry = journal.create(
            owner.record["path"],
            project_id=owner.identifier,
            run_id=record["id"],
            directory=record["directory"],
            source_identity=identity,
            host_id=request.host_id,
            target_ip=request.target_ip,
            scratch=str(scratch),
            job_id=job_id,
        )
    except Exception:
        shutil.rmtree(scratch)
        raise
    record.update(status="running", job_id=job_id, execution_id=entry.id)
    try:
        atomic_json(parent / "run.json", record)
        journal.update(entry.id, run_published=True)
    except Exception as exc:
        # No preparation or child launch is allowed before both publications.
        journal.cleanup(entry.id)
        journal.finish(entry.id)
        return JobOutcome("failed", {"scan_id": record["id"], "preparation_aborted": True, "executed": False}, str(exc))
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
            execution_id=entry.id,
        )
        record["process_id"] = result.process_id
        record["execution"] = result.metadata
        reason = result.reason
        with owner.hub.workspace(owner.identifier):
            owner.current(request.host_id, request.target_ip)
            output = runtime.get_process_output(result.process_id).get("output", "") if result.process_id else ""
            (parent / "log.txt").write_text(output[: 1024 * 1024])
            record["log_path"] = str((parent / "log.txt").relative_to(owner.root))
            if (parent / "profile/device-profile.json").exists():
                from app.scanning.settlement import settle_profile

                state, reason, summary = settle_profile(
                    owner.current(request.host_id, request.target_ip),
                    record,
                    parent,
                    owner.root,
                    identity,
                    import_nmap_xml_into_project,
                    journal=journal,
                    write=atomic_json,
                )
            elif (parent / "worker-status.json").is_file():
                worker_status = json.loads(owned_file(parent, "worker-status.json", 8192).read_text())
                state, reason = "held", worker_status.get("reason", "Scanner source verification failed.")
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
            journal.cleanup(entry.id)
        except Exception as exc:
            state, reason = "held", str(exc)
        cleanup_required = journal.get(entry.id).phase == "cleanup_required"
        record["recovery"] = {
            "policy": "never-replay",
            "state": (
                "cleanup_required"
                if cleanup_required
                else "available" if (parent / "profile/device-profile.json").is_file() else "no_profile"
            ),
            "retry_available": cleanup_required or (parent / "profile/device-profile.json").is_file(),
        }
        try:
            if scratch.exists():
                shutil.rmtree(scratch)
        except OSError as exc:
            state, reason = "partial", f"{reason}; Scan scratch cleanup failed: {exc}"
        if runtime.jobs.is_cancel_requested(job_id):
            state, reason = "cancelled", reason or "Stopped by user; available evidence retained."
        record.update(
            settlement="pending",
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
