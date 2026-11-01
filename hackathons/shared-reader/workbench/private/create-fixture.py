import base64,json,hashlib,os
from pathlib import Path
r=Path('/srv/reader-jail/files')
m=b'The spare key is under the blue flower pot.'
files={'notes.txt':base64.b64encode(m)+b'\n','late-record.log':b'service="ControllerAlphaBetaGamma" route="workspaceStatusPanel"\n'*300 + b'fixture="'+base64.b64encode(b'md5="'+hashlib.md5(b'password').hexdigest().encode()+b'"')+b'"\n',"spaces 'quotes' café\n.txt":base64.b64encode(b'A separate source has the same useful message.'), 'binary.bin':bytes(range(256)), 'too-large.bin':b'!'*2000001, 'denied.txt':b'not readable'}
for name,data in files.items():
 p=r/name;p.write_bytes(data);p.chmod(0o644)
(r/'denied.txt').chmod(0)
(r/'blocked').mkdir(exist_ok=True);(r/'blocked').chmod(0)
(r/'subfolder').mkdir(exist_ok=True);(r/'subfolder'/'multilayer.txt').write_bytes(base64.b64encode(base64.b64encode(m)))
try: (r/'outside-link').symlink_to('/etc/passwd')
except FileExistsError: pass
print(json.dumps({str(p.relative_to(r)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':p.stat().st_mode} for p in r.rglob('*') if p.is_file() and not p.is_symlink()}))
