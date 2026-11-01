import json
import os
from pathlib import Path
import sys
import tempfile
import threading

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
ARTIFACTS = ROOT / ".artifacts/disposable/tool-updates-smoke"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
fixture = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
os.environ["LEGION_HOME"] = str(Path(fixture.name) / "config")
os.environ["LEGION_PROJECTS_DIR"] = str(Path(fixture.name) / "projects")
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")
from PyQt6.QtCore import QTimer, QUrl
from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QApplication
from app.api import create_app
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from app.services.tool_updates import ToolUpdates
from app.services.execution_journal import ExecutionJournal
from tests.support.asgi_server import live_asgi_server

runtime = WebRuntime(create_default_logic(), execution_journal=ExecutionJournal(Path(fixture.name) / "executions"))
updates = ToolUpdates(runtime)
runtime.tool_updates = updates
calls = []


def fake_start(request):
    calls.append(request.retry_failed)
    with updates.lock:
        updates.state["running"] = True
        for row in updates.state["tools"]:
            row["status"] = "pending"
        updates.state["tools"][0]["status"] = "current"
        updates.state["tools"][1]["status"] = "updating"
        return updates.snapshot()


updates.start = fake_start
web = create_app(runtime)
server = live_asgi_server(web)
url = server.__enter__()
app = QApplication([sys.argv[0]])
checks, errors = [], []


class Page(QWebEnginePage):
    def javaScriptConsoleMessage(self, level, message, line, source):
        if level == self.JavaScriptConsoleMessageLevel.ErrorMessageLevel:
            errors.append(f"{source}:{line}: {message}")


view = QWebEngineView()
profile = QWebEngineProfile(app)
profile.setCachePath(str(ARTIFACTS / "cache"))
profile.setPersistentStoragePath(str(ARTIFACTS / "storage"))
page = Page(profile, view)
view.setPage(page)
view.resize(1200, 800)
view.show()


def record(name, source):
    page.runJavaScript(source, lambda value: checks.append({"name": name, "result": value}))


def start():
    record(
        "No update on navigation",
        'document.querySelector(".tool-update-capsule").getAttribute("aria-label") === "Update tools"',
    )
    record("Start update", 'document.querySelector(".tool-update-capsule").click(); true')
    QTimer.singleShot(1800, progress)


def progress():
    record(
        "Progress ring and row",
        'document.querySelector(".tool-update-progress") !== null && document.querySelector(".state-updating").textContent === "Updating"',
    )
    record(
        "Visible credit link",
        'document.querySelector(".tool-update-credit").href === "https://github.com/pingdotgg/t3code"',
    )
    view.grab().save(str(ARTIFACTS / "updating.png"))
    with updates.lock:
        updates.state["running"] = False
        for row in updates.state["tools"]:
            row["status"] = "current"
        updates.state["tools"][1].update(
            status="failed", error="Download unavailable. The remaining tools were checked."
        )
        updates.state["tools"][-1]["status"] = "updated"
    QTimer.singleShot(1900, failed)


def failed():
    record(
        "Later success survives failure",
        'document.querySelector(".state-failed").textContent === "Failed" && document.querySelector(".state-updated").textContent === "Updated"',
    )
    record(
        "Retry only failures",
        '[...document.querySelectorAll(".tool-update-actions button")].find(b => b.textContent === "Retry failed").click(); true',
    )
    view.grab().save(str(ARTIFACTS / "partial.png"))
    QTimer.singleShot(150, finish)


def finish():
    record(
        "Escape closes popover",
        'document.querySelector(".tool-update-control").dispatchEvent(new KeyboardEvent("keydown", {key:"Escape",bubbles:true})); true',
    )
    QTimer.singleShot(100, app.quit)


page.loadFinished.connect(lambda ok: QTimer.singleShot(1500, start) if ok else app.exit(2))
QTimer.singleShot(15000, lambda: app.exit(3))
page.load(QUrl(url + "/"))
code = app.exec()
server.__exit__(None, None, None)
passed = code == 0 and not errors and all(item["result"] is True for item in checks) and calls == [False, True]
report = {"passed": passed, "checks": checks, "errors": errors, "calls": calls}
(ARTIFACTS / "report.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
view.close()
fixture.cleanup()
raise SystemExit(0 if passed else 1)
