#!/usr/bin/env python3
"""Real Chrome prerequisite through the production validator, Runner and workspace.

Only owned loopback HTTP/HTTPS fixtures are served. No scanner/full lab run is
started. Missing browser, crashes, false proof or incomplete cleanup cannot pass.
"""
import argparse
import contextlib
from datetime import datetime, timezone
import hashlib
from html import escape
from html.parser import HTMLParser
import http.server
import importlib
import json
import os
from pathlib import Path
import resource
import secrets
import ssl
import subprocess
import sys
import tempfile
import threading
from urllib.parse import parse_qs, urlsplit
from unittest.mock import patch

from record_command import sources

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class RootProof(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tokens = []

    def handle_starttag(self, tag, attrs):
        if tag == 'html':
            self.tokens.extend(v for k, v in attrs if k == 'data-profiler-proof')


@contextlib.contextmanager
def fixture(tls=None):
    requests = []

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            parts = urlsplit(self.path)
            query = parse_qs(parts.query)
            payload = query.get('q', [''])[0]
            positive = parts.path == '/positive'
            body = ('<!doctype html><html><head><title>Owned Chrome preflight</title></head><body>'
                    + (payload if positive else escape(payload)) + '</body></html>').encode()
            if len(requests) < 40:
                requests.append({'path': parts.path, 'nonce': query.get('nonce', [''])[0],
                                 'payload_sha256': hashlib.sha256(payload.encode()).hexdigest()})
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def log_message(self, *_):
            pass

    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    server.daemon_threads = True
    if tls:
        server.socket = tls.wrap_socket(server.socket, server_side=True)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_port, requests
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
        if thread.is_alive():
            raise RuntimeError('Owned fixture server failed to stop')


def check_case(core, staged, runner, workspace, browser, raw, proxy, scheme, port, positive, index):
    nonce = secrets.token_hex(8)
    name = 'positive' if positive else 'negative'
    url = f'{scheme}://127.0.0.1:{port}/{name}?q=initial&nonce={nonce}'
    expected_token = 'ctfproof' + hashlib.sha256((url + 'q').encode()).hexdigest()[:12]
    calls, findings = [], []

    def execute(identifier, tool, stage, command, trigger, artifact=None, format='jsonl', **extra):
        command = list(command)
        command[0] = browser
        spec = core.task(identifier, tool, command, trigger, 20,
                         stage=stage, isolated_tool_state=True, **extra)
        result = runner.execute(spec)
        calls.append(result)
        return result, []

    def confirmed(*args, **kwargs):
        findings.append({'args': args, 'kwargs': kwargs})

    staged.validate_browser(url, 'q', port, index, raw, execute, confirmed, proxy,
                            'preflight-candidate', workspace=workspace)
    errors = []
    if len(calls) != 1:
        errors.append('Expected one real browser invocation')
    parsed = RootProof()
    stdout = stderr = b''
    for result in calls:
        if result.get('status') != 'completed' or result.get('exit_code') != 0:
            errors.append(f"Browser did not complete: {result.get('status')}, exit {result.get('exit_code')}")
        for key in ('stdout', 'stderr'):
            if result.get(key):
                path = runner.output / result[key]
                data = path.read_bytes()
                if key == 'stdout':
                    stdout = data
                else:
                    stderr = data
        tmpdir = Path(result.get('scratch_root', result.get('tmpdir', '/unmeasured'))).resolve()
        profiles = [Path(arg.split('=', 1)[1]).resolve() for arg in result.get('command', [])
                    if arg.startswith('--user-data-dir=')]
        if not tmpdir.is_relative_to(workspace.root.resolve()):
            errors.append('Browser TMPDIR escaped the owned measured workspace')
        if len(profiles) != 1 or not profiles[0].is_relative_to(workspace.root.resolve()):
            errors.append('Browser profile escaped the owned measured workspace')
    parsed.feed(stdout.decode(errors='replace'))
    if positive:
        if parsed.tokens != [expected_token] or len(findings) != 1:
            errors.append('Fresh JavaScript proof missing from rendered HTML root or production validator')
    elif parsed.tokens or findings:
        errors.append('Negative fixture produced a false JavaScript proof')
    return {'case': scheme + '-' + name, 'url': url, 'status': 'fail' if errors else 'pass',
            'errors': errors, 'expected_token': expected_token, 'observed_tokens': parsed.tokens,
            'production_findings': findings, 'calls': calls,
            'socket_path_error': b'Socket path too long' in stderr,
            'stderr_excerpt': stderr.decode(errors='replace')[:1500]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--work-root', type=Path, help='New declared /tmp root; use at least the planned full-run root length')
    parser.add_argument('--control-overlong-socket', action='store_true',
                        help='Harness negative control: deliberately recreate an overlong socket TMPDIR; never release eligible')
    parser.add_argument('--then', nargs=argparse.REMAINDER,
                        help='Only after a real passing preflight, exec this full-run command without a shell')
    args = parser.parse_args()
    command = args.then[1:] if args.then and args.then[:1] == ['--'] else args.then
    if args.then is not None and not command:
        parser.error('--then needs a command')
    project, output = args.project.resolve(), args.output.resolve()
    artifacts = output.with_name(output.stem + '-artifacts')
    if output.exists() or artifacts.exists() or (args.work_root and args.work_root.exists()):
        parser.error('Use NEW output, artifacts and work paths; historical evidence is not overwritten')
    if args.work_root and not args.work_root.absolute().is_relative_to(Path('/tmp')):
        parser.error('Use a dedicated /tmp work root to exercise the affected path allocation')
    output.parent.mkdir(parents=True, exist_ok=True)
    artifacts.mkdir(mode=0o700)
    raw = artifacts / 'raw'
    raw.mkdir()
    before = sources(project)
    report = {'suite': 'chrome-browser-preflight', 'started_at': datetime.now(timezone.utc).isoformat(),
              'source_before': before, 'control_overlong_socket': args.control_overlong_socket,
              'release_eligible': False, 'complete': False, 'cases': [], 'errors': [],
              'evaluator_sha256': {'browser_preflight.py': sha(__file__), 'record_command.py': sha(HERE / 'record_command.py')}}
    workspace = None
    # Prevent deliberate Chrome crash controls from generating a large core file.
    prior_core = resource.getrlimit(resource.RLIMIT_CORE)
    resource.setrlimit(resource.RLIMIT_CORE, (0, prior_core[1]))
    try:
        sys.path.insert(0, str(project))
        core = importlib.import_module('ctf_profiler')
        staged = importlib.import_module('staged_workflow')
        browser = core.inventory().get('browser')
        if not browser:
            raise RuntimeError('Installed production browser missing; cannot prove browser works')
        report['browser'] = {'path': browser, 'resolved_path': str(Path(browser).resolve()), 'sha256': sha(browser)}
        with contextlib.ExitStack() as stack:
            fixture_dir = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix='cp-chrome-cert-')))
            cert, key = fixture_dir / 'fixture.crt', fixture_dir / 'fixture.key'
            generated = subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                  '-keyout', str(key), '-out', str(cert), '-days', '1', '-subj', '/CN=localhost'],
                  stdin=subprocess.DEVNULL, capture_output=True, timeout=15)
            if generated.returncode:
                raise RuntimeError('Could not generate owned HTTPS fixture certificate')
            tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            tls.load_cert_chain(cert, key)
            if args.work_root:
                work = args.work_root.absolute()
                work.mkdir(mode=0o700)
                stack.callback(work.rmdir)
            else:
                work = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix='cp-r3-rel-work-check-', dir='/tmp')))
            report['declared_work_root'] = str(work)
            report['declared_work_root_bytes'] = len(os.fsencode(work))
            env = {'TMPDIR': str(work), 'CTF_PROFILER_WORKSPACE': str(work)}
            stack.enter_context(patch.dict(os.environ, env))
            workspace = core.Workspace.create('browser-preflight')
            report['owned_root'] = str(workspace.root)
            runner = core.Runner(artifacts, {'browser': browser}, workspace=workspace)
            if args.control_overlong_socket:
                # Reproduce the original long per-task TMPDIR through real Chrome.
                original_path = workspace.path
                workspace.path = lambda *parts: original_path('browser', 'browser-xss-18443-0') if parts == ('b',) else original_path(*parts)
            http_port, http_requests = stack.enter_context(fixture())
            https_port, https_requests = stack.enter_context(fixture(tls))
            proxy = stack.enter_context(staged.TargetProxy('127.0.0.1', {http_port, https_port}))
            try:
                for index, (scheme, port, positive) in enumerate([
                    ('http', http_port, True), ('https', https_port, True),
                    ('http', http_port, False), ('https', https_port, False)]):
                    case = check_case(core, staged, runner, workspace, browser, raw, proxy.url,
                                      scheme, port, positive, index)
                    request_log = http_requests if scheme == 'http' else https_requests
                    nonce = parse_qs(urlsplit(case['url']).query)['nonce'][0]
                    case['fixture_request_observed'] = any(r['nonce'] == nonce for r in request_log)
                    if not case['fixture_request_observed']:
                        case['errors'].append('Browser did not fetch the fresh fixture URL')
                        case['status'] = 'fail'
                    report['cases'].append(case)
                report['blocked_proxy_destinations'] = proxy.blocked
            finally:
                report['cleanup'] = workspace.cleanup()
                if not report['cleanup']['success'] or report['cleanup']['leftovers']:
                    report['errors'].append('Owned browser workspace cleanup failed')
            report['fixture_servers_stopped'] = True  # Confirmed after ExitStack closes below.
    except Exception as exc:
        report['errors'].append(type(exc).__name__ + ': ' + str(exc))
        report['fixture_servers_stopped'] = False
        if workspace and workspace.root.exists():
            report['cleanup'] = workspace.cleanup()
    finally:
        resource.setrlimit(resource.RLIMIT_CORE, prior_core)
    report['source_after'] = sources(project)
    report['source_unchanged'] = before == report['source_after']
    report['finished_at'] = datetime.now(timezone.utc).isoformat()
    report['counts'] = {s: sum(c['status'] == s for c in report['cases']) for s in ('pass', 'fail')}
    report['counts']['unmeasured'] = 4 - len(report['cases'])
    report['complete'] = (report['counts'] == {'pass': 4, 'fail': 0, 'unmeasured': 0}
                          and not report['errors'] and report['source_unchanged']
                          and not args.control_overlong_socket)
    report['release_eligible'] = report['complete']
    report['launch_command'] = command
    report['launch_authorised'] = bool(command and report['complete'])
    report['artifacts'] = {str(p.relative_to(artifacts)): {'sha256': sha(p), 'bytes': p.stat().st_size}
                           for p in sorted(artifacts.rglob('*')) if p.is_file()}
    with output.open('x') as stream:
        json.dump(report, stream, indent=2)
        stream.write('\n')
    print(json.dumps({'report': str(output), 'counts': report['counts'],
                      'complete': report['complete'], 'errors': report['errors']}), flush=True)
    if report['launch_authorised']:
        # An exec preserves the launched command's real exit status. A failed or
        # deliberately broken browser never reaches this command.
        try:
            os.execvpe(command[0], command, os.environ.copy())
        except OSError as exc:
            report['launch_error'] = str(exc)
            report['launch_authorised'] = False
            output.write_text(json.dumps(report, indent=2) + '\n')
            return 127
    return 0 if report['complete'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
