"""Candidate extraction with locations, explicit format evidence and NTH alternatives."""
import re
import json
from name_that_hash import runner

FORMATS = {
    'md5': {'john':'raw-md5', 'hashcat':0, 'width':32},
    'sha1': {'john':'raw-sha1', 'hashcat':100, 'width':40},
    'sha224': {'john':'raw-sha224', 'hashcat':1300, 'width':56},
    'sha384': {'john':'raw-sha384', 'hashcat':10800, 'width':96},
    'sha256': {'john':'raw-sha256', 'hashcat':1400, 'width':64},
    'sha512': {'john':'raw-sha512', 'hashcat':1700, 'width':128},
    'ntlm': {'john':'nt', 'hashcat':1000, 'width':32},
    'bcrypt': {'john':'bcrypt', 'hashcat':3200},
    'sha512crypt': {'john':'sha512crypt', 'hashcat':1800},
    'pkzip': {'john':'PKZIP', 'hashcat':None},
    'zip-aes': {'john':'ZIP', 'hashcat':13600},
    'pdf': {'john':'PDF', 'hashcat':None},
    'office': {'john':'office', 'hashcat':None},
    'oldoffice': {'john':'oldoffice', 'hashcat':None},
    'ssh': {'john':'SSH', 'hashcat':None},
    'keepass': {'john':'KeePass', 'hashcat':None},
    'rar': {'john':'RAR', 'hashcat':None},
    'rar5': {'john':'RAR5', 'hashcat':None},
    '7z': {'john':'7z', 'hashcat':None},
}
MODULAR = re.compile(rb'(?:\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}|\$6\$(?:rounds=\d+\$)?[^$:\s"\x27]{1,16}\$[./A-Za-z0-9]{86})(?![./A-Za-z0-9$])')
UNSUPPORTED = re.compile(rb'(?<![A-Za-z0-9])(?:\$argon2(?:id|i|d)\$|\$y\$|\$5\$|\$[PH]\$|pbkdf2_sha256\$)[^\s\x22\x27<>:]{8,4096}')
RAW = re.compile(rb'(?<![A-Za-z0-9])(?:[a-fA-F0-9]{128}|[a-fA-F0-9]{96}|[a-fA-F0-9]{64}|[a-fA-F0-9]{56}|[a-fA-F0-9]{40}|[a-fA-F0-9]{32})(?![A-Za-z0-9])')
EXTRACTED = re.compile(r'\$(pkzip2?|zip2|pdf|office|oldoffice|sshng|ssh|keepass|RAR3|rar5|7z)\$')
PREFIX_FORMAT = {'pkzip':'pkzip','pkzip2':'pkzip','zip2':'zip-aes','pdf':'pdf','office':'office','oldoffice':'oldoffice',
                 'ssh':'ssh','sshng':'ssh','keepass':'keepass','RAR3':'rar','rar5':'rar5','7z':'7z'}


def alternatives(value):
    try:
        answer = runner.api_return_hashes_as_dict([value], {'popular_only':False})
        # Retain NTH's supported mode alternatives as hypotheses, never as certainty.
        return answer
    except Exception as error:
        return {'identifier_error': str(error)}


def _structured_context(data):
    checksums=set();hints={}
    try:text=data.decode('utf-8')
    except UnicodeError:return checksums,hints
    decoder=json.JSONDecoder();cursor=0
    for _ in range(128):
        opening=re.search(r'[\[{]',text[cursor:])
        if not opening:break
        start=cursor+opening.start()
        try:item,end=decoder.raw_decode(text,start)
        except (ValueError,RecursionError):cursor=start+1;continue
        cursor=end;pending=[(item,False)]
        while pending:
            item,checksum=pending.pop()
            if isinstance(item,dict):
                purpose=str(item.get('purpose','')).lower()
                file_record=(any(key in item for key in ('filename','file_name','filepath','file_path'))
                             or purpose in ('file-integrity','file_integrity','checksum','integrity'))
                checksum=checksum or file_record
                algorithm=item.get('algorithm',item.get('hash_type'))
                value=item.get('hash',item.get('digest'))
                if not checksum and isinstance(algorithm,str) and isinstance(value,str):
                    fmt=algorithm.lower().replace('-','').replace('_','')
                    if fmt in FORMATS and FORMATS[fmt].get('width')==len(value):
                        hints.setdefault(value.lower(),set()).add(fmt)
                pending.extend((value,checksum or key.lower() in ('checksum','checksums','etag','md5sum','sha256sum')) for key,value in item.items())
            elif isinstance(item,list):pending.extend((value,checksum) for value in item)
            elif checksum and isinstance(item,str):checksums.add(item.lower())
    return checksums,hints


def identify(data, *, raw_format=None, limit=128):
    candidates=[];occupied=[];warnings=[];groups={};identification_cache={}
    checksum_values,hints=_structured_context(data)
    pwdump={m.start('nt') for m in re.finditer(rb'(?m)^[^:\r\n]{1,128}:\d+:[a-fA-F0-9]{32}:(?P<nt>[a-fA-F0-9]{32})(?=:)',data)}
    for expression,kind in [(MODULAR,'modular'),(UNSUPPORTED,'unsupported'),(RAW,'raw')]:
        for match in expression.finditer(data):
            if any(start<=match.start()<end for start,end in occupied):continue
            start,end=match.span();value=match[0].decode('ascii');chosen=None;basis=None
            if kind=='modular':
                chosen='bcrypt' if value.startswith('$2') else 'sha512crypt';basis='self-describing prefix';occupied.append((start,end))
            elif kind=='unsupported':
                basis='recognized structured record; recovery adapter not implemented';occupied.append((start,end))
            else:
                before=data[max(0,start-256):start].decode('ascii',errors='ignore')
                label=re.search(r'(?i)\b(md5|sha[-_]?1|sha[-_]?224|sha[-_]?256|sha[-_]?384|sha[-_]?512|ntlm)(?:_hash)?["\x27]?\s*[:=]\s*["\x27]?\s*$',before)
                proposed=label[1].lower().replace('-','').replace('_','') if label else raw_format
                if start in pwdump:
                    proposed='ntlm';basis='NT field in pwdump record'
                elif not label and len(hints.get(value.lower(),set()))==1:
                    proposed=next(iter(hints[value.lower()]));basis='structured algorithm and hash fields'
                if proposed and FORMATS[proposed].get('width')==len(value):
                    chosen=proposed;basis=basis or ('field label' if label else 'explicit --raw-format setting')
                # Parse JSON objects even after log prefixes, and preserve review
                # semantics for checksum-labelled plain text around an algorithm.
                line_start=data.rfind(b'\n',0,start)+1;line_end=data.find(b'\n',end)
                if line_end<0:line_end=len(data)
                context=data[max(line_start,start-256):min(line_end,end+128)]
                if value.lower() in checksum_values or re.search(rb'(?i)\b(?:checksums?|etag|md5sum|sha[-_]?(?:224|256|384|512)?sum)\b',context):
                    chosen=None;basis='checksum context; review required'
            key=(value,chosen,kind=='unsupported')
            if key not in groups:
                if len(groups)>=limit:
                    if 'candidate_count_limit' not in warnings:warnings.append('candidate_count_limit')
                    continue
                groups[key]={'count':0,'records':[]}
            group=groups[key];group['count']+=1
            if len(group['records'])>=8:continue
            if value not in identification_cache:identification_cache[value]=alternatives(value)
            candidate={'value':value,'format':chosen,'format_basis':basis or 'ambiguous bare digest',
                       'identifications':identification_cache[value],'unsupported_type':kind=='unsupported',
                       'location':{'offset':start,'length':end-start,'line':data.count(b'\n',0,start)+1,
                                   'byte_column':start-data.rfind(b'\n',0,start)}}
            group['records'].append(candidate);candidates.append(candidate)
    for group in groups.values():
        for candidate in group['records']:
            candidate['occurrences']=group['count'];candidate['retained_locations']=len(group['records'])
    return sorted(candidates,key=lambda c:c['location']['offset']),warnings


def extractor_for(data):
    if data.startswith(b'PK\x03\x04'):
        return 'zip'
    if data.startswith(b'%PDF-'):
        return 'pdf'
    if data.startswith(bytes.fromhex('d0cf11e0a1b11ae1')):
        return 'office'
    if data.startswith(bytes.fromhex('03d9a29a')):
        return 'keepass'
    if data.startswith(b'Rar!\x1a\x07'):
        return 'rar'
    if data.startswith(b'7z\xbc\xaf\x27\x1c'):
        return '7z'
    if b'-----BEGIN OPENSSH PRIVATE KEY-----' in data or b'-----BEGIN RSA PRIVATE KEY-----' in data or b'-----BEGIN ENCRYPTED PRIVATE KEY-----' in data:
        return 'ssh'
    return None
