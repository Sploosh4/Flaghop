"""Bounded data-only decoders. Source expressions and archive paths are never executed."""
import base64
import bz2
import codecs
import gzip
import io
import lzma
import json
import re
import struct
import zipfile
import zlib


def _zlib(data,maximum):
    decoder=zlib.decompressobj()
    content=decoder.decompress(data,maximum+1)
    if len(content)>maximum or decoder.unconsumed_tail:
        raise ValueError('expansion_limit')
    if not decoder.eof:
        raise ValueError('truncated compressed stream')
    return content


def _containers(data,maximum,members,password):
    if data.startswith(b'PK\x03\x04'):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                total=0
                for number,member in enumerate(archive.infolist()):
                    if number>=members:
                        yield None,'archive_member_limit',{};break
                    if member.is_dir():continue
                    if member.flag_bits&1 and password is None:
                        yield None,'encrypted_member_waiting_password',{'member':member.filename};continue
                    if member.file_size>maximum or total+member.file_size>maximum:
                        yield None,'archive_expansion_limit',{'member':member.filename};continue
                    try:
                        with archive.open(member,pwd=password) as handle:content=handle.read(maximum-total+1)
                        if len(content)>maximum-total:
                            yield None,'archive_expansion_limit',{'member':member.filename};break
                        total+=len(content)
                        yield content,'zip_member',{'member':member.filename,'encrypted':bool(member.flag_bits&1)}
                    except (RuntimeError,NotImplementedError,OSError,zipfile.BadZipFile) as error:
                        yield None,'archive_member_error',{'member':member.filename,'error':str(error)}
        except (zipfile.BadZipFile,OSError,ValueError) as error:
            yield None,'archive_error',{'error':str(error)}
    if data.startswith(b'\x1f\x8b'):
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(data)) as handle:content=handle.read(maximum+1)
            yield (None,'gzip_expansion_limit',{}) if len(content)>maximum else (content,'gzip_member',{})
        except (OSError,EOFError) as error:yield None,'gzip_error',{'error':str(error)}
    if data.startswith((b'BZh',b'\xfd7zXZ\x00')):
        kind='bzip2' if data.startswith(b'BZh') else 'xz'
        try:
            decoder=bz2.BZ2Decompressor() if kind=='bzip2' else lzma.LZMADecompressor(memlimit=128*1024*1024)
            content=decoder.decompress(data,max_length=maximum+1)
            if len(content)>maximum:yield None,kind+'_expansion_limit',{}
            elif not decoder.eof:yield None,kind+'_error',{'error':'truncated compressed stream'}
            else:yield content,kind+'_member',{}
        except (OSError,EOFError,lzma.LZMAError) as error:yield None,kind+'_error',{'error':str(error)}
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        offset=8
        for number in range(members):
            if offset==len(data):break
            if offset+12>len(data):yield None,'png_error',{'error':'truncated chunk header'};break
            size=struct.unpack('>I',data[offset:offset+4])[0];kind=data[offset+4:offset+8]
            end=offset+12+size
            if end>len(data):yield None,'png_error',{'error':'truncated chunk'};break
            content=data[offset+8:offset+8+size]
            crc=struct.unpack('>I',data[offset+8+size:end])[0]
            if zlib.crc32(kind+content)&0xffffffff!=crc:
                yield None,'png_error',{'error':'chunk CRC mismatch','chunk':kind.decode('ascii',errors='replace')};break
            try:
                if kind==b'zTXt':
                    keyword,body=content.split(b'\0',1)
                    if not body or body[0]!=0:raise ValueError('unsupported PNG compression method')
                    yield _zlib(body[1:],maximum),'png_ztxt',{'chunk_offset':offset,'keyword':keyword.decode('latin1')}
                elif kind==b'tEXt':
                    keyword,body=content.split(b'\0',1)
                    if len(body)<=maximum:yield body,'png_text',{'chunk_offset':offset,'keyword':keyword.decode('latin1')}
                elif kind==b'iTXt':
                    keyword,body=content.split(b'\0',1);flag,method=body[:2];body=body[2:]
                    language,translated,body=body.split(b'\0',2)
                    if method or flag not in (0,1):raise ValueError('unsupported PNG text compression')
                    decoded=_zlib(body,maximum) if flag else body
                    if len(decoded)<=maximum:yield decoded,'png_itxt',{'chunk_offset':offset,'keyword':keyword.decode('latin1')}
            except (ValueError,zlib.error) as error:yield None,'png_text_error',{'error':str(error),'chunk_offset':offset}
            offset=end
            if kind==b'IEND':break
        else:yield None,'png_chunk_limit',{}
    if data.startswith(b'%PDF-') and b'/Encrypt' not in data:
        # Deliberately narrow: direct /Length and a single /FlateDecode filter.
        # Indirect lengths/filter chains require a full PDF adapter, not guessing.
        expression=rb'<<(?P<dictionary>(?:(?!>>).){0,8192})>>\s*stream(?:\r\n|\n|\r)'
        for number,match in enumerate(re.finditer(expression,data,re.S)):
            if number>=members:yield None,'pdf_stream_limit',{};break
            dictionary=match['dictionary']
            if not re.search(rb'/Filter\s*(?:/FlateDecode\b|\[\s*/FlateDecode\s*\])',dictionary):continue
            length=re.search(rb'/Length\s+(\d+)\b',dictionary)
            if not length or re.match(rb'\s+\d+\s+R\b',dictionary[length.end():]):
                yield None,'pdf_stream_adapter_required',{'offset':match.start(),'reason':'indirect length'};continue
            start=match.end();end=start+int(length[1])
            if end>len(data):yield None,'pdf_stream_error',{'error':'truncated stream'};continue
            try:yield _zlib(data[start:end],maximum),'pdf_flate_stream',{'offset':start,'length':end-start}
            except (ValueError,zlib.error) as error:yield None,'pdf_stream_error',{'error':str(error),'offset':start}


def _text_layers(data,maximum):
    if data.startswith((b'\xff\xfe',b'\xfe\xff')):
        try:
            content=data.decode('utf-16').encode('utf-8')
            if len(content)<=maximum:yield content,'utf16_to_utf8',{'offset':0,'length':len(data)}
        except UnicodeError:yield None,'utf16_error',{}
    # Join only literal quoted strings, never evaluate source code.
    concatenated=rb'["\x27][A-Za-z0-9_+/=-]+["\x27](?:\s*\+\s*["\x27][A-Za-z0-9_+/=-]+["\x27])+'
    for m in re.finditer(concatenated,data):
        pieces=list(re.finditer(rb'["\x27]([A-Za-z0-9_+/=-]+)["\x27]',m[0]))
        joined=b''.join(p[1] for p in pieces)
        if 8<=len(joined)<=maximum:
            yield joined,'join_literal_strings',{'offset':m.start(),'length':len(m[0]),'fragments':[{'offset':m.start()+p.start(1),'length':len(p[1])} for p in pieces]}
    for encoding,pattern in [('percent_bytes',rb'(?:%[a-fA-F0-9]{2}){2,}'),('unicode_text_escape',rb'(?:\\u[a-fA-F0-9]{4}){2,}')]:
        seen=set()
        for match in re.finditer(pattern,data):
            value=match[0]
            if value in seen:continue
            seen.add(value)
            try:
                content=bytes.fromhex(value.replace(b'%',b'').decode()) if encoding=='percent_bytes' else json.loads('"'+value.decode()+'"').encode('utf-8')
                if content and len(content)<=maximum:yield content,encoding,{'offset':match.start(),'length':len(value)}
            except (ValueError,UnicodeError):continue
    def spans():
        stripped=data.strip()
        if 8<=len(stripped)<=maximum*2 and re.fullmatch(rb'[!-~\r\n]+',stripped):
            yield data.find(stripped),stripped
        for match in re.finditer(rb'["\x27]([^"\x27\r\n]{8,})["\x27]',data):
            yield match.start(1),match[1]
    seen_raw=set();seen_values=set();limited=False
    for offset,value in spans():
        if value in seen_raw:continue
        seen_raw.add(value)
        compact=re.sub(rb'[\r\n]',b'',value)
        decoders=[]
        if re.fullmatch(rb'[A-Za-z0-9_+/=-]+',compact):
            def b64(v):
                decoded=base64.b64decode(v+b'='*((-len(v))%4),altchars=b'-_',validate=True)
                if base64.urlsafe_b64encode(decoded).rstrip(b'=')!=v.replace(b'+',b'-').replace(b'/',b'_').rstrip(b'='):raise ValueError('noncanonical base64')
                return decoded
            decoders.append(('base64_normalized',b64))
        if re.fullmatch(rb'[A-Za-z2-7]+=*',compact):
            def b32(v):
                decoded=base64.b32decode(v+b'='*((-len(v))%8),casefold=True)
                if base64.b32encode(decoded).rstrip(b'=').lower()!=v.rstrip(b'=').lower():raise ValueError('noncanonical base32')
                return decoded
            decoders.append(('base32',b32))
        def b85(v):
            decoded=base64.b85decode(v)
            if base64.b85encode(decoded)!=v:raise ValueError('noncanonical base85')
            return decoded
        def a85(v):
            adobe=v.startswith(b'<~') and v.endswith(b'~>')
            decoded=base64.a85decode(v,adobe=adobe)
            if base64.a85encode(decoded,adobe=adobe)!=v:raise ValueError('noncanonical ascii85')
            return decoded
        decoders.extend([('base85',b85),('ascii85',a85)])
        for kind,decoder in decoders:
            try:decoded=decoder(compact)
            except (ValueError,base64.binascii.Error,OverflowError):continue
            if not decoded or len(decoded)>maximum or decoded in seen_values:continue
            if len(seen_values)>=64:limited=True;continue
            seen_values.add(decoded)
            yield decoded,kind,{'offset':offset,'length':len(value),'validation':'canonical encoding round trip; not semantic plaintext validation'}
    if limited:yield None,'normalization_candidate_limit',{'budget_unit':'distinct decoded byte values'}
    # Classical transforms are explicitly unverified hypotheses on small passage
    # shapes, not language-checker acceptances and not transformations of files.
    if len(data)<=4096:
        try:text=data.decode('ascii')
        except UnicodeError:return
        passage=re.fullmatch(r'[A-Za-z0-9 _.,:;!?\x27"\r\n-]{8,4096}',text)
        prose=bool(re.search(r'\s',text)) and len(re.findall(r'\b[A-Za-z]{2,}\b',text))>=3
        if passage and (prose or re.fullmatch(r'[A-Z0-9]+(?:_[A-Z0-9]+){2,}',text)):
            yield codecs.encode(text,'rot_13').encode(),'hypothesis:rot13',{'human_verified':False,'validation':'reversible transform only; plaintext not established'}
            yield text[::-1].encode(),'hypothesis:reverse',{'human_verified':False,'validation':'reversible transform only; plaintext not established'}


def layers(data,*,maximum,members=32,password=None):
    """Yield bytes/transform/source evidence, or None/explicit coverage notice."""
    yield from _containers(data,maximum,members,password)
    yield from _text_layers(data,maximum)
