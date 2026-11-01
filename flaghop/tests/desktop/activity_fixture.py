"""Synthetic activity records only: no process, scan or provider request is executed."""

import datetime
from app.scheduler.approvals import queue_pending_approval
from app.scheduler.audit import AUDIT_COLUMNS, log_scheduler_decision
from app.scheduler.scan_history import record_scan_submission
from app.scheduler.provider_support.logging import _record_provider_log
from db.entities.process import process
from db.entities.processOutput import process_output


def seed_activity(runtime):
    database = runtime.logic.activeProject.database
    output = process_output()
    output.output = "\x1b[32mFixture output\x1b[0m\n<img src=x onerror=alert(1)>"
    row = process(
        pid="-1",
        name="Fixture activity",
        hostIp="198.51.100.25",
        port="443",
        protocol="tcp",
        command="fixture-never-executed",
        status="Finished",
        output=[output],
        percent="100",
    )
    session = database.session()
    try:
        session.add(row)
        session.commit()
        process_id = int(row.id)
    finally:
        session.close()
    approval_id = queue_pending_approval(
        database,
        {
            "tool_id": "fixture-only",
            "label": "Fixture approval",
            "host_ip": "198.51.100.25",
            "port": "443",
            "protocol": "tcp",
            "command_template": "fixture-never-executed",
            "risk_summary": "Synthetic risk",
            "rationale": "Synthetic evidence",
            "command_family_id": "fixture-family",
        },
    )
    record = {key: "" for key in AUDIT_COLUMNS if key != "id"}
    record.update(
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        host_ip="198.51.100.25",
        tool_id="fixture-only",
        label="Fixture decision",
        reason="Fixture decision recorded",
        approved="False",
        executed="False",
        approval_id=str(approval_id),
    )
    log_scheduler_decision(database, record)
    record_scan_submission(
        database,
        {
            "submission_kind": "fixture-import",
            "status": "completed",
            "target_summary": "198.51.100.25",
            "result_summary": "Fixture history",
        },
    )
    _record_provider_log(
        provider="fixture",
        method="POST",
        endpoint="https://fixture.invalid/no-request-made",
        response_status=200,
        response_body="Fixture provider logs <img src=x onerror=alert(1)>",
        prompt_metadata={"structured_output_used": True, "structured_output_fallback": False},
    )
    return process_id, approval_id
