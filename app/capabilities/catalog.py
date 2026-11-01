"""Adapt legacy sources without changing their execution semantics."""

from types import SimpleNamespace

from app.scheduler.registry import ActionRegistry
from app.pipettes import list_pipettes


def catalog_sources(settings, dangerous_categories=None):
    """Return raw legacy rows and shared canonical action definitions.

    Legacy rows are intentionally retained: duplicates and row ordering differ
    from the scheduler's last-definition-per-tool registry contract.
    """
    # Legacy catalogue skips empty automated rows; the scheduler registry does
    # not accept empty IDs. Preserve that older catalogue behavior.
    valid_automated = [row for row in settings.automatedAttacks if row and str(row[0] or "").strip()]
    adapted = SimpleNamespace(portActions=settings.portActions, automatedAttacks=valid_automated)
    registry = ActionRegistry.from_settings(adapted, dangerous_categories)
    return {
        "port_actions": [(row, registry.get_by_tool_id(str(row[1]))) for row in settings.portActions],
        "automated_attacks": [(row, registry.get_by_tool_id(str(row[0]))) for row in valid_automated],
        "pipettes": list_pipettes(),
        "registry": registry,
    }


def inspect_sources(sources):
    actions = sources["registry"].all()
    integrations = {}
    for action in actions:
        integrations.setdefault(action.tool_id, []).append(action.action_id)
    for pipette in sources["pipettes"]:
        integrations.setdefault(pipette.tool_id, [])
    return {
        "integrations": [{"id": k, "action_ids": v} for k, v in integrations.items()],
        "actions": [
            {
                "action_id": a.action_id,
                "integration_id": a.tool_id,
                "parameters": a.parameter_schema,
                "service_scope": a.service_scope,
                "protocol_scope": a.protocol_scope,
                "artifact_types": a.artifact_types,
                "artifact_types_note": "legacy inferred hints, not guaranteed outputs",
            }
            for a in actions
        ],
        "pipettes": [
            {
                "action_id": p.tool_id,
                "integration_id": p.tool_id,
                "required_tools": p.required_tools,
                "optional_tools": p.optional_tools,
                "parameters": p.parameters,
                "output_types": None,
            }
            for p in sources["pipettes"]
        ],
        "modules": [
            {
                "id": "legacy-settings",
                "action_ids": [a.action_id for a in actions],
                "integration_ids": list(dict.fromkeys(a.tool_id for a in actions)),
            },
            {
                "id": "legacy-pipettes",
                "action_ids": [p.tool_id for p in sources["pipettes"]],
                "integration_ids": [p.tool_id for p in sources["pipettes"]],
            },
        ],
        "missing_prerequisites": None,
        "prerequisites_note": "Required tools are declared, but installation is not checked during inspection.",
        "categories": [],
        "taxonomy_status": "unclassified: no approved production definitions recorded",
    }
