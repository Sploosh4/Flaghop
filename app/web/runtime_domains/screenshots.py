"""Screenshots operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_screenshots as web_runtime_screenshots


class ScreenshotsRuntime:
    start_host_screenshot_refresh_job = web_runtime_screenshots.start_host_screenshot_refresh_job

    start_graph_screenshot_refresh_job = web_runtime_screenshots.start_graph_screenshot_refresh_job

    _is_rdp_service = staticmethod(web_runtime_screenshots.is_rdp_service)

    _is_vnc_service = staticmethod(web_runtime_screenshots.is_vnc_service)

    _port_sort_key = staticmethod(web_runtime_screenshots.port_sort_key)

    @classmethod
    def _is_web_screenshot_target(cls, port: str, protocol: str, service_name: str) -> bool:
        return web_runtime_screenshots.is_web_screenshot_target(port, protocol, service_name)

    _collect_host_screenshot_targets = web_runtime_screenshots.collect_host_screenshot_targets

    _run_host_screenshot_refresh = web_runtime_screenshots.run_host_screenshot_refresh

    _run_graph_screenshot_refresh = web_runtime_screenshots.run_graph_screenshot_refresh

    _take_screenshot = web_runtime_screenshots.take_screenshot

    _take_remote_service_screenshot = web_runtime_screenshots.take_remote_service_screenshot

    _list_screenshots_for_host = web_runtime_screenshots.list_screenshots_for_host
