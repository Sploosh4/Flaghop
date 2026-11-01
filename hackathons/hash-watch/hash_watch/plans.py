"""Immutable candidate plans allow exact restart at a completed byte offset."""
import json
import os
import tempfile
from pathlib import Path
from .tools import JOHN, ROOT, digest
from .store import atomic,atomic_bytes

QUICK = ROOT / 'wordlists/quick.txt'


def prepare(output, wordlist=None):
    quick=b'\n'+QUICK.read_bytes()  # An empty password is a real candidate.
    source=Path(wordlist or JOHN.parent/'password.lst').resolve()
    if source.stat().st_size > 16_000_000:
        raise ValueError('Wordlist exceeds the prototype 16 MB input limit')
    seed_bytes=source.read_bytes()
    # No downloaded breach corpus. The default deeper seeds are John's bundled list.
    seeds=[]
    limited_default=False
    for line in seed_bytes.splitlines():
        if not line or line.startswith(b'#!comment:') or len(line)>96 or b'\0' in line:
            continue
        seeds.append(line)
        if len(seeds)>50000:
            if wordlist is not None:
                raise ValueError('More than 50,000 wordlist seeds; choose a smaller list')
            seeds=seeds[:50000]
            limited_default=True
            break
    identity=digest(b'hash-watch-plan-v3\0'+quick+b'\0'+seed_bytes+(b'\0bundled-first-50000' if wordlist is None else b'\0explicit'))
    folder=Path(output)/'plans'/identity
    if (folder/'manifest.json').exists():
        meta=json.loads((folder/'manifest.json').read_text())
        for name in ('quick','deep'):
            if digest((folder/(name+'.txt')).read_bytes())!=meta[name+'_sha256']:
                raise ValueError('Immutable candidate plan has changed')
        return identity
    folder.mkdir(parents=True,exist_ok=True)
    atomic_bytes(folder/'quick.txt',quick)
    seen=set()
    fd,name=tempfile.mkstemp(prefix='.reader-plan-',suffix='.tmp',dir=folder)
    try:
        with os.fdopen(fd,'wb') as handle:
            for word in quick.splitlines()+seeds:
                variants=[word, word.lower(), word.capitalize(), word.upper()]
                variants += [word+suffix for suffix in [b'1',b'12',b'123',b'!',b'2025',b'2026']]
                for candidate in variants:
                    if candidate not in seen and len(candidate)<=128:
                        handle.write(candidate+b'\n');seen.add(candidate)
            handle.flush();os.fsync(handle.fileno())
        os.replace(name,folder/'deep.txt')
    finally:Path(name).unlink(missing_ok=True)
    meta={'schema_version':1,'recipe':'seed, lowercase, capitalized, uppercase, suffixes 1/12/123/!/2025/2026',
          'source_wordlist':str(source),'source_sha256':digest(seed_bytes),'quick_sha256':digest(quick),
          'deep_sha256':digest((folder/'deep.txt').read_bytes()),'deep_candidates':len(seen),
          'used_seeds':len(seeds),'default_seed_limit_applied':limited_default,
          'seed_selection':'first 50000 accepted bundled seeds' if limited_default else 'all accepted supplied seeds',
          'scope':'finite configured dictionary/variation plan; not exhaustive password space'}
    atomic(folder/'manifest.json',json.dumps(meta,indent=2)+'\n')
    return identity


def batch(path, offset, count):
    words=[]
    with Path(path).open('rb') as handle:
        handle.seek(offset)
        for _ in range(count):
            line=handle.readline()
            if not line:
                break
            words.append(line.rstrip(b'\n'))
        end=handle.tell()
    return words,end
