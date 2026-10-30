from types import SimpleNamespace
from app.scheduler.context.host_ai_context import build_host_ai_context_state as build


def build_host_ai_context_state(runtime, **kwargs):
    ports = SimpleNamespace(
        merge_technologies=runtime._merge_technologies, ai_confidence_value=runtime._ai_confidence_value
    )
    return build(ports, **kwargs)
