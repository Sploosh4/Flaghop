#!/usr/bin/env python3
"""Known-answer and gap probes against the real local reader prototypes.

No production orchestration is added here. Tandem cases run the existing readers
independently; optional manual handoffs are labelled controls, never counted as
current automatic capability. All fixtures are synthetic and stay under --out.
"""
import argparse
import base64
import codecs
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import time
import traceback
import zipfile

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / 'cipher-watch'), str(ROOT / 'hash-watch')]
from cipher_watch.scanner import Scanner, Settings as CipherSettings
from cipher_watch.adapters import decode
from hash_watch.pipeline import Pipeline, Settings as HashSettings
from hash_watch.detect import identify
from hash_watch.engines import crack_batch
from hash_watch.tools import digest, fingerprints
import bcrypt
from Crypto.Hash import MD4

MESSAGE = b'hello there general'
PASSWORD = b'password'
MD5 = hashlib.md5(PASSWORD).hexdigest().encode()
RECORD = b'md5="' + MD5 + b'"'


@dataclass
class Case:
    name: str
    phase: str
    reader: str
    data: bytes
    goal: str
    expected: bytes = MESSAGE
    options: dict = field(default_factory=dict)
    note: str = ''


def corpus():
    cases = []
    def add(name, phase, reader, data, goal, expected=MESSAGE, **options):
        cases.append(Case(name, phase, reader, data, goal, expected, options))
    b64 = base64.b64encode(MESSAGE)
    for name, data in [('embedded_base64', b'payload="'+b64+b'"'),
                       ('three_base64_layers', base64.b64encode(base64.b64encode(b64))),
                       ('hex', MESSAGE.hex().encode()),
                       ('backslash_x', b''.join(b'\\x%02x'%n for n in MESSAGE)),
                       ('utf8_source_offset', 'é🙂\n'.encode()+b'"'+b64+b'"'),
                       ('duplicate_locations', b'"'+b64+b'"\n"'+b64+b'"')]:
        add(name, 'contract', 'cipher', data, 'decoded', guided=True)
    # base64dump's BU/PU formats encode little-endian two-byte words, not
    # JavaScript Unicode text. Exercise that actual contract separately.
    even = MESSAGE + b'!'
    for prefix, name in [(b'\\u','backslash_u_words'),(b'%u','percent_u_words')]:
        encoded=b''.join(prefix+even[i:i+2][::-1].hex().encode() for i in range(0,len(even),2))
        add(name,'contract','cipher',encoded,'decoded',even,guided=True)
    add('javascript_unicode_escapes','extension','cipher',b''.join(b'\\u%04x'%n for n in MESSAGE),'decoded',guided=True)
    add('percent_u_unicode_text','extension','cipher',b''.join(b'%%u%04x'%n for n in MESSAGE),'decoded',guided=True)
    add('default_checker_base64', 'contract', 'cipher', b64, 'decoded')
    add('default_checker_three_layers', 'contract', 'cipher', base64.b64encode(base64.b64encode(b64)), 'decoded')
    add('binary_first_layer_retained', 'contract', 'cipher', base64.b64encode(bytes(range(256))), 'binary', bytes(range(256)))
    add('plain_short_negative', 'contract', 'cipher', b'Hi!\n', 'no_findings')
    add('regex_mismatch_must_not_accept','contract','cipher',b64,'no_findings',guided_regex='^IMPOSSIBLE_AUDIT_MARKER_936743$')
    add('plain_english_negative', 'contract', 'cipher', b'The meeting starts at noon. Bring a notebook.\n', 'no_findings')
    add('hex_binary_negative', 'contract', 'cipher', b'deadbeefdeadbeefdeadbeef', 'no_findings')
    add('base64_candidate_limit_visible', 'contract', 'cipher', b'"'+b64+b'"\n"'+b64+b'"', 'warning', b'candidate_count_limit', max_candidates=1, guided=True)
    add('wrapped_base64', 'extension', 'cipher', b'\n'.join(b64[i:i+12] for i in range(0,len(b64),12)), 'decoded', guided=True)
    add('concatenated_base64', 'extension', 'cipher', b'payload="'+b64[:12]+b'" + "'+b64[12:]+b'"', 'decoded', guided=True)
    add('unpadded_base64', 'extension', 'cipher', b64.rstrip(b'='), 'decoded', guided=True)
    special = MESSAGE + b'???'
    add('urlsafe_base64', 'extension', 'cipher', base64.urlsafe_b64encode(special), 'decoded', special, guided=True)
    add('url_percent_escapes', 'extension', 'cipher', b''.join(b'%%%02X'%n for n in MESSAGE), 'decoded', guided=True)
    add('short_encoded_secret', 'extension', 'cipher', base64.b64encode(b'flag{x}'), 'decoded', b'flag{x}', guided=True)
    add('utf16_base64_source', 'extension', 'cipher', ('payload="'+b64.decode()+'"').encode('utf-16'), 'decoded', guided=True)
    add('raw_rot13_passage', 'extension', 'cipher', codecs.encode(MESSAGE.decode(),'rot_13').encode(), 'decoded', guided=True, direct_probe=True)
    add('gzip_inside_base64', 'extension', 'cipher', base64.b64encode(gzip.compress(MESSAGE,mtime=0)), 'decoded', guided=True)
    add('base85_opt_in', 'extension', 'cipher', base64.b85encode(MESSAGE), 'decoded', guided=True, encodings='b85')
    add('base85_default', 'extension', 'cipher', base64.b85encode(MESSAGE), 'decoded', guided=True)
    add('two_distinct_payloads', 'contract', 'cipher', b'"'+b64+b'"\n"'+base64.b64encode(b'hello there commander')+b'"', 'both_decoded', guided_regex='hello there (general|commander)')
    for fmt in ('md5','sha1','sha256','sha512','ntlm'):
        value = MD4.new(PASSWORD.decode().encode('utf-16le')).hexdigest() if fmt=='ntlm' else hashlib.new(fmt,PASSWORD).hexdigest()
        add('labelled_'+fmt,'contract','hash',(fmt+'="'+value+'"').encode(),'recovered',PASSWORD)
    add('uppercase_digest','contract','hash',b'md5="'+MD5.upper()+b'"','recovered',PASSWORD)
    add('json_hash_field','contract','hash',b'{"md5": "'+MD5+b'"}','recovered',PASSWORD)
    add('bcrypt','contract','hash',bcrypt.hashpw(PASSWORD,b'$2b$05$abcdefghijklmnopqrstuu'),'recovered',PASSWORD)
    import crypt
    add('sha512crypt','contract','hash',crypt.crypt('password','$6$rounds=1000$audit-salt$').encode(),'recovered',PASSWORD)
    add('bare_digest_requires_review','contract','hash',MD5,'needs_format')
    add('checksum_context_requires_review','contract','hash',b'md5sum="'+MD5+b'"','needs_format',raw_format='md5')
    add('unsupported_argon_retained','contract','hash',b'$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$c29tZWhhc2g','needs_adapter')
    add('hash_candidate_limit_visible','contract','hash',RECORD+b'\nsha1="'+hashlib.sha1(PASSWORD).hexdigest().encode()+b'"','warning',b'candidate_count_limit',max_candidates=1)
    add('sha256_with_hyphen','contract','hash',b'SHA-256 = "'+hashlib.sha256(PASSWORD).hexdigest().encode()+b'"','recovered',PASSWORD)
    add('ntlm_pwdump_record','extension','hash',b'josh:1000:aad3b435b51404eeaad3b435b51404ee:'+MD4.new('password'.encode('utf-16le')).hexdigest().encode()+b':::','recovered',PASSWORD)
    add('utf16_hash_source','extension','hash',RECORD.decode().encode('utf-16'),'recovered',PASSWORD)
    add('algorithm_sibling_field','extension','hash',b'{"algorithm":"md5","hash":"'+MD5+b'"}','recovered',PASSWORD)
    add('sha384_discovery','extension','hash',b'sha384="'+hashlib.sha384(PASSWORD).hexdigest().encode()+b'"','detected')
    add('john_record_in_text','extension','hash',b'archive.zip:$pkzip2$1*1*2*0*0*0*0*0*0*0*$/pkzip2$:archive.zip','detected')
    add('malformed_bcrypt_boundary','extension','hash',bcrypt.hashpw(PASSWORD,b'$2b$05$abcdefghijklmnopqrstuu')+b'EXTRA','not_auto_queued')
    add('md5_label_on_checksum','extension','hash',b'{"checksum": {"md5":"'+MD5+b'"}}','not_auto_queued')
    for name,password in [('empty_password',b''),('unicode_password','pássword'.encode()),('colon_password',b'pass:word')]:
        add(name,'extension','hash',b'md5="'+hashlib.md5(password).hexdigest().encode()+b'"','recovered',password,seed=password)
    add('bcrypt_empty_password','extension','hash',bcrypt.hashpw(b'',b'$2b$05$abcdefghijklmnopqrstuu'),'recovered',b'',seed=b'')
    # Real native single-batch tests distinguish reader/queue failures from engines.
    for engine in ('john','hashcat'):
        for fmt in ('md5','ntlm'):
            add('native_'+engine+'_'+fmt,'contract','native',b'','recovered',PASSWORD,engine=engine,format=fmt)
        add('native_'+engine+'_empty_md5','extension','native',b'','recovered',b'',engine=engine,format='md5')
    for name,data in [('base64_hash',base64.b64encode(RECORD)),
                      ('hex_hash',RECORD.hex().encode()),
                      ('double_base64_hash',base64.b64encode(base64.b64encode(RECORD))),
                      ('mixed_plain_and_encoded_hash',b'comment="'+base64.b64encode(RECORD)+b'"\n'+b'sha1="'+hashlib.sha1(b'letmein').hexdigest().encode()+b'"')]:
        add(name,'tandem','tandem',data,'recovered',PASSWORD,bridge_probe=True)
    add('unprotected_zip_encoded_member','tandem','tandem',b'','decoded',container='zip')
    add('base64_encrypted_zip','tandem','tandem',b'','recovered',b'letmein',container='locked_base64',bridge_probe=True)
    add('recovered_password_is_encoded_text','tandem','tandem',b'md5="'+hashlib.md5(b64).hexdigest().encode()+b'"','decoded',MESSAGE,seed=b64,password_bridge_probe=True)
    return cases


def cipher_scan(case, source, folder):
    settings = dict(decode_seconds=2,file_seconds=8)
    if case.options.get('guided'):
        settings['regex']=re.escape(case.expected.decode())
    if case.options.get('guided_regex'):
        settings['regex']=case.options['guided_regex']
    for key in ('encodings','max_candidates'):
        if key in case.options:
            settings[key]=case.options[key]
    scanner=Scanner(source.parent,folder,ROOT/'cipher-watch/.tools/base64dump.py',ROOT/'cipher-watch/.tools/ciphey',CipherSettings(**settings))
    try:
        report=scanner.scan(source)
        return json.loads(report.read_text()),str(report)
    finally:
        scanner.close()


def hash_scan(case,source,folder):
    seeds=folder.parent/'seeds.txt'
    seeds.write_bytes(case.options.get('seed',b'audit-seed')+b'\n')
    settings=dict(batch_size=256,quick_seconds=3,slice_seconds=8,threads=4)
    for key in ('raw_format','max_candidates'):
        if key in case.options:
            settings[key]=case.options[key]
    pipeline=Pipeline(source.parent,folder,HashSettings(**settings),wordlist=seeds)
    try:
        reportpath=pipeline.scan(source)
        # Bounded finite plans; no unbounded password search during tests.
        steps=0
        while steps<8 and pipeline.work_one():
            steps+=1
        report=json.loads(reportpath.read_text())
        return {'report':report,'targets':pipeline.store.targets(),'batches':steps,'queue':str(folder/'queue.json')},str(reportpath)
    finally:
        pipeline.close()


def evaluate(case,observed):
    c=observed.get('cipher',{})
    h=observed.get('hash',{})
    targets=h.get('targets',observed.get('targets',[]))
    texts=[f['text'] for f in c.get('findings',[])]
    if case.reader=='native':
        return observed.get('native',{}).get('status')=='recovered' and observed['native'].get('plaintext_hex')==case.expected.hex()
    if case.goal=='decoded':
        return case.expected.decode() in texts
    if case.goal=='both_decoded':
        return {'hello there general','hello there commander'}<=set(texts)
    if case.goal=='binary':
        return any(base64.b64decode(x['decoded_b64'])==case.expected and x['status']=='binary_first_layer' for x in c.get('candidates',[]))
    if case.goal=='no_findings':
        return not c.get('findings')
    if case.goal=='warning':
        warnings=c.get('coverage',{}).get('warnings',[]) if case.reader=='cipher' else h.get('report',{}).get('warnings',[])
        return case.expected.decode() in warnings
    if case.goal=='recovered':
        return any(t['status']=='recovered' and t['recovered_hex']==case.expected.hex() for t in targets)
    if case.goal in ('needs_format','needs_adapter'):
        return bool(targets) and all(t['status']==case.goal for t in targets)
    if case.goal=='detected':
        return bool(h.get('report',{}).get('candidates'))
    if case.goal=='not_auto_queued':
        return all(t['status'] in ('needs_format','needs_adapter') for t in targets)
    raise ValueError(case.goal)


def native(case,folder):
    fmt=case.options['format']
    target=MD4.new(case.expected.decode().encode('utf-16le')).hexdigest() if fmt=='ntlm' else hashlib.md5(case.expected).hexdigest()
    return crack_batch(folder,target=target,format_id=fmt,words=[case.expected],engine=case.options['engine'],seconds=12,threads=4)


def bridge_probe(case,observed,folder):
    """Test-only intervention, not automatic product behavior or a success result."""
    candidates=observed.get('cipher',{}).get('candidates',[])
    values=[base64.b64decode(c['decoded_b64']) for c in candidates]
    values.extend(f['text'].encode() for f in observed.get('cipher',{}).get('findings',[]))
    if case.name=='double_base64_hash':
        # Explicit second manual decode: reader may not accept a hash as plaintext.
        values.append(base64.b64decode(base64.b64decode(case.data)))
    if case.name=='hex_hash':
        values.append(bytes.fromhex(case.data.decode()))
    values=list(dict.fromkeys(values))
    proofs=[]
    for n,value in enumerate(values):
        if not identify(value)[0] and not value.startswith(b'PK\x03\x04'):
            continue
        inbox=folder/f'bridge-{n}'/'inbox';inbox.mkdir(parents=True)
        source=inbox/'decoded.bin';source.write_bytes(value)
        result,ref=hash_scan(case,source,inbox.parent/'hash')
        proofs.append({'intervention':'manually submit decoded bytes to Hash Watch','report':ref,
                       'states':[t['status'] for t in result['targets']],
                       'expected_recovered':any(t['status']=='recovered' and t['recovered_hex']==case.expected.hex() for t in result['targets'])})
    return proofs


def evidence_issues(source_bytes, observed):
    """Independently check evidence hashes and byte locations, not just answers."""
    issues=[]
    cipher=observed.get('cipher')
    if cipher:
        if cipher['source']['sha256']!=digest(source_bytes):
            issues.append('cipher source SHA-256 mismatch')
        for candidate in cipher['candidates']:
            start=candidate['offset'];end=start+candidate['length']
            if not 0<=start<end<=len(source_bytes) or source_bytes[start:end]!=base64.b64decode(candidate['encoded_b64']):
                issues.append('cipher encoded source span mismatch')
            if candidate['line']!=source_bytes.count(b'\n',0,start)+1 or candidate['byte_column']!=start-source_bytes.rfind(b'\n',0,start):
                issues.append('cipher line/byte-column mismatch')
        for finding in cipher['findings']:
            if finding['decoded_sha256']!=digest(finding['text'].encode()):
                issues.append('cipher decoded SHA-256 mismatch')
    hashes=observed.get('hash',{}).get('report')
    if hashes:
        if hashes['source_sha256']!=digest(source_bytes):
            issues.append('hash source SHA-256 mismatch')
        for candidate in hashes['candidates']:
            loc=candidate['location']
            if 'offset' not in loc:
                continue  # helper-derived records explicitly lack raw byte spans
            start=loc['offset'];end=start+loc['length']
            if not 0<=start<end<=len(source_bytes) or source_bytes[start:end]!=candidate['value'].encode():
                issues.append('hash source span mismatch')
            if loc['line']!=source_bytes.count(b'\n',0,start)+1 or loc['byte_column']!=start-source_bytes.rfind(b'\n',0,start):
                issues.append('hash line/byte-column mismatch')
    return issues


def execute(case,out):
    folder=out/case.name
    inbox=folder/'inbox';inbox.mkdir(parents=True)
    source=inbox/'fixture.bin'
    data=case.data
    if case.options.get('container')=='zip':
        with zipfile.ZipFile(source,'w',compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr('nested/payload.txt',base64.b64encode(MESSAGE))
    elif case.options.get('container')=='locked_base64':
        plain=folder/'note.txt';plain.write_bytes(b'Synthetic protected archive for reader tests.\n')
        archive=folder/'locked.zip'
        subprocess.run(['zip','-q','-j','-P','letmein',str(archive),str(plain)],check=True)
        source.write_bytes(base64.b64encode(archive.read_bytes()))
    else:
        source.write_bytes(data)
    before=(digest(source.read_bytes()),source.stat().st_mtime_ns)
    observed={}
    refs=[]
    started=time.monotonic()
    try:
        if case.reader in ('cipher','tandem'):
            observed['cipher'],ref=cipher_scan(case,source,folder/'cipher');refs.append(ref)
        if case.reader in ('hash','tandem'):
            observed['hash'],ref=hash_scan(case,source,folder/'hash');refs.append(ref)
        if case.reader=='native':
            observed['native']=native(case,folder/'native')
        met=evaluate(case,observed)
        if not met and case.options.get('bridge_probe'):
            observed['manual_bridge_controls']=bridge_probe(case,observed,folder)
        if not met and case.options.get('direct_probe'):
            observed['direct_ciphey_control'],raw=decode(ROOT/'cipher-watch/.tools/ciphey',case.data.decode(),home=folder/'direct-home',cwd=folder,seconds=3,regex=re.escape(case.expected.decode()))
            (folder/'direct-ciphey.json').write_text(json.dumps(raw,indent=2))
        if not met and case.options.get('password_bridge_probe'):
            controls=[]
            for n,target in enumerate(observed.get('hash',{}).get('targets',[])):
                if target['status']!='recovered':
                    continue
                child=folder/f'password-bridge-{n}'/'inbox';child.mkdir(parents=True)
                payload=child/'recovered.txt';payload.write_bytes(bytes.fromhex(target['recovered_hex']))
                result,ref=cipher_scan(case,payload,child.parent/'cipher')
                controls.append({'intervention':'manually submit recovered password bytes to Cipher Watch','report':ref,
                                 'expected_decoded':case.expected.decode() in [f['text'] for f in result['findings']]})
            observed['manual_password_bridge_controls']=controls
        status='pass' if met else ('regression' if case.phase=='contract' else 'gap')
    except Exception:
        status='error'
        observed['harness_exception']=traceback.format_exc()
    unchanged=before==(digest(source.read_bytes()),source.stat().st_mtime_ns)
    issues=evidence_issues(source.read_bytes(),observed)
    if not unchanged or issues:
        status='regression'
    observation=folder/'observation.json'
    observation.write_text(json.dumps(observed,indent=2,ensure_ascii=True)+'\n')
    return {'id':case.name,'phase':case.phase,'reader':case.reader,'goal':case.goal,
            'status':status,'original_unchanged':unchanged,'seconds':round(time.monotonic()-started,3),
            'evidence_issues':issues,
            'checker':'known-answer regex' if case.options.get('guided') or case.options.get('guided_regex') else 'default / not applicable',
            'input_sha256':before[0],'expected_hex':case.expected.hex(),
            'observation':str(observation),'reports':refs,
            'cipher_status':observed.get('cipher',{}).get('status'),
            'cipher_candidate_states':dict(Counter(c['status'] for c in observed.get('cipher',{}).get('candidates',[]))),
            'hash_states':dict(Counter(t['status'] for t in observed.get('hash',{}).get('targets',[]))),
            'manual_bridge_recovered':any(p['expected_recovered'] for p in observed.get('manual_bridge_controls',[])),
            'manual_password_bridge_decoded':any(p['expected_decoded'] for p in observed.get('manual_password_bridge_controls',[])),
            'direct_ciphey_status':observed.get('direct_ciphey_control',{}).get('status')}


def render(report,out):
    totals=report['totals']
    lines=['# Reader capability audit','',f"Run: {report['created_at']}",'',
           'All inputs are synthetic. Existing readers ran independently. Manual handoff controls are diagnostic interventions and do not count as automatic successes. Contract failures are regressions; extension/tandem failures are measured gaps, not promises made by the current README. No score estimates general detection accuracy.','',
           f"Outcomes: {json.dumps(totals,sort_keys=True)}. Originals unchanged: {all(c['original_unchanged'] for c in report['cases'])}.",'',
           '| Case | Phase | Outcome | Cipher candidates | Hash queue | Evidence |',
           '|---|---|---|---|---|---|']
    for c in report['cases']:
        ref=Path(c['observation']).relative_to(out).as_posix()
        lines.append(f"| {c['id']} | {c['phase']} | {c['status']} | {json.dumps(c['cipher_candidate_states'])} | {json.dumps(c['hash_states'])} | [JSON]({ref}) |")
    lines += ['', '## Interpretation','',
              '- A known-answer regex exercises extraction/decoding under a supplied stopping condition; default-checker cases are listed separately.',
              '- A complete scan can contain zero useful candidates. This is processing completion, not proof of coverage.',
              '- An ambiguous bare digest requiring explicit format selection is an intentional safety boundary and passes its contract.',
              '- Hash recovery uses a small finite synthetic wordlist. No failure proves a hash cannot be cracked.',
              '- Read observation.json and each raw process log before attributing a miss to the upstream tool rather than the wrapper.',
              '- No product handoff loop, recursive archive unpacker, or Legion integration was implemented by this test harness.', '']
    (out/'report.md').write_text('\n'.join(lines))


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,required=True,help='New, empty audit directory; never overwrites an existing run')
    parser.add_argument('--phase',choices=['contract','extension','tandem','all'],default='all')
    parser.add_argument('--case',action='append',default=[],help='Exact case ID; repeatable')
    parser.add_argument('--fail-on-gaps',action='store_true')
    args=parser.parse_args(argv)
    cases=[c for c in corpus() if (args.phase=='all' or c.phase==args.phase) and (not args.case or c.name in args.case)]
    cases.sort(key=lambda c: {'contract':0,'extension':1,'tandem':2}[c.phase])
    if not cases:
        parser.error('No matching cases')
    out=args.out.resolve()
    out.mkdir(parents=True,exist_ok=False,mode=0o700)
    # Serialize against the prototype CLI/benchmarks while native cracking runs.
    import fcntl
    lockpath=ROOT/'hash-watch/.tmp/compute.lock'
    lockpath.parent.mkdir(exist_ok=True)
    lock=lockpath.open('a')
    fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    report={'schema_version':1,'created_at':datetime.now(timezone.utc).isoformat(),
            'python':sys.version,'tool_sha256':fingerprints(),
            'reader_code_sha256':{name:digest(b''.join(p.read_bytes() for p in sorted((ROOT/name/package).glob('*.py')))) for name,package in [('cipher-watch','cipher_watch'),('hash-watch','hash_watch')]},
            'scope':'synthetic local files and known-answer finite wordlists; no remote traffic', 'cases':[]}
    for case in cases:
        result=execute(case,out)
        report['cases'].append(result)
        print(f"{result['status'].upper():10} {case.phase:9} {case.name} ({result['seconds']}s)",flush=True)
        report['totals']=dict(Counter(c['status'] for c in report['cases']))
        (out/'summary.json').write_text(json.dumps(report,indent=2)+'\n')
        render(report,out)
    lock.close()
    return int(any(c['status'] in ('regression','error') or (args.fail_on_gaps and c['status']=='gap') for c in report['cases']))

if __name__=='__main__':
    raise SystemExit(main())
