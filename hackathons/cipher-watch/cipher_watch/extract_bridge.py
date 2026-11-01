"""Isolated base64dump bridge: budgets distinct results, not repeated locations."""
import base64
from bisect import bisect_left
from collections import deque
import importlib.util
import json
import sys
from pathlib import Path

ENCODING_FUNCTIONS = {
    'b64':'DecodeDataBase64','hex':'DecodeDataHex','bx':'DecodeDataBX',
    'bu':'DecodeDataBU','pu':'DecodeDataPU','ah':'DecodeDataAH',
    'zxle':'DecodeDataZXLittleEndian','zxbe':'DecodeDataZXBigEndian',
    'zxc':'DecodeDataZXC','zxcn':'DecodeDataZXCN','dec':'DecodeDataDecimal',
    'nb':'DecodeDataNETBIOS','nbl':'DecodeDataNETBIOSLowercase',
    'b85':'DecodeDataBase85RFC1924','a85':'DecodeDataAscii85',
}


def extract(tool,data,encodings,minimum,maximum,limit):
    spec=importlib.util.spec_from_file_location('base64dump',tool)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    candidates=[];seen_encoded=set();selected={};overflow=set();warnings=[];notes=[]
    newlines=[i for i,n in enumerate(data) if n==10]
    def warn(value):
        if value not in warnings:warnings.append(value)
    for encoding in encodings:
        if encoding not in ENCODING_FUNCTIONS:raise ValueError('Unsupported base64dump encoding: '+encoding)
        stream=getattr(module,ENCODING_FUNCTIONS[encoding])([{'id':1,'name':'snapshot','content':data}],lambda x:x,lambda x:x)
        for _,encoded,decoded,_ in stream:
            # Upstream yields the same matched bytes for every occurrence. Locate
            # each distinct representation once, never repeatedly rescan for it.
            key=(encoding,encoded)
            if key in seen_encoded:continue
            seen_encoded.add(key)
            if len(decoded)<minimum:continue
            if len(encoded)>maximum or len(decoded)>maximum:
                warn('candidate_size_limit');continue
            if decoded not in selected:
                if len(selected)>=limit:
                    overflow.add(decoded);warn('candidate_count_limit');continue
                selected[decoded]=0
            room=8-selected[decoded]
            if room<=0:continue
            first=[];last=deque(maxlen=4);start=0;count=0
            while True:
                offset=data.find(encoded,start)
                if offset<0:break
                start=offset+len(encoded);count+=1
                if len(first)<4:first.append(offset)
                last.append(offset)
            positions=sorted(set(first+list(last)))[:room]
            if count>len(positions):
                notes.append({'encoding':encoding,'occurrences':count,'retained_locations':len(positions),
                              'reason':'location evidence bounded; repeated values do not consume candidate budget'})
            for offset in positions:
                line_index=bisect_left(newlines,offset)
                previous=newlines[line_index-1] if line_index else -1
                candidates.append({'encoding':encoding,'offset':offset,'length':len(encoded),
                    'line':line_index+1,'byte_column':offset-previous,'occurrences':count,
                    'encoded_b64':base64.b64encode(encoded).decode(),
                    'decoded_b64':base64.b64encode(decoded).decode()})
                selected[decoded]+=1
    return {'candidates':candidates,'warnings':warnings,'notes':notes,
            'unique_values':len(selected),'omitted_unique_values':len(overflow),
            'budget_unit':'distinct decoded byte values','max_locations_per_value':8}

if __name__=='__main__':
    tool,source,encodings,minimum,maximum,limit=sys.argv[1:]
    print(json.dumps(extract(tool,Path(source).read_bytes(),encodings.split(','),int(minimum),int(maximum),int(limit))))
