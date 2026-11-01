#!/usr/bin/env python3
"""Record the actual exit status and bounded output of a command, without a shell."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import selectors
import signal
import subprocess
import sys
import time

CAP = 256 * 1024


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sources(project):
    paths = set(project.glob('*.py')) | set((project / 'lab').glob('*.py')) | set((project / 'lab').glob('*.sh'))
    return {str(p.relative_to(project)): digest(p) for p in sorted(paths)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--category', required=True)
    parser.add_argument('--fixture', required=True)
    parser.add_argument('--expect-exit', type=int, default=0)
    parser.add_argument('--timeout', type=float, default=1800)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command or args.timeout <= 0:
        parser.error('Supply a command and positive timeout')
    output = args.output.resolve()
    project = args.project.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    # Reserve this receipt before execution; never overwrite historical evidence.
    with output.open('x') as reservation:
        reservation.write('{}\n')
    started_at = datetime.now(timezone.utc).isoformat()
    before = sources(project)
    start = time.monotonic()
    buffers = {'stdout': bytearray(), 'stderr': bytearray()}
    counts = {'stdout': 0, 'stderr': 0}
    timed_out = False
    error = None
    process = None
    interrupted = False
    try:
        process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, start_new_session=True)
        with selectors.DefaultSelector() as selector:
            for stream, name in ((process.stdout, 'stdout'), (process.stderr, 'stderr')):
                os.set_blocking(stream.fileno(), False)
                selector.register(stream, selectors.EVENT_READ, name)
            while selector.get_map() or process.poll() is None:
                if time.monotonic() - start > args.timeout:
                    timed_out = True
                    os.killpg(process.pid, signal.SIGKILL)
                    break
                for key, _ in selector.select(0.05):
                    chunk = os.read(key.fileobj.fileno(), 65536)
                    if not chunk:
                        selector.unregister(key.fileobj)
                        key.fileobj.close()
                        continue
                    name = key.data
                    counts[name] += len(chunk)
                    buffers[name].extend(chunk[:max(0, CAP - len(buffers[name]))])
        process.wait(timeout=5)
    except KeyboardInterrupt:
        interrupted = True
        error = 'Recorder interrupted; child process group stopped'
    except OSError as exc:
        error = str(exc)
    finally:
        if process is not None:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait(timeout=5)
            for stream in (process.stdout, process.stderr):
                if stream and not stream.closed:
                    stream.close()
    code = process.returncode if process is not None else None
    logs = {}
    for name, data in buffers.items():
        path = output.with_name(output.name + '.' + name)
        with path.open('xb') as stream:
            stream.write(data)
        logs[name] = {'path': str(path), 'sha256': digest(path),
                      'captured_bytes': len(data), 'total_bytes': counts[name],
                      'truncated': counts[name] > len(data)}
    after = sources(project)
    report = {'schema_version': 1, 'category': args.category, 'fixture': args.fixture,
              'argv': command, 'cwd': str(Path.cwd()), 'started_at': started_at,
              'finished_at': datetime.now(timezone.utc).isoformat(),
              'duration_seconds': time.monotonic() - start, 'exit_code': code,
              'expected_exit_code': args.expect_exit, 'timed_out': timed_out,
              'interrupted': interrupted, 'error': error,
              'expected_result_observed': code == args.expect_exit and not timed_out and not error,
              'source_before': before, 'source_after': after,
              'source_unchanged': before == after, 'logs': logs}
    output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'receipt': str(output), 'exit_code': code,
                      'expected_result_observed': report['expected_result_observed']}))
    # Preserve the child's real status; an expected failure is still a failure exit.
    return 130 if interrupted else 124 if timed_out else 127 if code is None else code if code >= 0 else 128 - code


if __name__ == '__main__':
    raise SystemExit(main())
