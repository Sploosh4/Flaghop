"""Run the real WebEngine window against a synthetic local workspace; never launches scans.

Usage: QT_QPA_PLATFORM=offscreen QTWEBENGINE_CHROMIUM_FLAGS="--disable-gpu --no-sandbox"
       .venv/bin/python tests/desktop/workspace_smoke.py
"""

import json
import os
import tempfile
import threading
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
# Isolate all fixture configuration and browser output from the live workspace.
ARTIFACTS = ROOT / ".artifacts/disposable/workspace-smoke"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
(ROOT / ".tmp").mkdir(exist_ok=True)
fixture_home = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
os.environ["LEGION_HOME"] = fixture_home.name
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")

from app.api import create_app
from tests.support.asgi_server import live_asgi_server
from PyQt6 import sip
from PyQt6.QtCore import QTimer, QUrl
from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QApplication

from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from app.scheduler.state import upsert_target_state
from db.entities.host import hostObj

logic = create_default_logic()
session = logic.activeProject.database.session()
host = hostObj(ip="198.51.100.25")
host.hostname = "fixture.example.test"
host.status = "up"
session.add(host)
session.commit()
host_id = int(host.id)
session.close()
upsert_target_state(
    logic.activeProject.database,
    host_id,
    {
        "host_ip": "198.51.100.25",
        "hostname": "fixture.example.test",
        "service_inventory": [{"port": "443", "protocol": "tcp", "service": "https", "state": "open"}],
        "findings": [
            {
                "title": "Fixture observation",
                "severity": "info",
                "evidence": "Synthetic local validation",
                "source_kind": "observed",
            }
        ],
    },
)
runtime = WebRuntime(logic)
runtime.scheduler_config.update_preferences({"feature_flags": {"graph_workspace": True}})
fixture_wait = threading.Event()


def fixture_job(job_id):
    while not runtime.jobs.is_cancel_requested(job_id):
        fixture_wait.wait(0.03)
    return {"fixture": True}


fixture_job_id = runtime._start_job("fixture-ui-wait", fixture_job)["id"]
server_context = live_asgi_server(create_app(runtime))
server_url = server_context.__enter__()
app = QApplication([sys.argv[0]])
errors = []


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
checks = []


def record(name, js, callback=None):
    def done(result):
        checks.append({"name": name, "result": result})
        if callback:
            callback()

    page.runJavaScript(js, done)


def settings():
    record(
        "app settings opens without raw editor",
        """(() => {
      document.getElementById('ribbon-app-settings-button').click();
      return document.getElementById('app-settings-modal').classList.contains('is-open')
        && !document.getElementById('settings-config-text')
        && !!document.getElementById('settings-tool-audit-body');
    })()""",
    )
    QTimer.singleShot(1200, screenshot_settings)


def screenshot_settings():
    view.grab().save(str(ARTIFACTS / "settings.png"))
    record(
        "scan form opens directly",
        """(() => {
      document.getElementById('settings-modal-close').click();
      document.getElementById('ribbon-scan-add-action-button').click();
      return document.getElementById('nmap-scan-modal').classList.contains('is-open');
    })()""",
    )
    QTimer.singleShot(300, tools)


def tools():
    record(
        "tool form opens directly",
        """(() => {
      document.getElementById("nmap-scan-modal-close").click();
      document.getElementById('ribbon-scan-manual-action-button').click();
      return document.getElementById('manual-scan-modal').classList.contains('is-open');
    })()""",
    )
    QTimer.singleShot(300, open_jobs)


def open_jobs():
    record(
        "React jobs panel opens",
        """(() => {
      document.getElementById('manual-scan-modal-close').click();
      document.getElementById('ribbon-logging-jobs-button').click();
      return document.getElementById('jobs-body').dataset.framework === 'react';
    })()""",
    )
    QTimer.singleShot(300, stop_fixture_job)


def stop_fixture_job():
    record(
        "Stop a synthetic job through the native API",
        f"""(() => {{
      const button = document.querySelector('#jobs-body tr[data-job-id="{fixture_job_id}"] button[data-job-action="stop"]');
      if (!button) return false;
      button.click();
      return true;
    }})()""",
    )
    QTimer.singleShot(700, fixture_stopped)


def fixture_stopped():
    record(
        "React receives job cancellation updates",
        f"""(() => {{
      const row = document.querySelector('#jobs-body tr[data-job-id="{fixture_job_id}"]');
      const stopped = row && row.textContent.includes('cancelled') && !row.querySelector('button');
      document.getElementById('jobs-modal-close').click();
      return Boolean(stopped);
    }})()""",
    )
    graph()


def graph():
    record(
        "interactive graph populated",
        """(() => {
      document.getElementById("manual-scan-modal-close").click();
      document.querySelector('[data-view="graph"]').click();
      return document.querySelectorAll("[data-graph-node-id]").length > 0
        && !!document.getElementById('graph-layout-save-button')
        && !document.querySelector('[id^="graph-export-"]');
    })()""",
    )
    QTimer.singleShot(500, graph_interactions)


def graph_interactions():
    record(
        "graph filters and node selection",
        """(() => {
      document.getElementById('graph-filters-toggle-button').click();
      const node = document.querySelector('[data-graph-node-id]');
      node.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return !document.getElementById('graph-filters-panel').hidden;
    })()""",
    )
    record(
        "sidebar double-click opens the inline rename editor",
        """(() => {
      document.getElementById('sidebar-project-name').dispatchEvent(new MouseEvent('dblclick', {bubbles:true}));
      const input = document.getElementById('workspace-rename-input');
      return document.getElementById('workspace-react-root').dataset.framework === 'react';
    })()""",
    )
    QTimer.singleShot(100, edit_workspace_name)


def edit_workspace_name():
    record(
        "React rename editor is focused",
        """(() => {
      const input = document.getElementById('workspace-rename-input');
      return input && !input.hidden && document.activeElement === input;
    })()""",
    )
    record(
        "rename submits through the current workspace API",
        """(() => {
      const input = document.getElementById('workspace-rename-input');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Refactor fixture');
      input.dispatchEvent(new Event('input', {bubbles:true}));
      return true;
    })()""",
    )
    QTimer.singleShot(100, submit_workspace_name)


def submit_workspace_name():
    record(
        "Submit React workspace name",
        """(() => {
      document.getElementById('workspace-rename-input').dispatchEvent(new KeyboardEvent('keydown', {key:'Enter',bubbles:true}));
      return true;
    })()""",
    )
    QTimer.singleShot(800, renamed)


def renamed():
    record(
        "workspace names stay synchronized",
        """(() => {
      return document.getElementById('breadcrumb-project').textContent === 'Refactor fixture'
        && document.getElementById('sidebar-project-name').textContent === 'Refactor fixture';
    })()""",
    )
    finish()


def finish():
    view.grab().save(str(ARTIFACTS / "graph.png"))
    record(
        "overview",
        """(() => {
      document.querySelector('[data-view="overview"]').click();
      return !document.getElementById('startup-wizard-overlay')
        && !document.getElementById('ribbon-export-menu-button')
        && !!document.getElementById('ribbon-workspace-restore-action-button');
    })()""",
    )
    QTimer.singleShot(300, quit_check)


def quit_check():
    view.grab().save(str(ARTIFACTS / "overview.png"))
    payload = {"checks": checks, "js_errors": errors}
    (ARTIFACTS / "ui-check.json").write_text(json.dumps(payload, indent=2))
    print(json.dumps(payload))
    app.exit(0 if all(c["result"] is True for c in checks) and not errors else 1)


page.loadFinished.connect(lambda ok: QTimer.singleShot(2500, settings) if ok else app.exit(2))
QTimer.singleShot(25000, lambda: app.exit(3))
page.load(QUrl(server_url + "/"))
code = app.exec()
view.stop()
view.close()
sip.delete(view)
sip.delete(profile)
server_context.__exit__(None, None, None)
runtime.jobs.cancel_job(fixture_job_id, reason="fixture cleanup")
fixture_wait.set()
logic.projectManager.closeProject(logic.activeProject)
fixture_home.cleanup()
sys.exit(code)
