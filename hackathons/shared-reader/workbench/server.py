"""Loopback-only filesystem workbench; all sources are read-only."""
import argparse
import base64
import fcntl
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import secrets
import threading
from urllib.parse import parse_qs, unquote, urlsplit

from bridge import Bridge, Local, atomic_json, load, provider

HERE = Path(__file__).resolve().parent


def serve(config, port):
    bridge = Bridge(config)
    owner=(bridge.project/'reader-bridge.lock').open('a')
    fcntl.flock(owner,fcntl.LOCK_EX|fcntl.LOCK_NB)
    for temporary in bridge.project.glob('.reader-spool-*.partial'):
        if not temporary.is_symlink():temporary.unlink()
    token = secrets.token_urlsafe(32)
    origin = f'http://127.0.0.1:{port}'
    requests=threading.BoundedSemaphore(config.get('max_requests',8))
    controls=threading.BoundedSemaphore(2)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            pass

        def send(self, data, status=200, content_type='application/json', sandbox=False):
            if not isinstance(data, bytes):
                data = json.dumps(data, ensure_ascii=True).encode()
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'no-referrer')
            policy = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'; base-uri 'none'" if sandbox else "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'"
            self.send_header('Content-Security-Policy', policy)
            self.end_headers()
            self.wfile.write(data)

        def guard(self, post=False):
            if self.headers.get('Host') != f'127.0.0.1:{port}':
                raise PermissionError('Unexpected Host')
            supplied = self.headers.get('Origin')
            if supplied and supplied != origin:
                raise PermissionError('Cross-origin requests are disabled')
            if post and (supplied != origin or self.headers.get('X-Reader-Token') != token):
                raise PermissionError('Origin and reader token required')

        def dispatch(self, post=False):
            self.guard(post)
            url = urlsplit(self.path)
            query = {k: v[-1] for k, v in parse_qs(url.query).items()}
            source_id = query.get('source', config['default_source'])
            if source_id not in bridge.sources:
                raise ValueError('Unknown source')
            source = bridge.sources[source_id]
            if post:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 8192:
                    raise ValueError('Invalid request length')
                data = json.loads(self.rfile.read(length))
                if url.path == '/api/control':
                    if type(data.get('running')) is not bool:
                        raise ValueError('running must be boolean')
                    with bridge.lock:
                        atomic_json(bridge.control_path, dict(running=data['running'], pause_policy='finish-bounded-step'))
                    return self.send(dict(status='ok', running=data['running']))
                if url.path == '/api/scope':
                    if type(data.get('running')) is not bool or type(data.get('recursive', True)) is not bool:
                        raise ValueError('running and recursive must be booleans')
                    return self.send(dict(id=bridge.scope(source_id, data['path'], data['running'], data.get('recursive', True))))
                if url.path == '/api/snapshot':
                    return self.send(bridge.snapshot(source_id, data['path']))
                if url.path == '/api/dismiss':
                    with bridge.lock:
                        if data['id'] not in bridge.state['dismissed']:
                            bridge.state['dismissed'].append(data['id'])
                        bridge.save()
                    return self.send(dict(status='ok'))
                raise FileNotFoundError(url.path)
            if url.path == '/':
                return self.send((HERE / 'explorer.html').read_bytes(), content_type='text/html; charset=utf-8')
            if url.path == '/reader-link.js':
                return self.send((HERE / 'reader-link.js').read_bytes(), content_type='text/javascript; charset=utf-8')
            if url.path == '/api/session':
                connected, connection_error = True, None
                try:
                    with provider(source):
                        pass
                except Exception as error:
                    connected, connection_error = False, str(error)
                return self.send(dict(session_id=source_id, connection_id=source_id, fixture=source['root'],
                                      project_id=config.get('project_id'),
                                      mode=source['transport'], connected=connected, connection_error=connection_error, token=token,
                                      capabilities=['list', 'preview'] + (['complete-snapshot', 'watch'] if source['transport'] == 'sftp' else []),
                                      sources=[dict(id=k, label=v['label']) for k, v in bridge.sources.items()]))
            if url.path == '/api/status':
                return self.send(bridge.status())
            if url.path in ('/api/list', '/api/preview'):
                with provider(source) as remote:
                    if url.path == '/api/list':
                        entries = remote.entries(query['path'])
                        return self.send(dict(path=query['path'], uid=0, cwd=source['root'], status='ok', entries=entries, truncated=False))
                    data, attrs, truncated = remote.read(query['path'], preview=True)
                    return self.send(dict(status='ok', data_b64=base64.b64encode(data).decode(), truncated=truncated,
                                          size=attrs.st_size, coverage='preview-only' if truncated else 'complete'))
            if url.path == '/api/result':
                # Only content objects or exported recovered text may open as derived tabs.
                relative = query['path']
                parts = Path(relative).parts
                valid = (len(parts) == 3 and parts[:2] == ('ciphey', 'artifacts') and parts[-1].endswith('.bin')) or (len(parts) == 4 and parts[:2] == ('password-crackers', 'jobs') and parts[-1] == 'recovered.txt')
                if not valid:
                    raise PermissionError('Not a derived result path')
                with Local(dict(root=str(bridge.project))) as local:
                    data, _, truncated = local.read(str(bridge.project / relative), preview=True)
                return self.send(dict(status='ok', data_b64=base64.b64encode(data).decode(), truncated=truncated))
            if url.path.startswith('/reports/'):
                relative = unquote(url.path[len('/reports/'):])
                # Reports are a separate sandboxed navigation, never remote content as HTML.
                if not relative or '..' in Path(relative).parts:
                    raise PermissionError('Invalid report path')
                with Local(dict(root=str(bridge.project))) as local:
                    data, _, _ = local.read(str(bridge.project / relative))
                return self.send(data, content_type=mimetypes.guess_type(relative)[0] or 'application/octet-stream', sandbox=True)
            raise FileNotFoundError(url.path)

        def handle_request(self, post=False):
            capacity=controls if post and urlsplit(self.path).path=='/api/control' else requests
            if not capacity.acquire(blocking=False):
                return self.send(dict(status='busy',error=dict(message='Workbench request capacity reached; retry shortly')),status=503)
            try:
                self.dispatch(post)
            except Exception as error:
                code = 403 if isinstance(error, PermissionError) else 404 if isinstance(error, FileNotFoundError) else 400 if isinstance(error, (ValueError, KeyError)) else 503
                self.send(dict(status='error', error=dict(errno=getattr(error, 'errno', None), message=str(error), type=type(error).__name__)), status=code)
            finally:capacity.release()

        def do_GET(self):
            self.handle_request()

        def do_POST(self):
            self.handle_request(True)

    class WorkbenchServer(ThreadingHTTPServer):
        request_queue_size=64
    server = WorkbenchServer(('127.0.0.1', port), Handler)
    worker = threading.Thread(target=bridge.loop, daemon=True)
    worker.start()
    print(origin, flush=True)
    try:
        server.serve_forever()
    finally:
        bridge.stop.set()
        worker.join(timeout=10)
        server.server_close()
        owner.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    parser.add_argument('--port', type=int, default=32965)
    args = parser.parse_args()
    serve(load(args.config, {}), args.port)
