"""Create only synthetic local input fixtures; never reads system credentials."""
from pathlib import Path
import hashlib,json,subprocess
import bcrypt
from Crypto.Hash import MD4
root=Path(__file__).resolve().parent
inbox=root/'examples/inbox'
inbox.mkdir(parents=True,exist_ok=True)
if any((inbox/name).exists() for name in ['quick.json','deep-bcrypt.txt','ambiguous.txt','unsupported.txt','locked.zip']):
 raise SystemExit('Demo fixtures already exist; preserve them. Use an empty example inbox to regenerate.')
(inbox/'quick.json').write_text(json.dumps({'synthetic':True,'md5':hashlib.md5(b'password').hexdigest(),
 'ntlm':MD4.new('letmein'.encode('utf-16le')).hexdigest()},indent=2)+'\n')
(inbox/'deep-bcrypt.txt').write_text('Synthetic deeper-queue example\n'+bcrypt.hashpw(b'octopus!',b'$2b$05$abcdefghijklmnopqrstuu').decode()+'\n')
(inbox/'ambiguous.txt').write_text('Synthetic ambiguous digest\n'+hashlib.md5(b'ctf-only-demo').hexdigest()+'\n')
(inbox/'unsupported.txt').write_text('Synthetic unsupported-format record\n$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$c29tZWhhc2g\n')
plain=root/'.tmp/zip-demo-note.txt';plain.write_text('Synthetic hash-watch ZIP fixture.\n')
archive=inbox/'locked.zip'
if archive.exists():
 raise SystemExit('Demo ZIP already exists; preserve it rather than overwrite.')
subprocess.run(['zip','-q','-j','-P','letmein',archive,plain],check=True)
(root/'validation/demo-original-hashes.json').write_text(json.dumps({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in inbox.iterdir() if p.is_file()},indent=2)+'\n')
print('Created synthetic fixtures, including a ZIP password set to letmein.')
