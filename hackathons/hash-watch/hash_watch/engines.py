"""One-batch cracking adapters. Queue progress is committed only after exhaustion."""
import hashlib
from pathlib import Path
import re

import bcrypt
from .detect import FORMATS
from .tools import JOHN, HASHCAT, environment, run, save_raw, digest


def verify(value, format_id, plaintext):
    try:
        if format_id in ('md5','sha1','sha224','sha256','sha384','sha512'):
            return hashlib.new(format_id, plaintext).hexdigest().lower() == value.lower()
        if format_id == 'ntlm':
            from Crypto.Hash import MD4
            return MD4.new(plaintext.decode('utf-8').encode('utf-16le')).hexdigest() == value.lower()
        if format_id == 'bcrypt':
            return bcrypt.checkpw(plaintext, value.encode())
        if format_id == 'sha512crypt':
            import crypt
            return crypt.crypt(plaintext.decode('utf-8'), value) == value
    except (ValueError, UnicodeError):
        return False
    return None


def recovered(path, engine):
    if not path.exists() or not path.stat().st_size:
        return None
    line = path.read_bytes().splitlines()[0]
    if engine == 'hashcat':
        try:
            return bytes.fromhex(line.decode('ascii'))
        except (ValueError, UnicodeError):
            return None
    if b':' not in line:
        return None
    return line.split(b':',1)[1]


def crack_batch(folder, *, target, format_id, words, engine='john', backend='cpu', seconds=15,
                threads=4, stop=None, prefix='attempt', cache_home=None):
    folder = Path(folder).resolve()
    folder.mkdir(parents=True, exist_ok=True)
    hashes = folder / 'target.hash'
    if not hashes.exists():
        hashes.write_text(target + '\n')
    elif hashes.read_text() != target + '\n':
        raise ValueError('Target file changed; refusing to reuse an unrelated session')
    wordfile = folder / (prefix + '.words')
    wordfile.write_bytes(b''.join(w + b'\n' for w in words))
    fmt = FORMATS[format_id]
    home = Path(cache_home or folder / 'home').resolve()
    env = environment(home, threads=threads, backend=backend)
    if engine == 'john':
        pot = folder / 'john.pot'
        argv = [JOHN, '--format='+fmt['john'], '--wordlist='+str(wordfile), '--pot='+str(pot),
                '--session='+str(folder / prefix), hashes]
        if format_id in ('md5','sha1','sha224','sha256','sha384','sha512','ntlm') and threads>1:
            argv.insert(1,'--fork='+str(threads))
        cwd = folder
    else:
        if fmt['hashcat'] is None:
            raise ValueError('Format has no validated Hashcat adapter')
        pot = folder / 'hashcat.recovered.hex'
        argv = [HASHCAT, '-m',str(fmt['hashcat']), '-a','0', hashes, wordfile,
                '--potfile-path',str(folder/'hashcat.pot'), '--outfile',pot, '--outfile-format','3',
                '--session',hashlib.sha256((str(folder)+prefix).encode()).hexdigest()[:24], '--restore-disable', '--quiet']
        cwd = HASHCAT.parent
    existing = recovered(pot, engine)
    raw = run(argv, cwd=cwd, seconds=seconds, env=env, stop=stop)
    save_raw(folder / 'raw', prefix, raw)
    plaintext = recovered(pot,engine)
    if plaintext is None:
        plaintext = existing
    if plaintext is not None:
        confirmed = verify(target, format_id, plaintext)
        if confirmed is False:
            return {'status':'verification_failed', 'execution':raw}
        return {'status':'recovered', 'plaintext_hex':plaintext.hex(),
                'verification':'independent hash check' if confirmed else 'engine verified file-format password',
                'execution':raw}
    if raw['status'] != 'complete':
        return {'status':raw['status'], 'execution':raw}
    text = raw['stdout'] + raw['stderr']
    if engine == 'hashcat':
        complete = raw['returncode'] == 1 # Hashcat: 1 means candidate space exhausted.
    else:
        complete = raw['returncode'] == 0 and re.search(r"^Session(?: '[^\n]*')? completed$", text, re.M) and 'No password hashes loaded' not in text
    return {'status':'exhausted_batch' if complete else 'error', 'execution':raw}


def extract_file(kind, snapshot, folder, *, seconds=15, threads=4):
    folder = Path(folder).resolve()
    helper = {'zip':'zip2john','rar':'rar2john','keepass':'keepass2john',
              'pdf':'pdf2john.pl','office':'office2john.py','ssh':'ssh2john.py','7z':'7z2john.pl'}[kind]
    path = JOHN.parent / helper
    if not path.exists():
        return [], {'status':'missing_extractor','helper':helper}
    if helper.endswith('.py'):
        import sys
        argv = [sys.executable,path,snapshot]
    elif helper.endswith('.pl'):
        argv = ['perl',path,snapshot]
    else:
        argv = [path,snapshot]
    raw = run(argv,cwd=folder,seconds=seconds,env=environment(folder/'extract-home',threads))
    save_raw(folder/'raw','extractor',raw)
    from .detect import EXTRACTED,PREFIX_FORMAT
    candidates=[]
    if raw['status']=='complete' and raw['returncode']==0:
        for line in raw['stdout'].splitlines():
            match = EXTRACTED.search(line)
            if match:
                # Drop filename/comment fields from the executable John record.
                # Preserve them as evidence; external archive references inside the verifier remain intact.
                value=line[match.start():].split(':',1)[0]
                identity=digest(Path(snapshot).read_bytes())+':'+kind+':'+str(len(candidates))
                candidates.append({'value':value,'identity_value':identity,'extractor_record':line,'verifier_source':str(Path(snapshot).resolve()),'verifier_source_sha256':digest(Path(snapshot).read_bytes()),'format':PREFIX_FORMAT[match[1]],
                                   'format_basis':'format-specific extractor '+helper,
                                   'location':{'extractor':helper},'identifications':[]})
    return candidates, {'status':raw['status'], 'returncode':raw['returncode'], 'helper':helper,
                        'found':len(candidates), 'diagnostics':'raw/extractor.stderr.txt'}
