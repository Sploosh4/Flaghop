"""Exercise the actual frameless desktop with a local fixture, without target scans."""

import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
ARTIFACTS = ROOT / ".artifacts/disposable/window-chrome"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
fixture = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
os.environ["LEGION_HOME"] = str(Path(fixture.name) / "config")
os.environ["LEGION_PROJECTS_DIR"] = str(Path(fixture.name) / "Documents/FlagHop")
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")

from PyQt6 import sip
from PyQt6.QtCore import QTimer, Qt
from PyQt6.QtWidgets import QApplication
from app.api import create_app
from app.desktop import LegionWindow
from app.services.project_hub import ProjectHub
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from tests.support.asgi_server import live_asgi_server

runtime = WebRuntime(create_default_logic())
harbour = ProjectHub(runtime).create("Harbour")["project"]
server = live_asgi_server(create_app(runtime))
url = server.__enter__()
app = QApplication([sys.argv[0]])
app.setQuitOnLastWindowClosed(False)
window = LegionWindow(workspace_url=url, profile_dir=Path(fixture.name) / "profile")
checks = []


def record(name, result):
    checks.append({"name": name, "result": result})


def evaluate(name, source):
    window.page.runJavaScript(source, lambda result: record(name, result))


def ready():
    record("Desktop identity is FlagHop", window.windowTitle() == "FlagHop")
    record("Native title bar is replaced", bool(window.windowFlags() & Qt.WindowType.FramelessWindowHint))
    evaluate("Desktop bridge is ready", "!!window.legionDesktop")
    evaluate("Window controls are visible", "document.querySelectorAll('.hub-window-controls button').length === 3")
    evaluate(
        "Title bar is compact and aligned",
        "(() => {const a = document.querySelector('.hub-brand-row').getBoundingClientRect();const b = document.querySelector('.hub-header').getBoundingClientRect();return a.top === 0 && b.top === 0 && a.height === 40 && b.height === 40 && getComputedStyle(document.querySelector('.hub-header')).backgroundColor === 'rgb(5, 5, 5)';})()",
    )
    window.grab().save(str(ARTIFACTS / "desktop.png"))
    window.grab().copy(0, 0, window.width(), 150).save(str(ARTIFACTS / "titlebar.png"))
    evaluate("Click minimise", "document.querySelector('[aria-label=\"Minimise window\"]').click(); true")
    QTimer.singleShot(180, minimized)


def minimized():
    record("Minimise reaches the native window", window.isMinimized())
    window.showNormal()
    QTimer.singleShot(200, maximize)


def maximize():
    evaluate("Click maximise", "document.querySelector('[aria-label=\"Maximise window\"]').click(); true")
    QTimer.singleShot(180, maximized)


def maximized():
    record("Maximise reaches the native window", window.isMaximized())
    evaluate(
        "Maximise state returns to the UI",
        "!!document.querySelector('[aria-label=\"Restore window\"]') && !document.querySelector('[data-window-edge]')",
    )
    evaluate("Click restore", "document.querySelector('[aria-label=\"Restore window\"]').click(); true")
    QTimer.singleShot(180, restored)


def restored():
    record("Restore reaches the native window", not window.isMaximized())
    evaluate("Resize edges return", "document.querySelectorAll('[data-window-edge]').length === 8")
    evaluate(
        "Double-click the title bar",
        "document.querySelector('.hub-header').dispatchEvent(new MouseEvent('dblclick', {bubbles:true})); true",
    )
    QTimer.singleShot(180, double_clicked)


def double_clicked():
    record("Double-click maximises the native window", window.isMaximized())
    evaluate("Click close", "document.querySelector('[aria-label=\"Close window\"]').click(); true")
    QTimer.singleShot(180, finish)


def finish():
    record("Close reaches the native window", not window.isVisible())
    result = {"checks": checks}
    (ARTIFACTS / "checks.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result))
    app.exit(0 if checks and all(row["result"] is True for row in checks) else 1)


def select_project():
    evaluate("Open project", f"document.querySelector('[data-hub-project=\"{harbour["id"]}\"]').click(); true")
    QTimer.singleShot(700, ready)


window.view.loadFinished.connect(lambda ok: QTimer.singleShot(1800, select_project) if ok else app.exit(2))
window.show()
QTimer.singleShot(20000, lambda: app.exit(3))
status = app.exec()
window.page.setWebChannel(None)
window.view.setPage(None)
sip.delete(window.page)
sip.delete(window.profile)
app.processEvents()
server.__exit__(None, None, None)
active = runtime.logic.activeProject
runtime.logic.projectManager.closeProject(active)
active.database.dispose()
fixture.cleanup()
raise SystemExit(status)
