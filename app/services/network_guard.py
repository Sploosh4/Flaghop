"""Per-command Linux egress restrictions; no rules affect other application traffic."""

import grp
import os
from pathlib import Path
import secrets
import shlex
import subprocess
import tempfile
import time

from app.services.network_probe import command, executable
from app.services.project_networks import JOB_NETWORK, NetworkHeld, command_targets


class NetworkLease:
    def __init__(self, service, request):
        self.service, self.request = service, request
        self.reference = None
        self.snapshot = None
        self.report = None
        self.table = ""
        self.gid = 0
        self.next_check = 0.0
        self.installed = False
        self.hosts_folder = None

    def prepare(self):
        try:
            self.reference = JOB_NETWORK.get() or self.service.capture()
            if self.request.job_id:
                job = self.service.runtime.jobs.get_job(self.request.job_id)
                if job and job.get("payload", {}).get("network_context"):
                    self.reference = job["payload"]["network_context"]
            if self.request.tool_name == "tshark-passive-capture":
                raise NetworkHeld("Passive capture needs a dedicated privileged adapter; the guarded runner holds it.")
            targets = command_targets(self.request)
            port = int(self.request.port) if str(self.request.port).isdigit() else None
            self.snapshot = self.service.inspect(self.reference, targets, port)
            observations = self.service.services(self.snapshot)
            if any(row["outcome"] != "connected" for row in observations):
                raise NetworkHeld("A required service could not be verified. See Network settings.")
            self.gid = self._unused_gid()
            self.table = f"flaghop_{self.gid}"
            command([executable("nft"), "-f", "-"], admin=True, input=self.rules())
            self.installed = True
            self.service.verify(self.snapshot)
            self.report = self.service.report(self.reference, targets, snapshot=self.snapshot, services=observations)
            return self.argv()
        except (RuntimeError, ValueError, OSError, subprocess.SubprocessError) as exc:
            self.block(str(exc))
            raise NetworkHeld(f"held: {exc}") from exc

    def _unused_gid(self):
        tables = command([executable("nft"), "list", "tables"], admin=True)
        for _ in range(20):
            gid = 1_000_000_000 + secrets.randbelow(1_000_000_000)
            if f"flaghop_{gid}" in tables:
                continue
            try:
                grp.getgrgid(gid)
            except KeyError:
                return gid
        raise NetworkHeld("Could not allocate a private command network group.")

    def rules(self):
        snapshot = self.snapshot
        prefs = snapshot["prefs"]
        table = self.table
        lines = [
            f"create table inet {table}",
            f"add chain inet {table} output {{ type filter hook output priority 0; policy accept; }}",
            f"add chain inet {table} targets",
            f"add rule inet {table} output meta skgid {self.gid} jump targets",
        ]
        if snapshot.get("transport"):
            transport = snapshot["transport"]
            for peer in transport["peers"]:
                family = "ip6" if ":" in peer["address"] else "ip"
                lines.append(
                    f"add rule inet {table} targets meta mark {transport['mark']} meta oif {peer['ifindex']} "
                    f"{family} daddr {peer['address']} udp dport {peer['port']} counter accept"
                )
            if self.request.tool_name.startswith("nmap"):
                raw_modes = {"-sS", "-sU", "-sA", "-sW", "-sM", "-sF", "-sX", "-sN", "-O", "--traceroute", "--send-eth"}
                if raw_modes.intersection(shlex.split(self.request.command)):
                    raise NetworkHeld(
                        "This Nmap mode needs raw sockets. Choose a TCP connect scan for the guarded runner."
                    )
        lines.append(f"add rule inet {table} targets meta oif != {snapshot['identity']['ifindex']} counter drop")
        for network in snapshot["excludes"]:
            family = "ip" if network.version == 4 else "ip6"
            lines.append(f"add rule inet {table} targets {family} daddr {network} drop")
        for network in snapshot["includes"]:
            family = "ip" if network.version == 4 else "ip6"
            sources = sorted(
                {row["source"] for row in snapshot["routes"] if (":" in row["source"]) == (network.version == 6)}
            )
            if not sources:
                continue
            match = f"{family} saddr {{ {', '.join(sources)} }} {family} daddr {network}"
            if prefs.allowed_ports:
                ports = ", ".join(str(port) for port in prefs.allowed_ports)
                match += f" meta l4proto {{ tcp, udp }} th dport {{ {ports} }}"
            lines.append(f"add rule inet {table} targets {match} counter accept")
        lines.append(f"add rule inet {table} targets counter drop")
        return "\n".join(lines) + "\n"

    def argv(self):
        uid = os.getuid()
        if os.geteuid() == 0:
            uid = int(os.environ.get("SUDO_UID", os.environ.get("PKEXEC_UID", uid)))
        temporary_root = Path(__file__).resolve().parents[2] / ".tmp"
        temporary_root.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.hosts_folder = tempfile.TemporaryDirectory(prefix="network-hosts-", dir=temporary_root)
        hosts = Path(self.hosts_folder.name) / "hosts"
        entries = []
        for hostname, networks in self.snapshot.get("resolved", {}).items():
            if "/" not in hostname:
                for network in networks:
                    entries.append(f"{network.split('/')[0]} {hostname}")
        # Pin checked hostnames for subprocesses without changing the host's resolver.
        hosts.write_text("\n".join(entries) + "\n" + Path("/etc/hosts").read_text())
        hosts.chmod(0o644)
        args = [
            executable("setpriv"),
            f"--reuid={uid}",
            f"--regid={self.gid}",
            "--clear-groups",
            "--bounding-set=-all",
            "--inh-caps=-all",
            "--ambient-caps=-all",
            "--no-new-privs",
            "/bin/sh",
            "-c",
            self.request.command,
        ]
        mount_script = f'{shlex.quote(executable("mount"))} --bind "$1" /etc/hosts; shift; exec "$@"'
        args = [
            executable("unshare"),
            "--mount",
            "--propagation",
            "private",
            "--",
            "/bin/sh",
            "-ec",
            mount_script,
            "flaghop-network",
            str(hosts),
            *args,
        ]
        return args if os.geteuid() == 0 else [executable("sudo"), "-n", "-E", *args]

    def verify(self):
        if time.monotonic() < self.next_check:
            return
        self.next_check = time.monotonic() + 1
        try:
            self.service.verify(self.snapshot)
            # Removing a lease's table externally must not turn into an unguarded run.
            command([executable("nft"), "list", "table", "inet", self.table], admin=True)
        except (RuntimeError, ValueError, OSError, subprocess.SubprocessError) as exc:
            self.block(str(exc))
            raise NetworkHeld(f"held: {exc}") from exc

    def block(self, reason):
        if self.reference:
            report = self.service.report(
                self.reference, command_targets(self.request), snapshot=self.snapshot, status="held", reason=reason
            )
            if self.report is None:
                self.report = report
            else:
                self.report.clear()
                self.report.update(report)

    def close(self):
        if not self.installed:
            if self.hosts_folder is not None:
                self.hosts_folder.cleanup()
            return
        # Descendants retain the private real GID even if they detach or their shell exits.
        # Keep the rules if processes cannot be accounted for or stopped.
        prefix = [] if os.geteuid() == 0 else [executable("sudo"), "-n"]
        subprocess.run([*prefix, executable("pkill"), "-KILL", "-G", str(self.gid)], capture_output=True, timeout=5)
        remaining = subprocess.run([*prefix, executable("pgrep"), "-G", str(self.gid)], capture_output=True, timeout=5)
        if remaining.returncode != 1:
            raise RuntimeError("Network cleanup retained the egress restriction because child processes may remain.")
        # Deleting an absent table after a failed installation is harmless to report as cleanup failure.
        command([executable("nft"), "delete", "table", "inet", self.table], admin=True)
        self.table = ""
        if self.hosts_folder is not None:
            self.hosts_folder.cleanup()
