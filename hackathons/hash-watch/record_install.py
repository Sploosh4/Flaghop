"""Record actual installed tool bytes and the private package/runtime provenance."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parent
tools=root/'.tools'
manifest={'schema_version':1,'john_commit':'5184bc0b8c105f8c5978b112e723d65b2de3e63e',
          'hashcat_tag':'v8.0.0','hashcat_commit':'6a7e3b5a96abcd6373c2e4112bc358abb24dc538',
          'source_patches':['patch_hashcat.py','relocate_runtime.py'],'system_packages_installed':False,
          'tools':{},'private_debian_packages':[]}
for name,path in [('john',tools/'john/run/john'),('hashcat',tools/'hashcat/hashcat')]:
 manifest['tools'][name]={'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
for p in sorted((tools/'debs').glob('*.deb')):
 manifest['private_debian_packages'].append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
manifest['john_build_info']=subprocess.check_output([tools/'john/run/john','--list=build-info'],text=True)
manifest['hashcat_version']=subprocess.check_output([tools/'hashcat/hashcat','--version'],text=True).strip()
manifest['omitted_hashcat_feature']='Generic Rust attack-mode 8 unavailable because cargo is absent; ordinary wordlist recovery is built.'
(tools/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'validation').mkdir(exist_ok=True)
(root/'validation/install.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Recorded private build provenance.')
