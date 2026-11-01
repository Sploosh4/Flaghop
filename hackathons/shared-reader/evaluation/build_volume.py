"""Data-only mixed-size probes; never deploys or interacts with a challenge."""
import base64,hashlib,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
out=HERE/'volume-corpus';out.mkdir(exist_ok=False)
record=b'md5="'+hashlib.md5(b'password').hexdigest().encode()+b'"'
payload=b'fixture="'+base64.b64encode(record)+b'"\n'
cases=[]

def add(name,data,goal,scope):
 path=out/(name+'.log');path.write_bytes(data)
 cases.append({'id':name,'group':'larger_logs' if goal=='password' else 'larger_negative_controls','goal':goal,'expected_hex':b'password'.hex() if goal=='password' else '', 'scope':scope,'format':'md5' if goal=='password' else None,'input':str(path),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})

line=b'2026-10-31 INFO service="ControllerAlphaBetaGamma" route="workspaceStatusPanel" event="refreshComplete" count=7\n'
for size in (16384,131072,1048576,1900000):
 body=(line*(size//len(line)+1))[:size]
 add(f'volume_{size}_head',payload+body,'password','supported')
 add(f'volume_{size}_tail',body+b'\n'+payload,'password','desired')
 add(f'volume_{size}_negative',body,'quiet','negative')
for name,line in [('json',b'{"service":"ControllerAlphaBetaGamma","route":"workspaceStatusPanel","event":"refreshComplete","count":7}\n'),('ini',b'service="ControllerAlphaBetaGamma"\nroute="workspaceStatusPanel"\ncount=7\n'),('csv',b'Alice,ControllerAlphaBetaGamma,workspaceStatusPanel,7\n')]:
 body=(line*(262144//len(line)+1))[:262144]
 add(f'volume_{name}_tail',body+b'\n'+payload,'password','desired')
 add(f'volume_{name}_negative',body,'quiet','negative')
(HERE/'volume-manifest.json').write_text(json.dumps({'cases':cases,'no_ctf_services_or_targets':True,'purpose':'Candidate starvation and completeness on larger repetitive ordinary files'},indent=2)+'\n')
print('Added',len(cases),'mixed-size files')
