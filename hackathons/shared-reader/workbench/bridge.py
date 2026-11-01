"""Read-only file providers and a durable, bounded SFTP-to-reader spool.

No FlagMap imports, remote commands, credential reuse, or remote writes.
"""
import base64
import contextlib
import hashlib
import json
import os
import shutil
from pathlib import Path, PurePosixPath
import posixpath
import stat
import threading
import time
import tempfile
import uuid
from urllib.parse import quote

import paramiko

MAX_BYTES = 2_000_000


def digest(data):
    return hashlib.sha256(data).hexdigest()


def atomic_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    atomic_bytes(path,(json.dumps(data, indent=2, ensure_ascii=True) + '\n').encode())


def atomic_bytes(path,data):
    fd,name=tempfile.mkstemp(prefix='.reader-spool-',suffix='.partial',dir=Path(path).parent)
    try:
        with os.fdopen(fd,'wb') as stream:
            stream.write(data);stream.flush();os.fsync(stream.fileno())
        os.replace(name,path)
        directory=os.open(Path(path).parent,os.O_RDONLY|os.O_DIRECTORY)
        try:os.fsync(directory)
        finally:os.close(directory)
    finally:
        Path(name).unlink(missing_ok=True)


def load(path, default):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        return default


class CoverageError(ValueError):
    pass


class Provider:
    def __init__(self, config):
        self.config = config
        self.root = config['root'].rstrip('/') or '/'

    def checked(self, path):
        if not isinstance(path, str) or '\x00' in path or not path.startswith('/'):
            raise ValueError('An absolute provider path is required')
        path = posixpath.normpath(path)
        if posixpath.commonpath([path, self.root]) != self.root:
            raise PermissionError('Path is outside this source')
        # Refuse symlink components, including the configured root.
        current = '/'
        for part in PurePosixPath(path).parts[1:]:
            current = posixpath.join(current, part)
            if stat.S_ISLNK(self.lstat(current).st_mode):
                raise PermissionError('Symlink traversal is disabled')
        return path

    def entries(self, path):
        path = self.checked(path)
        if not stat.S_ISDIR(self.lstat(path).st_mode):
            raise NotADirectoryError(path)
        result = []
        for name, a in self.listattrs(path):
            if name in ('.', '..') or '/' in name or '\x00' in name:
                continue
            mode = a.st_mode
            kind = ('directory' if stat.S_ISDIR(mode) else 'file' if stat.S_ISREG(mode)
                    else 'symlink' if stat.S_ISLNK(mode) else 'special')
            result.append(dict(name=name, path=posixpath.join(path, name), kind=kind,
                               size=a.st_size, mode=stat.filemode(mode), uid=a.st_uid,
                               gid=a.st_gid, mtime_ns=int(a.st_mtime * 1e9)))
            if len(result) > 2000:
                raise CoverageError('Directory exceeds 2000 entries; listing is incomplete')
        return result

    def read(self, path, *, preview=False):
        path = self.checked(path)
        before = self.lstat(path)
        if not stat.S_ISREG(before.st_mode):
            raise PermissionError('Only ordinary files can be read')
        limit = 4096 if preview else MAX_BYTES
        if not preview and before.st_size > limit:
            raise CoverageError('size-limited: file exceeds 2000000 bytes')
        with self.openfile(path) as stream:
            data = stream.read(limit + 1)
        after = self.lstat(path)
        if (before.st_size, before.st_mtime, before.st_mode) != (after.st_size, after.st_mtime, after.st_mode):
            raise CoverageError('changed-during-read: retry collection')
        truncated = len(data) > limit or before.st_size > limit
        if not preview and (truncated or len(data) != before.st_size):
            raise CoverageError('incomplete read: snapshot was not submitted')
        return data[:limit], before, truncated


class Local(Provider):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def lstat(self, path):
        return os.lstat(path)

    def listattrs(self, path):
        with os.scandir(path) as entries:
            for entry in entries:
                yield entry.name, entry.stat(follow_symlinks=False)

    def openfile(self, path):
        # O_NOFOLLOW protects the final local path component as well.
        return os.fdopen(os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK), 'rb')


class SFTP(Provider):
    def __enter__(self):
        self.client = paramiko.SSHClient()
        self.client.load_host_keys(self.config['known_hosts'])
        self.client.set_missing_host_key_policy(paramiko.RejectPolicy())
        try:
            self.client.connect(self.config['host'], port=self.config.get('port', 22),
                                username=self.config['username'], pkey=paramiko.PKey.from_path(self.config['key']),
                                look_for_keys=False, allow_agent=False, timeout=5,
                                banner_timeout=5, auth_timeout=5, channel_timeout=5)
            self.sftp = self.client.open_sftp()
            self.session_id = uuid.uuid4().hex
            self.sftp.get_channel().settimeout(5)
            self.checked(self.root)
            return self
        except BaseException:
            self.client.close()
            raise

    def __exit__(self, *args):
        self.client.close()

    def lstat(self, path):
        return self.sftp.lstat(path)

    def listattrs(self, path):
        for entry in self.sftp.listdir_iter(path, read_aheads=1):
            yield entry.filename, entry

    def openfile(self, path):
        return self.sftp.open(path, 'rb')


def provider(config):
    return (SFTP if config['transport'] == 'sftp' else Local)(config)


class Bridge:
    def __init__(self, config):
        self.config = config
        self.project = Path(config['project']).resolve()
        self.project.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.state_path = self.project / 'reader-bridge.json'
        self.origins_path = self.project / 'reader-origins.json'
        self.control_path = self.project / 'reader-control.json'
        if not self.control_path.exists():
            atomic_json(self.control_path, dict(running=False, pause_policy='finish-bounded-step'))
        self.lock = threading.RLock()
        self.state = load(self.state_path, dict(scopes={}, versions={}, dismissed=[]))
        self.state.setdefault('completed', {})
        self.origins = load(self.origins_path, {})
        self.sources = config['sources']
        self.stop = threading.Event()
        self.last_error = None
        self.active_scopes = set()
        self.in_poll = False
        self.completion_dirty=False
        self.journals=self.project/'.reader-state/bridge-origins'
        self.journals.mkdir(parents=True,exist_ok=True,mode=0o700)
        self._restore_publications()

    def _restore_publications(self):
        # The origin journal precedes publication. Reconcile a crash between
        # publication and committing the durable version index without inventing bytes.
        for path in self.journals.glob('*.json'):
            origin=load(path,{})
            if 'local_path' in origin:self.origins[origin['local_path']]=origin
        for relative,origin in self.origins.items():
            target=self.project/relative
            if target.is_file() and not target.is_symlink() and digest(target.read_bytes())==origin.get('sha256'):
                origin['coverage']='complete'
                self.state['versions'].setdefault(origin['snapshot_id'],origin)

    def save(self):
        atomic_json(self.state_path, self.state)
        atomic_json(self.origins_path, self.origins)

    def snapshot(self, source_id, path, remote=None):
        config = self.sources[source_id]
        if config['transport'] != 'sftp':
            raise ValueError('Only configured remote sources submit snapshots')
        if remote is None:
            with provider(config) as remote:
                return self.snapshot(source_id, path, remote)
        data, attrs, _ = remote.read(path)
        content = digest(data)
        path_id = digest(path.encode())
        relative = f'ssh-input/{source_id}/{path_id}/{content}.bin'
        target = self.project / relative
        snapshot_id = digest((source_id + '\0' + path + '\0' + content).encode())
        uri = f"sftp://{quote(config['username'], safe='')}@{config['host']}:{config.get('port', 22)}{quote(path, safe='/')}"
        with self.lock:
            existing=self.state['versions'].get(snapshot_id)
            if existing and target.is_file() and not target.is_symlink():
                if digest(target.read_bytes())!=content:raise ValueError('Existing immutable snapshot failed integrity check')
                return existing
            retained=sum(v.get('size',0) for v in self.state['versions'].values())
            if retained+len(data)>self.config.get('max_snapshot_bytes',512_000_000) or len(self.state['versions'])>=self.config.get('max_snapshot_versions',10000):
                raise CoverageError('storage-backpressure: retained snapshot quota reached; history preserved')
            if shutil.disk_usage(self.project).free < len(data)+self.config.get('min_free_bytes',16_000_000):
                raise CoverageError('storage-backpressure: insufficient free space; history preserved')
            origin = dict(snapshot_id=snapshot_id, sha256=content, size=len(data),
                          connection_id=source_id, session_id=remote.session_id if hasattr(remote, 'session_id') else source_id,
                          transport='sftp', path=path, source_uri=uri, collected=time.time(),
                          mtime=attrs.st_mtime, coverage='pending-publication', local_path=relative,
                          project_id=self.config.get('project_id'), host_id=config.get('host_id'))
            # Journal a pending origin first; never advertise absent bytes as complete.
            self.origins[relative]=origin
            journal=self.journals/(snapshot_id+'.json')
            atomic_json(journal,origin)
            target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            if target.exists():
                if digest(target.read_bytes()) != content:
                    raise ValueError('Existing immutable snapshot failed integrity check')
            else:
                # Root-level spool is outside the reader's tool-input layout.
                # Stage at project root, outside all tool-input folders.
                fd,name=tempfile.mkstemp(prefix='.reader-spool-',suffix='.partial',dir=self.project)
                try:
                    with os.fdopen(fd,'wb') as stream:
                        stream.write(data);stream.flush();os.fsync(stream.fileno())
                    os.replace(name,target)
                    directory=os.open(target.parent,os.O_RDONLY|os.O_DIRECTORY)
                    try:os.fsync(directory)
                    finally:os.close(directory)
                finally:Path(name).unlink(missing_ok=True)
            origin['coverage']='complete'
            atomic_json(journal,origin)
            self.state['versions'][snapshot_id] = origin
            if not self.in_poll:self.save()
            return origin

    def scope(self, source_id, path, running, recursive=True):
        config = self.sources[source_id]
        if config['transport'] != 'sftp':
            raise ValueError('This source is browse-only')
        with provider(config) as remote:
            path = remote.checked(path)
            if not stat.S_ISDIR(remote.lstat(path).st_mode):
                raise NotADirectoryError(path)
        key = digest((source_id + '\0' + path).encode())
        with self.lock:
            previous = self.state['scopes'].get(key, {})
            self.state['scopes'][key] = dict(previous, source=source_id, path=path,
                                            running=running, recursive=recursive)
            self.save()
        return key

    def poll(self, key):
        with self.lock:
            scope = dict(self.state['scopes'][key])
        if not scope['running'] or not load(self.control_path, {}).get('running'):
            return
        config = self.sources[scope['source']]
        errors, count, total = [], 0, 0
        seen = []
        complete = True
        started=time.monotonic()
        cursor=scope.get('cursor') or dict(dirs=[scope['path']],directory=None,offset=0)
        with self.lock:
            self.state['scopes'][key]['cursor']=cursor
            self.active_scopes.add(key)
            self.in_poll=True
        try:
            with provider(config) as remote:
                directories = 0
                while cursor['directory'] or cursor['dirs']:
                    with self.lock:
                        if not self.state['scopes'][key]['running'] or not load(self.control_path, {}).get('running') or self.stop.is_set():
                            complete = False
                            break
                    if count>=self.config.get('poll_files',512) or total>=32_000_000 or directories>=256 or time.monotonic()-started>=self.config.get('poll_seconds',2):
                        complete=False
                        break
                    if cursor['directory'] is None:
                        cursor['directory']=cursor['dirs'].pop(0);cursor['offset']=0
                    directory=cursor['directory'];directories+=1
                    try:
                        remote.checked(directory)
                        entries = remote.listattrs(directory)
                        finished=True
                        for number,(name,attrs) in enumerate(entries):
                            if number<cursor['offset']:continue
                            if count>=self.config.get('poll_files',512) or total>=32_000_000 or time.monotonic()-started>=self.config.get('poll_seconds',2):
                                finished=False;complete=False;break
                            with self.lock:
                                if not self.state['scopes'][key]['running'] or not load(self.control_path, {}).get('running') or self.stop.is_set():
                                    finished=False;complete=False;break
                            cursor['offset']=number+1
                            if name in ('.','..') or '/' in name or '\x00' in name:continue
                            path=posixpath.join(directory,name)
                            if stat.S_ISDIR(attrs.st_mode) and scope['recursive']:
                                if len(PurePosixPath(path).parts)-len(PurePosixPath(scope['path']).parts)>32 or len(cursor['dirs'])>=4096:
                                    errors.append(dict(path=path,coverage='directory-budget'));complete=False
                                else:cursor['dirs'].append(path)
                            elif stat.S_ISREG(attrs.st_mode):
                                count+=1
                                try:
                                    origin=self.snapshot(scope['source'],path,remote)
                                    total+=origin['size'];seen.append(origin['snapshot_id'])
                                except (OSError,ValueError) as error:
                                    errors.append(dict(path=path,error=str(error),coverage='not-collected'));complete=False
                            elif not stat.S_ISDIR(attrs.st_mode):
                                errors.append(dict(path=path,coverage='skipped-symlink' if stat.S_ISLNK(attrs.st_mode) else 'skipped-special'))
                        if not finished:break
                        cursor['directory']=None;cursor['offset']=0
                    except (OSError, ValueError) as error:
                        errors.append(dict(path=directory, error=str(error), coverage='unreadable'))
                        complete = False
                        cursor['directory']=None;cursor['offset']=0
                        continue
            connection = 'connected'
        except Exception as error:
            connection, complete = 'disconnected', False
            errors.append(dict(error=str(error), type=type(error).__name__))
        with self.lock:
            self.active_scopes.discard(key)
            self.in_poll=False
            finished_sweep=not cursor['directory'] and not cursor['dirs']
            notices=(scope.get('cycle_errors',[])+errors)[-256:]
            cycle_partial=scope.get('cycle_partial',False) or any('error' in e or e.get('coverage')=='directory-budget' for e in errors)
            if finished_sweep:
                cursor=dict(dirs=[scope['path']],directory=None,offset=0)
            live = self.state['scopes'][key]
            live.update(last_poll=time.time(), connection_state=connection, coverage='complete' if complete and not cycle_partial else 'partial',
                        errors=notices, seen=seen, files_checked=count,cursor=cursor,
                        cycle_errors=[] if finished_sweep else notices,cycle_partial=False if finished_sweep else cycle_partial,
                        coverage_model='sampled SFTP listing; transient files between polls are not observable')
            if finished_sweep:live['last_cycle_coverage']='partial' if cycle_partial else 'complete'
            # A failed/incomplete cycle never deletes earlier snapshots or labels them missing.
            self.save()

    def loop(self):
        while not self.stop.is_set():
            with self.lock:
                keys = list(self.state['scopes'])
            for key in keys:
                try:
                    self.poll(key)
                    self.last_error=None
                except Exception as error:
                    self.last_error=dict(type=type(error).__name__,error=str(error),time=time.time())
                    with self.lock:self.active_scopes.discard(key)
                    self.in_poll=False
            self.stop.wait(self.config.get('interval', 5))

    def status(self):
        with self.lock:
            state = json.loads(json.dumps(self.state))
            origins = dict(self.origins)
        report = load(self.project / 'reader-report.json', {})
        sources = {s['id']: s for s in report.get('sources', [])}
        derived_nodes = {edge['child'] for edge in report.get('edges', [])}
        node_sources = {}
        for reach in report.get('provenance', []):
            source = sources.get(reach['source'], {})
            origin = origins.get(source.get('path'))
            if origin and origin['sha256'] == source.get('sha256'):
                node_sources.setdefault(reach['node'], []).append(origin)
        alerts = []
        suppressed=0
        incoming={}
        for edge in report.get('edges',[]):incoming.setdefault(edge['child'],set()).add(edge['kind'])
        for node in report.get('nodes', []):
            if node['id'] not in derived_nodes or node['id'] not in node_sources:
                continue
            if node['status'] not in ('done', 'partial'):
                continue
            result_path = 'ciphey/artifacts/' + node['id'] + '.bin'
            if node['id'] in state['dismissed'] or not (self.project / result_path).is_file():
                continue
            kinds = sorted(incoming.get(node['id'],set()))
            if kinds and all(kind.startswith('hypothesis:') for kind in kinds):
                suppressed+=1
                continue
            with self.lock:
                if node['id'] not in self.state['completed']:
                    self.state['completed'][node['id']] = time.time()
                    self.completion_dirty=True
                completed = self.state['completed'][node['id']]
            alerts.append(dict(id=node['id'], result_path=result_path, size=node['size'],
                               completed=completed, transformations=kinds,
                               origins=node_sources[node['id']][:8], origins_total=len(node_sources[node['id']]),
                               origins_truncated=len(node_sources[node['id']])>8,state=node['status'],
                               label='Derived artifact · review required'))
        alerts.sort(key=lambda item:item['completed'], reverse=True)
        if self.completion_dirty:
            with self.lock:
                try:self.save();self.completion_dirty=False
                except OSError as error:self.last_error=dict(type=type(error).__name__,error=str(error),time=time.time())
        control=load(self.control_path,{})
        running=control.get('running') is True
        try:
            runtime=load(self.project/'.reader-state/activity-status.json',{})
            alive=time.time()-runtime.get('updated',0)<15
            if alive:os.kill(runtime['pid'],0)
        except (OSError,ValueError,KeyError,TypeError):runtime={};alive=False
        observed='unsupported'
        if alive:
            if running:observed='running'
            else:observed='paused' if runtime.get('activity')=='paused' and not self.active_scopes else 'pausing'
        return dict(scopes=state['scopes'], snapshots=len(state['versions']), alerts=alerts[:100],
                    running=running,
                    observed_state=observed, worker_observation='heartbeat' if alive else 'unsupported',
                    worker_updated=runtime.get('updated'),worker_activity=runtime.get('activity'),worker_error=runtime.get('error'),
                    requested_state='running' if running else 'paused',
                    project_id=self.config.get('project_id'),
                    collection_error=self.last_error,suppressed_hypothesis_alerts=suppressed,
                    node_states=report.get('node_states', {}), hash_states=report.get('hash_states', {}),
                    reader_updated=report.get('updated'), project=str(self.project),
                    pause_semantics='Stops background collection and both readers in this workspace after the current bounded step. Interactive browsing stays available.')
