"""Bounded local network observations. Reading settings never calls these probes."""

import ipaddress
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import socket
import subprocess

import psutil


def executable(name):
    path = shutil.which(name, path=os.environ.get("PATH", "") + ":/usr/sbin:/sbin")
    if not path:
        raise RuntimeError(f"Network checks require {name} to be installed.")
    return path


def command(argv, *, admin=False, input=None):
    args = list(argv)
    if admin and os.geteuid() != 0:
        args = [executable("sudo"), "-n", *args]
    result = subprocess.run(args, input=input, capture_output=True, text=True, timeout=5)
    if result.returncode:
        message = (result.stderr or result.stdout).strip()[:600]
        raise RuntimeError(message or f"{Path(argv[0]).name} failed.")
    return result.stdout


class NetworkProbe:
    def resolve(self, token):
        try:
            return [str(ipaddress.ip_network(token, strict=False))]
        except ValueError:
            output = command([executable("getent"), "ahosts", token])
            addresses = sorted({str(ipaddress.ip_address(line.split()[0])) for line in output.splitlines() if line})
            if not addresses or len(addresses) > 64:
                raise RuntimeError(f"Could not resolve a bounded address list for {token}.")
            return [str(ipaddress.ip_network(address)) for address in addresses]

    def interface(self, name):
        rows = json.loads(command([executable("ip"), "-j", "-d", "address", "show", "dev", name]))
        if len(rows) != 1 or "UP" not in rows[0].get("flags", []):
            raise RuntimeError(f"Interface {name} is unavailable or down.")
        row = rows[0]
        identity = {key: row.get(key) for key in ("ifindex", "ifname", "address", "linkinfo")}
        identity["addr_info"] = sorted(
            [
                {key: address.get(key) for key in ("family", "local", "prefixlen", "scope", "label")}
                for address in row.get("addr_info", [])
            ],
            key=lambda address: str(address),
        )
        return identity

    def route(self, address, mark=None):
        args = [executable("ip"), "-j", "route", "get", address]
        if mark is not None:
            args.extend(["mark", str(mark)])
        rows = json.loads(command(args))
        if len(rows) != 1 or rows[0].get("type") in {"blackhole", "unreachable", "prohibit"}:
            raise RuntimeError(f"No usable route to {address}.")
        row = rows[0]
        return {
            "destination": address,
            "interface": row.get("dev", ""),
            "source": row.get("prefsrc", row.get("src", "")),
            "gateway": row.get("gateway", ""),
        }

    def transport(self, interface):
        mark = command([executable("wg"), "show", interface, "fwmark"], admin=True).strip()
        if mark == "off" or int(mark, 0) == 0:
            raise RuntimeError(
                "WireGuard egress enforcement requires a nonzero transport fwmark on the selected interface."
            )
        lines = command([executable("wg"), "show", interface, "endpoints"], admin=True).splitlines()
        peers = []
        for line in lines:
            fields = line.split()
            if len(fields) != 2 or fields[1] == "(none)":
                raise RuntimeError("WireGuard peer endpoint is not known yet.")
            address, port = fields[1].rsplit(":", 1)
            address = str(ipaddress.ip_address(address.strip("[]")))
            route = self.route(address, int(mark, 0))
            identity = self.interface(route["interface"])
            peers.append({"address": address, "port": int(port), "route": route, "ifindex": identity["ifindex"]})
        if not peers or len(peers) > 64:
            raise RuntimeError("No bounded WireGuard peer transport is available.")
        return {"mark": int(mark, 0), "peers": peers}

    def profile(self, connector, prefs):
        if prefs.mode == "local" and not prefs.profile_id:
            return "local"
        if not prefs.profile_id:
            raise RuntimeError("Select a specific connection profile in Network settings.")
        if connector == "networkmanager":
            output = command([executable("nmcli"), "-t", "-f", "UUID,DEVICE", "connection", "show", "--active"])
            if f"{prefs.profile_id}:{prefs.interface}" not in output.splitlines():
                raise RuntimeError("The selected NetworkManager profile is not active on this interface.")
        elif connector == "wireguard" and prefs.mode == "wireguard":
            peers = command([executable("wg"), "show", prefs.interface, "peers"], admin=True).splitlines()
            if prefs.profile_id not in peers:
                raise RuntimeError("The expected WireGuard peer is not configured on this interface.")
        elif connector == "openvpn" and prefs.mode == "openvpn":
            expected = Path(prefs.profile_id).expanduser().resolve(strict=True)
            if expected.stat().st_size > 1024 * 1024:
                raise RuntimeError("The OpenVPN profile is too large to inspect.")
            # Inspect only config path and device; never include config contents or keys in diagnostics.
            dev = ""
            content = expected.read_text()
            for line in content.splitlines():
                tokens = shlex.split(line, comments=True)
                if len(tokens) == 2 and tokens[0] == "dev":
                    dev = tokens[1]
            found = False
            for proc in psutil.process_iter(["name", "cmdline", "cwd"]):
                try:
                    args = proc.info["cmdline"] or []
                    if not (proc.info["name"] or "").startswith("openvpn") or "--config" not in args:
                        continue
                    path = Path(args[args.index("--config") + 1])
                    if not path.is_absolute():
                        path = Path(proc.info["cwd"] or "/") / path
                    proc_dev = args[args.index("--dev") + 1] if "--dev" in args else dev
                    if path.resolve() == expected and proc_dev == prefs.interface:
                        found = True
                        process_id = proc.pid
                except (psutil.Error, OSError, IndexError):
                    continue
            if not found:
                raise RuntimeError("No OpenVPN process matches this profile and explicit tunnel device.")
            return {
                "profile_id": prefs.profile_id,
                "process_id": process_id,
                "config_digest": hashlib.sha256(content.encode()).hexdigest(),
            }
        else:
            raise RuntimeError("The connection mode does not match the selected connector.")
        return prefs.profile_id

    def tcp(self, address, port, interface):
        family = socket.AF_INET6 if ":" in address else socket.AF_INET
        try:
            with socket.socket(family, socket.SOCK_STREAM) as sock:
                sock.settimeout(1.5)
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, interface.encode() + b"\0")
                sock.connect((address, port))
            return "connected"
        except ConnectionRefusedError:
            return "refused"
        except TimeoutError:
            return "no_response"
        except OSError as exc:
            return f"unverified: {exc.strerror}"
