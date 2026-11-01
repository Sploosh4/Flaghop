"""Render the portable HTML review with an off-record browser profile."""
import json
from pathlib import Path
from PyQt6.QtCore import QTimer, QUrl
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile
from PyQt6.QtWebEngineWidgets import QWebEngineView

root = Path(__file__).parent
app = QApplication(['flaghop-artwork-review'])
view = QWebEngineView()
profile = QWebEngineProfile(app)
errors = []

class Page(QWebEnginePage):
    def javaScriptConsoleMessage(self, level, message, line, source):
        if level == self.JavaScriptConsoleMessageLevel.ErrorMessageLevel:
            errors.append(message)

page = Page(profile, view)
view.setPage(page)
view.resize(1440, 1120)
view.show()

def finish():
    page.runJavaScript('JSON.stringify({images:[...document.images].map(i=>({src:i.getAttribute("src"),loaded:i.complete&&i.naturalWidth>0})),overflow:document.documentElement.scrollWidth>innerWidth})', checked)

def checked(value):
    result = json.loads(value)
    result['javascript_errors'] = errors
    view.grab().save(str(root / 'review.png'))
    (root / 'review-browser-checks.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result))
    app.quit()

page.loadFinished.connect(lambda ok: QTimer.singleShot(650, finish))
page.load(QUrl.fromLocalFile(str(root / 'review.html')))
QTimer.singleShot(15000, app.quit)
app.exec()
