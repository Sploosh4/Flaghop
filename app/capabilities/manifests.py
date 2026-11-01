"""Validate declarative manifests without importing or running their contents."""

import json
from pathlib import Path

from app.contracts.actions.capabilities import CapabilityManifest

# No production definitions have been approved. Changing this source-owned
# baseline requires recording Joshua's explicit decision; manifests and callers
# have no API to amend it. It is not a cryptographic proof of approval.
_APPROVED_BASELINE = ()


def load_manifests(root, registry):
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("manifest root must be a directory, not a symlink")
    manifests = []
    for folder in sorted(root.iterdir()):
        if folder.is_symlink():
            raise ValueError(f"symlink in manifest root: {folder.name}")
        if not folder.is_dir():
            raise ValueError(f"expected a module folder: {folder.name}")
        path = folder / "manifest.json"
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"missing regular manifest: {folder.name}")
        if path.stat().st_size > 1024 * 1024:
            raise ValueError(f"manifest too large: {folder.name}")
        try:
            manifest = CapabilityManifest.model_validate(json.loads(path.read_text(encoding="utf-8")))
        except (ValueError, OSError) as exc:
            raise ValueError(f"invalid manifest {folder.name}: {exc}") from exc
        manifests.append(manifest)
    return validate_manifests(manifests, registry)


def validate_manifests(manifests, registry, pipettes=()):
    groups = {"integrations": {}, "modules": {}, "categories": {}}
    for manifest in manifests:
        for kind, entries in groups.items():
            for item in getattr(manifest, kind):
                if item.id in entries:
                    raise ValueError(f"duplicate {kind} id: {item.id}")
                entries[item.id] = item
    integrations, modules, categories = (groups[k] for k in ("integrations", "modules", "categories"))
    actions = {a.action_id: a for a in registry.all()}
    for pipette in pipettes:
        key = "pipette:" + pipette.tool_id
        if key in actions:
            raise ValueError(f"duplicate action id: {key}")
        actions[key] = pipette
    for module in modules.values():
        for kind, refs, known in (
            ("integration", module.integration_ids, integrations),
            ("action", module.action_ids, actions),
            ("module", module.depends_on, modules),
        ):
            if len(refs) != len(set(refs)):
                raise ValueError(f"duplicate {kind} reference in module {module.id}")
            for ref in refs:
                if ref not in known:
                    raise ValueError(f"missing {kind} {ref} referenced by module {module.id}")
        for action_id in module.action_ids:
            if actions[action_id].tool_id not in module.integration_ids:
                raise ValueError(f"module {module.id} lacks integration for action {action_id}")
    visited, visiting = set(), set()

    def visit(module_id):
        if module_id in visiting:
            raise ValueError(f"cyclic module dependency at {module_id}")
        if module_id in visited:
            return
        visiting.add(module_id)
        for dependency in modules[module_id].depends_on:
            visit(dependency)
        visiting.remove(module_id)
        visited.add(module_id)

    for module_id in modules:
        visit(module_id)
    report = []
    for category in categories.values():
        for kind, refs, known in (("action", category.action_ids, actions), ("module", category.module_ids, modules)):
            if len(refs) != len(set(refs)):
                raise ValueError(f"duplicate {kind} reference in category {category.id}")
            for ref in refs:
                if ref not in known:
                    raise ValueError(f"missing {kind} {ref} referenced by category {category.id}")
        # Capture resolved action definitions so a changed action or indirect
        # membership is visible even when the category text is unchanged.
        resolved = set(category.action_ids)

        reachable = set()

        def collect(module_id):
            if module_id in reachable:
                return
            reachable.add(module_id)
            resolved.update(modules[module_id].action_ids)
            for dependency in modules[module_id].depends_on:
                collect(dependency)

        for module_id in category.module_ids:
            collect(module_id)
        from dataclasses import asdict

        snapshot = {
            "category": category.model_dump(),
            "modules": {k: modules[k].model_dump() for k in sorted(reachable)},
            "actions": {k: asdict(actions[k]) for k in sorted(resolved)},
        }
        active = snapshot in _APPROVED_BASELINE
        report.append({"id": category.id, "status": "approved" if active else "draft", "snapshot": snapshot})
    return {
        "integrations": integrations,
        "modules": modules,
        "active_categories": [r["snapshot"]["category"] for r in report if r["status"] == "approved"],
        "change_report": report,
    }
