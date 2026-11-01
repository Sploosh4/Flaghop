"""Real ENOSPC/EROFS on a private 64 KiB RAM filesystem, never the host disk."""
import sys,subprocess,tempfile,json,errno
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'hash-watch'))
from hash_watch.store import atomic_bytes
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);subprocess.run(['mount','-t','tmpfs','-o','size=64k','tmpfs',folder],check=True)
    try:
        p=root/'result';atomic_bytes(p,b'previous complete result')
        try:atomic_bytes(p,b'x'*131072)
        except OSError as error:full=error.errno
        assert p.read_bytes()==b'previous complete result'
        assert not list(root.glob('.reader-write-*'))
        subprocess.run(['mount','-t','tmpfs','-o','remount,ro','tmpfs',folder],check=True)
        try:atomic_bytes(p,b'replacement')
        except OSError as error:readonly=error.errno
        assert p.read_bytes()==b'previous complete result'
        subprocess.run(['mount','-t','tmpfs','-o','remount,rw','tmpfs',folder],check=True)
        atomic_bytes(p,b'complete after recovery');assert p.read_bytes()==b'complete after recovery'
        print(json.dumps(dict(full_errno=full,readonly_errno=readonly,old_bytes_preserved=True,retry_succeeded=True,filesystem='private 64KiB tmpfs')))
    finally:subprocess.run(['umount',folder],check=True)
