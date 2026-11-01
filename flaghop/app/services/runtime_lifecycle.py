"""Bounded API shutdown owns real handles; database PIDs are never kill authority."""

import logging
import time


def acquire(runtime, hub):
    with runtime._api_lifecycle_lock:
        count = getattr(runtime, "_api_lifecycle_count", 0)
        if count == 0:
            runtime.jobs.startup()
            from app.scanning.recovery import reconcile_orphans

            runtime.recovery_report = reconcile_orphans(runtime, hub)
            from app.services.process_history import reconcile

            current = getattr(getattr(runtime, "logic", None), "activeProject", None)
            if current is not None:
                reconcile(current, runtime=runtime)
        runtime._api_lifecycle_count = count + 1


def release(runtime):
    with runtime._api_lifecycle_lock:
        runtime._api_lifecycle_count -= 1
        return (
            shutdown(runtime)
            if runtime._api_lifecycle_count == 0
            else {"complete": True, "shared_lifespans": runtime._api_lifecycle_count}
        )


def shutdown(runtime, timeout=10):
    jobs = getattr(runtime, "jobs", None)
    if jobs is None:
        return {"complete": True, "unfinished_jobs": [], "live_processes": []}
    deadline = time.monotonic() + timeout
    jobs.begin_shutdown()
    registry = getattr(runtime, "process_registry", None)
    processes = []
    if registry is not None:
        with registry.lock:
            processes = list(registry.active.items())
            registry.kill_requests.update(identifier for identifier, _ in processes)
        for _, process in processes:
            runtime._signal_process_tree(process, force=False)
        # One shared deadline, not a timeout multiplied by the child count.
        for _, process in processes:
            try:
                process.wait(timeout=max(0, min(0.5, deadline - time.monotonic())))
            except TimeoutError:
                pass
            except Exception:
                if process.poll() is None:
                    runtime._signal_process_tree(process, force=True)
    unfinished = jobs.shutdown(max(0, deadline - time.monotonic()))
    live = [identifier for identifier, process in processes if process.poll() is None]
    report = {"complete": not (unfinished or live), "unfinished_jobs": unfinished, "live_processes": live}
    if not report["complete"]:
        logging.getLogger(__name__).error("Shutdown incomplete; recovery remains required: %s", report)
    return report
