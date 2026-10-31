import re

from flask import (
    Blueprint,
    current_app,
    jsonify,
    render_template,
    request,
)

from app.ApplicationInfo import getConsoleLogo
from app.web.services.settings_service import load_display_settings

web_bp = Blueprint("web", __name__)
_ANSI_ESCAPE_RE = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")


def _get_sanitized_console_logo() -> str:
    try:
        raw = str(getConsoleLogo() or "")
    except Exception:
        return ""
    cleaned = _ANSI_ESCAPE_RE.sub("", raw)
    lines = [line.rstrip() for line in cleaned.splitlines()]
    return "\n".join(lines).strip("\n")


@web_bp.get("/")
def index():
    runtime = current_app.extensions["legion_runtime"]
    snapshot = runtime.get_snapshot()
    display_settings = load_display_settings(runtime)
    current_app.config["LEGION_COLORFUL_ASCII_BACKGROUND"] = bool(
        display_settings.get("colorful_ascii_background", False)
    )
    graph_workspace_enabled = bool(
        ((snapshot.get("scheduler", {}) or {}).get("feature_flags", {}) or {}).get("graph_workspace", False)
    )
    return render_template(
        "index.html",
        snapshot=snapshot,
        graph_workspace_enabled=graph_workspace_enabled,
        ws_enabled=current_app.config.get("LEGION_WEBSOCKETS_ENABLED", False),
        console_logo_art=_get_sanitized_console_logo(),
        workspace_part=(
            request.args.get("part", "")
            if request.args.get("part", "")
            in {
                "hosts",
                "services",
                "graph",
                "activity",
                "capture",
                "approvals",
                "app-settings",
                "interface-settings",
                "scheduler-settings",
                "device-category-settings",
                "report-provider-settings",
                "scan",
                "tool",
                "import",
            }
            else ""
        ),
    )


@web_bp.get("/health")
def health():
    return jsonify({"status": "ok"})
