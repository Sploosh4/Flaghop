"""Web adapter for scheduler-owned context assembly."""

from app.scheduler.context.builder import build_scheduler_target_context as build_context
from app.scheduler.context.ports import ContextPorts
from app.web.runtime_scheduler_host_evidence import load_scheduler_host_evidence


def build_scheduler_target_context(runtime, **target):
    ports = ContextPorts(
        load_evidence=lambda **scope: load_scheduler_host_evidence(runtime, **scope),
        infer_technologies_from_observations=runtime._infer_technologies_from_observations,
        scheduler_tool_audit_snapshot=runtime._scheduler_tool_audit_snapshot,
        load_host_observations=runtime._load_host_observations,
        persist_shared_target_state=runtime._persist_shared_target_state,
        observation_text_for_analysis=runtime._observation_text_for_analysis,
        merge_technologies=runtime._merge_technologies,
        ai_confidence_value=runtime._ai_confidence_value,
    )
    return build_context(ports, **target)
