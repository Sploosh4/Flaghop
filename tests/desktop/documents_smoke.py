"""Native document windows and grouped reader results; synthetic local files only."""

import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
ARTIFACTS = ROOT / ".artifacts/disposable/documents-smoke"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
fixture = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
os.environ["LEGION_HOME"] = str(Path(fixture.name) / "config")
os.environ["LEGION_PROJECTS_DIR"] = str(Path(fixture.name) / "Documents/FlagHop")
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")

from PyQt6 import sip
from PyQt6.QtCore import QTimer
from PyQt6.QtWidgets import QApplication
from app.api import create_app
from app.desktop import LegionWindow, WorkspacePage
from app.desktop_documents import DocumentPopupPage
from app.services.project_background import atomic_json
from app.services.project_files import ProjectFiles
from app.web import create_app as create_legacy_app
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from tests.support.asgi_server import live_asgi_server, live_legacy_server

logic = create_default_logic()
runtime = WebRuntime(logic)
legacy = os.environ.get("LEGION_SMOKE_WEB_STACK") == "legacy"
web = create_legacy_app(runtime) if legacy else create_app(runtime)
hub = (web if legacy else web.state.legacy).extensions["project_hub"]
project = hub.create("Harbour")["project"]
root = Path(project["folder"])
(root / "input.txt").write_text("Synthetic source. Original bytes must stay unchanged.\n")
text = b"Evidence from fixture.\n"
identifier = hashlib.sha256(text).hexdigest()
noise = hashlib.sha256(b"noise").hexdigest()
(root / "ciphey/artifacts").mkdir(parents=True)
(root / "ciphey/artifacts" / (identifier + ".bin")).write_bytes(text)
(root / "ciphey/artifacts" / (noise + ".bin")).write_bytes(b"noise")
hash_id = hashlib.sha256(b"fixture-hash").hexdigest()
(root / "password-crackers/jobs" / hash_id).mkdir(parents=True)
(root / "password-crackers/jobs" / hash_id / "recovered.txt").write_bytes(b"fixture-only\n")
atomic_json(root / "password-crackers/queue.json", {"targets": [{"id": hash_id, "status": "recovered"}]})
atomic_json(
    root / "reader-report.json",
    {
        "nodes": [{"id": identifier, "status": "done"}, {"id": noise, "status": "done"}],
        "edges": [
            {"parent": "original", "child": identifier, "kind": "base64"},
            {"parent": "internal", "child": noise, "kind": "base85"},
        ],
        "sources": [{"id": "a", "path": "input.txt"}, {"id": "b", "path": "workspace.legion"}],
        "provenance": [{"source": "a", "node": identifier}, {"source": "b", "node": noise}],
        "target_nodes": [{"target": hash_id, "node": identifier}],
    },
)
(root / ".reader-state").mkdir()
atomic_json(
    root / ".reader-state/worker-status.json",
    {"project_id": project["id"], "available": True, "heartbeat_at": time.time(), "engines": ["cipher", "password"]},
)
listing_calls = []
original_listing = ProjectFiles.listing


def tracked_listing(self, path):
    listing_calls.append(path)
    return original_listing(self, path)


ProjectFiles.listing = tracked_listing
server = live_legacy_server(web) if legacy else live_asgi_server(web)
url = server.__enter__()
app = QApplication([sys.argv[0]])
checks, errors = [], []


def console(self, level, message, line, source):
    if level == self.JavaScriptConsoleMessageLevel.ErrorMessageLevel:
        errors.append(f"{source}:{line}: {message}")


WorkspacePage.javaScriptConsoleMessage = console
DocumentPopupPage.javaScriptConsoleMessage = console
window = LegionWindow(url + "/", profile_dir=ARTIFACTS / ("profile-legacy" if legacy else "profile"))
window.show()
page = window.page
editor = None


def record(name, code, target=None):
    (target or page).runJavaScript(code, lambda value: checks.append({"name": name, "result": value}))


def opened():
    page.runJavaScript(f"document.querySelector('[data-hub-project=\"{project['id']}\"]').click()")
    QTimer.singleShot(1000, grouped)


def grouped():
    record(
        "Cipher and Hash are separate collapsible groups",
        "document.querySelector('#hub-reader-cipher summary').textContent === 'Cipher1' && document.querySelector('#hub-reader-hash summary').textContent === 'Hash1'",
    )
    record(
        "Internal data is in History, below Working",
        "document.querySelector('#hub-background-history summary').textContent === 'History1' && !!(document.getElementById('hub-background-working').compareDocumentPosition(document.getElementById('hub-background-history')) & Node.DOCUMENT_POSITION_FOLLOWING)",
    )
    record(
        "Only the green Start button appears, without adjacent status text",
        "document.querySelector('.hub-background-control').children.length === 1 && document.getElementById('hub-background-toggle').textContent === 'Start' && getComputedStyle(document.getElementById('hub-background-toggle')).backgroundColor === 'rgb(37, 78, 62)'",
    )
    page.runJavaScript("document.getElementById('hub-background-toggle').click()")
    QTimer.singleShot(300, running)


def running():
    record(
        "Running uses the red Stop button",
        "document.getElementById('hub-background-toggle').textContent === 'Stop' && getComputedStyle(document.getElementById('hub-background-toggle')).backgroundColor === 'rgb(100, 46, 54)'",
    )
    page.runJavaScript("document.getElementById('hub-background-toggle').click()")
    page.runJavaScript("document.querySelector('#hub-reader-cipher a').click()")
    QTimer.singleShot(1500, editor_opened)


def editor_opened():
    global editor
    if not page.document_windows:
        checks.append({"name": "Independent editor window exists", "result": False})
        return finish()
    editor = page.document_windows[0]
    target = editor.view.page()
    checks.append({"name": "Opening a result did not browse the filesystem", "result": len(listing_calls) == 0})
    record(
        "Overview remains in the main window",
        "!!document.querySelector('.hub-overview') && !document.querySelector('.hub-files-view')",
    )
    record(
        "Document is independent and Files is hidden",
        "location.pathname.endsWith('/editor') && getComputedStyle(document.querySelector('.window')).display === 'none' && document.querySelector('.editor-text').value === 'Evidence from fixture.\\n'",
        target,
    )
    record(
        "Native header is charcoal and truly centered",
        "(() => { const h=document.querySelector('.editor-header'),t=document.querySelector('.editor-title'),a=h.getBoundingClientRect(),b=t.getBoundingClientRect(); return getComputedStyle(h).backgroundColor === 'rgb(56, 56, 55)' && Math.abs(a.x+a.width/2-b.x-b.width/2)<2 && h.querySelectorAll('.document-window-control:not([hidden])').length===3; })()",
        target,
    )
    record(
        "Single-document editor has no redundant tab bar",
        "document.getElementById('editor-tabs').hidden && document.getElementById('editor-title').textContent === 'input.txt'",
        target,
    )
    record(
        "Editor has no load error or synthetic URI in its title",
        "!document.querySelector('.document-error') && !document.getElementById('editor-path').textContent.includes('saved-result://')",
        target,
    )
    editor.view.grab().save(str(ARTIFACTS / "editor-independent.png"))
    window.view.grab().save(str(ARTIFACTS / "grouped-panel.png"))
    target.runJavaScript(
        "(() => { const a=document.querySelector('.editor-text'); a.value='Edited fixture draft'; a.dispatchEvent(new Event('input',{bubbles:true})); document.getElementById('native-save').click(); })()"
    )
    QTimer.singleShot(200, edited)


def edited():
    checks.append(
        {
            "name": "Editing a draft preserved the saved result and original source",
            "result": (root / "ciphey/artifacts" / (identifier + ".bin")).read_bytes() == text
            and (root / "input.txt").read_text().startswith("Synthetic source."),
        }
    )
    record(
        "Document and Files do not share the main page",
        "document.querySelector('.hub-overview h1').textContent === 'Harbour'",
    )
    page.runJavaScript(
        "[...document.querySelectorAll('.hub-project-context nav button')].find(b=>b.textContent==='Files').click()"
    )
    QTimer.singleShot(1000, files_opened)


def files_opened():
    windows = [w for w in page.document_windows if w.view.url().path().endswith("/filesystem")]
    checks.append(
        {
            "name": "Files opens in its own window alongside the editor",
            "result": len(windows) == 1 and len(page.document_windows) == 2,
        }
    )
    if windows:
        target = windows[0].view.page()
        record(
            "Local project session is labeled Laptop",
            "document.getElementById('session-label').textContent === 'Laptop' && !document.body.textContent.includes('Original test filesystem')",
            target,
        )
        windows[0].view.grab().save(str(ARTIFACTS / "files-independent.png"))
    checks.append(
        {"name": "Filesystem listing happens only after explicit Files action", "result": len(listing_calls) > 0}
    )
    QTimer.singleShot(100, finish)


def finish():
    data = {"stack": "legacy" if legacy else "asgi", "checks": checks, "js_errors": errors}
    (ARTIFACTS / ("checks-" + data["stack"] + ".json")).write_text(json.dumps(data, indent=2))
    print(json.dumps(data))
    app.exit(0 if all(row["result"] is True for row in checks) and not errors else 1)


page.loadFinished.connect(lambda ok: QTimer.singleShot(1200, opened) if ok else app.exit(2))
QTimer.singleShot(20000, lambda: app.exit(3))
code = app.exec()
for child in list(page.document_windows):
    child.view.stop()
    child.close()
    if not sip.isdeleted(child):
        sip.delete(child)
window.view.stop()
window.close()
sip.delete(window)
server.__exit__(None, None, None)
active = logic.activeProject
logic.projectManager.closeProject(active)
active.database.dispose()
fixture.cleanup()
sys.exit(code)
