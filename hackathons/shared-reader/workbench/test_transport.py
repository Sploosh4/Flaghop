"""Local, synthetic SSH fixture checks. No challenges or external targets."""
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from bridge import Bridge, CoverageError, Local, SFTP, atomic_json, provider
import paramiko

HERE = Path(__file__).resolve().parent
CONFIG = json.loads((HERE / 'private/config.json').read_text())


def remote_python(code):
    return subprocess.check_output(['lxc', 'exec', 'reader-ssh-fixture', '--', 'python3', '-c', code], text=True)


class TransportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.config = dict(CONFIG, project=self.temp.name)
        self.bridge = Bridge(self.config)

    def test_pinned_host_key_and_complete_binary_read(self):
        with provider(CONFIG['sources']['ssh-fixture']) as remote:
            data, _, truncated = remote.read('/files/binary.bin')
            self.assertEqual(data, bytes(range(256)))
            self.assertFalse(truncated)

    def test_unknown_host_key_rejected(self):
        path = Path(self.temp.name) / 'empty_hosts'
        path.touch()
        config = dict(CONFIG['sources']['ssh-fixture'], known_hosts=str(path))
        with self.assertRaises(paramiko.SSHException):
            with SFTP(config):
                pass

    def test_wrong_host_key_rejected(self):
        path = Path(self.temp.name) / 'wrong_hosts'
        key = paramiko.RSAKey.generate(2048)
        path.write_text('[127.0.0.1]:32222 ' + key.get_name() + ' ' + key.get_base64() + '\n')
        with self.assertRaises(paramiko.BadHostKeyException):
            with SFTP(dict(CONFIG['sources']['ssh-fixture'], known_hosts=str(path))):
                pass

    def test_wrong_client_key_rejected(self):
        key = Path(self.temp.name) / 'wrong_key'
        paramiko.RSAKey.generate(2048).write_private_key_file(str(key))
        with self.assertRaises(paramiko.AuthenticationException):
            with SFTP(dict(CONFIG['sources']['ssh-fixture'], key=str(key))):
                pass

    def test_remote_write_denied_by_server(self):
        with provider(CONFIG['sources']['ssh-fixture']) as remote:
            with self.assertRaises(OSError):
                remote.sftp.open('/files/prohibited-write', 'wb')

    def test_preview_is_distinct_from_full_snapshot(self):
        with provider(CONFIG['sources']['ssh-fixture']) as remote:
            preview, _, truncated = remote.read('/files/late-record.log', preview=True)
            full, _, _ = remote.read('/files/late-record.log')
            self.assertEqual(len(preview), 4096)
            self.assertTrue(truncated)
            self.assertGreater(len(full), 4096)
            self.assertIn(b'fixture=', full[4096:])
            self.assertNotIn(b'fixture=', preview)

    def test_traversal_and_symlink_refused(self):
        with provider(CONFIG['sources']['ssh-fixture']) as remote:
            for path in ('/etc/passwd', '/files/../etc/passwd', '/files/outside-link'):
                with self.assertRaises((PermissionError, FileNotFoundError)):
                    remote.read(path)

    def test_permissions_and_oversize_are_not_snapshots(self):
        for path, error in [('/files/denied.txt', OSError), ('/files/too-large.bin', CoverageError)]:
            with self.assertRaises(error):
                self.bridge.snapshot('ssh-fixture', path)
        self.assertEqual(self.bridge.state['versions'], {})

    def test_unusual_name_provenance_and_dedup(self):
        path = "/files/spaces 'quotes' café\n.txt"
        first = self.bridge.snapshot('ssh-fixture', path)
        second = self.bridge.snapshot('ssh-fixture', path)
        self.assertEqual(first['snapshot_id'], second['snapshot_id'])
        self.assertEqual(len(self.bridge.state['versions']), 1)
        self.assertIn('%0A', first['source_uri'])
        self.assertEqual(first['sha256'], hashlib.sha256((Path(self.temp.name) / first['local_path']).read_bytes()).hexdigest())
        restarted = Bridge(self.config)
        self.assertEqual(restarted.state['versions'], self.bridge.state['versions'])

    def test_same_size_preserved_mtime_creates_new_version(self):
        remote_python("from pathlib import Path; p=Path('/srv/reader-jail/files/version.txt');p.write_bytes(b'first-version')")
        first = self.bridge.snapshot('ssh-fixture', '/files/version.txt')
        remote_python("import os;from pathlib import Path;p=Path('/srv/reader-jail/files/version.txt');s=p.stat();p.write_bytes(b'other-version');os.utime(p,ns=(s.st_atime_ns,s.st_mtime_ns))")
        second = self.bridge.snapshot('ssh-fixture', '/files/version.txt')
        self.assertNotEqual(first['sha256'], second['sha256'])
        self.assertEqual(first['mtime'], second['mtime'])
        self.assertEqual((Path(self.temp.name) / first['local_path']).read_bytes(), b'first-version')
        self.assertEqual((Path(self.temp.name) / second['local_path']).read_bytes(), b'other-version')

    def test_paused_scope_does_no_collection_but_browsing_works(self):
        key = self.bridge.scope('ssh-fixture', '/files', True)
        self.bridge.poll(key)
        self.assertFalse(self.bridge.state['versions'])
        with provider(CONFIG['sources']['ssh-fixture']) as remote:
            self.assertTrue(remote.entries('/files'))

    def test_partial_inventory_keeps_history_and_reports_gaps(self):
        key = self.bridge.scope('ssh-fixture', '/files', True)
        atomic_json(self.bridge.control_path, dict(running=True))
        self.bridge.poll(key)
        state = self.bridge.state['scopes'][key]
        self.assertEqual(state['connection_state'], 'connected')
        self.assertEqual(state['coverage'], 'partial')
        self.assertTrue(any('denied.txt' in e.get('path', '') for e in state['errors']))
        self.assertGreaterEqual(len(self.bridge.state['versions']), 5)
        versions = dict(self.bridge.state['versions'])
        broken = dict(self.bridge.sources['ssh-fixture'], port=32223)
        with patch.dict(self.bridge.sources, {'ssh-fixture': broken}):
            self.bridge.poll(key)
        self.assertEqual(self.bridge.state['scopes'][key]['connection_state'], 'disconnected')
        self.assertEqual(versions, self.bridge.state['versions'])
        self.bridge.poll(key)
        self.assertEqual(self.bridge.state['scopes'][key]['connection_state'], 'connected')

    def test_changed_during_read_not_submitted(self):
        path = Path(self.temp.name) / 'changing.txt'
        path.write_bytes(b'aaaa')
        local = Local(dict(root=self.temp.name))
        actual = local.lstat
        counter = 0
        def changing(name):
            nonlocal counter
            counter += 1
            # checked() reads components first; mutate only when the stream closes.
            return actual(name)
        real_open = local.openfile
        class ChangingStream:
            def __enter__(self):
                self.stream = real_open(str(path))
                return self.stream
            def __exit__(self, *args):
                self.stream.close()
                path.write_bytes(b'larger')
        with patch.object(local, 'openfile', return_value=ChangingStream()):
            with self.assertRaisesRegex(CoverageError, 'changed-during-read'):
                local.read(str(path))


if __name__ == '__main__':
    unittest.main(verbosity=2)
