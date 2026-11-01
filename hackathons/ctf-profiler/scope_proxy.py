"""Local forward proxy that permits connections only to discovered target ports."""
import http.client
import http.server
import ipaddress
import select
import socket
import threading
from urllib.parse import urlsplit


class TargetProxy:
    def __init__(self, target, ports):
        self.target = ipaddress.ip_address(target)
        self.ports = set(ports)
        self.blocked = []
        owner = self

        class Handler(http.server.BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass

            def allowed(self, host, port):
                try:
                    permitted = ipaddress.ip_address(host) == owner.target and port in owner.ports
                except ValueError:
                    permitted = False
                if not permitted:
                    if len(owner.blocked) < 100:
                        owner.blocked.append({"host": str(host), "port": port})
                    self.send_error(403, "Destination outside the assigned target")
                return permitted

            def do_CONNECT(self):
                try:
                    destination = urlsplit("//" + self.path)
                    port = destination.port or 443
                    if not self.allowed(destination.hostname, port):
                        return
                    with socket.create_connection((str(owner.target), port), timeout=10) as upstream:
                        self.send_response(200, "Connection established")
                        self.end_headers()
                        sockets = (self.connection, upstream)
                        while True:
                            readable, _, _ = select.select(sockets, [], [], 20)
                            if not readable:
                                break
                            for source in readable:
                                data = source.recv(65536)
                                if not data:
                                    return
                                (upstream if source is self.connection else self.connection).sendall(data)
                except (OSError, ValueError):
                    pass

            def forward(self):
                upstream = None
                try:
                    url = urlsplit(self.path)
                    if url.scheme != "http" or url.username or url.password:
                        self.send_error(400, "Expected an unauthenticated HTTP target URL")
                        return
                    port = url.port or 80
                    if not self.allowed(url.hostname, port):
                        return
                    size = int(self.headers.get("Content-Length", "0"))
                    if not 0 <= size <= 1024 * 1024 or self.headers.get("Transfer-Encoding"):
                        self.send_error(413, "Request size unsupported")
                        return
                    body = self.rfile.read(size) if size else None
                    headers = {k: v for k, v in self.headers.items()
                               if k.lower() not in ("connection", "proxy-connection", "proxy-authorization", "transfer-encoding")}
                    headers["Connection"] = "close"
                    upstream = http.client.HTTPConnection(str(owner.target), port, timeout=10)
                    path = url.path or "/"
                    if url.query:
                        path += "?" + url.query
                    upstream.request(self.command, path, body, headers)
                    response = upstream.getresponse()
                    payload = response.read(1024 * 1024 + 1)
                    if len(payload) > 1024 * 1024:
                        self.send_error(502, "Target response exceeds proxy limit")
                        return
                    self.send_response_only(response.status, response.reason)
                    for key, value in response.getheaders():
                        if key.lower() not in ("connection", "transfer-encoding", "content-length"):
                            self.send_header(key, value)
                    self.send_header("Content-Length", str(len(payload)))
                    self.send_header("Connection", "close")
                    self.end_headers()
                    if self.command != "HEAD":
                        self.wfile.write(payload)
                except (OSError, ValueError, http.client.HTTPException):
                    try:
                        self.send_error(502, "Target request failed")
                    except OSError:
                        pass
                finally:
                    if upstream:
                        upstream.close()

            do_GET = do_HEAD = do_POST = do_OPTIONS = do_PUT = do_DELETE = do_PATCH = forward

        self.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    @property
    def url(self):
        return "http://127.0.0.1:" + str(self.server.server_port)

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *_):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)


def in_scope(url, target, ports):
    try:
        parsed = urlsplit(url)
        return (len(url) <= 4096 and parsed.scheme in ("http", "https")
                and not parsed.username and not parsed.password
                and ipaddress.ip_address(parsed.hostname) == ipaddress.ip_address(target)
                and (parsed.port or (443 if parsed.scheme == "https" else 80)) in ports)
    except (ValueError, TypeError):
        return False
