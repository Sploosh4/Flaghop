"""Retain initial timings and add repeat measurements with warmed compiler caches."""
from pathlib import Path
import json,statistics
from hash_watch.benchmark import fixtures
from hash_watch.engines import crack_batch

folder=Path(__file__).resolve().parent/'laptop'
original=json.loads((folder/'benchmark.json').read_text())
(folder/'benchmark-initial.json').write_text(json.dumps(original,indent=2)+'\n')
data=original
values=fixtures()
for row in data['results']:
 if not row['eligible']:
  continue
 row['first_observed_run']=row['runs'][0]
 row['warm_runs']=row['runs'][1:]
 count=row['candidate_count']
 words=[f'hwbench-{i:08d}'.encode() for i in range(count)]
 for i in range(2):
  r=crack_batch(folder/f"warm-{row['format']}-{row['engine']}-{row['backend']}-{i}",
    target=values[row['format']],format_id=row['format'],words=words,engine=row['engine'],backend=row['backend'],
    seconds=45,threads=data['threads'],prefix='speed',cache_home=folder/'cache')
  row['warm_runs'].append({'status':r['status'],'seconds':r['execution']['seconds']})
  print(row['format'],row['engine'],row['backend'],r['status'],r['execution']['seconds'],flush=True)
 row['eligible']=row['eligible'] and all(r['status']=='exhausted_batch' for r in row['warm_runs'])
 row['median_seconds']=statistics.median(r['seconds'] for r in row['warm_runs'])
 row['end_to_end_guesses_per_second']=count/row['median_seconds']
data['choices']={}
for fmt in values:
 eligible=[r for r in data['results'] if r['format']==fmt and r['eligible']]
 if eligible:
  winner=min(eligible,key=lambda r:r['median_seconds'])
  data['choices'][fmt]={'engine':winner['engine'],'backend':winner['backend'],
                       'reason':'lowest median of three warmed matched wordlist runs, including process startup; known-password correctness passed',
                       'measured_candidates':winner['candidate_count']}
data['method']='initial timings retained separately; routing uses three warmed matched wordlist runs and known-password correctness; wall time includes startup; native CPU John vs OpenCL CPU/GPU Hashcat; no optimized-length kernels'
(folder/'benchmark.json').write_text(json.dumps(data,indent=2)+'\n')
print('Final choices:',data['choices'])
