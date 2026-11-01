"""Native window actions stay narrow and require the trusted workspace origin."""

import unittest
from unittest.mock import Mock

try:
    from PyQt6.QtCore import QObject, Qt, QUrl
    from app.desktop import is_workspace_url
    from app.desktop_chrome import WindowChrome
    from app.desktop_documents import is_document_path
except ImportError:
    QObject = object
    WindowChrome = None


class FakeWindow(QObject):
    def __init__(self):
        super().__init__()
        self.maximum = False
        self.showMinimized = Mock()
        self.close = Mock()
        self.handle = Mock()

    def isMaximized(self):
        return self.maximum

    def showMaximized(self):
        self.maximum = True

    def showNormal(self):
        self.maximum = False

    def windowHandle(self):
        return self.handle


@unittest.skipIf(WindowChrome is None, "Optional desktop dependencies are unavailable")
class DesktopChromeTest(unittest.TestCase):
    def test_window_controls_do_nothing_outside_the_workspace(self):
        window = FakeWindow()
        chrome = WindowChrome(window, lambda: False)
        chrome.minimize()
        chrome.toggleMaximize()
        chrome.closeWindow()
        chrome.startMove()
        chrome.resizeEdge("bottom-right")
        window.showMinimized.assert_not_called()
        window.close.assert_not_called()
        self.assertFalse(window.maximum)
        self.assertEqual([], window.handle.mock_calls)

    def test_native_controls_and_corner_resize_are_forwarded(self):
        window = FakeWindow()
        chrome = WindowChrome(window, lambda: True)
        chrome.minimize()
        window.showMinimized.assert_called_once()
        chrome.toggleMaximize()
        self.assertTrue(chrome.maximized)
        chrome.resizeEdge("bottom-right")
        window.handle.startSystemResize.assert_not_called()
        chrome.toggleMaximize()
        self.assertFalse(chrome.maximized)
        chrome.startMove()
        window.handle.startSystemMove.assert_called_once()
        chrome.resizeEdge("bottom-right")
        window.handle.startSystemResize.assert_called_once_with(Qt.Edge.BottomEdge | Qt.Edge.RightEdge)
        chrome.closeWindow()
        window.close.assert_called_once()

    def test_invalid_resize_combinations_are_ignored(self):
        window = FakeWindow()
        chrome = WindowChrome(window, lambda: True)
        for edge in ("", "other", "left-right", "top-bottom", "top-top", "top-left-right"):
            chrome.resizeEdge(edge)
        window.handle.startSystemResize.assert_not_called()

    def test_only_the_configured_loopback_origin_is_a_workspace(self):
        self.assertTrue(is_workspace_url(QUrl("http://127.0.0.1:5000/?part=activity")))
        for url in (
            "https://127.0.0.1:5000/",
            "http://127.0.0.1:5001/",
            "http://example.com:5000/",
            "file:///tmp/local.html",
        ):
            self.assertFalse(is_workspace_url(QUrl(url)))

    def test_native_document_popups_only_match_document_routes(self):
        self.assertTrue(is_document_path("/api/hub/projects/project_1/editor"))
        self.assertTrue(is_document_path("/api/hub/projects/project_1/filesystem"))
        for path in (
            "/",
            "/api/hub/projects/a/../../editor",
            "/api/hub/projects/a/file",
            "/api/hub/projects/a/editor/other",
        ):
            self.assertFalse(is_document_path(path))
