"""Relocate only two C-string libclc paths in a private Mesa runtime copy."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
original=root/'.tools/sysroot/usr/lib/x86_64-linux-gnu/libRusticlOpenCL.so.1.0.0'
data=original.read_bytes();before=hashlib.sha256(data).hexdigest()
for name in ['spirv-mesa3d-.spv','spirv64-mesa3d-.spv']:
 old=('/usr/lib/clc/'+name).encode()+b'\0'
 new=('.clc/'+name).encode()+b'\0'
 assert data.count(old)==1,(name,data.count(old))
 data=data.replace(old,new+b'\0'*(len(old)-len(new)))
patched=original.with_name('libRusticlOpenCL-relocated.so')
patched.write_bytes(data)
(root/'.tools/vendors-gpu/rusticl.icd').write_text(str(patched)+'\n')
(root/'.tools/runtime-relocation.json').write_text(json.dumps({'source_sha256':before,'relocated_sha256':hashlib.sha256(data).hexdigest(),'change':'two libclc C-string paths /usr/lib/clc/ -> .clc/; original preserved'},indent=2)+'\n')
print('Relocated private runtime; original and all system libraries unchanged.')
