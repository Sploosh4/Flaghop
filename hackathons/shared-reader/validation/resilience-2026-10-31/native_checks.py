"""Measured real native-reader checks on synthetic local inputs only."""
from campaign import *
import gzip
import io
import sqlite3
import threading
import zipfile
import random

OUTPUT=HERE/'native';OUTPUT.mkdir(exist_ok=True)
PYTHON=ROOT/'hash-watch/.venv/bin/python'
ENV=dict(os.environ,PYTHONPATH=str(ROOT/'shared-reader'))
metrics={}


def wait(check,seconds=45):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        try:
            answer=check()
            if answer:return answer
        except (FileNotFoundError,json.JSONDecodeError,sqlite3.OperationalError):pass
        time.sleep(.01)
    raise AssertionError('Timed out waiting for evidence')


def read(path):return json.loads(Path(path).read_text())


def alive(pid):
    try:return Path(f'/proc/{pid}/stat').read_text().split()[2]!='Z'
    except FileNotFoundError:return False


def native_load():
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp);folders=root/'environments';folders.mkdir();words=root/'words';words.write_bytes(b'password\nletmein\n')
        projects=[folders/('A-hot' if n==0 else f'B-{n:02}') for n in range(8)]
        message=b'A normal message for the busy workspace.'
        for n,p in enumerate(projects):
            (p/'inbox').mkdir(parents=True)
            for x in range(240 if n==0 else 1):
                (p/'inbox'/f'{x:04}.txt').write_bytes(base64.b64encode(message if n==0 else f'An independent workspace has useful message {n}.'.encode()))
        initial={str(p):sha(p.read_bytes()) for p in folders.glob('*/inbox/*')}
        code="""import sys,signal\nfrom pathlib import Path\nfrom shared_reader.watch import Environment\nfrom shared_reader.project import Limits\ne=Environment(Path(sys.argv[1]),wordlist=Path(sys.argv[2]),reconcile=1,limits=Limits(threads=1,slice_seconds=1,batch_size=8,decode_seconds=1,file_seconds=2))\ndef stop(*args):\n e.stop.set()\n for p in e.projects.values():p.hashes.stop.set()\nsignal.signal(signal.SIGTERM,stop)\ntry:e.watch()\nfinally:e.close()\n"""
        started=time.monotonic()
        with (OUTPUT/'load-worker.log').open('w') as log:
            child=subprocess.Popen([str(PYTHON),'-c',code,str(folders),str(words)],env=ENV,stdout=log,stderr=log)
        try:
            b=projects[1];target=b/'ciphey/artifacts'/(sha(b'An independent workspace has useful message 1.')+'.bin')
            wait(lambda:target.exists(),60)
            first_seconds=time.monotonic()-started
            a_sources=len(read(projects[0]/'reader-report.json')['sources'])
            wait(lambda:len(read(projects[0]/'reader-report.json')['sources'])>=240,60)
            inventory_seconds=time.monotonic()-started
            a=projects[0];atomic_json(a/'reader-control.json',dict(running=False))
            paused=time.monotonic()
            wait(lambda:read(a/'.reader-state/activity-status.json')['activity']=='paused',15)
            pause_latency=time.monotonic()-paused
            (a/'inbox/paused.txt').write_bytes(base64.b64encode(b'A file waiting for its paused workspace.'))
            (b/'inbox/new-hash.txt').write_bytes(b'md5="'+hashlib.md5(b'letmein').hexdigest().encode()+b'"')
            bstart=time.monotonic()
            wait(lambda:any(t['status']=='recovered' and t['recovered_hex']==b'letmein'.hex() for t in read(b/'password-crackers/queue.json')['targets']),45)
            b_latency=time.monotonic()-bstart
            assert not any(s['path']=='inbox/paused.txt' for s in read(a/'reader-report.json')['sources'])
            atomic_json(a/'reader-control.json',dict(running=True))
            wait(lambda:any(s['path']=='inbox/paused.txt' for s in read(a/'reader-report.json')['sources']),15)
            assert all(sha(Path(p).read_bytes())==h for p,h in initial.items())
            metrics['native_workspace_load']=dict(workspaces=8,initial_files=247,first_B_result_seconds=round(first_seconds,3),A_sources_at_B_result=a_sources,A_inventory_seconds=round(inventory_seconds,3),pause_ack_seconds=round(pause_latency,3),B_hash_recovery_while_A_paused_seconds=round(b_latency,3),sources_preserved=len(initial),resume_collected_retained_source=True)
        finally:
            child.terminate()
            try:child.wait(timeout=10)
            except subprocess.TimeoutExpired:child.kill();child.wait()


def kill_atomic_publication():
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp);project=root/'project';project.mkdir();marker=root/'marker';data=b'x'*200000
        code="""import os,signal,sys\nfrom pathlib import Path\nfrom shared_reader.project import Project\nimport hash_watch.store as store\np=Project(Path(sys.argv[1]))\noriginal=store.os.fsync\ndef crash(fd):\n path=os.readlink('/proc/self/fd/'+str(fd))\n if '.reader-write-' in path and '/objects/' in path:\n  Path(sys.argv[2]).write_text(path)\n  os.kill(os.getpid(),signal.SIGKILL)\n return original(fd)\nstore.os.fsync=crash\np._store_node(b'x'*200000)\n"""
        child=subprocess.run([str(PYTHON),'-c',code,str(project),str(marker)],env=ENV,capture_output=True,timeout=15)
        assert child.returncode==-signal.SIGKILL and marker.exists(),child.stderr.decode()
        final=project/'.reader-state/objects'/(sha(data)+'.bin');assert not final.exists()
        p=Project(project)
        try:p._store_node(data);assert final.read_bytes()==data
        finally:p.close()
        metrics['SIGKILL_during_object_publication']=dict(signal='SIGKILL',partial_final_object=False,retry_verified=True,staging_files_remaining=len(list(final.parent.glob('.reader-write-*'))))


def kill_cipher_owner():
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp);marker=root/'pid'
        sleeper="import os,time;from pathlib import Path;Path("+repr(str(marker))+").write_text(str(os.getpid()));time.sleep(60)"
        code="from cipher_watch.adapters import run_tool;import sys;run_tool([sys.executable,'-c',sys.argv[1]],cwd=sys.argv[2],timeout=65)"
        child=subprocess.Popen([str(PYTHON),'-c',code,sleeper,str(root)],env=dict(ENV,PYTHONPATH=str(ROOT/'cipher-watch')))
        try:
            pid=int(wait(lambda:marker.read_text()));child.kill();child.wait(timeout=5)
            start=time.monotonic();wait(lambda:not alive(pid),3)
            metrics['cipher_owner_SIGKILL']=dict(child_stopped=True,seconds=round(time.monotonic()-start,3))
        finally:
            if child.poll() is None:child.kill();child.wait()


def kill_real_cracking_batch():
    import bcrypt
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp);(root/'inbox').mkdir();words=root/'words';words.write_bytes(b'password\n')
        hashed=bcrypt.hashpw(b'password',bcrypt.gensalt(rounds=12)).decode()
        code="""import sys\nfrom pathlib import Path\nfrom hash_watch.pipeline import Pipeline,Settings\np=Pipeline(Path(sys.argv[1])/'inbox',Path(sys.argv[1])/'hash',Settings(threads=1,batch_size=1,quick_seconds=2,slice_seconds=2),wordlist=Path(sys.argv[1])/'words')\np.enqueue(dict(value=sys.argv[2],format='bcrypt',format_basis='synthetic local known-answer'))\nwhile p.work_one():pass\n"""
        child=subprocess.Popen([str(PYTHON),'-c',code,str(root),hashed],env=dict(ENV,PYTHONPATH=str(ROOT/'hash-watch')))
        def running():
            with sqlite3.connect(f'file:{root}/hash/state.sqlite?mode=ro',uri=True) as connection:
                return connection.execute("SELECT 1 FROM targets WHERE status='running_quick'").fetchone()
        try:
            wait(running,15);child.kill();child.wait(timeout=5)
        finally:
            if child.poll() is None:child.kill();child.wait()
        from hash_watch.pipeline import Pipeline,Settings
        p=Pipeline(root/'inbox',root/'hash',Settings(threads=1,batch_size=1,quick_seconds=2,slice_seconds=2),wordlist=words)
        try:
            interrupted=p.store.db.execute("SELECT count(*) FROM attempts WHERE status='interrupted'").fetchone()[0]
            for _ in range(6):
                if any(t['status']=='recovered' for t in p.store.targets()):break
                p.work_one()
            target=p.store.targets()[0]
            assert target['status']=='recovered' and bytes.fromhex(target['recovered_hex'])==b'password'
            assert bcrypt.checkpw(bytes.fromhex(target['recovered_hex']),hashed.encode())
            metrics['real_bcrypt_queue_SIGKILL_resume']=dict(interrupted_attempts=interrupted,recovered=True,independent_verification=True)
        finally:p.close()


def negative_and_positive_controls():
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp);(root/'inbox').mkdir();words=root/'seeds';words.write_bytes(b'password\n')
        project=Project(root,limits=Limits(threads=1,slice_seconds=1,batch_size=32,max_nodes=48),wordlist=words)
        original={};negatives=[];positive_passwords=[]
        positive_goals={}
        try:
            for alg in ('md5','sha1','sha224','sha256','sha384','sha512'):
                value=getattr(hashlib,alg)(b'public package payload').hexdigest()
                for n,obj in enumerate([{'checksum':{alg:value}},{'filename':'release.zip','algorithm':alg,'digest':value},{'purpose':'file-integrity','algorithm':alg,'digest':value},{'etag':value}]):
                    path=root/'inbox'/f'negative-{alg}-{n}.json';path.write_text(json.dumps(obj));negatives.append(path)
                good=getattr(hashlib,alg)(b'password').hexdigest()
                path=root/'inbox'/f'positive-{alg}.txt';path.write_bytes(base64.b64encode(json.dumps(dict(username='synthetic',algorithm=alg,hash=good)).encode()));positive_passwords.append(alg)
                positive_goals[path]=b'password'
            for n in range(6):
                path=root/'inbox'/f'negative-prose-{n}.txt';path.write_text(f'The ordinary meeting notes describe a normal project update for team {n}.');negatives.append(path)
                path=root/'inbox'/f'negative-binary-{n}.bin';path.write_bytes(random.Random(n).randbytes(256));negatives.append(path)
            message=b'The spare key is under the blue flower pot.'
            positives=[base64.b64encode(message),base64.b32encode(message),base64.b85encode(message),gzip.compress(base64.b64encode(message)),base64.b64encode(base64.b64encode(message)),b'ordinary="ControllerAlphaBetaGamma"\n'*300+b'fixture="'+base64.b64encode(b'md5="'+hashlib.md5(b'password').hexdigest().encode()+b'"')+b'"\n']
            for n,data in enumerate(positives):
                path=root/'inbox'/f'positive-layer-{n}.bin';path.write_bytes(data)
                positive_goals[path]=b'password' if n==5 else message
            for path in (root/'inbox').iterdir():
                original[path]=sha(path.read_bytes());project.ingest(path,export=False)
            project.export();start=time.monotonic()
            for step in range(1200):
                if not project.step():break
            else:raise AssertionError('Native controls did not drain')
            negative_nodes=set()
            for path in negatives:
                source=project.db.execute('SELECT id FROM sources WHERE path=?',(path.relative_to(root).as_posix(),)).fetchone()[0]
                negative_nodes.update(r[0] for r in project.db.execute('SELECT node FROM reach WHERE source=?',(source,)))
            bad=[]
            for row in project.db.execute('SELECT target,node FROM target_nodes'):
                target=project.hashes.store.target(row['target'])
                if row['node'] in negative_nodes and target['format'] is not None:bad.append(target['id'])
            recovered={t['format'] for t in project.hashes.store.targets() if t['status']=='recovered' and t['recovered_hex']==b'password'.hex()}
            assert not bad,dict(negative_automatic_targets=bad)
            assert set(positive_passwords)<=recovered,(positive_passwords,recovered)
            assert (project.path/'ciphey/artifacts'/(sha(message)+'.bin')).read_bytes()==message
            goals=[]
            for path,expected in positive_goals.items():
                source=project.db.execute('SELECT id FROM sources WHERE path=?',(path.relative_to(root).as_posix(),)).fetchone()[0]
                assert project.db.execute('SELECT 1 FROM reach WHERE source=? AND node=?',(source,sha(expected))).fetchone(),path.name
                goals.append(path.name)
            assert all(sha(p.read_bytes())==h for p,h in original.items())
            metrics['native_false_positive_controls']=dict(negative_files=len(negatives),positive_files=len(original)-len(negatives),positive_goals_passed=goals,negative_automatic_targets=len(set(bad)),positive_password_formats=sorted(recovered),expected_plaintext_recovered=True,originals_preserved=len(original),unique_artifacts=project.db.execute('select count(*) from nodes').fetchone()[0],seconds=round(time.monotonic()-start,3),steps=step)
        finally:project.close()


if __name__=='__main__':
    for function in [kill_atomic_publication,kill_cipher_owner,kill_real_cracking_batch,native_load,negative_and_positive_controls]:
        print('RUN',function.__name__,flush=True);function();print(json.dumps(metrics,indent=2),flush=True)
        (HERE/'native-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
