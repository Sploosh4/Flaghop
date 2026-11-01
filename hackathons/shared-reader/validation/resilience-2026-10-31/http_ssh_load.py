"""Independent loopback workbench and neutral read-only SSH load check."""
from campaign import *
from concurrent.futures import ThreadPoolExecutor
import socket
import urllib.request
import urllib.error
import uuid
import threading

base=read=json.loads((ROOT/'shared-reader/workbench/private/config.json').read_text())
run_id=uuid.uuid4().hex[:8]
remote_path='/load-tests/'+run_id
code=f"from pathlib import Path;r=Path('/srv/reader-jail{remote_path}');r.mkdir(parents=True);[(r/('%04d.txt'%n)).write_bytes(('neutral load record %04d'%n).encode()) for n in range(700)]"
subprocess.run(['lxc','exec','reader-ssh-fixture','--','python3','-c',code],check=True)
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    config=dict(base,project=str(root/'project'),default_source='ssh-fixture',interval=.1,poll_files=128,poll_seconds=.3,max_requests=8)
    config['sources']={'ssh-fixture':dict(base['sources']['ssh-fixture'],root=remote_path)}
    config_path=root/'config.json';config_path.write_text(json.dumps(config))
    url=f'http://127.0.0.1:{port}'
    def request(path,data=None,token=None):
        headers={} if data is None else {'Origin':url,'X-Reader-Token':token,'Content-Type':'application/json'}
        req=urllib.request.Request(url+path,json.dumps(data).encode() if data is not None else None,headers=headers)
        with urllib.request.urlopen(req,timeout=15) as r:return json.load(r)
    log=(HERE/'http-ssh-load.log').open('w')
    child=subprocess.Popen([sys.executable,str(ROOT/'shared-reader/workbench/server.py'),'--config',str(config_path),'--port',str(port)],stdout=log,stderr=log)
    try:
        end=time.monotonic()+15
        while True:
            try:session=request('/api/session');break
            except OSError:
                if time.monotonic()>end:raise
                time.sleep(.05)
        token=session['token']
        request('/api/scope',dict(path=remote_path,running=True,recursive=True),token)
        start=time.monotonic();request('/api/control',dict(running=True),token)
        timings=[];responses=[]
        def read_status(n):
            before=time.monotonic()
            try:
                d=request('/api/status');return time.monotonic()-before,200,d['snapshots']
            except urllib.error.HTTPError as e:return time.monotonic()-before,e.code,None
        with ThreadPoolExecutor(max_workers=8) as pool:
            for elapsed,status,count in pool.map(read_status,range(160)):timings.append(elapsed);responses.append(status)
        while time.monotonic()-start<45:
            state=request('/api/status')
            if state['snapshots']==700:break
            time.sleep(.1)
        assert state['snapshots']==700,state
        elapsed=time.monotonic()-start
        before=time.monotonic();request('/api/control',dict(running=False),token)
        pause_request=time.monotonic()-before
        time.sleep(.5)
        cache=request('/api/status')
        preview=request('/api/preview?path='+remote_path+'/0699.txt')
        assert base64.b64decode(preview['data_b64'])==b'neutral load record 0699'
        assert cache['snapshots']==700 and not cache['running'] and child.poll() is None
        barrier=threading.Barrier(33)
        def overload(n):
            barrier.wait()
            try:request('/api/list?path='+remote_path);return 200
            except urllib.error.HTTPError as e:return e.code
        with ThreadPoolExecutor(max_workers=32) as pool:
            futures=[pool.submit(overload,n) for n in range(32)]
            barrier.wait();before=time.monotonic();request('/api/control',dict(running=False),token)
            pause_overload=time.monotonic()-before
            overload_responses=[f.result() for f in futures]
        assert set(overload_responses)<={200,503},overload_responses
        assert request('/api/status')['snapshots']==700 and child.poll() is None
        origins=json.loads((root/'project/reader-origins.json').read_text())
        assert all(v['coverage']=='complete' and sha((root/'project'/path).read_bytes())==v['sha256'] for path,v in origins.items())
        saved=json.loads((root/'project/reader-bridge.json').read_text())
        child.terminate();child.wait(timeout=10)
        child=subprocess.Popen([sys.executable,str(ROOT/'shared-reader/workbench/server.py'),'--config',str(config_path),'--port',str(port)],stdout=log,stderr=log)
        time.sleep(.4);restarted=request('/api/status');assert restarted['snapshots']==700 and not restarted['running']
        result=dict(files=700,concurrent_HTTP_clients=8,status_requests=len(timings),response_counts=dict(Counter(responses)),p50_ms=round(sorted(timings)[len(timings)//2]*1000,2),p95_ms=round(sorted(timings)[int(len(timings)*.95)]*1000,2),max_ms=round(max(timings)*1000,2),SSH_collection_seconds=round(elapsed,3),pause_request_ms=round(pause_request*1000,2),overload_concurrent_clients=32,overload_response_counts=dict(Counter(overload_responses)),pause_during_overload_ms=round(pause_overload*1000,2),restart_retained_snapshots=700,pause_persisted=True,all_snapshot_bytes_and_origins_verified=True,remote_fixture=remote_path,server_remained_responsive=True)
        (HERE/'http-ssh-metrics.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
    finally:
        if child.poll() is None:child.terminate();child.wait(timeout=10)
        log.close()
