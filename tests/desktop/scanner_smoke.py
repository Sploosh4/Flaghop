"""Real app job/process/import/editor flow with a synthetic child; NEVER scans a network.

The network lease is replaced only in this fixture. It validates scope/revision,
then launches a deterministic profile writer instead of the scanner. This proves
UI plumbing and process lifecycle, not privileged egress enforcement or live coverage.
"""

import json
import os
from pathlib import Path
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
os.environ["TMPDIR"] = str(ROOT / ".tmp")
os.environ["XDG_CACHE_HOME"] = str(ROOT / ".cache")
fixture = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
os.environ["LEGION_HOME"] = str(Path(fixture.name) / "config")
os.environ["LEGION_PROJECTS_DIR"] = str(Path(fixture.name) / "projects")

from unittest.mock import patch
from PyQt6 import sip
from PyQt6.QtCore import QTimer
from PyQt6.QtWidgets import QApplication
from app.api import create_app
from app.desktop import LegionWindow, WorkspacePage
from app.desktop_documents import DocumentPopupPage
from app.scanning.source import scanner_source
from app.services.network_models import NetworkUpdate
from app.web import create_app as create_legacy_app
from app.web.bootstrap import create_default_logic
from app.web.runtime import WebRuntime
from db.entities.host import hostObj
from tests.app.test_ProjectNetworks import FixtureProbe
from tests.support.asgi_server import live_asgi_server, live_legacy_server

ARTIFACTS = ROOT / ".artifacts/disposable/scanner-smoke"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
logic = create_default_logic()
runtime = WebRuntime(logic)
legacy = os.environ.get("LEGION_SMOKE_WEB_STACK") == "legacy"
web = create_legacy_app(runtime) if legacy else create_app(runtime)
hub = (web if legacy else web.state.legacy).extensions["project_hub"]
project = hub.create("Synthetic scanner lab")["project"]
hub.networks.probe = FixtureProbe()
hub.networks.save(
    project["id"],
    NetworkUpdate(
        expected_revision=0,
        settings={
            "name": "Fixture",
            "scope_source": "Synthetic data only",
            "interface": "ctf0",
            "allowed_targets": ["192.0.2.10"],
            "allowed_ports": [8080],
        },
    ),
)
session = logic.activeProject.database.session()
host = hostObj(ip="192.0.2.10", hostname="synthetic.test", status="up")
session.add(host)
session.commit()
host_id = host.id
session.close()
original_source = scanner_source()[1]
requests = []


class SyntheticLease:
    def __init__(self, service, request):
        self.service, self.request = service, request
        self.reference = None
        self.snapshot = None
        self.report = None

    def prepare(self):
        self.reference = self.service.runtime.jobs.get_job(self.request.job_id)["payload"]["network_context"]
        self.snapshot = self.service.inspect(self.reference, list(self.request.network_targets))
        assert self.reference["project_id"] == project["id"] and self.reference["revision"] == 1
        assert self.request.argv[:3] == (sys.executable, "-m", "app.scanning.worker")
        config = json.loads(Path(self.request.argv[-1]).read_text())
        output = config["argv"][config["argv"].index("--out") + 1]
        self.report = self.service.report(self.reference, ["192.0.2.10"], snapshot=self.snapshot)
        requests.append(self.request)
        return [
            sys.executable,
            "-c",
            "import sys,time; from tests.support.scanner_fixture import write_profile; print('Synthetic child running',flush=True); time.sleep(3); write_profile(sys.argv[1]); print('Synthetic evidence saved',flush=True)",
            output,
        ]

    def verify(self):
        self.service.verify(self.snapshot)

    def close(self):
        pass


lease_patch = patch("app.services.network_guard.NetworkLease", SyntheticLease)
lease_patch.start()
server = live_legacy_server(web) if legacy else live_asgi_server(web)
url = server.__enter__()
app = QApplication([sys.argv[0]])
checks, errors = [], []


def console(self, level, message, line, source):
    if level == self.JavaScriptConsoleMessageLevel.ErrorMessageLevel:
        errors.append(f"{source}:{line}: {message}")


WorkspacePage.javaScriptConsoleMessage = console
DocumentPopupPage.javaScriptConsoleMessage = console
window = LegionWindow(url + "/", profile_dir=Path(fixture.name) / "desktop-profile")
window.show()
page = window.page


def record(name, expression, target=None):
    (target or page).runJavaScript(expression, lambda result: checks.append({"name": name, "result": result}))


def until(expression, callback, deadline=None):
    deadline = deadline or time.monotonic() + 8

    def observed(value):
        if value:
            callback()
        elif time.monotonic() < deadline:
            QTimer.singleShot(100, lambda: until(expression, callback, deadline))
        else:
            checks.append({"name": "Expected UI transition: " + expression, "result": False})
            finish()

    page.runJavaScript(expression, observed)


def opened():
    page.runJavaScript(f"document.querySelector('[data-hub-project=\"{project['id']}\"]').click()")
    QTimer.singleShot(1000, select)


def select():
    page.runJavaScript(f"document.querySelector('[data-hardware-id=host-{host_id}]').click()")
    QTimer.singleShot(200, start)


def start():
    record(
        "Selected device has a separated Deep scan action",
        "!!document.querySelector('.hub-selected-deep-scan') && !document.getElementById('hub-deep-scan')",
    )
    page.runJavaScript("document.querySelector('.hub-selected-deep-scan button').click()")
    until("!!document.querySelector('#hub-background-working [data-scan-id]')", working)


def working():
    record(
        "Real child job appears in Working",
        "!!document.querySelector('#hub-background-working [data-scan-id]') && document.querySelector('#hub-background-working .hub-scan-heading small').textContent === 'running'",
    )
    record("Duplicate run is disabled", "document.querySelector('.hub-selected-deep-scan button').disabled")
    until(
        "!document.querySelector('#hub-background-working [data-scan-id]') && !!document.querySelector('#hub-background-history [data-scan-id]')",
        completed,
    )


def completed():
    checks.append(
        {
            "name": "One project-bound tracked command was used",
            "result": len(requests) == 1 and requests[0].job_id > 0 and requests[0].network_targets == ("192.0.2.10",),
        }
    )
    record(
        "Completed scan leaves Working for History",
        "!document.querySelector('#hub-background-working [data-scan-id]') && !!document.querySelector('#hub-background-history [data-scan-id]')",
    )
    page.runJavaScript(
        "(() => {const h=document.getElementById('hub-background-history'); if(!h.open) h.querySelector('summary').click(); const d=document.querySelector('.hub-scan-card>details'); if(!d.open) d.querySelector('summary').click();})()"
    )
    QTimer.singleShot(200, results)


def results():
    record(
        "Services and uncertain role hypotheses are visible",
        "document.querySelector('.hub-scan-card').textContent.includes('8080/tcp') && document.querySelector('.hub-scan-card').textContent.includes('Role hypotheses') && document.querySelector('.hub-scan-card').textContent.includes('server · 60 · medium')",
    )
    record(
        "Candidate and independently reproduced labels stay distinct",
        "document.querySelector('.hub-scan-card').textContent.includes('Candidate · Synthetic assessment candidate') && document.querySelector('.hub-scan-card').textContent.includes('Reproduced · Synthetic independent reproduction')",
    )
    window.view.grab().save(str(ARTIFACTS / "scan-results.png"))
    page.runJavaScript("document.querySelector('.hub-scan-heading>a').click()")
    QTimer.singleShot(1000, editor)


def editor():
    documents = page.document_windows
    checks.append(
        {
            "name": "Saved evidence opens in an independent native editor",
            "result": len(documents) == 1 and documents[0].view.url().path().endswith("/editor"),
        }
    )
    if documents:
        record(
            "Editor opens the actual saved profile bytes",
            "document.querySelector('.editor-text').value.includes('Synthetic assessment candidate') && document.querySelector('.editor-text').value.includes('source_identity')",
            documents[0].view.page(),
        )
        record(
            "Opening scan evidence does not open Files",
            "getComputedStyle(document.querySelector('.window')).display === 'none'",
            documents[0].view.page(),
        )
    record("Overview stays in place", "!!document.querySelector('.hub-overview .hardware-canvas')")
    checks.append(
        {
            "name": "Packaged scanner source was not changed by the UI fixture",
            "result": scanner_source()[1] == original_source,
        }
    )
    for run in (Path(project["folder"]) / "workspace-tool-output/deep-scans").iterdir():
        files = [p for p in run.rglob("*") if p.is_file()]
        checks.append(
            {
                "name": "Final fixture output fits retained budget",
                "result": len(files) <= 250 and sum(p.stat().st_size for p in files) <= 16 * 1024 * 1024,
            }
        )
    QTimer.singleShot(100, finish)


def finish():
    data = {
        "stack": "legacy" if legacy else "asgi",
        "checks": checks,
        "js_errors": errors,
        "boundary": "Synthetic writer child and fixture lease; no connected-network scans or privileged egress proof.",
    }
    (ARTIFACTS / ("checks-" + data["stack"] + ".json")).write_text(json.dumps(data, indent=2))
    print(json.dumps(data))
    app.exit(0 if checks and all(c["result"] is True for c in checks) and not errors else 1)


page.loadFinished.connect(lambda ok: QTimer.singleShot(1200, opened) if ok else app.exit(2))
QTimer.singleShot(25000, lambda: app.exit(3))
code = app.exec()
for child in list(page.document_windows):
    child.close()
    if not sip.isdeleted(child):
        sip.delete(child)
window.close()
sip.delete(window)
lease_patch.stop()
server.__exit__(None, None, None)
active = logic.activeProject
logic.projectManager.closeProject(active)
active.database.dispose()
fixture.cleanup()
sys.exit(code)
