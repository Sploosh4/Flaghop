from types import SimpleNamespace
from app.scheduler.context.signals import extract_scheduler_signals as build


def extract_scheduler_signals(runtime, **kwargs):
    ports = SimpleNamespace(observation_text_for_analysis=runtime._observation_text_for_analysis)
    return build(ports, **kwargs)
