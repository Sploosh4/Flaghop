"""Local-only Ubuntu build dependencies and immutable upstream sources."""
import hashlib
import io
import json
from pathlib import Path
import shlex
import subprocess
import tarfile
from urllib.parse import unquote
import urllib.request

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / '.tools'
SOURCES = {'john': ('openwall/john', '5184bc0b8c105f8c5978b112e723d65b2de3e63e'),
           'hashcat': ('hashcat/hashcat', '6a7e3b5a96abcd6373c2e4112bc358abb24dc538')}
PACKAGES = ['libssl-dev', 'zlib1g-dev', 'libgmp-dev', 'libbz2-dev',
            'ocl-icd-opencl-dev', 'mesa-opencl-icd', 'pocl-opencl-icd']


def main():
    TOOLS.mkdir(exist_ok=True)
    debs = TOOLS / 'debs'
    debs.mkdir(exist_ok=True)
    sysroot = TOOLS / 'sysroot'
    sysroot.mkdir(exist_ok=True)
    plan = subprocess.check_output(['apt-get', '--print-uris', '--yes', '--download-only',
                                    '--no-install-recommends', '-o', 'Debug::NoLocking=1', 'install', *PACKAGES], text=True)
    (ROOT / '.tmp/dependency-plan.txt').write_text(plan)
    specs = []
    for line in plan.splitlines():
        if line.startswith("'"):
            _, filename, *_ = shlex.split(line)
            name, version, _ = unquote(filename).rsplit('_', 2)
            specs.append(name + '=' + version)
    if specs:
        subprocess.run(['apt-get', 'download', *specs], cwd=debs, check=True)
    manifest = {'source_commits': {}, 'debian_packages': []}
    for deb in sorted(debs.glob('*.deb')):
        subprocess.run(['dpkg-deb', '-x', str(deb), str(sysroot)], check=True)
        manifest['debian_packages'].append({'file': deb.name, 'sha256': hashlib.sha256(deb.read_bytes()).hexdigest()})
    libs = sysroot / 'usr/lib/x86_64-linux-gnu'
    # Development packages refer to runtime libraries already installed on the host.
    for link in libs.glob('*.so'):
        if link.is_symlink() and not link.exists():
            installed = Path('/usr/lib/x86_64-linux-gnu') / link.readlink().name
            if installed.exists():
                link.unlink()
                link.symlink_to(installed)
    vendors = TOOLS / 'vendors'
    vendors.mkdir(exist_ok=True)
    for kind in ('cpu','gpu'):
        (TOOLS / ('vendors-'+kind)).mkdir(exist_ok=True)
    for name, filename in [('pocl', 'libpocl.so.2'), ('rusticl', 'libRusticlOpenCL.so.1')]:
        if (libs / filename).exists():
            (vendors / (name + '.icd')).write_text(str(libs / filename) + '\n')
            kind='cpu' if name=='pocl' else 'gpu'
            (TOOLS / ('vendors-'+kind) / (name+'.icd')).write_text(str(libs/filename)+'\n')
    for name, (repo, commit) in SOURCES.items():
        folder = TOOLS / name
        if not folder.exists():
            url = f'https://codeload.github.com/{repo}/tar.gz/{commit}'
            with urllib.request.urlopen(url, timeout=180) as response:
                data = response.read(120_000_001)
            if len(data) > 120_000_000:
                raise ValueError('Source archive exceeds limit')
            with tarfile.open(fileobj=io.BytesIO(data)) as tar:
                members = tar.getmembers()
                prefix = members[0].name.split('/')[0]
                tar.extractall(TOOLS, filter='data')
            (TOOLS / prefix).rename(folder)
            manifest['source_commits'][name] = {'repository': repo, 'commit': commit,
                                               'archive_sha256': hashlib.sha256(data).hexdigest()}
        else:
            manifest['source_commits'][name] = {'repository': repo, 'commit': commit}
    (TOOLS / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Downloaded and extracted private dependencies; no system packages installed.')


if __name__ == '__main__':
    main()
