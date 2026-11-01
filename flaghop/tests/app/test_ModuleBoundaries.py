"""Prevent circular frontend imports and scheduler dependencies on the HTTP application."""

import ast
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


class ModuleBoundariesTest(unittest.TestCase):
    def test_frontend_imports_resolve_and_have_no_cycles(self):
        root = ROOT / "app/web/static/js"
        files = list(root.rglob("*.js"))
        modules = {p.resolve(): p.read_text() for p in files}
        graph = {}
        for path, source in modules.items():
            dependencies = set()
            for names, ref in re.findall(r'import\s*\{([^}]+)\}\s*from\s*["\']([^"\']+)["\']', source):
                target = (path.parent / ref).resolve()
                self.assertIn(target, modules, f"Missing module imported by {path}: {ref}")
                exports = set(re.findall(r"export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)", modules[target]))
                for name in names.split(","):
                    self.assertIn(name.strip(), exports, f"Missing export from {target}")
                dependencies.add(target)
            graph[path] = dependencies
        visited = set()
        active = []

        def visit(path):
            self.assertNotIn(path, active, f"Circular frontend imports: {active + [path]}")
            if path in visited:
                return
            active.append(path)
            for dependency in graph[path]:
                visit(dependency)
            active.pop()
            visited.add(path)

        for path in graph:
            visit(path)

    def test_scheduler_context_does_not_import_web_or_desktop_layers(self):
        for path in (ROOT / "app/scheduler/context").glob("*.py"):
            for node in ast.walk(ast.parse(path.read_text())):
                modules = (
                    [node.module or ""]
                    if isinstance(node, ast.ImportFrom)
                    else ([alias.name for alias in node.names] if isinstance(node, ast.Import) else [])
                )
                for module in modules:
                    self.assertFalse(module.startswith(("app.web", "app.desktop", "PyQt6")), f"{path}: {module}")
