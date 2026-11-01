"""One recursive Watchdog observer; all project/database work stays on its worker."""
import logging
import json
import os
from pathlib import Path
import threading
import time
from collections import deque
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from watchdog.observers.polling import PollingObserver
from .project import Project
from .catalog import ProjectCatalogs
from .worker_health import WorkerHealth

LOG=logging.getLogger('shared-readers')


def workspace_paused(path):
    """Optional component control. Fail closed on a malformed explicit control."""
    try:
        return json.loads((Path(path)/'reader-control.json').read_text()).get('running') is not True
    except FileNotFoundError:
        return False
    except (OSError,ValueError,AttributeError):
        return True


class Environment(FileSystemEventHandler):
    def __init__(self,root,*,project=None,limits=None,wordlist=None,benchmark=None,reconcile=30,polling=False,projects_catalogs=()):
        self.root=Path(root).absolute()
        if self.root.is_symlink():
            raise ValueError('Environment root cannot be a symlink')
        self.root.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.root=self.root.resolve()
        self.only=project
        if project and projects_catalogs:
            raise ValueError('Catalog enrollment cannot be combined with a single --project')
        self.catalogs=ProjectCatalogs(projects_catalogs)
        self.health=WorkerHealth()
        self.observer=None
        self.catalog_watches={}
        if project:
            if Path(project).name!=project or project in ('.','..') or project.startswith('.'):
                raise ValueError('Project must be one ordinary directory name')
            (self.root/project).mkdir(exist_ok=True)
        self.options=dict(limits=limits,wordlist=wordlist,benchmark=benchmark)
        self.projects={}
        self.blocked={}
        self.blocked_until={}
        self.stop=threading.Event()
        self.pending={}
        self.pending_lock=threading.Lock()
        self.overflow=False
        self.reconcile=reconcile
        self.polling=polling
        self.failures={}
        self._watching=False
        self._inventory=deque()
        self._rescan=False
        self._dirty=set()
        self._activity_cache={}

    def location(self,path):
        path=Path(os.path.abspath(path))
        # Prefer the most specific enrolled workspace; do not merge matching
        # display names in different custom save roots.
        matches=[folder for folder in self.catalogs.projects if path.is_relative_to(folder)]
        if matches:
            folder=max(matches,key=lambda p:len(p.parts))
            identifier=self.catalogs.projects[folder]
            key=folder.name if folder.parent==self.root else 'catalog:'+identifier
            return key,folder
        if not path.is_relative_to(self.root):
            return None
        parts=path.relative_to(self.root).parts
        if not parts or parts[0].startswith('.') or (self.only and parts[0]!=self.only):
            return None
        return parts[0],self.root/parts[0]

    def sync_health(self):
        self.health.set_targets({p.path:self.catalogs.projects.get(p.path) for p in self.projects.values()})

    def refresh_catalogs(self):
        self.catalogs.refresh()
        if self.observer is not None:
            needed={p for p in self.catalogs.projects if not p.is_relative_to(self.root)}
            for path in list(self.catalog_watches):
                if path not in needed:
                    self.observer.unschedule(self.catalog_watches.pop(path))
            for path in needed-self.catalog_watches.keys():
                try:self.catalog_watches[path]=self.observer.schedule(self,str(path),recursive=True)
                except OSError as error:self.catalogs.errors[str(path)]=str(error)
        self.retire_missing()
        self.sync_health()

    def activity(self,project,state,error=None):
        previous=self._activity_cache.get(project.path)
        stamp=time.time()
        if previous and previous[0]==state and stamp-previous[1]<5 and not error:return
        from hash_watch.store import atomic
        try:
            atomic(Path(project.path)/'.reader-state/activity-status.json',json.dumps(dict(pid=os.getpid(),activity=state,updated=stamp,error=error)))
            self._activity_cache[project.path]=(state,stamp)
        except (OSError,AttributeError):pass

    def failure(self,project,error):
        self.failures[project.path]=(time.monotonic()+2,str(error))
        for connection in (project.db,project.hashes.store.db):
            try:connection.rollback()
            except Exception:pass
        self.activity(project,'backpressure',str(error))
        LOG.error('Workspace backpressure %s: %s',project.path,error)

    def available(self,project):
        failure=self.failures.get(project.path)
        return not failure or time.monotonic()>=failure[0]

    def project_for(self,path):
        self.retire_missing()
        path=Path(os.path.abspath(path))
        location=self.location(path)
        if location is None:
            return None
        name,projectpath=location
        if projectpath.is_symlink() or not projectpath.is_dir():
            return None
        if name not in self.projects:
            if name in self.blocked:
                if time.monotonic()<self.blocked_until[name]:
                    return None
                del self.blocked[name]
            try:
                self.projects[name]=Project(projectpath,**self.options)
                self.sync_health()
            except Exception as error:
                # An invalid/locked project must not stop other projects.
                self.blocked[name]=str(error)
                self.blocked_until[name]=time.monotonic()+30
                LOG.exception('Project unavailable: %s',projectpath)
                return None
        return self.projects[name]

    def retire_missing(self):
        for name,project in list(self.projects.items()):
            try:
                stamp=project.path.stat(follow_symlinks=False)
                location=self.location(project.path)
                retained=location is not None and location[0]==name and location[1]==project.path and not project.path.is_symlink() and (stamp.st_dev,stamp.st_ino)==project.identity
            except OSError:
                retained=False
            if not retained:
                project.close()
                del self.projects[name]
        self.sync_health()

    def enqueue(self,path):
        path=Path(os.path.abspath(path))
        # Event thread never opens databases or expands directories.
        location=self.location(path)
        if location is None:
            return
        parts=path.relative_to(location[1]).parts
        if parts:
            if parts[0]=='.reader-state' or (len(parts)==1 and parts[0] in ('reader-report.html','reader-report.json','reader-report.html.tmp','reader-report.json.tmp','reader-control.json','reader-bridge.json')):
                return
            if parts[0]=='ciphey' and not any(p in ('decoded','extracted','artifacts') for p in parts[1:]):
                return
            if parts[0]=='password-crackers' and (len(parts)<3 or parts[-1]!='recovered.txt'):
                return
        with self.pending_lock:
            if len(self.pending)>=2048 and path not in self.pending:
                self.overflow=True
            else:
                self.pending[path]=time.monotonic()+0.5

    def on_created(self,event):
        self.enqueue(event.src_path)

    def on_modified(self,event):
        if not event.is_directory:
            self.enqueue(event.src_path)

    def on_moved(self,event):
        self.enqueue(event.dest_path)

    def ingest(self,path):
        project=self.project_for(path)
        if project is None:
            return
        if Path(path)==project.path/'reader-origins.json':
            self._dirty.add(project.path)
            if not self._watching:
                try:project.export();self._dirty.discard(project.path)
                except Exception as error:self.failure(project,error)
            return
        if workspace_paused(project.path):
            self.activity(project,'paused')
            return
        if not self.available(project):return
        try:
            if Path(path).is_dir():
                rel=Path(path).relative_to(project.path)
                if rel.parts and rel.parts[0] in ('.reader-state','ciphey','password-crackers'):
                    return
                if self._watching:
                    self._rescan=True
                    return
                for file in project.files():
                    if self.stop.is_set():
                        break
                    self.ingest(file)
            elif project.allowed(path):
                if project.ingest(path,export=not self._watching):
                    if self._watching:self._dirty.add(project.path)
                    LOG.info('Inventoried %s',path)
        except BlockingIOError:
            self.enqueue(path)
        except FileNotFoundError:
            pass
        except OSError as error:
            self.failure(project,error)
        except Exception as error:
            self.failure(project,error)

    def begin_inventory(self):
        self._rescan=False
        for path in sorted(set(self.root.iterdir())|set(self.catalogs.projects)):
            project=self.project_for(path)
            if project and not workspace_paused(project.path):
                self._inventory.append((project,iter(project.files())))

    def inventory_batch(self,maximum=32):
        # Round-robin source inventory; a large workspace cannot monopolize discovery.
        started=time.monotonic()
        for _ in range(maximum):
            if not self._inventory or self.stop.is_set() or time.monotonic()-started>.1:break
            project,files=self._inventory.popleft()
            if workspace_paused(project.path):
                self.activity(project,'paused');continue
            try:path=next(files)
            except (StopIteration,FileNotFoundError):continue
            self._inventory.append((project,files))
            self.ingest(path)

    def flush_inventory(self):
        for project in list(self.projects.values()):
            if project.path not in self._dirty or not self.available(project):continue
            try:project.export();self._dirty.discard(project.path)
            except Exception as error:self.failure(project,error)

    def inventory(self):
        self.refresh_catalogs()
        paths=set(self.root.iterdir())|set(self.catalogs.projects)
        for path in sorted(paths):
            if self.stop.is_set():
                break
            project=self.project_for(path)
            if project:
                for file in project.files():
                    if self.stop.is_set():
                        break
                    self.ingest(file)

    def step(self):
        self.retire_missing()
        progress=False
        for project in list(self.projects.values()):
            if self.stop.is_set():
                break
            if workspace_paused(project.path):
                self.activity(project,'paused')
                continue
            if not self.available(project):continue
            try:
                self.activity(project,'processing' if project.has_work() else 'idle')
                progress=project.step() or progress
                if project.path in self.failures:
                    # Retry a failed export even if native work already committed.
                    project.export();del self.failures[project.path]
                self.activity(project,'paused' if workspace_paused(project.path) else 'idle')
            except Exception as error:self.failure(project,error)
        return progress

    def once(self,max_steps=1000):
        self.inventory()
        for _ in range(max_steps):
            if self.stop.is_set() or not self.step():
                return True
        return False

    def watch(self,*,ready=None):
        self._watching=True
        observer=PollingObserver(timeout=0.5) if self.polling else Observer()
        self.observer=observer
        observer.schedule(self,str(self.root),recursive=True)
        self.refresh_catalogs()
        observer.start()
        self.health.start()
        try:
            self.begin_inventory()
            self.inventory_batch();self.flush_inventory()
            if ready:
                ready.set()
            last=time.monotonic();catalog_last=last
            while not self.stop.is_set():
                if time.monotonic()-catalog_last>=1:
                    previous=dict(self.catalogs.projects)
                    self.refresh_catalogs();catalog_last=time.monotonic()
                    if self.catalogs.projects!=previous:
                        self._rescan=True
                with self.pending_lock:
                    due=[p for p,t in self.pending.items() if t<=time.monotonic()][:32]
                    for path in due:
                        del self.pending[path]
                    overflow=self.overflow;self.overflow=False
                for path in due:
                    self.ingest(path)
                if overflow or time.monotonic()-last>=self.reconcile:self._rescan=True
                if not self._inventory and self._rescan:
                    self.begin_inventory();last=time.monotonic()
                self.inventory_batch();self.flush_inventory()
                self.step()
                self.stop.wait(0.1)
        finally:
            observer.stop();observer.join(timeout=5)
            self.health.close()
            self.observer=None;self.catalog_watches.clear()

    def close(self):
        self.health.close()
        for project in self.projects.values():
            project.close()
