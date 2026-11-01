import importlib
import importlib.util
import unittest


class LegacyImportSmokeTest(unittest.TestCase):
    def test_sqlalchemy_imports(self):
        importlib.import_module("sqlalchemy.orm.scoping")

    def test_web_runtime_imports(self):
        importlib.import_module("app.web.runtime")
        importlib.import_module("app.web.bootstrap")

    def test_pyqt6_imports(self):
        importlib.import_module("PyQt6.QtCore")
        importlib.import_module("PyQt6.QtGui")
        importlib.import_module("PyQt6.QtWidgets")


if __name__ == "__main__":
    unittest.main()
