"""Native Legion window hosting the same local web workspace and feature set.

Uses the optional requirements-desktop.txt dependencies. No browser tab or separate
browser installation is needed; the existing localhost service handles tool jobs.
"""

import hashlib
import os
from pathlib import Path
import sys

from app.local_server import local_backend

from PyQt6.QtCore import QUrl, Qt
from PyQt6.QtGui import QAction, QDesktopServices, QIcon, QKeySequence
from PyQt6.QtNetwork import QLocalServer, QLocalSocket
from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QApplication, QFileDialog, QMainWindow, QMessageBox

ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:5000/"


def is_workspace_url(url):
    return url.scheme() == "http" and url.host() == "127.0.0.1" and url.port() == 5000


class ExternalPopupPage(QWebEnginePage):
    def acceptNavigationRequest(self, url, _navigation_type, _is_main_frame):
        if url.toString() == "about:blank":
            return True
        if url.scheme() in {"https", "http", "mailto"}:
            QDesktopServices.openUrl(url)
        self.deleteLater()
        return False


class WorkspacePage(QWebEnginePage):
    def acceptNavigationRequest(self, url, navigation_type, is_main_frame):
        if not is_main_frame or is_workspace_url(url) or url.toString() == "about:blank":
            return True
        if navigation_type == self.NavigationType.NavigationTypeLinkClicked and url.scheme() in {
            "https",
            "http",
            "mailto",
        }:
            QDesktopServices.openUrl(url)
        return False

    def createWindow(self, _window_type):
        # Tool/help links open externally; never replace the investigation window.
        return ExternalPopupPage(self.profile(), self)


class LegionWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Legion")
        self.setWindowIcon(QIcon(str(ROOT / "images/icons/Legion-N_128x128.svg")))
        self.resize(1520, 960)
        self.setMinimumSize(760, 540)
        self.setStyleSheet("QMainWindow { background: #050505; }")
        profile_dir = ROOT / ".desktop-profile"
        profile_dir.mkdir(exist_ok=True)
        self.profile = QWebEngineProfile("Legion", self)
        self.profile.setPersistentStoragePath(str(profile_dir / "storage"))
        self.profile.setCachePath(str(profile_dir / "cache"))
        self.profile.setHttpCacheMaximumSize(32 * 1024 * 1024)
        self.profile.downloadRequested.connect(self.save_download)
        self.view = QWebEngineView(self)
        self.page = WorkspacePage(self.profile, self.view)
        self.page.setBackgroundColor(Qt.GlobalColor.black)
        self.view.setPage(self.page)
        self.setCentralWidget(self.view)
        self.view.loadFinished.connect(self.loaded)
        for label, shortcut, callback in (
            ("Reload", "Ctrl+R", self.view.reload),
            ("Zoom in", "Ctrl++", lambda: self.zoom(0.1)),
            ("Zoom out", "Ctrl+-", lambda: self.zoom(-0.1)),
            ("Reset zoom", "Ctrl+0", lambda: self.view.setZoomFactor(1)),
            ("Close window", "Ctrl+W", self.close),
        ):
            action = QAction(label, self)
            action.setShortcut(QKeySequence(shortcut))
            action.triggered.connect(callback)
            self.addAction(action)
        self.view.setUrl(QUrl(URL))

    def zoom(self, increment):
        self.view.setZoomFactor(max(0.65, min(1.75, self.view.zoomFactor() + increment)))

    def loaded(self, success):
        if success:
            print("Legion desktop workspace loaded", flush=True)
        else:
            QMessageBox.warning(
                self,
                "Legion",
                "The local workspace could not load. Relaunch Legion from Applications to restart its service.",
            )

    def save_download(self, request):
        destination = ROOT / ".state/downloads"
        destination.mkdir(parents=True, exist_ok=True)
        filename, _filter = QFileDialog.getSaveFileName(
            self, "Save Legion export", str(destination / request.downloadFileName())
        )
        if filename:
            request.setDownloadDirectory(str(Path(filename).parent))
            request.setDownloadFileName(Path(filename).name)
            request.accept()
        else:
            request.cancel()


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Legion")
    app.setDesktopFileName("legion")
    identity = hashlib.sha256(str(ROOT).encode()).hexdigest()[:16]
    socket_name = f"legion-desktop-{os.getuid()}-{identity}"
    client = QLocalSocket()
    client.connectToServer(socket_name)
    if client.waitForConnected(250):
        client.write(b"activate")
        client.waitForBytesWritten(250)
        return 0
    server = QLocalServer(app)
    QLocalServer.removeServer(socket_name)
    if not server.listen(socket_name):
        raise RuntimeError("Cannot create the Legion desktop activation socket")
    with local_backend():
        window = LegionWindow()

        def activate():
            connection = server.nextPendingConnection()
            if connection:
                connection.close()
                connection.deleteLater()
            window.showNormal()
            window.raise_()
            window.activateWindow()

        server.newConnection.connect(activate)
        window.show()
        return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
