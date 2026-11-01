"""Regression and fault-injection coverage for the measured resilience gaps."""
from campaign import *
import threading
import unittest
from unittest.mock import Mock
from hash_watch.pipeline import Pipeline,Settings
from hash_watch.store import atomic_bytes


class SortedLocal(Local):
    def listattrs(self,path):
        yield from sorted(super().listattrs(path),key=lambda pair:pair[0])


class ResilienceTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);self.source=self.root/'remote';self.source.mkdir()
        self.patch=patch.object(transport,'provider',SortedLocal);self.patch.start();self.addCleanup(self.patch.stop)

    def b(self,**options):
        b=Bridge(config(self.root/'project',self.source,**options))
        atomic_json(b.control_path,dict(running=True))
        return b

    def test_cursor_survives_restart_and_collects_all_files(self):
        for n in range(71):(self.source/f'{n:04}').write_bytes(str(n).encode())
        b=self.b(poll_files=17);key=b.scope('fixture',str(self.source),True);b.poll(key)
        self.assertEqual(len(b.state['versions']),17)
        b=self.b(poll_files=17)
        for _ in range(4):b.poll(key)
        self.assertEqual(len(b.state['versions']),71)
        self.assertEqual(b.state['scopes'][key]['connection_state'],'connected')

    def test_partial_first_batch_cannot_be_misreported_as_complete_at_end(self):
        for name in ('a-denied','b','c'):(self.source/name).write_bytes(b'data')
        b=self.b(poll_files=2);key=b.scope('fixture',str(self.source),True);snapshot=b.snapshot
        def fail_first(source,path,remote=None):
            if path.endswith('a-denied'):raise PermissionError(errno.EACCES,'unreadable first batch')
            return snapshot(source,path,remote)
        with patch.object(b,'snapshot',side_effect=fail_first):b.poll(key)
        b.poll(key)
        self.assertEqual(b.state['scopes'][key]['coverage'],'partial')
        self.assertEqual(b.state['scopes'][key]['last_cycle_coverage'],'partial')
        self.assertTrue(any('a-denied' in e.get('path','') for e in b.state['scopes'][key]['errors']))

    def test_background_collection_exceeds_GUI_listing_limit(self):
        for n in range(2105):(self.source/f'{n:04}').write_bytes(b'x')
        with SortedLocal(dict(root=str(self.source))) as r:
            with self.assertRaises(transport.CoverageError):r.entries(str(self.source))
        b=self.b(poll_files=600,poll_seconds=30);key=b.scope('fixture',str(self.source),True)
        for _ in range(4):b.poll(key)
        self.assertEqual(len(b.state['versions']),2105)

    def test_oversized_prefix_does_not_starve_tail(self):
        for n in range(18):(self.source/f'{n:04}').write_bytes(b'x'*2_000_001)
        (self.source/'zz-tail').write_bytes(b'readable tail')
        b=self.b();key=b.scope('fixture',str(self.source),True);b.poll(key)
        self.assertTrue(any(v['path'].endswith('zz-tail') for v in b.state['versions'].values()))
        self.assertEqual(b.state['scopes'][key]['connection_state'],'connected')

    def test_quota_preserves_history_and_retries_after_capacity_increase(self):
        a=self.source/'a';a.write_bytes(b'12345678');z=self.source/'z';z.write_bytes(b'abcdefgh')
        b=self.b(max_snapshot_bytes=10);first=b.snapshot('fixture',str(a))
        with self.assertRaisesRegex(transport.CoverageError,'quota'):b.snapshot('fixture',str(z))
        self.assertEqual(len(b.state['versions']),1)
        self.assertEqual((b.project/first['local_path']).read_bytes(),a.read_bytes())
        b.config['max_snapshot_bytes']=20;b.snapshot('fixture',str(z))
        self.assertEqual(len(b.state['versions']),2)

    def test_low_free_space_defers_without_publishing_a_complete_origin(self):
        p=self.source/'a';p.write_bytes(b'data');b=self.b()
        with patch.object(transport.shutil,'disk_usage',return_value=Mock(free=1)):
            with self.assertRaisesRegex(transport.CoverageError,'free space'):b.snapshot('fixture',str(p))
        self.assertFalse(b.state['versions']);self.assertFalse(b.origins)
        b.snapshot('fixture',str(p));self.assertEqual(len(b.state['versions']),1)

    def test_failed_snapshot_publication_is_pending_not_complete(self):
        p=self.source/'a';p.write_bytes(b'known bytes');b=self.b();replace=os.replace
        def fault(a,z):
            if str(z).endswith('.bin'):raise OSError(errno.ENOSPC,'injected storage full')
            return replace(a,z)
        with patch('os.replace',fault):
            with self.assertRaises(OSError):b.snapshot('fixture',str(p))
        self.assertFalse(b.state['versions'])
        self.assertTrue(all(v['coverage']=='pending-publication' for v in b.origins.values()))
        b=self.b();self.assertFalse(b.state['versions']);b.snapshot('fixture',str(p))
        self.assertEqual(len(b.state['versions']),1)

    def test_restart_reconciles_published_bytes_when_index_commit_failed(self):
        p=self.source/'a';p.write_bytes(b'journal committed bytes');b=self.b()
        with patch.object(b,'save',side_effect=OSError(errno.ENOSPC,'state commit failed')):
            with self.assertRaises(OSError):b.snapshot('fixture',str(p))
        b=self.b();self.assertEqual(len(b.state['versions']),1)
        origin=next(iter(b.state['versions'].values()))
        self.assertEqual(origin['coverage'],'complete')
        self.assertEqual((b.project/origin['local_path']).read_bytes(),p.read_bytes())

    def test_loop_survives_both_full_and_readonly_storage_faults(self):
        for code in (errno.ENOSPC,errno.EROFS):
            b=self.b();key=b.scope('fixture',str(self.source),True);calls=[]
            def poll(key):
                calls.append(1)
                if len(calls)==1:raise OSError(code,'injected write failure')
                b.stop.set()
            b.config['interval']=.001
            with patch.object(b,'poll',side_effect=poll):b.loop()
            self.assertEqual(len(calls),2)

    def test_metadata_corruption_is_explicit_and_does_not_destroy_artifacts(self):
        p=self.source/'a';p.write_bytes(b'preserve me');b=self.b();origin=b.snapshot('fixture',str(p))
        b.state_path.write_text('{damaged metadata')
        with self.assertRaises(json.JSONDecodeError):self.b()
        self.assertEqual((b.project/origin['local_path']).read_bytes(),p.read_bytes())

    def test_workspace_storage_fault_isolated_and_export_retried(self):
        env=Environment(self.root/'environments')
        a,z=Mock(),Mock();a.path=self.root/'environments/A';z.path=self.root/'environments/B'
        for p in (a,z):p.path.mkdir(parents=True)
        env.projects=dict(A=a,B=z);a.step.side_effect=OSError(errno.ENOSPC,'full workspace A');z.step.return_value=True
        with patch.object(env,'retire_missing'):
            self.assertTrue(env.step());z.step.assert_called_once()
            a.step.side_effect=None;a.step.return_value=False;env.failures[a.path]=(0,'previous error')
            env.step();a.export.assert_called_once();self.assertNotIn(a.path,env.failures)

    def test_inventory_batch_round_robins_and_is_bounded(self):
        env=Environment(self.root/'environment');a,z=Mock(),Mock()
        a.path=self.root/'A';z.path=self.root/'B';a.path.mkdir();z.path.mkdir()
        from collections import deque
        env._inventory=deque([(a,iter([Path(f'A/{n}') for n in range(10000)])),(z,iter([Path('B/important')]))])
        seen=[]
        with patch.object(env,'ingest',side_effect=lambda p:seen.append(str(p))):env.inventory_batch(maximum=8)
        self.assertEqual(seen[:2],['A/0','B/important']);self.assertLessEqual(len(seen),8)

    def test_matching_checksums_reviewed_without_losing_credential_positives(self):
        for alg in ('md5','sha1','sha224','sha256','sha384','sha512'):
            h=getattr(hashlib,alg)(b'password').hexdigest()
            for record in [dict(filename='release.zip',algorithm=alg,digest=h),dict(purpose='file-integrity',algorithm=alg,digest=h),dict(checksum={alg:h})]:
                candidates,_=identify(json.dumps(record).encode());self.assertTrue(candidates);self.assertTrue(all(c['format'] is None for c in candidates))
            candidates,_=identify(json.dumps(dict(username='synthetic-user',algorithm=alg,hash=h)).encode())
            self.assertTrue(any(c['format']==alg for c in candidates))

    def test_canonical_encoding_is_not_claimed_as_verified_plaintext(self):
        from shared_reader.transforms import layers
        data=base64.b64encode(b'ordinary legitimate encoded identifier')
        results=list(layers(data,maximum=2000000))
        self.assertTrue(any(d==b'ordinary legitimate encoded identifier' for d,k,l in results))
        self.assertTrue(all(not l.get('human_verified',False) for d,k,l in results))

    def test_pending_publications_and_non_matching_origins_never_become_alerts(self):
        b=self.b();data=b'useful result';node=digest(data);artifact=b.project/'ciphey/artifacts'/(node+'.bin');artifact.parent.mkdir(parents=True);artifact.write_bytes(data)
        b.origins['ssh-input/source']=dict(sha256='wrong',path='/source',snapshot_id='a')
        atomic_json(b.project/'reader-report.json',dict(sources=[dict(id='s',path='ssh-input/source',sha256='real')],nodes=[dict(id=node,size=len(data),status='done')],edges=[dict(child=node,kind='base64_normalized')],provenance=[dict(source='s',node=node)]))
        self.assertFalse(b.status()['alerts'])

    def test_recovered_password_export_restored_from_verified_queue(self):
        inbox=self.root/'inbox';inbox.mkdir();words=self.root/'words';words.write_bytes(b'only-seed\n')
        p=Pipeline(inbox,self.root/'hash',wordlist=words)
        ident=p.enqueue(dict(value=hashlib.md5(b'password').hexdigest(),format='md5',format_basis='synthetic known-answer'))
        p.store.update(ident,status='recovered',recovered_hex=b'password'.hex(),verification='independent md5 verification')
        p.close();p=Pipeline(inbox,self.root/'hash',wordlist=words)
        try:self.assertEqual((p.output/'jobs'/ident/'recovered.txt').read_bytes(),b'password')
        finally:p.close()

    def test_real_small_tmpfs_full_and_readonly_are_recoverable(self):
        script=HERE/'tmpfs_probe.py'
        run=subprocess.run(['unshare','-Ur','-m',sys.executable,str(script)],capture_output=True,text=True,timeout=15)
        self.assertEqual(run.returncode,0,run.stderr)
        evidence=json.loads(run.stdout);self.assertEqual(evidence['full_errno'],errno.ENOSPC);self.assertEqual(evidence['readonly_errno'],errno.EROFS)
        (HERE/'tmpfs-evidence.json').write_text(json.dumps(evidence,indent=2)+'\n')


if __name__=='__main__':unittest.main(verbosity=2)
