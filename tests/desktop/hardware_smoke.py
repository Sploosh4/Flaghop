"""Render the hardware layer with synthetic inventory and saved observations only."""

import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
ARTIFACTS = ROOT / ".artifacts/disposable/hardware-smoke"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
fixture = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
os.environ["LEGION_HOME"] = str(Path(fixture.name) / "config")
os.environ["LEGION_PROJECTS_DIR"] = str(Path(fixture.name) / "Documents/FlagHop")
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")
from PyQt6 import sip
from PyQt6.QtCore import QPoint, QTimer, QUrl
from PyQt6.QtTest import QTest
from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QApplication
from app.api import create_app
from app.contracts.actions.network import NetworkUpdate
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from app.services.execution_journal import ExecutionJournal
from tests.support.asgi_server import live_asgi_server

logic = create_default_logic()
runtime = WebRuntime(
    logic, execution_journal=ExecutionJournal(Path(os.environ["LEGION_HOME"]) / "protected-executions")
)
web = create_app(runtime)
hub = web.state.project_hub
other = hub.create("Other lab")["project"]
project = hub.create("Harbour")["project"]
rows = [
    {"id": 1, "ip": "192.0.2.10", "hostname": "server-01", "os": "Linux", "categories": ["Server"]},
    {"id": 2, "ip": "192.0.2.20", "hostname": "workstation-01", "os": "Windows", "categories": ["Workstation"]},
    {"id": 3, "ip": "192.0.2.1", "hostname": "", "os": "Unknown", "categories": []},
    {"id": 4, "ip": "192.0.2.30", "hostname": "printer-01", "os": "", "categories": ["Printer"]},
]
runtime._hosts = lambda **_: rows if runtime.get_project_details()["name"] == project["path"] else []
context = hub.networks.save(
    project["id"],
    NetworkUpdate(
        expected_revision=0,
        settings={
            "name": "Synthetic UI fixture",
            "scope_source": "Reserved documentation addresses; no probes",
            "allowed_targets": ["192.0.2.0/24"],
            "mode": "wireguard",
            "interface": "wg-fixture",
            "profile_id": "synthetic-ui-peer",
        },
    ),
)
hub.networks.record(
    project["id"],
    {
        "status": "ready",
        "reason": "Synthetic saved observation; no connection was made",
        "revision": context["revision"],
        "checked_at": "2026-10-31T00:00:00Z",
        "target": ", ".join(row["ip"] for row in rows),
        "routes": [{"destination": row["ip"], "interface": "wg-fixture"} for row in rows],
        "services": [],
    },
)
hub.networks.probe.interface = lambda *_: (_ for _ in ()).throw(AssertionError("Unexpected network probe"))
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
view.resize(1520, 960)
view.show()


def record(name, source):
    page.runJavaScript(source, lambda value: checks.append({"name": name, "result": value}))


def open_project():
    page.runJavaScript(f"document.querySelector('[data-hub-project=\"{project['id']}\"]').click()")
    QTimer.singleShot(1100, rendered)


def rendered():
    record("Hardware lives inside Overview", "!!document.querySelector('.hub-overview .hardware-canvas')")
    record(
        "Cyber Kill Chain precedes Hash and Cipher",
        "[...document.querySelectorAll('.hub-result-alerts>.hub-reader-group summary')].map(s=>s.firstChild.textContent).join(',') === 'Cyber Kill Chain,Hash,Cipher'",
    )
    record(
        "Saved VPN protocol labels its picture",
        "document.querySelector('[data-hardware-id=vpn] .hardware-labels').textContent === 'WireGuard'",
    )
    record(
        "Device shortcut numbers are larger",
        "getComputedStyle(document.querySelector('.hardware-number')).fontSize === '13px'",
    )
    record(
        "All six original pictures and contour assets load",
        """(() => {
        const nodes = [...document.querySelectorAll('.hardware-node')];
        return nodes.length === 6 && nodes.every(node => {
            const image = node.querySelector('img');
            return image.complete && image.naturalWidth > 0 && image.width === 70 && image.height === 70
                && getComputedStyle(node.querySelector('.hardware-contour')).maskImage.includes('-contour.svg');
        });
    })()""",
    )
    record(
        "Layout fits without overlapping artwork or horizontal overflow",
        """(() => {
        const canvas = document.querySelector('.hardware-canvas').getBoundingClientRect();
        const nodes = [...document.querySelectorAll('.hardware-artwork')].map(node => node.getBoundingClientRect());
        return nodes.every((a, i) => a.left >= canvas.left && a.right <= canvas.right && a.top >= canvas.top && a.bottom <= canvas.bottom
            && nodes.every((b, j) => i === j || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top))
            && document.documentElement.scrollWidth <= innerWidth;
    })()""",
    )
    record(
        "Saved routes have coloured straight links", "document.querySelectorAll('.hardware-links line').length === 5"
    )
    record(
        "Unknown metadata is omitted",
        "document.querySelector('[data-hardware-id=host-3] .hardware-labels').textContent === '192.0.2.1'",
    )
    page.runJavaScript(
        "(() => { const b = document.querySelector('[data-hardware-id=host-1] .hardware-artwork').getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}; })()",
        lambda point: QTest.mouseMove(view.focusProxy(), QPoint(round(point["x"]), round(point["y"]))),
    )
    QTimer.singleShot(200, hover)


def hover():
    record(
        "Hover follows the picture with the approved brighter grey",
        """(() => { const b = document.querySelector('[data-hardware-id=host-1]');
        const s = getComputedStyle(b.querySelector('.hardware-contour'));
        return b.matches(':hover') && Number(s.opacity) >= .89 && s.backgroundColor === 'rgb(176, 170, 185)'
            && getComputedStyle(b).backgroundColor === 'rgba(0, 0, 0, 0)'; })()""",
    )
    view.grab().save(str(ARTIFACTS / "hardware-hover.png"))
    page.runJavaScript("document.querySelector('[data-hardware-id=host-1]').click()")
    QTimer.singleShot(150, selected)


def selected():
    record(
        "Selected outline is purple and device context is shown",
        """(() => { const b = document.querySelector('[data-hardware-id=host-1]');
        const s = getComputedStyle(b.querySelector('.hardware-contour'));
        return b.getAttribute('aria-pressed') === 'true' && s.opacity === '1' && s.backgroundColor === 'rgb(162, 139, 208)'
            && document.querySelector('.hardware-context').textContent.includes('server-01'); })()""",
    )
    view.grab().save(str(ARTIFACTS / "hardware-overview.png"))
    page.runJavaScript("document.dispatchEvent(new KeyboardEvent('keydown',{key:'2',bubbles:true}))")
    QTimer.singleShot(100, shortcut)


def shortcut():
    record(
        "Numbers switch selection exclusively",
        "document.querySelectorAll('.hardware-node[aria-pressed=true]').length === 1 && document.querySelector('[data-hardware-id=host-2]').getAttribute('aria-pressed') === 'true'",
    )
    page.runJavaScript(
        "document.querySelector('.hub-actions-resizer').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}))"
    )
    QTimer.singleShot(100, resized)


def resized():
    record(
        "Action panel is keyboard resizable",
        "document.querySelector('.hub-actions-resizer').getAttribute('aria-valuenow') === '350'",
    )
    page.runJavaScript("document.dispatchEvent(new KeyboardEvent('keydown',{key:'0',bubbles:true}))")
    QTimer.singleShot(100, home)


def home():
    record(
        "Zero resets target selection",
        "!document.querySelector('.hardware-node[aria-pressed=true]') && !document.querySelector('.hardware-context')",
    )
    page.runJavaScript(
        "window.hardwareBeforeZoom = getComputedStyle(document.querySelector('.hardware-world')).transform; document.querySelector('.hardware-canvas').dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true}))"
    )
    QTimer.singleShot(100, zoomed)


def zoomed():
    record(
        "Wheel zoom changes the viewport",
        "getComputedStyle(document.querySelector('.hardware-world')).transform !== window.hardwareBeforeZoom",
    )
    page.runJavaScript("document.dispatchEvent(new KeyboardEvent('keydown',{key:'0',bubbles:true}))")
    QTimer.singleShot(100, zoom_reset)


def zoom_reset():
    record(
        "Zero refits after zoom",
        "getComputedStyle(document.querySelector('.hardware-world')).transform === window.hardwareBeforeZoom",
    )
    page.runJavaScript("document.querySelector('.hub-brand').click()")
    QTimer.singleShot(120, switch_project)


def switch_project():
    page.runJavaScript(f"document.querySelector('[data-hub-project=\"{other['id']}\"]').click()")
    QTimer.singleShot(800, switched)


def switched():
    record(
        "Switching projects does not retain previous devices, routes or selection",
        "document.querySelector('.hub-overview h1').textContent === 'Other lab' && document.querySelectorAll('.hardware-node').length === 2 && document.querySelector('[data-hardware-id=vpn] .hardware-labels').textContent === 'Unknown' && !document.querySelector('.hardware-links line') && !document.querySelector('.hardware-context')",
    )
    QTimer.singleShot(100, finish)


def finish():
    result = {"stack": "asgi", "checks": checks, "js_errors": errors}
    (ARTIFACTS / f"checks-{result['stack']}.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result))
    app.exit(0 if all(item["result"] is True for item in checks) and not errors else 1)


page.loadFinished.connect(lambda ok: QTimer.singleShot(1200, open_project) if ok else app.exit(2))
QTimer.singleShot(25000, lambda: app.exit(3))
page.load(QUrl(url + "/"))
code = app.exec()
view.stop()
view.close()
sip.delete(view)
sip.delete(profile)
server.__exit__(None, None, None)
active = logic.activeProject
logic.projectManager.closeProject(active)
active.database.dispose()
fixture.cleanup()
sys.exit(code)
