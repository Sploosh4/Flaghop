"""Create offline data fixtures only: no challenge services, accounts or targets."""
import base64,bz2,codecs,crypt,csv,gzip,hashlib,io,json,lzma,random,re,sqlite3,struct,subprocess,tarfile,tempfile,zipfile,zlib
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path[:0]=[str(HERE.parent),str(HERE.parents[1]/'hash-watch')]
import bcrypt
from Crypto.Hash import MD4

MESSAGES=[b'The spare key is under the blue flower pot.',b'Meet the librarian beside the north window at noon.',b'NOTE_731_RIVER_BLUE']
SEEDS=[b'cobalt-novel-47',b'cafe-fixture',b'caf\xc3\xa9-noir',b'lab:pass!',b'two words',b'L'*60,b'test1',b'test',b'thatsworking']


def zip_bytes(content,member='notes/evidence.txt'):
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as archive:archive.writestr(member,content)
 return b.getvalue()

def tar_bytes(content):
 b=io.BytesIO()
 with tarfile.open(fileobj=b,mode='w') as archive:
  info=tarfile.TarInfo('notes/evidence.txt');info.size=len(content);info.mtime=0
  archive.addfile(info,io.BytesIO(content))
 return b.getvalue()

def digest(fmt,password):
 if fmt=='ntlm':return MD4.new(password.decode().encode('utf-16le')).hexdigest()
 if fmt=='bcrypt':return bcrypt.hashpw(password,b'$2b$05$abcdefghijklmnopqrstuu').decode()
 if fmt=='sha512crypt':return crypt.crypt(password.decode(),'$6$rounds=1000$evalsalt$')
 return hashlib.new(fmt,password).hexdigest()

def labelled(fmt,password):
 value=digest(fmt,password)
 return (value if fmt in ('bcrypt','sha512crypt') else fmt+'="'+value+'"').encode()

def png(content,compressed=False):
 def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
 return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,2,0,0,0))+chunk(b'zTXt' if compressed else b'tEXt',b'Comment\0'+(b'\0'+zlib.compress(content) if compressed else content))+chunk(b'IDAT',zlib.compress(b'\0\0\0\0'))+chunk(b'IEND',b'')

def pdf(content,compressed=False):
 stream=zlib.compress(content) if compressed else content
 objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>',b'<< /Length '+str(len(stream)).encode()+(b' /Filter /FlateDecode' if compressed else b'')+b' >>\nstream\n'+stream+b'\nendstream']
 data=b'%PDF-1.4\n';offsets=[]
 for i,obj in enumerate(objects,1):offsets.append(len(data));data+=str(i).encode()+b' 0 obj\n'+obj+b'\nendobj\n'
 xref=len(data);data+=b'xref\n0 5\n0000000000 65535 f \n'+b''.join(f'{o:010d} 00000 n \n'.encode() for o in offsets)
 return data+b'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n'+str(xref).encode()+b'\n%%EOF\n'


def main():
 out=HERE/'corpus';out.mkdir(exist_ok=False)
 cases=[]
 def add(name,group,data,goal,expected=b'',*,scope='supported',fmt=None,**extra):
  path=out/(name+'.bin');path.write_bytes(data)
  cases.append({'id':name,'group':group,'goal':goal,'expected_hex':expected.hex(),'scope':scope,'format':fmt,'input':str(path),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),**extra})
 for i,message in enumerate(MESSAGES):
  b64=base64.b64encode(message)
  transforms={
   'base64':b64,'hex':message.hex().encode(),'three_base64':base64.b64encode(base64.b64encode(b64)),
   'base32':base64.b32encode(message),'base85':base64.b85encode(message),'ascii85':base64.a85encode(message),
   'unpadded':b64.rstrip(b'='),'wrapped':b'\r\n'.join(b64[k:k+16] for k in range(0,len(b64),16)),
   'urlsafe':base64.urlsafe_b64encode(message+b'???'),'escaped_bytes':b''.join(b'\\x%02x'%n for n in message),
   'json_base64':json.dumps({'payload':b64.decode(),'label':'offline fixture'}).encode(),
   'html_base64':b'<div data-note="'+b64+b'">offline fixture</div>',
   'js_concat':b'const evidence="'+b64[:16]+b'" + "'+b64[16:]+b'";',
   'percent_bytes':b''.join(b'%%%02X'%n for n in message),
   'unicode_escapes':b''.join(b'\\u%04x'%n for n in message),
   'utf16le':('payload="'+b64.decode()+'"').encode('utf-16'),
   'utf16be':b'\xfe\xff'+('payload="'+b64.decode()+'"').encode('utf-16be'),
   'rot13':codecs.encode(message.decode(),'rot_13').encode(),
   'reverse':message[::-1],
  }
  for name,data in transforms.items():
   desired=name in ('base32','base85','ascii85','js_concat','percent_bytes','unicode_escapes','rot13','reverse')
   add(f'text_{i}_{name}','text',data,'plaintext',message+b'???' if name=='urlsafe' else message,scope='desired' if desired else 'supported')
  containers={
   'zip_plain':zip_bytes(message),'zip_base64':zip_bytes(b64),'zip_hex':zip_bytes(message.hex().encode()),
   'gzip_plain':gzip.compress(message,mtime=0),'gzip_base64':gzip.compress(b64,mtime=0),
   'base64_zip':base64.b64encode(zip_bytes(b64)),
   'gzip_zip':gzip.compress(zip_bytes(b64),mtime=0),'zip_gzip':zip_bytes(gzip.compress(b64,mtime=0)),
   'nested_zip':zip_bytes(zip_bytes(b64),'inner.zip'),'tar_base64':tar_bytes(b64),
   'tar_gzip':gzip.compress(tar_bytes(b64),mtime=0),'bzip2':bz2.compress(b64),'xz':lzma.compress(b64),
   'zip_odd_path':zip_bytes(b64,'../../not-extracted-to-disk.txt'),
   'png_text':png(b64),'png_compressed_text':png(b64,True),
   'pdf_plain_stream':pdf(b64),'pdf_flate_stream':pdf(b64,True),
  }
  for name,data in containers.items():
   desired=name in ('tar_base64','tar_gzip','bzip2','xz','png_compressed_text','pdf_plain_stream','pdf_flate_stream')
   add(f'container_{i}_{name}','containers',data,'plaintext',message,scope='desired' if desired else 'supported')
 for fmt in ('md5','sha1','sha256','sha512','ntlm','bcrypt','sha512crypt'):
  for index,password in enumerate((b'password',b'letmein',b'cobalt-novel-47!')):
   data=labelled(fmt,password)
   if index==1 and fmt not in ('bcrypt','sha512crypt'):
    data=json.dumps({fmt:digest(fmt,password).upper()}).encode()
   add(f'hash_{fmt}_{index}','hash_recovery',data,'password',password,fmt=fmt,wordlist_policy='common quick guesses plus explicit audit seed list')
  record=labelled(fmt,b'admin')
  for name,data in [('b64',base64.b64encode(record)),('hex',record.hex().encode()),('utf16',record.decode().encode('utf-16'))]:
   add(f'hash_wrapped_{fmt}_{name}','hash_chains',data,'password',b'admin',fmt=fmt)
 # Upstream vectors are external known answers, not generated by the test hash function.
 upstream=[('5a105e8b9d40e1329780d62ea2265d8a',b'test1'),('098f6bcd4621d373cade4e832627b4f6',b'test'),('378e2c4a07968da2eca692320136433d',b'thatsworking')]
 for n,(value,password) in enumerate(upstream):
  add(f'upstream_john_md5_{n}','upstream_vectors',b'md5="'+value.encode()+b'"','password',password,fmt='md5',source='John rawMD5_fmt_plug.c, pinned installed source commit 5184bc0b8c105f8c5978b112e723d65b2de3e63e')
 for name,password in [('empty',b''),('unicode','caf\u00e9-noir'.encode()),('colon',b'lab:pass!'),('spaces',b'two words'),('long',b'L'*60)]:
  add(f'password_shape_{name}','password_edges',labelled('md5',password),'password',password,fmt='md5')
 missing=b'outside-the-audit-plan-783421!'
 add('password_not_in_plan','password_edges',labelled('md5',missing),'unrecovered',missing,fmt='md5')
 for name,algo in [('sha224','sha224'),('sha384','sha384')]:add('unsupported_'+name,'unsupported_hash',labelled(algo,b'password'),'hash_detected',digest(algo,b'password').encode(),scope='desired')
 unsupported=[b'$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$c29tZWhhc2g',crypt.crypt('password','$5$rounds=1000$audit$').encode(),b'pbkdf2_sha256$10000$audit$s29tZWhhc2g==',b'$y$j9T$auditsalt$synthetic_digest_for_identification_only']
 for n,value in enumerate(unsupported):add(f'unsupported_structured_{n}','unsupported_hash',value,'needs_adapter',scope='supported')
 value=hashlib.md5(b'password').hexdigest()
 for n,data in enumerate([value.encode(),b'password_hash="'+value.encode()+b'"',b'checksum="'+value.encode()+b'"',json.dumps({'checksum':{'md5':value}}).encode(),json.dumps({'checksums':[{'md5':value}]}).encode(),b'md5sum="'+value.encode()+b'"']):
  add(f'review_{n}','ambiguity',data,'review',value.encode())
 for n,data in enumerate([b'{"algorithm":"md5","hash":"'+value.encode()+b'"}',b'user:1000:aad3b435b51404eeaad3b435b51404ee:'+digest('ntlm',b'password').encode()+b':::',b'checksum: md5="'+value.encode()+b'"',b'log entry '+json.dumps({'checksum':{'md5':value}}).encode()]):
  add(f'context_gap_{n}','context',data,'no_autocrack' if n>1 else 'password',b'password',scope='desired')
 for n,data in enumerate([bcrypt.hashpw(b'password',b'$2b$05$abcdefghijklmnopqrstuu')+b'EXTRA',b'Q'+bcrypt.hashpw(b'password',b'$2b$05$abcdefghijklmnopqrstuu'),b'PK\x03\x04garbage',b'%PDF-1.7\ntruncated',b'\x1f\x8b\x08broken',zip_bytes(b'hello')[:-30],gzip.compress(b'hello')[:-5],b'-----BEGIN OPENSSH PRIVATE KEY-----\nnot-a-key\n-----END OPENSSH PRIVATE KEY-----']):
  add(f'malformed_{n}','malformed',data,'diagnosed',scope='robustness')
 # Ordinary files with no intentionally hidden payload. Extraction alone is not
 # a false positive; nonsense accepted plaintext / automatic cracking is noise.
 negatives=[b'',b'The meeting starts at noon. Bring a notebook.',b'{"enabled":true,"retries":3,"mode":"development"}',b'2026-10-31 INFO request complete status=200 bytes=1234\n',b'GET /health HTTP/1.1\r\nHost: example.invalid\r\n',b'----- fixture separator -----\n',b'const total = price * quantity;\n',b'user,role\nAlice,editor\nBob,viewer\n',b'<html><body><h1>Offline report</h1></body></html>',b'[section]\nenabled=true\ncount=4\n',b'No hidden content is deliberately embedded in this text.',b'0123456789abcdef0123456789abcdef',b'550e8400-e29b-41d4-a716-446655440000',b'\0'*512,b'\xff'*512]
 rng=random.Random(7312026)
 negatives += [rng.randbytes(n) for n in (64,256,1024,4096)]
 for n,data in enumerate(negatives):add(f'negative_{n}','negative_controls',data,'quiet',scope='negative')
 add('size_limit','limits',b'x'*2_000_001,'size_guard',scope='boundary')
 add('depth_limit','limits',base64.b64encode(base64.b64encode(base64.b64encode(base64.b64encode(base64.b64encode(base64.b64encode(base64.b64encode(base64.b64encode(base64.b64encode(base64.b64encode(MESSAGES[0])))))))))),'limit_notice',scope='boundary')
 add('archive_member_limit','limits',multi_zip(),'limit_notice',scope='boundary')
 add('gzip_expansion_limit','limits',gzip.compress(b'x'*2_000_001,mtime=0),'limit_notice',scope='boundary')
 with tempfile.TemporaryDirectory() as temporary:
  t=Path(temporary);(t/'note.txt').write_bytes(base64.b64encode(MESSAGES[0]))
  subprocess.run(['zip','-q','-j','-P','letmein',str(t/'locked.zip'),str(t/'note.txt')],check=True)
  locked=(t/'locked.zip').read_bytes()
  add('encrypted_zip','protected_files',locked,'password',b'letmein',fmt='pkzip')
  add('base64_encrypted_zip','protected_files',base64.b64encode(locked),'plaintext',MESSAGES[0])
  subprocess.run(['ssh-keygen','-q','-t','ed25519','-N','password','-f',str(t/'fixture-key')],check=True)
  add('encrypted_ssh_key','protected_files',(t/'fixture-key').read_bytes(),'password',b'password',fmt='ssh',scope='desired',note='Ephemeral offline key fixture; never installed, connected or used for authentication')
  database=t/'fixture.sqlite';connection=sqlite3.connect(database)
  connection.execute('CREATE TABLE notes(payload TEXT)');connection.execute('INSERT INTO notes VALUES (?)',(base64.b64encode(MESSAGES[0]).decode(),));connection.commit();connection.close()
  add('sqlite_embedded_base64','documents',database.read_bytes(),'plaintext',MESSAGES[0],scope='desired')
  encoded=base64.b64encode(MESSAGES[0]);password=encoded
  SEEDS.append(password)
  add('recovered_password_is_base64','hash_chains',labelled('md5',password),'plaintext',MESSAGES[0])
 public=json.loads((HERE/'public-manifest.json').read_text())
 for n,item in enumerate(x for x in public if not x.get('license') and 'sha256'in x):
  data=Path(item['local']).read_bytes()
  add(f'public_{n}','public_unfamiliar',data,'observe',scope='unlabelled',origin=item)
  if n<10 and not item['path'].endswith(('.xz','.tar')):
   addition=b'\nfixture="'+base64.b64encode(labelled('md5',b'password'))+b'"\n'
   add(f'public_augmented_{n}','public_augmented',data+addition,'password',b'password',fmt='md5',scope='desired',origin=item,augmentation='Appended a labelled known-answer Base64 field; original upstream sample retained separately')
 (HERE/'seeds.txt').write_bytes(b'\n'.join(SEEDS)+b'\n')
 (HERE/'manifest.json').write_text(json.dumps({'cases':cases,'seed':7312026,'wordlist':'explicit small audit seeds plus native quick list; answers are never passed as regexes','no_ctf_services_or_targets':True},indent=2)+'\n')
 print(json.dumps({'cases':len(cases),'groups':{g:sum(c['group']==g for c in cases) for g in sorted({c['group'] for c in cases})}}))

def multi_zip():
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as a:
  for n in range(40):a.writestr(str(n)+'.txt',b'ordinary short note '+str(n).encode())
 return b.getvalue()
if __name__=='__main__':main()
