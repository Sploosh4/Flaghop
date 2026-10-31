"""Independent native windows for local project Files and Text Editor pages."""

import re

from PyQt6.QtCore import QEvent, QUrl, Qt
from PyQt6.QtGui import QDesktopServices
from PyQt6.QtWebEngineCore import QWebEnginePage
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QMainWindow

from app.desktop_chrome import install_window_chrome


def is_document_path(path):
    return bool(re.fullmatch(r"/api/hub/projects/[A-Za-z0-9_-]+/(editor|filesystem)", path))


class DocumentWindow(QMainWindow):
    def __init__(self, page, url, trusted):
        super().__init__()
        self.setWindowFlag(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_DeleteOnClose)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setMinimumSize(480, 340)
        self.resize(920, 720) if url.path().endswith("/editor") else self.resize(1100, 760)
        self.setStyleSheet("QMainWindow {background:transparent}")
        self.view = QWebEngineView(self)
        page.setParent(self.view)
        page.setBackgroundColor(Qt.GlobalColor.transparent)
        self.view.setPage(page)
        self.setCentralWidget(self.view)
        self.view.titleChanged.connect(self.setWindowTitle)
        page.windowCloseRequested.connect(self.close)
        origin = url.adjusted(QUrl.UrlFormattingOption.RemovePath | QUrl.UrlFormattingOption.RemoveQuery)
        self.window_chrome, self.window_channel = install_window_chrome(
            page, self, origin.toString().rstrip("/"), trusted
        )

    def changeEvent(self, event):
        super().changeEvent(event)
        if event.type() == QEvent.Type.WindowStateChange and hasattr(self, "window_chrome"):
            self.window_chrome.maximizedChanged.emit(self.isMaximized())


class DocumentPopupPage(QWebEnginePage):
    def __init__(self, profile, parent, origin_match, windows):
        super().__init__(profile, parent)
        self.origin_match, self.windows = origin_match, windows
        self.document_window = None

    def acceptNavigationRequest(self, url, navigation_type, is_main_frame):
        if not is_main_frame:
            return self.origin_match(url)
        if url.toString() == "about:blank":
            return True
        if self.origin_match(url) and is_document_path(url.path()):
            if self.document_window is None:
                self.document_window = DocumentWindow(
                    self, url, lambda: self.origin_match(self.url()) and is_document_path(self.url().path())
                )
                self.windows.append(self.document_window)
                window = self.document_window
                window.destroyed.connect(lambda: self.windows.remove(window) if window in self.windows else None)
                window.show()
            return True
        if url.scheme() in {"http", "https", "mailto"}:
            QDesktopServices.openUrl(url)
        if self.document_window is None:
            self.deleteLater()
        return False

    def createWindow(self, _window_type):
        return DocumentPopupPage(self.profile(), self, self.origin_match, self.windows)
