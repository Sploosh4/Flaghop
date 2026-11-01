import base64
from dataclasses import replace
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

import bcrypt
from hash_watch.detect import identify
from hash_watch.engines import crack_batch
from hash_watch.pipeline import Pipeline,Settings
from hash_watch.tools import ROOT,environment,run


def wait_for(fn,seconds=15):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        result=fn()
        if result:
            return result
        time.sleep(.1)
    raise AssertionError('Timed out waiting for watch/queue result')


class DetectionTests(unittest.TestCase):
    def test_bare_digest_keeps_multiple_hypotheses(self):
        c,w=identify(b'password_hash="5f4dcc3b5aa765d61d8327deb882cf99"')
        self.assertIsNone(c[0]['format'])
        self.assertIn('MD5',str(c[0]['identifications']))
        self.assertIn('NTLM',str(c[0]['identifications']))

    def test_context_and_byte_locations(self):
        data=b'comment\nmd5="5f4dcc3b5aa765d61d8327deb882cf99"'
        c,w=identify(data)
        self.assertEqual(c[0]['format'],'md5')
        self.assertEqual(c[0]['location'],{'offset':13,'length':32,'line':2,'byte_column':6})

    def test_modular_hash_keeps_salt_cost(self):
        value=bcrypt.hashpw(b'example',b'$2b$05$abcdefghijklmnopqrstuu').decode()
        c,w=identify(('user:'+value+':other').encode())
        self.assertEqual(len(c),1)
        self.assertEqual(c[0]['value'],value)
        self.assertEqual(c[0]['format'],'bcrypt')

    def test_checksum_context_does_not_auto_queue(self):
        c,w=identify(b'md5sum="5f4dcc3b5aa765d61d8327deb882cf99"',raw_format='md5')
        self.assertIsNone(c[0]['format'])

    def test_recognized_unsupported_record_is_preserved(self):
        value=b'$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$c29tZWhhc2g'
        candidates,warnings=identify(value)
        self.assertEqual(len(candidates),1)
        self.assertTrue(candidates[0]['unsupported_type'])
        self.assertEqual(candidates[0]['value'],value.decode())

    def test_candidate_limit_is_visible(self):
        c,w=identify(b'"'+b'a'*32+b'" "'+b'b'*32+b'"',limit=1)
        self.assertEqual(len(c),1)
        self.assertIn('candidate_count_limit',w)


class QueueTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.inbox=self.root/'inbox';self.inbox.mkdir()
        self.out=self.root/'results'
        self.words=self.root/'seeds.txt';self.words.write_text('octopus\n')
        self.pipeline=Pipeline(self.inbox,self.out,Settings(batch_size=16,threads=4,quick_seconds=3,slice_seconds=8),wordlist=self.words)
        self.addCleanup(self.temp.cleanup)
        self.addCleanup(lambda:self.pipeline.close() if self.pipeline else None)

    def add_md5(self,password=b'password'):
        source=self.inbox/'hash.txt'
        source.write_text('md5="'+hashlib.md5(password).hexdigest()+'"\n')
        report=self.pipeline.scan(source)
        return source,json.loads(report.read_text())['candidates'][0]['target_id']

    def test_real_quick_recovery_preserves_original(self):
        source,identifier=self.add_md5()
        before=source.read_bytes(),source.stat().st_mtime_ns
        self.assertTrue(self.pipeline.work_one())
        target=self.pipeline.store.target(identifier)
        self.assertEqual(target['status'],'recovered')
        self.assertEqual(bytes.fromhex(target['recovered_hex']),b'password')
        self.assertEqual(target['verification'],'independent hash check')
        self.assertEqual((source.read_bytes(),source.stat().st_mtime_ns),before)
        self.assertTrue((self.out/'jobs'/identifier/'recovered.json').is_file())

    def test_deep_queue_resumes_after_completed_batch(self):
        value=bcrypt.hashpw(b'octopus!',b'$2b$05$abcdefghijklmnopqrstuu').decode()
        path=self.inbox/'bcrypt.txt';path.write_text(value)
        identifier=json.loads(self.pipeline.scan(path).read_text())['candidates'][0]['target_id']
        self.pipeline.work_one(quick_only=True)
        # The plan now includes an empty password as well as the 16 common
        # candidates, so a 16-entry batch can leave a second quick batch.
        for _ in range(4):
            if self.pipeline.store.target(identifier)['status']!='queued_quick':
                break
            self.pipeline.work_one(quick_only=True)
        self.assertEqual(self.pipeline.store.target(identifier)['status'],'queued_deep')
        self.pipeline.work_one()
        saved=self.pipeline.store.target(identifier)['offset']
        self.assertGreater(saved,0)
        self.pipeline.close();self.pipeline=None
        self.pipeline=Pipeline(self.inbox,self.out,Settings(batch_size=16,quick_seconds=3,slice_seconds=8),wordlist=self.words)
        self.assertEqual(self.pipeline.store.target(identifier)['offset'],saved)
        for _ in range(30):
            self.pipeline.work_one()
            if self.pipeline.store.target(identifier)['status']=='recovered':
                break
        target=self.pipeline.store.target(identifier)
        self.assertEqual(target['status'],'recovered')
        self.assertEqual(bytes.fromhex(target['recovered_hex']),b'octopus!')
        offsets=[r['start_offset'] for r in self.pipeline.store.db.execute("SELECT start_offset FROM attempts WHERE target_id=? AND stage='deep' AND status='exhausted_batch' ORDER BY id",(identifier,))]
        self.assertEqual(offsets,sorted(set(offsets)))

    def test_ambiguous_requires_explicit_resolution(self):
        path=self.inbox/'ambiguous.txt';path.write_text(hashlib.md5(b'password').hexdigest())
        identifier=json.loads(self.pipeline.scan(path).read_text())['candidates'][0]['target_id']
        self.assertFalse(self.pipeline.work_one())
        new=self.pipeline.resolve(identifier,'md5')
        self.pipeline.work_one()
        self.assertEqual(self.pipeline.store.target(new)['status'],'recovered')
        self.assertEqual(self.pipeline.store.target(identifier)['resolved_to'],new)

    def test_duplicates_across_sources_share_queue_job(self):
        source,identifier=self.add_md5()
        other=self.inbox/'copy.txt';other.write_bytes(source.read_bytes())
        self.pipeline.scan(other)
        self.assertEqual(len(self.pipeline.store.targets()),1)
        self.assertIsNone(self.pipeline.scan(source))
        self.assertEqual(self.pipeline.store.db.execute('SELECT COUNT(*) FROM scans').fetchone()[0],2)

    def test_changed_versions_retain_old_evidence(self):
        source,identifier=self.add_md5()
        source.write_text('md5="'+hashlib.md5(b'letmein').hexdigest()+'"')
        self.pipeline.scan(source)
        self.assertEqual(self.pipeline.store.db.execute('SELECT COUNT(*) FROM scans').fetchone()[0],2)
        self.assertEqual(len(self.pipeline.store.targets()),2)

    def test_symlinks_fifo_and_overlap(self):
        file=self.root/'outside';file.write_text('secret')
        link=self.inbox/'link';link.symlink_to(file)
        self.assertIsNone(self.pipeline.scan(link))
        fifo=self.inbox/'fifo';os.mkfifo(fifo)
        self.assertIsNone(self.pipeline.scan(fifo))
        with self.assertRaises(ValueError):
            Pipeline(self.inbox,self.inbox/'results')

    def test_oversize_is_a_skipped_report(self):
        self.pipeline.settings=replace(self.pipeline.settings,max_file_bytes=1)
        source=self.inbox/'large';source.write_bytes(b'abc')
        report=json.loads(self.pipeline.scan(source).read_text())
        self.assertEqual(report['status'],'skipped')
        self.assertIsNone(report['source_sha256'])

    def test_interruption_replays_without_advancing(self):
        _,identifier=self.add_md5(b'not-on-quick-list')
        def interrupt(*args,**kwargs):
            return {'status':'interrupted','execution':{'seconds':.01}}
        with patch('hash_watch.pipeline.crack_batch',interrupt):
            self.pipeline.work_one()
        target=self.pipeline.store.target(identifier)
        self.assertEqual(target['offset'],0)
        self.assertEqual(target['status'],'queued_quick')
        self.assertEqual(self.pipeline.store.db.execute('SELECT status FROM attempts').fetchone()[0],'interrupted')

    def test_native_failure_does_not_advance_or_claim_exhaustion(self):
        _,identifier=self.add_md5(b'not-on-quick-list')
        with patch('hash_watch.pipeline.crack_batch',return_value={'status':'error','execution':{'seconds':.01}}):
            self.pipeline.work_one()
        target=self.pipeline.store.target(identifier)
        self.assertEqual(target['offset'],0)
        self.assertEqual(target['status'],'error')
        self.pipeline.resume()
        self.assertEqual(self.pipeline.store.target(identifier)['status'],'queued_quick')

    def test_plan_tampering_stops_work(self):
        _,identifier=self.add_md5()
        plan=self.out/'plans'/self.pipeline.plan_id/'quick.txt'
        plan.write_text('substituted\n')
        with self.assertRaises(ValueError):
            self.pipeline.work_one()
        self.assertEqual(self.pipeline.store.target(identifier)['status'],'error')

    def test_changed_verifier_snapshot_stops_work(self):
        _,identifier=self.add_md5()
        folder=self.out/'jobs'/identifier;folder.mkdir(parents=True)
        file=self.root/'verifier';file.write_bytes(b'changed')
        (folder/'verifier-dependencies.json').write_text(json.dumps({'path':str(file),'sha256':hashlib.sha256(b'original').hexdigest()}))
        with self.assertRaises(ValueError):
            self.pipeline.work_one()
        self.assertEqual(self.pipeline.store.target(identifier)['status'],'error')
        self.assertEqual(self.pipeline.store.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0],0)

    def test_html_escapes_source_names(self):
        source=self.inbox/'<img onerror=alert(1)>.txt'
        source.write_text('md5="'+hashlib.md5(b'password').hexdigest()+'"')
        self.pipeline.scan(source)
        page=(self.out/'index.html').read_text()
        self.assertIn('&lt;img',page)
        self.assertNotIn('<img onerror',page)

    def test_long_candidate_uses_hashcat_without_native_truncation(self):
        secret=b'A'*60
        self.words.write_bytes(secret+b'\n')
        self.pipeline.close()
        self.pipeline=Pipeline(self.inbox,self.out,Settings(batch_size=256,slice_seconds=20),wordlist=self.words)
        source,identifier=self.add_md5(secret)
        self.pipeline.work_one(quick_only=True)
        self.pipeline.work_one()
        target=self.pipeline.store.target(identifier)
        self.assertEqual(target['status'],'recovered')
        self.assertEqual(target['engine'],'hashcat')
        self.assertEqual(bytes.fromhex(target['recovered_hex']),secret)

    def test_real_protected_zip_extraction_and_recovery(self):
        plain=self.root/'note.txt';plain.write_text('Synthetic ZIP fixture only.\n')
        archive=self.inbox/'locked.zip'
        subprocess.run(['zip','-q','-j','-P','letmein',archive,plain],check=True)
        before=hashlib.sha256(archive.read_bytes()).hexdigest()
        report=json.loads(self.pipeline.scan(archive).read_text())
        self.assertEqual(report['status'],'complete',report)
        self.assertTrue(report['candidates'],report)
        duplicate=self.inbox/'renamed.zip';duplicate.write_bytes(archive.read_bytes())
        repeated=json.loads(self.pipeline.scan(duplicate).read_text())
        self.assertEqual(repeated['candidates'][0]['target_id'],report['candidates'][0]['target_id'])
        self.assertTrue((self.out/'scans'/report['scan_id']/'source.bin').is_file())
        identifier=report['candidates'][0]['target_id']
        self.pipeline.work_one()
        target=self.pipeline.store.target(identifier)
        self.assertEqual(target['status'],'recovered')
        self.assertEqual(bytes.fromhex(target['recovered_hex']),b'letmein')
        self.assertEqual(hashlib.sha256(archive.read_bytes()).hexdigest(),before)


class NativeAdapterTests(unittest.TestCase):
    def test_real_hashcat_cpu(self):
        with tempfile.TemporaryDirectory() as temporary:
            result=crack_batch(temporary,target=hashlib.sha256(b'hello').hexdigest(),format_id='sha256',
                               words=[b'wrong',b'hello'],engine='hashcat',seconds=30)
            self.assertEqual(result['status'],'recovered',result)
            self.assertEqual(bytes.fromhex(result['plaintext_hex']),b'hello')

    def test_compute_child_stops_when_owner_is_killed(self):
        with tempfile.TemporaryDirectory() as temporary:
            marker=Path(temporary)/'child.json'
            payload="import os,time,json;from pathlib import Path;Path("+repr(str(marker))+").write_text(json.dumps([os.getpid(),os.getpgrp()]));time.sleep(30)"
            owner_code="from hash_watch.tools import run;import sys;run([sys.executable,'-c',"+repr(payload)+"],cwd="+repr(temporary)+",seconds=30)"
            owner=subprocess.Popen([sys.executable,'-c',owner_code],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            pid=group=None
            try:
                wait_for(marker.exists)
                pid,group=json.loads(marker.read_text())
                owner.kill();owner.wait(timeout=5)
                def stopped():
                    p=Path('/proc')/str(pid)/'stat'
                    return not p.exists() or p.read_text().split()[2]=='Z'
                wait_for(stopped,seconds=5)
            finally:
                if owner.poll() is None:
                    owner.kill();owner.wait()
                if group:
                    import signal
                    try:os.killpg(group,signal.SIGKILL)
                    except ProcessLookupError:pass

    def test_process_timeout_is_bounded(self):
        with tempfile.TemporaryDirectory() as temporary:
            start=time.monotonic()
            result=run([sys.executable,'-c','import time;time.sleep(30)'],cwd=temporary,seconds=.2)
            self.assertEqual(result['status'],'timeout')
            self.assertLess(time.monotonic()-start,3)


class LiveWatcherTests(unittest.TestCase):
    def test_new_edited_atomic_moved_files_and_queue(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);inbox=root/'inbox';inbox.mkdir();out=root/'out'
            seed=root/'seeds';seed.write_text('octopus\n')
            command=[sys.executable,'-m','hash_watch','watch','--watch',str(inbox),'--out',str(out),
                     '--wordlist',str(seed),'--reconcile-seconds','2']
            p=subprocess.Popen(command,cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            def scans():
                return list((out/'scans').glob('*/report.json'))
            value='md5="'+hashlib.md5(b'password').hexdigest()+'"'
            try:
                wait_for(lambda:(out/'config.json').is_file())
                path=inbox/'one.txt';path.write_text(value)
                wait_for(lambda:len(scans())>=1)
                path.write_text(value+'\n')
                wait_for(lambda:len(scans())>=2)
                tmp=root/'replacement';tmp.write_text(value+'\n\n');tmp.replace(path)
                wait_for(lambda:len(scans())>=3)
                directory=root/'moved';directory.mkdir();(directory/'two.txt').write_text(value)
                directory.replace(inbox/'moved')
                wait_for(lambda:len(scans())>=4)
                def recovered():
                    return json.loads((out/'queue.json').read_text())['targets'][0]['status']=='recovered'
                wait_for(recovered)
                self.assertEqual(path.read_text(),value+'\n\n')
                self.assertEqual(len(json.loads((out/'queue.json').read_text())['targets']),1)
            finally:
                p.terminate();p.wait(timeout=10)
            # A fresh scan discovers no new unchanged source versions.
            r=subprocess.run([sys.executable,'-m','hash_watch','scan','--out',str(out),'--scan-only'],cwd=ROOT,capture_output=True,timeout=15)
            self.assertEqual(r.returncode,0,r.stderr)
            self.assertEqual(len(scans()),4)


if __name__=='__main__':
    unittest.main()
