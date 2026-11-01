"""Deterministic local resilience experiments; no CTF services or targets."""
import base64
from collections import Counter
import errno
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
sys.path[:0]=[str(ROOT/'shared-reader'),str(ROOT/'shared-reader/workbench')]
sys.path.append(str(ROOT/'hash-watch/.venv/lib/python3.12/site-packages'))
import bridge as transport
from bridge import Bridge, Local, atomic_json, digest
from shared_reader.project import Project, Limits, sha
from shared_reader.watch import Environment
from hash_watch.detect import identify


def config(project, source, **kw):
    return dict(project=str(project), sources={'fixture':dict(root=str(source),transport='sftp',username='synthetic',host='local-fixture')}, **kw)


def remote(c):
    return Local(c)


def stress(phase):
    result={'phase':phase,'experiments':{}}
    def experiment(name, run):
        start=time.monotonic()
        try:result['experiments'][name]=dict(run(),seconds=round(time.monotonic()-start,4))
        except Exception as error:result['experiments'][name]=dict(error=repr(error),seconds=round(time.monotonic()-start,4))
        print(name,result['experiments'][name],flush=True)

    def large_folder():
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/'remote';source.mkdir()
            for n in range(700):(source/f'{n:04}.txt').write_bytes(f'ordinary-{n}'.encode())
            b=Bridge(config(root/'project',source));key=b.scope('fixture',str(source),True)
            atomic_json(b.control_path,{'running':True})
            counts=[]
            for _ in range(3):b.poll(key);counts.append(len(b.state['versions']))
            return dict(collected_after_polls=counts,expected=700,connection=b.state['scopes'][key].get('connection_state'))
    with patch.object(transport,'provider',remote):experiment('700_file_progress',large_folder)

    def oversized_prefix():
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/'remote';source.mkdir()
            for n in range(18):(source/f'{n:04}.bin').write_bytes(b'x'*2_000_001)
            (source/'zz-readable.txt').write_bytes(b'useful tail')
            b=Bridge(config(root/'project',source));key=b.scope('fixture',str(source),True)
            atomic_json(b.control_path,{'running':True})
            for _ in range(2):b.poll(key)
            return dict(tail_collected=any(v['path'].endswith('zz-readable.txt') for v in b.state['versions'].values()),coverage=b.state['scopes'][key]['coverage'])
    with patch.object(transport,'provider',remote):experiment('oversized_prefix',oversized_prefix)

    def publish_failure():
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/'remote';source.mkdir();p=source/'file.txt';p.write_bytes(b'known complete bytes')
            b=Bridge(config(root/'project',source))
            replace=os.replace
            def fail_spool(a,z):
                if str(z).endswith('.bin'):raise OSError(errno.ENOSPC,'simulated snapshot storage full')
                return replace(a,z)
            with patch('os.replace',fail_spool):
                try:b.snapshot('fixture',str(p))
                except OSError:pass
            advertised=len(b.origins);complete=sum(v.get('coverage')=='complete' for v in b.origins.values());published=len(list((root/'project').glob('ssh-input/**/*.bin')))
            b.snapshot('fixture',str(p))
            return dict(origins_before_retry=advertised,complete_origins_before_retry=complete,published_before_retry=published,versions_after_retry=len(b.state['versions']))
    with patch.object(transport,'provider',remote):experiment('publication_ENOSPC',publish_failure)

    def background_failure():
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/'remote';source.mkdir();(source/'one').write_bytes(b'hello')
            b=Bridge(config(root/'project',source,interval=.001));b.scope('fixture',str(source),True)
            atomic_json(b.control_path,{'running':True});real=transport.atomic_json;calls=0
            def fault(path,data):
                nonlocal calls
                calls+=1
                if calls<=2:raise OSError(errno.ENOSPC,'injected full storage')
                b.stop.set();return real(path,data)
            crashed=False
            with patch.object(transport,'atomic_json',fault):
                try:b.loop()
                except OSError:crashed=True
            return dict(loop_crashed=crashed,calls=calls)
    with patch.object(transport,'provider',remote):experiment('background_storage_fault',background_failure)

    def process_atomic():
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'project').mkdir();words=root/'words';words.write_bytes(b'only-seed\n')
            p=Project(root/'project',wordlist=words)
            data=b'complete object contents';target=p.objects/(sha(data)+'.bin')
            real=Path.open
            class Interrupted:
                def __enter__(self):self.f=real(target,'xb');return self
                def write(self,data):self.f.write(data[:5]);self.f.flush();raise OSError(errno.ENOSPC,'injected interrupted write')
                def __exit__(self,*args):self.f.close()
            def fault(path,*args,**kw):
                return Interrupted() if path==target and args and args[0]=='xb' else real(path,*args,**kw)
            try:
                with patch.object(Path,'open',fault):
                    try:p._store_node(data)
                    except OSError:pass
                broken=target.exists() and target.read_bytes()!=data
                recovered=False
                try:p._store_node(data);recovered=True
                except ValueError:pass
                return dict(partial_final_object=broken,retry_succeeded=recovered)
            finally:p.close()
    experiment('object_interrupted_write',process_atomic)

    def attach_interruption():
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'inbox').mkdir();source=root/'inbox/source';source.write_bytes(b'persisted source')
            p=Project(root)
            try:
                with patch.object(p,'_attach',side_effect=RuntimeError('simulated process interruption')):
                    try:p.ingest(source)
                    except RuntimeError:pass
            finally:p.close()
            p=Project(root)
            try:
                p.ingest(source)
                return dict(sources=p.db.execute('select count(*) from sources').fetchone()[0],reach=p.db.execute('select count(*) from reach').fetchone()[0])
            finally:p.close()
    experiment('source_attach_interruption',attach_interruption)

    def negative_hashes():
        records=[]
        for algorithm in ('md5','sha1','sha224','sha256','sha384','sha512'):
            h=getattr(hashlib,algorithm)(b'public package payload').hexdigest()
            for label,obj in [('explicit_checksum',{'checksum':{algorithm:h}}),('file_metadata',{'filename':'package.tar','size':438,'algorithm':algorithm,'digest':h}),('integrity_metadata',{'purpose':'file-integrity','algorithm':algorithm,'digest':h}),('etag_metadata',{'etag':h})]:
                data=json.dumps(obj).encode();c,_=identify(data)
                records.append(dict(kind=label,algorithm=algorithm,auto=sum(x['format'] is not None for x in c),candidates=len(c)))
        return dict(records=records,automatic_jobs=sum(r['auto'] for r in records),negative_records=len(records))
    experiment('checksum_false_positives',negative_hashes)

    def alert_noise():
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/'remote';source.mkdir();b=Bridge(config(root/'project',source))
            origin=dict(sha256='original',path='/ordinary/README.txt',snapshot_id='source')
            b.origins['ssh-input/readme.bin']=origin
            nodes=[];edges=[];provenance=[]
            for n in range(24):
                data=(f'ordinary prose hypothesis number {n}').encode();node=digest(data);p=b.project/'ciphey/artifacts'/(node+'.bin');p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
                nodes.append(dict(id=node,size=len(data),status='done'));edges.append(dict(child=node,parent='original',kind='hypothesis:rot13'));provenance.append(dict(node=node,source='source'))
            atomic_json(b.project/'reader-report.json',dict(sources=[dict(id='source',path='ssh-input/readme.bin',sha256='original')],nodes=nodes,edges=edges,provenance=provenance))
            return dict(hypothesis_default_alerts=len(b.status()['alerts']),artifacts_retained=len(list((b.project/'ciphey/artifacts').glob('*.bin'))))
    experiment('hypothesis_notification_noise',alert_noise)
    (HERE/(phase+'.json')).write_text(json.dumps(result,indent=2)+'\n')


if __name__=='__main__':stress(sys.argv[1])
