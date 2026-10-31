"""One project network source for settings, automatic jobs and local command execution."""

from contextvars import ContextVar
from datetime import datetime, timezone
import ipaddress
import re
import time
import uuid

from app.services.network_models import NetworkPreferences, NetworkReport, scope_token
from app.services.network_probe import NetworkProbe, executable

JOB_NETWORK = ContextVar("flaghop_job_network", default=None)


class NetworkHeld(RuntimeError):
    pass


def network_service(runtime):
    service = getattr(runtime, "project_networks", None)
    if service is None:
        from app.services.project_hub import ProjectHub

        service = ProjectHub(runtime).networks
    return service


class ProjectNetworks:
    def __init__(self, hub, probe=None):
        self.hub = hub
        self.runtime = hub.runtime
        self.probe = probe or NetworkProbe()

    def get(self, identifier):
        with self.hub.lock:
            row = self.hub._record(identifier)
            saved = self.hub._read().get("networks", {}).get(identifier, {})
            prefs = NetworkPreferences.model_validate(saved.get("settings", {}))
            available, reason = self.availability()
            return {
                "project_id": identifier,
                "config_id": uuid.uuid5(uuid.NAMESPACE_URL, f"flaghop:{identifier}").hex,
                "revision": saved.get("revision", 0),
                "connector": row.get("connector", "networkmanager"),
                "configured": bool(
                    prefs.name
                    and prefs.scope_source
                    and prefs.allowed_targets
                    and prefs.interface
                    and (prefs.mode == "local" or prefs.profile_id)
                ),
                "settings": prefs.model_dump(),
                "enforcement_available": available,
                "enforcement_reason": reason,
                "recent_checks": saved.get("recent_checks", [])[-20:],
            }

    @staticmethod
    def availability():
        try:
            for tool in ("ip", "nft", "setpriv", "pkill", "pgrep", "unshare", "mount"):
                executable(tool)
            return True, "Enforcement tools are installed. Starting a guarded job also requires administrator access."
        except RuntimeError as exc:
            return False, str(exc)

    def save(self, identifier, update):
        with self.hub.lock:
            current = self.get(identifier)
            if update.expected_revision != current["revision"]:
                raise RuntimeError("Network settings changed. Reload them before saving.")
            data = self.hub._read()
            entry = data.setdefault("networks", {}).setdefault(identifier, {})
            entry.update(settings=update.settings.model_dump(), revision=current["revision"] + 1)
            self.hub._write(data)
            return self.get(identifier)

    def capture(self):
        with self.runtime._lock:
            self.runtime._require_active_project()
            path = self.runtime.get_project_details().get("name", "")
            row = next((row for row in self.hub.list()["projects"] if row["path"] == path and row["managed"]), None)
            if row is None:
                raise NetworkHeld("Save the project and configure its network in Project setup before network work.")
            context = self.get(row["id"])
            return {
                "project_id": row["id"],
                "project_path": path,
                "config_id": context["config_id"],
                "revision": context["revision"],
            }

    def load(self, reference):
        if self.runtime.get_project_details().get("name") != reference["project_path"]:
            raise NetworkHeld("The job's project is no longer active. Reopen it before retrying.")
        context = self.get(reference["project_id"])
        if context["config_id"] != reference["config_id"] or not context["configured"]:
            raise NetworkHeld("Complete this project's Network settings before network work.")
        return context

    def record(self, identifier, report):
        with self.hub.lock:
            data = self.hub._read()
            entry = data.setdefault("networks", {}).setdefault(identifier, {})
            entry["recent_checks"] = (entry.get("recent_checks", []) + [report])[-20:]
            self.hub._write(data)

    def resolve_scope(self, values, deadline, cache=None):
        cache = {} if cache is None else cache
        networks = []
        for value in values:
            value = scope_token(value)
            if time.monotonic() > deadline:
                raise NetworkHeld("Network check exceeded its time budget. Reduce the scope or check DNS.")
            if value not in cache:
                cache[value] = self.probe.resolve(value)
            networks.extend(ipaddress.ip_network(item) for item in cache[value])
            if len(networks) > 128:
                raise NetworkHeld("Too many resolved networks for one configuration.")
        return list(dict.fromkeys(networks))

    @staticmethod
    def allowed(target, includes, excludes):
        return any(target.version == net.version and target.subnet_of(net) for net in includes) and not any(
            target.version == net.version and target.overlaps(net) for net in excludes
        )

    def inspect(self, reference, targets, port=None):
        context = self.load(reference)
        prefs = NetworkPreferences.model_validate(context["settings"])
        deadline = time.monotonic() + 8
        resolved = {}
        includes = self.resolve_scope(prefs.allowed_targets, deadline, resolved)
        excludes = self.resolve_scope(prefs.exclusions, deadline, resolved)
        destinations = self.resolve_scope(targets, deadline, resolved)
        if not destinations:
            raise NetworkHeld("No explicit network targets were supplied to the command runner.")
        if port and prefs.allowed_ports and port not in prefs.allowed_ports:
            raise NetworkHeld(f"Port {port} is outside the configured ports.")
        for dest in destinations:
            if not self.allowed(dest, includes, excludes):
                raise NetworkHeld(f"Target {dest} is outside scope or overlaps an exclusion.")
        identity = self.probe.interface(prefs.interface)
        if prefs.mode == "openvpn" and (identity.get("linkinfo") or {}).get("info_kind") != "tun":
            raise NetworkHeld(
                "Guarded OpenVPN currently requires a userspace tunnel (disable-dco); DCO traffic is held."
            )
        profile = self.probe.profile(context["connector"], prefs)
        transport = self.probe.transport(prefs.interface) if prefs.mode == "wireguard" else None
        routes = []
        for dest in destinations:
            for address in dict.fromkeys((str(dest.network_address), str(dest.broadcast_address))):
                if time.monotonic() > deadline:
                    raise NetworkHeld("Route check exceeded its time budget.")
                route = self.probe.route(address)
                if route["interface"] != prefs.interface or not route["source"]:
                    raise NetworkHeld(
                        f"Route to {address} uses {route['interface'] or 'no interface'}; expected {prefs.interface}."
                    )
                routes.append(route)
        return {
            "reference": {**reference, "revision": context["revision"]},
            "connector": context["connector"],
            "prefs": prefs,
            "includes": includes,
            "excludes": excludes,
            "identity": identity,
            "profile": profile,
            "transport": transport,
            "resolved": resolved,
            "routes": routes,
            "destinations": destinations,
        }

    def verify(self, snapshot):
        current = self.load(snapshot["reference"])
        if current["revision"] != snapshot["reference"]["revision"] or current["connector"] != snapshot["connector"]:
            raise NetworkHeld("Project network configuration changed; recheck before retrying.")
        prefs = snapshot["prefs"]
        if self.probe.interface(prefs.interface) != snapshot["identity"]:
            raise NetworkHeld("The selected interface changed or disconnected.")
        if self.probe.profile(current["connector"], prefs) != snapshot["profile"]:
            raise NetworkHeld("The selected connection profile or process changed.")
        if prefs.mode == "wireguard" and self.probe.transport(prefs.interface) != snapshot["transport"]:
            raise NetworkHeld("The WireGuard peer transport changed.")
        for expected in snapshot["routes"]:
            if self.probe.route(expected["destination"]) != expected:
                raise NetworkHeld("The target route changed while the command was running.")

    def services(self, snapshot, requested=None):
        prefs = snapshot["prefs"]
        observations = []
        deadline = time.monotonic() + 8
        for requirement in [*prefs.required_services, *([requested] if requested else [])]:
            resolved = self.resolve_scope([requirement.target], deadline, snapshot["resolved"])
            if prefs.allowed_ports and requirement.port not in prefs.allowed_ports:
                raise NetworkHeld(f"Required port {requirement.port} is outside the configured ports.")
            for network in resolved:
                if time.monotonic() > deadline:
                    raise NetworkHeld("Required service checks exceeded their time budget.")
                if network.num_addresses != 1 or not self.allowed(network, snapshot["includes"], snapshot["excludes"]):
                    raise NetworkHeld("Required service target must be a single in-scope address or hostname.")
                route = self.probe.route(str(network.network_address))
                if route["interface"] != prefs.interface:
                    raise NetworkHeld("Required service would use the wrong interface.")
                outcome = self.probe.tcp(str(network.network_address), requirement.port, prefs.interface)
                observations.append(
                    {"address": str(network.network_address), "port": requirement.port, "outcome": outcome}
                )
        return observations

    def report(
        self,
        reference,
        targets,
        *,
        status="ready",
        reason="Scope and route checks passed.",
        snapshot=None,
        services=None,
    ):
        report = NetworkReport(
            status=status,
            reason=reason,
            revision=(snapshot or {}).get("reference", reference)["revision"],
            checked_at=datetime.now(timezone.utc).isoformat(),
            target=", ".join(targets)[:2000],
            routes=(snapshot or {}).get("routes", []),
            services=services or [],
        ).model_dump()
        self.record(reference["project_id"], report)
        return report

    def check(self, identifier, request):
        row = self.hub._record(identifier)
        context = self.get(identifier)
        reference = {
            "project_id": identifier,
            "project_path": row["path"],
            "config_id": context["config_id"],
            "revision": context["revision"],
        }
        snapshot = None
        try:
            snapshot = self.inspect(reference, [request.target], request.port)
            from app.services.network_models import RequiredService

            requested = RequiredService(target=request.target, port=request.port) if request.port else None
            services = self.services(snapshot, requested)
            ok = all(item["outcome"] == "connected" for item in services)
            return self.report(
                reference,
                [request.target],
                snapshot=snapshot,
                services=services,
                status="ready" if ok else "no_response",
                reason="Checks passed." if ok else "Required service was not verified; see individual results.",
            )
        except (RuntimeError, ValueError, OSError) as exc:
            return self.report(reference, [request.target], snapshot=snapshot, status="held", reason=str(exc))


def command_targets(request):
    if request.network_targets:
        return list(request.network_targets)
    return [token for token in re.split(r"[\s,]+", request.host_ip.strip()) if token]
