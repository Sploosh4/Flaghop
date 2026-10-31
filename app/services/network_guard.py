"""Per-command Linux egress restrictions; no rules affect other application traffic."""

import grp
import json
import os
from pathlib import Path
import secrets
import shlex
import subprocess
import tempfile
import time
import sys

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
        self.proxy_sequence = ""

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
            if (
                self.request.tool_name == "device-profile"
                and self.service.get(self.reference["project_id"])["revision"] != self.reference["revision"]
            ):
                raise NetworkHeld("Network settings changed after Deep scan was queued. Reload and retry.")
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
        if self.request.tool_name == "device-profile" and self.request.proxy_channel:
            lines += [
                f"add set inet {table} scan_proxy {{ type inet_service; }}",
                f'add rule inet {table} targets meta oifname "lo" ip saddr 127.0.0.1 ip daddr 127.0.0.1 tcp dport @scan_proxy accept',
                f'add rule inet {table} targets meta oifname "lo" ip saddr 127.0.0.1 ip daddr 127.0.0.1 tcp sport @scan_proxy ct state established accept',
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
        # A profiler is narrower than the project scope: one IP and an optional explicit resolver.
        includes = snapshot["destinations"] if self.request.tool_name == "device-profile" else snapshot["includes"]
        for network in includes:
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
        child = list(self.request.argv) if self.request.argv else ["/bin/sh", "-c", self.request.command]
        if self.request.tool_name == "device-profile":
            # sudo-rs ignores -E. Restore only scanner runtime paths after
            # setpriv has dropped privileges, never into the root helpers.
            from app.tooling import build_tool_execution_env

            environment = build_tool_execution_env()
            names = ("PATH", "HOME", "USER", "LOGNAME", "LANG", "LC_ALL", "TERM", "TZ", "TMPDIR", "XDG_CACHE_HOME")
            child = [
                executable("env"),
                "-i",
                *[f"{name}={environment[name]}" for name in names if name in environment],
                "NMAP_UNPRIVILEGED=1",
                "PYTHONDONTWRITEBYTECODE=1",
                *child,
            ]
        args = [
            executable("setpriv"),
            f"--reuid={uid}",
            f"--regid={self.gid}",
            "--clear-groups",
            "--bounding-set=-all",
            "--inh-caps=-all",
            "--ambient-caps=-all",
            "--no-new-privs",
            *child,
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
        preserve = [] if self.request.tool_name == "device-profile" else ["-E"]
        return args if os.geteuid() == 0 else [executable("sudo"), "-n", *preserve, *args]

    def verify(self):
        self.sync_proxy()
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

    def sync_proxy(self):
        if self.request.tool_name != "device-profile" or not self.request.proxy_channel:
            return
        path = Path(self.request.proxy_channel)
        from app.scanning.proxy_channel import registration

        try:
            message = registration(path, self.request.proxy_token)
        except (OSError, ValueError) as exc:
            raise NetworkHeld(f"Invalid scan proxy registration: {exc}") from exc
        if message is None or message.sequence == self.proxy_sequence:
            return
        sequence, port = message.sequence, message.port
        if message.operation == "open":
            helper = Path(__file__).resolve().parents[1] / "scanning/listener.py"
            try:
                command([sys.executable, "-I", str(helper), str(self.gid), str(port)], admin=True)
            except RuntimeError as exc:
                raise NetworkHeld("Scan proxy listener does not belong to this job's private group.") from exc
        rules = f"flush set inet {self.table} scan_proxy\n"
        if message.operation == "open":
            rules += f"add element inet {self.table} scan_proxy {{ {port} }}\n"
        command([executable("nft"), "-f", "-"], admin=True, input=rules)
        from app.services.project_background import atomic_json

        atomic_json(path.with_suffix(".ack"), {"token": self.request.proxy_token, "sequence": sequence})
        self.proxy_sequence = sequence

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
