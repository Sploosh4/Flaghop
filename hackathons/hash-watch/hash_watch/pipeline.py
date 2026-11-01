"""Read-only source scanner and SQLite-backed two-stage recovery worker."""
from dataclasses import asdict, dataclass
import json
import os
from pathlib import Path
import stat
import threading
import uuid

from .detect import FORMATS, identify, extractor_for
from .engines import crack_batch, extract_file
from .plans import prepare, batch
from .store import Store, now, atomic, atomic_bytes
from .tools import JOHN,HASHCAT,ROOT,digest,fingerprints


@dataclass(frozen=True)
class Settings:
    raw_format: str | None = None
    max_file_bytes: int = 2_000_000
    max_candidates: int = 128
    threads: int = 4
    quick_seconds: int = 3
    slice_seconds: int = 15
    batch_size: int = 128
    engine: str = 'auto'
    backend: str = 'cpu'


class Pipeline:
    def __init__(self,watch,output,settings=None,*,wordlist=None,benchmark_file=None):
        self.watch=Path(watch).resolve()
        self.output=Path(output).resolve()
        self.settings=settings or Settings()
        if not self.watch.is_dir():
            raise ValueError('Watch directory must exist')
        if self.watch==self.output or self.output.is_relative_to(self.watch) or self.watch.is_relative_to(self.output):
            raise ValueError('Input and output must be separate, non-nested folders')
        if not JOHN.is_file() or not HASHCAT.is_file():
            raise ValueError('Missing compiled tools; run setup.sh')
        self.stop=threading.Event()
        self.output.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.store=Store(self.output)
        self.plan_id=prepare(self.output,wordlist)
        self.tool_hashes=fingerprints()
        code=digest(b''.join(p.read_bytes() for p in sorted(Path(__file__).parent.glob('*.py'))))
        self.config=digest(json.dumps({'settings':asdict(self.settings),'plan':self.plan_id,
                                      'tools':self.tool_hashes,'code':code},sort_keys=True).encode())
        self.profile={}
        if benchmark_file:
            profile=json.loads(Path(benchmark_file).read_text())
            if profile.get('tool_sha256')!=self.tool_hashes or profile.get('threads')!=self.settings.threads:
                raise ValueError('Benchmark tools/thread count differ from this configuration; rebenchmark or omit profile')
            self.profile=profile.get('choices',{})
        self.restore_recovered_exports()
        self.store.export()

    def restore_recovered_exports(self):
        """Finish exports after a verified recovery committed before a crash."""
        for target in self.store.targets():
            if target['status']!='recovered' or target['recovered_hex'] is None:
                continue
            folder=self.output/'jobs'/target['id'];folder.mkdir(parents=True,exist_ok=True)
            result=folder/'recovered.txt';data=bytes.fromhex(target['recovered_hex'])
            if result.is_symlink() or (result.exists() and result.read_bytes()!=data):
                raise ValueError('Recovered result integrity mismatch; evidence retained')
            if not result.exists():atomic_bytes(result,data)
            evidence=folder/'recovered.json'
            if not evidence.exists():
                attempt=self.store.db.execute("SELECT id FROM attempts WHERE target_id=? AND status='recovered' ORDER BY id DESC LIMIT 1",(target['id'],)).fetchone()
                atomic(evidence,json.dumps({'schema_version':1,'target_id':target['id'],'format':target['format'],
                    'plaintext_hex':target['recovered_hex'],'verification':target['verification'],
                    'attempt_id':attempt['id'] if attempt else None,'source_preserved':True,'restored_export':True},indent=2)+'\n')

    def allowed(self,path):
        path=Path(os.path.abspath(path))
        if not path.is_relative_to(self.watch):
            return False
        current=self.watch
        for part in path.relative_to(self.watch).parts:
            current=current/part
            if current.is_symlink():
                return False
        return True

    def files(self,root=None):
        root=Path(root or self.watch)
        if not self.allowed(root):
            return
        for parent,dirs,names in os.walk(root,followlinks=False):
            dirs[:]=sorted(d for d in dirs if self.allowed(Path(parent)/d))
            for name in sorted(names):
                path=Path(parent)/name
                if self.allowed(path):
                    yield path

    def enqueue(self,candidate,plan_id=None):
        plan_id=plan_id or self.plan_id
        format_id=candidate['format']
        identifier=digest(((format_id or 'unknown')+'\0'+candidate.get('identity_value',candidate['value'])+'\0'+plan_id).encode())
        state='queued_quick' if format_id else ('needs_adapter' if candidate.get('unsupported_type') else 'needs_format')
        self.store.db.execute('''INSERT OR IGNORE INTO targets
          (id,value,format,basis,status,stage,batch_size,plan_id,updated) VALUES (?,?,?,?,?,'quick',?,?,?)''',
          (identifier,candidate['value'],format_id,candidate['format_basis'],state,self.settings.batch_size,plan_id,now()))
        self.store.db.commit()
        if candidate.get('verifier_source'):
            job=self.output/'jobs'/identifier
            job.mkdir(parents=True,exist_ok=True)
            dependencies=job/'verifier-dependencies.json'
            if not dependencies.exists():
                atomic(dependencies,json.dumps({'path':candidate['verifier_source'],
                       'sha256':candidate['verifier_source_sha256']},indent=2)+'\n')
        return identifier

    def scan(self,path):
        path=Path(os.path.abspath(path))
        if not self.allowed(path):
            return None
        fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
        with os.fdopen(fd,'rb') as handle:
            before=os.fstat(handle.fileno())
            if not stat.S_ISREG(before.st_mode):
                return None
            stamp=(before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns,before.st_ctime_ns)
            oversized=before.st_size>self.settings.max_file_bytes
            data=b'' if oversized else handle.read(self.settings.max_file_bytes+1)
            after=os.fstat(handle.fileno())
        if stamp!=(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns,after.st_ctime_ns):
            raise BlockingIOError('File changed while being read')
        source=path.relative_to(self.watch).as_posix()
        source_hash=digest(data) if not oversized else 'oversize:'+digest(repr(stamp).encode())
        existing=self.store.db.execute('SELECT report FROM scans WHERE source=? AND sha256=? AND config=?',
                                       (source,source_hash,self.config)).fetchone()
        if existing and (self.output/existing['report']).is_file():
            return None
        scan_id=uuid.uuid4().hex
        folder=self.output/'scans'/scan_id
        folder.mkdir(parents=True)
        report={'schema_version':1,'scan_id':scan_id,'created_at':now(),'source':source,
                'source_sha256':None if oversized else source_hash,'source_size':before.st_size,
                'config':self.config,'tool_sha256':self.tool_hashes,'status':'complete','warnings':[],
                'candidates':[],'host_ip':None}
        if oversized or len(data)>self.settings.max_file_bytes:
            report['status']='skipped'
            report['warnings'].append('file_size_limit')
        else:
            try:
                kind=extractor_for(data)
                if kind:
                    # Some *2john formats reference the archive externally. Keep an immutable
                    # read-only-source copy in the evidence folder so queued jobs stay valid.
                    snapshot=folder/'source.bin'
                    atomic_bytes(snapshot,data,mode=0o400)
                    report['source_snapshot']='source.bin'
                    candidates,extraction=extract_file(kind,snapshot,folder,threads=self.settings.threads)
                    report['extractor']=extraction
                    if extraction['status']!='complete' or extraction.get('returncode',0)!=0:
                        report['status']='partial'
                        report['warnings'].append('extractor_failed_or_missing; inspect raw diagnostics')
                    if len(candidates)>self.settings.max_candidates:
                        report['warnings'].append('candidate_count_limit')
                        candidates=candidates[:self.settings.max_candidates]
                else:
                    candidates,warnings=identify(data,raw_format=self.settings.raw_format,limit=self.settings.max_candidates)
                    report['warnings'].extend(warnings)
                for candidate in candidates:
                    candidate['target_id']=self.enqueue(candidate)
                report['candidates']=candidates
            except Exception as error:
                report['status']='error'
                report['warnings'].append(type(error).__name__+': '+str(error))
        try:
            current=path.stat(follow_symlinks=False)
            if stamp!=(current.st_dev,current.st_ino,current.st_size,current.st_mtime_ns,current.st_ctime_ns):
                report['warnings'].append('source_changed_during_scan')
        except OSError:
            report['warnings'].append('source_removed_during_scan')
        if report['warnings'] and report['status']=='complete':
            report['status']='partial'
        reference=(folder/'report.json').relative_to(self.output).as_posix()
        atomic(folder/'report.json',json.dumps(report,indent=2,ensure_ascii=True)+'\n')
        self.store.db.execute('INSERT INTO scans VALUES (?,?,?,?,?)',(scan_id,source,source_hash,self.config,reference))
        self.store.db.commit()
        self.store.export()
        return folder/'report.json'

    def resolve(self,identifier,format_id):
        old=self.store.target(identifier)
        if not old or old['format'] is not None:
            raise ValueError('Target must exist and have an unresolved format')
        if format_id not in FORMATS or FORMATS[format_id].get('width')!=len(old['value']):
            raise ValueError('Choose a raw hash format matching the extracted digest length')
        new=self.enqueue({'value':old['value'],'format':format_id,'format_basis':'explicit user resolution'},old['plan_id'])
        self.store.update(identifier,status='resolved',resolved_to=new)
        self.store.export()
        return new

    def choice(self,format_id):
        if self.settings.engine!='auto':
            engine,backend=self.settings.engine,self.settings.backend
        else:
            selected=self.profile.get(format_id,{})
            engine,backend=selected.get('engine','john'),selected.get('backend','cpu')
        if FORMATS[format_id]['hashcat'] is None:
            return 'john','cpu'
        return engine,backend

    def work_one(self, *, quick_only=False):
        if getattr(self,'_needs_exports',False):
            self.restore_recovered_exports()
            self._needs_exports=False
        states="('queued_quick')" if quick_only else "('queued_quick','queued_deep')"
        row=self.store.db.execute("SELECT * FROM targets WHERE status IN "+states+" ORDER BY stage DESC,updated,id LIMIT 1").fetchone()
        if not row or self.stop.is_set():
            return False
        job=dict(row)
        stage=job['stage']
        folder=self.output/'jobs'/job['id']
        folder.mkdir(parents=True,exist_ok=True)
        dependencies=folder/'verifier-dependencies.json'
        if dependencies.exists():
            dep=json.loads(dependencies.read_text())
            source=Path(dep['path'])
            if not source.is_file() or digest(source.read_bytes())!=dep['sha256']:
                self.store.update(job['id'],status='error')
                self.store.export()
                raise ValueError('Protected-file verifier snapshot changed or disappeared')
        plan=self.output/'plans'/job['plan_id']
        meta=json.loads((plan/'manifest.json').read_text())
        planfile=plan/(stage+'.txt')
        if digest(planfile.read_bytes())!=meta[stage+'_sha256']:
            self.store.update(job['id'],status='error')
            self.store.export()
            raise ValueError('Candidate plan changed; refusing to skip or substitute guesses')
        count=job['batch_size']
        if job['format']=='bcrypt':
            try:
                cost=int(job['value'].split('$')[2])
                count=min(count,max(1,self.settings.batch_size//(2**max(0,cost-5))))
            except (ValueError,IndexError):
                pass
        words,end=batch(planfile,job['offset'],count)
        if not words:
            if stage=='quick':
                self.store.update(job['id'],stage='deep',status='queued_deep',offset=0)
            else:
                self.store.update(job['id'],status='exhausted_plan')
            self.store.export()
            return True
        engine,backend=(job['engine'],job['backend']) if job['engine'] and self.settings.engine=='auto' else self.choice(job['format'])
        # Conservative native John SIMD limits: preserve longer candidates via pure Hashcat.
        caps={'md5':55,'sha1':55,'sha224':55,'sha256':55,'sha384':111,'sha512':111,'ntlm':27,'bcrypt':72,'sha512crypt':125}
        length_fallback=engine=='john' and job['format'] in caps and any(len(w)>caps[job['format']] for w in words)
        if length_fallback:
            engine,backend='hashcat','cpu'
        self.store.update(job['id'],status='running_'+stage,engine=engine,backend=backend)
        cursor=self.store.db.execute('''INSERT INTO attempts
          (target_id,stage,start_offset,end_offset,candidates,engine,backend,status)
          VALUES (?,?,?,?,?,?,?,'running')''',(job['id'],stage,job['offset'],end,len(words),engine,backend))
        attempt_id=cursor.lastrowid
        self.store.db.commit()
        prefix=f'attempt-{attempt_id:06d}'
        budget=self.settings.quick_seconds if stage=='quick' else self.settings.slice_seconds
        result=crack_batch(folder,target=job['value'],format_id=job['format'],words=words,engine=engine,
                           backend=backend,seconds=budget,threads=self.settings.threads,stop=self.stop,prefix=prefix,
                           cache_home=self.output/'compute-home')
        self.store.db.execute('UPDATE attempts SET status=?,seconds=?,ref=? WHERE id=?',
                              (result['status'],result['execution']['seconds'],
                               (folder/'raw'/(prefix+'.json')).relative_to(self.output).as_posix(),attempt_id))
        self.store.db.commit()
        state=result['status']
        if state=='recovered':
            self._needs_exports=True
            self.store.update(job['id'],status='recovered',recovered_hex=result['plaintext_hex'],verification=result['verification'])
            atomic_bytes(folder/'recovered.txt',bytes.fromhex(result['plaintext_hex']))
            atomic(folder/'recovered.json',json.dumps({'schema_version':1,'target_id':job['id'],'format':job['format'],
                   'plaintext_hex':result['plaintext_hex'],'verification':result['verification'],'attempt_id':attempt_id,
                   'source_preserved':True},indent=2)+'\n')
            self._needs_exports=False
        elif state=='exhausted_batch':
            more=end<planfile.stat().st_size
            next_stage=stage if more else ('deep' if stage=='quick' else stage)
            next_status='queued_'+next_stage if more or stage=='quick' else 'exhausted_plan'
            self.store.update(job['id'],status=next_status,stage=next_stage,offset=end if next_stage==stage else 0,
                              tried=job['tried']+len(words),failures=0)
        elif state=='interrupted':
            self.store.update(job['id'],status='queued_'+stage)
        elif state=='timeout':
            # A timed-out quick batch is fully replayed by the deep plan, which includes quick seeds.
            if stage=='quick':
                self.store.update(job['id'],status='queued_deep',stage='deep',offset=0)
            elif count>1:
                self.store.update(job['id'],status='queued_deep',batch_size=max(1,count//2))
            else:
                self.store.update(job['id'],status='paused_budget')
        else:
            if engine=='hashcat' and self.settings.engine=='auto' and not length_fallback:
                self.store.update(job['id'],status='queued_'+stage,engine='john',backend='cpu',failures=job['failures']+1)
            else:
                self.store.update(job['id'],status='error',failures=job['failures']+1)
        # Completed batches can be regenerated from the immutable plan; no need to retain duplicates.
        (folder/(prefix+'.words')).unlink(missing_ok=True)
        self.store.export()
        return True

    def resume(self):
        self.store.db.execute("UPDATE targets SET status='queued_'||stage WHERE status IN ('paused_budget','error')")
        self.store.db.commit()
        self.store.export()

    def close(self):
        self.store.close()
