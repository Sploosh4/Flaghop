"""Persistent content graph, original-file inventory and two-reader work loop."""
import base64
import errno
from collections import Counter
from dataclasses import asdict, dataclass
import fcntl
import hashlib
import html
import json
import os
from pathlib import Path
import sqlite3
import stat
import time

from . import ROOT
from .transforms import layers
from cipher_watch.scanner import Scanner, Settings as CipherSettings
from cipher_watch.tool_paths import tool_path
from hash_watch.pipeline import Pipeline, Settings as HashSettings
from hash_watch.store import atomic, atomic_bytes, now


def sha(data):
    return hashlib.sha256(data).hexdigest()


@dataclass(frozen=True)
class Limits:
    max_file_bytes: int = 2_000_000
    max_depth: int = 8
    max_nodes: int = 128
    max_expanded_bytes: int = 16_000_000
    max_members: int = 32
    decode_seconds: int = 1
    file_seconds: int = 4
    slice_seconds: int = 5
    threads: int = 4
    batch_size: int = 128
    regex: str | None = None


class Project:
    def __init__(self, path, *, limits=None, wordlist=None, benchmark=None):
        self.path=Path(path).absolute()
        if self.path.is_symlink() or not self.path.is_dir():
            raise ValueError('Project must be an existing real directory')
        self.path=self.path.resolve()
        stamp=self.path.stat()
        self.identity=(stamp.st_dev,stamp.st_ino)
        self.limits=limits or Limits()
        self.state=self.path/'.reader-state'
        for directory in (self.state,self.path/'ciphey',self.path/'password-crackers'):
            if directory.is_symlink():
                raise ValueError('Reserved reader directories cannot be symlinks')
            directory.mkdir(exist_ok=True,mode=0o700)
        self.lock=(self.state/'owner.lock').open('a')
        self.output_locks=[]
        try:
            fcntl.flock(self.lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            for directory in (self.path/'ciphey',self.path/'password-crackers'):
                output_lock=(directory/'.lock').open('a')
                self.output_locks.append(output_lock)
                fcntl.flock(output_lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BaseException:
            for output_lock in self.output_locks:
                output_lock.close()
            self.lock.close()
            raise
        self.objects=self.state/'objects'
        self.objects.mkdir(exist_ok=True,mode=0o700)
        # Exclusive owner locks are held. Only our abandoned staging files can
        # be removed; final content objects and user evidence are never deleted.
        for directory in (self.objects,self.path/'ciphey/artifacts'):
            if directory.is_dir() and not directory.is_symlink():
                for temporary in directory.glob('.reader-write-*.tmp'):
                    if not temporary.is_symlink():temporary.unlink()
        self.db=sqlite3.connect(self.state/'graph.sqlite')
        self.db.row_factory=sqlite3.Row
        self.db.executescript('''
          CREATE TABLE IF NOT EXISTS nodes(id TEXT PRIMARY KEY,size INTEGER,status TEXT,cipher_ref TEXT,hash_ref TEXT);
          CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY,path TEXT,sha256 TEXT,node TEXT,status TEXT,stamp TEXT,created TEXT);
          CREATE TABLE IF NOT EXISTS edges(parent TEXT,child TEXT,kind TEXT,location TEXT,UNIQUE(parent,child,kind,location));
          CREATE TABLE IF NOT EXISTS reach(source TEXT,node TEXT,depth INTEGER,PRIMARY KEY(source,node));
          CREATE TABLE IF NOT EXISTS target_nodes(target TEXT,node TEXT,PRIMARY KEY(target,node));
          CREATE TABLE IF NOT EXISTS forwarded(target TEXT,node TEXT,PRIMARY KEY(target,node));
          CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,kind TEXT,node TEXT,detail TEXT,UNIQUE(kind,node,detail));
          CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);
        ''')
        self.db.execute("UPDATE nodes SET status='queued' WHERE status='running'")
        self.db.commit()
        s=self.limits
        self.cipher=Scanner(self.objects,self.path/'ciphey',tool_path('base64dump.py'),tool_path('ciphey'),
            CipherSettings(max_file_bytes=s.max_file_bytes,max_candidate_bytes=min(s.max_file_bytes,16384),decode_seconds=s.decode_seconds,file_seconds=s.file_seconds,regex=s.regex))
        self.hashes=Pipeline(self.objects,self.path/'password-crackers',HashSettings(max_file_bytes=s.max_file_bytes,threads=s.threads,
            slice_seconds=s.slice_seconds,batch_size=s.batch_size),wordlist=wordlist,benchmark_file=benchmark)
        plan=json.loads((self.hashes.output/'plans'/self.hashes.plan_id/'manifest.json').read_text())
        if plan.get('default_seed_limit_applied'):
            self.event('default_wordlist_seed_limit',None,{'plan':self.hashes.plan_id,'used_seeds':plan['used_seeds'],'source_sha256':plan['source_sha256']})
        code=sha(b''.join(p.read_bytes() for p in sorted(Path(__file__).parent.glob('*.py'))))
        config=sha(json.dumps({'limits':asdict(s),'cipher':self.cipher.config_id,'hash':self.hashes.config,'code':code},sort_keys=True).encode())
        previous=self.db.execute("SELECT value FROM meta WHERE key='configuration'").fetchone()
        if previous and previous['value']!=config:
            self.db.execute("UPDATE nodes SET status='queued'")
            self.event('configuration_changed',None,{'old':previous['value'],'new':config})
        self.db.execute("INSERT OR REPLACE INTO meta VALUES ('configuration',?)",(config,))
        self.db.commit()
        self.config=config
        self.export()

    def event(self,kind,node,detail):
        self.db.execute('INSERT OR IGNORE INTO events(kind,node,detail) VALUES (?,?,?)',(kind,node or '',json.dumps(detail,sort_keys=True)))
        self.db.commit()

    def allowed(self,path):
        path=Path(os.path.abspath(path))
        if not path.is_relative_to(self.path) or path==self.path:
            return False
        rel=path.relative_to(self.path)
        # Project-root application state (for example Legion workspaces) is
        # outside the requested <project>/<tool>/... artifact layout.
        if len(rel.parts)<2:
            return False
        current=self.path
        for part in rel.parts:
            current=current/part
            if current.is_symlink():
                return False
        if rel.parts[0]=='.reader-state' or rel.as_posix() in ('reader-report.json','reader-report.html','reader-report.json.tmp','reader-report.html.tmp'):
            return False
        if rel.parts[0]=='ciphey':
            # Content only. Never feed diagnostics, source copies, JSON or indexes
            # back into readers merely because they reside in an output folder.
            return ((len(rel.parts)==3 and rel.parts[1]=='artifacts' and rel.suffix=='.bin') or
                    (len(rel.parts)==6 and rel.parts[1]=='versions' and rel.parts[4] in ('decoded','extracted') and rel.suffix in ('.bin','.txt')))
        if rel.parts[0]=='password-crackers':
            return len(rel.parts)==4 and rel.parts[1]=='jobs' and rel.name=='recovered.txt'
        return True

    def files(self):
        for parent,dirs,names in os.walk(self.path,followlinks=False):
            dirs[:]=sorted(d for d in dirs if d!='.reader-state' and not (Path(parent)/d).is_symlink())
            for name in sorted(names):
                path=Path(parent)/name
                if self.allowed(path):
                    yield path

    def snapshot(self,path):
        """Open each path component without following symlinks, then check stability."""
        path=Path(os.path.abspath(path))
        if not self.allowed(path):
            return None
        parts=path.relative_to(self.path).parts
        directory=os.open(self.path,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
        try:
            for part in parts[:-1]:
                child=os.open(part,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=directory)
                os.close(directory);directory=child
            fd=os.open(parts[-1],os.O_RDONLY|os.O_NONBLOCK|os.O_NOFOLLOW,dir_fd=directory)
        finally:
            os.close(directory)
        with os.fdopen(fd,'rb') as handle:
            before=os.fstat(handle.fileno())
            if not stat.S_ISREG(before.st_mode):
                return None
            stamp=lambda v:(v.st_dev,v.st_ino,v.st_size,v.st_mtime_ns,v.st_ctime_ns)
            oversize=before.st_size>self.limits.max_file_bytes
            data=None if oversize else handle.read(self.limits.max_file_bytes+1)
            after=os.fstat(handle.fileno())
        if stamp(before)!=stamp(after):
            raise BlockingIOError('Source changed during snapshot')
        if data is not None and len(data)>self.limits.max_file_bytes:
            data=None
        return data,json.dumps(stamp(before))

    def _store_node(self,data):
        identifier=sha(data)
        path=self.objects/(identifier+'.bin')
        if path.exists():
            if sha(path.read_bytes())!=identifier:
                raise ValueError('Immutable artifact changed: '+identifier)
        else:
            atomic_bytes(path,data,mode=0o400,exclusive=True)
        self.db.execute('INSERT OR IGNORE INTO nodes VALUES (?,?,\'queued\',NULL,NULL)',(identifier,len(data)))
        self.db.commit()
        return identifier

    def _attach(self,source,node,depth):
        pending=[(node,depth)]
        while pending:
            node,depth=pending.pop(0)
            old=self.db.execute('SELECT depth FROM reach WHERE source=? AND node=?',(source,node)).fetchone()
            if old and old['depth']<=depth:
                continue
            usage=self.db.execute('SELECT COUNT(*) AS n,COALESCE(SUM(size),0) AS bytes FROM reach JOIN nodes ON nodes.id=reach.node WHERE source=?',(source,)).fetchone()
            size=self.db.execute('SELECT size FROM nodes WHERE id=?',(node,)).fetchone()['size']
            if depth>self.limits.max_depth or (not old and (usage['n']>=self.limits.max_nodes or usage['bytes']+size>self.limits.max_expanded_bytes)):
                self.event('source_expansion_limit',node,{'source':source,'depth':depth})
                continue
            self.db.execute('INSERT OR REPLACE INTO reach VALUES (?,?,?)',(source,node,depth))
            # A previously depth/budget-limited artifact may later arrive as a
            # new shallower source. Reuse native scan evidence but revisit its
            # expansion rather than permanently inheriting the old limit.
            if self.db.execute("SELECT 1 FROM events WHERE kind='source_expansion_limit' AND node=?",(node,)).fetchone():
                self.db.execute("UPDATE nodes SET status='queued' WHERE id=? AND status IN ('done','partial')",(node,))
            self.db.commit()
            pending.extend((r['child'],depth+1) for r in self.db.execute('SELECT child FROM edges WHERE parent=?',(node,)))

    def ingest(self,path,*,export=True):
        snap=self.snapshot(path)
        if snap is None:
            return False
        data,stamp=snap
        relative=Path(path).relative_to(self.path).as_posix()
        digest=sha(data) if data is not None else None
        source=sha((relative+'\0'+(digest or stamp)).encode())
        if self.db.execute('SELECT 1 FROM sources WHERE id=?',(source,)).fetchone():
            # A crash may have committed the source before its reach edges.
            if data is not None:
                self._attach(source,digest,0)
            return False
        # Our own emitted files are aliases of existing graph nodes, not new roots.
        managed=relative.split('/')[0] in ('ciphey','password-crackers')
        if managed and digest and self.db.execute('SELECT 1 FROM nodes WHERE id=?',(digest,)).fetchone():
            return False
        node=self._store_node(data) if data is not None else None
        self.db.execute('INSERT INTO sources VALUES (?,?,?,?,?,?,?)',(source,relative,digest,node,'inventoried' if node else 'skipped_size',stamp,now()))
        self.db.commit()
        if node:
            self._attach(source,node,0)
        if export:self.export()
        return True

    def offer(self,parent,data,kind,location):
        if len(data)>self.limits.max_file_bytes:
            self.event('artifact_size_limit',parent,{'kind':kind,'size':len(data)})
            return None
        child=sha(data)
        if child==parent:
            self.event('cycle_suppressed',parent,{'kind':kind})
            return child
        roots=list(self.db.execute('SELECT source,depth FROM reach WHERE node=?',(parent,)))
        eligible=[]
        for root in roots:
            old=self.db.execute('SELECT 1 FROM reach WHERE source=? AND node=?',(root['source'],child)).fetchone()
            usage=self.db.execute('SELECT COUNT(*) AS n,COALESCE(SUM(size),0) AS bytes FROM reach JOIN nodes ON nodes.id=reach.node WHERE source=?',(root['source'],)).fetchone()
            if root['depth']+1<=self.limits.max_depth and (old or (usage['n']<self.limits.max_nodes and usage['bytes']+len(data)<=self.limits.max_expanded_bytes)):
                eligible.append(root)
        if not eligible:
            self.event('source_expansion_limit',parent,{'kind':kind,'child':child})
            return None
        self._store_node(data)
        self.db.execute('INSERT OR IGNORE INTO edges VALUES (?,?,?,?)',(parent,child,kind,json.dumps(location,sort_keys=True)))
        self.db.commit()
        for root in eligible:
            self._attach(root['source'],child,root['depth']+1)
        # A visible, stable content artifact in the Ciphey tool folder. Native
        # decoded and recovered files remain in the tools' own evidence trees.
        directory=self.path/'ciphey/artifacts';directory.mkdir(exist_ok=True)
        path=directory/(child+'.bin')
        if path.is_symlink():
            raise ValueError('Artifact path is a symlink')
        if not path.exists():
            atomic_bytes(path,data,mode=0o400,exclusive=True)
        elif sha(path.read_bytes())!=child:
            raise ValueError('Published artifact changed')
        return child

    def transform(self,node,data,password=None):
        partial=False
        for content,kind,location in layers(data,maximum=min(self.limits.max_file_bytes,self.limits.max_expanded_bytes),members=self.limits.max_members,password=password):
            if content is None:
                self.event(kind,node,location)
                partial=True
            else:
                if self.offer(node,content,kind,location) is None:
                    partial=True
        return partial

    def process_one(self):
        row=self.db.execute("SELECT * FROM nodes WHERE status='queued' ORDER BY rowid LIMIT 1").fetchone()
        if not row:
            return False
        node=row['id']
        self.db.execute("UPDATE nodes SET status='running' WHERE id=?",(node,));self.db.commit()
        try:
            path=self.objects/(node+'.bin')
            data=path.read_bytes()
            if sha(data)!=node:
                raise ValueError('Immutable artifact SHA-256 mismatch')
            partial=self.transform(node,data)
            # Hash detection precedes any language checker; opaque verifier bytes
            # and decoded hashes do not need Ciphey's plaintext acceptance.
            hashref=self.hashes.scan(path)
            if hashref is None and row['hash_ref']:
                hashref=self.path/row['hash_ref']
            elif hashref is None:
                prior=self.hashes.store.db.execute('SELECT report FROM scans WHERE source=? AND sha256=? AND config=?',(path.name,node,self.hashes.config)).fetchone()
                hashref=self.hashes.output/prior['report'] if prior else None
            if hashref:
                report=json.loads(hashref.read_text())
                if report['status']!='complete':
                    partial=True
                    self.event('hash_reader_incomplete',node,{'status':report['status'],'report':str(hashref.relative_to(self.path))})
                for candidate in report['candidates']:
                    self.db.execute('INSERT OR IGNORE INTO target_nodes VALUES (?,?)',(candidate['target_id'],node))
                self.db.execute('UPDATE nodes SET hash_ref=? WHERE id=?',(str(hashref.relative_to(self.path)),node))
            cipherref=self.cipher.scan(path)
            if cipherref is None and row['cipher_ref']:
                cipherref=self.path/row['cipher_ref']
            elif cipherref is None:
                previous=self.cipher.store.db.execute('SELECT report FROM scans WHERE path=? AND fingerprint=? AND config=? ORDER BY rowid DESC LIMIT 1',(path.name,node,self.cipher.config_id)).fetchone()
                cipherref=self.cipher.output/previous[0] if previous else None
            if cipherref:
                report=json.loads(cipherref.read_text())
                partial=partial or report['status']!='complete'
                for candidate in report['candidates']:
                    location={k:candidate[k] for k in ('offset','length','line','byte_column')}
                    self.offer(node,base64.b64decode(candidate['decoded_b64']),'base64dump:'+candidate['encoding'],location)
                for finding in report['findings']:
                    self.offer(node,finding['text'].encode(),'ciphey_checker_candidate',{'steps':finding['steps'],'location':finding['location'],'human_verified':False})
                self.db.execute('UPDATE nodes SET cipher_ref=? WHERE id=?',(str(cipherref.relative_to(self.path)),node))
            self.db.execute('UPDATE nodes SET status=? WHERE id=?',('partial' if partial else 'done',node));self.db.commit()
        except Exception as error:
            if isinstance(error,OSError) and error.errno in (errno.ENOSPC,errno.EROFS,errno.EIO,errno.EACCES):
                self.db.rollback()
                self.db.execute("UPDATE nodes SET status='queued' WHERE id=?",(node,));self.db.commit()
                raise
            self.event('node_error',node,{'type':type(error).__name__,'error':str(error)})
            self.db.execute("UPDATE nodes SET status='error' WHERE id=?",(node,));self.db.commit()
        self.export()
        return True

    def forward_recoveries(self):
        changed=False
        for row in list(self.db.execute('SELECT * FROM target_nodes')):
            target=self.hashes.store.target(row['target'])
            if target and target['status']=='resolved' and target['resolved_to']:
                self.db.execute('INSERT OR IGNORE INTO target_nodes VALUES (?,?)',(target['resolved_to'],row['node']))
                self.db.commit()
                continue
            if not target or target['status']!='recovered' or self.db.execute('SELECT 1 FROM forwarded WHERE target=? AND node=?',(row['target'],row['node'])).fetchone():
                continue
            password=bytes.fromhex(target['recovered_hex'])
            self.offer(row['node'],password,'recovered_password',{'target_id':target['id'],'verification':target['verification']})
            data=(self.objects/(row['node']+'.bin')).read_bytes()
            if data.startswith(b'PK\x03\x04'):
                self.transform(row['node'],data,password=password)
            self.db.execute('INSERT INTO forwarded VALUES (?,?)',(row['target'],row['node']));self.db.commit()
            changed=True
        if changed:
            self.export()
        return changed

    def step(self):
        # One artifact and one bounded cracking batch per turn prevent a deep
        # search from monopolizing all subsequently discovered files.
        progress=self.process_one()
        try:
            progress=self.hashes.work_one() or progress
            progress=self.forward_recoveries() or progress
        except Exception as error:
            self.event('worker_error',None,{'type':type(error).__name__,'error':str(error)})
            self.hashes.store.db.execute("UPDATE targets SET status='error' WHERE status LIKE 'running_%'")
            self.hashes.store.db.commit()
            self.hashes.store.export()
        if progress:
            self.export()
        return progress

    def has_work(self):
        if self.db.execute("SELECT 1 FROM nodes WHERE status='queued' LIMIT 1").fetchone():return True
        if self.hashes.store.db.execute("SELECT 1 FROM targets WHERE status IN ('queued_quick','queued_deep') LIMIT 1").fetchone():return True
        if getattr(self.hashes,'_needs_exports',False):return True
        for row in self.hashes.store.db.execute("SELECT id FROM targets WHERE status='recovered'"):
            if self.db.execute('SELECT 1 FROM target_nodes WHERE target=? AND NOT EXISTS (SELECT 1 FROM forwarded WHERE target_nodes.target=forwarded.target AND target_nodes.node=forwarded.node)',(row['id'],)).fetchone():return True
        return False

    def export(self):
        nodes=[dict(r) for r in self.db.execute('SELECT * FROM nodes ORDER BY rowid')]
        sources=[dict(r) for r in self.db.execute('SELECT * FROM sources ORDER BY rowid')]
        try:
            origins=json.loads((self.path/'reader-origins.json').read_text())
        except (OSError,ValueError):
            origins={}
        if not isinstance(origins,dict):
            origins={}
        for source in sources:
            origin=origins.get(source['path'])
            if isinstance(origin,dict) and origin.get('sha256')==source['sha256']:
                source['origin']=origin
        edges=[dict(r) for r in self.db.execute('SELECT * FROM edges ORDER BY rowid')]
        reaches=[dict(r) for r in self.db.execute('SELECT * FROM reach')]
        events=[dict(r) for r in self.db.execute('SELECT * FROM events ORDER BY id')]
        targets=self.hashes.store.targets() if hasattr(self,'hashes') else []
        data={'schema_version':1,'project':self.path.name,'updated':now(),'configuration':getattr(self,'config',None),
              'limits':asdict(self.limits),'sources':sources,'nodes':nodes,'edges':edges,'provenance':reaches,
              'target_nodes':[dict(r) for r in self.db.execute('SELECT * FROM target_nodes')],
              'hash_states':dict(Counter(t['status'] for t in targets)),'node_states':dict(Counter(n['status'] for n in nodes)),
              'events':events,'host_ip':None,'scope':'local offline artifacts; checker acceptance is not a verified original plaintext'}
        atomic(self.path/'reader-report.json',json.dumps(data,indent=2,ensure_ascii=True)+'\n')
        esc=html.escape
        cards=[]
        source_paths={s['id']:s['path'] for s in sources}
        provenance_paths={}
        for reach in reaches:
            provenance_paths.setdefault(reach['node'],set()).add(source_paths[reach['source']])
        for node in nodes[-500:]:
            paths=sorted(provenance_paths.get(node['id'],set()))
            parents=[e for e in edges if e['child']==node['id']]
            refs=' '.join(f'<a href="{esc(node[k],quote=True)}">{label}</a>' for k,label in [('cipher_ref','Cipher evidence'),('hash_ref','Hash evidence')] if node[k])
            cards.append(f'<article><b>{esc(node["status"])}</b> · {node["size"]} bytes <code>{node["id"]}</code><p>{esc("; ".join(paths))}</p><p>{esc("; ".join(e["kind"] for e in parents) or "Original source")}</p>{refs}</article>')
        document=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Shared readers · {esc(self.path.name)}</title><style>body{{font:16px system-ui;max-width:1100px;margin:40px auto;padding:0 20px;background:#101621;color:#e7edf7}}article{{padding:16px;background:#192333;border:1px solid #33445d;margin:12px 0}}code{{display:block;overflow-wrap:anywhere}}a{{color:#8fc8ff}}</style><h1>{esc(self.path.name)} · Shared readers</h1><p>Originals, decoded artifacts and recovered candidates feed the same persistent queue. Refresh for updates. Checker acceptance requires review.</p><p>{len(sources)} source versions · {len(nodes)} unique artifacts · {len(events)} notices</p><p>{esc(json.dumps(data['hash_states']))}</p><p><a href="ciphey/index.html">Ciphey results</a> · <a href="password-crackers/index.html">Password recovery queue</a> · <a href="reader-report.json">Graph and full provenance</a></p>{''.join(cards)}<p>Latest 500 artifacts shown. Complete records are in JSON. Original-file changes create new historical source versions.</p></html>'''
        atomic(self.path/'reader-report.html',document)

    def close(self):
        self.hashes.stop.set()
        self.hashes.close()
        self.cipher.close()
        self.db.close()
        for output_lock in self.output_locks:
            output_lock.close()
        self.lock.close()
