"""Check contract ownership, pure dependencies, approved roots and resolved field types."""

import ast
from dataclasses import fields, is_dataclass
import importlib
from pathlib import Path
import re
from typing import get_type_hints

from pydantic import BaseModel

CATEGORIES = {"actions": "ActionModel", "observations": "ObservationModel", "artifacts": "ArtifactModel"}
RETIRED_MODULES = {
    "app.web.scheduler_schema",
    "app.scheduler.orchestration.models",
    "app.tooling_catalog",
    "app.scheduler.models",
    "app.scanning.models",
    "app.scanning.contracts",
    "app.api.background_contracts",
    "app.configuration.action_catalog",
    "app.services.network_models",
    "app.web.host_action_schema",
    "app.web.tool_schema",
    "app.web.scan_schema",
    "app.web.process_schema",
    "app.web.runtime_schema",
}
PURE_MODULES = {
    "shlex",
    "__future__",
    "dataclasses",
    "datetime",
    "enum",
    "ipaddress",
    "re",
    "typing",
    "collections.abc",
    "pydantic",
    "app.core.serialization",
    "app.core.contract_values",
    "app.core.action_values",
}
FORBIDDEN_CALLS = {
    "open",
    "exec",
    "eval",
    "compile",
    "__import__",
    "getattr",
    "setattr",
    "delattr",
    "read_text",
    "read_bytes",
    "write_text",
    "write_bytes",
    "mkdir",
    "unlink",
    "connect",
    "execute",
    "Popen",
    "system",
    "spawn",
    "start",
    "run",
    "send",
    "save",
    "commit",
}
RUNTIME_METHODS = {"execute", "run", "start", "stop", "cancel", "launch", "connect", "read", "write"}
RUNTIME_RECORDS = {
    "app.processes.models": {"ExecutionPorts", "ExecutionState"},
    "app.scheduler.context.ports": {"ContextPorts"},
    "app.scheduler.orchestration.target_run": {
        "SchedulerCallbacks",
        "RunBudget",
        "TargetRunState",
        "RoundState",
        "TargetRun",
    },
}
CONTRACT_WORDS = re.compile(
    r"Action|Observation|Artifact|Finding|RunnerExecution|TaskFacts|ScanSummary|DeepScan|ReaderAlert|PipetteSpec|ToolSpec|ToolAudit|Scheduler(?:Target|ExecutionTask|DecisionDisposition|RunOptions)|EngagementPolicy"
)


def _symbol(node):
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return f"{_symbol(node.value)}.{node.attr}"
    if isinstance(node, ast.Call):
        return _symbol(node.func)
    return ""


def _module(path, root):
    parts = path.relative_to(root).with_suffix("").parts
    return ".".join(parts[:-1] if parts[-1] == "__init__" else parts)


def _bindings(tree):
    """Resolve normal import spellings without importing the inspected code."""
    bindings = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and not node.level:
            for alias in node.names:
                bindings[alias.asname or alias.name] = f"{node.module}.{alias.name}"
        elif isinstance(node, ast.Import):
            for alias in node.names:
                # `import a.b` binds `a`, while `import a.b as c` binds `c`.
                bindings[alias.asname or alias.name.split(".")[0]] = (
                    alias.name if alias.asname else alias.name.split(".")[0]
                )
    return bindings


def _resolve(node, bindings, module=""):
    symbol = _symbol(node)
    head, separator, tail = symbol.partition(".")
    if head in bindings:
        return bindings[head] + (separator + tail if separator else "")
    return f"{module}.{symbol}" if module else symbol


def _dependencies(tree):
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            yield from (alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and not node.level:
            yield node.module
            yield from (f"{node.module}.{alias.name}" for alias in node.names)


def check_contracts(root, *, load_models=True):
    """Return actionable diagnostics. Fixture trees can request AST-only checking."""
    root = Path(root)
    directory = root / "app/contracts"
    errors, trees, owners = [], {}, {}

    def report(path, line, code, message):
        errors.append(f"{path.relative_to(root)}:{line}: {code} {message}")

    if not directory.is_dir():
        return ["app/contracts:1: C001 Missing contract folders; see docs/contract-authoring.md."]
    for category in CATEGORIES:
        if not (directory / category / "__init__.py").is_file():
            report(directory, 1, "C001", f"Missing {category}/__init__.py; restore the dedicated definition package.")

    for module_name in sorted(RETIRED_MODULES):
        old_path = root / (module_name.replace(".", "/") + ".py")
        if old_path.exists():
            report(
                old_path,
                1,
                "C014",
                "Retired definition module: keep one owner under app/contracts and update consumers directly.",
            )

    for path in sorted(directory.rglob("*")):
        relative = path.relative_to(directory)
        if "__pycache__" in relative.parts:
            continue
        if path.is_symlink():
            report(path, 1, "C002", "Linked contract files are not allowed; keep definitions in this package.")
            continue
        if path.is_dir():
            if len(relative.parts) != 1 or relative.name not in CATEGORIES:
                report(path, 1, "C002", "Only actions/, observations/ and artifacts/ are allowed here.")
            continue
        if path.suffix != ".py" or (len(relative.parts) == 1 and relative.name not in {"base.py", "__init__.py"}):
            report(
                path, 1, "C002", "Definitions only: put docs, tests, checkers and runtime code outside app/contracts."
            )
            continue
        try:
            tree = ast.parse(path.read_text(), filename=str(path))
        except SyntaxError as exc:
            report(path, exc.lineno or 1, "C003", f"Invalid Python: {exc.msg}.")
            continue
        trees[path] = tree
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                owners.setdefault(node.name, set()).add(path)
            elif not isinstance(
                node, (ast.Import, ast.ImportFrom, ast.Assign, ast.AnnAssign, ast.FunctionDef, ast.Expr)
            ):
                report(
                    path, node.lineno, "C004", "Only data definitions and pure conversions belong in contract modules."
                )
            elif isinstance(node, ast.Expr) and not isinstance(node.value, ast.Constant):
                report(path, node.lineno, "C004", "Module-level execution is not a contract definition.")
        bindings = _bindings(tree)
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                modules = [a.name for a in node.names] if isinstance(node, ast.Import) else [node.module or ""]
                for module in modules:
                    if isinstance(node, ast.ImportFrom) and node.level:
                        report(
                            path,
                            node.lineno,
                            "C005",
                            "Use absolute imports so ownership and dependencies can be checked.",
                        )
                    elif module not in PURE_MODULES and not module.startswith("app.contracts."):
                        report(
                            path,
                            node.lineno,
                            "C005",
                            f"Contract imports {module!r}; move IO/runtime logic to its service or adapter.",
                        )
            if isinstance(node, ast.Call) and _resolve(node.func, bindings).split(".")[-1] in FORBIDDEN_CALLS:
                report(
                    path,
                    node.lineno,
                    "C006",
                    f"{_symbol(node.func)}() is runtime work; contracts may only validate or convert data.",
                )
            if isinstance(node, ast.AsyncFunctionDef):
                report(path, node.lineno, "C006", "Async workers belong in adapters, not definition folders.")

    for name, paths in owners.items():
        if len(paths) > 1:
            for path in sorted(paths):
                report(
                    path,
                    1,
                    "C011",
                    f"{name} has multiple canonical definitions; reuse one class or give distinct concepts distinct names.",
                )

    module_paths = {_module(path, root): path for path in trees}
    graph = {}
    for path, tree in trees.items():
        module_name = _module(path, root)
        graph[module_name] = {dependency for dependency in _dependencies(tree) if dependency in module_paths}
    visited = set()

    def visit(module_name, active):
        if module_name in active:
            report(
                module_paths[module_name],
                1,
                "C012",
                f"Circular contracts: {' -> '.join((*active, module_name))}; extract the shared definition.",
            )
            return
        if module_name in visited:
            return
        for dependency in sorted(graph[module_name]):
            visit(dependency, (*active, module_name))
        visited.add(module_name)

    for module_name in sorted(graph):
        visit(module_name, ())

    definitions, aliases = {}, {}
    for path, tree in trees.items():
        module_name = _module(path, root)
        aliases[module_name] = _bindings(tree)
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                definitions[f"{module_name}.{node.name}"] = (path, node)

    def ancestors(name, active=()):
        if name in active or name not in definitions:
            return {name}
        path, node = definitions[name]
        module_name = _module(path, root)
        result = {name}
        for base in node.bases:
            resolved = _resolve(base, aliases[module_name], module_name)
            result.update(ancestors(resolved, (*active, name)))
        return result

    for name, (path, node) in definitions.items():
        relative = path.relative_to(directory)
        if len(relative.parts) != 2:
            continue
        category = relative.parts[0]
        allowed = {f"app.contracts.base.{CATEGORIES[category]}"}
        if category == "actions":
            allowed.update({"app.contracts.base.ActionData", "app.contracts.base.ActionConstants"})
        lineage = ancestors(name)
        if not allowed & lineage:
            report(
                path,
                node.lineno,
                "C009",
                f"{node.name} needs an approved {category} base; see docs/contract-authoring.md.",
            )
        if "app.contracts.base.ActionData" in lineage and not any(
            _resolve(d, aliases[_module(path, root)]) == "dataclasses.dataclass" for d in node.decorator_list
        ):
            report(path, node.lineno, "C010", f"{node.name}: ActionData requires @dataclass and typed fields.")
        if "app.contracts.base.ActionConstants" in lineage:
            if any(isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) for n in node.body):
                report(path, node.lineno, "C010", "ActionConstants may contain catalogue values only.")
        else:
            for member in node.body:
                if isinstance(member, ast.FunctionDef) and member.name in RUNTIME_METHODS:
                    report(
                        path,
                        member.lineno,
                        "C006",
                        f"{member.name}() belongs to an adapter; contract methods may only validate, convert or present data.",
                    )
                if isinstance(member, ast.Assign) and any(
                    isinstance(t, ast.Name) and t.id != "model_config" for t in member.targets
                ):
                    report(path, member.lineno, "C010", "Contract data fields need type annotations.")
                if (
                    isinstance(member, ast.AnnAssign)
                    and isinstance(member.target, ast.Name)
                    and member.target.id in {"artifact_refs", "linked_evidence_refs"}
                    and (
                        not any(
                            _resolve(part, aliases[_module(path, root)])
                            == "app.contracts.artifacts.references.ArtifactLocator"
                            for part in ast.walk(member.annotation)
                        )
                    )
                ):
                    report(
                        path,
                        member.lineno,
                        "C013",
                        "Structured evidence references must use ArtifactLocator from app.contracts.artifacts.references.",
                    )

    # New and relocated contracts must not acquire a second owner elsewhere.
    for path in sorted((root / "app").rglob("*.py")):
        if directory in path.parents:
            continue
        try:
            tree = ast.parse(path.read_text())
        except SyntaxError:
            continue
        imports = _bindings(tree)
        for node in ast.walk(tree):
            modules = (
                [node.module]
                if isinstance(node, ast.ImportFrom)
                else ([a.name for a in node.names] if isinstance(node, ast.Import) else [])
            )
            if any(module in RETIRED_MODULES for module in modules):
                report(
                    path,
                    node.lineno,
                    "C014",
                    "Import the owning definition from app/contracts; do not restore a compatibility copy.",
                )
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
                continue
            bases = {_resolve(base, imports) for base in node.bases}
            annotations = {
                n.target.id for n in node.body if isinstance(n, ast.AnnAssign) and isinstance(n.target, ast.Name)
            }
            domain_roots = {
                f"app.contracts.base.{name}"
                for name in ("ActionModel", "ActionData", "ObservationModel", "ArtifactModel")
            }
            lineage = set().union(*(ancestors(base) for base in bases))
            domain_base = bool(domain_roots & lineage)
            data_class = (
                domain_base
                or bool(bases & {"pydantic.BaseModel", "typing.TypedDict", "typing_extensions.TypedDict"})
                or any(_resolve(d, imports) == "dataclasses.dataclass" for d in node.decorator_list)
            )
            module_name = _module(path, root)
            tool_domain = module_name.startswith(
                ("app.scheduler.", "app.scanning.", "app.processes.")
            ) or module_name in {"app.pipettes", "app.tooling"}
            if data_class and tool_domain and node.name not in RUNTIME_RECORDS.get(module_name, set()):
                report(
                    path,
                    node.lineno,
                    "C015",
                    "Tool-domain data belongs in app/contracts even with a generic class name. Keep only documented runtime handles/state here.",
                )
            misplaced = (
                domain_base
                or node.name in owners
                or bool(
                    data_class and (CONTRACT_WORDS.search(node.name) or annotations & {"action_id", "artifact_ref"})
                )
            )
            if misplaced:
                destinations = ", ".join(str(p.relative_to(root)) for p in sorted(owners.get(node.name, [])))
                report(
                    path,
                    node.lineno,
                    "C007",
                    f"{node.name} is a domain contract; define it in {destinations or 'app/contracts/<category>/'} and import it here.",
                )

    if errors or not load_models:
        return errors

    from app.contracts.base import ActionData, ActionConstants, ActionModel, ArtifactModel, ObservationModel

    roots = {
        "actions": (ActionModel, ActionData, ActionConstants),
        "observations": (ObservationModel,),
        "artifacts": (ArtifactModel,),
    }
    for path, tree in trees.items():
        relative = path.relative_to(directory)
        if len(relative.parts) != 2 or path.name == "__init__.py":
            continue
        category = relative.parts[0]
        try:
            module = importlib.import_module(_module(path, root))
        except Exception as exc:
            report(path, 1, "C008", f"Cannot load contract module: {type(exc).__name__}: {exc}.")
            continue
        for node in tree.body:
            if not isinstance(node, ast.ClassDef):
                continue
            cls = vars(module)[node.name]
            if not issubclass(cls, roots[category]):
                report(
                    path,
                    node.lineno,
                    "C009",
                    f"{node.name} must derive from {', '.join(c.__name__ for c in roots[category])} or an existing contract in this category.",
                )
                continue
            try:
                get_type_hints(cls)
                if issubclass(cls, BaseModel):
                    cls.model_json_schema()
                elif issubclass(cls, ActionConstants):
                    if any(isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) for n in node.body):
                        raise TypeError("ActionConstants may contain catalogue values only")
                elif not is_dataclass(cls) or not fields(cls):
                    raise TypeError("ActionData requires a dataclass with typed fields")
                elif any(field.type is None for field in fields(cls)):
                    raise TypeError("Every field needs an annotation")
            except Exception as exc:
                report(
                    path,
                    node.lineno,
                    "C010",
                    f"{node.name} has an invalid data definition: {exc}; see docs/contract-authoring.md.",
                )
    return errors
