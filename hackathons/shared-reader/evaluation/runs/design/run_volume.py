"""Isolated offline reader evaluation. Never joins or deploys CTFs.

Worker processes use the unchanged production Project class. Known answers are
used only by this evaluator; no plaintext regex is supplied to either reader.
"""
import argparse,base64,fcntl,hashlib,json,os,signal,subprocess,sys,time,traceback
from collections import Counter,defaultdict
from datetime import datetime,timezone
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent))
from shared_reader import ROOT
from shared_reader.project import Project,Limits


def hashed(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def immutable_code():
 return {str(p):hashed(p) for directory in ('shared-reader/shared_reader','cipher-watch/cipher_watch','hash-watch/hash_watch') for p in sorted((ROOT/directory).glob('*.py'))}

def evidence(project):
 db=project.db
 nodes=[dict(r) for r in db.execute('SELECT * FROM nodes')]
 events=[dict(r) for r in db.execute('SELECT * FROM events')]
 cipher_reports=[];hash_reports=[]
 for node in nodes:
  for key,dest in [('cipher_ref',cipher_reports),('hash_ref',hash_reports)]:
   if node[key]:
    try:dest.append((node['id'],json.loads((project.path/node[key]).read_text())))
    except (OSError,ValueError):pass
 sources=[dict(r) for r in db.execute('SELECT * FROM sources')]
 known={s['id'] for s in sources}
 reachable={r['node'] for r in db.execute('SELECT * FROM reach') if r['source'] in known}
 findings=[{'node':node,'text':f['text'],'steps':f['steps']} for node,r in cipher_reports for f in r['findings']]
 return {'nodes':nodes,'events':events,'sources':sources,'reachable':reachable,'findings':findings,
         'cipher_reports':cipher_reports,'hash_reports':hash_reports,'targets':project.hashes.store.targets(),
         'attempts':[dict(r) for r in project.hashes.store.db.execute('SELECT * FROM attempts')]}


def assess(case,ev,drained):
 goal=case['goal'];expected=bytes.fromhex(case['expected_hex']);expected_sha=hashlib.sha256(expected).hexdigest()
 targets=ev['targets'];findings=ev['findings']
 recovered=[t for t in targets if t['status']=='recovered']
 value=expected.decode('ascii',errors='replace')
 if goal=='observe':return 'observation','Unlabelled upstream sample; no correctness oracle'
 if goal=='plaintext':
  met=expected_sha in ev['reachable']
 elif goal=='password':
  met=any(t['recovered_hex']==expected.hex() and (not case['format'] or t['format']==case['format']) for t in recovered)
 elif goal=='hash_detected':met=any(t['value']==value for t in targets)
 elif goal=='needs_adapter':met=any(t['status']=='needs_adapter' for t in targets)
 elif goal=='review':met=any(t['value'].lower()==value.lower() and t['status']=='needs_format' for t in targets) and not ev['attempts']
 elif goal=='unrecovered':
  met=bool(targets) and not recovered and any(t['status']=='exhausted_plan' for t in targets)
 elif goal=='quiet':
  met=not findings and not ev['attempts']
  if met and (any(e['kind']=='node_error' for e in ev['events']) or any(r['status']!='complete' for _,r in ev['cipher_reports']) or any(r['status']!='complete' for _,r in ev['hash_reports'])):return 'inconclusive','Reader errors or limits prevent a quiet-file conclusion'
  if met and not drained:return 'inconclusive','No noise observed yet, but evaluation budget was reached'
 elif goal=='no_autocrack':met=not ev['attempts']
 elif goal=='size_guard':met=any(s['status']=='skipped_size' for s in ev['sources'])
 elif goal=='limit_notice':met=any('limit' in e['kind'] for e in ev['events']) or any('limit' in str(r.get('coverage',{}).get('warnings',[])) for _,r in ev['cipher_reports'])
 elif goal=='diagnosed':
  met=not any(e['kind']=='node_error' for e in ev['events']) and (drained or any(e['kind'].endswith('_error') for e in ev['events']))
 else:raise ValueError(goal)
 if met:return 'pass','Goal observed; processing completeness recorded separately'
 if not drained:return 'inconclusive','Goal not reached before the evaluation budget; not proof of incapability'
 return ('noise' if goal in ('quiet','no_autocrack') else 'miss'),'Completed configured work without meeting the stated goal'


def worker(case,out):
 folder=Path(out);folder.mkdir(parents=True,exist_ok=False)
 project_path=folder/'project';source=project_path/'test-inputs'/Path(case['input']).name
 source.parent.mkdir(parents=True);source.write_bytes(Path(case['input']).read_bytes())
 before=(hashed(source),source.stat().st_mtime_ns)
 start=time.monotonic();project=None;result={}
 try:
  project=Project(project_path,wordlist=HERE/'seeds.txt',benchmark=ROOT/'hash-watch/validation/laptop/benchmark.json')
  project.ingest(source)
  deadline=start+(15 if case['scope']=='unlabelled' else 20)
  drained=False;steps=0
  while steps<160 and time.monotonic()<deadline:
   if not project.step():drained=True;break
   steps+=1
  ev=evidence(project)
  outcome,reason=assess(case,ev,drained)
  unchanged=(hashed(source),source.stat().st_mtime_ns)==before and hashed(case['input'])==case['sha256']
  bad_objects=[n['id'] for n in ev['nodes'] if hashed(project.objects/(n['id']+'.bin'))!=n['id']]
  if not unchanged or bad_objects:outcome,reason='integrity_failure','Source or immutable-artifact contents changed'
  findings=ev['findings'];warnings=Counter()
  for _,report in ev['cipher_reports']:
   for warning in report['coverage']['warnings']:
    warnings['ciphey_panic_or_error' if 'ciphey_error' in warning else 'ciphey_timeout' if 'timeout' in warning else 'candidate_limit' if 'limit' in warning else warning]+=1
  hidden=[node for node,r in ev['hash_reports'] if r['status'] in ('error','partial') and next(n for n in ev['nodes'] if n['id']==node)['status']=='done']
  result={'id':case['id'],'group':case['group'],'scope':case['scope'],'goal':case['goal'],'outcome':outcome,'reason':reason,
          'drained':drained,'steps':steps,'seconds':round(time.monotonic()-start,3),'sources_unchanged':unchanged,
          'immutable_objects_valid':not bad_objects,'node_states':dict(Counter(n['status'] for n in ev['nodes'])),
          'target_states':dict(Counter(t['status'] for t in ev['targets'])),'targets':len(ev['targets']),
          'recovered':[{'format':t['format'],'hex':t['recovered_hex'],'verification':t['verification']} for t in ev['targets'] if t['status']=='recovered'],
          'accepted_plaintext_candidates':len(findings),'candidate_previews':[f['text'][:100] for f in findings[:8]],
          'candidate_output_unexpected':sum(f['text'].encode()!=bytes.fromhex(case['expected_hex']) for f in findings) if case['goal']=='plaintext' else None,
          'event_kinds':dict(Counter(e['kind'] for e in ev['events'])),'cipher_warnings':dict(warnings),
          'hash_scan_failures':sum(r['status'] in ('error','partial') for _,r in ev['hash_reports']),
          'hash_failures_with_done_parent':len(hidden),'native_attempts':len(ev['attempts']),
          'report':str(project_path/'reader-report.json'),'input':case['input'],'input_sha256':case['sha256'],
          'remaining_work':not drained,'limits':project.limits.__dict__,'wordlist_sha256':hashed(HERE/'seeds.txt')}
 except BaseException as error:
  result={'id':case['id'],'group':case['group'],'scope':case['scope'],'goal':case['goal'],'outcome':'worker_error','exception':traceback.format_exc(),'seconds':round(time.monotonic()-start,3),'sources_unchanged':(hashed(source),source.stat().st_mtime_ns)==before,'report':str(project_path/'reader-report.json')}
 finally:
  if project:project.close()
 (folder/'result.json').write_text(json.dumps(result,indent=2)+'\n')
 return result


def kill_worker_tree(process):
 # Every signal target is discovered strictly below our isolated worker process.
 seen=set();pending=[process.pid]
 while pending:
  pid=pending.pop()
  if pid in seen:continue
  seen.add(pid)
  try:pending.extend(int(p) for p in Path(f'/proc/{pid}/task/{pid}/children').read_text().split())
  except OSError:pass
 groups=set()
 for pid in seen:
  try:groups.add(os.getpgid(pid))
  except ProcessLookupError:pass
 for group in groups:
  if group==os.getpgrp():continue
  try:os.killpg(group,signal.SIGKILL)
  except ProcessLookupError:pass
 process.wait()


def render(report,out):
 rows=report['cases'];groups=defaultdict(Counter)
 for row in rows:groups[row['group']][row['outcome']]+=1
 lines=['# Offline reader collection evaluation','',f"Started: {report['started_at']}",'',
        '**No CTF was joined, deployed or interacted with.** These are offline data files only. Public files came from upstream regression suites, not challenge platforms.','',
        'Known-answer fixtures use default production reader limits and the measured engine profile. No answer regex is supplied. Password tests use a small, explicit audit seed list plus the normal quick list; this measures workflow correctness, not password strength. Per-case evaluation budgets are 20 seconds (15 for unlabelled files), checked between bounded work units, with a 45-second external worker guard. A goal can pass while other incidental work remains pending.','',
        f"Results so far: {json.dumps(dict(Counter(r['outcome'] for r in rows)),sort_keys=True)}",'',
        '| Group | Outcomes |','|---|---|']
 for group,counts in sorted(groups.items()):lines.append(f'| {group} | {dict(counts)} |')
 lines+=['','| Case | Goal | Outcome | Drained | Seconds | Evidence |','|---|---|---|---|---:|---|']
 for row in rows:
  ref=Path(row['report']).relative_to(out).as_posix() if row.get('report') else ''
  lines.append(f"| {row['id']} | {row['goal']} | {row['outcome']} | {row.get('drained','—')} | {row['seconds']} | [JSON]({ref}) |")
 (out/'report.md').write_text('\n'.join(lines)+'\n')


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--out',type=Path)
 parser.add_argument('--worker-case')
 parser.add_argument('--only',action='append',default=[])
 args=parser.parse_args()
 manifest=json.loads((HERE/'volume-manifest.json').read_text())
 if args.worker_case:
  case=next(c for c in manifest['cases'] if c['id']==args.worker_case)
  worker(case,args.out);return
 if args.out is None:parser.error('--out is required')
 out=args.out.resolve();out.mkdir(parents=True,exist_ok=False)
 rows=[c for c in manifest['cases'] if not args.only or c['id'] in args.only]
 initial=immutable_code()
 report={'started_at':datetime.now(timezone.utc).isoformat(),'manifest_sha256':hashed(HERE/'volume-manifest.json'),
         'code_sha256':initial,'cases':[],'ctf_activity':False,'offline_workers':True,'limits':Limits().__dict__}
 service='hackathon-readers.service'
 was_active=subprocess.run(['systemctl','--user','is-active','--quiet',service]).returncode==0
 lifecycle={'service':service,'initially_active':was_active,'paused_for_evaluation':False,'restored':False}
 lock=None
 try:
  if was_active:
   subprocess.run(['systemctl','--user','stop',service],check=True);lifecycle['paused_for_evaluation']=True
  (out/'service-lifecycle.json').write_text(json.dumps(lifecycle,indent=2))
  lock=(ROOT/'hash-watch/.tmp/compute.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  for case in rows:
   folder=out/case['id']
   stdout=(out/(case['id']+'.worker.log')).open('w')
   process=subprocess.Popen([sys.executable,str(Path(__file__).resolve()),'--worker-case',case['id'],'--out',str(folder)],stdout=stdout,stderr=stdout,start_new_session=True)
   start=time.monotonic()
   try:
    process.wait(timeout=45)
    if (folder/'result.json').exists():result=json.loads((folder/'result.json').read_text())
    else:result={'id':case['id'],'group':case['group'],'scope':case['scope'],'goal':case['goal'],'outcome':'worker_error','seconds':round(time.monotonic()-start,3),'report':str(folder/'project/reader-report.json'),'worker_exit':process.returncode}
   except subprocess.TimeoutExpired:
    kill_worker_tree(process)
    result={'id':case['id'],'group':case['group'],'scope':case['scope'],'goal':case['goal'],'outcome':'external_timeout','seconds':45,'report':str(folder/'project/reader-report.json')}
   finally:stdout.close()
   report['cases'].append(result)
   report['totals']=dict(Counter(r['outcome'] for r in report['cases']))
   (out/'summary.json').write_text(json.dumps(report,indent=2)+'\n');render(report,out)
   print(f"{len(report['cases']):3}/{len(rows)} {result['outcome']:17} {case['id']} {result['seconds']}s",flush=True)
  report['code_unchanged']=initial==immutable_code()
  report['finished_at']=datetime.now(timezone.utc).isoformat()
  (out/'summary.json').write_text(json.dumps(report,indent=2)+'\n');render(report,out)
 finally:
  if lock:lock.close()
  if was_active:
   subprocess.run(['systemctl','--user','start',service],check=True)
   lifecycle['restored']=subprocess.run(['systemctl','--user','is-active','--quiet',service]).returncode==0
  (out/'service-lifecycle.json').write_text(json.dumps(lifecycle,indent=2)+'\n')

if __name__=='__main__':main()
