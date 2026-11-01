"""Real tunnel/egress acceptance, only inside a fresh root-owned network namespace.

Run with: pkexec env PYTHONDONTWRITEBYTECODE=1 unshare --mount --net --propagation private -- .venv/bin/python tests/desktop/network_tunnels.py
No existing interfaces, routes, VPN profiles or host firewall tables are modified.
"""

import ipaddress
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from app.contracts.actions.process import CommandRequest
from app.services.network_guard import NetworkLease
from app.contracts.actions.network import NetworkCheckRequest, NetworkUpdate
from app.services.project_networks import NetworkHeld, ProjectNetworks
from tests.app.test_ProjectNetworks import FixtureHub
from tests.app.test_ProjectNetworks import ProjectNetworksTest
from app.processes.runner import ProcessRunner


def run(*args, input=None):
    result = subprocess.run(list(args), input=input, text=True, capture_output=True, timeout=15)
    if result.returncode:
        raise RuntimeError(f"Fixture command {args[0]} failed: {result.stderr[-1000:]}")
    return result.stdout.strip()


def wait_until(check, timeout=12):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            if check():
                return
        except (RuntimeError, OSError):
            pass
        time.sleep(0.15)
    raise AssertionError("Fixture did not become ready in time.")


def acceptance(folder, kind, iface, target, profile):
    hub = FixtureHub(folder)
    data = hub._read()
    data["projects"][0]["connector"] = kind
    hub._write(data)
    service = ProjectNetworks(hub)
    settings = {
        "name": f"Isolated {kind} fixture",
        "scope_source": "Local synthetic tunnel acceptance",
        "mode": kind,
        "interface": iface,
        "profile_id": profile,
        "allowed_targets": [target],
        "allowed_ports": [18080],
        "required_services": [{"target": target, "port": 18080}],
    }
    service.save("a", NetworkUpdate(expected_revision=0, settings=settings))
    wait_until(lambda: service.check("a", NetworkCheckRequest(target=target, port=18080))["status"] == "ready")
    code = f"""import socket
with socket.create_connection(({target!r}, 18080), timeout=2) as s:
    assert s.recv(32) == b'fixture\\n'
for dest in [('192.0.2.2', 18080), ({target!r}, 18081)]:
    try:
        s = socket.create_connection(dest, timeout=0.5)
    except OSError:
        continue
    s.close()
    raise AssertionError('egress restriction failed')
print('allowed service reached; extra destination and port blocked')
"""
    request = CommandRequest("fixture", kind, target, "18080", "tcp", shlex.join([sys.executable, "-c", code]), "", 10)
    lease = NetworkLease(service, request)
    try:
        argv = lease.prepare()
        output = run(*argv)
        lease.verify()
        assert "extra destination and port blocked" in output
        # A new more-specific route must not let the already running lease fall back.
        original = json.loads(run("ip", "-j", "route", "show", "exact", f"{target}/32"))
        run("ip", "route", "replace", f"{target}/32", "dev", "transport0", "src", "192.0.2.1")
        try:
            blocked_code = f"import socket; socket.create_connection(({target!r},18080), timeout=0.5)"
            argv[-1] = shlex.join([sys.executable, "-c", blocked_code])
            result = subprocess.run(argv, capture_output=True, text=True, timeout=5)
            assert result.returncode != 0, "Fallback traffic escaped the selected tunnel"
            lease.next_check = 0
            try:
                lease.verify()
            except NetworkHeld:
                pass
            else:
                raise AssertionError("Changed route was not detected")
        finally:
            run("ip", "route", "del", f"{target}/32", "dev", "transport0")
            if original:
                run("ip", "route", "add", f"{target}/32", "dev", original[0]["dev"], "src", original[0]["prefsrc"])
    except Exception:
        print(run("nft", "list", "table", "inet", lease.table), flush=True)
        print(json.dumps(lease.snapshot["routes"]), flush=True)
        raise
    finally:
        lease.close()
    nmap_request = CommandRequest(
        "nmap-network-acceptance",
        kind,
        target,
        "18080",
        "tcp",
        shlex.join(["nmap", "--unprivileged", "-sT", "-Pn", "-n", "-p", "18080", target]),
        "",
        10,
    )
    guard = NetworkLease(service, nmap_request)
    ports = ProjectNetworksTest().process_ports(guard)
    result = ProcessRunner(ports).run(nmap_request)
    assert result.executed, result.reason
    # Exclusions are checked before a process can be returned.
    settings["exclusions"] = [target]
    service.save("a", NetworkUpdate(expected_revision=1, settings=settings))
    held = service.check("a", NetworkCheckRequest(target=target))
    assert held["status"] == "held"
    return {
        "kind": kind,
        "nmap_via_common_runner": "passed",
        "service": "passed",
        "extra_destination": "blocked",
        "extra_port": "blocked",
        "route_change": "held",
        "kernel_fallback": "blocked",
        "exclusion": "held",
    }


def main():
    if (
        os.geteuid() != 0
        or os.readlink("/proc/self/ns/net") == os.readlink("/proc/1/ns/net")
        or os.readlink("/proc/self/ns/mnt") == os.readlink("/proc/1/ns/mnt")
    ):
        raise SystemExit("This fixture requires root in a fresh network namespace. Refusing host-network execution.")
    os.umask(0o077)
    folder = Path(tempfile.mkdtemp(prefix="network-tunnel-", dir=ROOT / ".tmp"))
    peer = f"fh-test-{uuid.uuid4().hex[:8]}"
    children, logs, checks = [], [], []
    try:
        run("ip", "link", "set", "lo", "up")
        run("ip", "netns", "add", peer)
        run("ip", "link", "add", "transport0", "type", "veth", "peer", "name", "transport1")
        run("ip", "link", "set", "transport1", "netns", peer)
        run("ip", "addr", "add", "192.0.2.1/30", "dev", "transport0")
        run("ip", "link", "set", "transport0", "up")

        def remote(*args):
            return run("ip", "netns", "exec", peer, *args)

        remote("ip", "link", "set", "lo", "up")
        remote("ip", "addr", "add", "192.0.2.2/30", "dev", "transport1")
        remote("ip", "link", "set", "transport1", "up")
        server = """import socket, threading, time
def serve(port):
    s=socket.socket(); s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1); s.bind(('0.0.0.0',port)); s.listen()
    while True:
        c,_=s.accept()
        try: c.sendall(b'fixture\\n')
        except OSError: pass
        finally: c.close()
for port in (18080,18081): threading.Thread(target=serve,args=(port,),daemon=True).start()
time.sleep(180)
"""
        children.append(subprocess.Popen(["ip", "netns", "exec", peer, sys.executable, "-c", server]))
        client_key = folder / "wg-client.key"
        server_key = folder / "wg-server.key"
        client_key.write_text(run("wg", "genkey") + "\n")
        server_key.write_text(run("wg", "genkey") + "\n")
        # Use WireGuard's supported config location in a private mount namespace.
        # Keys remain stored in the capped project; the host's /etc/wireguard is untouched.
        run("mount", "--bind", str(folder), "/etc/wireguard")
        client_pub = run("wg", "pubkey", input=client_key.read_text())
        server_pub = run("wg", "pubkey", input=server_key.read_text())
        run("ip", "link", "add", "wgctf0", "type", "wireguard")
        remote("ip", "link", "add", "wgpeer0", "type", "wireguard")
        run(
            "wg",
            "set",
            "wgctf0",
            "private-key",
            "/etc/wireguard/wg-client.key",
            "listen-port",
            "51830",
            "peer",
            server_pub,
            "allowed-ips",
            "198.18.0.2/32",
            "endpoint",
            "192.0.2.2:51831",
        )
        run("wg", "set", "wgctf0", "fwmark", "51830")
        remote(
            "wg",
            "set",
            "wgpeer0",
            "private-key",
            "/etc/wireguard/wg-server.key",
            "listen-port",
            "51831",
            "peer",
            client_pub,
            "allowed-ips",
            "198.18.0.1/32",
            "endpoint",
            "192.0.2.1:51830",
        )
        run("ip", "addr", "add", "198.18.0.1/24", "dev", "wgctf0")
        remote("ip", "addr", "add", "198.18.0.2/24", "dev", "wgpeer0")
        run("ip", "link", "set", "wgctf0", "up")
        remote("ip", "link", "set", "wgpeer0", "up")
        checks.append(acceptance(folder, "wireguard", "wgctf0", "198.18.0.2", server_pub))
        # Generate a short-lived local CA and role-specific certificates; nothing is downloaded or reused.
        run(
            "openssl",
            "req",
            "-x509",
            "-newkey",
            "rsa:2048",
            "-nodes",
            "-keyout",
            str(folder / "ca.key"),
            "-out",
            str(folder / "ca.crt"),
            "-days",
            "1",
            "-subj",
            "/CN=FlagHop fixture CA",
        )
        for role in ("server", "client"):
            run(
                "openssl",
                "req",
                "-newkey",
                "rsa:2048",
                "-nodes",
                "-keyout",
                str(folder / f"{role}.key"),
                "-out",
                str(folder / f"{role}.csr"),
                "-subj",
                f"/CN=FlagHop fixture {role}",
            )
            extension = folder / f"{role}.ext"
            extension.write_text(f"extendedKeyUsage={role}Auth\nkeyUsage=digitalSignature,keyEncipherment\n")
            run(
                "openssl",
                "x509",
                "-req",
                "-in",
                str(folder / f"{role}.csr"),
                "-CA",
                str(folder / "ca.crt"),
                "-CAkey",
                str(folder / "ca.key"),
                "-CAcreateserial",
                "-out",
                str(folder / f"{role}.crt"),
                "-days",
                "1",
                "-extfile",
                str(extension),
            )
        for role in ("server", "client"):
            config = folder / f"{role}.ovpn"
            local, distant = ("198.19.0.2", "198.19.0.1") if role == "server" else ("198.19.0.1", "198.19.0.2")
            lines = [
                f"dev {'ovpeer0' if role == 'server' else 'ovctf0'}",
                "dev-type tun",
                "proto udp",
                "port 11950",
                f"ifconfig {local} {distant}",
                f"ca {folder / 'ca.crt'}",
                f"cert {folder / f'{role}.crt'}",
                f"key {folder / f'{role}.key'}",
                "data-ciphers AES-256-GCM",
                "verb 3",
                "auth-nocache",
                "disable-dco",
            ]
            lines += (
                ["tls-server", "dh none", "remote-cert-tls client"]
                if role == "server"
                else ["tls-client", "remote 192.0.2.2 11950", "remote-cert-tls server", "nobind"]
            )
            config.write_text("\n".join(lines) + "\n")
            log = (folder / f"{role}.log").open("w")
            logs.append(log)
            argv = ["openvpn", "--config", str(config)]
            if role == "server":
                argv = ["ip", "netns", "exec", peer, *argv]
            children.append(subprocess.Popen(argv, stdout=log, stderr=subprocess.STDOUT))
        wait_until(lambda: "Initialization Sequence Completed" in (folder / "client.log").read_text(), timeout=20)
        checks.append(acceptance(folder, "openvpn", "ovctf0", "198.19.0.2", str(folder / "client.ovpn")))
        print(json.dumps({"isolated": True, "checks": checks}), flush=True)
    finally:
        for child in reversed(children):
            child.terminate()
            try:
                child.wait(timeout=3)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()
        for log in logs:
            log.close()
        subprocess.run(["ip", "netns", "del", peer], capture_output=True)
        shutil.rmtree(folder)


if __name__ == "__main__":
    main()
