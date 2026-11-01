#!/usr/bin/env python3
"""Enforce an explicit project budget; clean only designated reproducible files."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import shutil
import sys
import time

PROTECTED = {'.git', '.venv', '.runtime', '.tools', '.state', '.desktop-profile'}


def measure(root):
    allocated = logical = 0
    seen = set()
    for base, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = [d for d in dirs if not Path(base, d).is_symlink() and d != 'lost+found']
        for name in files:
            try:
                st = Path(base, name).lstat()
            except (FileNotFoundError, PermissionError):
                continue
            key = st.st_dev, st.st_ino
            if key not in seen:
                seen.add(key)
                allocated += st.st_blocks * 512
                logical += st.st_size
    return allocated, logical


def usage(root, policy):
    allocated, logical = measure(root)
    fs = os.statvfs(root)
    used = (fs.f_blocks - fs.f_bfree) * fs.f_frsize
    return {'allocated_bytes': allocated, 'logical_bytes': logical,
            'filesystem_used_bytes': used, 'filesystem_available_bytes': fs.f_bavail * fs.f_frsize,
            'limit_bytes': int(policy['limit_bytes']), 'mounted': os.path.ismount(root)}


def safe_cache(root, relative):
    path = Path(relative)
    if path.is_absolute() or '..' in path.parts or not path.parts:
        raise ValueError('Unsafe cleanup path')
    if path.parts[0] != '.cache' and path.parts[:2] != ('.artifacts', 'disposable'):
        raise ValueError('Cleanup must be a cache or explicitly disposable artifact path')
    current = root
    for part in path.parts:
        current /= part
        if current.is_symlink():
            raise ValueError('Refusing symlink in cleanup path')
    return current


def cleanup(root, policy):
    removed = []
    for relative in policy.get('cleanup_paths', []):
        path = safe_cache(root, relative)
        if not path.exists():
            continue
        for item in sorted(path.iterdir(), key=lambda p: p.lstat().st_mtime):
            if item.is_symlink() or time.time() - item.lstat().st_mtime < 600:
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink(missing_ok=True)
            removed.append(str(item.relative_to(root)))
    for base, dirs, _files in os.walk(root, followlinks=False):
        dirs[:] = [d for d in dirs if d not in PROTECTED and not Path(base, d).is_symlink()]
        if '__pycache__' in dirs:
            path = Path(base, '__pycache__')
            shutil.rmtree(path)
            dirs.remove('__pycache__')
            removed.append(str(path.relative_to(root)))
    return removed


def check(root, policy):
    if policy.get('require_mount') and not os.path.ismount(root):
        raise RuntimeError('Capped project filesystem is not mounted; refusing writes')
    report = usage(root, policy)
    trigger = int(policy['limit_bytes'] * 0.9)
    used = max(report['allocated_bytes'], report['filesystem_used_bytes'] if report['mounted'] else 0)
    report['removed'] = []
    if used >= trigger or report['filesystem_available_bytes'] < 100_000_000:
        report['removed'] = cleanup(root, policy)
        report.update(usage(root, policy))
    report['ok'] = report['allocated_bytes'] < policy['limit_bytes'] and report['filesystem_available_bytes'] >= 100_000_000
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--watch', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    policy = json.loads((root / '.project-storage.json').read_text())
    lockdir = Path(os.environ.get('XDG_RUNTIME_DIR', '/tmp'))
    lockpath = lockdir / ('project-storage-' + str(root).replace('/', '_') + '.lock')
    with lockpath.open('w') as lock:
        previous = None
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX)
                report = check(root, policy)
                if not args.watch or report['removed'] or not report['ok'] or previous is None:
                    print(json.dumps(report), flush=True)
                previous = report
                if not args.watch:
                    return 0 if report['ok'] else 2
            except (OSError, ValueError, RuntimeError) as error:
                print(str(error), file=sys.stderr, flush=True)
                if not args.watch:
                    return 2
            finally:
                fcntl.flock(lock, fcntl.LOCK_UN)
            if args.watch:
                time.sleep(5)


if __name__ == '__main__':
    raise SystemExit(main())
