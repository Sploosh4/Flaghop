"""Exercise the project foundation in WebEngine with local fixtures only."""

import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
ARTIFACTS = ROOT / ".artifacts/disposable/workspace-smoke"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
(ROOT / ".tmp").mkdir(exist_ok=True)
fixture = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
os.environ["LEGION_HOME"] = str(Path(fixture.name) / "config")
os.environ["LEGION_PROJECTS_DIR"] = str(Path(fixture.name) / "Documents/Hackathon")
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")

from PyQt6 import sip
from PyQt6.QtCore import QTimer, QUrl
from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QApplication
from app.api import create_app
from app.web import create_app as create_legacy_app
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from tests.support.asgi_server import live_asgi_server, live_legacy_server

logic = create_default_logic()
runtime = WebRuntime(logic)
legacy = os.environ.get("LEGION_SMOKE_WEB_STACK") == "legacy"
web = create_legacy_app(runtime) if legacy else create_app(runtime)
hub = (web if legacy else web.state.legacy).extensions["project_hub"]
harbour = hub.create("Harbour")["project"]
switchyard = hub.create("Switchyard")["project"]
Path(harbour["folder"], "scope.md").write_text("Synthetic local fixture. No scans are run.\n")
server = live_legacy_server(web) if legacy else live_asgi_server(web)
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


def home():
    record(
        "Home lists projects without tabs",
        """(() => {
        return !!document.querySelector('.hub-home')
            && document.querySelectorAll('.hub-project-context nav').length === 0
            && document.querySelectorAll('.hub-project').length >= 2;
    })()""",
    )
    record(
        "Old navigation and actions are hidden and inert",
        """(() => {
        const old = document.getElementById('legacy-workspace');
        return old.hidden && old.inert && old.getClientRects().length === 0;
    })()""",
    )
    view.grab().save(str(ARTIFACTS / "foundation-home.png"))
    record("Collapse the sidebar", "document.getElementById('hub-sidebar-toggle').click(); true")
    QTimer.singleShot(150, sidebar_collapsed)


def sidebar_collapsed():
    record(
        "Collapsed sidebar frees the full page width",
        """(() => {
        return getComputedStyle(document.getElementById('hub-sidebar')).display === 'none'
            && document.querySelector('.hub-main').getBoundingClientRect().left === 0
            && localStorage.getItem('legion.workspace.sidebarCollapsed') === 'true';
    })()""",
    )
    view.grab().save(str(ARTIFACTS / "foundation-sidebar-collapsed.png"))
    record("Reopen the sidebar", "document.getElementById('hub-sidebar-reopen').click(); true")
    QTimer.singleShot(150, sidebar_restored)


def sidebar_restored():
    record(
        "Sidebar returns with its collapse control",
        """(() => {
        return getComputedStyle(document.getElementById('hub-sidebar')).display !== 'none'
            && document.querySelector('.hub-main').getBoundingClientRect().left > 0
            && document.activeElement === document.getElementById('hub-sidebar-toggle');
    })()""",
    )
    record(
        "Project row opens its home page",
        f"""(() => {{
        document.querySelector('[data-hub-project="{harbour['id']}"]').click();
        return true;
    }})()""",
    )
    QTimer.singleShot(650, project)


def project():
    record(
        "Dedicated project sidebar replaces the project list",
        """(() => {
        const tabs = [...document.querySelectorAll('.hub-project-context nav button')];
        return tabs.length === 1 && tabs[0].textContent === 'Overview'
            && document.querySelector('.hub-project-heading').textContent === 'LGHarbour'
            && !document.querySelector('.hub-projects')
            && document.querySelector('.hub-overview h1').textContent === 'Harbour';
    })()""",
    )
    record(
        "Project files are in its Hackathon folder",
        """(() => {
        return document.querySelector('.hub-folder').textContent.includes('Documents/Hackathon/Harbour')
            && document.querySelector('.hub-files').textContent.includes('scope.md');
    })()""",
    )
    view.grab().save(str(ARTIFACTS / "foundation-project.png"))
    record(
        "Project VPN can explicitly be None",
        """(() => {
        const select = document.getElementById('hub-project-vpn');
        select.value = 'none'; select.dispatchEvent(new Event('change', {bubbles:true}));
        return true;
    })()""",
    )
    QTimer.singleShot(300, switch_project)


def switch_project():
    checks.append(
        {
            "name": "Project preference persisted",
            "result": next(row for row in hub.list()["projects"] if row["id"] == harbour["id"])["vpn"] == "none",
        }
    )
    record("Return to projects before switching", "document.querySelector('.hub-brand').click(); true")
    QTimer.singleShot(150, select_second)


def select_second():
    record(
        "Select a second project",
        f"""(() => {{
        document.querySelector('[data-hub-project="{switchyard['id']}"]').click(); return true;
    }})()""",
    )
    QTimer.singleShot(600, switched)


def switched():
    record(
        "Second project replaces the selected Overview",
        """(() => {
        return document.querySelector('.hub-overview h1').textContent === 'Switchyard'
            && document.querySelectorAll('.hub-project-context nav').length === 1;
    })()""",
    )
    record("Open Setup inside the project", "document.getElementById('hub-setup').click(); true")
    QTimer.singleShot(150, project_setup)


def project_setup():
    record(
        "Setup keeps the project sidebar",
        """(() => {
        return !!document.querySelector('.hub-setup-page')
            && document.querySelector('.hub-project-heading').textContent === 'LGSwitchyard'
            && !document.querySelector('.hub-projects')
            && !document.querySelector('.hub-overview-tab').hasAttribute('aria-current');
    })()""",
    )
    view.grab().save(str(ARTIFACTS / "foundation-project-setup.png"))
    record("Overview returns from Setup", "document.querySelector('.hub-overview-tab').click(); true")
    QTimer.singleShot(150, project_returned)


def project_returned():
    record(
        "Overview is the new project page",
        "document.querySelector('.hub-overview h1').textContent === 'Switchyard'",
    )
    record(
        "Legion returns home and removes tabs",
        """(() => {
        document.querySelector('.hub-brand').click();
        return true;
    })()""",
    )
    QTimer.singleShot(150, setup)


def setup():
    record(
        "Home has no project tabs after returning", "document.querySelectorAll('.hub-project-context nav').length === 0"
    )
    record(
        "Setup opens from the bottom button",
        """(() => {
        document.getElementById('hub-setup').click(); return true;
    })()""",
    )
    QTimer.singleShot(150, setup_visible)


def setup_visible():
    record(
        "Setup shows computer with deferred VPN controls",
        """(() => {
        return !!document.querySelector('.hub-computer h1').textContent
            && document.querySelector('.hub-vpn-unconfigured').textContent === 'Not configured'
            && document.getElementById('hub-default-vpn').disabled
            && document.querySelector('[aria-label="Refresh VPNs — not available yet"]').disabled
            && document.getElementById('hub-setup').classList.contains('needs-setup');
    })()""",
    )
    view.grab().save(str(ARTIFACTS / "foundation-setup.png"))
    record(
        "Ctrl K opens command search",
        """(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', {key:'k',ctrlKey:true,bubbles:true}));
        return true;
    })()""",
    )
    QTimer.singleShot(100, palette_open)


def palette_open():
    record(
        "Command search receives focus",
        "document.activeElement?.getAttribute('aria-label') === 'Search views, actions, and hosts'",
    )
    record(
        "Close command search",
        "document.querySelector('.hub-modal').dispatchEvent(new KeyboardEvent('keydown', {key:'Escape',bubbles:true})); true",
    )
    QTimer.singleShot(100, open_creation)


def open_creation():
    record(
        "Open the project creation form",
        """(() => {
        document.getElementById('hub-new-project').click(); return true;
    })()""",
    )
    QTimer.singleShot(150, enter_name)


def enter_name():
    record("New project name input is focused", "document.activeElement === document.querySelector('.hub-modal input')")
    record(
        "Enter new project name",
        """(() => {
        const input = document.querySelector('.hub-modal input');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Quiet lab');
        input.dispatchEvent(new Event('input', {bubbles:true})); return true;
    })()""",
    )
    QTimer.singleShot(100, create)


def create():
    record(
        "Create a named project",
        """(() => {
        document.querySelector('.hub-modal form').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true})); return true;
    })()""",
    )
    QTimer.singleShot(700, created)


def created():
    record(
        "New project opens and has a dedicated folder",
        """(() => {
        return document.querySelector('.hub-overview h1').textContent === 'Quiet lab'
            && document.querySelector('.hub-folder').textContent.endsWith('Documents/Hackathon/Quiet lab')
            && !document.querySelector('.hub-modal');
    })()""",
    )
    record(
        "Resize sidebar by keyboard",
        "document.querySelector('.hub-resizer').dispatchEvent(new KeyboardEvent('keydown', {key:'End',bubbles:true})); true",
    )
    QTimer.singleShot(100, resized)


def resized():
    record(
        "Saved sidebar width is applied",
        "document.querySelector('.hub-resizer').getAttribute('aria-valuenow') === '340' && document.querySelector('.hub-main').getBoundingClientRect().left === 340",
    )
    record(
        "Rename by sidebar double click",
        "document.querySelector('.hub-project-heading .hub-name').dispatchEvent(new MouseEvent('dblclick', {bubbles:true})); true",
    )
    QTimer.singleShot(100, rename_project)


def rename_project():
    record(
        "Enter renamed project",
        """(() => {
        const input = document.querySelector('.hub-project-heading input');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Quiet lab renamed');
        input.dispatchEvent(new Event('input', {bubbles:true})); return true;
    })()""",
    )
    QTimer.singleShot(100, save_name)


def save_name():
    record(
        "Commit renamed project",
        "document.querySelector('.hub-project-heading input').dispatchEvent(new KeyboardEvent('keydown', {key:'Enter',bubbles:true})); true",
    )
    QTimer.singleShot(500, renamed)


def renamed():
    record(
        "Rename updates both project labels",
        "document.querySelector('.hub-overview h1').textContent === 'Quiet lab renamed' && document.querySelector('.hub-header .hub-name').textContent === 'Quiet lab renamed'",
    )
    record(
        "Open project context menu",
        "document.querySelector('.hub-project-heading').dispatchEvent(new MouseEvent('contextmenu', {clientX:100,clientY:120,bubbles:true})); true",
    )
    QTimer.singleShot(100, context_save)


def context_save():
    record(
        "Context menu includes all file controls",
        "['Rename project','Save','Save as…','Export ZIP','Workspace details'].every(label => [...document.querySelectorAll('.hub-context-menu button')].some(button => button.textContent === label))",
    )
    record(
        "Save from context menu",
        "[...document.querySelectorAll('.hub-context-menu button')].find(button => button.textContent === 'Save').click(); true",
    )
    QTimer.singleShot(500, settings_controls)


def settings_controls():
    record("Save completed", "document.querySelector('[role=status]').textContent === 'Saved'")
    record("Open Setup for original settings", "document.getElementById('hub-setup').click(); true")
    QTimer.singleShot(100, settings_open)


def settings_open():
    record(
        "Open application settings",
        "[...document.querySelectorAll('.hub-settings-links button')].find(button => button.textContent === 'Application settings').click(); true",
    )
    QTimer.singleShot(2200, application_settings)


def application_settings():
    record(
        "Original settings dialog is accessible and populated",
        """(() => {
        const doc = document.querySelector('.hub-reused-panel iframe').contentDocument;
        return doc.getElementById('app-settings-modal').classList.contains('is-open')
            && doc.querySelectorAll('#settings-tool-audit-body tr').length > 0;
    })()""",
    )
    view.grab().save(str(ARTIFACTS / "restored-application-settings.png"))
    record(
        "Close settings through its original button",
        "document.querySelector('.hub-reused-panel iframe').contentDocument.getElementById('settings-modal-close').click(); true",
    )
    QTimer.singleShot(200, interface_open)


def interface_open():
    record("Original close returns to Setup", "!!document.querySelector('.hub-setup-page')")
    record(
        "Open interface settings",
        "[...document.querySelectorAll('.hub-settings-links button')].find(button => button.textContent === 'Interface settings').click(); true",
    )
    QTimer.singleShot(1800, interface_settings)


def interface_settings():
    record(
        "Interface settings are accessible",
        "document.querySelector('.hub-reused-panel iframe').contentDocument.getElementById('interface-settings-modal').classList.contains('is-open')",
    )
    record(
        "Close interface settings",
        "document.querySelector('.hub-reused-panel iframe').contentDocument.getElementById('interface-settings-modal-close').click(); true",
    )
    QTimer.singleShot(200, restored_finish)


def restored_finish():
    record(
        "Live status is displayed",
        "['Live','Polling/API'].some(value => document.querySelector('.hub-footer-meta').textContent.includes(value))",
    )
    record("Errors are absent", "document.querySelectorAll('#project-hub-root [role=alert]').length === 0")
    view.grab().save(str(ARTIFACTS / "restored-project-controls.png"))
    page.loadFinished.disconnect()
    page.loadFinished.connect(lambda ok: QTimer.singleShot(1600, reloaded) if ok else app.exit(2))
    view.reload()


def reloaded():
    record(
        "Reload restores project, Setup and sidebar width",
        "!!document.querySelector('.hub-setup-page') && document.querySelector('.hub-project-heading .hub-name').textContent === 'Quiet lab renamed' && document.querySelector('.hub-resizer').getAttribute('aria-valuenow') === '340'",
    )
    QTimer.singleShot(100, finish)


def finish():
    result = {"stack": "legacy" if legacy else "asgi", "checks": checks, "js_errors": errors}
    filename = "ui-check-legacy.json" if legacy else "ui-check.json"
    (ARTIFACTS / filename).write_text(json.dumps(result, indent=2))
    print(json.dumps(result))
    app.exit(0 if all(item["result"] is True for item in checks) and not errors else 1)


page.loadFinished.connect(lambda ok: QTimer.singleShot(2000, home) if ok else app.exit(2))
QTimer.singleShot(45000, lambda: app.exit(3))
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
