"""Server-rendered application shell and static assets on the ASGI application."""

from pathlib import Path
import re
from fastapi import Request
from fastapi.templating import Jinja2Templates
from app.api.dependencies import Runtime, native_router
from app.ApplicationInfo import applicationInfo, getConsoleLogo
from app.scan_presets import SCAN_PRESETS
from app.web.services.settings_service import load_display_settings

WEB_ROOT = Path(__file__).resolve().parents[1] / "web"
templates = Jinja2Templates(directory=str(WEB_ROOT / "templates"))
router = native_router()


@router.get("/", include_in_schema=False)
def index(request: Request, runtime: Runtime):
    snapshot = runtime.get_snapshot()
    config = request.app.state.config
    display = load_display_settings(runtime)
    config["LEGION_COLORFUL_ASCII_BACKGROUND"] = bool(display.get("colorful_ascii_background", False))
    try:
        logo = str(getConsoleLogo() or "")
    except Exception:
        logo = ""
    logo = re.sub(r"\x1B\[[0-?]*[ -/]*[@-~]", "", logo)
    logo = "\n".join(line.rstrip() for line in logo.splitlines()).strip("\n")
    part = request.query_params.get("part", "")
    parts = {
        "hosts",
        "services",
        "graph",
        "activity",
        "approvals",
        "app-settings",
        "interface-settings",
        "scheduler-settings",
        "device-category-settings",
        "scan",
        "tool",
        "import",
    }
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "config": config,
            "snapshot": snapshot,
            "graph_workspace_enabled": bool(
                ((snapshot.get("scheduler", {}) or {}).get("feature_flags", {}) or {}).get("graph_workspace", False)
            ),
            "ws_enabled": True,
            "console_logo_art": logo,
            "workspace_part": part if part in parts else "",
            "legion_scan_presets": SCAN_PRESETS,
            "legion_web_bind_host": config["LEGION_WEB_BIND_HOST"],
            "legion_web_bind_label": config["LEGION_WEB_BIND_LABEL"],
            "legion_ui_opaque": bool(config["LEGION_UI_OPAQUE"]),
            "legion_colorful_ascii_background": bool(config["LEGION_COLORFUL_ASCII_BACKGROUND"]),
            "legion_version_label": f"v{applicationInfo.get('version', '0.0.0')}",
        },
    )
