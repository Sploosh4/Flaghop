"""Adapt legacy sources without changing their execution semantics."""

from types import SimpleNamespace

from app.capabilities.manifests import validate_manifests
from app.contracts.actions.capabilities import CapabilityManifest, IntegrationMetadata, ModuleMetadata
from app.pipettes import list_pipettes
from app.scheduler.registry import ActionRegistry


def catalog_sources(settings, dangerous_categories=None, supported=None):
    """Build validated relationships while retaining legacy rows and order."""
    supported = supported or (lambda _: True)
    # Old catalogue first extracts three port fields then filters unsupported IDs.
    # Do not eagerly interpret malformed/unsupported rows in ActionRegistry.
    ports = [row for row in settings.portActions if len(row) >= 3 and supported(str(row[1]))]
    automated = [
        row for row in settings.automatedAttacks if row and str(row[0] or "").strip() and supported(str(row[0]).strip())
    ]
    adapted = SimpleNamespace(portActions=ports, automatedAttacks=automated)
    registry = ActionRegistry.from_settings(adapted, dangerous_categories)
    actions = registry.all()
    pipettes = list_pipettes()
    ids = list(dict.fromkeys([a.tool_id for a in actions] + [p.tool_id for p in pipettes]))
    manifest = CapabilityManifest(
        version=1,
        integrations=[IntegrationMetadata(id=tool_id) for tool_id in ids],
        modules=[
            ModuleMetadata(
                id="legacy-settings",
                action_ids=[a.action_id for a in actions],
                integration_ids=list(dict.fromkeys(a.tool_id for a in actions)),
            ),
            ModuleMetadata(
                id="legacy-pipettes",
                action_ids=["pipette:" + p.tool_id for p in pipettes],
                integration_ids=list(dict.fromkeys(p.tool_id for p in pipettes)),
            ),
        ],
    )
    relationships = validate_manifests([manifest], registry, pipettes)
    return {
        "port_actions": list(settings.portActions),
        "automated_attacks": list(settings.automatedAttacks),
        "pipettes": pipettes,
        "registry": registry,
        "relationships": relationships,
    }


def inspect_sources(sources):
    actions = sources["registry"].all()
    pipettes = sources["pipettes"]
    relationships = sources["relationships"]
    all_actions = [
        {
            "action_id": a.action_id,
            "integration_id": a.tool_id,
            "source": "settings",
            "parameters": a.parameter_schema,
            "service_scope": a.service_scope,
            "protocol_scope": a.protocol_scope,
            "artifact_types": a.artifact_types,
            "artifact_types_note": "legacy inferred hints, not guaranteed outputs",
        }
        for a in actions
    ] + [
        {
            "action_id": "pipette:" + p.tool_id,
            "integration_id": p.tool_id,
            "source": "pipette",
            "legacy_tool_id": p.tool_id,
            "parameters": p.parameters,
            "service_scope": p.service_scope,
            "protocol_scope": p.protocol_scope,
            "target_ports": p.target_ports,
            "required_tools": p.required_tools,
            "optional_tools": p.optional_tools,
            "output_types": None,
        }
        for p in pipettes
    ]
    integrations = {key: [] for key in relationships["integrations"]}
    for action in all_actions:
        integrations[action["integration_id"]].append(action["action_id"])
    return {
        "integrations": [{"id": k, "action_ids": v} for k, v in integrations.items()],
        "actions": all_actions,
        "modules": [m.model_dump() for m in relationships["modules"].values()],
        "missing_prerequisites": None,
        "prerequisites_note": "Required tools are declared, but installation is not checked during inspection.",
        "categories": relationships["active_categories"],
        "taxonomy_status": "unclassified: no approved production definitions recorded",
    }
