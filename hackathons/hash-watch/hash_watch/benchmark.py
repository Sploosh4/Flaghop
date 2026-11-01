"""Comparable synthetic wordlist workloads, including startup and correctness checks."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import statistics
import subprocess
import time
import bcrypt
from .engines import crack_batch
from .tools import ROOT, JOHN, HASHCAT, digest, environment, run, save_raw, fingerprints


def fixtures():
    import crypt
    secret=b'hwKnown-7f32!'
    return {
        'md5':hashlib.md5(secret).hexdigest(),
        'ntlm': __import__('Crypto.Hash.MD4',fromlist=['MD4']).new(secret.decode().encode('utf-16le')).hexdigest(),
        'bcrypt':bcrypt.hashpw(secret,b'$2b$05$abcdefghijklmnopqrstuu').decode(),
        'sha512crypt':crypt.crypt(secret.decode(),'$6$rounds=5000$hashwatchbench$'),
    }


def benchmark(output, *, threads=4, repeats=2, formats=None):
    output = Path(output).resolve()
    output.mkdir(parents=True,exist_ok=True)
    data={'schema_version':1,'created_at':datetime.now(timezone.utc).isoformat(),
          'method':'matched synthetic wordlist exhaustion after a separate warmup, plus known-password correctness test; wall time includes startup; no optimized-length kernels',
          'cpu':subprocess.check_output(['lscpu'],text=True), 'platform':platform.platform(), 'threads':threads,
          'tool_sha256':fingerprints(),
          'results':[], 'choices':{}}
    (output/'running.json').write_text(json.dumps(data,indent=2))
    for backend in ['cpu','gpu']:
        r=run([HASHCAT,'-I'],cwd=HASHCAT.parent,seconds=20,env=environment(output/'cache',threads,backend))
        save_raw(output/'raw','devices-'+backend,r)
    values=fixtures()
    for fmt,value in values.items():
        if formats and fmt not in formats:
            continue
        # More work for fast hashes; enough to time slow hashes without a prolonged run.
        count=200000 if fmt in ('md5','ntlm') else 32
        words=[f'hwbench-{i:08d}'.encode() for i in range(count)]
        for engine,backend in [('john','cpu'),('hashcat','cpu'),('hashcat','gpu')]:
            row={'format':fmt,'engine':engine,'backend':backend,'candidate_count':count,'runs':[],'eligible':False}
            for repeat in range(repeats+1):
                folder=output/f'{fmt}-{engine}-{backend}-{repeat}'
                result=crack_batch(folder,target=value,format_id=fmt,words=words,engine=engine,
                                   backend=backend,seconds=45,threads=threads,prefix='speed',cache_home=output/'cache')
                observation={'status':result['status'],'seconds':result['execution']['seconds']}
                if repeat==0:
                    row['warmup']=observation
                else:
                    row['runs'].append(observation)
                print(fmt,engine,backend,repeat,result['status'],result['execution']['seconds'],flush=True)
                if result['status']!='exhausted_batch':
                    break
            if row['runs'] and row['warmup']['status']=='exhausted_batch' and all(r['status']=='exhausted_batch' for r in row['runs']):
                # A benchmark that cannot recover the known password is not eligible.
                result=crack_batch(output/f'{fmt}-{engine}-{backend}-correctness',target=value,format_id=fmt,
                                   words=[b'wrong',b'hwKnown-7f32!'],engine=engine,
                                   backend=backend,seconds=30,threads=threads,cache_home=output/'cache')
                row['correctness']=result['status']
                row['eligible']=result['status']=='recovered'
                row['median_seconds']=statistics.median(r['seconds'] for r in row['runs'])
                row['end_to_end_guesses_per_second']=count/row['median_seconds']
            data['results'].append(row)
            (output/'running.json').write_text(json.dumps(data,indent=2))
        eligible=[r for r in data['results'] if r['format']==fmt and r['eligible']]
        if eligible:
            winner=min(eligible,key=lambda r:r['median_seconds'])
            data['choices'][fmt]={'engine':winner['engine'],'backend':winner['backend'],
                                  'reason':'lowest warmed median wall time for the matched synthetic workload',
                                  'measured_candidates':count}
    (output/'benchmark.json').write_text(json.dumps(data,indent=2)+'\n')
    (output/'running.json').unlink()
    return data
