import base64
from dataclasses import replace
import gzip
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
import zipfile
from unittest.mock import patch
from shared_reader.project import Project,Limits,sha
from shared_reader.transforms import layers
from shared_reader.watch import Environment
from hash_watch.detect import identify
from hash_watch.plans import prepare

ROOT=Path(__file__).resolve().parents[1]
MESSAGE=b'hello there general'
RECORD=b'md5="'+hashlib.md5(b'password').hexdigest().encode()+b'"'

def wait_for(check,seconds=40):
    deadline=time.monotonic()+seconds
    while time.monotonic()<deadline:
        result=check()
        if result:return result
        time.sleep(.1)
    raise AssertionError('Timed out waiting for shared-reader evidence')

class GraphTests(unittest.TestCase):
    def setUp(self):
        self.temporary=tempfile.TemporaryDirectory();self.addCleanup(self.temporary.cleanup)
        self.root=Path(self.temporary.name);self.path=self.root/'project';(self.path/'nmap').mkdir(parents=True)
        self.words=self.root/'seeds.txt';self.words.write_bytes(b'audit-seed\n')
        self.project=Project(self.path,wordlist=self.words)
        self.addCleanup(lambda:self.project.close() if self.project else None)
    def source(self,data,name='fixture.bin'):
        path=self.path/'nmap'/name;path.write_bytes(data)
        before=path.read_bytes(),path.stat().st_mtime_ns
        self.assertTrue(self.project.ingest(path));return path,before
    def drain(self,steps=150):
        for _ in range(steps):
            if not self.project.step():return
        self.fail('Shared queue failed to reach its bounded idle state')
    def content(self):return {p.read_bytes() for p in self.project.objects.glob('*.bin')}
    def recovered(self,password):
        return any(t['status']=='recovered' and t['recovered_hex']==password.hex() for t in self.project.hashes.store.targets())
    def test_base64_hex_double_base64_and_mixed_hashes_auto_recover(self):
        values=[base64.b64encode(RECORD),RECORD.hex().encode(),base64.b64encode(base64.b64encode(RECORD)),b'encoded="'+base64.b64encode(RECORD)+b'"\nsha1="'+hashlib.sha1(b'letmein').hexdigest().encode()+b'"']
        originals=[self.source(value,f'{i}.txt') for i,value in enumerate(values)];self.drain()
        self.assertTrue(self.recovered(b'password'));self.assertTrue(self.recovered(b'letmein'))
        for source,before in originals:
            self.assertEqual((source.read_bytes(),source.stat().st_mtime_ns),before)
            record=self.project.db.execute('SELECT id FROM sources WHERE path=?',(source.relative_to(self.path).as_posix(),)).fetchone()
            self.assertIsNotNone(self.project.db.execute('SELECT 1 FROM reach WHERE source=? AND node=?',(record['id'],sha(RECORD))).fetchone())
        self.assertTrue((self.path/'ciphey/artifacts'/f'{sha(RECORD)}.bin').is_file())
    def test_recovered_encoded_password_automatically_returns_to_decoder(self):
        password=base64.b64encode(MESSAGE)
        self.project.close();self.project=None;self.words.write_bytes(password+b'\n');self.project=Project(self.path,wordlist=self.words)
        self.source(b'md5="'+hashlib.md5(password).hexdigest().encode()+b'"');self.drain()
        self.assertTrue(self.recovered(password));self.assertIn(MESSAGE,self.content())
        self.assertTrue(self.project.db.execute("SELECT 1 FROM edges WHERE kind='recovered_password'").fetchone())
    def test_zip_member_encoded_text(self):
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as archive:archive.writestr('../../never-written.txt',base64.b64encode(MESSAGE))
        self.source(stream.getvalue());self.drain();self.assertIn(MESSAGE,self.content())
        self.assertFalse((self.root/'never-written.txt').exists())
        edge=self.project.db.execute("SELECT * FROM edges WHERE kind='zip_member'").fetchone()
        self.assertEqual(json.loads(edge['location'])['member'],'../../never-written.txt')
    def test_base64_encrypted_zip_recovers_password_and_reads_member(self):
        note=self.root/'note.txt';note.write_bytes(base64.b64encode(MESSAGE));archive=self.root/'locked.zip'
        subprocess.run(['zip','-q','-j','-P','letmein',str(archive),str(note)],check=True)
        source,before=self.source(base64.b64encode(archive.read_bytes()));self.drain()
        self.assertTrue(self.recovered(b'letmein'));self.assertIn(MESSAGE,self.content())
        self.assertEqual((source.read_bytes(),source.stat().st_mtime_ns),before)
    def test_output_content_watched_but_metadata_does_not_loop(self):
        path=self.path/'ciphey/versions/a/b/decoded/result.txt';path.parent.mkdir(parents=True);path.write_bytes(base64.b64encode(RECORD))
        self.assertTrue(self.project.ingest(path))
        for path in [self.path/'ciphey/index.html',self.path/'password-crackers/queue.json',self.path/'reader-report.json']:
            self.assertFalse(self.project.allowed(path))
        self.assertFalse(self.project.allowed(self.project.objects/'anything.bin'));self.drain();self.assertTrue(self.recovered(b'password'))
        self.assertFalse(self.project.allowed(self.path/'workspace.legion'))
        before=self.project.db.execute('SELECT COUNT(*) FROM sources').fetchone()[0];nodes=self.project.db.execute('SELECT COUNT(*) FROM nodes').fetchone()[0]
        for path in self.project.files():self.project.ingest(path)
        self.drain();self.assertEqual(self.project.db.execute('SELECT COUNT(*) FROM sources').fetchone()[0],before)
        self.assertEqual(self.project.db.execute('SELECT COUNT(*) FROM nodes').fetchone()[0],nodes)
    def test_duplicate_sources_inherit_existing_graph_without_reprocessing(self):
        path,_=self.source(base64.b64encode(RECORD));self.drain()
        counts=(self.project.db.execute('SELECT COUNT(*) FROM nodes').fetchone()[0],self.project.hashes.store.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0])
        self.source(path.read_bytes(),'copy.txt');self.drain()
        source=self.project.db.execute("SELECT id FROM sources WHERE path='nmap/copy.txt'").fetchone()['id']
        self.assertTrue(self.project.db.execute('SELECT 1 FROM reach WHERE source=? AND node=?',(source,sha(b'password'))).fetchone())
        self.assertEqual((self.project.db.execute('SELECT COUNT(*) FROM nodes').fetchone()[0],self.project.hashes.store.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0]),counts)
    def test_restart_replays_running_artifact_and_deduplicates_versions(self):
        source,_=self.source(base64.b64encode(base64.b64encode(RECORD)))
        self.project.db.execute("UPDATE nodes SET status='running'");self.project.db.commit();self.project.close();self.project=None
        self.project=Project(self.path,wordlist=self.words);self.assertFalse(self.project.ingest(source));self.drain();self.assertTrue(self.recovered(b'password'))
        before=self.project.hashes.store.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0];self.project.close();self.project=None
        self.project=Project(self.path,wordlist=self.words);self.drain()
        self.assertEqual(before,self.project.hashes.store.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0])
    def test_depth_count_and_byte_budgets_are_explicit(self):
        self.project.limits=replace(self.project.limits,max_depth=1,max_nodes=2,max_expanded_bytes=100);self.source(b'first')
        node=sha(b'first');child=self.project.offer(node,b'second','test',{});self.assertIsNotNone(child)
        self.assertIsNone(self.project.offer(child,b'third','test',{}));self.assertIsNone(self.project.offer(node,b'x'*101,'test',{}))
        self.assertEqual(self.project.db.execute('SELECT COUNT(*) FROM nodes').fetchone()[0],2)
        self.assertTrue(self.project.db.execute("SELECT 1 FROM events WHERE kind='source_expansion_limit'").fetchone())
    def test_cycles_are_bounded_and_provenance_survives(self):
        self.source(b'first');a=sha(b'first');b=self.project.offer(a,b'second','test',{})
        self.assertEqual(self.project.offer(b,b'first','test',{}),a);self.project.offer(a,b'first','identity',{})
        self.assertEqual(self.project.db.execute('SELECT COUNT(*) FROM nodes').fetchone()[0],2)
        self.assertEqual(self.project.db.execute('SELECT COUNT(*) FROM reach').fetchone()[0],2)
        self.assertTrue(self.project.db.execute("SELECT 1 FROM events WHERE kind='cycle_suppressed'").fetchone())
    def test_symlinks_fifo_owner_lock_and_tampering(self):
        outside=self.root/'outside';outside.write_bytes(RECORD);link=self.path/'nmap/link';link.symlink_to(outside)
        self.assertFalse(self.project.ingest(link));fifo=self.path/'nmap/fifo';os.mkfifo(fifo);self.assertFalse(self.project.ingest(fifo))
        with self.assertRaises(BlockingIOError):Project(self.path,wordlist=self.words)
        self.source(RECORD);node=self.project.objects/(sha(RECORD)+'.bin');node.chmod(0o600);node.write_bytes(b'tampered');self.project.step()
        self.assertEqual(self.project.db.execute('SELECT status FROM nodes WHERE id=?',(sha(RECORD),)).fetchone()[0],'error')
    def test_project_isolation(self):
        self.source(RECORD);otherpath=self.root/'other';otherpath.mkdir();other=Project(otherpath,wordlist=self.words)
        try:
            self.drain();self.assertEqual(other.hashes.store.targets(),[]);self.assertFalse(other.allowed(self.path/'nmap/fixture.bin'))
        finally:other.close()
    def test_empty_password_recovery_is_forwarded_as_empty_bytes(self):
        self.source(b'md5="'+hashlib.md5(b'').hexdigest().encode()+b'"');self.drain()
        self.assertTrue(self.recovered(b''));self.assertIn(b'',self.content())

    def test_shallower_source_revisits_previously_limited_expansion(self):
        self.project.limits=replace(self.project.limits,max_depth=1)
        encoded=base64.b64encode(RECORD)
        self.source(base64.b64encode(encoded));self.drain()
        self.assertFalse(self.recovered(b'password'))
        self.source(encoded,'shallower.txt');self.drain()
        self.assertTrue(self.recovered(b'password'))

    def test_wrong_regex_does_not_create_accepted_findings(self):
        self.project.close();self.project=None
        self.project=Project(self.path,wordlist=self.words,limits=Limits(regex='^IMPOSSIBLE_AUDIT_MARKER_936743$'))
        self.source(base64.b64encode(MESSAGE));self.drain()
        reports=[json.loads(p.read_text()) for p in (self.path/'ciphey').glob('versions/*/*/report.json')]
        self.assertFalse(any(r['findings'] for r in reports))
        self.assertTrue(any('checker_mismatch' in str(r) or 'rejected_candidate' in str(r) for r in reports))

    def test_malformed_bcrypt_and_checksum_are_not_auto_queued(self):
        import bcrypt
        malformed=bcrypt.hashpw(b'password',b'$2b$05$abcdefghijklmnopqrstuu')+b'EXTRA'
        self.assertFalse(any(c['format'] for c in identify(malformed)[0]))
        candidates,_=identify(b'{"checksum":{"md5":"'+hashlib.md5(b'password').hexdigest().encode()+b'"}}')
        self.assertEqual(len(candidates),1);self.assertIsNone(candidates[0]['format'])

    def test_oversize_source_is_recorded_without_being_processed(self):
        self.project.limits=replace(self.project.limits,max_file_bytes=10)
        self.source(b'x'*11)
        self.assertEqual(self.project.db.execute('SELECT status FROM sources').fetchone()[0],'skipped_size')
        self.assertEqual(self.project.db.execute('SELECT COUNT(*) FROM nodes').fetchone()[0],0)

    def test_explicit_format_resolution_keeps_source_link_and_continues(self):
        self.source(hashlib.md5(b'password').hexdigest().encode());self.drain()
        target=self.project.hashes.store.targets()[0]
        self.assertEqual(target['status'],'needs_format')
        resolved=self.project.hashes.resolve(target['id'],'md5');self.drain()
        self.assertTrue(self.recovered(b'password'))
        self.assertTrue(self.project.db.execute('SELECT 1 FROM target_nodes WHERE target=?',(resolved,)).fetchone())

    def test_native_outputs_have_exclusive_writer_locks(self):
        for tool in ('ciphey','password-crackers'):
            with (self.path/tool/'.lock').open('a') as contender:
                with self.assertRaises(BlockingIOError):
                    fcntl.flock(contender,fcntl.LOCK_EX|fcntl.LOCK_NB)
        other=self.root/'locked-project';(other/'password-crackers').mkdir(parents=True)
        with (other/'password-crackers/.lock').open('a') as owner:
            fcntl.flock(owner,fcntl.LOCK_EX|fcntl.LOCK_NB)
            with self.assertRaises(BlockingIOError):Project(other,wordlist=self.words)
        # Failed multi-lock acquisition releases both earlier locks.
        other_project=Project(other,wordlist=self.words);other_project.close()

class EnvironmentTests(unittest.TestCase):
    def test_project_rename_releases_old_owner_and_keeps_history(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);words=root/'seeds.txt';words.write_bytes(b'audit\n')
            original=root/'first';original.mkdir()
            env=Environment(root,wordlist=words)
            try:
                project=env.project_for(original)
                (original/'nmap').mkdir();(original/'nmap/input.txt').write_bytes(RECORD);project.ingest(original/'nmap/input.txt')
                original.rename(root/'renamed')
                renamed=env.project_for(root/'renamed')
                self.assertIsNotNone(renamed);self.assertNotIn('first',env.projects)
                self.assertEqual(renamed.db.execute('SELECT COUNT(*) FROM sources').fetchone()[0],1)
            finally:env.close()

class TransformTests(unittest.TestCase):
    def test_large_bundled_default_is_bounded_but_explicit_list_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);words=root/'password.lst';words.write_bytes(b'audit\n'*50001)
            with patch('hash_watch.plans.JOHN',root/'john'):
                plan=prepare(root/'default')
                manifest=json.loads((root/'default/plans'/plan/'manifest.json').read_text())
                self.assertTrue(manifest['default_seed_limit_applied']);self.assertEqual(manifest['used_seeds'],50000)
                with self.assertRaises(ValueError):prepare(root/'explicit',words)
    def test_gzip_and_base64_variants(self):
        encoded=base64.b64encode(MESSAGE)
        for value in [encoded.rstrip(b'='),b'\n'.join(encoded[i:i+12] for i in range(0,len(encoded),12)),base64.urlsafe_b64encode(MESSAGE+b'???')]:
            with self.subTest(value=value):self.assertTrue(any(content in (MESSAGE,MESSAGE+b'???') for content,_,_ in layers(value,maximum=1000)))
        self.assertEqual(list(layers(gzip.compress(MESSAGE),maximum=1000))[0][0],MESSAGE)
    def test_expansion_and_member_limits(self):
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as archive:
            archive.writestr('large',b'x'*2000);archive.writestr('more',b'y')
        result=list(layers(stream.getvalue(),maximum=100,members=1))
        self.assertIn('archive_expansion_limit',[kind for _,kind,_ in result]);self.assertIn('archive_member_limit',[kind for _,kind,_ in result])
        self.assertIn('gzip_expansion_limit',[kind for _,kind,_ in layers(gzip.compress(b'x'*2000),maximum=100)])

class WatchTests(unittest.TestCase):
    def test_real_events_new_projects_atomic_save_directory_move_outputs_restart(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary)/'environment';root.mkdir();seeds=Path(temporary)/'seeds.txt';seeds.write_bytes(b'audit-seed\n')
            logs=(Path(temporary)/'watch.log').open('w+')
            command=[str(ROOT/'run.sh'),'watch','--root',str(root),'--wordlist',str(seeds),'--reconcile-seconds','2']
            def start():return subprocess.Popen(command,stdout=logs,stderr=logs)
            def queue():
                try:return json.loads((root/'new-project/password-crackers/queue.json').read_text())
                except (OSError,ValueError):return {'targets':[]}
            def recovered(password):return any(t['status']=='recovered' and t['recovered_hex']==password.hex() for t in queue()['targets'])
            process=start()
            try:
                time.sleep(.3);tool=root/'new-project/nmap';tool.mkdir(parents=True)
                source=tool/'first.txt';source.write_bytes(base64.b64encode(RECORD));wait_for(lambda:recovered(b'password'))
                replacement=Path(temporary)/'replacement';replacement.write_bytes(base64.b64encode(b'md5="'+hashlib.md5(b'letmein').hexdigest().encode()+b'"'));replacement.replace(source)
                wait_for(lambda:recovered(b'letmein'));directory=Path(temporary)/'incoming';directory.mkdir()
                (directory/'new.txt').write_bytes(base64.b64encode(b'md5="'+hashlib.md5(b'admin').hexdigest().encode()+b'"'));directory.replace(tool/'moved');wait_for(lambda:recovered(b'admin'))
                output=root/'new-project/ciphey/versions/user/drop/decoded/new.txt';output.parent.mkdir(parents=True);output.write_bytes(base64.b64encode(b'md5="'+hashlib.md5(b'ctf').hexdigest().encode()+b'"'));wait_for(lambda:recovered(b'ctf'))
                password_output=root/'new-project/password-crackers/jobs/manual/recovered.txt'
                password_output.parent.mkdir(parents=True);password_output.write_bytes(base64.b64encode(b'md5="'+hashlib.md5(b'secret').hexdigest().encode()+b'"'))
                wait_for(lambda:recovered(b'secret'))
                wait_for(lambda:json.loads((root/'new-project/reader-report.json').read_text())['node_states'].get('queued',0)==0)
                attempts=len(queue()['attempts'])
            finally:process.terminate();process.wait(timeout=15)
            process=start()
            try:
                time.sleep(3);self.assertIsNone(process.poll());self.assertEqual(len(queue()['attempts']),attempts);self.assertTrue(recovered(b'password'))
            finally:process.terminate();process.wait(timeout=15);logs.close()

if __name__=='__main__':unittest.main()
