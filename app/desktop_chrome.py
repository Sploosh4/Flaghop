"""Narrow native-window controls for the local workspace title bar."""

import json

from PyQt6.QtCore import QFile, QIODevice, QObject, Qt, pyqtProperty, pyqtSignal, pyqtSlot
from PyQt6.QtWebChannel import QWebChannel
from PyQt6.QtWebEngineCore import QWebEngineScript


class WindowChrome(QObject):
    maximizedChanged = pyqtSignal(bool)

    def __init__(self, window, trusted):
        super().__init__(window)
        self.window = window
        self.trusted = trusted

    @pyqtProperty(bool, notify=maximizedChanged)
    def maximized(self):
        return self.window.isMaximized()

    @pyqtSlot()
    def minimize(self):
        if self.trusted():
            self.window.showMinimized()

    @pyqtSlot()
    def toggleMaximize(self):
        if self.trusted():
            if self.window.isMaximized():
                self.window.showNormal()
            else:
                self.window.showMaximized()

    @pyqtSlot()
    def closeWindow(self):
        if self.trusted():
            self.window.close()

    @pyqtSlot()
    def startMove(self):
        if self.trusted() and self.window.windowHandle():
            self.window.windowHandle().startSystemMove()

    @pyqtSlot(str)
    def resizeEdge(self, edge):
        if not self.trusted() or self.window.isMaximized() or not self.window.windowHandle():
            return
        parts = str(edge).split("-")
        mapping = {
            "top": Qt.Edge.TopEdge,
            "bottom": Qt.Edge.BottomEdge,
            "left": Qt.Edge.LeftEdge,
            "right": Qt.Edge.RightEdge,
        }
        if not parts or any(part not in mapping for part in parts):
            return
        if (
            len(set(parts)) != len(parts)
            or len(parts) > 2
            or {"left", "right"} <= set(parts)
            or {"top", "bottom"} <= set(parts)
        ):
            return
        edges = mapping[parts[0]]
        for part in parts[1:]:
            edges |= mapping[part]
        self.window.windowHandle().startSystemResize(edges)


def install_window_chrome(page, window, origin, trusted):
    channel = QWebChannel(page)
    chrome = WindowChrome(window, trusted)
    channel.registerObject("windowChrome", chrome)
    page.setWebChannel(channel)
    library = QFile(":/qtwebchannel/qwebchannel.js")
    if not library.open(QIODevice.OpenModeFlag.ReadOnly):
        raise RuntimeError("Qt WebChannel's bundled JavaScript is unavailable")
    source = bytes(library.readAll()).decode("utf-8")
    library.close()
    bootstrap = """
(() => {
    if (window.top !== window || location.origin !== EXPECTED_ORIGIN) return;
    new QWebChannel(qt.webChannelTransport, channel => {
        const native = channel.objects.windowChrome;
        const changed = () => window.dispatchEvent(new Event('legion-desktop-changed'));
        window.legionDesktop = {
            maximized: native.maximized,
            minimize: () => native.minimize(),
            toggleMaximize: () => native.toggleMaximize(),
            close: () => native.closeWindow(),
            startMove: () => native.startMove(),
            resizeEdge: edge => native.resizeEdge(edge),
        };
        native.maximizedChanged.connect(value => {window.legionDesktop.maximized = value; changed();});
        changed();
    });
})();
""".replace("EXPECTED_ORIGIN", json.dumps(origin))
    script = QWebEngineScript()
    script.setName("FlagHop local window controls")
    script.setWorldId(QWebEngineScript.ScriptWorldId.MainWorld)
    script.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentReady)
    script.setRunsOnSubFrames(False)
    script.setSourceCode(source + "\n" + bootstrap)
    page.scripts().insert(script)
    return chrome, channel
