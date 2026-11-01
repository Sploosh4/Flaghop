"""Real SSH -> snapshot -> native readers -> saved-artifact and HTTP checks."""
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import time
import urllib.request
import urllib.error
import uuid

HERE = Path(__file__).resolve().parent
CONFIG = json.loads((HERE/'private/config.json').read_text())
PROJECT = Path(CONFIG['project'])
URL = 'http://127.0.0.1:32965'
checks = []
TAG = uuid.uuid4().hex[:10]
REMOTE = '/files/reader-e2e-' + TAG
JAIL = '/srv/reader-jail' + REMOTE


def request(path, data=None, headers=None):
    h = dict(headers or {})
    if data is not None:
        h.update({'Origin':URL, 'X-Reader-Token':TOKEN, 'Content-Type':'application/json'})
    req = urllib.request.Request(URL+path, json.dumps(data).encode() if data is not None else None, headers=h)
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.load(response)


def check(name, truth):
    if not truth:
        raise AssertionError(name)
    checks.append(name)


def wait_for(name, predicate, seconds=90):
    end = time.monotonic()+seconds
    while time.monotonic()<end:
        if predicate():
            checks.append(name)
            return
        time.sleep(.5)
    raise AssertionError('Timed out: '+name)


def remote(code):
    return subprocess.check_output(['lxc','exec','reader-ssh-fixture','--','python3','-c',code], text=True)


def report():
    return json.loads((PROJECT/'reader-report.json').read_text())


def versions():
    return json.loads((PROJECT/'reader-bridge.json').read_text())['versions']


def has_remote(path):
    return any(v['path']==path for v in versions().values())


def has_bytes(data):
    path=PROJECT/'ciphey/artifacts'/(hashlib.sha256(data).hexdigest()+'.bin')
    return path.is_file() and path.read_bytes()==data


session=request('/api/session')
TOKEN=session['token']
try:
    request('/api/status', headers={'Host':'attacker.example'})
except urllib.error.HTTPError as error:
    check('Host validation rejects DNS rebinding', error.code==403)
try:
    request('/api/status', headers={'Origin':'https://attacker.example'})
except urllib.error.HTTPError as error:
    check('Foreign origin rejected',error.code==403)
try:
    req=urllib.request.Request(URL+'/api/control', b'{"running":true}', headers={'Content-Type':'application/json'}, method='POST')
    urllib.request.urlopen(req)
except urllib.error.HTTPError as error:
    check('Mutation without origin/token rejected',error.code==403)

request('/api/control',dict(running=False))
name=REMOTE+'/pause-proof.txt'
remote(f"from pathlib import Path;import base64;r=Path({JAIL!r});r.mkdir();p=r/'pause-proof.txt';p.write_bytes(base64.b64encode(b'This message arrived while workspace A was paused.'))")
time.sleep(7)
check('Paused workspace does not collect a new remote file',not has_remote(name))
listing=request('/api/list?path=/files')
check('Interactive SSH browsing stays available while paused',any(e['path']==REMOTE for e in listing['entries']))
other=PROJECT.parent/'ssh-independent-proof'
(other/'inbox').mkdir(parents=True,exist_ok=True)
other_message=b'Another workspace can continue while the first is paused. '+TAG.encode()
(other/('inbox/proof-'+TAG+'.txt')).write_bytes(base64.b64encode(other_message))
wait_for('Workspace B processes while A is paused',lambda:(other/'ciphey/artifacts'/(hashlib.sha256(other_message).hexdigest()+'.bin')).is_file())
request('/api/control',dict(running=True))
wait_for('Resume collects the retained remote file',lambda:has_remote(name))
wait_for('Resumed queue decodes the new remote file',lambda:has_bytes(b'This message arrived while workspace A was paused.'))

remote(f"from pathlib import Path;import base64,os;r=Path({JAIL!r});(r/'atomic.tmp').write_bytes(base64.b64encode(b'An atomic replacement creates a complete new source version.'));os.replace(r/'atomic.tmp',r/'atomic.txt');(r/'move-source').mkdir(exist_ok=True);(r/'move-source'/'nested.txt').write_bytes(base64.b64encode(b'Directory renames must retain exact source paths.'));os.rename(r/'move-source',r/'moved-directory')")
wait_for('Atomic-save file collected',lambda:has_remote(REMOTE+'/atomic.txt'))
wait_for('Directory move collected recursively',lambda:has_remote(REMOTE+'/moved-directory/nested.txt'))
wait_for('Atomic-save content decoded',lambda:has_bytes(b'An atomic replacement creates a complete new source version.'))
wait_for('Moved file content decoded',lambda:has_bytes(b'Directory renames must retain exact source paths.'))

prior=set(versions())
subprocess.run(['lxc','config','device','remove','reader-ssh-fixture','ssh'],check=True,capture_output=True)
try:
    wait_for('Real SSH endpoint loss is reported',lambda:any(s.get('connection_state')=='disconnected' for s in request('/api/status')['scopes'].values()),seconds=30)
    check('Disconnect retains immutable historical snapshots',prior<=set(versions()))
finally:
    subprocess.run(['lxc','config','device','add','reader-ssh-fixture','ssh','proxy','listen=tcp:127.0.0.1:32222','connect=tcp:127.0.0.1:22'],check=True,capture_output=True)
wait_for('Real SSH endpoint reconnect resumes polling',lambda:any(s.get('connection_state')=='connected' for s in request('/api/status')['scopes'].values()),seconds=30)
wait_for('Late embedded hash is recovered by native reader queue',lambda:report().get('hash_states',{}).get('recovered',0)>=1)
wait_for('New origin joins the reader graph after deduplicated work',lambda:any(s.get('origin',{}).get('path')==REMOTE+'/moved-directory/nested.txt' for s in report()['sources']))
check('All ingested SSH versions retain matching origin SHA',all(s.get('origin',{}).get('sha256')==s['sha256'] for s in report()['sources']))
check('Full source beyond 4 KiB retained',any(v['path']=='/files/late-record.log' and v['size']>4096 for v in versions().values()))

before=json.loads((HERE/'validation/remote-before.json').read_text())
after=json.loads(remote("import json,hashlib;from pathlib import Path;r=Path('/srv/reader-jail/files');print(json.dumps({str(p.relative_to(r)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':p.stat().st_mode} for p in r.rglob('*') if p.is_file() and not p.is_symlink()}))"))
check('All original SSH fixture bytes and permission modes preserved',all(after.get(k)==v for k,v in before.items()))
alerts=request('/api/status')['alerts']
check('Derived alerts point to real tool artifacts',bool(alerts) and all((PROJECT/a['result_path']).is_file() and a['result_path'].startswith('ciphey/') for a in alerts))
candidate=alerts[0]
request('/api/dismiss',dict(id=candidate['id']))
check('Dismiss hides alert but retains the result file',candidate['id'] not in [a['id'] for a in request('/api/status')['alerts']] and (PROJECT/candidate['result_path']).is_file())
with urllib.request.urlopen(URL+'/reports/reader-report.html') as response:
    check('Evidence HTML is sandboxed against active content',response.headers.get('Content-Security-Policy','').startswith('sandbox;'))
try:
    request('/api/result?path=../../etc/passwd')
except urllib.error.HTTPError as error:
    check('Derived-result route rejects traversal',error.code==403)
(HERE/'validation/e2e.json').write_text(json.dumps(dict(passed=checks,count=len(checks),report=str(PROJECT/'reader-report.json'),hash_states=report()['hash_states']),indent=2)+'\n')
print(json.dumps(dict(passed=len(checks),checks=checks),indent=2))
