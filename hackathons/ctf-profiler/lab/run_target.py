#!/usr/bin/env python3
"""Owned loopback-only CTF services; run with lab/start-and-scan.sh."""
import datetime
import http.server
import json
import ipaddress
import logging
import multiprocessing
import os
from pathlib import Path
import signal
import socket
import socketserver
import ssl
import sqlite3
import threading
import time
from urllib.parse import parse_qs, urlsplit

import dns.message
import dns.flags
import dns.rcode
import dns.rdatatype
import dns.rrset
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
import paramiko
from impacket.smbserver import SimpleSMBServer

ADDRESS = "127.0.0.2"
ROOT = Path(__file__).resolve().parent / "runtime"


def prepare():
    ROOT.mkdir(mode=0o700, exist_ok=True)
    for name in ("web", "public", "ipc"):
        (ROOT / name).mkdir(exist_ok=True)
    (ROOT / "web/index.html").write_text('''<!doctype html><html><head>
<title>Local CTF Profiling Lab</title><meta name="generator" content="CTF Profiler Lab 1.0">
</head><body><h1>Local CTF Profiling Lab</h1><p>Owned live protocol target.</p>
<a href="/challenge.txt">Find the web flag</a></body></html>''')
    (ROOT / "web/index.html").write_text('''<!doctype html><html><head>
<title>Local CTF Profiling Lab</title><meta name="generator" content="CTF Profiler Lab 1.0">
</head><body><h1>Local CTF Profiling Lab</h1><p>Owned intentionally vulnerable lab.</p>
<a href="/challenge.txt">Web flag</a><a href="/item?id=1">Item lookup</a>
<a href="/echo?q=hello">Greeting</a><a href="/openapi.json">API definition</a>
<form action="/echo" method="get"><input name="q" value="hello"><button>Greet</button></form>
</body></html>''')
    (ROOT / "web/.git").mkdir(exist_ok=True)
    (ROOT / "web/.git/config").write_text("[core]\nrepositoryformatversion = 0\n[remote \"origin\"]\nurl = https://example.invalid/owned-ctf-demo.git\n")
    (ROOT / "web/challenge.txt").write_text("CTF{web_service_profiled}\n")
    (ROOT / "web/robots.txt").write_text("User-agent: *\nDisallow: /challenge.txt\n")
    for name, content in (("flag.txt", "CTF{guest_share_profiled}\n"),
                          ("README.txt", "Owned local lab. This guest share is read-only.\n")):
        file = ROOT / "public" / name
        if not file.exists():
            file.write_text(content)
        file.chmod(0o444)
    # Enforce at the filesystem too: this Impacket version accepts the share
    # option but does not consistently reject writes based on that option.
    (ROOT / "public").chmod(0o555)
    (ROOT / "ipc").chmod(0o555)
    if not (ROOT / "tls.key").exists():
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "profiler-lab.ctf.invalid")])
        now = datetime.datetime.now(datetime.timezone.utc)
        cert = (x509.CertificateBuilder().subject_name(subject).issuer_name(subject)
                .public_key(key.public_key()).serial_number(x509.random_serial_number())
                .not_valid_before(now - datetime.timedelta(minutes=5))
                .not_valid_after(now + datetime.timedelta(days=30))
                .add_extension(x509.SubjectAlternativeName([
                    x509.IPAddress(ipaddress.ip_address(ADDRESS)),
                    x509.DNSName("profiler-lab.ctf.invalid")]), critical=False)
                .sign(key, hashes.SHA256()))
        (ROOT / "tls.key").write_bytes(key.private_bytes(serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
        (ROOT / "tls.key").chmod(0o600)
        (ROOT / "tls.crt").write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    if not (ROOT / "ssh.key").exists():
        paramiko.RSAKey.generate(2048).write_private_key_file(str(ROOT / "ssh.key"))
        (ROOT / "ssh.key").chmod(0o600)


class Web(http.server.SimpleHTTPRequestHandler):
    def reply(self, body, status=200, content_type="text/html; charset=utf-8"):
        payload = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(payload)

    def do_GET(self):
        url = urlsplit(self.path)
        query = parse_qs(url.query, keep_blank_values=True)
        if url.path == "/echo":
            # Deliberate reflected XSS, confined to this unauthenticated lab.
            return self.reply("<!doctype html><html><body><h1>Greeting</h1><div>" + query.get("q", [""])[0] + "</div></body></html>")
        if url.path in ("/item", "/api/items"):
            # A fresh database per request; no host files, writes, or extensions.
            with sqlite3.connect(":memory:") as database:
                database.executescript("CREATE TABLE items(id INTEGER, name TEXT); INSERT INTO items VALUES(1, 'Demo item'),(2, 'CTF{sql_expression_confirmed}');")
                database.execute("PRAGMA query_only=ON")
                try:
                    rows = database.execute("SELECT name FROM items WHERE id=" + query.get("id", ["1"])[0]).fetchall()
                    data = {"items": [row[0] for row in rows]}
                    if url.path == "/api/items":
                        return self.reply(json.dumps(data), content_type="application/json")
                    return self.reply("<!doctype html><html><body><h1>Item lookup</h1>" + "<br>".join(data["items"]) + "</body></html>")
                except sqlite3.Error as error:
                    return self.reply("SQLite error: " + str(error), status=500)
        if url.path == "/openapi.json":
            scheme = "https" if self.server.server_port == 18443 else "http"
            spec = {"openapi": "3.0.3", "info": {"title": "Owned CTF API", "version": "1.0"},
                    "servers": [{"url": f"{scheme}://{ADDRESS}:{self.server.server_port}"}],
                    "paths": {"/api/items": {"get": {"operationId": "items", "parameters": [{"name": "id", "in": "query", "schema": {"type": "string"}, "example": "1"}], "responses": {"200": {"description": "Lab items"}}}}}}
            return self.reply(json.dumps(spec), content_type="application/json")
        return super().do_GET()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "web"), **kwargs)

    def end_headers(self):
        self.send_header("X-CTF-Lab", "owned-local-profiler")
        super().end_headers()

    def log_message(self, fmt, *args):
        logging.info("HTTP " + fmt, *args)


def web(port, tls=False):
    server = http.server.ThreadingHTTPServer((ADDRESS, port), Web)
    server.daemon_threads = True
    if tls:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.load_cert_chain(ROOT / "tls.crt", ROOT / "tls.key")
        server.socket = context.wrap_socket(server.socket, server_side=True)
    server.serve_forever()


def ssh_client(client):
    transport = paramiko.Transport(client)
    transport.banner_timeout = 10
    transport.auth_timeout = 10
    transport.add_server_key(paramiko.RSAKey.from_private_key_file(str(ROOT / "ssh.key")))
    try:
        # Default ServerInterface rejects every login and channel request.
        transport.start_server(server=paramiko.ServerInterface())
        deadline = time.monotonic() + 15
        while transport.is_active() and time.monotonic() < deadline:
            time.sleep(0.1)
    except (EOFError, OSError, paramiko.SSHException):
        pass
    finally:
        transport.close()


def ssh():
    listener = socket.create_server((ADDRESS, 12222), backlog=32)
    while True:
        client, _ = listener.accept()
        threading.Thread(target=ssh_client, args=(client,), daemon=True).start()


def smb():
    # Default IPC$ resolves filesystem requests against cwd. Keep it empty;
    # retaining the empty share path also preserves Impacket named-pipe RPC.
    os.chdir(ROOT / "ipc")
    server = SimpleSMBServer(listenAddress=ADDRESS, listenPort=445)
    config = server.getServer().getServerConfig()
    config.set("global", "server_name", "CTFPROFILER")
    config.set("global", "server_domain", "WORKGROUP")
    config.set("global", "server_os", "Impacket CTF Lab")
    server.setSMB2Support(True)
    server.setSMBChallenge("")
    server.addShare("public", str(ROOT / "public"), "Owned CTF read-only files", readOnly="yes")
    server.start()


def dns_reply(data):
    try:
        query = dns.message.from_wire(data)
        response = dns.message.make_response(query)
        response.flags |= dns.flags.AA
        for question in query.question:
            name = question.name.to_text().lower()
            if name == "2.0.0.127.in-addr.arpa." and question.rdtype == dns.rdatatype.PTR:
                response.answer.append(dns.rrset.from_text(name, 60, "IN", "PTR", "profiler-lab.ctf.invalid."))
            elif name == "profiler-lab.ctf.invalid." and question.rdtype == dns.rdatatype.A:
                response.answer.append(dns.rrset.from_text(name, 60, "IN", "A", ADDRESS))
            else:
                response.set_rcode(dns.rcode.NXDOMAIN)
        return response.to_wire()
    except Exception:
        return None


class DNSUDP(socketserver.BaseRequestHandler):
    def handle(self):
        data, sock = self.request
        response = dns_reply(data)
        if response:
            sock.sendto(response, self.client_address)


class DNSTCP(socketserver.StreamRequestHandler):
    def handle(self):
        self.connection.settimeout(5)
        try:
            size = self.rfile.read(2)
            if len(size) != 2:
                return
            response = dns_reply(self.rfile.read(int.from_bytes(size, "big")))
            if response:
                self.wfile.write(len(response).to_bytes(2, "big") + response)
        except OSError:
            pass


def dns_server(tcp):
    kind = socketserver.ThreadingTCPServer if tcp else socketserver.ThreadingUDPServer
    kind.allow_reuse_address = True
    kind.daemon_threads = True
    with kind((ADDRESS, 53), DNSTCP if tcp else DNSUDP) as server:
        server.serve_forever()


def main():
    if os.geteuid() == 0:
        raise SystemExit("Run as a normal user with CAP_NET_BIND_SERVICE, not root")
    logging.basicConfig(level=logging.WARNING)
    logging.getLogger("paramiko").setLevel(logging.CRITICAL)
    prepare()
    children = [multiprocessing.Process(target=fn, args=args) for fn, args in (
        (web, (18080,)), (web, (18443, True)), (ssh, ()), (smb, ()),
        (dns_server, (True,)), (dns_server, (False,)))]
    for child in children:
        child.start()
    def stop(*_):
        for child in children:
            if child.is_alive():
                child.terminate()
        for child in children:
            child.join(timeout=3)
        raise SystemExit(0)
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    print("Owned CTF services listening only on " + ADDRESS, flush=True)
    while all(child.is_alive() for child in children):
        time.sleep(1)
    stop()


if __name__ == "__main__":
    main()
