"""Contract gates must reject boundary regressions, not just pass today's tree."""

from dataclasses import replace
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from pydantic import ValidationError
from app.contracts.actions.planning import ActionSpec
from app.contracts.actions.scanner import DeepScanRequest
from app.scheduler.registry import ActionRegistry
from app.validation.contract_check import check_contracts

ROOT = Path(__file__).resolve().parents[2]


class ContractBoundaryTest(unittest.TestCase):
    def fixture(self, root):
        folder = root / "app/contracts"
        folder.mkdir(parents=True)
        (folder / "__init__.py").write_text('"""Contracts."""\n')
        (folder / "base.py").write_text((ROOT / "app/contracts/base.py").read_text())
        for category in ("actions", "observations", "artifacts"):
            (folder / category).mkdir()
            (folder / category / "__init__.py").write_text('"""Definitions."""\n')
        return folder

    def test_actual_tree_has_one_owner_and_valid_types_for_every_contract(self):
        self.assertEqual([], check_contracts(ROOT))

    def test_valid_definition_and_literal_catalogue_pass(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            folder = self.fixture(root)
            (folder / "actions/example.py").write_text(
                "from app.contracts.base import ActionModel, ActionData, ActionConstants\n"
                "from dataclasses import dataclass\n"
                "class Example(ActionModel):\n    target: str\n"
                "@dataclass\nclass Result(ActionData):\n    reason: str\n"
                'class Catalog(ActionConstants):\n    IDS = ("example",)\n'
            )
            self.assertEqual([], check_contracts(root, load_models=False))

    def test_folder_pollution_runtime_dependencies_and_wrong_classes_are_rejected(self):
        cases = [
            (
                "actions/worker.py",
                "from app.contracts.base import ActionModel\nclass Worker(ActionModel):\n    def execute(self):\n        return True\n",
                "C006",
            ),
            ("actions/README.md", "instructions", "C002"),
            (
                "actions/untyped_refs.py",
                "from app.contracts.base import ActionModel\nclass References(ActionModel):\n    artifact_refs: list[str]\n",
                "C013",
            ),
            ("actions/worker.py", "import subprocess\n", "C005"),
            ("actions/worker.py", "from app.services.workspace import WorkspaceSession\n", "C005"),
            ("actions/worker.py", "from pathlib import Path\n", "C005"),
            ("actions/worker.py", "class Worker:\n    pass\n", "C009"),
            (
                "actions/example.py",
                "from app.contracts.base import ArtifactModel\nclass Wrong(ArtifactModel):\n    ref: str\n",
                "C009",
            ),
            (
                "actions/example.py",
                "from app.contracts.base import ActionData\nclass Wrong(ActionData):\n    ref: str\n",
                "C010",
            ),
            (
                "actions/example.py",
                "from app.contracts.base import ActionModel\nclass Wrong(ActionModel):\n    name = 'untyped'\n",
                "C010",
            ),
            (
                "actions/example.py",
                "from app.contracts.base import ActionModel\nclass Wrong(ActionModel):\n    def launch(self):\n        return open('file')\n",
                "C006",
            ),
            (
                "actions/example.py",
                "from app.contracts.base import ActionConstants\nclass Wrong(ActionConstants):\n    def execute(self):\n        pass\n",
                "C010",
            ),
        ]
        for relative, source, rule in cases:
            with self.subTest(relative=relative, source=source), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                folder = self.fixture(root)
                (folder / relative).write_text(source)
                errors = check_contracts(root, load_models=False)
                self.assertTrue(any(rule in message for message in errors), errors)

    def test_duplicate_misplaced_and_aliased_contracts_are_rejected(self):
        sources = [
            "from app.contracts.actions.planning import ActionSpec as Spec\nclass Derived(Spec):\n    pass\n",
            "from dataclasses import dataclass\n@dataclass\nclass ToolAction:\n    label: str\n",
            "from app.contracts.base import ActionModel as Data\nclass InnocentName(Data):\n    target: str\n",
            "class Existing:\n    pass\n",
        ]
        for source in sources:
            with self.subTest(source=source), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                folder = self.fixture(root)
                (folder / "actions/existing.py").write_text(
                    "from app.contracts.base import ActionModel\nclass Existing(ActionModel):\n    value: str\n"
                )
                (root / "app/misplaced.py").write_text(source)
                (folder / "actions/planning.py").write_text(
                    "from app.contracts.base import ActionModel\nclass ActionSpec(ActionModel):\n    value: str\n"
                )
                self.assertTrue(any("C007" in error for error in check_contracts(root, load_models=False)))

    def test_duplicate_canonical_definitions_and_import_cycles_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            folder = self.fixture(root)
            source = (
                "from app.contracts.base import ObservationModel\nclass Duplicate(ObservationModel):\n    value: str\n"
            )
            (folder / "observations/a.py").write_text(source + "from app.contracts.observations.b import Duplicate\n")
            (folder / "observations/b.py").write_text(source + "from app.contracts.observations.a import Duplicate\n")
            errors = check_contracts(root, load_models=False)
            self.assertTrue(any("C011" in error for error in errors), errors)
            self.assertTrue(any("C012" in error for error in errors), errors)

    def test_retired_definition_modules_and_imports_cannot_be_reintroduced(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture(root)
            (root / "app/scanning").mkdir()
            (root / "app/scanning/models.py").write_text("# A compatibility shim is still a retired owner.\n")
            (root / "app/consumer.py").write_text("from app.scanning.models import TaskFacts\n")
            errors = check_contracts(root, load_models=False)
            self.assertEqual(2, sum("C014" in error for error in errors), errors)

    def test_generic_named_records_cannot_hide_in_tool_runtime_modules(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture(root)
            (root / "app/scheduler").mkdir()
            (root / "app/scheduler/generic.py").write_text(
                "from dataclasses import dataclass\n@dataclass\nclass Generic:\n    target: str\n"
            )
            (root / "app/processes").mkdir()
            (root / "app/processes/models.py").write_text(
                "from dataclasses import dataclass\n@dataclass\nclass ExecutionState:\n    proc: object\n"
            )
            errors = check_contracts(root, load_models=False)
            self.assertEqual(1, sum("C015" in error for error in errors), errors)
            self.assertTrue(any("generic.py" in error for error in errors), errors)

    def test_all_contracts_import_without_http_database_desktop_or_runtime(self):
        code = """
import importlib, pkgutil, sys
for module in ('fastapi', 'sqlalchemy', 'PyQt6', 'app.web', 'app.scheduler', 'app.services', 'app.processes'):
    sys.modules[module] = None
import app.contracts
for module in pkgutil.walk_packages(app.contracts.__path__, app.contracts.__name__ + '.'):
    importlib.import_module(module.name)
print('pure contracts')
"""
        result = subprocess.run(
            [sys.executable, "-B", "-c", code], cwd=ROOT, capture_output=True, text=True, timeout=15
        )
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)


class ActionDefinitionTest(unittest.TestCase):
    def action(self):
        return ActionSpec("example", "example", "Example", "Example check", "example [IP]")

    def test_invalid_definitions_and_duplicate_registration_fail_before_execution(self):
        action = self.action()
        for updates in (
            {"action_id": ""},
            {"label": " "},
            {"default_timeout": 0},
            {"default_timeout": True},
            {"parameter_schema": {"required": ["missing"]}},
        ):
            with self.subTest(updates=updates), self.assertRaises(ValueError):
                replace(action, **updates)
        with self.assertRaisesRegex(ValueError, "unique"):
            ActionRegistry([action, action])
        with self.assertRaises(TypeError):
            ActionRegistry([{"action_id": "example"}])

    def test_scanner_input_preserves_strict_target_and_revision_boundary(self):
        payload = {"host_id": 1, "target_ip": "192.0.2.10", "expected_revision": 1}
        self.assertEqual("192.0.2.10", DeepScanRequest.model_validate(payload).target_ip)
        for update in (
            {"command": "arbitrary"},
            {"timeout": True},
            {"target_ip": "example.test"},
            {"expected_revision": -1},
        ):
            with self.subTest(update=update), self.assertRaises(ValidationError):
                DeepScanRequest.model_validate({**payload, **update})
